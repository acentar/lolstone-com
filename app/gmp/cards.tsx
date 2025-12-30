import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign, CardRarity, CardType } from '../../src/types/database';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/constants/theme';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const CARD_TYPES: CardType[] = ['meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment'];

const RARITY_COLORS: Record<CardRarity, string> = {
  common: colors.common,
  uncommon: colors.uncommon,
  rare: colors.rare,
  epic: colors.epic,
  legendary: colors.legendary,
};

const TYPE_EMOJIS: Record<CardType, string> = {
  meme_minion: '😂',
  viral_spell: '🌐',
  troll_legendary: '🧌',
  reaction_trap: '😱',
  copypasta_enchantment: '📜',
};

function CardPreview({ card }: { card: Partial<CardDesign> }) {
  const rarityColor = RARITY_COLORS[card.rarity || 'common'];
  
  return (
    <View style={[styles.cardPreview, { borderColor: rarityColor }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {card.name || 'Card Name'}
        </Text>
        <View style={[styles.manaCost, { backgroundColor: colors.rare }]}>
          <Text style={styles.manaText}>{card.mana_cost ?? 0}</Text>
        </View>
      </View>

      {/* Card Art Area */}
      <View style={styles.cardArtArea}>
        <Text style={styles.cardArtPlaceholder}>
          {TYPE_EMOJIS[card.card_type || 'meme_minion']}
        </Text>
      </View>

      {/* Card Type */}
      <View style={styles.cardTypeBar}>
        <Text style={styles.cardTypeText}>
          {(card.card_type || 'meme_minion').replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      {/* Card Text */}
      <View style={styles.cardTextArea}>
        <Text style={styles.abilityText} numberOfLines={2}>
          {card.ability_text || 'Ability text goes here...'}
        </Text>
        <Text style={styles.flavorText} numberOfLines={1}>
          {card.flavor_text || '"Flavor text"'}
        </Text>
      </View>

      {/* Stats */}
      {card.card_type === 'meme_minion' || card.card_type === 'troll_legendary' ? (
        <View style={styles.statsRow}>
          <View style={[styles.statBadge, styles.attackBadge]}>
            <Text style={styles.statText}>{card.attack ?? 0}</Text>
          </View>
          <View style={styles.rarityBadge}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {(card.rarity || 'common').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statBadge, styles.healthBadge]}>
            <Text style={styles.statText}>{card.health ?? 0}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.rarityBadge}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {(card.rarity || 'common').toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function CardDesignerScreen() {
  const { gameMaster } = useAuthContext();
  const [cards, setCards] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
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
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setSaving(false);
    }
  };

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Card Designer</Text>
            <Text style={styles.subtitle}>{cards.length} designs created</Text>
          </View>
          <Pressable style={styles.createButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.createButtonText}>+ New Card</Text>
          </Pressable>
        </View>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎨</Text>
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptyText}>
              Create your first meme card design!
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {cards.map((card) => (
              <Pressable key={card.id} style={styles.cardWrapper}>
                <CardPreview card={card} />
                <Text style={styles.cardMintCount}>
                  {card.total_minted} minted
                  {card.max_supply ? ` / ${card.max_supply}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Card Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Design New Card</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </Pressable>
              </View>

              {/* Live Preview */}
              <View style={styles.previewSection}>
                <CardPreview card={formData} />
              </View>

              {/* Form */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CARD NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g., Doge of Wall Street"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>MANA</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.mana_cost || 0)}
                      onChangeText={(text) => setFormData({ ...formData, mana_cost: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>ATTACK</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.attack || 0)}
                      onChangeText={(text) => setFormData({ ...formData, attack: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>HEALTH</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.health || 0)}
                      onChangeText={(text) => setFormData({ ...formData, health: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>RARITY</Text>
                  <View style={styles.optionsRow}>
                    {RARITIES.map((r) => (
                      <Pressable
                        key={r}
                        style={[
                          styles.optionButton,
                          formData.rarity === r && { borderColor: RARITY_COLORS[r], backgroundColor: `${RARITY_COLORS[r]}20` },
                        ]}
                        onPress={() => setFormData({ ...formData, rarity: r })}
                      >
                        <Text style={[styles.optionText, { color: RARITY_COLORS[r] }]}>
                          {r.charAt(0).toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CARD TYPE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.optionsRow}>
                      {CARD_TYPES.map((t) => (
                        <Pressable
                          key={t}
                          style={[
                            styles.typeButton,
                            formData.card_type === t && styles.typeButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, card_type: t })}
                        >
                          <Text style={styles.typeEmoji}>{TYPE_EMOJIS[t]}</Text>
                          <Text style={[
                            styles.typeText,
                            formData.card_type === t && styles.typeTextActive,
                          ]}>
                            {t.replace('_', ' ')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ABILITY TEXT</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.ability_text || ''}
                    onChangeText={(text) => setFormData({ ...formData, ability_text: text })}
                    placeholder="What does this card do?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FLAVOR TEXT</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.flavor_text || ''}
                    onChangeText={(text) => setFormData({ ...formData, flavor_text: text })}
                    placeholder="Witty quote or meme reference"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MAX SUPPLY (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.max_supply ? String(formData.max_supply) : ''}
                    onChangeText={(text) => setFormData({ ...formData, max_supply: text ? parseInt(text) : null })}
                    placeholder="Leave empty for unlimited"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <Pressable
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSaveCard}
                  disabled={saving || !formData.name}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Create Card Design'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    ...typography.label,
    color: colors.background,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardMintCount: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 9,
  },

  // Card Preview
  cardPreview: {
    width: 160,
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
  },
  cardName: {
    ...typography.cardName,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  manaCost: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaText: {
    ...typography.cardStat,
    color: colors.textPrimary,
    fontSize: 14,
  },
  cardArtArea: {
    height: 70,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArtPlaceholder: {
    fontSize: 40,
  },
  cardTypeBar: {
    backgroundColor: colors.backgroundTertiary,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  cardTypeText: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 7,
    textAlign: 'center',
  },
  cardTextArea: {
    flex: 1,
    padding: spacing.sm,
  },
  abilityText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 12,
  },
  flavorText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  statBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attackBadge: {
    backgroundColor: colors.secondary,
  },
  healthBadge: {
    backgroundColor: colors.success,
  },
  statText: {
    ...typography.cardStat,
    color: colors.textPrimary,
    fontSize: 14,
  },
  rarityBadge: {
    flex: 1,
    alignItems: 'center',
  },
  rarityText: {
    ...typography.label,
    fontSize: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textMuted,
    padding: spacing.sm,
  },

  // Preview Section
  previewSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
  },

  // Form
  formSection: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...typography.label,
    fontSize: 14,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  typeText: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 8,
  },
  typeTextActive: {
    color: colors.primary,
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.label,
    color: colors.background,
  },
});

