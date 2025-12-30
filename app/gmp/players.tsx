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
  Alert,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { Player } from '../../src/types/database';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/constants/theme';

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Grant ducats form
  const [grantAmount, setGrantAmount] = useState('100');
  const [granting, setGranting] = useState(false);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrantDucats = async () => {
    if (!selectedPlayer) return;

    const amount = parseInt(grantAmount);
    if (isNaN(amount) || amount < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setGranting(true);

    try {
      // Update player ducats
      const { error: updateError } = await supabase
        .from('players')
        .update({ ducats: selectedPlayer.ducats + amount })
        .eq('id', selectedPlayer.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('transactions').insert({
        type: 'grant_ducats',
        to_player_id: selectedPlayer.id,
        ducats_amount: amount,
        description: `Granted ${amount} ducats to @${selectedPlayer.username}`,
      });

      Alert.alert(
        '💰 Ducats Granted!',
        `${amount} ducats sent to @${selectedPlayer.username}\n\nNew balance: ${selectedPlayer.ducats + amount} ducats`
      );

      setModalVisible(false);
      setSelectedPlayer(null);
      setGrantAmount('100');
      fetchPlayers();
    } catch (error) {
      console.error('Error granting ducats:', error);
      Alert.alert('Error', 'Failed to grant ducats');
    } finally {
      setGranting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlayers();
  };

  const openPlayerModal = (player: Player) => {
    setSelectedPlayer(player);
    setModalVisible(true);
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
            <Text style={styles.title}>👥 Players</Text>
            <Text style={styles.subtitle}>{players.length} registered</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or @username..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{players.length}</Text>
            <Text style={styles.statLabel}>Total Players</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {players.reduce((sum, p) => sum + p.ducats, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Ducats</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {players.length > 0
                ? Math.round(players.reduce((sum, p) => sum + p.ducats, 0) / players.length)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Balance</Text>
          </View>
        </View>

        {/* Players List */}
        {filteredPlayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👻</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No players found' : 'No Players Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Players will appear here when they sign up'}
            </Text>
          </View>
        ) : (
          <View style={styles.playersList}>
            {filteredPlayers.map((player) => (
              <Pressable
                key={player.id}
                style={styles.playerCard}
                onPress={() => openPlayerModal(player)}
              >
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerUsername}>@{player.username}</Text>
                </View>
                <View style={styles.playerBalance}>
                  <Text style={styles.balanceValue}>{player.ducats.toLocaleString()}</Text>
                  <Text style={styles.balanceLabel}>ducats</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Player Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlayer && (
              <>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </Pressable>
                </View>

                {/* Player Profile */}
                <View style={styles.profileSection}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selectedPlayer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>{selectedPlayer.name}</Text>
                  <Text style={styles.profileUsername}>@{selectedPlayer.username}</Text>
                </View>

                {/* Stats */}
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>
                      💰 {selectedPlayer.ducats.toLocaleString()}
                    </Text>
                    <Text style={styles.profileStatLabel}>Ducats</Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>🃏 0</Text>
                    <Text style={styles.profileStatLabel}>Cards</Text>
                  </View>
                </View>

                {/* Grant Ducats Section */}
                <View style={styles.grantSection}>
                  <Text style={styles.grantTitle}>Grant Ducats</Text>
                  <View style={styles.grantForm}>
                    <TextInput
                      style={styles.grantInput}
                      value={grantAmount}
                      onChangeText={setGrantAmount}
                      keyboardType="numeric"
                      placeholder="Amount"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Pressable
                      style={[styles.grantButton, granting && styles.grantButtonDisabled]}
                      onPress={handleGrantDucats}
                      disabled={granting}
                    >
                      <Text style={styles.grantButtonText}>
                        {granting ? '...' : '💰 Grant'}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.quickGrants}>
                    {['100', '500', '1000', '5000'].map((amt) => (
                      <Pressable
                        key={amt}
                        style={styles.quickGrantButton}
                        onPress={() => setGrantAmount(amt)}
                      >
                        <Text style={styles.quickGrantText}>{amt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>📦 View Inventory</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>📜 Transaction History</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.actionButtonDanger]}>
                    <Text style={styles.actionButtonTextDanger}>🚫 Ban Player</Text>
                  </Pressable>
                </View>
              </>
            )}
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
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Search
  searchContainer: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
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

  // Players List
  playersList: {
    gap: spacing.sm,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    ...typography.h3,
    color: colors.background,
  },
  playerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  playerUsername: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  playerBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    ...typography.h3,
    color: colors.legendary,
    fontSize: 16,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
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
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textMuted,
    padding: spacing.sm,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileAvatarText: {
    ...typography.h1,
    color: colors.background,
  },
  profileName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  profileUsername: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Profile Stats
  profileStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  profileStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileStatLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Grant Section
  grantSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.legendary,
  },
  grantTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grantForm: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  grantInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grantButton: {
    backgroundColor: colors.legendary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonDisabled: {
    opacity: 0.6,
  },
  grantButtonText: {
    ...typography.label,
    color: colors.background,
  },
  quickGrants: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickGrantButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickGrantText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Actions Section
  actionsSection: {
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionButtonDanger: {
    borderColor: colors.error,
  },
  actionButtonTextDanger: {
    ...typography.body,
    color: colors.error,
  },
});

