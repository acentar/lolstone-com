import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Divider, ProgressBar } from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign } from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

const RARITY_COLORS: Record<string, string> = {
  common: adminColors.common,
  uncommon: adminColors.uncommon,
  rare: adminColors.rare,
  epic: adminColors.epic,
  legendary: adminColors.legendary,
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

    if (selectedDesign.max_supply) {
      const remaining = selectedDesign.max_supply - selectedDesign.total_minted;
      if (amount > remaining) {
        Alert.alert('Supply Limit', `Only ${remaining} cards can be minted for this design`);
        return;
      }
    }

    setMinting(true);

    try {
      const { data: currentEditionData } = await supabase
        .rpc('get_current_edition', { design_uuid: selectedDesign.id });
      
      const newEdition = (currentEditionData || 0) + 1;

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

      const { error: updateError } = await supabase
        .from('card_designs')
        .update({ total_minted: selectedDesign.total_minted + amount })
        .eq('id', selectedDesign.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        type: 'mint',
        game_master_id: gameMaster.id,
        description: `Minted ${amount} copies of "${selectedDesign.name}" (Edition #${newEdition})`,
      });

      Alert.alert(
        'Cards Minted!',
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

  const getSupplyInfo = (design: CardDesign) => {
    if (!design.max_supply) return { remaining: '∞', progress: 0, hasLimit: false };
    const remaining = design.max_supply - design.total_minted;
    const progress = design.total_minted / design.max_supply;
    return { remaining: remaining.toString(), progress, hasLimit: true };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Minting Station</Text>
        <Text style={styles.subtitle}>Create permanent card instances from designs</Text>
      </View>

      {selectedDesign ? (
        /* Minting Panel */
        <Card style={styles.mintPanel} mode="elevated">
          <Card.Content>
            <View style={styles.selectedHeader}>
              <View>
                <Chip style={{ backgroundColor: RARITY_COLORS[selectedDesign.rarity] + '20' }}>
                  {selectedDesign.rarity.toUpperCase()}
                </Chip>
              </View>
              <Button mode="text" onPress={() => setSelectedDesign(null)}>Cancel</Button>
            </View>

            <Text style={styles.selectedName}>{selectedDesign.name}</Text>
            
            <View style={styles.supplyInfo}>
              <Text style={styles.supplyLabel}>
                {selectedDesign.total_minted} minted
                {selectedDesign.max_supply && ` / ${selectedDesign.max_supply} max`}
              </Text>
              {selectedDesign.max_supply && (
                <ProgressBar 
                  progress={selectedDesign.total_minted / selectedDesign.max_supply} 
                  color={adminColors.accent}
                  style={styles.supplyBar}
                />
              )}
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.inputLabel}>Mint Amount</Text>
            <TextInput
              value={mintAmount}
              onChangeText={setMintAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.mintInput}
            />

            <View style={styles.quickAmounts}>
              {['10', '25', '50', '100'].map((amt) => (
                <Chip
                  key={amt}
                  selected={mintAmount === amt}
                  onPress={() => setMintAmount(amt)}
                  style={styles.quickChip}
                >
                  {amt}
                </Chip>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={handleMint}
              loading={minting}
              disabled={minting}
              style={styles.mintButton}
              contentStyle={styles.mintButtonContent}
            >
              Mint {mintAmount} Cards
            </Button>
          </Card.Content>
        </Card>
      ) : (
        /* Design Selection */
        <>
          <Text style={styles.sectionTitle}>Select a Design to Mint</Text>

          {designs.length === 0 ? (
            <Card style={styles.emptyCard} mode="outlined">
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🎨</Text>
                <Text style={styles.emptyTitle}>No Designs Yet</Text>
                <Text style={styles.emptyText}>Create card designs first, then mint them here</Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.designsGrid}>
              {designs.map((design) => {
                const supply = getSupplyInfo(design);
                return (
                  <Card
                    key={design.id}
                    style={styles.designCard}
                    mode="elevated"
                    onPress={() => setSelectedDesign(design)}
                  >
                    <View style={[styles.designRarityBar, { backgroundColor: RARITY_COLORS[design.rarity] }]} />
                    <Card.Content style={styles.designContent}>
                      <Text style={styles.designName} numberOfLines={1}>{design.name}</Text>
                      <Text style={styles.designType}>{design.card_type.replace('_', ' ')}</Text>
                      <View style={styles.designStats}>
                        <Text style={styles.designMinted}>{design.total_minted} minted</Text>
                        {supply.hasLimit && (
                          <Text style={styles.designRemaining}>{supply.remaining} left</Text>
                        )}
                      </View>
                      {supply.hasLimit && (
                        <ProgressBar 
                          progress={supply.progress} 
                          color={RARITY_COLORS[design.rarity]}
                          style={styles.designProgress}
                        />
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
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
    backgroundColor: adminColors.background,
  },
  content: {
    padding: adminSpacing.lg,
  },

  // Header
  header: {
    marginBottom: adminSpacing.xl,
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

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.md,
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
  },
  emptyText: {
    fontSize: 14,
    color: adminColors.textSecondary,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
  },

  // Designs Grid
  designsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
  },
  designCard: {
    flex: 1,
    minWidth: 160,
    maxWidth: 200,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
  },
  designRarityBar: {
    height: 4,
  },
  designContent: {
    padding: adminSpacing.md,
  },
  designName: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: 4,
  },
  designType: {
    fontSize: 12,
    color: adminColors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: adminSpacing.sm,
  },
  designStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  designMinted: {
    fontSize: 12,
    color: adminColors.textSecondary,
  },
  designRemaining: {
    fontSize: 12,
    color: adminColors.success,
  },
  designProgress: {
    marginTop: adminSpacing.sm,
    height: 4,
    borderRadius: 2,
  },

  // Mint Panel
  mintPanel: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  selectedName: {
    fontSize: 24,
    fontWeight: '700',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.sm,
  },
  supplyInfo: {
    marginBottom: adminSpacing.md,
  },
  supplyLabel: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.xs,
  },
  supplyBar: {
    height: 6,
    borderRadius: 3,
  },
  divider: {
    marginVertical: adminSpacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.textSecondary,
    marginBottom: adminSpacing.sm,
  },
  mintInput: {
    backgroundColor: adminColors.surface,
    marginBottom: adminSpacing.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  quickChip: {
    flex: 1,
  },
  mintButton: {
    borderRadius: adminRadius.md,
  },
  mintButtonContent: {
    paddingVertical: adminSpacing.xs,
  },
});
