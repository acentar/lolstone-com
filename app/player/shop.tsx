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
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { useWalletContext } from '../../src/context/WalletContext';
import { CardDesign } from '../../src/types/database';
import BoosterPackReveal from '../../src/components/BoosterPackReveal';
import CryptoPayment from '../../src/components/CryptoPayment';
import { spacing } from '../../src/constants/theme';

const BOOSTER_COST = 100;
const CARDS_PER_PACK = 6;

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
  const { player, refreshPlayer, user } = useAuthContext();
  const { connected, publicKey, connect, connecting } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);

  // Debug function to test add_ducats RPC
  const testAddDucats = async () => {
    console.log('🧪 Testing add_ducats RPC...');
    console.log('👤 Current user:', user);
    console.log('🔑 User ID:', user?.id);

    if (!user?.id) {
      console.error('❌ No user ID available');
      Alert.alert('Error', 'No user ID available');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('add_ducats', {
        p_user_id: user.id,
        p_amount: 10, // Test with 10 ducats
      });

      console.log('📊 Test RPC Response:', { data, error });

      if (error) {
        Alert.alert('Test Failed', `RPC Error: ${error.message}`);
      } else if (!data?.success) {
        Alert.alert('Test Failed', `RPC returned: ${JSON.stringify(data)}`);
      } else {
        Alert.alert('Test Success', `Added 10 ducats! New balance: ${data.new_balance}`);
        await refreshPlayer();
      }
    } catch (err) {
      console.error('💥 Test error:', err);
      Alert.alert('Test Error', `Exception: ${err.message}`);
    }
  };
  
  // Animation for the pack
  const packFloat = useState(new Animated.Value(0))[0];

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

  const purchaseBooster = async () => {
    console.log('=== BOOSTER PURCHASE STARTED ===');
    console.log('Player:', player?.id, 'Ducats:', player?.ducats);
    
    if (!player) {
      console.log('ERROR: No player!');
      Alert.alert('Error', 'Not logged in as a player');
      return;
    }

    // Check if player has enough ducats
    if ((player.ducats || 0) < BOOSTER_COST) {
      console.log('ERROR: Not enough ducats');
      Alert.alert(
        'Not Enough Ducats',
        `You need ${BOOSTER_COST} ducats to buy a booster pack. You have ${player.ducats || 0}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if there are enough cards available
    if (availableCount < CARDS_PER_PACK) {
      Alert.alert(
        'Not Enough Cards',
        `There aren't enough cards available in the pool. Only ${availableCount} cards left.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      // Get available cards - fetch enough to ensure variety across all designs
      // Order randomly to avoid always getting the same designs
      const { data: availableCards, error: fetchError } = await supabase
        .from('card_instances')
        .select(`
          id,
          design_id,
          card_designs (*)
        `)
        .is('owner_id', null)
        .limit(500); // Get more cards to ensure variety across all designs

      if (fetchError) {
        console.log('ERROR fetching cards:', fetchError);
        throw fetchError;
      }

      console.log('Available cards fetched:', availableCards?.length);

      if (!availableCards || availableCards.length < CARDS_PER_PACK) {
        console.log('ERROR: Not enough cards in pool');
        Alert.alert('Error', 'Not enough cards available');
        setLoading(false);
        return;
      }

      // === SMART BOOSTER PACK SELECTION ===
      // 1. Group cards by design
      // 2. Weight designs by rarity (common = more likely, legendary = rare)
      // 3. Pick designs randomly based on weight
      // 4. For each design, pick 1-2 copies (max 2 per design)
      // 5. Always get exactly 6 cards
      
      const MAX_SAME_DESIGN = 2;
      
      // Rarity weights (higher = more likely to appear)
      const RARITY_WEIGHTS: Record<string, number> = {
        common: 50,
        uncommon: 30,
        rare: 15,
        epic: 4,
        legendary: 1,
      };
      
      // Group cards by design
      const cardsByDesign: Record<string, { cards: AvailableCard[]; rarity: string }> = {};
      
      for (const card of availableCards as AvailableCard[]) {
        const design = card.card_designs as unknown as CardDesign;
        if (!cardsByDesign[card.design_id]) {
          cardsByDesign[card.design_id] = {
            cards: [],
            rarity: design.rarity || 'common',
          };
        }
        cardsByDesign[card.design_id].cards.push(card);
      }
      
      const designIds = Object.keys(cardsByDesign);
      console.log('Unique designs found:', designIds.length);
      
      if (designIds.length === 0) {
        Alert.alert('Error', 'No card designs available!');
        setLoading(false);
        return;
      }
      
      // Build weighted design pool for random selection
      const weightedDesigns: { designId: string; weight: number }[] = [];
      for (const designId of designIds) {
        const rarity = cardsByDesign[designId].rarity;
        const weight = RARITY_WEIGHTS[rarity] || 10;
        weightedDesigns.push({ designId, weight });
      }
      
      // Function to pick a random design based on weight
      const pickWeightedDesign = (designs: typeof weightedDesigns): string | null => {
        if (designs.length === 0) return null;
        const totalWeight = designs.reduce((sum, d) => sum + d.weight, 0);
        let random = Math.random() * totalWeight;
        for (const d of designs) {
          random -= d.weight;
          if (random <= 0) return d.designId;
        }
        return designs[designs.length - 1].designId;
      };
      
      // Select cards for the booster
      const selectedCards: AvailableCard[] = [];
      const designCounts: Record<string, number> = {};
      let availableDesigns = [...weightedDesigns];
      
      // Keep picking until we have 6 cards
      while (selectedCards.length < CARDS_PER_PACK && availableDesigns.length > 0) {
        // Pick a design based on rarity weight
        const pickedDesignId = pickWeightedDesign(availableDesigns);
        if (!pickedDesignId) break;
        
        const designData = cardsByDesign[pickedDesignId];
        const currentCount = designCounts[pickedDesignId] || 0;
        
        // Check if we can add more from this design (max 2)
        if (currentCount < MAX_SAME_DESIGN && designData.cards.length > currentCount) {
          // Add one card from this design
          selectedCards.push(designData.cards[currentCount]);
          designCounts[pickedDesignId] = currentCount + 1;
          
          // If we've hit the max for this design, remove it from available pool
          if (designCounts[pickedDesignId] >= MAX_SAME_DESIGN || 
              designCounts[pickedDesignId] >= designData.cards.length) {
            availableDesigns = availableDesigns.filter(d => d.designId !== pickedDesignId);
          }
        } else {
          // Can't add more from this design, remove it
          availableDesigns = availableDesigns.filter(d => d.designId !== pickedDesignId);
        }
      }
      
      console.log('Selected cards:', selectedCards.length);
      console.log('Design distribution:', designCounts);
      
      // Check if we have enough cards
      if (selectedCards.length < CARDS_PER_PACK) {
        console.log('WARNING: Only got', selectedCards.length, 'cards - not enough variety in pool');
        if (selectedCards.length === 0) {
          Alert.alert('Error', 'No cards available in the pool!');
          setLoading(false);
          return;
        }
        // Continue with fewer cards if that's all we have
      }
      
      console.log('Proceeding with', selectedCards.length, 'cards');

      // Deduct ducats from player
      const { error: ducatError } = await (supabase
        .from('players') as any)
        .update({ ducats: (player.ducats || 0) - BOOSTER_COST })
        .eq('id', player.id);

      if (ducatError) throw ducatError;

      // Assign cards to player
      const cardIds = selectedCards.map(c => c.id);
      const { error: assignError } = await (supabase
        .from('card_instances') as any)
        .update({ owner_id: player.id })
        .in('id', cardIds);

      if (assignError) throw assignError;

      // Record transaction
      await (supabase.from('transactions') as any).insert({
        type: 'purchase' as const,
        to_player_id: player.id,
        ducats_amount: BOOSTER_COST,
        description: `Purchased booster pack (${selectedCards.length} cards)`,
      });

      // Prepare revealed cards
      const revealed: RevealedCard[] = selectedCards.map(card => ({
        instanceId: card.id,
        design: card.card_designs as unknown as CardDesign,
      }));

      // Sort by rarity for dramatic effect (common first, legendary last)
      const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
      revealed.sort((a, b) => rarityOrder[a.design.rarity] - rarityOrder[b.design.rarity]);

      console.log('=== BOOSTER PURCHASE SUCCESS ===');
      setRevealedCards(revealed);
      setShowReveal(true);

      // Refresh player data and available count
      if (refreshPlayer) refreshPlayer();
      loadAvailableCards();

    } catch (error) {
      console.error('=== BOOSTER PURCHASE FAILED ===', error);
      Alert.alert('Error', 'Failed to purchase booster pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (player?.ducats || 0) >= BOOSTER_COST;
  const hasCards = availableCount >= CARDS_PER_PACK;

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Card Shop</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceEmoji}>💰</Text>
            <Text style={styles.balanceValue}>{player?.ducats?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Featured Booster Pack */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          
          <Pressable
            onPress={purchaseBooster}
            disabled={loading || !canAfford || !hasCards}
            style={({ pressed }) => [
              styles.boosterCard,
              pressed && styles.boosterCardPressed,
              (!canAfford || !hasCards) && styles.boosterCardDisabled,
            ]}
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6', '#60a5fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.boosterGradient}
            >
              {/* Decorative elements */}
              <View style={styles.sparkleContainer}>
                <Text style={styles.sparkle1}>✨</Text>
                <Text style={styles.sparkle2}>⭐</Text>
                <Text style={styles.sparkle3}>✨</Text>
              </View>

              <Animated.View
                style={[
                  styles.boosterPackImage,
                  { transform: [{ translateY: packFloat }] },
                ]}
              >
                <Text style={styles.packEmoji}>🎁</Text>
              </Animated.View>

              <View style={styles.boosterInfo}>
                <Text style={styles.boosterTitle}>BOOSTER PACK</Text>
                <Text style={styles.boosterDescription}>
                  Get 6 random cards from the minting pool!
                </Text>
                <View style={styles.boosterMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🃏</Text>
                    <Text style={styles.metaText}>{CARDS_PER_PACK} Cards</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🎲</Text>
                    <Text style={styles.metaText}>Random Rarity</Text>
                  </View>
                </View>
              </View>

              <View style={styles.priceSection}>
                <View style={styles.priceTag}>
                  <Text style={styles.priceEmoji}>💰</Text>
                  <Text style={styles.priceValue}>{BOOSTER_COST}</Text>
                </View>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buyText}>
                    {!hasCards ? 'SOLD OUT' : !canAfford ? 'NOT ENOUGH' : 'TAP TO BUY'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </Pressable>

          {/* Pool info */}
          <View style={styles.poolInfo}>
            <Text style={styles.poolText}>
              📦 {availableCount} cards available in the pool
            </Text>
          </View>
        </View>

        {/* Rarity Guide */}
        <View style={styles.raritySection}>
          <Text style={styles.sectionTitle}>Rarity Guide</Text>
          <View style={styles.rarityGrid}>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: '#6b7280' }]} />
              <Text style={styles.rarityLabel}>Common</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.rarityLabel}>Uncommon</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.rarityLabel}>Rare</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: '#a855f7' }]} />
              <Text style={styles.rarityLabel}>Epic</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.rarityLabel}>Legendary</Text>
            </View>
          </View>
        </View>

        {/* Test Button for Debug */}
        <Pressable
          style={{ padding: 10, backgroundColor: '#ff6b6b', marginBottom: 10 }}
          onPress={testAddDucats}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>🧪 Test Add Ducats (Debug)</Text>
        </Pressable>

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
          console.log('🚀 onSuccess called with:', { ducats, signature });
          console.log('👤 Current user:', user);
          console.log('🔑 User ID:', user?.id);

          try {
            // Credit the ducats to the player via RPC
            console.log('💰 Calling add_ducats RPC...');
            const { data, error } = await supabase.rpc('add_ducats', {
              p_user_id: user?.id,
              p_amount: ducats,
            });

            console.log('📊 RPC Response:', { data, error });

            if (error) {
              console.error('❌ RPC Error:', error);
              Alert.alert(
                '⚠️ Payment Received',
                `Your payment was received (tx: ${signature.slice(0, 8)}...) but there was an issue crediting your ducats.\n\nError: ${error.message}`,
                [{ text: 'OK' }]
              );
              setShowCryptoPayment(false);
              return;
            }

            if (!data?.success) {
              console.error('❌ RPC returned success=false:', data);
              Alert.alert(
                '⚠️ Payment Received',
                `Your payment was received (tx: ${signature.slice(0, 8)}...) but ducat crediting failed.\n\nReason: ${data?.error || 'Unknown error'}`,
                [{ text: 'OK' }]
              );
              setShowCryptoPayment(false);
              return;
            }

            console.log('✅ Ducats credited successfully:', data);

            // Refresh player data to get updated ducat balance
            console.log('🔄 Refreshing player data...');
            await refreshPlayer();
            console.log('✅ Player data refreshed');

            setShowCryptoPayment(false);

            Alert.alert(
              '🎉 Success!',
              `You received ${ducats.toLocaleString()} ducats!\nNew balance: ${data.new_balance}\n\nTransaction: ${signature.slice(0, 12)}...`,
              [{ text: 'Awesome!' }]
            );
          } catch (err) {
            console.error('💥 Error in onSuccess:', err);
            Alert.alert(
              '⚠️ Error',
              `Payment received but failed to credit ducats.\n\nError: ${err.message}`,
              [{ text: 'OK' }]
            );
            setShowCryptoPayment(false);
          }
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
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
    alignItems: 'center',
    marginTop: spacing.md,
  },
  poolText: {
    color: '#64748b',
    fontSize: 13,
  },

  // Rarity section
  raritySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  rarityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 8,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rarityLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
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

