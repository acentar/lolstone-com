import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign } from '../../src/types/database';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/constants/theme';

const RARITY_COLORS: Record<string, string> = {
  common: colors.common,
  uncommon: colors.uncommon,
  rare: colors.rare,
  epic: colors.epic,
  legendary: colors.legendary,
};

export default function MintScreen() {
  const { gameMaster } = useAuthContext();
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<CardDesign | null>(null);
  const [mintAmount, setMintAmount] = useState('10');
  const [minting, setMinting] = useState(false);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('card_designs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleMint = async () => {
    if (!selectedDesign || !gameMaster) return;

    const amount = parseInt(mintAmount);
    if (isNaN(amount) || amount < 1 || amount > 1000) {
      Alert.alert('Invalid Amount', 'Please enter a number between 1 and 1000');
      return;
    }

    // Check max supply
    if (selectedDesign.max_supply) {
      const remaining = selectedDesign.max_supply - selectedDesign.total_minted;
      if (amount > remaining) {
        Alert.alert('Supply Limit', `Only ${remaining} cards can be minted for this design`);
        return;
      }
    }

    setMinting(true);

    try {
      // Get current edition
      const { data: currentEditionData } = await supabase
        .rpc('get_current_edition', { design_uuid: selectedDesign.id });
      
      const newEdition = (currentEditionData || 0) + 1;

      // Create card instances
      const instances = Array.from({ length: amount }, (_, i) => ({
        design_id: selectedDesign.id,
        edition: newEdition,
        serial_number: i + 1,
        edition_size: amount,
        minted_by: gameMaster.id,
      }));

      const { error: insertError } = await supabase
        .from('card_instances')
        .insert(instances);

      if (insertError) throw insertError;

      // Update total_minted count
      const { error: updateError } = await supabase
        .from('card_designs')
        .update({ total_minted: selectedDesign.total_minted + amount })
        .eq('id', selectedDesign.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('transactions').insert({
        type: 'mint',
        game_master_id: gameMaster.id,
        description: `Minted ${amount} copies of "${selectedDesign.name}" (Edition #${newEdition})`,
      });

      Alert.alert(
        '⚡ Cards Minted!',
        `Successfully minted ${amount} copies of "${selectedDesign.name}"\n\nEdition #${newEdition}\nSerial Numbers: #1 - #${amount}`
      );

      setSelectedDesign(null);
      setMintAmount('10');
      fetchDesigns();
    } catch (error) {
      console.error('Error minting cards:', error);
      Alert.alert('Error', 'Failed to mint cards. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDesigns();
  };

  const getAvailableToMint = (design: CardDesign): string => {
    if (!design.max_supply) return '∞';
    const remaining = design.max_supply - design.total_minted;
    return remaining.toString();
  };

  return (
    <ScrollView
      style={styles.container}
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
        <Text style={styles.title}>⚡ Minting Station</Text>
        <Text style={styles.subtitle}>
          Create permanent card instances from designs
        </Text>
      </View>

      {/* Selected Design Preview */}
      {selectedDesign ? (
        <View style={styles.mintPanel}>
          <View style={styles.selectedCard}>
            <View style={[styles.cardBadge, { backgroundColor: RARITY_COLORS[selectedDesign.rarity] }]}>
              <Text style={styles.cardBadgeText}>{selectedDesign.rarity.toUpperCase()}</Text>
            </View>
            <Text style={styles.selectedCardName}>{selectedDesign.name}</Text>
            <Text style={styles.selectedCardStats}>
              {selectedDesign.total_minted} minted • {getAvailableToMint(selectedDesign)} available
            </Text>
          </View>

          <View style={styles.mintForm}>
            <Text style={styles.inputLabel}>MINT AMOUNT</Text>
            <TextInput
              style={styles.mintInput}
              value={mintAmount}
              onChangeText={setMintAmount}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={colors.textMuted}
            />
            
            <View style={styles.quickAmounts}>
              {['10', '25', '50', '100'].map((amt) => (
                <Pressable
                  key={amt}
                  style={[styles.quickButton, mintAmount === amt && styles.quickButtonActive]}
                  onPress={() => setMintAmount(amt)}
                >
                  <Text style={[styles.quickButtonText, mintAmount === amt && styles.quickButtonTextActive]}>
                    {amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.mintButton, minting && styles.mintButtonDisabled]}
              onPress={handleMint}
              disabled={minting}
            >
              <Text style={styles.mintButtonText}>
                {minting ? 'MINTING...' : `⚡ MINT ${mintAmount} CARDS`}
              </Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setSelectedDesign(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Select a Design to Mint</Text>
          
          {designs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <Text style={styles.emptyTitle}>No Designs Yet</Text>
              <Text style={styles.emptyText}>
                Create card designs first, then mint them here
              </Text>
            </View>
          ) : (
            <View style={styles.designsGrid}>
              {designs.map((design) => (
                <Pressable
                  key={design.id}
                  style={[styles.designCard, { borderColor: RARITY_COLORS[design.rarity] }]}
                  onPress={() => setSelectedDesign(design)}
                >
                  <View style={[styles.designRarity, { backgroundColor: RARITY_COLORS[design.rarity] }]}>
                    <Text style={styles.designRarityText}>{design.rarity.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.designName} numberOfLines={1}>{design.name}</Text>
                  <Text style={styles.designType}>{design.card_type.replace('_', ' ')}</Text>
                  <View style={styles.designStats}>
                    <Text style={styles.designMinted}>
                      {design.total_minted} minted
                    </Text>
                    {design.max_supply && (
                      <Text style={styles.designSupply}>
                        / {design.max_supply}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },

  // Header
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Section
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
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
    textAlign: 'center',
  },

  // Designs Grid
  designsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  designCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    ...shadows.sm,
  },
  designRarity: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  designRarityText: {
    ...typography.label,
    color: colors.background,
    fontSize: 12,
  },
  designName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  designType: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
    marginBottom: spacing.sm,
  },
  designStats: {
    flexDirection: 'row',
  },
  designMinted: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  designSupply: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Mint Panel
  mintPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.lg,
  },
  selectedCard: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  cardBadgeText: {
    ...typography.label,
    color: colors.background,
    fontSize: 10,
  },
  selectedCardName: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectedCardStats: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Mint Form
  mintForm: {
    gap: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  mintInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.h2,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  quickButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  quickButtonTextActive: {
    color: colors.primary,
  },
  mintButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  mintButtonDisabled: {
    opacity: 0.6,
  },
  mintButtonText: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

