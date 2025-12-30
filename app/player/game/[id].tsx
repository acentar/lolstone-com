import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../src/lib/supabase';
import { useAuthContext } from '../../../src/context/AuthContext';
import { matchmakingService, GameRoom } from '../../../src/services/matchmaking';
import { GameScreen } from '../../../src/components/game';
import {
  GameState,
  GameInstance,
  createGame,
  CardInHand,
} from '../../../src/game';
import { CardDesignFull } from '../../../src/types/database';
import { spacing } from '../../../src/constants/theme';

export default function GamePlayScreen() {
  const { id: gameRoomId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { player } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // Load game room and initialize game
  useEffect(() => {
    if (!gameRoomId || !player) return;
    
    loadGame();
    
    // Subscribe to game room changes
    const unsubscribe = matchmakingService.subscribeToGame(gameRoomId, (updatedRoom) => {
      setGameRoom(updatedRoom);
      
      // If opponent updated game state, sync it
      if (updatedRoom.game_state && gameInstance) {
        // Only update if it's a new state from opponent
        const currentState = gameInstance.getState();
        if (updatedRoom.game_state.lastAction?.timestamp > (currentState.lastAction?.timestamp || 0)) {
          // Reload game state from server
          // In a real implementation, we'd apply the action or sync state
        }
      }
    });

    return unsubscribe;
  }, [gameRoomId, player]);

  const loadGame = async () => {
    if (!gameRoomId || !player) return;

    setLoading(true);
    setError(null);

    try {
      // Get game room
      const room = await matchmakingService.getGameRoom(gameRoomId);
      if (!room) {
        setError('Game not found');
        return;
      }
      setGameRoom(room);

      // Check if game already has state
      if (room.game_state) {
        // Resume existing game
        const instance = new GameInstance(room.game_state as GameState);
        setGameInstance(instance);
      } else {
        // Initialize new game
        await initializeGame(room);
      }
    } catch (err) {
      console.error('Error loading game:', err);
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const initializeGame = async (room: GameRoom) => {
    if (!player) return;

    // Load player decks
    const [player1Deck, player2Deck] = await Promise.all([
      loadDeckCards(room.player1_deck_id),
      loadDeckCards(room.player2_deck_id),
    ]);

    // Get player names
    const [player1Data, player2Data] = await Promise.all([
      supabase.from('players').select('name').eq('id', room.player1_id).single(),
      supabase.from('players').select('name').eq('id', room.player2_id).single(),
    ]);

    // Create game state
    const gameState = createGame({
      gameId: room.id,
      player1Id: room.player1_id,
      player1Name: player1Data.data?.name || 'Player 1',
      player1Deck: player1Deck,
      player2Id: room.player2_id,
      player2Name: player2Data.data?.name || 'Player 2',
      player2Deck: player2Deck,
    });

    // Save initial state to database
    await matchmakingService.updateGameState(room.id, gameState, 'playing');

    // Create game instance
    const instance = new GameInstance(gameState);
    
    // Subscribe to state changes to sync with database
    instance.subscribe(async (newState) => {
      await matchmakingService.updateGameState(room.id, newState);
    });

    setGameInstance(instance);
  };

  const loadDeckCards = async (deckId: string): Promise<CardInHand[]> => {
    try {
      const { data, error } = await supabase
        .from('deck_cards')
        .select(`
          card_instance_id,
          card_instances (
            id,
            design_id,
            card_designs (
              *,
              card_keywords (keyword),
              card_effects (*)
            )
          )
        `)
        .eq('deck_id', deckId);

      if (error) throw error;

      return (data || []).map((item: any) => {
        const instance = item.card_instances;
        const design = instance.card_designs;
        
        return {
          id: `hand_${instance.id}_${Math.random().toString(36).substr(2, 9)}`,
          cardInstanceId: instance.id,
          design: {
            ...design,
            keywords: design.card_keywords?.map((k: any) => k.keyword) || [],
            effects: design.card_effects || [],
          } as CardDesignFull,
        };
      });
    } catch (error) {
      console.error('Error loading deck:', error);
      return [];
    }
  };

  const handleGameEnd = useCallback((winner: string) => {
    setGameEnded(true);
    setWinnerId(winner);
  }, []);

  const handleReturnToMenu = () => {
    router.replace('/player/play');
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={handleReturnToMenu}>
            Return to Menu
          </Button>
        </View>
      </LinearGradient>
    );
  }

  if (gameEnded) {
    const isWinner = winnerId === player?.id;
    
    return (
      <LinearGradient 
        colors={isWinner ? ['#0f172a', '#14532d'] : ['#0f172a', '#7f1d1d']} 
        style={styles.container}
      >
        <View style={styles.centerContent}>
          <Text style={styles.resultEmoji}>{isWinner ? '🏆' : '💀'}</Text>
          <Text style={[styles.resultText, isWinner ? styles.winText : styles.loseText]}>
            {isWinner ? 'VICTORY!' : 'DEFEAT'}
          </Text>
          <Button 
            mode="contained" 
            onPress={handleReturnToMenu}
            style={styles.returnButton}
          >
            Return to Menu
          </Button>
        </View>
      </LinearGradient>
    );
  }

  if (!gameInstance || !player) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GameScreen
        gameInstance={gameInstance}
        playerId={player.id}
        onGameEnd={handleGameEnd}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: spacing.md,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  resultText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  winText: {
    color: '#22c55e',
  },
  loseText: {
    color: '#ef4444',
  },
  returnButton: {
    marginTop: spacing.md,
  },
});

