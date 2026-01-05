/**
 * Lolstone Game Engine - State Machine
 * 
 * Handles:
 * - Game initialization
 * - Turn flow and phase transitions
 * - Win condition checking
 * - State updates through actions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  PlayerGameState,
  CardInHand,
  UnitInPlay,
  GamePhase,
  TurnPhase,
  GameAction,
  GAME_CONFIG,
  getActivePlayer,
  getInactivePlayer,
  hasKeyword,
} from './types';
import { CardDesignFull } from '../types/database';

// ============================================
// GAME INITIALIZATION
// ============================================

export interface CreateGameOptions {
  gameId?: string;
  player1Id: string;
  player1Name: string;
  player1AvatarUrl?: string;
  player1Deck: CardInHand[];
  player2Id: string;
  player2Name: string;
  player2AvatarUrl?: string;
  player2Deck: CardInHand[];
  turnTimeLimit?: number;
}

/**
 * Creates a new game state with shuffled decks
 */
export function createGame(options: CreateGameOptions): GameState {
  const gameId = options.gameId || uuidv4();
  const now = Date.now();
  
  // Shuffle decks
  const player1Deck = shuffleArray([...options.player1Deck]);
  const player2Deck = shuffleArray([...options.player2Deck]);
  
  // Randomly decide who goes first
  const firstPlayerId = Math.random() < 0.5 ? options.player1Id : options.player2Id;
  
  // Create player states
  const player1: PlayerGameState = {
    id: options.player1Id,
    name: options.player1Name,
    avatarUrl: options.player1AvatarUrl,
    health: GAME_CONFIG.STARTING_HEALTH,
    maxHealth: GAME_CONFIG.STARTING_HEALTH,
    bandwidth: 0,
    maxBandwidth: 0,
    deck: player1Deck,
    hand: [],
    board: [],
    graveyard: [],
    fatigueCount: 0,
    isConnected: true,
  };
  
  const player2: PlayerGameState = {
    id: options.player2Id,
    name: options.player2Name,
    avatarUrl: options.player2AvatarUrl,
    health: GAME_CONFIG.STARTING_HEALTH,
    maxHealth: GAME_CONFIG.STARTING_HEALTH,
    bandwidth: 0,
    maxBandwidth: 0,
    deck: player2Deck,
    hand: [],
    board: [],
    graveyard: [],
    fatigueCount: 0,
    isConnected: true,
  };
  
  // Draw starting hands
  const firstPlayer = firstPlayerId === player1.id ? player1 : player2;
  const secondPlayer = firstPlayerId === player1.id ? player2 : player1;
  
  drawCards(firstPlayer, GAME_CONFIG.STARTING_HAND_SIZE);
  drawCards(secondPlayer, GAME_CONFIG.SECOND_PLAYER_HAND_SIZE);
  
  return {
    id: gameId,
    player1,
    player2,
    currentTurn: 0, // Will become 1 on first START_TURN
    activePlayerId: firstPlayerId,
    turnPhase: 'start',
    phase: 'mulligan',
    winnerId: null,
    attackingUnitId: null,
    defendingTargetId: null,
    pendingEffects: [],
    lastAction: null,
    lastAttackAnimation: null,
    createdAt: now,
    turnStartedAt: now,
    turnTimeLimit: options.turnTimeLimit || GAME_CONFIG.TURN_TIME_LIMIT,
  };
}

// ============================================
// TURN MANAGEMENT
// ============================================

/**
 * Starts a new turn for the active player
 */
export function startTurn(state: GameState): GameState {
  const newState = { ...state };
  const player = getActivePlayer(newState);
  
  // Increment turn counter
  newState.currentTurn += 1;
  newState.turnPhase = 'start';
  newState.turnStartedAt = Date.now();
  
  // Increase max bandwidth (caps at 10)
  player.maxBandwidth = Math.min(player.maxBandwidth + 1, GAME_CONFIG.MAX_BANDWIDTH);
  
  // Refill bandwidth
  player.bandwidth = player.maxBandwidth;
  
  // Draw a card
  drawCards(player, 1);
  
  // Reset unit attack states
  for (const unit of player.board) {
    unit.canAttack = true;
    unit.hasSummoningSickness = false; // Remove summoning sickness at turn start
    unit.isStunned = false; // Clear stun at turn start
  }
  
  // Move to main phase
  newState.turnPhase = 'main';
  newState.phase = 'playing';
  
  // Clear combat state
  newState.attackingUnitId = null;
  newState.defendingTargetId = null;
  
  return newState;
}

