import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Modal, Image, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { colors, spacing, typography } from '../src/constants/theme';
import CardPreview from '../src/components/CardPreview';
import CardDetailModal from '../src/components/CardDetailModal';
import { CardDesign, CardDesignFull } from '../src/types/database';
import { supabase } from '../src/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  // Live stats state
  const [onlinePlayers, setOnlinePlayers] = useState(1247);
  const [activeGames, setActiveGames] = useState(89);

  // Recently minted cards state
  const [recentlyMintedCards, setRecentlyMintedCards] = useState<CardDesignFull[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  // Game info modals and accordions
  const [exampleCardsModal, setExampleCardsModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    howItWorks: false,
    cardsCollecting: false,
    whyPlay: false,
  });

  // Animation refs for pulse dots
  const playersPulseAnim = useRef(new Animated.Value(1)).current;
  const gamesPulseAnim = useRef(new Animated.Value(1)).current;

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

  // Start pulse animations
  useEffect(() => {
    const startPulseAnimation = (anim: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulseAnimation(playersPulseAnim);
    startPulseAnimation(gamesPulseAnim);
  }, []);

  // Fetch recently minted cards on mount
  useEffect(() => {
    fetchRecentlyMintedCards();
  }, []);

  // Update live stats every 5 seconds with fake data
  useEffect(() => {
    const interval = setInterval(() => {
      // Random fluctuation between -5 and +5 players
      setOnlinePlayers(prev => {
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(1000, Math.min(2000, prev + change));
      });

      // Random fluctuation between -2 and +2 games
      setActiveGames(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(50, Math.min(150, prev + change));
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.heroSection}
      >
        {/* Background Elements */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />
        <View style={styles.gridOverlay} />

        <View style={styles.heroContent}>
          <Text style={styles.emoji}>🃏</Text>
          <Text style={styles.title}>LOLSTONE</Text>
          <Text style={styles.tagline}>The Ultimate Digital Card Game</Text>
          <Text style={styles.description}>
            Collect powerful cards, build unstoppable decks, and battle players
            in chaotic, meme-filled matches. Where strategy meets absurdity.
          </Text>

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <Pressable style={styles.primaryButton} onPress={handlePlayerPortal}>
              <Text style={styles.primaryButtonText}>🎮 Play Now</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Live Stats Section */}
      <View style={styles.liveStatsSection}>
        <Text style={styles.sectionTitle}>🌐 Live Stats</Text>
        <Text style={styles.statsSubtitle}>Real-time player activity across the globe</Text>

        <LinearGradient
          colors={[colors.surface, colors.background]}
          style={styles.statsGradientContainer}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={[colors.primary + '15', colors.primary + '05']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>👥</Text>
                </View>
                <Text style={styles.statValue}>{onlinePlayers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Players Online</Text>
                <Text style={styles.statSubLabel}>Active right now</Text>
                <Animated.View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: colors.primary, transform: [{ scale: playersPulseAnim }] }
                  ]}
                />
              </LinearGradient>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <LinearGradient
                colors={[colors.secondary + '15', colors.secondary + '05']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>⚔️</Text>
                </View>
                <Text style={styles.statValue}>{activeGames.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Active Games</Text>
                <Text style={styles.statSubLabel}>Battles raging</Text>
                <Animated.View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: colors.secondary, transform: [{ scale: gamesPulseAnim }] }
                  ]}
                />
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.statsUpdateNote}>📊 Stats update every few seconds</Text>
      </View>

      {/* Recently Minted Cards Section */}
      <View style={styles.recentCardsSection}>
        <Text style={styles.sectionTitle}>🔥 Available Cards</Text>
        <Text style={styles.sectionSubtitle}>Cards that have been minted • Pull to refresh</Text>

        {loadingCards ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading recent cards...</Text>
          </View>
        ) : recentlyMintedCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎨</Text>
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

      {/* Game Information Sections */}
      <View style={styles.gameInfoSection}>
        <Text style={styles.sectionTitle}>🎮 How to Play Lolstone</Text>

        {/* How It Works Accordion */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={() => toggleSection('howItWorks')}>
            <Text style={styles.accordionTitle}>🎯 How the Game Works</Text>
            <IconButton
              icon={expandedSections.howItWorks ? "chevron-up" : "chevron-down"}
              size={24}
              iconColor={colors.primary}
            />
          </Pressable>
          {expandedSections.howItWorks && (
            <View style={styles.accordionContent}>
              <Text style={styles.gameDescription}>
                Lolstone is the ultimate turn-based card game built entirely around internet culture. Think strategic duels like classic card battlers, but instead of wizards and dragons, your deck is packed with memes, viral roasts, trolls, reactions, and chaotic online moments that everyone recognises.
              </Text>
              <Text style={styles.gameDescription}>
                You and an opponent face off on the board. Each player starts with 30 health. Your goal is simple: reduce your opponent's health to zero before they do the same to you. Matches are quick, intense, and full of laugh-out-loud swings.
              </Text>

              <View style={styles.gameRules}>
                <Text style={styles.ruleTitle}>🎲 Core Mechanics:</Text>
                <Text style={styles.ruleItem}>• Build a deck of exactly 30 cards from your collection</Text>
                <Text style={styles.ruleItem}>• Take turns playing units onto the board (up to 7 per side)</Text>
                <Text style={styles.ruleItem}>• Manage bandwidth crystals (your mana) that refill each turn, ramping from 1 to 10</Text>
                <Text style={styles.ruleItem}>• Attack with ready units—damage is simultaneous, so trades feel fair and brutal</Text>
                <Text style={styles.ruleItem}>• Win by outplaying your opponent with clever combos, timely roasts, and meme timing</Text>
              </View>

              <View style={styles.boardLayout}>
                <Text style={styles.boardTitle}>📋 Board Layout:</Text>
                <Text style={styles.boardItem}>• Your profile (avatar + health bar) on the bottom left</Text>
                <Text style={styles.boardItem}>• Your units across the centre bottom (up to 7)</Text>
                <Text style={styles.boardItem}>• Hand at the bottom, deck bottom-left, bandwidth top-right</Text>
                <Text style={styles.boardItem}>• Opponent mirrored at the top</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cards & Collecting Accordion */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={() => toggleSection('cardsCollecting')}>
            <Text style={styles.accordionTitle}>🃏 Cards & Collecting</Text>
            <IconButton
              icon={expandedSections.cardsCollecting ? "chevron-up" : "chevron-down"}
              size={24}
              iconColor={colors.primary}
            />
          </Pressable>
          {expandedSections.cardsCollecting && (
            <View style={styles.accordionContent}>
              <Text style={styles.gameDescription}>
                Every card is a unique digital collectible based on real internet memes. Each instance you own has its own serial number and edition (e.g., #42 of First Edition). Cards come in four rarities: common, rare, epic, and legendary.
              </Text>

              <Text style={styles.gameDescription}>
                Only we, the game masters, can create and mint new card designs and batches. This keeps the ecosystem controlled, balanced, and special—no flood of junk cards. When we mint a batch, those copies become permanent and enter the game forever. Some go into reward pools, some are sold, some are airdropped to active players.
              </Text>

              <View style={styles.collectionOptions}>
                <Text style={styles.collectionTitle}>🎁 How to Get Cards:</Text>
                <Text style={styles.collectionItem}>• Earn cards through play rewards and events</Text>
                <Text style={styles.collectionItem}>• Buy packs with ducats (in-game currency)</Text>
                <Text style={styles.collectionItem}>• Trade cards on the marketplace to earn real money</Text>
              </View>

              <View style={styles.exampleCardsSection}>
                <Pressable style={styles.exampleButton} onPress={() => setExampleCardsModal(true)}>
                  <Text style={styles.exampleButtonText}>View Example Cards</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Why Play Accordion */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={() => toggleSection('whyPlay')}>
            <Text style={styles.accordionTitle}>🚀 Why Play Lolstone</Text>
            <IconButton
              icon={expandedSections.whyPlay ? "chevron-up" : "chevron-down"}
              size={24}
              iconColor={colors.primary}
            />
          </Pressable>
          {expandedSections.whyPlay && (
            <View style={styles.accordionContent}>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>🎁 Free to start: Create an account, claim starter packs, and jump into matches</Text>
                <Text style={styles.benefitItem}>🏆 Own what you earn: Every card you acquire is truly yours—trade, sell, or hold</Text>
                <Text style={styles.benefitItem}>🔄 Constant fresh content: We regularly mint new meme-inspired cards and expansions</Text>
                <Text style={styles.benefitItem}>👥 Community-driven: Join duels, climb ranks, and chat with fellow meme lords</Text>
              </View>

              <View style={styles.ctaSection}>
                <Text style={styles.ctaText}>Ready to battle with the internet's greatest hits?</Text>
                <Text style={styles.ctaSubtext}>Sign up now, grab your starter deck, and start roasting opponents today.</Text>
                <Pressable style={styles.finalCtaButton} onPress={handlePlayerPortal}>
                  <Text style={styles.finalCtaButtonText}>🎮 Start Playing Now</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Example Cards Modal */}
      <Modal
        visible={exampleCardsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExampleCardsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💎 Example Cards</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setExampleCardsModal(false)}
              />
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.exampleCard}>
                <Text style={styles.cardName}>🐕 This is Fine Dog</Text>
                <Text style={styles.cardRarity}>Common Unit</Text>
                <Text style={styles.cardStats}>Cost: 4 • Attack: 1 • Health: 6</Text>
                <Text style={styles.cardKeywords}>Keywords: Frontline</Text>
                <Text style={styles.cardEffect}>Effect: On destroy – Heal your profile for 3 health.</Text>
                <Text style={styles.cardFlavor}>"Everything is under control."</Text>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.cardName}>👦 Distracted Boyfriend</Text>
                <Text style={styles.cardRarity}>Rare Unit</Text>
                <Text style={styles.cardStats}>Cost: 4 • Attack: 3 • Health: 4</Text>
                <Text style={styles.cardKeywords}>Keywords: Evasion</Text>
                <Text style={styles.cardEffect}>Effect: On play – Next enemy attack redirects to a random other enemy target.</Text>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.cardName}>😈 Trollface</Text>
                <Text style={styles.cardRarity}>Epic Unit</Text>
                <Text style={styles.cardStats}>Cost: 5 • Attack: 4 • Health: 3</Text>
                <Text style={styles.cardEffect}>Effect: On play – Deal 2 damage to a random enemy, then repeat if it destroys a unit.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* $lolstone Token Section */}
      <View style={styles.tokenSection}>
        <LinearGradient
          colors={[colors.primary + '10', colors.secondary + '05', colors.primary + '10']}
          style={styles.tokenGradient}
        >
          <View style={styles.tokenContent}>
            <View style={styles.tokenHeader}>
              <Text style={styles.tokenMainTitle}>🚀 $lolstone Token</Text>
              <Text style={styles.tokenSubtitle}>The Fuel Powering the Meme Revolution</Text>
            </View>

            <Text style={styles.tokenDescription}>
              $lolstone is the native cryptocurrency of Lolstone, fueling the ecosystem where internet memes battle for supremacy. Every holder owns a stake in the game's explosive growth, turning laughs into real rewards.
            </Text>

            {/* Token Features Grid */}
            <View style={styles.tokenFeaturesGrid}>
              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>🛒</Text>
                <Text style={styles.featureTitle}>Buy Ducats</Text>
                <Text style={styles.featureDesc}>Purchase ducats at favorable rates for in-game spending</Text>
              </View>

              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>🏦</Text>
                <Text style={styles.featureTitle}>Staking Rewards</Text>
                <Text style={styles.featureDesc}>Earn free packs, exclusive memes, and boosted ducats</Text>
              </View>

              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>🗳️</Text>
                <Text style={styles.featureTitle}>Governance</Text>
                <Text style={styles.featureDesc}>Vote on new card sets, expansions, and community events</Text>
              </View>

              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureTitle}>Passive Income</Text>
                <Text style={styles.featureDesc}>Earn from marketplace fees as player base grows</Text>
              </View>

              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>🔥</Text>
                <Text style={styles.featureTitle}>Deflationary</Text>
                <Text style={styles.featureDesc}>Transaction taxes fund burns and liquidity</Text>
              </View>

              <View style={styles.tokenFeature}>
                <Text style={styles.featureIcon}>📈</Text>
                <Text style={styles.featureTitle}>Organic Growth</Text>
                <Text style={styles.featureDesc}>More players = more duels, trades, and token demand</Text>
              </View>
            </View>

            {/* Tokenomics Section */}
            <View style={styles.tokenomicsContainer}>
              <Text style={styles.tokenomicsTitle}>💎 Tokenomics</Text>
              <Text style={styles.tokenomicsSubtitle}>Transparent, Community-First Distribution</Text>

              <View style={styles.tokenStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1B</Text>
                  <Text style={styles.statLabel}>Total Supply</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>SOL</Text>
                  <Text style={styles.statLabel}>Blockchain</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1%</Text>
                  <Text style={styles.statLabel}>Tax Rate</Text>
                </View>
              </View>

              {/* Allocation Table */}
              <View style={styles.allocationTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Category</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Allocation</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Percentage</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 3 }]}>Details</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>💧 Liquidity Pool</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>500M</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.primary }]}>50%</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>Locked forever on Raydium</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>🎁 Ecosystem Rewards</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>200M</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>20%</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>12-month linear unlock</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>👥 Team</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>10%</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>24-month vest, 6-month cliff</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>📢 Marketing</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.primary }]}>10%</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>6-month unlock</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>🔥 Community Burn</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>10%</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>Immediate burn</Text>
                </View>
              </View>

              {/* Security Features */}
              <View style={styles.securityFeatures}>
                <Text style={styles.securityTitle}>🔒 Security & Trust</Text>

                <View style={styles.securityGrid}>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>🚀</Text>
                    <Text style={styles.securityText}>Fair Launch</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>🔐</Text>
                    <Text style={styles.securityText}>Authority Revoked</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>✅</Text>
                    <Text style={styles.securityText}>Full Audit</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>🚫</Text>
                    <Text style={styles.securityText}>No Rugs</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>🔥</Text>
                    <Text style={styles.securityText}>Auto Burn</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityIcon}>👥</Text>
                    <Text style={styles.securityText}>Community First</Text>
                  </View>
                </View>
              </View>

            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Play LOLSTONE?</Text>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🃏</Text>
            <Text style={styles.featureTitle}>Collect Cards</Text>
            <Text style={styles.featureDesc}>
              Build your collection with unique, meme-inspired cards
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚔️</Text>
            <Text style={styles.featureTitle}>Battle Players</Text>
            <Text style={styles.featureDesc}>
              Test your strategy against players worldwide
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Earn Rewards</Text>
            <Text style={styles.featureDesc}>
              Win matches and complete quests for ducats
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={styles.featureTitle}>Pure Chaos</Text>
            <Text style={styles.featureDesc}>
              Unpredictable effects and hilarious moments
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Create Account</Text>
            <Text style={styles.stepDesc}>Sign up and get 100 free ducats</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Build Your Deck</Text>
            <Text style={styles.stepDesc}>Collect cards and craft strategies</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Battle & Win</Text>
            <Text style={styles.stepDesc}>Compete in matches and climb rankings</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with chaos and memes 🔥
        </Text>
        <Text style={styles.footerSubtext}>
          LOLSTONE - Where strategy meets absurdity
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
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero Section
  heroSection: {
    minHeight: height * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  glowOrb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primary,
    top: -200,
    right: -150,
    opacity: 0.06,
  },
  glowOrb2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.secondary,
    bottom: -150,
    left: -100,
    opacity: 0.06,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    // Grid pattern would be an image in production
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  emoji: {
    fontSize: 100,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: Math.min(width * 0.12, 60),
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 6,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: Math.min(width * 0.06, 24),
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: Math.min(width * 0.04, 16),
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  featureCard: {
    width: Math.min((width - spacing.xl * 2 - spacing.lg * 2) / 2, 250),
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // How It Works
  howItWorksSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
