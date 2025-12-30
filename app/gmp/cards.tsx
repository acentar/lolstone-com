import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, Card, Button, TextInput, Modal, Portal, 
  Chip, FAB, Searchbar, IconButton, Switch, Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { 
  CardDesign, CardRarity, CardType, CardCategory, CardKeyword,
  EffectTrigger, EffectTarget, EffectAction,
  KEYWORD_INFO, TRIGGER_INFO, ACTION_INFO, TARGET_INFO,
} from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const CARD_TYPES: CardType[] = ['meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment'];
const CATEGORIES: CardCategory[] = ['unit', 'action'];
const KEYWORDS: CardKeyword[] = ['frontline', 'quick', 'evasion', 'boost'];
const TRIGGERS: EffectTrigger[] = ['on_play', 'on_destroy', 'on_attack', 'on_damaged', 'end_of_turn', 'start_of_turn'];
const TARGETS: EffectTarget[] = ['self', 'friendly_unit', 'enemy_unit', 'any_unit', 'friendly_player', 'enemy_player', 'all_friendly', 'all_enemies', 'random_enemy'];
const ACTIONS: EffectAction[] = ['damage', 'heal', 'draw', 'buff_attack', 'buff_health', 'destroy', 'silence'];

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

interface EffectForm {
  trigger: EffectTrigger;
  target: EffectTarget;
  action: EffectAction;
  value: number;
  description: string;
}

interface CardFormData {
  name: string;
  description: string;
  ability_text: string;
  flavor_text: string;
  mana_cost: number;
  base_attack: number;
  base_health: number;
  rarity: CardRarity;
  card_type: CardType;
  category: CardCategory;
  max_supply: number | null;
  keywords: CardKeyword[];
  effects: EffectForm[];
}

const initialFormData: CardFormData = {
  name: '',
  description: '',
  ability_text: '',
  flavor_text: '',
  mana_cost: 1,
  base_attack: 1,
  base_health: 1,
  rarity: 'common',
  card_type: 'meme_minion',
  category: 'unit',
  max_supply: null,
  keywords: [],
  effects: [],
};

const initialEffect: EffectForm = {
  trigger: 'on_play',
  target: 'enemy_unit',
  action: 'damage',
  value: 1,
  description: '',
};