/**
 * Ends the current turn and switches to the other player
 */
export function endTurn(state: GameState): GameState {
  const newState = { ...state };
  
  // Process end of turn effects (handled by effect processor)
  newState.turnPhase = 'end';
  
  // Switch active player
  newState.activePlayerId = 
    newState.activePlayerId === newState.player1.id 
      ? newState.player2.id 
      : newState.player1.id;
  
  // Start the new player's turn
  return startTurn(newState);
}

// ============================================
// CARD OPERATIONS
// ============================================

/**
 * Draw cards from deck to hand
 * Handles fatigue if deck is empty
 */
export function drawCards(player: PlayerGameState, count: number): { fatigueDamage: number } {
  let fatigueDamage = 0;
  
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) {
      // Fatigue damage increases each time
      player.fatigueCount += 1;
      fatigueDamage += player.fatigueCount;
      player.health -= player.fatigueCount;
    } else if (player.hand.length < GAME_CONFIG.MAX_HAND_SIZE) {
      // Draw card
      const card = player.deck.pop()!;
      player.hand.push(card);
    }
    // If hand is full, card is burned (not added to hand or graveyard)
  }
  
  return { fatigueDamage };
}

/**
 * Play a card from hand
 */
export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  position?: number,
  targetId?: string
): GameState {
  const newState = { ...state };
  const player = playerId === newState.player1.id ? newState.player1 : newState.player2;
  
  // Find card in hand
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    console.error('Card not found in hand');
    return state;
  }
  
  const card = player.hand[cardIndex];
  
  // Check bandwidth
  if (card.design.mana_cost > player.bandwidth) {
    console.error('Not enough bandwidth');
    return state;
  }
  
  // Spend bandwidth
  player.bandwidth -= card.design.mana_cost;
  
  // Remove from hand
  player.hand.splice(cardIndex, 1);
  
  // Handle based on category
  if (card.design.category === 'unit') {
    // Check board space
    if (player.board.length >= GAME_CONFIG.MAX_BOARD_SIZE) {
      console.error('Board is full');
      // Refund bandwidth
      player.bandwidth += card.design.mana_cost;
      player.hand.splice(cardIndex, 0, card);
      return state;
    }
    
    // Create unit in play
    const unit: UnitInPlay = {
      id: uuidv4(),
      cardInstanceId: card.cardInstanceId,
      design: card.design,
      currentAttack: card.design.base_attack,
      currentHealth: card.design.base_health,
      maxHealth: card.design.base_health,
      canAttack: hasKeyword({ ...createDummyUnit(card) } as UnitInPlay, 'quick'),
      hasSummoningSickness: !hasKeyword({ ...createDummyUnit(card) } as UnitInPlay, 'quick'),
      isSilenced: false,
      isStunned: false,
      attackBuff: 0,
      healthBuff: 0,
      position: position ?? player.board.length,
    };
    
    player.board.push(unit);
    
    // Queue on_play effects
    queueOnPlayEffects(newState, unit, playerId);
  } else {
    // Action card - execute effects immediately
    // Effects will be queued and processed
    queueActionEffects(newState, card, playerId, targetId);
    
    // Move to graveyard
    player.graveyard.push(card);
  }
  
  return newState;
}

// Helper to create a dummy unit for keyword checking before full creation
function createDummyUnit(card: CardInHand): Partial<UnitInPlay> {
  return {
    design: card.design,
    isSilenced: false,
  };
}

/**
 * Queue on_play effects for a unit
 */
export function queueOnPlayEffects(state: GameState, unit: UnitInPlay, playerId: string): void {
  const onPlayEffects = unit.design.effects.filter(e => e.trigger === 'on_play');
  
  for (const effect of onPlayEffects) {
    state.pendingEffects.push({
      id: uuidv4(),
      sourceUnitId: unit.id,
      sourcePlayerId: playerId,
      effect,
      targetIds: [], // Will be resolved by effect processor
      trigger: 'on_play',
    });
  }
}

