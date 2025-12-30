/**
 * Lolstone Game Engine - Core Types
 * 
 * Defines all types for the game state machine, including:
 * - Game phases and turn structure
 * - Player and board state
 * - Card instances in play
 * - Combat and effect resolution
 */

import { CardDesignFull, CardKeyword, EffectTrigger, EffectTarget, EffectAction, CardEffect } from '../types/database';

// ============================================
// GAME PHASES & TURN STRUCTURE
// ============================================

export type GamePhase = 
  | 'waiting'       // Waiting for players to connect
  | 'mulligan'      // Initial card selection phase
  | 'playing'       // Active gameplay
  | 'ended';        // Game has concluded

export type TurnPhase =
  | 'start'         // Start of turn - trigger effects, gain bandwidth
  | 'main'          // Main phase - play cards, attack
  | 'combat'        // Combat resolution (if attacks declared)
  | 'end';          // End of turn - trigger effects, check fatigue

// ============================================
// CARD IN PLAY
// ============================================

export interface CardInHand {
  id: string;                    // Unique instance ID for this game
  cardInstanceId: string;        // Original card instance ID from DB
  design: CardDesignFull;        // Full card design with keywords/effects
}

export interface UnitInPlay {
  id: string;                    // Unique instance ID for this game
  cardInstanceId: string;        // Original card instance ID from DB
  design: CardDesignFull;        // Full card design with keywords/effects
  
  // Current stats (can be modified by effects)
  currentAttack: number;
  currentHealth: number;
  maxHealth: number;
  
  // State flags
  canAttack: boolean;            // Has attack available this turn
  hasSummoningSickness: boolean; // Can't attack the turn it's played (unless Quick)
  isSilenced: boolean;           // Keywords/effects disabled
  
  // Buffs (for display/tracking)
  attackBuff: number;
  healthBuff: number;
  
  // Position on board (0-6, left to right)
  position: number;
}

// ============================================
// PLAYER STATE
// ============================================

export interface PlayerGameState {
  id: string;                    // Player ID from database
  name: string;                  // Display name
  avatarUrl?: string;            // Avatar image
  
  // Resources
  health: number;                // Current health (starts at 30)
  maxHealth: number;             // Maximum health (30)
  bandwidth: number;             // Current available bandwidth (mana)
  maxBandwidth: number;          // Maximum bandwidth this turn (increases each turn, max 10)
  
  // Cards
  deck: CardInHand[];            // Cards remaining in deck
  hand: CardInHand[];            // Cards in hand (max 10)
  board: UnitInPlay[];           // Units on the battlefield (max 7)
  graveyard: CardInHand[];       // Destroyed cards
  
  // State
  fatigueCount: number;          // Number of times drawn from empty deck
  isConnected: boolean;          // Player connection status
}

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  id: string;                    // Game room ID
  
  // Players
  player1: PlayerGameState;
  player2: PlayerGameState;
  
  // Turn management
  currentTurn: number;           // Turn counter (starts at 1)
  activePlayerId: string;        // ID of player whose turn it is
  turnPhase: TurnPhase;          // Current phase within the turn
  
  // Game phase
  phase: GamePhase;
  winnerId: string | null;       // Set when game ends
  
  // Combat state
  attackingUnitId: string | null;
  defendingTargetId: string | null; // Unit ID or 'player' for face attack
  
  // Effect queue (for processing triggers)
  pendingEffects: PendingEffect[];
  
  // Animation/UI state
  lastAction: GameAction | null;
  
  // Timestamps
  createdAt: number;
  turnStartedAt: number;
  turnTimeLimit: number;         // Seconds per turn (default 90)
}

// ============================================
// EFFECTS & TRIGGERS
// ============================================

export interface PendingEffect {
  id: string;
  sourceUnitId: string | null;   // Unit that triggered the effect
  sourcePlayerId: string;        // Owner of the effect
  effect: CardEffect;            // The effect definition
  targetIds: string[];           // Resolved target IDs
  trigger: EffectTrigger;
}

export interface EffectResult {
  success: boolean;
  damage?: number;
  healing?: number;
  cardsDrawn?: number;
  unitsDestroyed?: string[];
  message?: string;
}

// ============================================
// GAME ACTIONS
// ============================================

export type GameActionType =
  | 'START_GAME'
  | 'MULLIGAN_COMPLETE'
  | 'START_TURN'
  | 'PLAY_CARD'
  | 'ATTACK'
  | 'END_TURN'
  | 'CONCEDE'
  | 'TIMEOUT'
  | 'EFFECT_TRIGGER'
  | 'DRAW_CARD'
  | 'DAMAGE_UNIT'
  | 'DAMAGE_PLAYER'
  | 'HEAL_UNIT'
  | 'HEAL_PLAYER'
  | 'DESTROY_UNIT'
  | 'BUFF_UNIT'
  | 'SUMMON_UNIT';

export interface GameAction {
  type: GameActionType;
  playerId: string;
  payload?: any;
  timestamp: number;
}

// Specific action payloads
export interface PlayCardPayload {
  cardId: string;                // Card in hand ID
  position?: number;             // Board position for units
  targetId?: string;             // Target for targeted effects
}

export interface AttackPayload {
  attackerId: string;            // Attacking unit ID
  targetId: string;              // Target unit ID or 'face' for player
}

export interface MulliganPayload {
  cardsToReplace: string[];      // IDs of cards to send back
}

// ============================================
// GAME CONFIG
// ============================================

export const GAME_CONFIG = {
  STARTING_HEALTH: 30,
  STARTING_HAND_SIZE: 3,         // First player
  SECOND_PLAYER_HAND_SIZE: 4,    // Second player gets extra card
  MAX_HAND_SIZE: 10,
  MAX_BOARD_SIZE: 7,
  MAX_BANDWIDTH: 10,
  TURN_TIME_LIMIT: 90,           // Seconds
  FATIGUE_BASE_DAMAGE: 1,        // First fatigue = 1, then +1 each time
  DECK_SIZE: 30,
} as const;

// ============================================
// UTILITY TYPES
// ============================================

export type TargetType = 'unit' | 'player' | 'none';

export interface ValidTarget {
  id: string;
  type: TargetType;
  playerId: string;              // Which player owns this target
}

// Helper to check if a unit has a keyword
export function hasKeyword(unit: UnitInPlay, keyword: CardKeyword): boolean {
  if (unit.isSilenced) return false;
  return unit.design.keywords.includes(keyword);
}

// Helper to get the active player from game state
export function getActivePlayer(state: GameState): PlayerGameState {
  return state.activePlayerId === state.player1.id ? state.player1 : state.player2;
}

// Helper to get the inactive player from game state
export function getInactivePlayer(state: GameState): PlayerGameState {
  return state.activePlayerId === state.player1.id ? state.player2 : state.player1;
}

// Helper to get a player by ID
export function getPlayerById(state: GameState, playerId: string): PlayerGameState | null {
  if (state.player1.id === playerId) return state.player1;
  if (state.player2.id === playerId) return state.player2;
  return null;
}

// Helper to find a unit on any board
export function findUnit(state: GameState, unitId: string): { unit: UnitInPlay; owner: PlayerGameState } | null {
  for (const unit of state.player1.board) {
    if (unit.id === unitId) return { unit, owner: state.player1 };
  }
  for (const unit of state.player2.board) {
    if (unit.id === unitId) return { unit, owner: state.player2 };
  }
  return null;
}

