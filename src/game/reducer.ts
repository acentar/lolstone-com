/**
 * Lolstone Game Engine - Game Reducer
 * 
 * Central action dispatcher that processes all game actions
 * and returns new immutable game states.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GameAction,
  PlayCardPayload,
  AttackPayload,
  MulliganPayload,
  getActivePlayer,
  getInactivePlayer,
} from './types';
import {
  startTurn,
  endTurn,
  playCard,
  concede,
  checkWinCondition,
  cloneGameState,
  isActionLegal,
  drawCards,
} from './state';
import { executeAttack } from './combat';
import {
  processEffectQueue,
  queueStartOfTurnEffects,
  queueEndOfTurnEffects,
} from './effects';

// ============================================
// GAME REDUCER
// ============================================

/**
 * Main game reducer - processes actions and returns new state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Clone state for immutability
  let newState = cloneGameState(state);
  
  // Record the action
  newState.lastAction = action;
  
  switch (action.type) {
    case 'START_GAME':
      return handleStartGame(newState);
    
    case 'MULLIGAN_COMPLETE':
      return handleMulliganComplete(newState, action);
    
    case 'START_TURN':
      return handleStartTurn(newState);
    
    case 'PLAY_CARD':
      return handlePlayCard(newState, action);
    
    case 'ATTACK':
      return handleAttack(newState, action);
    
    case 'END_TURN':
      return handleEndTurn(newState);
    
    case 'CONCEDE':
      return handleConcede(newState, action);
    
    case 'TIMEOUT':
      return handleTimeout(newState, action);
    
    default:
      console.warn('Unknown action type:', action.type);
      return state;
  }
}

// ============================================
// ACTION HANDLERS
// ============================================

function handleStartGame(state: GameState): GameState {
  // Game starts in mulligan phase
  // Players will send MULLIGAN_COMPLETE when ready
  return state;
}

function handleMulliganComplete(state: GameState, action: GameAction): GameState {
  const payload = action.payload as MulliganPayload;
  const player = action.playerId === state.player1.id ? state.player1 : state.player2;
  
  // Replace selected cards
  const cardsToReplace = payload?.cardsToReplace || [];
  
  for (const cardId of cardsToReplace) {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      const card = player.hand[cardIndex];
      // Remove from hand
      player.hand.splice(cardIndex, 1);
      // Put back in deck
      player.deck.push(card);
    }
  }
  
  // Draw new cards to replace
  drawCards(player, cardsToReplace.length);
  
  // Shuffle deck
  for (let i = player.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
  }
  
  // Check if both players are done with mulligan
  // For simplicity, we'll start the game when any player completes mulligan
  // In a real implementation, you'd track both players
  if (state.phase === 'mulligan') {
    state.phase = 'playing';
    return startTurn(state);
  }
  
  return state;
}

function handleStartTurn(state: GameState): GameState {
  // Queue start of turn effects
  let newState = queueStartOfTurnEffects(state);
  
  // Start the turn (grants bandwidth, draws card)
  newState = startTurn(newState);
  
  // Process any queued effects
  newState = processEffectQueue(newState);
  
  // Check win condition (fatigue might kill someone)
  newState = checkWinCondition(newState);
  
  return newState;
}

function handlePlayCard(state: GameState, action: GameAction): GameState {
  // Validate action is legal
  if (!isActionLegal(state, action)) {
    console.warn('Illegal play card action');
    return state;
  }
  
  const payload = action.payload as PlayCardPayload;
  
  // Play the card
  let newState = playCard(
    state,
    action.playerId,
    payload.cardId,
    payload.position,
    payload.targetId
  );
  
  // Process any triggered effects
  newState = processEffectQueue(newState);
  
  // Check win condition
  newState = checkWinCondition(newState);
  
  return newState;
}

function handleAttack(state: GameState, action: GameAction): GameState {
  // Validate action is legal
  if (!isActionLegal(state, action)) {
    console.warn('Illegal attack action');
    return state;
  }
  
  const payload = action.payload as AttackPayload;
  
  // Set attack animation info BEFORE executing (so both players can see it)
  let newState: GameState = {
    ...state,
    lastAttackAnimation: {
      attackerId: payload.attackerId,
      targetId: payload.targetId,
      timestamp: Date.now(),
    },
  };
  
  // Execute the attack
  const attackResult = executeAttack(newState, payload.attackerId, payload.targetId);
  newState = attackResult.state;
  
  // Process any triggered effects (on_attack, on_damaged, on_destroy)
  newState = processEffectQueue(newState);
  
  // Check win condition
  newState = checkWinCondition(newState);
  
  return newState;
}

function handleEndTurn(state: GameState): GameState {
  // Queue end of turn effects
  let newState = queueEndOfTurnEffects(state);
  
  // Process effects
  newState = processEffectQueue(newState);
  
  // Check win condition
  newState = checkWinCondition(newState);
  
  if (newState.phase === 'ended') {
    return newState;
  }
  
  // End turn and start next player's turn
  newState = endTurn(newState);
  
  // Queue and process start of turn effects for new player
  newState = queueStartOfTurnEffects(newState);
  newState = processEffectQueue(newState);
  
  // Check win condition again
  newState = checkWinCondition(newState);
  
  return newState;
}

function handleConcede(state: GameState, action: GameAction): GameState {
  return concede(state, action.playerId);
}

function handleTimeout(state: GameState, action: GameAction): GameState {
  // Timeout - end the current player's turn
  if (action.playerId === state.activePlayerId) {
    return handleEndTurn(state);
  }
  return state;
}

// ============================================
// ACTION CREATORS
// ============================================

export function createAction(
  type: GameAction['type'],
  playerId: string,
  payload?: any
): GameAction {
  return {
    type,
    playerId,
    payload,
    timestamp: Date.now(),
  };
}

export function createPlayCardAction(
  playerId: string,
  cardId: string,
  position?: number,
  targetId?: string
): GameAction {
  return createAction('PLAY_CARD', playerId, {
    cardId,
    position,
    targetId,
  } as PlayCardPayload);
}

export function createAttackAction(
  playerId: string,
  attackerId: string,
  targetId: string
): GameAction {
  return createAction('ATTACK', playerId, {
    attackerId,
    targetId,
  } as AttackPayload);
}

export function createEndTurnAction(playerId: string): GameAction {
  return createAction('END_TURN', playerId);
}

export function createConcedeAction(playerId: string): GameAction {
  return createAction('CONCEDE', playerId);
}

export function createMulliganAction(
  playerId: string,
  cardsToReplace: string[]
): GameAction {
  return createAction('MULLIGAN_COMPLETE', playerId, {
    cardsToReplace,
  } as MulliganPayload);
}

// ============================================
// GAME INSTANCE
// ============================================

/**
 * Game instance class for managing a game session
 */
