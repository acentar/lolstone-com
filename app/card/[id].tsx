import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable, Share, Image } from 'react-native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  SlideInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { supabase } from '../../src/lib/supabase';
import {
  CardDesign, CardKeyword, CardEffect,
  KEYWORD_INFO, TRIGGER_INFO, ACTION_INFO, TARGET_INFO,
} from '../../src/types/database';
import CardPreview from '../../src/components/CardPreview';
import TokenPreview from '../../src/components/TokenPreview';
import HeaderNavigation from '../../src/components/HeaderNavigation';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/constants/theme';

const RARITY_COLORS: Record<string, string> = {
  common: '#71717a',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const RARITY_GRADIENTS: Record<string, string[]> = {
  common: ['#0f172a', '#1e293b', '#334155'],
  uncommon: ['#022c22', '#064e3b', '#059669'],
  rare: ['#0c1a3d', '#1e3a8a', '#2563eb'],
  epic: ['#3b0764', '#581c87', '#7c3aed'],
  legendary: ['#451a03', '#78350f', '#b45309'],
};

interface OwnershipInfo {
  playerId: string;
  playerName: string;
  count: number;
}

export default function PublicCardPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { player } = useAuthContext();

  // Fake stats for top navigation
  const [onlinePlayers, setOnlinePlayers] = useState(24);
  const [activeGames, setActiveGames] = useState(6);

  const [loading, setLoading] = useState(true);
  const [cardDesign, setCardDesign] = useState<CardDesign | null>(null);
  const [keywords, setKeywords] = useState<CardKeyword[]>([]);
  const [effects, setEffects] = useState<CardEffect[]>([]);
  const [ownership, setOwnership] = useState<OwnershipInfo[]>([]);
  const [supplyInfo, setSupplyInfo] = useState<{ minted: number; supply: number | null; inCirculation: number }>({
    minted: 0,
    supply: null,
    inCirculation: 0,
  });

  // Animation values
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.2);
  const particleRotation = useSharedValue(0);
  const particleScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 })
      ),
      -1,
      true
    );

    particleRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    particleScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const particleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${particleRotation.value}deg` },
      { scale: particleScale.value },
    ],
    opacity: glowOpacity.value * 0.8,
  }));

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

  // Update meta tags when card loads
  useEffect(() => {
    if (typeof document !== 'undefined' && cardDesign) {
      const metaTitle = cardDesign.name || 'Card - Lolstone';
      const metaDescription = cardDesign.inspiration || `View ${cardDesign.name} card details in Lolstone`;
      // Use card image as OG image, or generate one via API endpoint
      const ogImageUrl = cardDesign.image_url 
        ? cardDesign.image_url
        : (typeof window !== 'undefined' 
          ? `${window.location.origin}/api/card-og-image/${id}`
          : `https://lolstone.com/api/card-og-image/${id}`);
      const cardUrl = typeof window !== 'undefined'
        ? window.location.href
        : `https://lolstone.com/card/${id}`;

      // Set document title
      document.title = metaTitle;

      // Update or create meta description
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.setAttribute('name', 'description');
        document.head.appendChild(metaDescriptionTag);
      }
      metaDescriptionTag.setAttribute('content', metaDescription);

      // Open Graph tags
      const updateOrCreateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateOrCreateMeta('og:title', metaTitle);
      updateOrCreateMeta('og:description', metaDescription);
      updateOrCreateMeta('og:image', ogImageUrl);
      updateOrCreateMeta('og:url', cardUrl);
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('og:image:width', '1200');
      updateOrCreateMeta('og:image:height', '630');
      updateOrCreateMeta('og:site_name', 'Lolstone');

      // Twitter Card tags
      const updateOrCreateTwitterMeta = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="twitter:${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', `twitter:${name}`);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateOrCreateTwitterMeta('title', metaTitle);
      updateOrCreateTwitterMeta('description', metaDescription);
      updateOrCreateTwitterMeta('image', ogImageUrl);
      updateOrCreateTwitterMeta('card', 'summary_large_image');
    }
  }, [cardDesign, id]);

  useEffect(() => {
    if (!id) return;

    const loadCard = async () => {
      setLoading(true);
      try {
        // Load card design
        const { data: card, error: cardError } = await supabase
          .from('card_designs')
          .select('*')
          .eq('id', id)
          .single();

        if (cardError || !card) {
          console.error('Card not found:', cardError);
          return;
        }

        setCardDesign(card);

        // Load keywords
        const { data: keywordsData } = await supabase
          .from('card_keywords')
          .select('keyword')
          .eq('card_design_id', id);

        if (keywordsData) {
          setKeywords(keywordsData.map(k => k.keyword as CardKeyword));
        }

        // Load effects
        const { data: effectsData } = await supabase
          .from('card_effects')
          .select('*')
          .eq('card_design_id', id)
          .order('priority');

        if (effectsData) {
          setEffects(effectsData);
        }

        // Load ownership distribution
        const { data: instances } = await supabase
          .from('card_instances')
          .select('owner_id')
          .eq('design_id', id)
          .not('owner_id', 'is', null);

        if (instances) {
          const ownerCounts: Record<string, number> = {};
          instances.forEach(instance => {
            if (instance.owner_id) {
              ownerCounts[instance.owner_id] = (ownerCounts[instance.owner_id] || 0) + 1;
            }
          });

          const ownerIds = Object.keys(ownerCounts).slice(0, 10);
          if (ownerIds.length > 0) {
            const { data: players } = await supabase
              .from('players')
              .select('id, name')
              .in('id', ownerIds);

            if (players) {
              const ownershipList: OwnershipInfo[] = players.map(p => ({
                playerId: p.id,
                playerName: p.name,
                count: ownerCounts[p.id],
              })).sort((a, b) => b.count - a.count);

              setOwnership(ownershipList);
            }
          }
        }

        // Load supply info
        const { data: allInstances } = await supabase
          .from('card_instances')
          .select('id, owner_id')
          .eq('design_id', id);

        if (allInstances) {
          const inCirculation = allInstances.filter(i => i.owner_id !== null).length;
          setSupplyInfo({
            minted: card.total_minted || 0,
            supply: card.max_supply,
            inCirculation,
          });
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [id]);

  const handleShare = async () => {
    if (!cardDesign) return;
    const url = `https://lolstone.com/card/${id}`;
    try {
      await Share.share({
        message: `Check out ${cardDesign.name} in Lolstone! ${url}`,
        url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading card...</Text>
      </View>
    );
  }

  if (!cardDesign) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Card Not Found</Text>
        <Text style={styles.errorText}>This card doesn't exist or has been removed.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const rarityColor = RARITY_COLORS[cardDesign.rarity] || '#71717a';
  const rarityGradient = RARITY_GRADIENTS[cardDesign.rarity] || RARITY_GRADIENTS.common;

  const handlePlayerPortal = () => {
    router.push('/auth/player');
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
        <LinearGradient
          colors={rarityGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={[styles.heroContent, styles.contentWrapper]}>
            <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
              {/* Animated Glow Background with Fade Out */}
              <Animated.View style={[styles.glowLayer, glowAnimatedStyle]}>
                <View style={styles.glowRadialContainer}>
                  <LinearGradient
                    colors={[rarityColor + 'CC', rarityColor + '66', rarityColor + '33', 'transparent']}
                    style={styles.glowRadialGradient}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                  />
                </View>
              </Animated.View>
              
              {/* Additional animated particles/glow effects */}
              <Animated.View style={[styles.glowParticles, particleAnimatedStyle]}>
                <View style={[styles.particle, { backgroundColor: rarityColor + '30' }]} />
                <View style={[styles.particle, styles.particle2, { backgroundColor: rarityColor + '20' }]} />
                <View style={[styles.particle, styles.particle3, { backgroundColor: rarityColor + '15' }]} />
              </Animated.View>
              
              <View style={styles.cardImageContainer}>
                <CardPreview
                  name={cardDesign.name}
                  manaCost={cardDesign.mana_cost}
                  attack={cardDesign.attack ?? undefined}
                  health={cardDesign.health ?? undefined}
                  rarity={cardDesign.rarity}
                  category={cardDesign.category}
                  abilityText={cardDesign.ability_text ?? undefined}
                  flavorText={cardDesign.flavor_text ?? undefined}
                  keywords={keywords}
                  imageUrl={cardDesign.image_url ?? undefined}
                  cardType={cardDesign.card_type}
                  scale={isDesktop ? 1.4 : 1.1}
                  showCollectibleInfo={false}
                />
              </View>
            </Animated.View>

            <View style={styles.heroInfo}>
              <Text style={styles.cardName}>{cardDesign.name}</Text>
              <View style={styles.heroTags}>
                <View style={[styles.rarityTag, { backgroundColor: rarityColor }]}>
                  <Text style={styles.rarityText}>
                    {cardDesign.rarity.charAt(0).toUpperCase() + cardDesign.rarity.slice(1)}
                  </Text>
                </View>
                <View style={styles.typeTag}>
                  <Text style={styles.typeText}>
                    {cardDesign.card_type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={[styles.content, styles.contentWrapper]}>
          {/* Stats Grid */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Card Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{cardDesign.mana_cost}</Text>
                <Text style={styles.statCardLabel}>Mana Cost</Text>
              </View>
              {cardDesign.category === 'unit' && (
                <>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#ef4444' }]}>
                      {cardDesign.attack ?? 0}
                    </Text>
                    <Text style={styles.statCardLabel}>Attack</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#22c55e' }]}>
                      {cardDesign.health ?? 0}
                    </Text>
                    <Text style={styles.statCardLabel}>Health</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* Keywords Section */}
          {keywords.length > 0 && (
            <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Keywords</Text>
              <View style={styles.keywordsContainer}>
                {keywords.map((kw) => (
                  <View key={kw} style={styles.keywordCard}>
                    <View style={styles.keywordHeader}>
                      <Text style={styles.keywordName}>{KEYWORD_INFO[kw].name}</Text>
                    </View>
                    <Text style={styles.keywordDescription}>{KEYWORD_INFO[kw].description}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Effects Section */}
          {effects.length > 0 && (
            <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Card Effects</Text>
              <View style={styles.effectsContainer}>
                {effects.map((effect, index) => (
                  <Animated.View
                    key={index}
                    entering={SlideInUp.delay(index * 100)}
                    style={styles.effectCard}
                  >
                    <View style={styles.effectHeader}>
                      <Text style={styles.effectTrigger}>
                        {TRIGGER_INFO[effect.trigger]?.name}
                      </Text>
                    </View>
                    <Text style={styles.effectDetail}>
                      {ACTION_INFO[effect.action]?.name} ({effect.value}) → {TARGET_INFO[effect.target]?.name}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Token Section */}
          {cardDesign.has_token && cardDesign.token_name && (
            <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
              <Text style={styles.sectionTitle}>Token Card</Text>
              <View style={styles.tokenContainer}>
                <TokenPreview
                  name={cardDesign.token_name}
                  attack={cardDesign.token_attack}
                  health={cardDesign.token_health}
                  imageUrl={cardDesign.token_image_url ?? undefined}
                  scale={isDesktop ? 1.0 : 0.8}
                />
                <Text style={styles.tokenInfo}>
                  {(cardDesign.token_trigger === 'on_play' || cardDesign.token_trigger === 'on_destroy')
                    ? `Summons ${cardDesign.token_count} on ${(cardDesign.token_trigger as string).replace('_', ' ')}`
                    : `Summons on ${(cardDesign.token_trigger as string).replace('_', ' ')} (max ${cardDesign.token_max_summons}×)`
                  }
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Supply & Distribution */}
          <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Supply & Distribution</Text>
            <View style={styles.supplyGrid}>
              <View style={styles.supplyCard}>
                <Text style={styles.supplyValue}>{supplyInfo.minted}</Text>
                <Text style={styles.supplyLabel}>Total Minted</Text>
              </View>
              <View style={styles.supplyCard}>
                <Text style={styles.supplyValue}>
                  {supplyInfo.supply !== null ? supplyInfo.supply : '∞'}
                </Text>
                <Text style={styles.supplyLabel}>Max Supply</Text>
              </View>
              <View style={styles.supplyCard}>
                <Text style={styles.supplyValue}>{supplyInfo.inCirculation}</Text>
                <Text style={styles.supplyLabel}>In Circulation</Text>
              </View>
              <View style={styles.supplyCard}>
                <Text style={styles.supplyValue}>
                  {supplyInfo.supply !== null
                    ? supplyInfo.supply - supplyInfo.minted
                    : '∞'}
                </Text>
                <Text style={styles.supplyLabel}>Available to Mint</Text>
              </View>
            </View>
          </Animated.View>

          {/* Top Owners */}
          {ownership.length > 0 && (
            <Animated.View entering={FadeIn.delay(700)} style={styles.section}>
              <Text style={styles.sectionTitle}>Top Collectors</Text>
              <View style={styles.ownershipContainer}>
                {ownership.slice(0, 10).map((owner, index) => (
                  <View key={owner.playerId} style={styles.ownershipRow}>
                    <Text style={styles.ownershipRank}>#{index + 1}</Text>
                    <Text style={styles.ownershipName}>{owner.playerName}</Text>
                    <Text style={styles.ownershipCount}>{owner.count}x</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Inspiration */}
          {cardDesign.inspiration && (
            <Animated.View entering={FadeIn.delay(800)} style={styles.section}>
              <Text style={styles.sectionTitle}>Inspiration</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{cardDesign.inspiration}</Text>
              </View>
            </Animated.View>
          )}

          {/* Balance Notes */}
          {cardDesign.balance_notes && (
            <Animated.View entering={FadeIn.delay(900)} style={styles.section}>
              <Text style={styles.sectionTitle}>Balance Notes</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{cardDesign.balance_notes}</Text>
              </View>
            </Animated.View>
          )}

          {/* Flavor Text */}
          {cardDesign.flavor_text && (
            <Animated.View entering={FadeIn.delay(1000)} style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor Text</Text>
              <View style={styles.flavorContainer}>
                <Text style={styles.flavorText}>"{cardDesign.flavor_text}"</Text>
              </View>
            </Animated.View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Share this card: <Text style={styles.footerLink}>lolstone.com/card/{id}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
  heroSection: {
    paddingTop: 150,
    paddingBottom: 60,
    paddingHorizontal: spacing.lg,
    minHeight: 500,
  },
  heroContent: {
    alignItems: 'center',
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 32,
    overflow: 'visible',
  },
  glowLayer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 800,
    height: 800,
    marginTop: -400,
    marginLeft: -400,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  glowRadialContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 400,
    overflow: 'hidden',
  },
  glowRadialGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 400,
  },
  glowParticles: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 1000,
    height: 1000,
    marginTop: -500,
    marginLeft: -500,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.4,
  },
  particle2: {
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -75,
    left: -75,
  },
  particle3: {
    width: 600,
    height: 600,
    borderRadius: 300,
    top: -150,
    left: -150,
  },
  cardImageContainer: {
    position: 'relative',
    zIndex: 1,
  },
  heroInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -0.5,
  },
  heroTags: {
    flexDirection: 'row',
    gap: 12,
  },
  rarityTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  typeTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  content: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keywordsContainer: {
    gap: 12,
  },
  keywordCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keywordHeader: {
    marginBottom: 8,
  },
  keywordName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  keywordDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  effectsContainer: {
    gap: 12,
  },
  effectCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  effectHeader: {
    marginBottom: 8,
  },
  effectTrigger: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  effectDetail: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  tokenContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenInfo: {
    marginTop: 20,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  supplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  supplyCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  supplyValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  supplyLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ownershipContainer: {
    gap: 8,
  },
  ownershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ownershipRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    width: 48,
  },
  ownershipName: {
    flex: 1,
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  ownershipCount: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    textAlign: 'left',
  },
  flavorContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flavorText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#cbd5e1',
    lineHeight: 28,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    marginBottom: 48,
    padding: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerLink: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
