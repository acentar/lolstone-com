import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/constants/theme';
import { Deck } from '../../src/types/database';

export default function PlayerHomeScreen() {
  const { player, refreshPlayer } = useAuthContext();
  const router = useRouter();
  const [stats, setStats] = useState({
    cardsOwned: 0,
    decksBuilt: 0,
    gamesWon: 0,
    gamesPlayed: 0,
  });
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [disconnectedGames, setDisconnectedGames] = useState<any[]>([]);
  const [deckMenuVisible, setDeckMenuVisible] = useState(false);

  // Background task to check for disconnected players and auto-declare winners
  useEffect(() => {
    const checkDisconnectedPlayers = async () => {
      try {
        // Check for disconnected games and declare winners
        const { error } = await supabase.rpc('check_disconnected_players');
        if (error) {
          console.warn('Error checking disconnected players:', error);
        }

        // Get disconnected games info for UI display
        const { data, error: fetchError } = await supabase.rpc('get_disconnected_games');
        if (fetchError) {
          console.warn('Error fetching disconnected games:', fetchError);
        } else {
          setDisconnectedGames(data || []);
        }
      } catch (err) {
        console.warn('Failed to check disconnected players:', err);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkDisconnectedPlayers, 30000);

    // Initial check
    checkDisconnectedPlayers();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (player?.id) {
      loadStats();
      loadDecks();
      loadActiveGames();
      refreshPlayer();
    }
  }, [player?.id]);

  const loadStats = async () => {
    if (!player?.id) return;

    try {
      // Get cards owned count
      const { count: cardsCount } = await supabase
        .from('card_instances')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', player.id);

      // Get decks count
      const { count: decksCount } = await supabase
        .from('decks')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', player.id);

      setStats({
        cardsOwned: cardsCount || 0,
        decksBuilt: decksCount || 0,
        gamesWon: 0, // TODO: Implement when game history is tracked
        gamesPlayed: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadDecks = async () => {
    if (!player?.id) return;

    try {
      const { data, error } = await supabase
        .from('decks')
        .select(`
          *,
          deck_cards (count)
        `)
        .eq('player_id', player.id);

      if (error) throw error;

      // Filter to decks with 30+ cards
      const validDecks = (data || []).filter(deck => {
        const cardCount = deck.deck_cards?.[0]?.count || 0;
        return cardCount >= 30;
      });

      setDecks(validDecks);

      // Check for saved deck preference in localStorage
      const savedDeckId = localStorage.getItem(`lolstone_selected_deck_${player.id}`);
      if (savedDeckId) {
        const savedDeck = validDecks.find(d => d.id === savedDeckId);
        if (savedDeck) {
          setSelectedDeck(savedDeck);
          return;
        }
      }

      // Fallback: auto-select the active deck if available
      const activeDeck = validDecks.find(d => d.is_active);
      if (activeDeck) {
        setSelectedDeck(activeDeck);
        // Save this choice
        localStorage.setItem(`lolstone_selected_deck_${player.id}`, activeDeck.id);
      }
    } catch (error) {
      console.error('Error loading decks:', error);
    }
  };

  const selectDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setDeckMenuVisible(false);
    // Save selection to localStorage
    localStorage.setItem(`lolstone_selected_deck_${player?.id}`, deck.id);
  };

  const loadActiveGames = async () => {
    if (!player?.id) return;

    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select(`
          id,
          status,
          player1_id,
          player2_id,
          player1_name,
          player2_name,
          created_at,
          players!game_rooms_player1_id_fkey (name, avatar_url)
        `)
        .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
        .eq('status', 'playing')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveGames(data || []);
    } catch (error) {
      console.error('Error loading active games:', error);
    }
  };

  const handlePlayPress = () => {
    if (!selectedDeck) {
      Alert.alert(
        'Select a Deck',
        'You must select a deck before playing. Go to your Decks tab to choose one.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Decks', onPress: () => router.push('/player/decks') }
        ]
      );
      return;
    }

    router.push('/player/play');
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.playerName}>{player?.name || 'Player'}</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>💰</Text>
            <Text style={styles.balanceValue}>{player?.ducats?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Quick Play Button */}
        <Pressable
          style={styles.playButton}
          onPress={handlePlayPress}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playGradient}
          >
            <Text style={styles.playEmoji}>⚔️</Text>
            <View>
              <Text style={styles.playText}>FIND A MATCH</Text>
              <Text style={styles.playSubtext}>Battle other players</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Deck Selection & Active Games */}
        <View style={styles.deckAndGamesSection}>
          <View style={styles.deckSection}>
            <Text style={styles.sectionTitle}>Battle Deck</Text>
            <View style={styles.deckSelectorContainer}>
              <Pressable
                style={[
                  styles.deckSelectorButton,
                  {
                    backgroundColor: selectedDeck ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    borderColor: selectedDeck ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                  }
                ]}
                onPress={() => setDeckMenuVisible(true)}
              >
                <Text style={styles.deckSelectorEmoji}>
                  {selectedDeck ? '⚔️' : '📚'}
                </Text>
                <View style={styles.deckSelectorInfo}>
                  <Text style={styles.deckSelectorLabel}>
                    {selectedDeck ? selectedDeck.name : 'Choose a deck'}
                  </Text>
                  <Text style={[
                    styles.deckSelectorStatus,
                    { color: selectedDeck ? '#22c55e' : '#f59e0b' }
                  ]}>
                    {selectedDeck ? 'Ready for battle' : 'Select to play'}
                  </Text>
                </View>
                <Text style={[
                  styles.deckSelectorArrow,
                  { color: selectedDeck ? '#22c55e' : '#f59e0b' }
                ]}>
                  {deckMenuVisible ? '▲' : '▼'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Active Games */}
          {activeGames.length > 0 && (
            <View style={styles.activeGamesSection}>
              <Text style={styles.sectionTitle}>Active Games</Text>
              {activeGames.slice(0, 2).map((game) => {
                // Check if this game has a disconnected player
                const disconnectedInfo = disconnectedGames.find(dg => dg.game_id === game.id);
                const isOpponentDisconnected = disconnectedInfo && disconnectedInfo.disconnected_player_id !== player?.id;
                const isPlayerDisconnected = disconnectedInfo && disconnectedInfo.disconnected_player_id === player?.id;
                const timeLeft = disconnectedInfo ? Math.max(0, 3 - disconnectedInfo.minutes_elapsed) : null;

                return (
                  <Pressable
                    key={game.id}
                    style={[
                      styles.activeGameCard,
                      isOpponentDisconnected && styles.activeGameCardWarning,
                      isPlayerDisconnected && styles.activeGameCardDanger
                    ]}
                    onPress={() => router.push(`/player/game/${game.id}`)}
                  >
                    <View style={styles.activeGameHeader}>
                      <Text style={styles.activeGameOpponent}>
                        vs {game.player1_id === player?.id ? game.player2_name : game.player1_name}
                      </Text>
                      <View style={[
                        styles.activeGameStatus,
                        isOpponentDisconnected && styles.activeGameStatusWarning,
                        isPlayerDisconnected && styles.activeGameStatusDanger
                      ]}>
                        <Text style={[
                          styles.activeGameStatusText,
                          (isOpponentDisconnected || isPlayerDisconnected) && styles.activeGameStatusTextWarning
                        ]}>
                          {isPlayerDisconnected ? 'YOU DC' :
                           isOpponentDisconnected ? 'OPP DC' : 'LIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.activeGameAction}>
                      {isPlayerDisconnected ?
                        `⚠️ Return in ${timeLeft?.toFixed(1)}m or lose!` :
                        isOpponentDisconnected ?
                        `🎯 Win in ${timeLeft?.toFixed(1)}m if they don't return!` :
                        'Tap to rejoin →'
                      }
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.gamesWon}</Text>
            <Text style={styles.statLabel}>Games Won</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.cardsOwned}</Text>
            <Text style={styles.statLabel}>Cards Owned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.decksBuilt}</Text>
            <Text style={styles.statLabel}>Decks Built</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionCard, styles.shopCard]}
            onPress={() => router.push('/player/shop')}
          >
            <Text style={styles.actionIcon}>🎁</Text>
            <Text style={styles.actionText}>Buy Boosters</Text>
          </Pressable>
          
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/player/collection')}
          >
            <Text style={styles.actionIcon}>🃏</Text>
            <Text style={styles.actionText}>Collection</Text>
          </Pressable>
          
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/player/decks')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Decks</Text>
          </Pressable>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyEmoji}>🎮</Text>
          <Text style={styles.emptyText}>No recent games</Text>
          <Text style={styles.emptySubtext}>Start playing to see your history!</Text>
        </View>
      </ScrollView>

      {/* Deck Selection Modal */}
      <Modal
        visible={deckMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeckMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeckMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Battle Deck</Text>

            {decks.length > 0 ? (
              decks.map((deck) => (
                <Pressable
                  key={deck.id}
                  style={[
                    styles.modalDeckItem,
                    selectedDeck?.id === deck.id && styles.modalDeckItemSelected
                  ]}
                  onPress={() => selectDeck(deck)}
                >
                  <View style={styles.modalDeckInfo}>
                    <Text style={styles.modalDeckName}>{deck.name}</Text>
                    <Text style={styles.modalDeckCards}>
                      {deck.deck_cards?.[0]?.count || 0} cards
                    </Text>
                  </View>
                  {selectedDeck?.id === deck.id && (
                    <Text style={styles.modalCheckmark}>✓</Text>
                  )}
                </Pressable>
              ))
            ) : (
              <View style={styles.modalEmptyState}>
                <Text style={styles.modalEmptyEmoji}>📚</Text>
                <Text style={styles.modalEmptyTitle}>No decks available</Text>
                <Text style={styles.modalEmptyText}>
                  Create a deck with at least 30 cards to play
                </Text>
              </View>
            )}

            <Pressable
              style={styles.modalCreateButton}
              onPress={() => {
                setDeckMenuVisible(false);
                router.push('/player/decks');
              }}
            >
              <Text style={styles.modalCreateText}>+ Create New Deck</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  greeting: {},
  welcomeText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 16,
  },
  balanceValue: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
  },
  playButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  playEmoji: {
    fontSize: 32,
  },
  playText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  deckAndGamesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  deckSection: {
    marginBottom: spacing.md,
  },
  deckSelectorContainer: {
    marginTop: spacing.sm,
  },
  deckSelectorButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckSelectorEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  deckSelectorInfo: {
    flex: 1,
  },
  deckSelectorLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  deckSelectorStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  deckSelectorArrow: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeGamesSection: {
    marginTop: spacing.md,
  },
  activeGameCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activeGameCardWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  activeGameCardDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  activeGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activeGameOpponent: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  activeGameStatus: {
    backgroundColor: '#22c55e',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeGameStatusWarning: {
    backgroundColor: '#f59e0b',
  },
  activeGameStatusDanger: {
    backgroundColor: '#ef4444',
  },
  activeGameStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  activeGameStatusTextWarning: {
    color: '#fff',
  },
  activeGameAction: {
    color: '#fca5a5',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    gap: 6,
  },
  shopCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  actionIcon: {
    fontSize: 28,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyActivity: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: 100,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: spacing.xl,
    margin: spacing.lg,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalDeckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  modalDeckItemSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  modalDeckInfo: {
    flex: 1,
  },
  modalDeckName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeckCards: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  modalCheckmark: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
  },
  modalEmptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalEmptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  modalEmptyTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  modalEmptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalCreateButton: {
    backgroundColor: '#3b82f6',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCreateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
