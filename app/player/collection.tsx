import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign, CardRarity } from '../../src/types/database';
import CardPreview from '../../src/components/CardPreview';
import { spacing } from '../../src/constants/theme';

interface OwnedCard {
  card_instance_id: string;
  card_design: CardDesign;
  count: number;
}

const RARITY_FILTERS: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export default function CollectionScreen() {
  const { player } = useAuthContext();
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);

  useEffect(() => {
    loadCollection();
  }, [player?.id]);

  const loadCollection = async () => {
    if (!player?.id) return;

    setLoading(true);
    try {
      // Get all card instances owned by the player with their designs
      const { data, error } = await supabase
        .from('card_instances')
        .select(`
          id,
          design_id,
          card_designs (*)
        `)
        .eq('owner_id', player.id);

      if (error) throw error;

      // Group by design and count
      const cardMap = new Map<string, OwnedCard>();
      
      for (const instance of data || []) {
        const designId = instance.design_id;
        if (cardMap.has(designId)) {
          cardMap.get(designId)!.count++;
        } else {
          cardMap.set(designId, {
            card_instance_id: instance.id,
            card_design: instance.card_designs as unknown as CardDesign,
            count: 1,
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

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.subtitle}>{cards.length} unique cards</Text>
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
              style={styles.chip}
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
              ? 'Cards you receive from the Game Master will appear here!'
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
            <Pressable key={card.card_instance_id} style={styles.cardWrapper}>
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
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>×{card.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
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
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#3b82f6',
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
});

