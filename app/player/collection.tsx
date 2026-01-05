import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, useWindowDimensions } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign, CardRarity, KEYWORD_INFO } from '../../src/types/database';
import CardPreview from '../../src/components/CardPreview';
import { spacing } from '../../src/constants/theme';

interface OwnedCard {
  card_instance_id: string;
  card_design: CardDesign;
  count: number;
  instances: {
    id: string;
    serial_number: number;
    edition: number;
    minted_at: string;
  }[];
}

const RARITY_FILTERS: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_COLORS: Record<CardRarity, { primary: string; glow: string }> = {
  common: { primary: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' },
  uncommon: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
  rare: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  epic: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  legendary: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
};

export default function CollectionScreen() {
  const { player } = useAuthContext();
  const { width: screenWidth } = useWindowDimensions();
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('details');

  const isDesktop = screenWidth > 768;

  useEffect(() => {
    loadCollection();
  }, [player?.id]);

  const loadCollection = async () => {
    if (!player?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_instances')
        .select(`
          id,
          design_id,
          serial_number,
          edition,
          minted_at,
          card_designs (*)
        `)
        .eq('owner_id', player.id)
        .order('minted_at', { ascending: false });

      if (error) throw error;

      // Group by design
      const cardMap = new Map<string, OwnedCard>();
      
      for (const instance of data || []) {
        const designId = instance.design_id;
        if (cardMap.has(designId)) {
          const existing = cardMap.get(designId)!;
          existing.count++;
          existing.instances.push({
            id: instance.id,
            serial_number: instance.serial_number,
            edition: instance.edition,
            minted_at: instance.minted_at,
          });
        } else {
          cardMap.set(designId, {
            card_instance_id: instance.id,
            card_design: instance.card_designs as unknown as CardDesign,
            count: 1,
            instances: [{
              id: instance.id,
              serial_number: instance.serial_number,
              edition: instance.edition,
              minted_at: instance.minted_at,
            }],
          });
        }
      }

      setCards(Array.from(cardMap.values()));
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = searchQuery === '' || 
      card.card_design.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === null || 
      card.card_design.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const openCardModal = (card: OwnedCard) => {
    setSelectedCard(card);
    setExpandedSection('details');
    setShowModal(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Card Modal Component
  const CardModal = () => {
    if (!selectedCard) return null;

    const design = selectedCard.card_design;
    const rarityColor = RARITY_COLORS[design.rarity];
    
    // Animation values
    const floatY = useSharedValue(0);
    const glowOpacity = useSharedValue(0.3);
    const rotateZ = useSharedValue(0);

    useEffect(() => {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );

      rotateZ.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, []);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: floatY.value },
        { rotateZ: `${rotateZ.value}deg` },
      ],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
    }));

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable 
            style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={['#0f172a', '#1e293b', '#0f172a']}
              style={styles.modalGradient}
            >
              {/* Close Button */}
              <Pressable style={styles.closeButton} onPress={() => setShowModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                <View style={[styles.modalLayout, isDesktop && styles.modalLayoutDesktop]}>
                  {/* Left Side - Animated Card */}
                  <Animated.View 
                    entering={FadeIn.delay(100)}
                    style={[styles.cardShowcase, isDesktop && styles.cardShowcaseDesktop]}
                  >
                    {/* Glow Effect */}
                    <Animated.View 
                      style={[
                        styles.cardGlow,
                        { backgroundColor: rarityColor.glow },
                        glowAnimatedStyle,
                      ]} 
                    />
                    
                    {/* Animated Card */}
                    <Animated.View style={cardAnimatedStyle}>
                      <CardPreview
                        name={design.name}
                        manaCost={design.mana_cost}
                        attack={design.attack ?? undefined}
                        health={design.health ?? undefined}
                        rarity={design.rarity}
                        category={design.category}
                        abilityText={design.ability_text ?? undefined}
                        flavorText={design.flavor_text ?? undefined}
                        imageUrl={design.image_url ?? undefined}
                        cardType={design.card_type}
                        scale={isDesktop ? 1.3 : 1.1}
                      />
                    </Animated.View>

                    {/* Rarity Badge */}
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor.primary }]}>
                      <Text style={styles.rarityBadgeText}>
                        {design.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </Animated.View>

                  {/* Right Side - Card Details */}
                  <Animated.View 
                    entering={SlideInRight.delay(200)}
                    style={[styles.cardDetails, isDesktop && styles.cardDetailsDesktop]}
                  >
                    {/* Card Name */}
                    <Text style={styles.cardName}>{design.name}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardType}>
                        {design.category === 'unit' ? '⚔️ Unit' : '✨ Action'}
                      </Text>
                      <Text style={styles.cardCost}>💎 {design.mana_cost}</Text>
                    </View>

                    {/* Accordion Sections */}
                    
                    {/* Details Section */}
                    <Pressable 
                      style={styles.accordionHeader}
                      onPress={() => toggleSection('details')}
                    >
                      <Text style={styles.accordionTitle}>📋 Card Details</Text>
                      <Text style={styles.accordionIcon}>
                        {expandedSection === 'details' ? '▼' : '▶'}
                      </Text>
                    </Pressable>
                    {expandedSection === 'details' && (
                      <View style={styles.accordionContent}>
                        {design.category === 'unit' && (
                          <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                              <Text style={styles.statValue}>⚔️ {design.attack}</Text>
                              <Text style={styles.statLabel}>Attack</Text>
                            </View>
                            <View style={styles.statBox}>
                              <Text style={styles.statValue}>❤️ {design.health}</Text>
                              <Text style={styles.statLabel}>Health</Text>
                            </View>
                          </View>
                        )}
                        
                        {design.ability_text && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Ability</Text>
                            <Text style={styles.detailText}>{design.ability_text}</Text>
                          </View>
                        )}
                        
                        {design.flavor_text && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Flavor</Text>
                            <Text style={styles.flavorText}>"{design.flavor_text}"</Text>
                          </View>
                        )}

                        {design.balance_notes && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Balance Notes</Text>
                            <Text style={styles.detailText}>{design.balance_notes}</Text>
                          </View>
                        )}

                        {design.inspiration && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Inspiration</Text>
                            <Text style={styles.detailText}>{design.inspiration}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <Divider style={styles.divider} />

                    {/* Ownership Section */}
                    <Pressable 
                      style={styles.accordionHeader}
                      onPress={() => toggleSection('ownership')}
                    >
                      <Text style={styles.accordionTitle}>
                        🎴 Your Copies ({selectedCard.count})
                      </Text>
                      <Text style={styles.accordionIcon}>
                        {expandedSection === 'ownership' ? '▼' : '▶'}
                      </Text>
                    </Pressable>
                    {expandedSection === 'ownership' && (
                      <View style={styles.accordionContent}>
                        <ScrollView style={styles.instancesScroll} nestedScrollEnabled>
                          {selectedCard.instances.map((instance, idx) => (
                            <View key={instance.id} style={styles.instanceRow}>
                              <View style={styles.instanceInfo}>
                                <Text style={styles.instanceSerial}>
                                  #{instance.serial_number}
                                </Text>
                                <Text style={styles.instanceEdition}>
                                  Edition {instance.edition}
                                </Text>
                              </View>
                              <Text style={styles.instanceDate}>
                                {new Date(instance.minted_at).toLocaleDateString()}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <Divider style={styles.divider} />

                    {/* Supply Section */}
                    <Pressable 
                      style={styles.accordionHeader}
                      onPress={() => toggleSection('supply')}
                    >
                      <Text style={styles.accordionTitle}>📊 Supply Info</Text>
                      <Text style={styles.accordionIcon}>
                        {expandedSection === 'supply' ? '▼' : '▶'}
                      </Text>
                    </Pressable>
                    {expandedSection === 'supply' && (
                      <View style={styles.accordionContent}>
                        <View style={styles.supplyRow}>
                          <Text style={styles.supplyLabel}>Total Minted</Text>
                          <Text style={styles.supplyValue}>{design.total_minted}</Text>
                        </View>
                        <View style={styles.supplyRow}>
                          <Text style={styles.supplyLabel}>Max Supply</Text>
                          <Text style={styles.supplyValue}>
                            {design.max_supply || '∞ Unlimited'}
                          </Text>
                        </View>
                        <View style={styles.supplyRow}>
                          <Text style={styles.supplyLabel}>You Own</Text>
                          <Text style={[styles.supplyValue, { color: '#22c55e' }]}>
                            {selectedCard.count} ({((selectedCard.count / design.total_minted) * 100).toFixed(1)}%)
                          </Text>
                        </View>
                      </View>
                    )}
                  </Animated.View>
                </View>
              </ScrollView>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.subtitle}>
          {cards.length} unique cards • {cards.reduce((sum, c) => sum + c.count, 0)} total
        </Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterSection}>
        <Searchbar
          placeholder="Search cards..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#94a3b8"
          placeholderTextColor="#64748b"
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
        >
          <Chip
            selected={rarityFilter === null}
            onPress={() => setRarityFilter(null)}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            All
          </Chip>
          {RARITY_FILTERS.map((rarity) => (
            <Chip
              key={rarity}
              selected={rarityFilter === rarity}
              onPress={() => setRarityFilter(rarity)}
              style={[
                styles.chip,
                rarityFilter === rarity && { backgroundColor: RARITY_COLORS[rarity].primary }
              ]}
              textStyle={styles.chipText}
            >
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Cards Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>
            {cards.length === 0 ? 'No Cards Yet' : 'No Matches'}
          </Text>
          <Text style={styles.emptyText}>
            {cards.length === 0 
              ? 'Buy booster packs from the shop to start your collection!'
              : 'Try adjusting your search or filters.'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsGrid}
          showsVerticalScrollIndicator={false}
        >
          {filteredCards.map((card) => (
            <Pressable 
              key={card.card_instance_id} 
              style={({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.cardWrapperPressed,
              ]}
              onPress={() => openCardModal(card)}
            >
              <CardPreview
                name={card.card_design.name}
                manaCost={card.card_design.mana_cost}
                attack={card.card_design.attack ?? undefined}
                health={card.card_design.health ?? undefined}
                rarity={card.card_design.rarity}
                category={card.card_design.category}
                abilityText={card.card_design.ability_text ?? undefined}
                flavorText={card.card_design.flavor_text ?? undefined}
                imageUrl={card.card_design.image_url ?? undefined}
                cardType={card.card_design.card_type}
                scale={0.65}
              />
              {card.count > 1 && (
                <View style={[styles.countBadge, { backgroundColor: RARITY_COLORS[card.card_design.rarity].primary }]}>
                  <Text style={styles.countText}>×{card.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Card Modal */}
      <CardModal />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchbar: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  searchInput: {
    color: '#f8fafc',
  },
  filterChips: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: spacing.sm,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  chipText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  cardsScroll: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  cardWrapper: {
    position: 'relative',
  },
  cardWrapperPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContentDesktop: {
    width: '80%',
    maxWidth: 1000,
  },
  modalGradient: {
    padding: spacing.lg,
  },
  modalScroll: {
    paddingBottom: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 18,
  },
  modalLayout: {
    flexDirection: 'column',
  },
  modalLayoutDesktop: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  cardShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  cardShowcaseDesktop: {
    flex: 1,
    paddingVertical: spacing.xl * 2,
  },
  cardGlow: {
    position: 'absolute',
    width: 300,
    height: 400,
    borderRadius: 150,
    filter: 'blur(60px)',
  },
  rarityBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  rarityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cardDetails: {
    paddingTop: spacing.md,
  },
  cardDetailsDesktop: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  cardName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardType: {
    color: '#94a3b8',
    fontSize: 14,
  },
  cardCost: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  accordionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  accordionIcon: {
    color: '#64748b',
    fontSize: 12,
  },
  accordionContent: {
    paddingBottom: spacing.md,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  detailRow: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  flavorText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  instancesScroll: {
    maxHeight: 200,
  },
  instanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  instanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instanceSerial: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  instanceEdition: {
    color: '#64748b',
    fontSize: 12,
  },
  instanceDate: {
    color: '#64748b',
    fontSize: 11,
  },
  supplyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  supplyLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  supplyValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
});
