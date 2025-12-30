import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, TextInput, Searchbar, Avatar, 
  Chip, Modal, Portal, Divider, IconButton, DataTable,
  Menu,
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { Player, CardDesign } from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';
import DeleteConfirmModal from '../../src/components/DeleteConfirmModal';
import CardPreview from '../../src/components/CardPreview';

interface PlayerWithStats extends Player {
  cards_count: number;
}

interface OwnedCard {
  id: string;
  serial_number: number;
  edition: number;
  card_designs: CardDesign;
}

interface Transaction {
  id: string;
  type: string;
  ducats_amount: number | null;
  description: string | null;
  created_at: string;
}

export default function PlayersScreen() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected player state
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'inventory' | 'history'>('details');
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Grant ducats state
  const [grantAmount, setGrantAmount] = useState('100');
  const [granting, setGranting] = useState(false);
  
  // Delete state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerWithStats | null>(null);
  
  // Menu state
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Inventory & History
  const [playerCards, setPlayerCards] = useState<OwnedCard[]>([]);
  const [playerTransactions, setPlayerTransactions] = useState<Transaction[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPlayers = async () => {
    try {
      // Get players with their card counts
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get card counts for each player
      const playersWithStats: PlayerWithStats[] = [];
      
      for (const player of playersData || []) {
        const { count } = await supabase
          .from('card_instances')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', player.id);
        
        playersWithStats.push({
          ...player,
          cards_count: count || 0,
        });
      }

      setPlayers(playersWithStats);
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
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount');
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
        description: `GM granted ${amount} ducats`,
      });

      Alert.alert(
        '✅ Ducats Granted!',
        `${amount} ducats sent to @${selectedPlayer.username}\n\nNew balance: ${selectedPlayer.ducats + amount} ducats`
      );

      // Update local state
      setSelectedPlayer(prev => prev ? { ...prev, ducats: prev.ducats + amount } : null);
      setGrantAmount('100');
      fetchPlayers();
    } catch (error) {
      console.error('Error granting ducats:', error);
      Alert.alert('Error', 'Failed to grant ducats');
    } finally {
      setGranting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPlayer) return;

    if (!editName.trim() || !editUsername.trim()) {
      Alert.alert('Error', 'Name and username cannot be empty');
      return;
    }

    if (editUsername.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setSaving(true);

    try {
      // Check if username is taken by another player
      if (editUsername.toLowerCase() !== selectedPlayer.username.toLowerCase()) {
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('username', editUsername.toLowerCase())
          .neq('id', selectedPlayer.id)
          .single();

        if (existing) {
          Alert.alert('Error', 'Username is already taken');
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('players')
        .update({
          name: editName.trim(),
          username: editUsername.toLowerCase().trim(),
        })
        .eq('id', selectedPlayer.id);

      if (error) throw error;

      Alert.alert('✅ Updated', 'Player profile has been updated');
      
      // Update local state
      setSelectedPlayer(prev => prev ? {
        ...prev,
        name: editName.trim(),
        username: editUsername.toLowerCase().trim(),
      } : null);
      
      setEditMode(false);
      fetchPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
      Alert.alert('Error', 'Failed to update player');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      // Delete the player (cascades to decks, deck_cards due to FK)
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerToDelete.id);

      if (error) throw error;

      Alert.alert('✅ Deleted', `Player @${playerToDelete.username} has been removed`);
      
      setDeleteModalVisible(false);
      setPlayerToDelete(null);
      setModalVisible(false);
      setSelectedPlayer(null);
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      Alert.alert('Error', 'Failed to delete player');
    }
  };

  const loadPlayerCards = async (playerId: string) => {
    setLoadingCards(true);
    try {
      const { data, error } = await supabase
        .from('card_instances')
        .select(`
          id,
          serial_number,
          edition,
          card_designs (*)
        `)
        .eq('owner_id', playerId)
        .order('minted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPlayerCards(data as unknown as OwnedCard[] || []);
    } catch (error) {
      console.error('Error loading player cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  const loadPlayerHistory = async (playerId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`to_player_id.eq.${playerId},from_player_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPlayerTransactions(data || []);
    } catch (error) {
      console.error('Error loading player history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlayers();
  };

  const openPlayerModal = (player: PlayerWithStats) => {
    setSelectedPlayer(player);
    setEditName(player.name);
    setEditUsername(player.username);
    setModalTab('details');
    setEditMode(false);
    setModalVisible(true);
    setPlayerCards([]);
    setPlayerTransactions([]);
  };

  const switchTab = (tab: 'details' | 'inventory' | 'history') => {
    setModalTab(tab);
    if (tab === 'inventory' && playerCards.length === 0 && selectedPlayer) {
      loadPlayerCards(selectedPlayer.id);
    }
    if (tab === 'history' && playerTransactions.length === 0 && selectedPlayer) {
      loadPlayerHistory(selectedPlayer.id);
    }
  };

  const totalDucats = players.reduce((sum, p) => sum + p.ducats, 0);
  const avgBalance = players.length > 0 ? Math.round(totalDucats / players.length) : 0;
  const totalCards = players.reduce((sum, p) => sum + p.cards_count, 0);

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
              <Text style={styles.statValue}>{totalCards}</Text>
              <Text style={styles.statLabel}>Cards Owned</Text>
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
                <DataTable.Title numeric>Cards</DataTable.Title>
                <DataTable.Title numeric>Balance</DataTable.Title>
                <DataTable.Title numeric>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredPlayers.map((player) => (
                <DataTable.Row key={player.id}>
                  <DataTable.Cell>
                    <View style={styles.playerCell}>
                      {player.avatar_url ? (
                        <Avatar.Image size={32} source={{ uri: player.avatar_url }} style={styles.avatar} />
                      ) : (
                        <Avatar.Text 
                          size={32} 
                          label={player.name.charAt(0)} 
                          style={styles.avatar}
                        />
                      )}
                      <View>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.username}>@{player.username}</Text>
                      </View>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={styles.cardsCount}>🃏 {player.cards_count}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Chip compact style={styles.balanceChip}>
                      💰 {player.ducats.toLocaleString()}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Menu
                      visible={menuVisible === player.id}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton 
                          icon="dots-vertical" 
                          size={20}
                          onPress={() => setMenuVisible(player.id)}
                        />
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          setMenuVisible(null);
                          openPlayerModal(player);
                        }} 
                        title="View Details"
                        leadingIcon="account"
                      />
                      <Menu.Item 
                        onPress={() => {
                          setMenuVisible(null);
                          openPlayerModal(player);
                          setEditMode(true);
                        }} 
                        title="Edit Player"
                        leadingIcon="pencil"
                      />
                      <Menu.Item 
                        onPress={() => {
                          setMenuVisible(null);
                          openPlayerModal(player);
                        }} 
                        title="Give Ducats"
                        leadingIcon="currency-usd"
                      />
                      <Divider />
                      <Menu.Item 
                        onPress={() => {
                          setMenuVisible(null);
                          setPlayerToDelete(player);
                          setDeleteModalVisible(true);
                        }} 
                        title="Delete Player"
                        leadingIcon="delete"
                        titleStyle={{ color: adminColors.error }}
                      />
                    </Menu>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card>
        )}
      </ScrollView>

      {/* Player Modal */}
      <Portal>
        <Modal 
          visible={modalVisible} 
          onDismiss={() => {
            setModalVisible(false);
            setEditMode(false);
          }} 
          contentContainerStyle={styles.modal}
        >
          {selectedPlayer && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? 'Edit Player' : 'Player Details'}
                </Text>
                <IconButton icon="close" onPress={() => {
                  setModalVisible(false);
                  setEditMode(false);
                }} />
              </View>

              {/* Tabs */}
              <View style={styles.tabRow}>
                <Chip 
                  selected={modalTab === 'details'} 
                  onPress={() => switchTab('details')}
                  style={styles.tabChip}
                >
                  Details
                </Chip>
                <Chip 
                  selected={modalTab === 'inventory'} 
                  onPress={() => switchTab('inventory')}
                  style={styles.tabChip}
                >
                  Inventory ({selectedPlayer.cards_count})
                </Chip>
                <Chip 
                  selected={modalTab === 'history'} 
                  onPress={() => switchTab('history')}
                  style={styles.tabChip}
                >
                  History
                </Chip>
              </View>

              {modalTab === 'details' && (
                <>
                  {/* Profile */}
                  <View style={styles.profileSection}>
                    {selectedPlayer.avatar_url ? (
                      <Avatar.Image size={80} source={{ uri: selectedPlayer.avatar_url }} style={styles.profileAvatar} />
                    ) : (
                      <Avatar.Text 
                        size={80} 
                        label={selectedPlayer.name.charAt(0)} 
                        style={styles.profileAvatar}
                      />
                    )}
                    
                    {editMode ? (
                      <View style={styles.editFields}>
                        <TextInput
                          label="Display Name"
                          value={editName}
                          onChangeText={setEditName}
                          mode="outlined"
                          style={styles.editInput}
                        />
                        <TextInput
                          label="Username"
                          value={editUsername}
                          onChangeText={setEditUsername}
                          mode="outlined"
                          style={styles.editInput}
                          autoCapitalize="none"
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.profileName}>{selectedPlayer.name}</Text>
                        <Text style={styles.profileUsername}>@{selectedPlayer.username}</Text>
                      </>
                    )}
                  </View>

                  {editMode ? (
                    <View style={styles.editActions}>
                      <Button 
                        mode="outlined" 
                        onPress={() => {
                          setEditMode(false);
                          setEditName(selectedPlayer.name);
                          setEditUsername(selectedPlayer.username);
                        }}
                        style={styles.editButton}
                      >
                        Cancel
                      </Button>
                      <Button 
                        mode="contained" 
                        onPress={handleSaveEdit}
                        loading={saving}
                        disabled={saving}
                        style={styles.editButton}
                      >
                        Save Changes
                      </Button>
                    </View>
                  ) : (
                    <Button 
                      mode="outlined" 
                      icon="pencil"
                      onPress={() => setEditMode(true)}
                      style={styles.editToggleButton}
                    >
                      Edit Profile
                    </Button>
                  )}

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
                        <Text style={styles.profileStatValue}>🃏 {selectedPlayer.cards_count}</Text>
                        <Text style={styles.profileStatLabel}>Cards</Text>
                      </Card.Content>
                    </Card>
                  </View>

                  <Divider style={styles.divider} />

                  {/* Grant Ducats */}
                  <Text style={styles.sectionLabel}>💰 Grant Ducats</Text>
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

                  {/* Danger Zone */}
                  <Text style={[styles.sectionLabel, { color: adminColors.error }]}>⚠️ Danger Zone</Text>
                  <Button 
                    mode="outlined" 
                    icon="delete"
                    textColor={adminColors.error}
                    style={styles.deleteButton}
                    onPress={() => {
                      setPlayerToDelete(selectedPlayer);
                      setDeleteModalVisible(true);
                    }}
                  >
                    Delete Player
                  </Button>
                </>
              )}

              {modalTab === 'inventory' && (
                <View style={styles.inventoryTab}>
                  {loadingCards ? (
                    <Text style={styles.loadingText}>Loading cards...</Text>
                  ) : playerCards.length === 0 ? (
                    <View style={styles.emptyTabContent}>
                      <Text style={styles.emptyTabIcon}>📦</Text>
                      <Text style={styles.emptyTabText}>No cards owned</Text>
                    </View>
                  ) : (
                    <View style={styles.cardsGrid}>
                      {playerCards.map((card) => (
                        <View key={card.id} style={styles.cardItem}>
                          <CardPreview
                            name={card.card_designs.name}
                            manaCost={card.card_designs.mana_cost}
                            attack={card.card_designs.attack ?? undefined}
                            health={card.card_designs.health ?? undefined}
                            rarity={card.card_designs.rarity}
                            category={card.card_designs.category}
                            imageUrl={card.card_designs.image_url ?? undefined}
                            cardType={card.card_designs.card_type}
                            scale={0.5}
                          />
                          <Text style={styles.cardSerial}>#{card.serial_number}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {modalTab === 'history' && (
                <View style={styles.historyTab}>
                  {loadingHistory ? (
                    <Text style={styles.loadingText}>Loading history...</Text>
                  ) : playerTransactions.length === 0 ? (
                    <View style={styles.emptyTabContent}>
                      <Text style={styles.emptyTabIcon}>📜</Text>
                      <Text style={styles.emptyTabText}>No transactions yet</Text>
                    </View>
                  ) : (
                    playerTransactions.map((tx) => (
                      <View key={tx.id} style={styles.historyItem}>
                        <View style={styles.historyIcon}>
                          <Text>
                            {tx.type === 'grant_ducats' ? '💰' : 
                             tx.type === 'purchase' ? '🛒' :
                             tx.type === 'mint' ? '🎨' : '📦'}
                          </Text>
                        </View>
                        <View style={styles.historyContent}>
                          <Text style={styles.historyType}>
                            {tx.type.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.historyDesc}>{tx.description || '-'}</Text>
                          <Text style={styles.historyDate}>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        {tx.ducats_amount && (
                          <Text style={[
                            styles.historyAmount,
                            tx.ducats_amount > 0 ? styles.amountPositive : styles.amountNegative
                          ]}>
                            {tx.ducats_amount > 0 ? '+' : ''}{tx.ducats_amount}
                          </Text>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setPlayerToDelete(null);
        }}
        onConfirm={handleDeletePlayer}
        itemName={playerToDelete?.username ? `@${playerToDelete.username}` : ''}
        itemType="Player"
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
    fontSize: 11,
    color: adminColors.textSecondary,
  },
  cardsCount: {
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
    maxHeight: '90%',
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  tabChip: {
    flex: 1,
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

  // Edit mode
  editFields: {
    width: '100%',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  editInput: {
    backgroundColor: adminColors.surface,
  },
  editActions: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  editButton: {
    flex: 1,
  },
  editToggleButton: {
    marginBottom: adminSpacing.md,
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
  deleteButton: {
    borderColor: adminColors.error,
  },

  // Inventory tab
  inventoryTab: {
    minHeight: 200,
  },
  loadingText: {
    textAlign: 'center',
    color: adminColors.textSecondary,
    marginTop: adminSpacing.xl,
  },
  emptyTabContent: {
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  emptyTabIcon: {
    fontSize: 40,
    marginBottom: adminSpacing.sm,
  },
  emptyTabText: {
    color: adminColors.textSecondary,
    fontSize: 14,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    justifyContent: 'center',
  },
  cardItem: {
    alignItems: 'center',
  },
  cardSerial: {
    fontSize: 10,
    color: adminColors.textSecondary,
    marginTop: 2,
  },

  // History tab
  historyTab: {
    minHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.sm,
    backgroundColor: adminColors.background,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.sm,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.sm,
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.accent,
  },
  historyDesc: {
    fontSize: 13,
    color: adminColors.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: adminColors.textSecondary,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountPositive: {
    color: adminColors.success,
  },
  amountNegative: {
    color: adminColors.error,
  },
});
