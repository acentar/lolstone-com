import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { useWalletContext } from '../../src/context/WalletContext';
import { CardDesign } from '../../src/types/database';
import BoosterPackReveal from '../../src/components/BoosterPackReveal';
import CryptoPayment from '../../src/components/CryptoPayment';
import { spacing, colors } from '../../src/constants/theme';

// Booster Pack Types
interface BoosterPackType {
  id: string;
  name: string;
  cards: number;
  cost: number;
  color1: string;
  color2: string;
  color3: string;
  icon: string;
  description: string;
  guarantees: {
    uncommon?: number;
    rare?: number;
    epic?: number;
    legendary?: number;
  };
}

const BOOSTER_PACKS: BoosterPackType[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    cards: 3,
    cost: 150,
    color1: '#374151',
    color2: '#4b5563',
    color3: '#6b7280',
    icon: '📦',
    description: '3 random cards to get started',
    guarantees: {},
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    cards: 6,
    cost: 350,
    color1: '#1e40af',
    color2: '#3b82f6',
    color3: '#60a5fa',
    icon: '🎁',
    description: '6 cards with decent variety',
    guarantees: { uncommon: 1 },
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    cards: 10,
    cost: 600,
    color1: '#166534',
    color2: '#22c55e',
    color3: '#4ade80',
    icon: '🎊',
    description: '10 cards, guaranteed rare!',
    guarantees: { uncommon: 2, rare: 1 },
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    cards: 15,
    cost: 1200,
    color1: '#7c3aed',
    color2: '#a855f7',
    color3: '#c084fc',
    icon: '💎',
    description: '15 cards with epic guarantee',
    guarantees: { uncommon: 3, rare: 2, epic: 1 },
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    cards: 20,
    cost: 1800,
    color1: '#b45309',
    color2: '#f59e0b',
    color3: '#fbbf24',
    icon: '🏆',
    description: '20 cards, multiple epics!',
    guarantees: { uncommon: 4, rare: 3, epic: 2 },
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    cards: 30,
    cost: 3000,
    color1: '#dc2626',
    color2: '#ef4444',
    color3: '#f87171',
    icon: '👑',
    description: '30 cards with LEGENDARY!',
    guarantees: { uncommon: 5, rare: 4, epic: 2, legendary: 1 },
  },
];

// Rarity weights (higher = more likely)
const RARITY_WEIGHTS: Record<string, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1,
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

interface AvailableCard {
  id: string;
  design_id: string;
  card_designs: CardDesign;
}

interface RevealedCard {
  instanceId: string;
  design: CardDesign;
}

