import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, TextInput, Searchbar, Avatar, 
  Chip, Modal, Portal, Divider, IconButton, DataTable,
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { Player } from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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
      const { error: updateError } = await supabase
        .from('players')
        .update({ ducats: selectedPlayer.ducats + amount })
        .eq('id', selectedPlayer.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        type: 'grant_ducats',
        to_player_id: selectedPlayer.id,
        ducats_amount: amount,
        description: `Granted ${amount} ducats to @${selectedPlayer.username}`,
      });

      Alert.alert(
        'Ducats Granted!',
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

  const totalDucats = players.reduce((sum, p) => sum + p.ducats, 0);
  const avgBalance = players.length > 0 ? Math.round(totalDucats / players.length) : 0;

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
          <Text style={styles.title}>Players</Text>
          <Text style={styles.subtitle}>{players.length} registered players</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} mode="elevated">
            <Card.Content style={styles.statContent}>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Total Players</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard} mode="elevated">
            <Card.Content style={styles.statContent}>
              <Text style={styles.statValue}>{totalDucats.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Ducats</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard} mode="elevated">
            <Card.Content style={styles.statContent}>
              <Text style={styles.statValue}>{avgBalance.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Avg Balance</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Search by name or username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />

        {/* Players List */}
        {filteredPlayers.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>👻</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No players found' : 'No Players Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search' : 'Players will appear here when they sign up'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.tableCard} mode="outlined">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Player</DataTable.Title>
                <DataTable.Title>Username</DataTable.Title>
                <DataTable.Title numeric>Balance</DataTable.Title>
                <DataTable.Title numeric>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredPlayers.map((player) => (
                <DataTable.Row key={player.id}>
                  <DataTable.Cell>
                    <View style={styles.playerCell}>
                      <Avatar.Text 
                        size={32} 
                        label={player.name.charAt(0)} 
                        style={styles.avatar}
                      />
                      <Text style={styles.playerName}>{player.name}</Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.username}>@{player.username}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Chip compact style={styles.balanceChip}>
                      💰 {player.ducats.toLocaleString()}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Button 
                      mode="text" 
                      compact 
                      onPress={() => openPlayerModal(player)}
                    >
                      Manage
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card>
        )}
      </ScrollView>

      {/* Player Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          {selectedPlayer && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Player Details</Text>
                <IconButton icon="close" onPress={() => setModalVisible(false)} />
              </View>

              {/* Profile */}
              <View style={styles.profileSection}>
                <Avatar.Text 
                  size={64} 
                  label={selectedPlayer.name.charAt(0)} 
                  style={styles.profileAvatar}
                />
                <Text style={styles.profileName}>{selectedPlayer.name}</Text>
                <Text style={styles.profileUsername}>@{selectedPlayer.username}</Text>
              </View>

              {/* Stats */}
              <View style={styles.profileStats}>
                <Card style={styles.profileStatCard} mode="outlined">
                  <Card.Content style={styles.profileStatContent}>
                    <Text style={styles.profileStatValue}>💰 {selectedPlayer.ducats.toLocaleString()}</Text>
                    <Text style={styles.profileStatLabel}>Ducats</Text>
                  </Card.Content>
                </Card>
                <Card style={styles.profileStatCard} mode="outlined">
                  <Card.Content style={styles.profileStatContent}>
                    <Text style={styles.profileStatValue}>🃏 0</Text>
                    <Text style={styles.profileStatLabel}>Cards</Text>
                  </Card.Content>
                </Card>
              </View>

              <Divider style={styles.divider} />

              {/* Grant Ducats */}
              <Text style={styles.sectionLabel}>Grant Ducats</Text>
              <View style={styles.grantRow}>
                <TextInput
                  value={grantAmount}
                  onChangeText={setGrantAmount}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.grantInput}
                  placeholder="Amount"
                />
                <Button 
                  mode="contained" 
                  onPress={handleGrantDucats}
                  loading={granting}
                  disabled={granting}
                  style={styles.grantButton}
                >
                  Grant
                </Button>
              </View>

              <View style={styles.quickGrants}>
                {['100', '500', '1000', '5000'].map((amt) => (
                  <Chip
                    key={amt}
                    onPress={() => setGrantAmount(amt)}
                    selected={grantAmount === amt}
                    style={styles.quickChip}
                  >
                    {amt}
                  </Chip>
                ))}
              </View>

              <Divider style={styles.divider} />

              {/* Actions */}
              <Button mode="outlined" style={styles.actionButton} icon="eye">
                View Inventory
              </Button>
              <Button mode="outlined" style={styles.actionButton} icon="history">
                Transaction History
              </Button>
            </ScrollView>
          )}
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
  },
  statContent: {
    alignItems: 'center',
    padding: adminSpacing.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.accent,
  },
  statLabel: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  // Search
  searchbar: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.lg,
    elevation: 0,
    borderWidth: 1,
    borderColor: adminColors.border,
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

  // Table
  tableCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  playerCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: adminColors.accent,
    marginRight: adminSpacing.sm,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.textPrimary,
  },
  username: {
    fontSize: 13,
    color: adminColors.textSecondary,
  },
  balanceChip: {
    backgroundColor: adminColors.warningLight,
  },

  // Modal
  modal: {
    backgroundColor: adminColors.surface,
    margin: adminSpacing.lg,
    padding: adminSpacing.lg,
    borderRadius: adminRadius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  profileAvatar: {
    backgroundColor: adminColors.accent,
    marginBottom: adminSpacing.md,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  profileUsername: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  profileStatCard: {
    flex: 1,
    borderColor: adminColors.border,
  },
  profileStatContent: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  profileStatLabel: {
    fontSize: 12,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  divider: {
    marginVertical: adminSpacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.sm,
  },
  grantRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  grantInput: {
    flex: 1,
    backgroundColor: adminColors.surface,
  },
  grantButton: {
    justifyContent: 'center',
    borderRadius: adminRadius.md,
  },
  quickGrants: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  quickChip: {
    flex: 1,
  },
  actionButton: {
    marginBottom: adminSpacing.sm,
    borderRadius: adminRadius.md,
  },
});
