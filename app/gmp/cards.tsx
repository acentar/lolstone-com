import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, Card, Button, TextInput, Modal, Portal, 
  Chip, FAB, Searchbar, SegmentedButtons, IconButton,
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign, CardRarity, CardType } from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const CARD_TYPES: CardType[] = ['meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment'];

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

export default function CardDesignerScreen() {
  const { gameMaster } = useAuthContext();
  const [cards, setCards] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState<Partial<CardDesign>>({
    name: '',
    description: '',
    ability_text: '',
    flavor_text: '',
    mana_cost: 1,
    attack: 1,
    health: 1,
    rarity: 'common',
    card_type: 'meme_minion',
    max_supply: null,
  });
  const [saving, setSaving] = useState(false);

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

  const handleSaveCard = async () => {
    if (!formData.name) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('card_designs')
        .insert({
          ...formData,
          created_by: gameMaster?.id,
        });

      if (error) throw error;

      setModalVisible(false);
      resetForm();
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ability_text: '',
      flavor_text: '',
      mana_cost: 1,
      attack: 1,
      health: 1,
      rarity: 'common',
      card_type: 'meme_minion',
      max_supply: null,
    });
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
    return matchesSearch && matchesRarity;
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
            <Text style={styles.title}>Card Designer</Text>
            <Text style={styles.subtitle}>{cards.length} designs created</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filtersRow}>
          <Searchbar
            placeholder="Search cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <Chip
            selected={filterRarity === 'all'}
            onPress={() => setFilterRarity('all')}
            style={styles.chip}
          >
            All
          </Chip>
          {RARITIES.map(rarity => (
            <Chip
              key={rarity}
              selected={filterRarity === rarity}
              onPress={() => setFilterRarity(rarity)}
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
                {searchQuery ? 'Try a different search' : 'Create your first meme card design!'}
              </Text>
              {!searchQuery && (
                <Button mode="contained" onPress={() => setModalVisible(true)} style={styles.emptyButton}>
                  Create First Card
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <Card key={card.id} style={styles.cardItem} mode="elevated">
                <View style={[styles.cardRarityBar, { backgroundColor: RARITY_COLORS[card.rarity] }]} />
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    <View style={styles.manaBadge}>
                      <Text style={styles.manaText}>{card.mana_cost}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardType}>{TYPE_LABELS[card.card_type]}</Text>
                  {card.ability_text && (
                    <Text style={styles.cardAbility} numberOfLines={2}>{card.ability_text}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    {(card.card_type === 'meme_minion' || card.card_type === 'troll_legendary') && (
                      <Text style={styles.cardStats}>⚔️ {card.attack}  ❤️ {card.health}</Text>
                    )}
                    <Text style={styles.cardMinted}>{card.total_minted} minted</Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        color={adminColors.onPrimary}
      />

      {/* Create Card Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Card Design</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>

            <TextInput
              label="Card Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.statsRow}>
              <TextInput
                label="Mana"
                value={String(formData.mana_cost || 0)}
                onChangeText={(text) => setFormData({ ...formData, mana_cost: parseInt(text) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.smallInput]}
              />
              <TextInput
                label="Attack"
                value={String(formData.attack || 0)}
                onChangeText={(text) => setFormData({ ...formData, attack: parseInt(text) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.smallInput]}
              />
              <TextInput
                label="Health"
                value={String(formData.health || 0)}
                onChangeText={(text) => setFormData({ ...formData, health: parseInt(text) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.smallInput]}
              />
            </View>

            <Text style={styles.inputLabel}>Rarity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {RARITIES.map((rarity) => (
                <Chip
                  key={rarity}
                  selected={formData.rarity === rarity}
                  onPress={() => setFormData({ ...formData, rarity })}
                  style={[styles.optionChip, { borderColor: RARITY_COLORS[rarity] }]}
                  selectedColor={RARITY_COLORS[rarity]}
                >
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Card Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {CARD_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={formData.card_type === type}
                  onPress={() => setFormData({ ...formData, card_type: type })}
                  style={styles.optionChip}
                >
                  {TYPE_LABELS[type]}
                </Chip>
              ))}
            </ScrollView>

            <TextInput
              label="Ability Text"
              value={formData.ability_text || ''}
              onChangeText={(text) => setFormData({ ...formData, ability_text: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Flavor Text"
              value={formData.flavor_text || ''}
              onChangeText={(text) => setFormData({ ...formData, flavor_text: text })}
              mode="outlined"
              style={styles.input}
              placeholder="Witty quote or meme reference"
            />

            <TextInput
              label="Max Supply (optional)"
              value={formData.max_supply ? String(formData.max_supply) : ''}
              onChangeText={(text) => setFormData({ ...formData, max_supply: text ? parseInt(text) : null })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="Leave empty for unlimited"
            />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveCard} 
                loading={saving}
                disabled={!formData.name || saving}
                style={styles.saveButton}
              >
                Create Card
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  filtersRow: {
    marginBottom: adminSpacing.sm,
  },
  searchbar: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    elevation: 0,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  searchInput: {
    fontSize: 14,
  },
  chipRow: {
    marginBottom: adminSpacing.lg,
  },
  chip: {
    marginRight: adminSpacing.sm,
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
    fontSize: 48,
    marginBottom: adminSpacing.md,
  },
  emptyTitle: {
    fontSize: 18,
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
    gap: adminSpacing.md,
  },
  cardItem: {
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
  },
  cardRarityBar: {
    height: 4,
  },
  cardContent: {
    padding: adminSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: adminColors.textPrimary,
    flex: 1,
  },
  manaBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cardType: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.sm,
  },
  cardAbility: {
    fontSize: 13,
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.sm,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.borderLight,
  },
  cardStats: {
    fontSize: 13,
    color: adminColors.textSecondary,
  },
  cardMinted: {
    fontSize: 12,
    color: adminColors.textMuted,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: adminSpacing.lg,
    bottom: adminSpacing.lg,
    backgroundColor: adminColors.primary,
  },

  // Modal
  modal: {
    backgroundColor: adminColors.surface,
    margin: adminSpacing.lg,
    padding: adminSpacing.lg,
    borderRadius: adminRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  input: {
    marginBottom: adminSpacing.md,
    backgroundColor: adminColors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  smallInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.sm,
  },
  optionsScroll: {
    marginBottom: adminSpacing.md,
  },
  optionChip: {
    marginRight: adminSpacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  cancelButton: {
    borderRadius: adminRadius.md,
  },
  saveButton: {
    borderRadius: adminRadius.md,
  },
});
