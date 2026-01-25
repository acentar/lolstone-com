import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Modal, Image, ActivityIndicator, RefreshControl, useWindowDimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Chip, IconButton, Avatar } from 'react-native-paper';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { colors, spacing, typography } from '../src/constants/theme';
import CardPreview from '../src/components/CardPreview';
import CardDetailModal from '../src/components/CardDetailModal';
import { CardDesign, CardDesignFull } from '../src/types/database';
import { supabase } from '../src/lib/supabase';
import { useAuthContext } from '../src/context/AuthContext';
import HeaderNavigation from '../src/components/HeaderNavigation';

// Use a default width for SSR, actual width will be used at runtime via useWindowDimensions
const { width: initialWidth = 1200, height } = Dimensions.get('window');
const width = initialWidth || 1200; // Fallback for static rendering

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { player } = useAuthContext();

  // Fake stats for top navigation
  const [onlinePlayers, setOnlinePlayers] = useState(24);
  const [activeGames, setActiveGames] = useState(6);

  // Recently minted cards state
  const [recentlyMintedCards, setRecentlyMintedCards] = useState<CardDesignFull[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  // Format number helper
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };


  // Logo animation values
  const funnyOAnimation = useSharedValue(0);

  // Animated styles for funny O
  const funnyOAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(funnyOAnimation.value, [0, 1], [1, 1.05]) },
      { rotate: `${interpolate(funnyOAnimation.value, [0, 1], [0, 5])}deg` },
    ],
  }));

  // Start logo animations
  useEffect(() => {
    funnyOAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Fetch recently minted cards (unique designs by most recent mint)
  const fetchRecentlyMintedCards = async () => {
    try {
      setLoadingCards(true);
      console.log('🔄 Fetching recently minted cards...');

      // Get all card designs that have been minted (total_minted > 0)
      const { data: designsData, error: designsError } = await supabase
        .from('card_designs')
        .select(`
          id,
          name,
          ability_text,
          flavor_text,
          balance_notes,
          inspiration,
          mana_cost,
          attack,
          health,
          rarity,
          card_type,
          category,
          image_url,
          total_minted,
          max_supply,
          created_at,
          updated_at,
          is_active,
          has_token,
          token_name,
          token_image_url,
          token_attack,
          token_health,
          token_trigger,
          token_count,
          token_max_summons,
          token_keywords
        `)
        .eq('is_active', true)
        .gt('total_minted', 0)
        .order('updated_at', { ascending: false })
        .limit(15);

      if (designsError) {
        console.error('❌ Error fetching minted card designs:', designsError);
        setRecentlyMintedCards([]);
        return;
      }

      console.log('📊 Found minted card designs:', designsData?.length || 0);

      if (!designsData || designsData.length === 0) {
        console.log('⚠️ No minted card designs found - create and mint some cards first!');
        setRecentlyMintedCards([]);
        return;
      }

      // Transform designs data
      const transformedCards: CardDesignFull[] = designsData.map(design => {
        console.log('🎨 Processing card:', design.name, 'Image URL:', design.image_url, 'Total Minted:', design.total_minted, 'Max Supply:', design.max_supply, 'Inspiration:', design.inspiration, 'Balance Notes:', design.balance_notes);
        return {
          ...design,
          base_attack: design.attack || 0,
          base_health: design.health || 0,
          keywords: [],
          effects: [],
        } as CardDesignFull;
      });

      console.log('✅ Transformed card designs:', transformedCards.map(c => c.name));
      setRecentlyMintedCards(transformedCards);

    } catch (error) {
      console.error('❌ Error in fetchRecentlyMintedCards:', error);
      setRecentlyMintedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  // Fetch recently minted cards on mount
  useEffect(() => {
    fetchRecentlyMintedCards();
  }, []);

  // Update live stats every 5 seconds with fake data
  useEffect(() => {
    const interval = setInterval(() => {
      // Random fluctuation between -2 and +2 players
      setOnlinePlayers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(9, Math.min(36, prev + change));
      });

      // Random fluctuation between -1 and +1 games
      setActiveGames(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
        return Math.max(3, Math.min(9, prev + change));
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handlePlayerPortal = () => {
    router.push('/auth/player');
  };

  const handleCardPress = (card: CardDesign) => {
    setSelectedCard(card);
    setCardModalVisible(true);
  };

  const closeCardModal = () => {
    setCardModalVisible(false);
    setSelectedCard(null);
  };


  return (
    <View style={styles.container}>
      {/* Top Header with Live Stats */}
      <View style={styles.topHeader}>
        <View style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <HeaderNavigation />
            
            <View style={styles.statsRow}>
              <View style={styles.statTag}>
                <Text style={styles.statTagText}>
                  <Text style={styles.statTagNumber}>{onlinePlayers.toLocaleString()}</Text>
                  <Text> Online</Text>
                </Text>
              </View>
              <View style={styles.statTag}>
                <Text style={styles.statTagText}>
                  <Text style={[styles.statTagNumber, { color: '#10b981' }]}>
                    {activeGames.toLocaleString()}
                  </Text>
                  <Text> Active Games</Text>
                </Text>
              </View>
            </View>

            {player ? (
              <Pressable style={styles.avatarButton} onPress={() => router.push('/player/profile')}>
                {player.avatar_url ? (
                  <Avatar.Image size={36} source={{ uri: player.avatar_url }} />
                ) : (
                  <Avatar.Text
                    size={36}
                    label={player.name?.charAt(0).toUpperCase() || '?'}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.playButton} onPress={handlePlayerPortal}>
                <Text style={styles.playButtonText}>Play Now</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Video Background */}
          <View style={styles.videoContainer}>
            {/* @ts-ignore - Web video element */}
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0,
              }}
            >
              <source
                src="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/43e8aed6562d417f83830aae18fb8188.mp4"
                type="video/mp4"
              />
            </video>
            {/* Dark Overlay */}
            <View style={styles.videoOverlay} />
          </View>
          <View style={styles.heroContent}>
            {/* Stacked Logo */}
            <View style={styles.stackedLogoContainer}>
              <View style={styles.logoTopContainer}>
                <Text style={styles.logoTop}>L</Text>
                <Animated.View style={[styles.funnyOContainer, funnyOAnimatedStyle]}>
                  <View style={styles.funnyO}>
                    <View style={styles.funnyOInner}>
                      <View style={styles.funnyOLeftEye} />
                      <View style={styles.funnyORightEye} />
                      <View style={styles.funnyOMouth} />
                    </View>
                  </View>
                </Animated.View>
                <Text style={styles.logoTop}>L</Text>
              </View>
              <Text style={styles.logoBottom}>STONE</Text>
            </View>
            <Text style={styles.tagline}>The Ultimate Digital Card Game</Text>
            <Text style={styles.description}>
              Collect powerful cards, build unstoppable decks, and battle players
              in chaotic, meme-filled matches. Where strategy meets absurdity.
            </Text>

            {/* CTA Button */}
            <View style={styles.ctaContainer}>
              <Pressable style={styles.primaryButton} onPress={handlePlayerPortal}>
                <Text style={styles.primaryButtonText}>Start Playing</Text>
              </Pressable>
            </View>
            
            {/* Beta Release Info */}
            <Text style={styles.betaReleaseText}>
              New beta release 23rd January
            </Text>
          </View>
        </View>

      {/* Available Cards Section */}
      <View style={styles.recentCardsSection}>
        <Text style={styles.sectionTitle}>Recently minted cards</Text>

        {loadingCards ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading recent cards...</Text>
          </View>
        ) : recentlyMintedCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Cards Available</Text>
            <Text style={styles.emptyText}>Cards will appear here once they're created and minted!</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScrollContainer}
              refreshControl={
                <RefreshControl
                  refreshing={loadingCards}
                  onRefresh={fetchRecentlyMintedCards}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              {recentlyMintedCards.map((card) => (
                <Pressable
                  key={card.id}
                  style={styles.cardWrapper}
                  onPress={() => handleCardPress(card)}
                >
                  <CardPreview
                    name={card.name}
                    manaCost={card.mana_cost}
                    attack={card.attack || 0}
                    health={card.health || 0}
                    rarity={card.rarity}
                    category={card.category}
                    abilityText={card.ability_text || ''}
                    flavorText={card.flavor_text || ''}
                    imageUrl={card.image_url}
                    scale={0.6}
                    showCollectibleInfo={false}
                  />
                  <View style={styles.cardMeta}>
                    <Text style={styles.mintedText}>{card.total_minted} minted</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>

      {/* News Section */}
      <View style={styles.newsSection}>
        <Text style={styles.sectionTitle}>News</Text>
        
        <View style={styles.newsGrid}>
          <Pressable 
            style={styles.newsCard}
            onPress={() => router.push('/news/how-the-game-works')}
          >
            <View style={styles.newsCardContent}>
              <Text style={styles.newsCardTitle}>How the Game Works</Text>
              <Text style={styles.newsCardDescription}>
                Learn the core mechanics, strategies, and gameplay of Lolstone. Master the art of meme-based card battles.
              </Text>
              <Text style={styles.newsCardLink}>Read more →</Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.newsCard}
            onPress={() => router.push('/news/lolstone-token')}
          >
            <View style={styles.newsCardContent}>
              <Text style={styles.newsCardTitle}>$lolstone Token</Text>
              <Text style={styles.newsCardDescription}>
                Discover the native cryptocurrency powering the Lolstone ecosystem. Learn about tokenomics, rewards, and earning opportunities.
              </Text>
              <Text style={styles.newsCardLink}>Read more →</Text>
            </View>
          </Pressable>
        </View>
      </View>




      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with chaos and memes
        </Text>
        <Text style={styles.footerSubtext}>
          LOLSTONE - Where strategy meets absurdity
        </Text>
        <Pressable 
          style={styles.twitterLink}
          onPress={() => Linking.openURL('https://x.com/lolstonedotcom')}
        >
          <Text style={styles.twitterLinkText}>Follow us on Twitter</Text>
        </Pressable>
        <Text style={styles.versionInfo}>
          Lolstone v1.1.3 • Last updated today
        </Text>
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Lolstone. All rights reserved.
        </Text>
      </View>

      {/* Card Detail Modal */}
      <CardDetailModal
        visible={cardModalVisible}
        onClose={closeCardModal}
        cardDesign={selectedCard}
        isGameMaster={false}
      />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  topHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  },
  headerBlur: {
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(20px)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: 'auto',
    marginRight: spacing.md,
  },
  statTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statTagText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statTagNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  playButtonText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarButton: {
    padding: 2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    minHeight: '100vh',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: 100,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  videoContainer: {
    position: 'absolute',
    top: 82,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 'calc(100vh - 82px)',
    zIndex: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },
  stackedLogoContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  logoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoTop: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#00f5d4',
    textShadowColor: 'rgba(0, 245, 212, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    zIndex: 1,
    lineHeight: 62,
  },
  funnyOContainer: {
    width: 60,
    height: 60,
    position: 'relative',
    marginHorizontal: 4,
  },
  funnyO: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  funnyOInner: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  funnyOLeftEye: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f5d4',
  },
  funnyORightEye: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f5d4',
  },
  funnyOMouth: {
    position: 'absolute',
    bottom: 9,
    width: 22,
    height: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
  },
  logoBottom: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    zIndex: 1,
    lineHeight: 38,
    marginTop: -15,
    transform: [{ rotate: '-5deg' }],
  },
  worksText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#10b981',
    marginBottom: 20,
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: '110%',
    height: '120%',
    borderRadius: 30,
    backgroundColor: '#00f5d4',
    opacity: 0.15,
    zIndex: 0,
  },
  title: {
    fontSize: Math.min(width * 0.12, 72),
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    zIndex: 1,
    position: 'relative',
  },
  titleGradient: {
    color: '#00f5d4',
    textShadowColor: 'rgba(0, 245, 212, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSolid: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: Math.min(width * 0.045, 24),
    color: '#ffffff',
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: Math.min(width * 0.032, 16),
    color: '#e2e8f0',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  betaReleaseText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // News Section
  newsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  newsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  newsCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  newsCardContent: {
    padding: spacing.xl,
  },
  newsCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  newsCardDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  newsCardLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(148, 163, 184, 0.3)',
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.25)',
    marginBottom: spacing.xs,
  },
  twitterLink: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  twitterLinkText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  versionInfo: {
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.25)',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  copyright: {
    fontSize: 9,
    color: 'rgba(148, 163, 184, 0.2)',
    marginTop: spacing.xs,
  },

  // Live Stats Section
  liveStatsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  statDivider: {
    width: 1,
    height: 80,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // Recently Minted Cards Section
  recentCardsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cardsScrollContainer: {
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardMeta: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintedText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Game Info Section
  gameInfoSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.background,
  },

  // Accordion Styles
  accordionContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  accordionContent: {
    padding: spacing.lg,
    paddingTop: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Game Description
  gameDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },

  // Rules and Board Layout
  gameRules: {
    marginTop: spacing.md,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  ruleItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: spacing.sm,
  },

  boardLayout: {
    marginTop: spacing.lg,
  },
  boardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  boardItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: spacing.sm,
  },

  // Collection Info
  collectionOptions: {
    marginTop: spacing.md,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  collectionItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: spacing.sm,
  },

  // Example Cards
  exampleCardsSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  exampleButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  exampleButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },

  // Benefits
  benefitsList: {
    marginTop: spacing.md,
  },
  benefitItem: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    lineHeight: 22,
  },

  // CTA Section
  ctaSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ctaText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  finalCtaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finalCtaButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    padding: spacing.lg,
  },

  // Example Card Styles
  exampleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cardRarity: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardStats: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardKeywords: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardEffect: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  cardFlavor: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Token Section Styles
  tokenSection: {
    marginVertical: spacing.xl,
  },
  tokenGradient: {
    borderRadius: 16,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  tokenContent: {
    padding: spacing.xl * 2,
  },
  tokenHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tokenMainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  tokenSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    opacity: 0.9,
  },
  tokenDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl * 2,
    maxWidth: 600,
    alignSelf: 'center',
  },

  // Token Features Grid
  tokenFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  tokenFeature: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    flex: 1,
    minWidth: 140,
    maxWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Tokenomics Section
  tokenomicsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenomicsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tokenomicsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Token Stats
  tokenStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Allocation Table
  allocationTable: {
    marginBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  tableCell: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },

  // Security Features
  securityFeatures: {
    marginBottom: spacing.xl,
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  securityItem: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  securityIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Enhanced Live Stats Styles
  statsGradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardGradient: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  statIconContainer: {
    marginBottom: spacing.sm,
  },
  statSubLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statsUpdateNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

});