export default function ShopScreen() {
  const router = useRouter();
  const { player, refreshPlayer, user, loading: authLoading } = useAuthContext();
  const { connected, publicKey, connect, connecting } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);

  
  // Animation for the pack
  const packFloat = useState(new Animated.Value(0))[0];

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !player) {
      router.replace('/auth/player');
    }
  }, [player, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Don't render if not logged in (will redirect)
  if (!player) {
    return null;
  }

  useEffect(() => {
    loadAvailableCards();
    animatePack();
  }, []);

  const animatePack = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(packFloat, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(packFloat, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadAvailableCards = async () => {
    try {
      // Count cards available for purchase (not owned by anyone)
      const { count, error } = await supabase
        .from('card_instances')
        .select('*', { count: 'exact', head: true })
        .is('owner_id', null);

      if (error) throw error;
      setAvailableCount(count || 0);
    } catch (error) {
      console.error('Error loading available cards:', error);
    }
  };

  const purchaseBooster = async (packType: BoosterPackType) => {
    console.log('=== BOOSTER PURCHASE STARTED ===');
    console.log('Pack:', packType.name, 'Cards:', packType.cards, 'Cost:', packType.cost);
    console.log('Player:', player?.id, 'Ducats:', player?.ducats);
    
    if (!player) {
      Alert.alert('Error', 'Not logged in as a player');
      return;
    }

    if ((player.ducats || 0) < packType.cost) {
      Alert.alert(
        'Not Enough Ducats',
        `You need ${packType.cost} ducats. You have ${player.ducats || 0}.`
      );
      return;
    }

    if (availableCount < packType.cards) {
      Alert.alert('Not Enough Cards', `Only ${availableCount} cards available in pool.`);
      return;
    }

    setLoading(true);

    try {
      console.log('🎲 Fetching available cards from pool...');
      
      // NEW APPROACH: Start from card_designs to avoid 1000 row limit on card_instances
      
      // STEP 1: Get all card designs that have been minted
      const { data: allDesigns, error: designsError } = await supabase
        .from('card_designs')
        .select('id, name, rarity')
        .gt('total_minted', 0)
        .eq('is_active', true);

      if (designsError) {
        console.error('🎲 Error fetching card designs:', designsError);
        throw designsError;
      }

      console.log('🎲 Designs with mints:', allDesigns?.length || 0);

      if (!allDesigns || allDesigns.length === 0) {
        Alert.alert('Error', 'No cards available in pool');
        setLoading(false);
        return;
      }

      // STEP 2: For each design, check if there are unowned instances and get some
      const availableCards: AvailableCard[] = [];
      const designsWithCards: string[] = [];
      
      for (const design of allDesigns) {
        // First check count
        const { count, error: countError } = await supabase
          .from('card_instances')
          .select('*', { count: 'exact', head: true })
          .eq('design_id', design.id)
          .is('owner_id', null);

        if (countError || !count || count === 0) {
          continue; // Skip designs with no unowned instances
        }

        // Get up to 20 instances per design (enough for variety in packs)
        const { data: instancesForDesign, error: instancesError } = await supabase
          .from('card_instances')
          .select('id, design_id, card_designs (*)')
          .eq('design_id', design.id)
          .is('owner_id', null)
          .limit(20);

        if (instancesError || !instancesForDesign) {
          console.warn('🎲 Error fetching instances for', design.name);
          continue;
        }

        availableCards.push(...(instancesForDesign as AvailableCard[]));
        designsWithCards.push(design.name);
      }

      console.log('🎲 Total available cards fetched:', availableCards.length, 'from', designsWithCards.length, 'designs');
      console.log('🎲 Designs with unowned cards:', designsWithCards);
      
      if (!availableCards || availableCards.length === 0) {
        Alert.alert('Error', 'No cards available in pool');
        setLoading(false);
        return;
      }
      
      if (availableCards.length < packType.cards) {
        console.log('Warning: Only', availableCards.length, 'cards available, need', packType.cards);
        // Continue anyway with what we have
      }

      // Group cards by design and rarity
      const cardsByDesign: Record<string, { cards: AvailableCard[]; rarity: string }> = {};
      const cardsByRarity: Record<string, AvailableCard[]> = {
        common: [], uncommon: [], rare: [], epic: [], legendary: []
      };
      
      for (const card of availableCards as AvailableCard[]) {
        const design = card.card_designs as unknown as CardDesign;
        const rarity = design.rarity || 'common';
        
        if (!cardsByDesign[card.design_id]) {
          cardsByDesign[card.design_id] = { cards: [], rarity };
        }
        cardsByDesign[card.design_id].cards.push(card);
        
        if (cardsByRarity[rarity]) {
          cardsByRarity[rarity].push(card);
        }
      }

      // Count unique designs
      const uniqueDesigns = Object.keys(cardsByDesign).length;
      console.log('Unique designs available:', uniqueDesigns);
      console.log('Cards per design:', Object.entries(cardsByDesign).map(([id, d]) => 
        `${id.slice(0,8)}: ${d.cards.length} (${d.rarity})`
      ));

      // IMPORTANT: Limit max copies per design to ensure variety
      // Maximum 4 copies of any single design (like real card games)
      const ABSOLUTE_MAX_COPIES = 4;
      
      // Calculate minimum needed to fill pack (fallback only if not enough variety)
      const minCopiesNeeded = Math.ceil(packType.cards / uniqueDesigns);
      const MAX_SAME_DESIGN = uniqueDesigns >= packType.cards / 4 
        ? ABSOLUTE_MAX_COPIES  // Enough variety, enforce hard limit
        : Math.min(minCopiesNeeded + 1, ABSOLUTE_MAX_COPIES * 2); // Limited variety, allow more but cap at 8
      
      console.log('🎲 Pack config: Need', packType.cards, 'cards from', uniqueDesigns, 'designs');
      console.log('🎲 MAX_SAME_DESIGN:', MAX_SAME_DESIGN, '(absolute max:', ABSOLUTE_MAX_COPIES, ')');
      const selectedCards: AvailableCard[] = [];
      const designCounts: Record<string, number> = {};
      const usedCardIds = new Set<string>();

      // Helper: Pick a card from specific rarity
      const pickFromRarity = (rarity: string): AvailableCard | null => {
        const available = cardsByRarity[rarity]?.filter(c => 
          !usedCardIds.has(c.id) && (designCounts[c.design_id] || 0) < MAX_SAME_DESIGN
        );
        if (!available || available.length === 0) return null;
        
        // Shuffle and pick
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled[0];
      };

      // Helper: Pick weighted random card (with variety bonus)
      const pickWeighted = (): AvailableCard | null => {
        const allAvailable = Object.values(cardsByDesign).flatMap(d => 
          d.cards.filter(c => 
            !usedCardIds.has(c.id) && (designCounts[c.design_id] || 0) < MAX_SAME_DESIGN
          )
        );
        
        if (allAvailable.length === 0) return null;

        // Build weighted pool with variety bonus
        // Cards from designs we haven't picked yet get a significant boost
        const weighted: { card: AvailableCard; weight: number }[] = allAvailable.map(card => {
          const design = card.card_designs as unknown as CardDesign;
          const rarityWeight = RARITY_WEIGHTS[design.rarity] || 10;
          
          // Variety bonus: designs with 0 picks get 5x bonus, 1 pick gets 2x, 2+ picks normal
          const currentCount = designCounts[card.design_id] || 0;
          const varietyMultiplier = currentCount === 0 ? 5 : (currentCount === 1 ? 2 : 1);
          
          return { card, weight: rarityWeight * varietyMultiplier };
        });

        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const w of weighted) {
          random -= w.weight;
          if (random <= 0) return w.card;
        }
        return weighted[weighted.length - 1].card;
      };

      // Helper: Add card to selection
      const addCard = (card: AvailableCard) => {
        selectedCards.push(card);
        usedCardIds.add(card.id);
        designCounts[card.design_id] = (designCounts[card.design_id] || 0) + 1;
      };

      // STEP 1: Fulfill guaranteed rarities (pick from highest first)
      const guaranteeOrder = ['legendary', 'epic', 'rare', 'uncommon'];
      for (const rarity of guaranteeOrder) {
        const needed = packType.guarantees[rarity as keyof typeof packType.guarantees] || 0;
        for (let i = 0; i < needed; i++) {
          const card = pickFromRarity(rarity);
          if (card) addCard(card);
        }
      }

      // STEP 2: Fill remaining slots with weighted random picks
      let attempts = 0;
      const maxAttempts = packType.cards * 10; // Safety limit
      
      while (selectedCards.length < packType.cards && attempts < maxAttempts) {
        attempts++;
        const card = pickWeighted();
        if (!card) {
          console.log('pickWeighted returned null at attempt', attempts, '- selected so far:', selectedCards.length);
          console.log('Design counts:', designCounts);
          break;
        }
        addCard(card);
      }

      console.log('🎲 Selected:', selectedCards.length, 'cards after', attempts, 'attempts');
      console.log('🎲 Rarity breakdown:', selectedCards.reduce((acc, c) => {
        const r = (c.card_designs as unknown as CardDesign).rarity;
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      console.log('🎲 Design distribution:', Object.entries(designCounts).map(([id, count]) => {
        const design = cardsByDesign[id];
        return `${design?.cards[0]?.card_designs?.name || id.slice(0,8)}: ${count}`;
      }).join(', '));
      console.log('🎲 Unique designs in pack:', Object.keys(designCounts).length);

      if (selectedCards.length === 0) {
        Alert.alert('Error', 'No cards available!');
        setLoading(false);
        return;
      }

      // Deduct ducats
      const { error: ducatError } = await (supabase
        .from('players') as any)
        .update({ ducats: (player.ducats || 0) - packType.cost })
        .eq('id', player.id);

      if (ducatError) throw ducatError;

      // Assign cards
      const { error: assignError } = await (supabase
        .from('card_instances') as any)
        .update({ owner_id: player.id })
        .in('id', selectedCards.map(c => c.id));

      if (assignError) throw assignError;

      // Record transaction
      await (supabase.from('transactions') as any).insert({
        type: 'purchase',
        to_player_id: player.id,
        ducats_amount: packType.cost,
        description: `Purchased ${packType.name} (${selectedCards.length} cards)`,
      });

      // Prepare revealed cards (sorted by rarity for dramatic reveal)
      const revealed: RevealedCard[] = selectedCards.map(card => ({
        instanceId: card.id,
        design: card.card_designs as unknown as CardDesign,
      }));
      
      revealed.sort((a, b) => 
        RARITY_ORDER.indexOf(a.design.rarity) - RARITY_ORDER.indexOf(b.design.rarity)
      );

      console.log('=== BOOSTER PURCHASE SUCCESS ===');
      setRevealedCards(revealed);
      setShowReveal(true);

      if (refreshPlayer) refreshPlayer();
      loadAvailableCards();

    } catch (error) {
      console.error('=== BOOSTER PURCHASE FAILED ===', error);
      Alert.alert('Error', 'Failed to purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canAffordPack = (pack: BoosterPackType) => (player?.ducats || 0) >= pack.cost;
  const hasEnoughCards = (pack: BoosterPackType) => availableCount >= pack.cards;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Card Shop</Text>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceEmoji}>💰</Text>
              <Text style={styles.balanceValue}>{player?.ducats?.toLocaleString() || 0}</Text>
            </View>
          </View>

        {/* Pool Info */}
        <View style={styles.poolInfo}>
          <Text style={styles.poolIcon}>📦</Text>
          <Text style={styles.poolText}>{availableCount.toLocaleString()} cards in pool</Text>
        </View>

        {/* Booster Packs Grid */}
        <View style={styles.packsSection}>
          <Text style={styles.sectionTitle}>🎁 Booster Packs</Text>
          <Text style={styles.sectionSubtitle}>Choose your pack size • Max 2 of same card per pack</Text>
          
          <View style={styles.packsGrid}>
            {BOOSTER_PACKS.map((pack) => {
              const canAfford = canAffordPack(pack);
              const hasCards = hasEnoughCards(pack);
              const isDisabled = loading || !canAfford || !hasCards;
              
              return (
                <Pressable
                  key={pack.id}
                  onPress={() => purchaseBooster(pack)}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    styles.packCard,
                    pressed && styles.packCardPressed,
                    isDisabled && styles.packCardDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={[pack.color1, pack.color2, pack.color3]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.packGradient}
                  >
                    {/* Icon */}
                    <Text style={styles.packIcon}>{pack.icon}</Text>
                    
                    {/* Info */}
                    <Text style={styles.packName}>{pack.name}</Text>
                    <Text style={styles.packCards}>🃏 {pack.cards} Cards</Text>
                    
                    {/* Guarantees */}
                    <View style={styles.guaranteesRow}>
                      {pack.guarantees.legendary && (
                        <View style={[styles.guaranteeBadge, { backgroundColor: '#f59e0b' }]}>
                          <Text style={styles.guaranteeText}>👑 {pack.guarantees.legendary}</Text>
                        </View>
                      )}
                      {pack.guarantees.epic && (
                        <View style={[styles.guaranteeBadge, { backgroundColor: '#a855f7' }]}>
                          <Text style={styles.guaranteeText}>💎 {pack.guarantees.epic}</Text>
                        </View>
                      )}
                      {pack.guarantees.rare && (
                        <View style={[styles.guaranteeBadge, { backgroundColor: '#3b82f6' }]}>
                          <Text style={styles.guaranteeText}>⭐ {pack.guarantees.rare}</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Price */}
                    <View style={styles.packPriceRow}>
                      <Text style={styles.packPrice}>💰 {pack.cost}</Text>
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.packStatus}>
                          {!hasCards ? '❌' : !canAfford ? '🔒' : '✓'}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Rarity Legend */}
        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>Rarity Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
              <Text style={styles.legendText}>Common</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Uncommon</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Rare</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
              <Text style={styles.legendText}>Epic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Legendary</Text>
            </View>
          </View>
        </View>

        {/* Buy Ducats Section */}
        <View style={styles.ducatsSection}>
          <Text style={styles.sectionTitle}>💎 Buy Ducats with Crypto</Text>
          
          {/* Wallet Status Card */}
          {connected && publicKey ? (
            <View style={styles.walletConnectedCard}>
              <Text style={styles.walletConnectedIcon}>✅</Text>
              <View style={styles.walletConnectedInfo}>
                <Text style={styles.walletConnectedTitle}>Wallet Connected</Text>
                <Text style={styles.walletConnectedAddress}>
                  👻 {typeof publicKey === 'string' 
                    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
                    : publicKey.toBase58 
                      ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
                      : 'Connected'
                  }
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.connectWalletCard}
              onPress={connect}
              disabled={connecting}
            >
              <Text style={styles.connectWalletIcon}>{connecting ? '⏳' : '👻'}</Text>
              <View style={styles.connectWalletInfo}>
                <Text style={styles.connectWalletTitle}>
                  {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
                </Text>
                <Text style={styles.connectWalletSubtitle}>
                  Connect to purchase ducats with crypto
                </Text>
              </View>
            </Pressable>
          )}

          {/* Buy Button */}
          <Pressable
            style={styles.cryptoCard}
            onPress={() => setShowCryptoPayment(true)}
          >
            <LinearGradient
              colors={connected ? ['#22c55e', '#16a34a'] : ['#1e1e2e', '#2d2d44']}
              style={styles.cryptoCardGradient}
            >
              <View style={styles.cryptoIconContainer}>
                <Text style={styles.cryptoIcon}>💎</Text>
              </View>
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoTitle}>
                  {connected ? 'Buy Ducats Now' : 'Phantom Wallet'}
                </Text>
                <Text style={styles.cryptoSubtitle}>Pay with USDC or SOL</Text>
              </View>
              <View style={styles.cryptoArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </LinearGradient>
          </Pressable>
          <View style={styles.cryptoPackages}>
            <View style={styles.packagePreview}>
              <Text style={styles.packageDucats}>100</Text>
              <Text style={styles.packageLabel}>$1</Text>
            </View>
            <View style={styles.packagePreview}>
              <Text style={styles.packageDucats}>500</Text>
              <Text style={styles.packageLabel}>$5</Text>
            </View>
            <View style={styles.packagePreview}>
              <Text style={styles.packageDucats}>1,000</Text>
              <Text style={styles.packageLabel}>$10</Text>
            </View>
          </View>
        </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>💡 Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                • Build a deck of 30 cards to start playing matches{'\n'}
                • Legendary cards have powerful unique abilities{'\n'}
                • Win matches to earn more ducats{'\n'}
                • Check your collection to see what you have
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booster Reveal Modal */}
      <BoosterPackReveal
        visible={showReveal}
        cards={revealedCards}
        onClose={() => {
          setShowReveal(false);
          setRevealedCards([]);
        }}
      />

      {/* Crypto Payment Modal */}
      <CryptoPayment
        visible={showCryptoPayment}
        onClose={() => setShowCryptoPayment(false)}
        playerId={user?.id || ''}
        onSuccess={async (ducats, signature) => {
          console.log('🚀 Payment successful:', { ducats, signature, userId: user?.id });

          try {
            // Get current player data
            const { data: playerData, error: selectError } = await (supabase
              .from('players') as any)
              .select('id, ducats')
              .eq('user_id', user?.id || '')
              .single();

            if (selectError) {
              console.error('❌ Player lookup failed:', selectError);
              throw new Error(`Could not find player: ${selectError.message}`);
            }

            const currentDucats = playerData?.ducats || 0;
            const newDucats = currentDucats + ducats;

            console.log(`💰 Updating ducats: ${currentDucats} → ${newDucats}`);

            // Update ducat balance
            const { error: updateError } = await (supabase
              .from('players') as any)
              .update({ ducats: newDucats })
              .eq('user_id', user?.id || '');

            if (updateError) {
              console.error('❌ Ducat update failed:', updateError);
              throw new Error(`Failed to update ducats: ${updateError.message}`);
            }

            // Record transaction (non-blocking)
            try {
              await (supabase
                .from('transactions') as any)
                .insert({
                  type: 'deposit',
                  to_player_id: playerData.id,
                  ducats_amount: ducats,
                  description: `Crypto purchase: ${signature.slice(0, 8)}...`
                });
              console.log('✅ Transaction recorded');
            } catch (txError) {
              console.warn('⚠️ Transaction recording failed:', txError);
              // Don't fail the payment for this
            }

            // Refresh player data
            await refreshPlayer();

            setShowCryptoPayment(false);

            Alert.alert(
              '🎉 Payment Complete!',
              `You received ${ducats.toLocaleString()} ducats!\n\nBalance: ${newDucats}\nTransaction: ${signature.slice(0, 12)}...`,
              [{ text: 'Awesome!' }]
            );

          } catch (error: any) {
            console.error('💥 Ducat crediting failed:', error);
            Alert.alert(
              '⚠️ Payment Received',
              `Your payment was received (${signature.slice(0, 8)}...) but ducat crediting failed.\n\n${error?.message || 'Unknown error'}`,
              [{ text: 'Contact Support' }]
            );
            setShowCryptoPayment(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 82,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentWrapper: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  balanceEmoji: {
    fontSize: 16,
  },
  balanceValue: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
  },

  // Section styles
  featuredSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  // Booster card
  boosterCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  boosterCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  boosterCardDisabled: {
    opacity: 0.5,
  },
  boosterGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    left: 30,
    fontSize: 24,
    opacity: 0.6,
  },
  sparkle2: {
    position: 'absolute',
    top: 40,
    right: 40,
    fontSize: 20,
    opacity: 0.5,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    fontSize: 18,
    opacity: 0.4,
  },
  boosterPackImage: {
    marginBottom: spacing.md,
  },
  packEmoji: {
    fontSize: 80,
  },
  boosterInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  boosterTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  boosterDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  boosterMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  priceSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: 8,
  },
  priceEmoji: {
    fontSize: 20,
  },
  priceValue: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '800',
  },
  buyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  poolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 8,
    gap: 8,
  },
  poolIcon: {
    fontSize: 16,
  },
  poolText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },

  // Packs section
  packsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: -8,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  packCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: spacing.sm,
  },
  packCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  packCardDisabled: {
    opacity: 0.5,
  },
  packGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  packIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  packName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  packCards: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  guaranteesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 4,
  },
  guaranteeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  guaranteeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  packPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  packPrice: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
  },
  packStatus: {
    fontSize: 14,
  },

  // Legend section
  legendSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  legendTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 11,
  },

  // Tips section
  tipsSection: {
    paddingHorizontal: spacing.lg,
  },
  tipCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  tipText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 22,
  },

  // Crypto payment section
  ducatsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  cryptoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    marginBottom: spacing.md,
  },
  cryptoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  cryptoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cryptoIcon: {
    fontSize: 28,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  cryptoSubtitle: {
    color: '#a78bfa',
    fontSize: 13,
  },
  cryptoArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#a78bfa',
    fontSize: 18,
    fontWeight: '700',
  },
  cryptoPackages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  packagePreview: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  packageDucats: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
  },
  packageLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  // Wallet connection styles
  walletConnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  walletConnectedIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  walletConnectedInfo: {
    flex: 1,
  },
  walletConnectedTitle: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  walletConnectedAddress: {
    color: '#86efac',
    fontSize: 12,
    marginTop: 2,
  },
  connectWalletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  connectWalletIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  connectWalletInfo: {
    flex: 1,
  },
  connectWalletTitle: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
  connectWalletSubtitle: {
    color: '#7c3aed',
    fontSize: 12,
    marginTop: 2,
  },
});

