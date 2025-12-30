import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, FAB, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { CardDesign, CardRarity, CardType, CardCategory } from '../../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../../src/constants/adminTheme';
import CardPreview from '../../../src/components/CardPreview';
import CardDetailModal from '../../../src/components/CardDetailModal';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_COLORS: Record<CardRarity, string> = {
  common: adminColors.common,
  uncommon: adminColors.uncommon,
  rare: adminColors.rare,
  epic: adminColors.epic,
  legendary: adminColors.legendary,
};

const TYPE_LABELS: Record<CardType, string> = {
  meme_minion: 'Meme Minion',
  viral_spell: 'Viral Spell',
  troll_legendary: 'Troll Legendary',
  reaction_trap: 'Reaction Trap',
  copypasta_enchantment: 'Copypasta',
};

export default function CardsListScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openCardDetail = (card: CardDesign) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const closeCardDetail = () => {
    setModalVisible(false);
    setSelectedCard(null);
  };

  const handleEditCard = (card: CardDesign) => {
    // Navigate to edit page (we can reuse the new page with card data)
    router.push(`/gmp/cards/edit?id=${card.id}`);
  };

  const handleDeleteCard = (cardId: string) => {
    // Remove from local state
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('card_designs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
    const matchesCategory = filterCategory === 'all' || (card as any).category === filterCategory;
    return matchesSearch && matchesRarity && matchesCategory;
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Card Library</Text>
            <Text style={styles.subtitle}>{cards.length} designs in collection</Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => router.push('/gmp/cards/new')}
            icon="plus"
          >
            New Card
          </Button>
        </View>

        {/* Search & Filters */}
        <Searchbar
          placeholder="Search cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          <Chip
            selected={filterCategory === 'all'}
            onPress={() => setFilterCategory('all')}
            style={styles.chip}
          >
            All Types
          </Chip>
          <Chip
            selected={filterCategory === 'unit'}
            onPress={() => setFilterCategory('unit')}
            style={styles.chip}
          >
            ⚔️ Units
          </Chip>
          <Chip
            selected={filterCategory === 'action'}
            onPress={() => setFilterCategory('action')}
            style={styles.chip}
          >
            ⚡ Actions
          </Chip>
          <View style={styles.filterDivider} />
          {RARITIES.map(rarity => (
            <Chip
              key={rarity}
              selected={filterRarity === rarity}
              onPress={() => setFilterRarity(filterRarity === rarity ? 'all' : rarity)}
              style={[styles.chip, { borderColor: RARITY_COLORS[rarity] }]}
              selectedColor={RARITY_COLORS[rarity]}
            >
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No cards found' : 'No Cards Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search' : 'Create your first internet meme card!'}
              </Text>
              {!searchQuery && (
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/gmp/cards/new')} 
                  style={styles.emptyButton}
                  icon="plus"
                >
                  Design First Card
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <View key={card.id} style={styles.cardWrapper}>
                <CardPreview
                  name={card.name}
                  manaCost={card.mana_cost}
                  attack={card.attack ?? 0}
                  health={card.health ?? 0}
                  rarity={card.rarity}
                  category={card.category || 'unit'}
                  abilityText={card.ability_text || ''}
                  flavorText={card.flavor_text || ''}
                  cardType={card.card_type}
                  imageUrl={card.image_url ?? undefined}
                  scale={0.65}
                  showCollectibleInfo={false}
                  onPress={() => openCardDetail(card)}
                />
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMinted}>{card.total_minted} minted</Text>
                  {card.max_supply && (
                    <Text style={styles.cardSupply}>/ {card.max_supply}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/gmp/cards/new')}
        color="#fff"
      />

      {/* Card Detail Modal */}
      <CardDetailModal
        visible={modalVisible}
        onClose={closeCardDetail}
        cardDesign={selectedCard}
        isGameMaster={true}
        onEdit={handleEditCard}
        onDelete={handleDeleteCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: adminSpacing.lg,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  // Filters
  searchbar: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.md,
    elevation: 0,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filtersRow: {
    marginBottom: adminSpacing.lg,
  },
  chip: {
    marginRight: adminSpacing.sm,
  },
  filterDivider: {
    width: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: adminSpacing.sm,
    alignSelf: 'center',
    height: 20,
  },

  // Empty State
  emptyCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
  },
  emptyContent: {
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: adminSpacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: adminColors.textSecondary,
    textAlign: 'center',
    marginBottom: adminSpacing.lg,
  },
  emptyButton: {
    borderRadius: adminRadius.md,
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.lg,
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: adminSpacing.sm,
  },
  cardMinted: {
    fontSize: 12,
    color: adminColors.textSecondary,
  },
  cardSupply: {
    fontSize: 12,
    color: adminColors.textMuted,
    marginLeft: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: adminSpacing.lg,
    bottom: adminSpacing.lg,
    backgroundColor: adminColors.primary,
  },
});

