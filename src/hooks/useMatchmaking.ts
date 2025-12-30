/**
 * useMatchmaking Hook
 * 
 * React hook for matchmaking functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { matchmakingService, GameRoom } from '../services/matchmaking';

export type MatchmakingState = 
  | 'idle'          // Not in queue
  | 'searching'     // In queue, looking for opponent
  | 'found'         // Match found, loading game
  | 'in_game'       // Currently in a game
  | 'error';        // Error occurred

interface UseMatchmakingResult {
  state: MatchmakingState;
  queuePosition: number | null;
  waitTime: number;
  gameRoomId: string | null;
  gameRoom: GameRoom | null;
  error: string | null;
  joinQueue: (deckId: string) => Promise<void>;
  leaveQueue: () => Promise<void>;
  checkActiveGame: () => Promise<void>;
}

export function useMatchmaking(playerId: string | null): UseMatchmakingResult {
  const [state, setState] = useState<MatchmakingState>('idle');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [waitTime, setWaitTime] = useState(0);
  const [gameRoomId, setGameRoomId] = useState<string | null>(null);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer for queue wait time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (state === 'searching') {
      interval = setInterval(() => {
        setWaitTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  // Poll queue position
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state === 'searching' && playerId) {
      const checkPosition = async () => {
        const pos = await matchmakingService.getQueuePosition(playerId);
        setQueuePosition(pos);
      };

      checkPosition();
      interval = setInterval(checkPosition, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, playerId]);

  // Set up match found callback
  useEffect(() => {
    matchmakingService.onMatchFound((roomId) => {
      setGameRoomId(roomId);
      setState('found');
      loadGameRoom(roomId);
    });
  }, []);

  const loadGameRoom = async (roomId: string) => {
    const room = await matchmakingService.getGameRoom(roomId);
    if (room) {
      setGameRoom(room);
      setState('in_game');
    }
  };

  const joinQueue = useCallback(async (deckId: string) => {
    if (!playerId) {
      setError('Not logged in');
      setState('error');
      return;
    }

    setState('searching');
    setError(null);

    const { gameRoomId: roomId, error: joinError } = await matchmakingService.joinQueue(playerId, deckId);

    if (joinError) {
      setError(joinError.message || 'Failed to join queue');
      setState('error');
      return;
    }

    if (roomId) {
      // Immediate match found
      setGameRoomId(roomId);
      setState('found');
      await loadGameRoom(roomId);
    }
    // Otherwise, stay in searching state - callback will handle match
  }, [playerId]);

  const leaveQueue = useCallback(async () => {
    if (!playerId) return;

    await matchmakingService.leaveQueue(playerId);
    setState('idle');
    setQueuePosition(null);
    setWaitTime(0);
    setGameRoomId(null);
    setGameRoom(null);
    setError(null);
  }, [playerId]);

  const checkActiveGame = useCallback(async () => {
    if (!playerId) return;

    const activeGameId = await matchmakingService.getActiveGame(playerId);
    if (activeGameId) {
      setGameRoomId(activeGameId);
      setState('found');
      await loadGameRoom(activeGameId);
    }
  }, [playerId]);

  // Check for active game on mount
  useEffect(() => {
    if (playerId) {
      checkActiveGame();
    }
  }, [playerId, checkActiveGame]);

  return {
    state,
    queuePosition,
    waitTime,
    gameRoomId,
    gameRoom,
    error,
    joinQueue,
    leaveQueue,
    checkActiveGame,
  };
}

/**
 * Format wait time as mm:ss
 */
export function formatWaitTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

