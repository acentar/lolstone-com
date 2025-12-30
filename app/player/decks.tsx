import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, FAB, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { Deck } from '../../src/types/database';
import { spacing } from '../../src/constants/theme';

interface DeckWithCardCount extends Deck {
  card_count: number;
}

export default function DecksScreen() {
  const { player } = useAuthContext();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCardCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, [player?.id]);

  const loadDecks = async () => {
    if (!player?.id) return;

    setLoading(true);
    try {
      // Get decks with card count
      const { data, error } = await supabase
        .from('decks')
        .select(`
          *,
          deck_cards (count)
        `)
        .eq('player_id', player.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const decksWithCount = (data || []).map(deck => ({
        ...deck,
        card_count: deck.deck_cards?.[0]?.count || 0,
      }));

      setDecks(decksWithCount);
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewDeck = async () => {
    if (!player?.id) return;

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          player_id: player.id,
          name: `New Deck ${decks.length + 1}`,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/player/deck/${data.id}`);
    } catch (error) {
      console.error('Error creating deck:', error);
    }
  };

  const setActiveDeck = async (deckId: string) => {
    if (!player?.id) return;

    try {
      // Deactivate all decks
      await supabase
        .from('decks')
        .update({ is_active: false })
        .eq('player_id', player.id);

      // Activate selected deck
      await supabase
        .from('decks')
        .update({ is_active: true })
        .eq('id', deckId);

      loadDecks();
    } catch (error) {
      console.error('Error setting active deck:', error);
    }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      loadDecks();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Decks</Text>
        <Text style={styles.subtitle}>Build your battle strategy</Text>
      </View>

      {/* Decks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : decks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>No Decks Yet</Text>
          <Text style={styles.emptyText}>
            Create a deck to start building your collection!
          </Text>
          <Pressable style={styles.createButton} onPress={createNewDeck}>
            <Text style={styles.createButtonText}>+ Create First Deck</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView 
          style={styles.decksList}
          contentContainerStyle={styles.decksContent}
          showsVerticalScrollIndicator={false}
        >
          {decks.map((deck) => (
            <Pressable 
              key={deck.id} 
              style={[styles.deckCard, deck.is_active && styles.deckCardActive]}
              onPress={() => router.push(`/player/deck/${deck.id}`)}
            >
              <View style={styles.deckInfo}>
                <View style={styles.deckHeader}>
                  <Text style={styles.deckName}>{deck.name}</Text>
                  {deck.is_active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deckCardCount}>
                  {deck.card_count}/30 cards
                </Text>
                <View style={styles.deckProgress}>
                  <View 
                    style={[
                      styles.deckProgressFill,
                      { width: `${Math.min(100, (deck.card_count / 30) * 100)}%` },
                      deck.card_count >= 30 && styles.deckProgressComplete,
                    ]} 
                  />
                </View>
              </View>
              
              <View style={styles.deckActions}>
                {!deck.is_active && deck.card_count >= 30 && (
                  <IconButton
                    icon="check-circle"
                    iconColor="#22c55e"
                    size={24}
                    onPress={() => setActiveDeck(deck.id)}
                  />
                )}
                <IconButton
                  icon="delete"
                  iconColor="#ef4444"
                  size={24}
                  onPress={() => deleteDeck(deck.id)}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* FAB for new deck */}
      {decks.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={createNewDeck}
          color="#fff"
        />
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  decksList: {
    flex: 1,
  },
  decksContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 100,
  },
  deckCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deckCardActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  deckInfo: {
    flex: 1,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deckName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  deckCardCount: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  deckProgress: {
    height: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  deckProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  deckProgressComplete: {
    backgroundColor: '#22c55e',
  },
  deckActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    backgroundColor: '#3b82f6',
  },
});

