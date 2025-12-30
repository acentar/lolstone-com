import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { useMatchmaking, formatWaitTime } from '../../src/hooks/useMatchmaking';
import { Deck } from '../../src/types/database';
import { MatchmakingScreen } from '../../src/components/game';
import { spacing } from '../../src/constants/theme';

export default function PlayScreen() {
  const { player } = useAuthContext();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  useEffect(() => {
    loadDecks();
  }, [player?.id]);

  const loadDecks = async () => {
    if (!player?.id) return;

    setLoading(true);
    try {
      // Get decks with at least 30 cards
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
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameStart = (gameRoomId: string) => {
    router.push(`/player/game/${gameRoomId}`);
  };

  if (showMatchmaking && player) {
    return (
      <MatchmakingScreen
        playerId={player.id}
        playerName={player.name}
        decks={decks}
        onGameStart={handleGameStart}
        onCancel={() => setShowMatchmaking(false)}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Battle Arena</Text>
        <Text style={styles.subtitle}>Challenge other players</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : decks.length === 0 ? (
        <View style={styles.noDeckContainer}>
          <Text style={styles.noDeckEmoji}>⚠️</Text>
          <Text style={styles.noDeckTitle}>No Valid Decks</Text>
          <Text style={styles.noDeckText}>
            You need a deck with at least 30 cards to play.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/player/decks')}
            style={styles.buildDeckButton}
          >
            Build a Deck
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Game Modes */}
          <View style={styles.modesSection}>
            <Text style={styles.sectionTitle}>Game Modes</Text>
            
            {/* Quick Match */}
            <View style={styles.modeCard}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']}
                style={styles.modeGradient}
              >
                <View style={styles.modeHeader}>
                  <Text style={styles.modeEmoji}>⚔️</Text>
                  <View style={styles.modeInfo}>
                    <Text style={styles.modeName}>Quick Match</Text>
                    <Text style={styles.modeDescription}>
                      Find a random opponent for a casual battle
                    </Text>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={() => setShowMatchmaking(true)}
                  style={styles.playButton}
                  buttonColor="#22c55e"
                >
                  Play Now
                </Button>
              </LinearGradient>
            </View>

            {/* Ranked (Coming Soon) */}
            <View style={[styles.modeCard, styles.modeCardDisabled]}>
              <View style={styles.modeHeader}>
                <Text style={styles.modeEmoji}>🏆</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>Ranked</Text>
                  <Text style={styles.modeDescription}>
                    Climb the ladder and earn rewards
                  </Text>
                </View>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
            </View>

            {/* Practice (Coming Soon) */}
            <View style={[styles.modeCard, styles.modeCardDisabled]}>
              <View style={styles.modeHeader}>
                <Text style={styles.modeEmoji}>🤖</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>Practice</Text>
                  <Text style={styles.modeDescription}>
                    Battle against AI opponents
                  </Text>
                </View>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
            </View>
          </View>

          {/* Active Deck Info */}
          <View style={styles.activeDeckSection}>
            <Text style={styles.sectionTitle}>Your Active Deck</Text>
            {decks.find(d => d.is_active) ? (
              <View style={styles.activeDeckCard}>
                <Text style={styles.activeDeckName}>
                  {decks.find(d => d.is_active)!.name}
                </Text>
                <Text style={styles.activeDeckReady}>✓ Ready for battle</Text>
              </View>
            ) : (
              <View style={styles.noActiveDeck}>
                <Text style={styles.noActiveDeckText}>
                  No active deck selected. Set one in your Decks tab.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDeckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  noDeckEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  noDeckTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noDeckText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buildDeckButton: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  modesSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  modeCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  modeCardDisabled: {
    opacity: 0.6,
    padding: spacing.md,
  },
  modeGradient: {
    padding: spacing.md,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  modeDescription: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  playButton: {
    borderRadius: 8,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  activeDeckSection: {
    marginTop: 'auto',
  },
  activeDeckCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeDeckName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  activeDeckReady: {
    color: '#22c55e',
    fontSize: 13,
    marginTop: 4,
  },
  noActiveDeck: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  noActiveDeckText: {
    color: '#f59e0b',
    fontSize: 13,
  },
});

