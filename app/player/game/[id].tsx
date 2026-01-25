import { useState, useEffect, useCallback, useRef } from 'react';
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
  createMulliganAction,
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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  
  // Use refs to track latest state for subscription callbacks
  const gameStateRef = useRef<GameState | null>(null);
  const isSyncingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Ref to store the game instance for stable reference
  const gameInstanceRef = useRef<GameInstance | null>(null);

  // Helper function to apply server state without replacing the instance
  const applyServerState = useCallback((serverState: GameState) => {
    const currentState = gameStateRef.current;
    const serverTimestamp = serverState.lastAction?.timestamp || 0;
    const localTimestamp = currentState?.lastAction?.timestamp || 0;
    
    // Detect what changed
    const activePlayerChanged = currentState?.activePlayerId !== serverState.activePlayerId;
    const turnChanged = currentState?.currentTurn !== serverState.currentTurn;
    const phaseChanged = currentState?.phase !== serverState.phase;
    const boardChanged = 
      currentState?.player1?.board?.length !== serverState.player1?.board?.length ||
      currentState?.player2?.board?.length !== serverState.player2?.board?.length;
    const handChanged = 
      currentState?.player1?.hand?.length !== serverState.player1?.hand?.length ||
      currentState?.player2?.hand?.length !== serverState.player2?.hand?.length;
    const healthChanged =
      currentState?.player1?.health !== serverState.player1?.health ||
      currentState?.player2?.health !== serverState.player2?.health;
    
    // Apply if ANY meaningful change occurred
    const hasChanges = serverTimestamp > localTimestamp || 
                       activePlayerChanged || 
                       turnChanged || 
                       phaseChanged ||
                       boardChanged ||
                       handChanged ||
                       healthChanged;
    
    if (hasChanges) {
      // Only log significant changes
      if (turnChanged || activePlayerChanged) {
        console.log('✅ SYNC: Applying server state');
        console.log('  - Turn:', currentState?.currentTurn, '→', serverState.currentTurn);
        console.log('  - Active player:', serverState.activePlayerId?.slice(0, 8));
      }
      
      // Prevent sync loops
      isSyncingRef.current = true;
      
      // Update the game state
      setGameState(serverState);
      gameStateRef.current = serverState;
      
      // If we don't have an instance yet, create one
      if (!gameInstanceRef.current) {
        console.log('📦 Creating new GameInstance (first time)');
        const newInstance = new GameInstance(serverState);
        
        // Subscribe to sync local changes to database
        newInstance.subscribe(async (newState) => {
          console.log('🎮 SUBSCRIBER: Action dispatched!');
          console.log('   Action:', newState.lastAction?.type);
          console.log('   isSyncingRef:', isSyncingRef.current);
          
          if (!isSyncingRef.current) {
            console.log('📤 SAVE: Saving action to database...');
            console.log('   Turn:', newState.currentTurn, 'Active:', newState.activePlayerId?.slice(0, 8));
            setGameState(newState);
            gameStateRef.current = newState;
            
            const saved = await matchmakingService.updateGameState(gameRoomId!, newState);
            console.log('   Save result:', saved ? '✅ SUCCESS' : '❌ FAILED');
            
            if (!saved) {
              console.error('❌ CRITICAL: Failed to save game state to database!');
            }
          } else {
            console.log('⏳ SKIP: Syncing in progress, not saving');
          }
        });
        
        gameInstanceRef.current = newInstance;
        setGameInstance(newInstance);
      } else {
        // Update existing instance's internal state AND notify subscribers for UI update
        gameInstanceRef.current.setState(serverState, true);
      }
      
      // Reset sync flag quickly to allow next action
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
      
      return true;
    }
    return false;
  }, [gameRoomId]);

  // Load game room and initialize game
  useEffect(() => {
    if (!gameRoomId || !player) return;

    loadGame();

    // Subscribe to game room changes for real-time sync
    const unsubscribe = matchmakingService.subscribeToGame(gameRoomId, (updatedRoom) => {
      console.log('🔔 REALTIME: Received update from database');
      console.log('   Turn:', updatedRoom.current_turn, 'Active:', updatedRoom.active_player_id?.slice(0, 8));
      setGameRoom(updatedRoom);

      // If opponent updated game state, sync it
      if (updatedRoom.game_state) {
        const applied = applyServerState(updatedRoom.game_state as GameState);
        console.log('   Applied:', applied ? 'YES' : 'NO (same state)');
      }
      
      // Check if game ended
      if (updatedRoom.status === 'ended' && updatedRoom.winner_id) {
        setGameEnded(true);
        setWinnerId(updatedRoom.winner_id);
      }
    });

    return unsubscribe;
  }, [gameRoomId, player, applyServerState]);

  // AGGRESSIVE POLLING: Poll for game state for instant sync
  // This ensures the game stays in sync regardless of realtime issues
  useEffect(() => {
    if (!gameRoomId || !player || loading) return;
    
    let isPolling = true;
    let pollCount = 0;
    let lastPollTime = 0;

    const pollGameState = async () => {
      if (!isPolling) return;

      // Prevent polling too frequently (minimum 100ms between polls)
      const now = Date.now();
      if (now - lastPollTime < 100) return;
      lastPollTime = now;

      try {
        const room = await matchmakingService.getGameRoom(gameRoomId);
        if (room?.game_state) {
          const applied = applyServerState(room.game_state as GameState);
          if (applied) {
            console.log('🔄 POLL: New state applied from server');
          }
        }
        
        // Check if game ended
        if (room?.status === 'ended' && room?.winner_id) {
          setGameEnded(true);
          setWinnerId(room.winner_id);
        }
        
        // Log every 10th poll to show it's working
        pollCount++;
        if (pollCount % 10 === 0) {
          console.log(`🔄 Poll #${pollCount} - Turn: ${room?.current_turn}, Active: ${room?.active_player_id?.slice(0, 8)}`);
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    };

    // Poll every 200ms for ultra-fast sync
    const pollInterval = setInterval(pollGameState, 200);
    
    // Also poll immediately on mount
    pollGameState();
    
    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [gameRoomId, player, loading, applyServerState]);

  // Resume polling when tab becomes visible
  useEffect(() => {
    if (!gameRoomId || !player) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('📱 Tab became visible - fetching latest state');
        try {
          const room = await matchmakingService.getGameRoom(gameRoomId);
          if (room?.game_state) {
            applyServerState(room.game_state as GameState);
          }
        } catch (error) {
          console.warn('Failed to fetch game state on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameRoomId, player, applyServerState]);

  // Track player presence - mark as connected when entering game
  useEffect(() => {
    if (!gameRoomId || !player) return;

    const markConnected = async () => {
      try {
        const { error } = await (supabase.rpc as any)('update_player_presence', {
          p_game_room_id: gameRoomId,
          p_player_id: player.id,
          p_connected: true
        });

        if (error) {
          console.warn('Failed to mark player as connected:', error);
        } else {
          console.log('Player marked as connected to game');
        }
      } catch (err) {
        console.warn('Error marking player connected:', err);
      }
    };

    markConnected();
  }, [gameRoomId, player]);

  // Track player disconnection when leaving the game
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (gameRoomId && player) {
        try {
          await (supabase.rpc as any)('update_player_presence', {
            p_game_room_id: gameRoomId,
            p_player_id: player.id,
            p_connected: false
          });
          console.log('Player marked as disconnected from game');
        } catch (err) {
          console.warn('Error marking player disconnected:', err);
        }
      }
    };

    // Handle page unload
    const unsubscribe = () => {
      handleBeforeUnload();
    };

    return unsubscribe;
  }, [gameRoomId, player]);

  // Handle visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!gameRoomId || !player) return;

      const isVisible = !document.hidden;
      try {
        await (supabase.rpc as any)('update_player_presence', {
          p_game_room_id: gameRoomId,
          p_player_id: player.id,
          p_connected: isVisible
        });

        console.log(`Player ${isVisible ? 'connected' : 'disconnected'} (visibility change)`);
      } catch (err) {
        console.warn('Error updating presence on visibility change:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

      console.log('📥 Loading game room:', room.id);
      console.log('  - Status:', room.status);
      console.log('  - Has game_state:', !!room.game_state);
      console.log('  - Player 1:', room.player1_id);
      console.log('  - Player 2:', room.player2_id);
      console.log('  - Current player:', player.id);

      // Check if game already has state
      if (room.game_state) {
        console.log('📥 Resuming existing game from database');
        const existingState = room.game_state as GameState;
        console.log('  - Active player:', existingState.activePlayerId);
        console.log('  - Current turn:', existingState.currentTurn);
        console.log('  - Is my turn:', existingState.activePlayerId === player.id);
        
        // Resume existing game - create instance with subscriber
        const instance = new GameInstance(existingState);
        
        // Set up the subscription to sync changes to database
        instance.subscribe(async (newState) => {
          console.log('🎮 SUBSCRIBER (loadGame): Action dispatched!');
          console.log('   Action:', newState.lastAction?.type);
          console.log('   isSyncingRef:', isSyncingRef.current);
          
          if (!isSyncingRef.current) {
            console.log('📤 SAVE: Local action -> Database');
            console.log('   Turn:', newState.currentTurn, 'Active:', newState.activePlayerId?.slice(0, 8));
            setGameState(newState);
            gameStateRef.current = newState;
            const saved = await matchmakingService.updateGameState(gameRoomId, newState);
            console.log('   Save result:', saved ? '✅ SUCCESS' : '❌ FAILED');
          } else {
            console.log('⏳ SKIP SAVE: Currently syncing from server');
          }
        });
        
        setGameState(existingState);
        gameStateRef.current = existingState;
        gameInstanceRef.current = instance;
        setGameInstance(instance);
      } else {
        // Initialize new game (only first player to arrive does this)
        console.log('🆕 Initializing new game...');
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

    try {
      console.log('=== Initializing game ===');
      console.log('Game room ID:', room.id);
      console.log('Player 1 ID:', room.player1_id);
      console.log('Player 2 ID:', room.player2_id);
      console.log('Player 1 Deck ID:', room.player1_deck_id);
      console.log('Player 2 Deck ID:', room.player2_deck_id);

      // Validate deck IDs exist
      if (!room.player1_deck_id) {
        throw new Error('Player 1 has no deck selected');
      }
      if (!room.player2_deck_id) {
        throw new Error('Player 2 has no deck selected');
      }

      // Load player decks
      console.log('Loading player decks...');
      let player1Deck, player2Deck;
      try {
        [player1Deck, player2Deck] = await Promise.all([
          loadDeckCards(room.player1_deck_id),
          loadDeckCards(room.player2_deck_id),
        ]);
      } catch (deckError) {
        console.error('Failed to load deck cards:', deckError);
        throw new Error(`Failed to load decks: ${deckError instanceof Error ? deckError.message : 'Unknown error'}`);
      }

      console.log('Player 1 deck loaded:', player1Deck.length, 'cards');
      console.log('Player 2 deck loaded:', player2Deck.length, 'cards');

      // Validate decks
      if (player1Deck.length === 0) {
        throw new Error('Player 1 deck is empty - add cards to your deck');
      }
      if (player2Deck.length === 0) {
        throw new Error('Player 2 deck is empty - opponent has no cards');
      }

      // Get player data (name and avatar)
      console.log('Loading player data...');
      const [player1Data, player2Data] = await Promise.all([
        (supabase.from('players') as any).select('name, avatar_url').eq('id', room.player1_id).single(),
        (supabase.from('players') as any).select('name, avatar_url').eq('id', room.player2_id).single(),
      ]);

      if (player1Data.error) {
        console.error('Error loading player1:', player1Data.error);
        throw new Error(`Failed to load player 1 data: ${player1Data.error.message}`);
      }
      if (player2Data.error) {
        console.error('Error loading player2:', player2Data.error);
        throw new Error(`Failed to load player 2 data: ${player2Data.error.message}`);
      }

      console.log('Player 1 name:', player1Data.data?.name);
      console.log('Player 2 name:', player2Data.data?.name);

      // Debug: log deck sizes
      console.log('Player 1 deck size:', player1Deck.length);
      console.log('Player 2 deck size:', player2Deck.length);

      // Create game state
      const initialGameState = createGame({
        gameId: room.id,
        player1Id: room.player1_id,
        player1Name: player1Data.data?.name || 'Player 1',
        player1AvatarUrl: player1Data.data?.avatar_url || undefined,
        player1Deck: player1Deck,
        player2Id: room.player2_id,
        player2Name: player2Data.data?.name || 'Player 2',
        player2AvatarUrl: player2Data.data?.avatar_url || undefined,
        player2Deck: player2Deck,
      });

      // Debug: log initial state
      console.log('Initial game state - Player 1 hand:', initialGameState.player1.hand.length);
      console.log('Initial game state - Player 2 hand:', initialGameState.player2.hand.length);
      console.log('Initial game state - Player 1 deck:', initialGameState.player1.deck.length);
      console.log('Initial game state - Player 2 deck:', initialGameState.player2.deck.length);
      console.log('Initial game phase:', initialGameState.phase);

      // Create game instance
      const instance = new GameInstance(initialGameState);
      
      // Auto-complete mulligan for both players (skip mulligan phase)
      // This transitions the game from 'mulligan' to 'playing' and starts the first turn
      instance.completeMulligan(room.player1_id, []);
      
      // Debug: log after first mulligan
      console.log('After P1 mulligan - phase:', instance.getState().phase);
      console.log('After P1 mulligan - P1 hand:', instance.getState().player1.hand.length);
      
      // Only call second mulligan if still in mulligan phase (shouldn't be needed)
      if (instance.getState().phase === 'mulligan') {
        instance.completeMulligan(room.player2_id, []);
      }
      
      // Get the final game state after mulligan
      const finalGameState = instance.getState();
      
      // Debug: log final state
      console.log('Final game state - Player 1 hand:', finalGameState.player1.hand.length);
      console.log('Final game state - Player 2 hand:', finalGameState.player2.hand.length);
      console.log('Final game phase:', finalGameState.phase);
      console.log('Active player:', finalGameState.activePlayerId);
      console.log('Current turn:', finalGameState.currentTurn);

      // Save initial state to database
      console.log('📤 Saving initial game state to database');
      const saved = await matchmakingService.updateGameState(room.id, finalGameState, 'playing');
      if (!saved) {
        console.warn('Failed to save initial game state, continuing anyway');
      }
      
      // Subscribe to state changes to sync with database
      instance.subscribe(async (newState) => {
        console.log('🎮 SUBSCRIBER (initializeGame): Action dispatched!');
        console.log('   Action:', newState.lastAction?.type);
        console.log('   isSyncingRef:', isSyncingRef.current);
        
        if (!isSyncingRef.current) {
          console.log('📤 SAVE: Saving state change to database (from initialize)');
          console.log('   Turn:', newState.currentTurn, 'Active:', newState.activePlayerId?.slice(0, 8));
          setGameState(newState);
          gameStateRef.current = newState;
          const saveResult = await matchmakingService.updateGameState(room.id, newState);
          console.log('   Save result:', saveResult ? '✅ SUCCESS' : '❌ FAILED');
        } else {
          console.log('⏳ SKIP SAVE: Currently syncing from server');
        }
      });

      setGameState(finalGameState);
      gameStateRef.current = finalGameState;
      gameInstanceRef.current = instance;
      setGameInstance(instance);
    } catch (error) {
      console.error('Error initializing game:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize game');
      setLoading(false);
    }
  };

  const loadDeckCards = async (deckId: string): Promise<CardInHand[]> => {
    try {
      console.log('=== Loading deck cards ===');
      console.log('Deck ID:', deckId);
      
      // First, let's check how many deck_cards exist for this deck
      const { count: deckCardCount, error: countError } = await supabase
        .from('deck_cards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId);
      
      console.log('Deck cards count in database:', deckCardCount, countError ? `Error: ${countError.message}` : '');
      
      // Use explicit foreign key hint for card_effects since it has two FKs to card_designs:
      // card_design_id (primary) and summon_card_id (optional for summon effects)
      const { data, error } = await (supabase
        .from('deck_cards') as any)
        .select(`
          card_instance_id,
          card_instances (
            id,
            design_id,
            card_designs (
              *,
              card_keywords!card_design_id (keyword),
              card_effects!card_design_id (*)
            )
          )
        `)
        .eq('deck_id', deckId);

      if (error) {
        console.error('Error loading deck cards:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Raw data returned:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('First record sample:', JSON.stringify(data[0], null, 2).substring(0, 500));
      }

      if (!data || data.length === 0) {
        console.warn('Deck has no cards returned from query:', deckId);
        console.warn('This could be due to RLS policy - player may not have access to this deck');
        return [];
      }

      const cards: CardInHand[] = [];
      
      for (const item of data) {
        // Check if card_instance exists
        if (!item.card_instances) {
          console.warn('Card instance not found for deck_card:', item.card_instance_id);
          continue;
        }

        const instance = item.card_instances;
        
        // Check if design exists
        if (!instance.card_designs) {
          console.warn('Card design not found for instance:', instance.id);
          continue;
        }

        const design = instance.card_designs;
        
        // Build keywords array
        const keywords = Array.isArray(design.card_keywords) 
          ? design.card_keywords.map((k: any) => k.keyword)
          : [];

        // Build effects array
        const effects = Array.isArray(design.card_effects) 
          ? design.card_effects
          : [];

        cards.push({
          id: `hand_${instance.id}_${Math.random().toString(36).substr(2, 9)}`,
          cardInstanceId: instance.id,
          design: {
            ...design,
            keywords,
            effects,
          } as CardDesignFull,
        });
      }

      console.log(`Loaded ${cards.length} cards from deck ${deckId}`);
      return cards;
    } catch (error) {
      console.error('Error loading deck:', error);
      throw error; // Re-throw to let initializeGame handle it
    }
  };

  const handleGameEnd = useCallback((winner: string) => {
    setGameEnded(true);
    setWinnerId(winner);
  }, []);

  // Callback to save game state to database - MUST be before early returns
  const handleStateChange = useCallback(async (newState: GameState) => {
    console.log('🔄 handleStateChange called');
    console.log('   Turn:', newState.currentTurn, 'Active:', newState.activePlayerId?.slice(0, 8));
    gameStateRef.current = newState;
    setGameState(newState);
    const saved = await matchmakingService.updateGameState(gameRoomId!, newState);
    console.log('   Save result:', saved ? '✅ SUCCESS' : '❌ FAILED');
    return saved;
  }, [gameRoomId]);

  const handleReturnToMenu = () => {
    router.replace('/player');
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
        onStateChange={handleStateChange}
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

