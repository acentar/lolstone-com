/**
 * Matchmaking Screen Component
 * 
 * UI for finding a match:
 * - Deck selection
 * - Queue status
 * - Finding opponent animation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchmaking, formatWaitTime, MatchmakingState } from '../../hooks/useMatchmaking';
import { Deck } from '../../types/database';

interface MatchmakingScreenProps {
  playerId: string;
  playerName: string;
  decks: Deck[];
  selectedDeckId?: string;
  onGameStart: (gameRoomId: string) => void;
  onCancel: () => void;
}

export default function MatchmakingScreen({
  playerId,
  playerName,
  decks,
  selectedDeckId: initialDeckId,
  onGameStart,
  onCancel,
}: MatchmakingScreenProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(
    initialDeckId || (decks.length > 0 ? decks[0].id : null)
  );

  const {
    state,
    queuePosition,
    waitTime,
    gameRoomId,
    gameRoom,
    error,
    joinQueue,
    leaveQueue,
  } = useMatchmaking(playerId);

  // Animation values
  const searchPulse = useSharedValue(1);
  const searchRotation = useSharedValue(0);

  useEffect(() => {
    if (state === 'searching') {
      searchPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      searchRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [state]);

  // Navigate to game when match found
  useEffect(() => {
    if (state === 'in_game' && gameRoomId) {
      onGameStart(gameRoomId);
    }
  }, [state, gameRoomId, onGameStart]);

  // Auto-start searching if deck was pre-selected
  useEffect(() => {
    if (initialDeckId && selectedDeckId && state === 'idle') {
      joinQueue(selectedDeckId);
    }
  }, []);

  const animatedSearchStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: searchPulse.value },
      { rotate: `${searchRotation.value}deg` },
    ],
  }));

  const handleFindMatch = () => {
    if (selectedDeckId) {
      joinQueue(selectedDeckId);
    }
  };

  const handleCancel = () => {
    if (state === 'searching') {
      leaveQueue();
    }
    onCancel();
  };

  const renderDeckSelection = () => (
    <View style={styles.deckSection}>
      <Text style={styles.sectionTitle}>Select Your Deck</Text>
      {decks.length === 0 ? (
        <View style={styles.noDeckWarning}>
          <Text style={styles.warningText}>⚠️ You need to create a deck first!</Text>
        </View>
      ) : (
        <View style={styles.deckList}>
          {decks.map((deck) => (
            <Pressable
              key={deck.id}
              style={[
                styles.deckCard,
                selectedDeckId === deck.id && styles.deckCardSelected,
              ]}
              onPress={() => setSelectedDeckId(deck.id)}
            >
              <Text style={styles.deckName}>{deck.name}</Text>
              {selectedDeckId === deck.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const renderSearching = () => (
    <View style={styles.searchingContainer}>
      <Animated.View style={[styles.searchRing, animatedSearchStyle]}>
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.searchRingGradient}
        />
      </Animated.View>
      
      <View style={styles.searchContent}>
        <Text style={styles.searchingText}>Finding Opponent...</Text>
        <Text style={styles.waitTimeText}>{formatWaitTime(waitTime)}</Text>
        {queuePosition && (
          <Text style={styles.queuePosition}>
            Queue position: #{queuePosition}
          </Text>
        )}
      </View>

      <Button
        mode="outlined"
        onPress={leaveQueue}
        style={styles.cancelButton}
        textColor="#ef4444"
      >
        Cancel
      </Button>
    </View>
  );

  const renderMatchFound = () => (
    <View style={styles.matchFoundContainer}>
      <Text style={styles.matchFoundEmoji}>⚔️</Text>
      <Text style={styles.matchFoundText}>Match Found!</Text>
      <ActivityIndicator size="large" color="#22c55e" style={styles.loading} />
      <Text style={styles.loadingText}>Loading game...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>❌</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Button mode="contained" onPress={() => joinQueue(selectedDeckId!)}>
        Try Again
      </Button>
    </View>
  );

  return (
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
          onPress={handleCancel}
        />
        <Text style={styles.title}>Find a Match</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerInitial}>
            {playerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.playerName}>{playerName}</Text>
      </View>

      {/* Content based on state */}
      <View style={styles.content}>
        {state === 'idle' && renderDeckSelection()}
        {state === 'searching' && renderSearching()}
        {state === 'found' && renderMatchFound()}
        {state === 'error' && renderError()}
      </View>

      {/* Action Button (when idle) */}
      {state === 'idle' && (
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.findMatchButton,
              !selectedDeckId && styles.findMatchButtonDisabled,
            ]}
            onPress={handleFindMatch}
            disabled={!selectedDeckId}
          >
            <LinearGradient
              colors={selectedDeckId ? ['#22c55e', '#16a34a'] : ['#475569', '#334155']}
              style={styles.findMatchGradient}
            >
              <Text style={styles.findMatchText}>🎮 FIND MATCH</Text>
            </LinearGradient>
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  playerInfo: {
    alignItems: 'center',
    marginVertical: 24,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  playerInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deckSection: {
    flex: 1,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noDeckWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  warningText: {
    color: '#ef4444',
    fontSize: 16,
  },
  deckList: {
    gap: 12,
  },
  deckCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deckCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  deckName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  checkmark: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: '700',
  },
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    padding: 4,
    marginBottom: 32,
  },
  searchRingGradient: {
    flex: 1,
    borderRadius: 100,
    opacity: 0.5,
  },
  searchContent: {
    alignItems: 'center',
    position: 'absolute',
  },
  searchingText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  waitTimeText: {
    color: '#94a3b8',
    fontSize: 32,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  queuePosition: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 32,
    borderColor: '#ef4444',
  },
  matchFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchFoundEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  matchFoundText: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  loading: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  findMatchButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  findMatchButtonDisabled: {
    opacity: 0.5,
  },
  findMatchGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  findMatchText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

