import { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { 
  Text, Button, TextInput, Chip, Divider, IconButton, Card,
  SegmentedButtons, Switch,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuthContext } from '../../../src/context/AuthContext';
import { 
  CardRarity, CardType, CardCategory, CardKeyword,
  EffectTrigger, EffectTarget, EffectAction,
  KEYWORD_INFO, TRIGGER_INFO, ACTION_INFO, TARGET_INFO,
} from '../../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../../src/constants/adminTheme';
import CardPreview from '../../../src/components/CardPreview';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const CARD_TYPES: CardType[] = ['meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment'];
const KEYWORDS: CardKeyword[] = ['frontline', 'quick', 'evasion', 'boost'];
const TRIGGERS: EffectTrigger[] = ['on_play', 'on_destroy', 'on_attack', 'on_damaged'];
const TARGETS: EffectTarget[] = ['enemy_unit', 'any_unit', 'enemy_player', 'friendly_unit', 'self', 'all_enemies', 'random_enemy'];
const ACTIONS: EffectAction[] = ['damage', 'heal', 'draw', 'buff_attack', 'buff_health', 'destroy'];

const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const TYPE_LABELS: Record<CardType, string> = {
  meme_minion: '😂 Meme Minion',
  viral_spell: '🌐 Viral Spell',
  troll_legendary: '🧌 Troll Legendary',
  reaction_trap: '😱 Reaction Trap',
  copypasta_enchantment: '📜 Copypasta',
};

interface EffectForm {
  trigger: EffectTrigger;
  target: EffectTarget;
  action: EffectAction;
  value: number;
}

interface CardFormData {
  name: string;
  flavorText: string;
  manaCost: number;
  attack: number;
  health: number;
  rarity: CardRarity;
  cardType: CardType;
  category: CardCategory;
  maxSupply: number | null;
  keywords: CardKeyword[];
  effects: EffectForm[];
}

const initialFormData: CardFormData = {
  name: '',
  flavorText: '',
  manaCost: 1,
  attack: 1,
  health: 1,
  rarity: 'common',
  cardType: 'meme_minion',
  category: 'unit',
  maxSupply: null,
  keywords: [],
  effects: [],
};

export default function CardDesignerPage() {
  const router = useRouter();
  const { gameMaster } = useAuthContext();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 900;

  const [formData, setFormData] = useState<CardFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [showEffectBuilder, setShowEffectBuilder] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectForm>({
    trigger: 'on_play',
    target: 'enemy_unit',
    action: 'damage',
    value: 1,
  });

  const generateAbilityText = (): string => {
    const parts: string[] = [];
    
    formData.keywords.forEach(kw => {
      parts.push(KEYWORD_INFO[kw].name);
    });
    
    formData.effects.forEach(effect => {
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
        default:
          text += `${ACTION_INFO[effect.action].name} ${targetInfo.name}`;
      }
      parts.push(text);
    });
    
    return parts.join('. ') + (parts.length > 0 ? '.' : '');
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
    setCurrentEffect({ trigger: 'on_play', target: 'enemy_unit', action: 'damage', value: 1 });
    setShowEffectBuilder(false);
  };

  const removeEffect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      effects: prev.effects.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSaving(true);
    try {
      const abilityText = generateAbilityText();
      
      const { data: cardData, error: cardError } = await supabase
        .from('card_designs')
        .insert({
          name: formData.name,
          ability_text: abilityText || null,
          flavor_text: formData.flavorText || null,
          mana_cost: formData.manaCost,
          attack: formData.category === 'unit' ? formData.attack : null,
          health: formData.category === 'unit' ? formData.health : null,
          base_attack: formData.category === 'unit' ? formData.attack : 0,
          base_health: formData.category === 'unit' ? formData.health : 0,
          rarity: formData.rarity,
          card_type: formData.cardType,
          category: formData.category,
          max_supply: formData.maxSupply,
          created_by: gameMaster?.id,
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Insert keywords
      if (formData.keywords.length > 0) {
        await supabase.from('card_keywords').insert(
          formData.keywords.map(keyword => ({
            card_design_id: cardData.id,
            keyword,
          }))
        );
      }

      // Insert effects
      if (formData.effects.length > 0) {
        await supabase.from('card_effects').insert(
          formData.effects.map((effect, index) => ({
            card_design_id: cardData.id,
            trigger: effect.trigger,
            target: effect.target,
            action: effect.action,
            value: effect.value,
            priority: index,
          }))
        );
      }

      router.back();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.formContent}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Library</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Design New Card</Text>

        {/* Category Toggle */}
        <Text style={styles.sectionTitle}>Card Category</Text>
        <SegmentedButtons
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as CardCategory })}
          buttons={[
            { value: 'unit', label: '⚔️ Unit' },
            { value: 'action', label: '⚡ Action' },
          ]}
          style={styles.segmented}
        />

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <TextInput
          label="Card Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Doge of Wall Street"
        />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statInput}>
            <Text style={styles.statLabel}>💎 Cost</Text>
            <View style={styles.numberInput}>
              <IconButton 
                icon="minus" 
                size={16} 
                onPress={() => setFormData(prev => ({ ...prev, manaCost: Math.max(0, prev.manaCost - 1) }))} 
              />
              <Text style={styles.numberValue}>{formData.manaCost}</Text>
              <IconButton 
                icon="plus" 
                size={16} 
                onPress={() => setFormData(prev => ({ ...prev, manaCost: Math.min(10, prev.manaCost + 1) }))} 
              />
            </View>
          </View>

          {formData.category === 'unit' && (
            <>
              <View style={styles.statInput}>
                <Text style={styles.statLabel}>⚔️ Attack</Text>
                <View style={styles.numberInput}>
                  <IconButton 
                    icon="minus" 
                    size={16} 
                    onPress={() => setFormData(prev => ({ ...prev, attack: Math.max(0, prev.attack - 1) }))} 
                  />
                  <Text style={styles.numberValue}>{formData.attack}</Text>
                  <IconButton 
                    icon="plus" 
                    size={16} 
                    onPress={() => setFormData(prev => ({ ...prev, attack: prev.attack + 1 }))} 
                  />
                </View>
              </View>

              <View style={styles.statInput}>
                <Text style={styles.statLabel}>❤️ Health</Text>
                <View style={styles.numberInput}>
                  <IconButton 
                    icon="minus" 
                    size={16} 
                    onPress={() => setFormData(prev => ({ ...prev, health: Math.max(1, prev.health - 1) }))} 
                  />
                  <Text style={styles.numberValue}>{formData.health}</Text>
                  <IconButton 
                    icon="plus" 
                    size={16} 
                    onPress={() => setFormData(prev => ({ ...prev, health: prev.health + 1 }))} 
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Rarity */}
        <Text style={styles.sectionTitle}>Rarity</Text>
        <View style={styles.rarityRow}>
          {RARITIES.map((rarity) => (
            <Pressable
              key={rarity}
              style={[
                styles.rarityButton,
                formData.rarity === rarity && styles.rarityButtonActive,
                { borderColor: RARITY_COLORS[rarity] },
                formData.rarity === rarity && { backgroundColor: RARITY_COLORS[rarity] + '20' },
              ]}
              onPress={() => setFormData({ ...formData, rarity })}
            >
              <Text style={[
                styles.rarityText,
                { color: formData.rarity === rarity ? RARITY_COLORS[rarity] : adminColors.textSecondary },
              ]}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Theme */}
        <Text style={styles.sectionTitle}>Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CARD_TYPES.map((type) => (
            <Chip
              key={type}
              selected={formData.cardType === type}
              onPress={() => setFormData({ ...formData, cardType: type })}
              style={styles.themeChip}
            >
              {TYPE_LABELS[type]}
            </Chip>
          ))}
        </ScrollView>

        <Divider style={styles.divider} />

        {/* Keywords (Units only) */}
        {formData.category === 'unit' && (
          <>
            <Text style={styles.sectionTitle}>Keywords</Text>
            <View style={styles.keywordsGrid}>
              {KEYWORDS.map((kw) => (
                <Pressable
                  key={kw}
                  style={[
                    styles.keywordButton,
                    formData.keywords.includes(kw) && styles.keywordButtonActive,
                  ]}
                  onPress={() => toggleKeyword(kw)}
                >
                  <Text style={styles.keywordIcon}>{KEYWORD_INFO[kw].icon}</Text>
                  <Text style={[
                    styles.keywordName,
                    formData.keywords.includes(kw) && styles.keywordNameActive,
                  ]}>
                    {KEYWORD_INFO[kw].name}
                  </Text>
                  <Text style={styles.keywordDesc}>{KEYWORD_INFO[kw].description}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Effects */}
        <Text style={styles.sectionTitle}>Effects</Text>
        
        {formData.effects.map((effect, index) => (
          <Card key={index} style={styles.effectCard} mode="outlined">
            <Card.Content style={styles.effectContent}>
              <View style={styles.effectInfo}>
                <Text style={styles.effectTrigger}>
                  {TRIGGER_INFO[effect.trigger].icon} {TRIGGER_INFO[effect.trigger].name}
                </Text>
                <Text style={styles.effectDetail}>
                  {ACTION_INFO[effect.action].icon} {ACTION_INFO[effect.action].name} ({effect.value}) → {TARGET_INFO[effect.target].name}
                </Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => removeEffect(index)} />
            </Card.Content>
          </Card>
        ))}

        {showEffectBuilder ? (
          <Card style={styles.effectBuilderCard} mode="outlined">
            <Card.Content>
              <Text style={styles.effectBuilderTitle}>Add Effect</Text>
              
              <Text style={styles.effectLabel}>When?</Text>
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

              <Text style={styles.effectLabel}>Do what?</Text>
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

              <Text style={styles.effectLabel}>To whom?</Text>
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

              <Text style={styles.effectLabel}>Value</Text>
              <View style={styles.valueRow}>
                <IconButton 
                  icon="minus" 
                  onPress={() => setCurrentEffect(prev => ({ ...prev, value: Math.max(0, prev.value - 1) }))} 
                />
                <Text style={styles.valueText}>{currentEffect.value}</Text>
                <IconButton 
                  icon="plus" 
                  onPress={() => setCurrentEffect(prev => ({ ...prev, value: prev.value + 1 }))} 
                />
              </View>

              <View style={styles.effectActions}>
                <Button mode="outlined" onPress={() => setShowEffectBuilder(false)}>Cancel</Button>
                <Button mode="contained" onPress={addEffect}>Add</Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Button 
            mode="outlined" 
            onPress={() => setShowEffectBuilder(true)}
            icon="plus"
            style={styles.addEffectButton}
          >
            Add Effect
          </Button>
        )}

        <Divider style={styles.divider} />

        {/* Flavor Text */}
        <Text style={styles.sectionTitle}>Flavor Text</Text>
        <TextInput
          value={formData.flavorText}
          onChangeText={(text) => setFormData({ ...formData, flavorText: text })}
          mode="outlined"
          style={styles.input}
          placeholder="A witty quote or meme reference..."
          multiline
        />

        {/* Max Supply */}
        <Text style={styles.sectionTitle}>Max Supply (Optional)</Text>
        <TextInput
          value={formData.maxSupply ? String(formData.maxSupply) : ''}
          onChangeText={(text) => setFormData({ ...formData, maxSupply: text ? parseInt(text) : null })}
          mode="outlined"
          style={styles.input}
          placeholder="Leave empty for unlimited"
          keyboardType="numeric"
        />

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!formData.name || saving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Create Card
        </Button>
      </View>
    </ScrollView>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Live Preview</Text>
      </View>
      <View style={styles.previewCardWrapper}>
        <CardPreview
          name={formData.name || 'Card Name'}
          manaCost={formData.manaCost}
          attack={formData.attack}
          health={formData.health}
          rarity={formData.rarity}
          category={formData.category}
          abilityText={generateAbilityText()}
          flavorText={formData.flavorText}
          keywords={formData.keywords}
          cardType={formData.cardType}
          scale={isWideScreen ? 1.1 : 0.9}
        />
      </View>
      <View style={styles.previewInfo}>
        <Text style={styles.previewHint}>
          ✨ Change rarity to see animated borders
        </Text>
      </View>
    </View>
  );

  if (isWideScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.splitLayout}>
          <View style={styles.formPanel}>
            {renderForm()}
          </View>
          <View style={styles.previewPanel}>
            {renderPreview()}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderForm()}
      <View style={styles.mobilePreviewBar}>
        <CardPreview
          name={formData.name || 'Preview'}
          manaCost={formData.manaCost}
          attack={formData.attack}
          health={formData.health}
          rarity={formData.rarity}
          category={formData.category}
          abilityText={generateAbilityText()}
          keywords={formData.keywords}
          cardType={formData.cardType}
          scale={0.4}
        />
        <Button mode="contained" onPress={handleSave} loading={saving} disabled={!formData.name}>
          Create
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  formPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
  },
  previewPanel: {
    width: 380,
    backgroundColor: '#0f172a',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: adminSpacing.lg,
    paddingBottom: 100,
  },
  backButton: {
    marginBottom: adminSpacing.md,
  },
  backText: {
    color: adminColors.accent,
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  segmented: {
    marginBottom: adminSpacing.md,
  },
  input: {
    backgroundColor: adminColors.surface,
    marginBottom: adminSpacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  statInput: {
    flex: 1,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statLabel: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.xs,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberValue: {
    fontSize: 24,
    fontWeight: '700',
    color: adminColors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  divider: {
    marginVertical: adminSpacing.lg,
  },
  rarityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  rarityButton: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 2,
  },
  rarityButtonActive: {},
  rarityText: {
    fontWeight: '600',
    fontSize: 13,
  },
  themeChip: {
    marginRight: adminSpacing.sm,
  },
  keywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  keywordButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  keywordButtonActive: {
    borderColor: adminColors.accent,
    backgroundColor: adminColors.accentLight,
  },
  keywordIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  keywordName: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  keywordNameActive: {
    color: adminColors.accent,
  },
  keywordDesc: {
    fontSize: 11,
    color: adminColors.textMuted,
    marginTop: 2,
  },
  effectCard: {
    marginBottom: adminSpacing.sm,
    borderColor: adminColors.border,
  },
  effectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectInfo: {
    flex: 1,
  },
  effectTrigger: {
    fontSize: 12,
    color: adminColors.accent,
    fontWeight: '600',
  },
  effectDetail: {
    fontSize: 13,
    color: adminColors.textPrimary,
  },
  effectBuilderCard: {
    borderColor: adminColors.accent,
    backgroundColor: adminColors.accentLight,
  },
  effectBuilderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.md,
  },
  effectLabel: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  effectChip: {
    marginRight: adminSpacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: adminColors.textPrimary,
    minWidth: 50,
    textAlign: 'center',
  },
  effectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },
  addEffectButton: {
    borderStyle: 'dashed',
  },
  saveButton: {
    marginTop: adminSpacing.xl,
    borderRadius: adminRadius.md,
  },
  saveButtonContent: {
    paddingVertical: adminSpacing.sm,
  },

  // Preview Panel
  previewContainer: {
    flex: 1,
    padding: adminSpacing.lg,
  },
  previewHeader: {
    marginBottom: adminSpacing.lg,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  previewCardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    marginTop: adminSpacing.lg,
  },
  previewHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },

  // Mobile
  mobilePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: adminSpacing.md,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
});

