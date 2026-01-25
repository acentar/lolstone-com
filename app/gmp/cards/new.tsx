import { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable, Image, Alert, Platform } from 'react-native';
import {
  Text, Button, TextInput, Chip, Divider, IconButton, Card,
  SegmentedButtons, Switch, ActivityIndicator, Modal, Portal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../src/lib/supabase';
import { useAuthContext } from '../../../src/context/AuthContext';
import { 
  CardRarity, CardType, CardCategory, CardKeyword,
  EffectTrigger, EffectTarget, EffectAction, TokenTrigger,
  KEYWORD_INFO, TRIGGER_INFO, ACTION_INFO, TARGET_INFO, TOKEN_TRIGGER_INFO,
} from '../../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../../src/constants/adminTheme';
import CardPreview from '../../../src/components/CardPreview';
import TokenPreview from '../../../src/components/TokenPreview';

const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const CARD_TYPES: CardType[] = ['meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment'];
const KEYWORDS: CardKeyword[] = ['frontline', 'quick', 'evasion', 'boost'];
// IMPLEMENTED TRIGGERS (working in-game)
const IMPLEMENTED_TRIGGERS: EffectTrigger[] = ['on_play', 'start_of_turn', 'end_of_turn'];

// BROKEN TRIGGERS (not implemented in game engine)
const BROKEN_TRIGGERS: EffectTrigger[] = ['on_destroy', 'on_attack', 'on_damaged'];

// IMPLEMENTED ACTIONS (working in-game)
const IMPLEMENTED_ACTIONS: EffectAction[] = ['damage', 'heal', 'draw', 'buff_attack', 'buff_health', 'destroy', 'summon', 'silence', 'return_hand', 'stun'];

// BROKEN ACTIONS (not implemented in game engine)
const BROKEN_ACTIONS: EffectAction[] = ['copy'];

// BROKEN TARGETS (not implemented in game engine)
const BROKEN_TARGETS: EffectTarget[] = ['random_enemy', 'random_friendly'];

// All options for display (but we'll show warnings for broken ones)
const TRIGGERS: EffectTrigger[] = ['on_play', 'on_destroy', 'on_attack', 'on_damaged', 'end_of_turn', 'start_of_turn'];
const TARGETS: EffectTarget[] = ['self', 'friendly_unit', 'enemy_unit', 'any_unit', 'friendly_player', 'enemy_player', 'all_friendly', 'all_enemies', 'all_units', 'random_enemy', 'random_friendly'];
const ACTIONS: EffectAction[] = ['damage', 'heal', 'draw', 'buff_attack', 'buff_health', 'destroy', 'summon', 'silence', 'return_hand', 'copy', 'stun'];
const TOKEN_TRIGGERS: TokenTrigger[] = ['on_play', 'on_destroy', 'on_attack', 'on_damaged'];

// Effect validation functions
function isTriggerImplemented(trigger: EffectTrigger): boolean {
  return IMPLEMENTED_TRIGGERS.includes(trigger);
}

function isActionImplemented(action: EffectAction): boolean {
  return IMPLEMENTED_ACTIONS.includes(action);
}

function isTargetImplemented(target: EffectTarget): boolean {
  return !BROKEN_TARGETS.includes(target);
}

function isEffectCombinationValid(trigger: EffectTrigger, action: EffectAction, target: EffectTarget): boolean {
  // Check if trigger is implemented
  if (!isTriggerImplemented(trigger)) return false;

  // Check if action is implemented
  if (!isActionImplemented(action)) return false;

  // Check if target is implemented
  if (!isTargetImplemented(target)) return false;

  // Special validation for draw action (doesn't need targets)
  if (action === 'draw' && target !== 'self') {
    // Draw only works with 'self' target (or no target), but we allow it for compatibility
    return true;
  }

  return true;
}

function getEffectCompatibilityMessage(trigger: EffectTrigger, action: EffectAction, target: EffectTarget): string | null {
  if (!isTriggerImplemented(trigger)) {
    return `❌ Trigger "${TRIGGER_INFO[trigger].name}" is not implemented in-game`;
  }

  if (!isActionImplemented(action)) {
    return `❌ Action "${ACTION_INFO[action].name}" is not implemented in-game`;
  }

  if (!isTargetImplemented(target)) {
    return `❌ Target "${TARGET_INFO[target].name}" is not implemented in-game`;
  }

  if (action === 'draw' && target !== 'self') {
    return `⚠️ Draw action doesn't use targets (will draw for the card owner regardless)`;
  }

  return null;
}

// Get available actions for a selected trigger
function getAvailableActionsForTrigger(trigger: EffectTrigger): EffectAction[] {
  if (!isTriggerImplemented(trigger)) {
    return []; // No actions work with broken triggers
  }
  return IMPLEMENTED_ACTIONS; // All implemented actions work with working triggers
}

// Get available targets for a selected trigger and action
function getAvailableTargetsForTriggerAndAction(trigger: EffectTrigger, action: EffectAction): EffectTarget[] {
  if (!isTriggerImplemented(trigger) || !isActionImplemented(action)) {
    return []; // No targets work with broken combinations
  }

  // For draw action, only 'self' makes sense (though it doesn't really use targets)
  if (action === 'draw') {
    return ['self'];
  }

  // For unit-only actions, only show unit targets
  const unitOnlyActions: EffectAction[] = ['buff_attack', 'buff_health', 'destroy', 'silence', 'return_hand', 'stun'];
  if (unitOnlyActions.includes(action)) {
    return ['self', 'friendly_unit', 'enemy_unit', 'any_unit', 'all_friendly', 'all_enemies', 'all_units'];
  }

  // For summon action, typically self (the unit summoning)
  if (action === 'summon') {
    return ['self'];
  }

  // For damage/heal, allow both units and players
  if (action === 'damage' || action === 'heal') {
    return ['self', 'friendly_unit', 'enemy_unit', 'any_unit', 'friendly_player', 'enemy_player', 'all_friendly', 'all_enemies', 'all_units'];
  }

  // Default: all implemented targets
  return TARGETS.filter(target => isTargetImplemented(target));
}

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
  balanceNotes: string;
  inspiration: string;
  manaCost: number;
  attack: number;
  health: number;
  rarity: CardRarity;
  cardType: CardType;
  category: CardCategory;
  maxSupply: number | null;
  keywords: CardKeyword[];
  effects: EffectForm[];
  imageUri: string | null;
  imageUrl: string | null;
  // Token fields
  hasToken: boolean;
  tokenName: string;
  tokenImageUri: string | null;
  tokenImageUrl: string | null;
  tokenAttack: number;
  tokenHealth: number;
  tokenTrigger: TokenTrigger;
  tokenCount: number;
  tokenMaxSummons: number;
  tokenKeywords: CardKeyword[];
}

