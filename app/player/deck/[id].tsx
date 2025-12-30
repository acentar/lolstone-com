import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput as RNTextInput } from 'react-native';
import { Text, IconButton, ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../src/lib/supabase';
import { useAuthContext } from '../../../src/context/AuthContext';
import { CardDesign, Deck } from '../../../src/types/database';
import CardPreview from '../../../src/components/CardPreview';
import { spacing } from '../../../src/constants/theme';

interface OwnedCard {
  card_instance_id: string;
  card_design: CardDesign;
  owned_count: number;
  in_deck_count: number;
}

export default function DeckBuilderScreen() {
  const { id: deckId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { player } = useAuthContext();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<string[]>([]); // Card instance IDs in deck
  const [availableCards, setAvailableCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    loadDeck();
    loadAvailableCards();
  }, [deckId, player?.id]);

  const loadDeck = async () => {
    if (!deckId) return;

    try {
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;
      setDeck(deckData);
      setDeckName(deckData.name);

      // Get cards in deck
      const { data: cardsData, error: cardsError } = await supabase
        .from('deck_cards')
        .select('card_instance_id')
        .eq('deck_id', deckId);

      if (cardsError) throw cardsError;
      setDeckCards(cardsData?.map(c => c.card_instance_id) || []);
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  const loadAvailableCards = async () => {
    if (!player?.id) return;

    setLoading(true);
    try {
      // Get all owned card instances with their designs
      const { data, error } = await supabase
        .from('card_instances')
        .select(`
          id,
          design_id,
          card_designs (*)
        `)
        .eq('owner_id', player.id);

      if (error) throw error;

      // Group by design
      const cardMap = new Map<string, OwnedCard>();
      
      for (const instance of data || []) {
        const designId = instance.design_id;
        if (cardMap.has(designId)) {
          cardMap.get(designId)!.owned_count++;
        } else {
          cardMap.set(designId, {
            card_instance_id: instance.id,
            card_design: instance.card_designs as unknown as CardDesign,
            owned_count: 1,
            in_deck_count: 0,
          });
        }
      }

      setAvailableCards(Array.from(cardMap.values()));
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCardToDeck = async (cardInstanceId: string) => {
    if (deckCards.length >= 30) return;
    
    // Check if we can add more of this card (max 2 per deck, except legendaries which are 1)
    const card = availableCards.find(c => c.card_instance_id === cardInstanceId);
    if (!card) return;

    const countInDeck = deckCards.filter(id => {
      const existingCard = availableCards.find(c => c.card_instance_id === id);
      return existingCard?.card_design.id === card.card_design.id;
    }).length;

    const maxCopies = card.card_design.rarity === 'legendary' ? 1 : 2;
    if (countInDeck >= maxCopies) return;
    if (countInDeck >= card.owned_count) return;

    try {
      const { error } = await supabase
        .from('deck_cards')
        .insert({
          deck_id: deckId,
          card_instance_id: cardInstanceId,
        });

      if (error) throw error;
      setDeckCards([...deckCards, cardInstanceId]);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const removeCardFromDeck = async (cardInstanceId: string) => {
    try {
      const { error } = await supabase
        .from('deck_cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('card_instance_id', cardInstanceId);

      if (error) throw error;
      setDeckCards(deckCards.filter(id => id !== cardInstanceId));
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const saveDeckName = async () => {
    if (!deckName.trim()) return;

    setSaving(true);
    try {
      await supabase
        .from('decks')
        .update({ name: deckName })
        .eq('id', deckId);

      setEditingName(false);
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setSaving(false);
    }
  };

  // Group available cards for display
  const groupedCards = availableCards.map(card => ({
    ...card,
    in_deck_count: deckCards.filter(id => {
      const deckCard = availableCards.find(c => c.card_instance_id === id);
      return deckCard?.card_design.id === card.card_design.id;
    }).length,
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#f8fafc"
            size={24}
            onPress={() => router.back()}
          />
          
          {editingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                value={deckName}
                onChangeText={setDeckName}
                style={styles.nameInput}
                autoFocus
              />
              <IconButton
                icon="check"
                iconColor="#22c55e"
                size={20}
                onPress={saveDeckName}
              />
            </View>
          ) : (
            <Pressable 
              style={styles.nameContainer}
              onPress={() => setEditingName(true)}
            >
              <Text style={styles.deckName}>{deckName}</Text>
              <IconButton icon="pencil" iconColor="#94a3b8" size={16} />
            </Pressable>
          )}
          
          <Text style={styles.cardCount}>{deckCards.length}/30</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(deckCards.length / 30) * 100}%` },
                deckCards.length >= 30 && styles.progressComplete,
              ]} 
            />
          </View>
          {deckCards.length >= 30 ? (
            <Text style={styles.progressText}>✓ Deck complete!</Text>
          ) : (
            <Text style={styles.progressText}>
              Add {30 - deckCards.length} more cards
            </Text>
          )}
        </View>

        {/* Available Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : availableCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No Cards Available</Text>
            <Text style={styles.emptyText}>
              You need cards to build a deck! The Game Master can mint cards for you.
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.cardsScroll}
            contentContainerStyle={styles.cardsGrid}
            showsVerticalScrollIndicator={false}
          >
            {groupedCards.map((card) => {
              const maxCopies = card.card_design.rarity === 'legendary' ? 1 : 2;
              const canAdd = card.in_deck_count < maxCopies && 
                            card.in_deck_count < card.owned_count &&
                            deckCards.length < 30;

              return (
                <Pressable 
                  key={card.card_instance_id} 
                  style={styles.cardWrapper}
                  onPress={() => canAdd && addCardToDeck(card.card_instance_id)}
                >
                  <CardPreview
                    name={card.card_design.name}
                    manaCost={card.card_design.mana_cost}
                    attack={card.card_design.attack ?? undefined}
                    health={card.card_design.health ?? undefined}
                    rarity={card.card_design.rarity}
                    category={card.card_design.category}
                    imageUrl={card.card_design.image_url ?? undefined}
                    cardType={card.card_design.card_type}
                    scale={0.55}
                  />
                  
                  {/* Count Badge */}
                  <View style={[
                    styles.countBadge,
                    card.in_deck_count > 0 && styles.countBadgeActive,
                  ]}>
                    <Text style={styles.countText}>
                      {card.in_deck_count}/{Math.min(maxCopies, card.owned_count)}
                    </Text>
                  </View>

                  {/* Add/Remove Buttons */}
                  {card.in_deck_count > 0 && (
                    <Pressable 
                      style={styles.removeButton}
                      onPress={() => removeCardFromDeck(card.card_instance_id)}
                    >
                      <Text style={styles.removeButtonText}>−</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  nameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    height: 40,
  },
  cardCount: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressComplete: {
    backgroundColor: '#22c55e',
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  },
  cardsScroll: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  cardWrapper: {
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  countBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
});

