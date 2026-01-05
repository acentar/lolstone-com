/**
 * Matchmaking Service
 * 
 * Handles queue management and game room creation
 */

import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface QueueStatus {
  inQueue: boolean;
  position?: number;
  waitTime?: number;
}

export interface GameRoom {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_deck_id: string;
  player2_deck_id: string;
  status: 'waiting' | 'mulligan' | 'playing' | 'ended';
  current_turn: number;
  active_player_id: string | null;
  winner_id: string | null;
  game_state: any;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

class MatchmakingService {
  private queueChannel: RealtimeChannel | null = null;
  private gameChannel: RealtimeChannel | null = null;
  private onMatchFoundCallback: ((gameRoomId: string) => void) | null = null;
  private onGameStateChangeCallback: ((gameRoom: GameRoom) => void) | null = null;

  /**
   * Join the matchmaking queue
   */
  async joinQueue(playerId: string, deckId: string): Promise<{ gameRoomId: string | null; error: any }> {
    try {
      // Call the find_match function
      const { data, error } = await supabase.rpc('find_match', {
        p_player_id: playerId,
        p_deck_id: deckId,
      });

      if (error) {
        console.error('Error joining queue:', error);
        return { gameRoomId: null, error };
      }

      // If data is a UUID, a match was found immediately
      if (data) {
        return { gameRoomId: data, error: null };
      }

      // No match yet, subscribe to queue changes
      this.subscribeToQueue(playerId);
      
      return { gameRoomId: null, error: null };
    } catch (error) {
      console.error('Error in joinQueue:', error);
      return { gameRoomId: null, error };
    }
  }

  /**
   * Leave the matchmaking queue
   */
  async leaveQueue(playerId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('leave_queue', {
        p_player_id: playerId,
      });

      if (error) {
        console.error('Error leaving queue:', error);
        return false;
      }

      this.unsubscribeFromQueue();
      return true;
    } catch (error) {
      console.error('Error in leaveQueue:', error);
      return false;
    }
  }

  /**
   * Check if player has an active game
   */
  async getActiveGame(playerId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_active_game', {
        p_player_id: playerId,
      });

      if (error) {
        console.error('Error getting active game:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getActiveGame:', error);
      return null;
    }
  }

  /**
   * Get game room details
   */
  async getGameRoom(gameRoomId: string): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', gameRoomId)
        .single();

      if (error) {
        console.error('Error getting game room:', error);
        return null;
      }

      return data as GameRoom;
    } catch (error) {
      console.error('Error in getGameRoom:', error);
      return null;
    }
  }

  /**
   * Update game state in database
   */
  async updateGameState(gameRoomId: string, gameState: any, status?: string): Promise<boolean> {
    try {
      const updates: any = {
        game_state: gameState,
        updated_at: new Date().toISOString(), // Force update to trigger realtime
      };

      if (status) {
        updates.status = status;
      }

      if (gameState.currentTurn) {
        updates.current_turn = gameState.currentTurn;
        updates.active_player_id = gameState.activePlayerId;
      }

      if (gameState.winnerId) {
        updates.winner_id = gameState.winnerId;
        updates.ended_at = new Date().toISOString();
      }

      console.log('📤 Updating game room in database:', {
        gameRoomId,
        currentTurn: updates.current_turn,
        activePlayer: updates.active_player_id,
        status: updates.status,
      });

      const { error } = await supabase
        .from('game_rooms')
        .update(updates)
        .eq('id', gameRoomId);

      if (error) {
        console.error('❌ Error updating game state:', error);
        return false;
      }

      console.log('✅ Game state saved to database');
      return true;
    } catch (error) {
      console.error('❌ Error in updateGameState:', error);
      return false;
    }
  }

  /**
   * Log a game action
   */
  async logGameAction(
    gameRoomId: string,
    playerId: string,
    actionType: string,
    payload: any,
    sequenceNumber: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_actions')
        .insert({
          game_room_id: gameRoomId,
          player_id: playerId,
          action_type: actionType,
          payload,
          sequence_number: sequenceNumber,
        });

      if (error) {
        console.error('Error logging action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logGameAction:', error);
      return false;
    }
  }

  /**
   * Subscribe to queue changes to detect when match is found
   */
  private subscribeToQueue(playerId: string) {
    this.queueChannel = supabase
      .channel(`queue:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_rooms',
          filter: `player1_id=eq.${playerId}`,
        },
        (payload) => {
          console.log('Match found (as player1):', payload);
          if (this.onMatchFoundCallback) {
            this.onMatchFoundCallback(payload.new.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_rooms',
          filter: `player2_id=eq.${playerId}`,
        },
        (payload) => {
          console.log('Match found (as player2):', payload);
          if (this.onMatchFoundCallback) {
            this.onMatchFoundCallback(payload.new.id);
          }
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from queue
   */
  private unsubscribeFromQueue() {
    if (this.queueChannel) {
      supabase.removeChannel(this.queueChannel);
      this.queueChannel = null;
    }
  }

  /**
   * Subscribe to game room changes with auto-reconnection
   */
  subscribeToGame(gameRoomId: string, onStateChange: (gameRoom: GameRoom) => void): () => void {
    this.onGameStateChangeCallback = onStateChange;
    
    // Clean up any existing subscription
    if (this.gameChannel) {
      supabase.removeChannel(this.gameChannel);
      this.gameChannel = null;
    }
    
    console.log('🔌 Setting up realtime subscription for game:', gameRoomId);
    
    const setupChannel = () => {
      this.gameChannel = supabase
        .channel(`game:${gameRoomId}`, {
          config: {
            presence: { key: gameRoomId },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to ALL changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${gameRoomId}`,
          },
          (payload) => {
            console.log('🔔 Realtime event:', payload.eventType, 'Turn:', payload.new?.current_turn);
            if (this.onGameStateChangeCallback && payload.new) {
              this.onGameStateChangeCallback(payload.new as GameRoom);
            }
          }
        )
        .subscribe((status, err) => {
          console.log('🔌 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to game room updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error:', err);
            // Try to reconnect after 2 seconds
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect...');
              if (this.gameChannel) {
                supabase.removeChannel(this.gameChannel);
              }
              setupChannel();
            }, 2000);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Subscription timed out, reconnecting...');
            setTimeout(() => {
              if (this.gameChannel) {
                supabase.removeChannel(this.gameChannel);
              }
              setupChannel();
            }, 1000);
          }
        });
    };

    setupChannel();

    // Return unsubscribe function
    return () => {
      console.log('🔌 Unsubscribing from game room:', gameRoomId);
      if (this.gameChannel) {
        supabase.removeChannel(this.gameChannel);
        this.gameChannel = null;
      }
    };
  }

  /**
   * Set callback for when a match is found
   */
  onMatchFound(callback: (gameRoomId: string) => void) {
    this.onMatchFoundCallback = callback;
  }

  /**
   * Get queue position
   */
  async getQueuePosition(playerId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('joined_at')
        .eq('player_id', playerId)
        .single();

      if (error || !data) return null;

      // Count how many people are ahead in queue
      const { count, error: countError } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true })
        .lt('joined_at', data.joined_at);

      if (countError) return null;

      return (count || 0) + 1;
    } catch (error) {
      return null;
    }
  }
}

export const matchmakingService = new MatchmakingService();