const initialFormData: CardFormData = {
  name: '',
  flavorText: '',
  balanceNotes: '',
  inspiration: '',
  manaCost: 1,
  attack: 1,
  health: 1,
  rarity: 'common',
  cardType: 'meme_minion',
  category: 'unit',
  maxSupply: null,
  keywords: [],
  effects: [],
  imageUri: null,
  imageUrl: null,
  // Token defaults
  hasToken: false,
  tokenName: '',
  tokenImageUri: null,
  tokenImageUrl: null,
  tokenAttack: 1,
  tokenHealth: 1,
  tokenTrigger: 'on_play',
  tokenCount: 1,
  tokenMaxSummons: 1,
  tokenKeywords: [],
};

export default function CardDesignerPage() {
  const router = useRouter();
  const { gameMaster } = useAuthContext();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 900;

  const [formData, setFormData] = useState<CardFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEffectBuilder, setShowEffectBuilder] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectForm>({
    trigger: 'on_play',
    target: 'enemy_unit',
    action: 'damage',
    value: 1,
  });
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Image picker with recommended 4:3 aspect ratio for card art
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3], // 4:3 aspect ratio for card art
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, imageUri: asset.uri }));
        await uploadImage(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      // Generate unique filename
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `card_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('card-images')
        .upload(fileName, blob, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload failed', error.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(data.path);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUri: null, imageUrl: null }));
  };

  // Token image picker
  const pickTokenImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, tokenImageUri: asset.uri }));
        await uploadTokenImage(asset.uri);
      }
    } catch (error) {
      console.error('Error picking token image:', error);
    }
  };

  const uploadTokenImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `token_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('card-images')
        .upload(fileName, blob, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: false,
        });

      if (error) {
        console.error('Token upload error:', error);
        Alert.alert('Upload failed', error.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(data.path);

      setFormData(prev => ({ ...prev, tokenImageUrl: publicUrl }));
    } catch (error) {
      console.error('Error uploading token image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeTokenImage = () => {
    setFormData(prev => ({ ...prev, tokenImageUri: null, tokenImageUrl: null }));
  };

  const toggleTokenKeyword = (keyword: CardKeyword) => {
    setFormData(prev => ({
      ...prev,
      tokenKeywords: prev.tokenKeywords.includes(keyword)
        ? prev.tokenKeywords.filter(k => k !== keyword)
        : [...prev.tokenKeywords, keyword],
    }));
  };

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
        case 'stun':
          text += `${targetInfo.name} cannot attack next turn`;
          break;
        default:
          text += `${ACTION_INFO[effect.action].name} ${targetInfo.name}`;
      }
      parts.push(text);
    });

    // Add token text
    if (formData.hasToken && formData.tokenName) {
      const triggerInfo = TOKEN_TRIGGER_INFO[formData.tokenTrigger];
      let tokenText = `${triggerInfo.name}: Summon `;

      if (formData.tokenTrigger === 'on_play' || formData.tokenTrigger === 'on_destroy') {
        tokenText += formData.tokenCount > 1
          ? `${formData.tokenCount} ${formData.tokenName}s`
          : `a ${formData.tokenName}`;
      } else {
        tokenText += `a ${formData.tokenName}`;
        if (formData.tokenMaxSummons > 1) {
          tokenText += ` (up to ${formData.tokenMaxSummons} times)`;
        } else {
          tokenText += ` (once)`;
        }
      }

      // Add token keywords to the description
      if (formData.tokenKeywords.length > 0) {
        const keywordNames = formData.tokenKeywords.map(kw => KEYWORD_INFO[kw].name);
        tokenText += ` with ${keywordNames.join(' and ')}`;
      }

      parts.push(tokenText);
    }
    
    return parts.join('. ') + (parts.length > 0 ? '.' : '').trim();
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
    // Ensure all components are selected
    if (!currentEffect.trigger || !currentEffect.action || !currentEffect.target) {
      Alert.alert(
        'Incomplete Effect',
        'Please select all three components: When?, Do what?, and To whom?',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate effect combination
    if (!isEffectCombinationValid(currentEffect.trigger, currentEffect.action, currentEffect.target)) {
      Alert.alert(
        'Invalid Effect Combination',
        getEffectCompatibilityMessage(currentEffect.trigger, currentEffect.action, currentEffect.target) ||
        'This effect combination is not supported in-game.',
        [{ text: 'OK' }]
      );
      return;
    }

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
    if (!formData.name) {
      Alert.alert('Error', 'Card name is required');
      return;
    }

    if (!gameMaster) {
      Alert.alert('Error', 'You must be logged in as a game master to create cards');
      return;
    }

    console.log('Game master found:', gameMaster);
    console.log('Form data:', formData);

    setSaving(true);
    try {
      const abilityText = generateAbilityText();

      console.log('Saving card with data:', {
        name: formData.name,
        category: formData.category,
        hasToken: formData.hasToken,
        tokenKeywords: formData.tokenKeywords,
        abilityText,
      });

      // Prepare the insert data, excluding token_keywords if the database doesn't support it yet
      const insertData: any = {
        name: formData.name,
        ability_text: abilityText || null,
        flavor_text: formData.flavorText || null,
        balance_notes: formData.balanceNotes || null,
        inspiration: formData.inspiration || null,
        mana_cost: formData.manaCost,
        attack: formData.category === 'unit' ? formData.attack : null,
        health: formData.category === 'unit' ? formData.health : null,
        base_attack: formData.category === 'unit' ? formData.attack : 0,
        base_health: formData.category === 'unit' ? formData.health : 0,
        rarity: formData.rarity,
        card_type: formData.cardType,
        category: formData.category,
        max_supply: formData.maxSupply,
        image_url: formData.imageUrl,
        created_by: gameMaster?.id,
        // Token fields
        has_token: formData.hasToken,
        token_name: formData.hasToken ? formData.tokenName : null,
        token_image_url: formData.hasToken ? formData.tokenImageUrl : null,
        token_attack: formData.tokenAttack,
        token_health: formData.tokenHealth,
        token_trigger: formData.hasToken ? formData.tokenTrigger : null,
        token_count: formData.tokenCount,
        token_max_summons: formData.tokenMaxSummons,
      };

      // Only add token_keywords if we have them (for backward compatibility)
      // Note: This field may not exist in the database until migration 016 is run
      try {
        if (formData.hasToken && formData.tokenKeywords.length > 0) {
          insertData.token_keywords = formData.tokenKeywords;
        }
      } catch (e) {
        console.warn('token_keywords field not available, skipping');
      }

      const { data: cardData, error: cardError } = await supabase
        .from('card_designs')
        .insert(insertData)
        .select()
        .single();

      if (cardError) {
        console.error('Card insert error:', cardError);
        throw cardError;
      }

      console.log('Card created successfully:', cardData);

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

      router.replace('/gmp/cards');
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', `Failed to create card: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Design New Card</Text>
          <Pressable style={styles.guideButton} onPress={() => setShowGuideModal(true)}>
            <Text style={styles.guideButtonText}>📚 Effects Guide</Text>
          </Pressable>
        </View>

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

        {/* Card Artwork */}
        <Text style={styles.sectionTitle}>Card Artwork (4:3 ratio)</Text>
        <View style={styles.imageUploadSection}>
          {formData.imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.imageUri }} 
                style={styles.uploadedImage}
                resizeMode="cover"
              />
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              <View style={styles.imageActions}>
                <Pressable style={styles.changeImageBtn} onPress={pickImage}>
                  <Text style={styles.changeImageText}>Change</Text>
                </Pressable>
                <Pressable style={styles.removeImageBtn} onPress={removeImage}>
                  <Text style={styles.removeImageText}>Remove</Text>
                </Pressable>
              </View>
              {formData.imageUrl && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedBadgeText}>✓ Uploaded</Text>
                </View>
              )}
            </View>
          ) : (
            <Pressable style={styles.imageUploadButton} onPress={pickImage}>
              <View style={styles.uploadIconContainer}>
                <Text style={styles.uploadIcon}>📷</Text>
              </View>
              <Text style={styles.uploadTitle}>Upload Card Art</Text>
              <Text style={styles.uploadHint}>Recommended: 400×300 or any 4:3 ratio</Text>
              <Text style={styles.uploadHint}>Max size: 5MB</Text>
            </Pressable>
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
                {getEffectCompatibilityMessage(effect.trigger, effect.action, effect.target) && (
                  <Text style={styles.effectWarning}>
                    {getEffectCompatibilityMessage(effect.trigger, effect.action, effect.target)}
                  </Text>
                )}
              </View>
              <IconButton icon="close" size={20} onPress={() => removeEffect(index)} />
            </Card.Content>
          </Card>
        ))}

        {showEffectBuilder ? (
          <Card style={styles.effectBuilderCard} mode="outlined">
            <Card.Content>
              <Text style={styles.effectBuilderTitle}>Add Effect</Text>

              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                <Text style={[
                  styles.stepNumber,
                  styles.stepActive
                ]}>1</Text>
                <Text style={styles.stepArrow}>→</Text>
                <Text style={[
                  styles.stepNumber,
                  currentEffect.trigger ? styles.stepActive : styles.stepInactive
                ]}>2</Text>
                <Text style={styles.stepArrow}>→</Text>
                <Text style={[
                  styles.stepNumber,
                  currentEffect.trigger && currentEffect.action ? styles.stepActive : styles.stepInactive
                ]}>3</Text>
              </View>

              <Text style={styles.effectLabel}>1. When?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TRIGGERS.map((trigger) => (
                  <Chip
                    key={trigger}
                    selected={currentEffect.trigger === trigger}
                    onPress={() => {
                      const newEffect = { ...currentEffect, trigger };
                      // Reset action and target when trigger changes
                      if (currentEffect.trigger !== trigger) {
                        newEffect.action = 'damage' as EffectAction; // Default
                        newEffect.target = 'enemy_unit' as EffectTarget; // Default
                      }
                      setCurrentEffect(newEffect);
                    }}
                    style={[
                      styles.effectChip,
                      !isTriggerImplemented(trigger) && styles.effectChipBroken
                    ]}
                    compact
                  >
                    {TRIGGER_INFO[trigger].icon} {TRIGGER_INFO[trigger].name}
                    {!isTriggerImplemented(trigger) && ' ❌'}
                  </Chip>
                ))}
              </ScrollView>

              {/* Step 2: Do what? (only show if trigger selected) */}
              {currentEffect.trigger && (
                <>
                  <Text style={styles.effectLabel}>2. Do what?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {getAvailableActionsForTrigger(currentEffect.trigger).map((action) => (
                      <Chip
                        key={action}
                        selected={currentEffect.action === action}
                        onPress={() => {
                          const newEffect = { ...currentEffect, action };
                          // Reset target when action changes
                          if (currentEffect.action !== action) {
                            newEffect.target = 'enemy_unit' as EffectTarget; // Default
                          }
                          setCurrentEffect(newEffect);
                        }}
                        style={styles.effectChip}
                        compact
                      >
                        {ACTION_INFO[action].icon} {ACTION_INFO[action].name}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Step 3: To whom? (only show if trigger and action selected) */}
              {currentEffect.trigger && currentEffect.action && (
                <>
                  <Text style={styles.effectLabel}>3. To whom?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {getAvailableTargetsForTriggerAndAction(currentEffect.trigger, currentEffect.action).map((target) => (
                      <Chip
                        key={target}
                        selected={currentEffect.target === target}
                        onPress={() => setCurrentEffect({ ...currentEffect, target })}
                        style={styles.effectChip}
                        compact
                      >
                        {TARGET_INFO[target].icon} {TARGET_INFO[target].name}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}

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

        {/* Token Section (Units only) */}
        {formData.category === 'unit' && (
          <>
            <View style={styles.tokenHeader}>
              <Text style={styles.sectionTitle}>👻 Token Card</Text>
              <Switch
                value={formData.hasToken}
                onValueChange={(value) => setFormData(prev => ({ ...prev, hasToken: value }))}
              />
            </View>
            <Text style={styles.tokenHint}>
              Tokens are summoned units that are part of this card
            </Text>

            {formData.hasToken && (
              <Card style={styles.tokenCard} mode="outlined">
                <Card.Content>
                  {/* Token Name */}
                  <TextInput
                    label="Token Name"
                    value={formData.tokenName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tokenName: text }))}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Spirit, Clone, Minion"
                  />

                  {/* Token Image */}
                  <Text style={styles.effectLabel}>Token Image (Optional)</Text>
                  <View style={styles.tokenImageSection}>
                    {formData.tokenImageUri ? (
                      <View style={styles.tokenImagePreview}>
                        <Image 
                          source={{ uri: formData.tokenImageUri }} 
                          style={styles.tokenImage}
                          resizeMode="cover"
                        />
                        <Pressable style={styles.tokenImageRemove} onPress={removeTokenImage}>
                          <Text style={styles.tokenImageRemoveText}>✕</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable style={styles.tokenImageUpload} onPress={pickTokenImage}>
                        <Text style={styles.tokenImageUploadIcon}>📷</Text>
                        <Text style={styles.tokenImageUploadText}>Add Image</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Token Stats */}
                  <View style={styles.tokenStatsRow}>
                    <View style={styles.tokenStatInput}>
                      <Text style={styles.statLabel}>⚔️ Attack</Text>
                      <View style={styles.numberInput}>
                        <IconButton 
                          icon="minus" 
                          size={16} 
                          onPress={() => setFormData(prev => ({ ...prev, tokenAttack: Math.max(0, prev.tokenAttack - 1) }))} 
                        />
                        <Text style={styles.numberValue}>{formData.tokenAttack}</Text>
                        <IconButton 
                          icon="plus" 
                          size={16} 
                          onPress={() => setFormData(prev => ({ ...prev, tokenAttack: prev.tokenAttack + 1 }))} 
                        />
                      </View>
                    </View>
                    <View style={styles.tokenStatInput}>
                      <Text style={styles.statLabel}>❤️ Health</Text>
                      <View style={styles.numberInput}>
                        <IconButton 
                          icon="minus" 
                          size={16} 
                          onPress={() => setFormData(prev => ({ ...prev, tokenHealth: Math.max(1, prev.tokenHealth - 1) }))} 
                        />
                        <Text style={styles.numberValue}>{formData.tokenHealth}</Text>
                        <IconButton 
                          icon="plus" 
                          size={16} 
                          onPress={() => setFormData(prev => ({ ...prev, tokenHealth: prev.tokenHealth + 1 }))} 
                        />
                      </View>
                    </View>
                  </View>

                  {/* Token Keywords */}
                  <Text style={styles.effectLabel}>Token Keywords (Optional)</Text>
                  <View style={styles.tokenKeywordsGrid}>
                    {KEYWORDS.map((kw) => (
                      <Pressable
                        key={kw}
                        style={[
                          styles.tokenKeywordButton,
                          formData.tokenKeywords.includes(kw) && styles.tokenKeywordButtonActive,
                        ]}
                        onPress={() => toggleTokenKeyword(kw)}
                      >
                        <Text style={styles.tokenKeywordIcon}>{KEYWORD_INFO[kw].icon}</Text>
                        <Text style={[
                          styles.tokenKeywordName,
                          formData.tokenKeywords.includes(kw) && styles.tokenKeywordNameActive,
                        ]}>
                          {KEYWORD_INFO[kw].name}
                        </Text>
                        <Text style={styles.tokenKeywordDesc}>{KEYWORD_INFO[kw].description}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Token Trigger */}
                  <Text style={styles.effectLabel}>When to Summon?</Text>
                  <View style={styles.tokenTriggerGrid}>
                    {TOKEN_TRIGGERS.map((trigger) => (
                      <Pressable
                        key={trigger}
                        style={[
                          styles.tokenTriggerButton,
                          formData.tokenTrigger === trigger && styles.tokenTriggerButtonActive,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, tokenTrigger: trigger }))}
                      >
                        <Text style={styles.tokenTriggerIcon}>{TOKEN_TRIGGER_INFO[trigger].icon}</Text>
                        <Text style={[
                          styles.tokenTriggerName,
                          formData.tokenTrigger === trigger && styles.tokenTriggerNameActive,
                        ]}>
                          {TOKEN_TRIGGER_INFO[trigger].name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Count or Max Summons based on trigger */}
                  {(formData.tokenTrigger === 'on_play' || formData.tokenTrigger === 'on_destroy') ? (
                    <>
                      <Text style={styles.effectLabel}>How many tokens to summon?</Text>
                      <View style={styles.tokenCountRow}>
                        <IconButton 
                          icon="minus" 
                          onPress={() => setFormData(prev => ({ ...prev, tokenCount: Math.max(1, prev.tokenCount - 1) }))} 
                        />
                        <Text style={styles.tokenCountValue}>{formData.tokenCount}</Text>
                        <IconButton 
                          icon="plus" 
                          onPress={() => setFormData(prev => ({ ...prev, tokenCount: Math.min(5, prev.tokenCount + 1) }))} 
                        />
                      </View>
                      <Text style={styles.tokenCountHint}>
                        Summon {formData.tokenCount} token{formData.tokenCount > 1 ? 's' : ''} when triggered
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.effectLabel}>Max times token can be summoned</Text>
                      <View style={styles.tokenCountRow}>
                        <IconButton 
                          icon="minus" 
                          onPress={() => setFormData(prev => ({ ...prev, tokenMaxSummons: Math.max(1, prev.tokenMaxSummons - 1) }))} 
                        />
                        <Text style={styles.tokenCountValue}>{formData.tokenMaxSummons}</Text>
                        <IconButton 
                          icon="plus" 
                          onPress={() => setFormData(prev => ({ ...prev, tokenMaxSummons: Math.min(10, prev.tokenMaxSummons + 1) }))} 
                        />
                      </View>
                      <Text style={styles.tokenCountHint}>
                        Each trigger summons 1 token, up to {formData.tokenMaxSummons} time{formData.tokenMaxSummons > 1 ? 's' : ''} total
                      </Text>
                    </>
                  )}
                </Card.Content>
              </Card>
            )}

            <Divider style={styles.divider} />
          </>
        )}

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

        {/* Inspiration */}
        <Text style={styles.sectionTitle}>💡 Inspiration</Text>
        <TextInput
          value={formData.inspiration}
          onChangeText={(text) => setFormData({ ...formData, inspiration: text })}
          mode="outlined"
          style={styles.input}
          placeholder="What inspired this card? Meme, reference, idea..."
          multiline
        />

        {/* Balance Notes */}
        <Text style={styles.sectionTitle}>⚖️ Balance Note</Text>
        <TextInput
          value={formData.balanceNotes}
          onChangeText={(text) => setFormData({ ...formData, balanceNotes: text })}
          mode="outlined"
          style={styles.input}
          placeholder="Balance considerations, power level notes..."
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
    <ScrollView style={styles.previewContainer} contentContainerStyle={styles.previewScrollContent}>
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
          imageUrl={formData.imageUrl || formData.imageUri || undefined}
          scale={isWideScreen ? 1.1 : 0.9}
        />
      </View>
      
      {/* Token Preview */}
      {formData.hasToken && formData.tokenName && (
        <View style={styles.tokenPreviewSection}>
          <Text style={styles.tokenPreviewLabel}>👻 Token</Text>
          <View style={styles.tokenPreviewWrapper}>
            <TokenPreview
              name={formData.tokenName}
              attack={formData.tokenAttack}
              health={formData.tokenHealth}
              imageUrl={formData.tokenImageUrl || formData.tokenImageUri || undefined}
              keywords={formData.tokenKeywords}
              scale={isWideScreen ? 1 : 0.8}
            />
          </View>
          <Text style={styles.tokenPreviewInfo}>
            {formData.tokenTrigger === 'on_play' || formData.tokenTrigger === 'on_destroy' 
              ? `Summons ${formData.tokenCount} on ${formData.tokenTrigger.replace('_', ' ')}`
              : `Summons on ${formData.tokenTrigger.replace('_', ' ')} (max ${formData.tokenMaxSummons}×)`
            }
          </Text>
        </View>
      )}
      
      <View style={styles.previewInfo}>
        <Text style={styles.previewHint}>
          ✨ Change rarity to see animated borders
        </Text>
      </View>
    </ScrollView>
  );

  const renderGuideModal = () => (
    <Portal>
      <Modal
        visible={showGuideModal}
        onDismiss={() => setShowGuideModal(false)}
        contentContainerStyle={styles.guideModalContainer}
      >
        <ScrollView style={styles.guideModalScroll}>
          <View style={styles.guideModalContent}>
            <Text style={styles.guideModalTitle}>🎯 Effects Guide</Text>

            <Text style={styles.guideSectionTitle}>⚔️ Combat Effects</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💥 Damage:</Text> Deals damage to reduce target's health</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💀 Destroy:</Text> Instantly kills the target unit</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>😵 Stun:</Text> Target can't attack next turn</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🤫 Silence:</Text> Removes all effects from target</Text>
            </View>

            <Text style={styles.guideSectionTitle}>💚 Healing & Buffs</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💚 Heal:</Text> Restores health to target</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>⚔️ Buff Attack:</Text> Permanently increases attack power</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🛡️ Buff Health:</Text> Permanently increases max health</Text>
            </View>

            <Text style={styles.guideSectionTitle}>🎴 Card Effects</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🃏 Draw:</Text> Draw cards from your deck</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🔄 Return Hand:</Text> Send target back to owner's hand</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>📋 Copy:</Text> Copy another card's effects</Text>
            </View>

            <Text style={styles.guideSectionTitle}>🎭 Summoning</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🎭 Summon:</Text> Create token units on the board</Text>
            </View>

            <Text style={styles.guideSectionTitle}>⏰ When Effects Trigger</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🎴 On Play:</Text> When this card is played from hand</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>⚔️ On Attack:</Text> When this unit attacks</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🎯 On Damaged:</Text> When this unit takes damage</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💀 On Destroy:</Text> When this unit dies</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🌅 Start of Turn:</Text> At the start of your turn</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🌙 End of Turn:</Text> At the end of your turn</Text>
            </View>

            <Text style={styles.guideSectionTitle}>🎯 Who Effects Target</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🪞 Self:</Text> This card/unit</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💚 Friendly Unit:</Text> Your units</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💔 Enemy Unit:</Text> Opponent's units</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🎲 Any Unit:</Text> Any unit on board</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>👤 Friendly Player:</Text> Your hero</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>👥 Enemy Player:</Text> Opponent's hero</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💚 All Friendly:</Text> All your units</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>💔 All Enemies:</Text> All opponent units</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🎯 Random Enemy:</Text> Random enemy unit</Text>
            </View>

            <Text style={styles.guideSectionTitle}>🏷️ Unit Keywords</Text>
            <View style={styles.guideSection}>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🏰 Frontline:</Text> Can be attacked by enemies</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>⚡ Quick:</Text> Can attack immediately when summoned</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>🌀 Evasion:</Text> 50% chance to avoid attacks</Text>
              <Text style={styles.guideItem}><Text style={styles.guideItemBold}>⭐ Boost:</Text> Gets stronger each turn alive</Text>
            </View>

            <Button
              mode="contained"
              onPress={() => setShowGuideModal(false)}
              style={styles.guideCloseButton}
            >
              Close Guide
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
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
        {renderGuideModal()}
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
          imageUrl={formData.imageUrl || formData.imageUri || undefined}
          scale={0.4}
        />
        <Button mode="contained" onPress={handleSave} loading={saving} disabled={!formData.name}>
          Create
        </Button>
      </View>
      {renderGuideModal()}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xl,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  guideButton: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: '#3b82f6',
    borderRadius: adminRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guideButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
  balanceNotesInput: {
    minHeight: 80,
    backgroundColor: '#fef3c7',
  },
  helperText: {
    fontSize: 11,
    color: adminColors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Image Upload Section
  imageUploadSection: {
    marginTop: adminSpacing.sm,
  },
  imageUploadButton: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 2,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    padding: adminSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  uploadIcon: {
    fontSize: 28,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.xs,
  },
  uploadHint: {
    fontSize: 12,
    color: adminColors.textMuted,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  uploadedImage: {
    width: '100%',
    height: 180,
    borderRadius: adminRadius.lg,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: adminSpacing.sm,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  changeImageBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.accent,
    borderRadius: adminRadius.md,
  },
  changeImageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  removeImageBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    backgroundColor: '#ef4444',
    borderRadius: adminRadius.md,
  },
  removeImageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  uploadedBadge: {
    position: 'absolute',
    top: adminSpacing.sm,
    right: adminSpacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  uploadedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
  effectWarning: {
    fontSize: 11,
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: 2,
  },
  effectChipBroken: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepActive: {
    backgroundColor: adminColors.accent,
  },
  stepInactive: {
    backgroundColor: adminColors.textSecondary,
  },
  stepArrow: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginHorizontal: adminSpacing.xs,
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

  // Token styles
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenHint: {
    fontSize: 12,
    color: adminColors.textMuted,
    marginBottom: adminSpacing.md,
  },
  tokenCard: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  tokenImageSection: {
    marginVertical: adminSpacing.sm,
  },
  tokenImagePreview: {
    position: 'relative',
    width: 100,
    height: 75,
    borderRadius: adminRadius.md,
    overflow: 'hidden',
  },
  tokenImage: {
    width: '100%',
    height: '100%',
  },
  tokenImageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenImageRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tokenImageUpload: {
    width: 100,
    height: 75,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenImageUploadIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tokenImageUploadText: {
    fontSize: 10,
    color: adminColors.textMuted,
  },
  tokenKeywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  tokenKeywordButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tokenKeywordButtonActive: {
    borderColor: adminColors.accent,
    backgroundColor: adminColors.accentLight,
  },
  tokenKeywordIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tokenKeywordName: {
    fontSize: 11,
    color: adminColors.textSecondary,
    fontWeight: '500',
  },
  tokenKeywordNameActive: {
    color: adminColors.accent,
  },
  tokenKeywordDesc: {
    fontSize: 9,
    color: adminColors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  tokenStatsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginVertical: adminSpacing.md,
  },
  tokenStatInput: {
    flex: 1,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tokenTriggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  tokenTriggerButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tokenTriggerButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  tokenTriggerIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tokenTriggerName: {
    fontSize: 11,
    color: adminColors.textSecondary,
    fontWeight: '500',
  },
  tokenTriggerNameActive: {
    color: '#8b5cf6',
  },
  tokenCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
  },
  tokenCountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8b5cf6',
    minWidth: 50,
    textAlign: 'center',
  },
  tokenCountHint: {
    fontSize: 11,
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
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
  },
  previewScrollContent: {
    padding: adminSpacing.lg,
    alignItems: 'center',
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
  
  // Token Preview
  tokenPreviewSection: {
    marginTop: adminSpacing.xl,
    alignItems: 'center',
  },
  tokenPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
    marginBottom: adminSpacing.md,
  },
  tokenPreviewWrapper: {
    alignItems: 'center',
  },
  tokenPreviewInfo: {
    fontSize: 11,
    color: '#8b5cf6',
    marginTop: adminSpacing.sm,
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

  // Guide Modal Styles
  guideModalContainer: {
    margin: adminSpacing.lg,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    maxHeight: '80%',
    elevation: 5,
  },
  guideModalScroll: {
    maxHeight: '80%',
  },
  guideModalContent: {
    padding: adminSpacing.xl,
  },
  guideModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: adminColors.textPrimary,
    textAlign: 'center',
    marginBottom: adminSpacing.sm,
  },
  guideModalSubtitle: {
    fontSize: 14,
    color: adminColors.textSecondary,
    textAlign: 'center',
    marginBottom: adminSpacing.xl,
  },
  guideSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: adminColors.accent,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  guideSection: {
    backgroundColor: adminColors.background,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  guideItem: {
    fontSize: 13,
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.sm,
    lineHeight: 18,
  },
  guideItemBold: {
    fontWeight: '600',
    color: adminColors.accent,
  },
  guideCloseButton: {
    marginTop: adminSpacing.xl,
    backgroundColor: adminColors.accent,
  },
});