export class GameInstance {
  private state: GameState;
  private history: GameAction[] = [];
  private subscribers: ((state: GameState) => void)[] = [];
  
  constructor(initialState: GameState) {
    this.state = initialState;
  }
  
  getState(): GameState {
    return this.state;
  }
  
  /**
   * Update internal state from external source (e.g., server sync)
   * @param newState - The new state to set
   * @param notifySubscribers - Whether to notify subscribers (default: false to avoid loops)
   */
  setState(newState: GameState, notifySubscribers: boolean = false): void {
    this.state = newState;

    // Notify subscribers if requested (used for server sync)
    if (notifySubscribers) {
      console.log('🔄 setState: Notifying subscribers after server sync');
      for (const subscriber of this.subscribers) {
        subscriber(this.state);
      }
    }
  }
  
  getHistory(): GameAction[] {
    return [...this.history];
  }
  
  dispatch(action: GameAction): GameState {
    console.log('🎯 GameInstance.dispatch called!');
    console.log('   Action type:', action.type);
    console.log('   Subscribers count:', this.subscribers.length);
    
    // Record action
    this.history.push(action);
    
    // Apply reducer
    this.state = gameReducer(this.state, action);
    
    console.log('   New turn:', this.state.currentTurn);
    console.log('   New active player:', this.state.activePlayerId?.slice(0, 8));
    
    // Notify subscribers
    console.log('   Notifying', this.subscribers.length, 'subscribers...');
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
    console.log('   ✅ Dispatch complete');
    
    return this.state;
  }
  
  subscribe(callback: (state: GameState) => void): () => void {
    console.log('📝 GameInstance.subscribe called! Total subscribers:', this.subscribers.length + 1);
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
        console.log('📝 Subscriber removed. Remaining:', this.subscribers.length);
      }
    };
  }
  
  // Convenience methods
  playCard(playerId: string, cardId: string, position?: number, targetId?: string): GameState {
    return this.dispatch(createPlayCardAction(playerId, cardId, position, targetId));
  }
  
  attack(playerId: string, attackerId: string, targetId: string): GameState {
    return this.dispatch(createAttackAction(playerId, attackerId, targetId));
  }
  
  endTurn(playerId: string): GameState {
    return this.dispatch(createEndTurnAction(playerId));
  }
  
  concede(playerId: string): GameState {
    return this.dispatch(createConcedeAction(playerId));
  }
  
  completeMulligan(playerId: string, cardsToReplace: string[]): GameState {
    return this.dispatch(createMulliganAction(playerId, cardsToReplace));
  }
}