/**
 * Queue effects from an action card
 */
function queueActionEffects(state: GameState, card: CardInHand, playerId: string, targetId?: string): void {
  const effects = card.design.effects.filter(e => e.trigger === 'on_play');
  
  for (const effect of effects) {
    state.pendingEffects.push({
      id: uuidv4(),
      sourceUnitId: null,
      sourcePlayerId: playerId,
      effect,
      targetIds: targetId ? [targetId] : [],
      trigger: 'on_play',
    });
  }
}

// ============================================
// WIN CONDITION CHECKING
// ============================================

/**
 * Check if the game has ended
 */
export function checkWinCondition(state: GameState): GameState {
  const newState = { ...state };
  
  // Check if either player is dead
  const p1Dead = newState.player1.health <= 0;
  const p2Dead = newState.player2.health <= 0;
  
  if (p1Dead && p2Dead) {
    // Both dead - active player loses (they caused the tie)
    newState.winnerId = newState.activePlayerId === newState.player1.id 
      ? newState.player2.id 
      : newState.player1.id;
    newState.phase = 'ended';
  } else if (p1Dead) {
    newState.winnerId = newState.player2.id;
    newState.phase = 'ended';
  } else if (p2Dead) {
    newState.winnerId = newState.player1.id;
    newState.phase = 'ended';
  }
  
  return newState;
}

/**
 * Handle player concession
 */
export function concede(state: GameState, playerId: string): GameState {
  const newState = { ...state };
  
  newState.winnerId = playerId === newState.player1.id 
    ? newState.player2.id 
    : newState.player1.id;
  newState.phase = 'ended';
  
  return newState;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deep clone game state for immutability
 */
export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Validate that an action is legal
 */
export function isActionLegal(state: GameState, action: GameAction): boolean {
  // Game must be in playing phase
  if (state.phase !== 'playing') {
    return action.type === 'MULLIGAN_COMPLETE' && state.phase === 'mulligan';
  }
  
  // Must be the active player's turn (except for concede)
  if (action.type !== 'CONCEDE' && action.playerId !== state.activePlayerId) {
    return false;
  }
  
  switch (action.type) {
    case 'PLAY_CARD':
      // Validate card exists, enough bandwidth, board space, etc.
      return validatePlayCard(state, action);
    
    case 'ATTACK':
      // Validate attacker exists, can attack, target is valid
      return validateAttack(state, action);
    
    case 'END_TURN':
      // Always legal on your turn
      return true;
    
    case 'CONCEDE':
      // Always legal
      return true;
    
    default:
      return false;
  }
}

function validatePlayCard(state: GameState, action: GameAction): boolean {
  const player = getActivePlayer(state);
  const { cardId, position } = action.payload || {};
  
  const card = player.hand.find(c => c.id === cardId);
  if (!card) return false;
  if (card.design.mana_cost > player.bandwidth) return false;
  if (card.design.category === 'unit' && player.board.length >= GAME_CONFIG.MAX_BOARD_SIZE) return false;
  
  return true;
}

function validateAttack(state: GameState, action: GameAction): boolean {
  const player = getActivePlayer(state);
  const opponent = getInactivePlayer(state);
  const { attackerId, targetId } = action.payload || {};
  
  // Find attacker
  const attacker = player.board.find(u => u.id === attackerId);
  if (!attacker) return false;
  if (!attacker.canAttack) return false;
  if (attacker.hasSummoningSickness) return false;
  if (attacker.isStunned) return false;
  
  // Check target
  if (targetId === 'face') {
    // Check for frontline units
    const hasFrontline = opponent.board.some(u => hasKeyword(u, 'frontline'));
    if (hasFrontline) return false;
  } else {
    // Must be a valid enemy unit
    const target = opponent.board.find(u => u.id === targetId);
    if (!target) return false;
    
    // Check if there's a frontline that must be attacked first
    const hasFrontline = opponent.board.some(u => hasKeyword(u, 'frontline'));
    if (hasFrontline && !hasKeyword(target, 'frontline')) return false;
  }
  
  return true;
}