export default function CardDesignerScreen() {
  const { gameMaster } = useAuthContext();
  const [cards, setCards] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState<CardFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [showEffectForm, setShowEffectForm] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectForm>(initialEffect);

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
      // Insert card design
      const { data: cardData, error: cardError } = await supabase
        .from('card_designs')
        .insert({
          name: formData.name,
          description: formData.description || null,
          ability_text: generateAbilityText(),
          flavor_text: formData.flavor_text || null,
          mana_cost: formData.mana_cost,
          attack: formData.category === 'unit' ? formData.base_attack : null,
          health: formData.category === 'unit' ? formData.base_health : null,
          base_attack: formData.category === 'unit' ? formData.base_attack : 0,
          base_health: formData.category === 'unit' ? formData.base_health : 0,
          rarity: formData.rarity,
          card_type: formData.card_type,
          category: formData.category,
          max_supply: formData.max_supply,
          created_by: gameMaster?.id,
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Insert keywords
      if (formData.keywords.length > 0) {
        const keywordInserts = formData.keywords.map(keyword => ({
          card_design_id: cardData.id,
          keyword,
        }));
        await supabase.from('card_keywords').insert(keywordInserts);
      }

      // Insert effects
      if (formData.effects.length > 0) {
        const effectInserts = formData.effects.map((effect, index) => ({
          card_design_id: cardData.id,
          trigger: effect.trigger,
          target: effect.target,
          action: effect.action,
          value: effect.value,
          description: effect.description || null,
          priority: index,
        }));
        await supabase.from('card_effects').insert(effectInserts);
      }

      setModalVisible(false);
      resetForm();
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateAbilityText = (): string => {
    const parts: string[] = [];
    
    // Add keywords
    formData.keywords.forEach(kw => {
      parts.push(KEYWORD_INFO[kw].name);
    });
    
    // Add effects
    formData.effects.forEach(effect => {
      const actionInfo = ACTION_INFO[effect.action];
      const targetInfo = TARGET_INFO[effect.target];
      const triggerInfo = TRIGGER_INFO[effect.trigger];
      
      let text = '';
      if (effect.trigger !== 'on_play' || formData.category !== 'action') {
        text += `${triggerInfo.name}: `;
      }
      
      switch (effect.action) {
        case 'damage':
          text += `Deal ${effect.value} damage to ${targetInfo.name}`;
          break;
        case 'heal':
          text += `Heal ${effect.value} to ${targetInfo.name}`;
          break;
        case 'draw':
          text += `Draw ${effect.value} card${effect.value > 1 ? 's' : ''}`;
          break;
        case 'buff_attack':
          text += `Give ${targetInfo.name} +${effect.value} Attack`;
          break;
        case 'buff_health':
          text += `Give ${targetInfo.name} +${effect.value} Health`;
          break;
        case 'destroy':
          text += `Destroy ${targetInfo.name}`;
          break;
        case 'silence':
          text += `Silence ${targetInfo.name}`;
          break;
        default:
          text += effect.description || `${actionInfo.name} ${targetInfo.name}`;
      }
      parts.push(text);
    });
    
    return parts.join('. ') + (parts.length > 0 ? '.' : '');
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentEffect(initialEffect);
    setShowEffectForm(false);
  };

  const toggleKeyword = (keyword: CardKeyword) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter(k => k !== keyword)
        : [...prev.keywords, keyword],
    }));
  };

  const addEffect = () => {
    setFormData(prev => ({
      ...prev,
      effects: [...prev.effects, currentEffect],
    }));
    setCurrentEffect(initialEffect);
    setShowEffectForm(false);
  };

  const removeEffect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      effects: prev.effects.filter((_, i) => i !== index),
    }));
  };

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
            <Text style={styles.title}>Card Designer</Text>
            <Text style={styles.subtitle}>{cards.length} designs created</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <Searchbar
          placeholder="Search cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
              icon="sword"
            >
              Units
            </Chip>
            <Chip
              selected={filterCategory === 'action'}
              onPress={() => setFilterCategory('action')}
              style={styles.chip}
              icon="flash"
            >
              Actions
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
        </View>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No cards found' : 'No Cards Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search' : 'Create your first card!'}
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
                    <View style={styles.cardTitleRow}>
                      <Chip compact style={styles.categoryChip}>
                        {(card as any).category === 'action' ? '⚡' : '⚔️'}
                      </Chip>
                      <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    </View>
                    <View style={styles.manaBadge}>
                      <Text style={styles.manaText}>{card.mana_cost}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardType}>{TYPE_LABELS[card.card_type]}</Text>
                  {card.ability_text && (
                    <Text style={styles.cardAbility} numberOfLines={2}>{card.ability_text}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    {(card as any).category === 'unit' && (
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

            {/* Category Toggle */}
            <Text style={styles.inputLabel}>Card Type</Text>
            <SegmentedButtons
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as CardCategory })}
              buttons={[
                { value: 'unit', label: '⚔️ Unit', icon: 'sword' },
                { value: 'action', label: '⚡ Action', icon: 'flash' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Card Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />

            {/* Stats (only for units) */}
            {formData.category === 'unit' && (
              <View style={styles.statsRow}>
                <TextInput
                  label="Cost"
                  value={String(formData.mana_cost)}
                  onChangeText={(text) => setFormData({ ...formData, mana_cost: parseInt(text) || 0 })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.smallInput]}
                />
                <TextInput
                  label="Attack"
                  value={String(formData.base_attack)}
                  onChangeText={(text) => setFormData({ ...formData, base_attack: parseInt(text) || 0 })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.smallInput]}
                />
                <TextInput
                  label="Health"
                  value={String(formData.base_health)}
                  onChangeText={(text) => setFormData({ ...formData, base_health: parseInt(text) || 0 })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.smallInput]}
                />
              </View>
            )}

            {formData.category === 'action' && (
              <TextInput
                label="Bandwidth Cost"
                value={String(formData.mana_cost)}
                onChangeText={(text) => setFormData({ ...formData, mana_cost: parseInt(text) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
            )}

            {/* Rarity */}
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

            {/* Theme Type */}
            <Text style={styles.inputLabel}>Theme</Text>
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

            <Divider style={styles.divider} />

            {/* Keywords (for units) */}
            {formData.category === 'unit' && (
              <>
                <Text style={styles.inputLabel}>Keywords</Text>
                <View style={styles.keywordsGrid}>
                  {KEYWORDS.map((kw) => (
                    <Chip
                      key={kw}
                      selected={formData.keywords.includes(kw)}
                      onPress={() => toggleKeyword(kw)}
                      style={styles.keywordChip}
                      icon={() => <Text>{KEYWORD_INFO[kw].icon}</Text>}
                    >
                      {KEYWORD_INFO[kw].name}
                    </Chip>
                  ))}
                </View>
              </>
            )}

            {/* Effects */}
            <View style={styles.effectsSection}>
              <View style={styles.effectsHeader}>
                <Text style={styles.inputLabel}>Effects</Text>
                <Button 
                  mode="text" 
                  compact 
                  onPress={() => setShowEffectForm(true)}
                  icon="plus"
                >
                  Add Effect
                </Button>
              </View>

              {formData.effects.map((effect, index) => (
                <Card key={index} style={styles.effectCard} mode="outlined">
                  <Card.Content style={styles.effectCardContent}>
                    <View style={styles.effectInfo}>
                      <Text style={styles.effectTrigger}>
                        {TRIGGER_INFO[effect.trigger].icon} {TRIGGER_INFO[effect.trigger].name}
                      </Text>
                      <Text style={styles.effectDesc}>
                        {ACTION_INFO[effect.action].icon} {ACTION_INFO[effect.action].name} ({effect.value}) → {TARGET_INFO[effect.target].name}
                      </Text>
                    </View>
                    <IconButton icon="close" size={16} onPress={() => removeEffect(index)} />
                  </Card.Content>
                </Card>
              ))}

              {showEffectForm && (
                <Card style={styles.effectFormCard} mode="outlined">
                  <Card.Content>
                    <Text style={styles.effectFormTitle}>New Effect</Text>
                    
                    <Text style={styles.effectLabel}>Trigger</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {TRIGGERS.map((trigger) => (
                        <Chip
                          key={trigger}
                          selected={currentEffect.trigger === trigger}
                          onPress={() => setCurrentEffect({ ...currentEffect, trigger })}
                          style={styles.effectChip}
                          compact
                        >
                          {TRIGGER_INFO[trigger].icon} {TRIGGER_INFO[trigger].name}
                        </Chip>
                      ))}
                    </ScrollView>

                    <Text style={styles.effectLabel}>Action</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {ACTIONS.map((action) => (
                        <Chip
                          key={action}
                          selected={currentEffect.action === action}
                          onPress={() => setCurrentEffect({ ...currentEffect, action })}
                          style={styles.effectChip}
                          compact
                        >
                          {ACTION_INFO[action].icon} {ACTION_INFO[action].name}
                        </Chip>
                      ))}
                    </ScrollView>

                    <Text style={styles.effectLabel}>Target</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {TARGETS.map((target) => (
                        <Chip
                          key={target}
                          selected={currentEffect.target === target}
                          onPress={() => setCurrentEffect({ ...currentEffect, target })}
                          style={styles.effectChip}
                          compact
                        >
                          {TARGET_INFO[target].name}
                        </Chip>
                      ))}
                    </ScrollView>

                    <TextInput
                      label="Value"
                      value={String(currentEffect.value)}
                      onChangeText={(text) => setCurrentEffect({ ...currentEffect, value: parseInt(text) || 0 })}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.effectValueInput}
                    />

                    <View style={styles.effectFormActions}>
                      <Button mode="outlined" onPress={() => setShowEffectForm(false)}>Cancel</Button>
                      <Button mode="contained" onPress={addEffect}>Add Effect</Button>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </View>

            <Divider style={styles.divider} />

            <TextInput
              label="Flavor Text (optional)"
              value={formData.flavor_text}
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

            {/* Preview */}
            <Card style={styles.previewCard} mode="outlined">
              <Card.Content>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewAbility}>{generateAbilityText() || 'No abilities'}</Text>
              </Card.Content>
            </Card>

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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryChip: {
    marginRight: adminSpacing.xs,
    height: 24,
  },
  cardName: {
    fontSize: 15,
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
    margin: adminSpacing.md,
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
  segmentedButtons: {
    marginBottom: adminSpacing.md,
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
  divider: {
    marginVertical: adminSpacing.lg,
  },
  keywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  keywordChip: {
    marginBottom: adminSpacing.xs,
  },

  // Effects
  effectsSection: {
    marginBottom: adminSpacing.md,
  },
  effectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  effectCard: {
    marginBottom: adminSpacing.sm,
    borderColor: adminColors.border,
  },
  effectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  effectInfo: {
    flex: 1,
  },
  effectTrigger: {
    fontSize: 12,
    color: adminColors.accent,
    fontWeight: '600',
  },
  effectDesc: {
    fontSize: 13,
    color: adminColors.textPrimary,
    marginTop: 2,
  },
  effectFormCard: {
    borderColor: adminColors.accent,
    backgroundColor: adminColors.accentLight,
  },
  effectFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.md,
  },
  effectLabel: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  effectChip: {
    marginRight: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  effectValueInput: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.surface,
  },
  effectFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },

  // Preview
  previewCard: {
    marginBottom: adminSpacing.lg,
    borderColor: adminColors.border,
    backgroundColor: adminColors.surfaceVariant,
  },
  previewTitle: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.xs,
  },
  previewAbility: {
    fontSize: 14,
    color: adminColors.textPrimary,
    fontStyle: 'italic',
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
