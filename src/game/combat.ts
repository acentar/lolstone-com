/**
 * Lolstone Game Engine - Combat System
 * 
 * Handles:
 * - Attack declaration and resolution
 * - Damage calculation
 * - Unit destruction
 * - Combat-related triggers
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  UnitInPlay,
  PlayerGameState,
  PendingEffect,
  getActivePlayer,
  getInactivePlayer,
  findUnit,
  hasKeyword,
} from './types';
import { checkWinCondition } from './state';

// ============================================
// ATTACK RESOLUTION
// ============================================

export interface AttackResult {
  state: GameState;
  attackerDied: boolean;
  defenderDied: boolean;
  damageToAttacker: number;
  damageToDefender: number;
}

/**
 * Execute an attack from one unit to another (or face)
 */
export function executeAttack(
  state: GameState,
  attackerId: string,
  targetId: string
): AttackResult {
  let newState = { ...state };
  const attackerData = findUnit(newState, attackerId);
  
  if (!attackerData) {
    console.error('Attacker not found');
    return { state, attackerDied: false, defenderDied: false, damageToAttacker: 0, damageToDefender: 0 };
  }
  
  const { unit: attacker, owner: attackerOwner } = attackerData;
  
  // Mark attacker as having attacked
  attacker.canAttack = false;
  
  // Queue on_attack effects
  queueTriggerEffects(newState, attacker, attackerOwner.id, 'on_attack');
  
  if (targetId === 'face') {
    // Attack the enemy player directly
    return attackFace(newState, attacker, attackerOwner);
  } else {
    // Attack another unit
    return attackUnit(newState, attacker, attackerOwner, targetId);
  }
}

/**
 * Attack the enemy player's face
 */
function attackFace(
  state: GameState,
  attacker: UnitInPlay,
  attackerOwner: PlayerGameState
): AttackResult {
  const newState = { ...state };
  const defender = attackerOwner.id === newState.player1.id 
    ? newState.player2 
    : newState.player1;
  
  // Deal damage to player
  const damage = attacker.currentAttack;
  defender.health -= damage;
  
  // Check win condition
  const finalState = checkWinCondition(newState);
  
  return {
    state: finalState,
    attackerDied: false,
    defenderDied: false,
    damageToAttacker: 0,
    damageToDefender: damage,
  };
}

/**
 * Attack another unit - both units deal damage to each other
 */
function attackUnit(
  state: GameState,
  attacker: UnitInPlay,
  attackerOwner: PlayerGameState,
  targetId: string
): AttackResult {
  const newState = { ...state };
  const defenderData = findUnit(newState, targetId);
  
  if (!defenderData) {
    console.error('Defender not found');
    return { state, attackerDied: false, defenderDied: false, damageToAttacker: 0, damageToDefender: 0 };
  }
  
  const { unit: defender, owner: defenderOwner } = defenderData;
  
  // Calculate damage
  const damageToDefender = attacker.currentAttack;
  const damageToAttacker = defender.currentAttack;
  
  // Apply damage
  defender.currentHealth -= damageToDefender;
  attacker.currentHealth -= damageToAttacker;
  
  // Queue on_damaged effects
  if (damageToDefender > 0) {
    queueTriggerEffects(newState, defender, defenderOwner.id, 'on_damaged');
  }
  if (damageToAttacker > 0) {
    queueTriggerEffects(newState, attacker, attackerOwner.id, 'on_damaged');
  }
  
  // Check for deaths
  let attackerDied = false;
  let defenderDied = false;
  
  if (defender.currentHealth <= 0) {
    defenderDied = true;
    destroyUnit(newState, defender, defenderOwner);
  }
  
  if (attacker.currentHealth <= 0) {
    attackerDied = true;
    destroyUnit(newState, attacker, attackerOwner);
  }
  
  return {
    state: newState,
    attackerDied,
    defenderDied,
    damageToAttacker,
    damageToDefender,
  };
}

// ============================================
// DAMAGE & HEALING
// ============================================

/**
 * Deal damage to a unit (from effects, not combat)
 */
export function dealDamageToUnit(
  state: GameState,
  unitId: string,
  amount: number,
  sourcePlayerId: string
): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit, owner } = unitData;
  unit.currentHealth -= amount;
  
  // Queue on_damaged effects
  if (amount > 0) {
    queueTriggerEffects(newState, unit, owner.id, 'on_damaged');
  }
  
  // Check for death
  if (unit.currentHealth <= 0) {
    destroyUnit(newState, unit, owner);
  }
  
  return newState;
}

/**
 * Deal damage to a player (from effects, not combat)
 */
export function dealDamageToPlayer(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  const newState = { ...state };
  const player = playerId === newState.player1.id 
    ? newState.player1 
    : newState.player2;
  
  player.health -= amount;
  
  // Check win condition
  return checkWinCondition(newState);
}

/**
 * Heal a unit
 */
export function healUnit(
  state: GameState,
  unitId: string,
  amount: number
): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit } = unitData;
  unit.currentHealth = Math.min(unit.currentHealth + amount, unit.maxHealth);
  
  return newState;
}

/**
 * Heal a player
 */
export function healPlayer(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  const newState = { ...state };
  const player = playerId === newState.player1.id 
    ? newState.player1 
    : newState.player2;
  
  player.health = Math.min(player.health + amount, player.maxHealth);
  
  return newState;
}

// ============================================
// UNIT DESTRUCTION
// ============================================

/**
 * Destroy a unit and move it to graveyard
 */
export function destroyUnit(
  state: GameState,
  unit: UnitInPlay,
  owner: PlayerGameState
): void {
  // Queue on_destroy effects before removing
  queueTriggerEffects(state, unit, owner.id, 'on_destroy');
  
  // Remove from board
  const index = owner.board.findIndex(u => u.id === unit.id);
  if (index !== -1) {
    owner.board.splice(index, 1);
    
    // Add to graveyard
    owner.graveyard.push({
      id: unit.id,
      cardInstanceId: unit.cardInstanceId,
      design: unit.design,
    });
  }
  
  // Re-index positions
  owner.board.forEach((u, i) => {
    u.position = i;
  });
}

/**
 * Destroy a unit by ID
 */
export function destroyUnitById(state: GameState, unitId: string): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  destroyUnit(newState, unitData.unit, unitData.owner);
  
  return newState;
}

// ============================================
// BUFFS
// ============================================

/**
 * Buff a unit's attack
 */
export function buffUnitAttack(
  state: GameState,
  unitId: string,
  amount: number
): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit } = unitData;
  unit.currentAttack += amount;
  unit.attackBuff += amount;
  
  return newState;
}

/**
 * Buff a unit's health
 */
export function buffUnitHealth(
  state: GameState,
  unitId: string,
  amount: number
): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit } = unitData;
  unit.currentHealth += amount;
  unit.maxHealth += amount;
  unit.healthBuff += amount;
  
  return newState;
}

/**
 * Apply boost keyword (+1/+1)
 */
export function applyBoost(state: GameState, unitId: string): GameState {
  let newState = buffUnitAttack(state, unitId, 1);
  newState = buffUnitHealth(newState, unitId, 1);
  return newState;
}

// ============================================
// SILENCE
// ============================================

/**
 * Silence a unit (remove all effects and keywords)
 */
export function silenceUnit(state: GameState, unitId: string): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit } = unitData;
  unit.isSilenced = true;
  
  // Remove buffs
  unit.currentAttack = unit.design.base_attack;
  unit.currentHealth = Math.min(unit.currentHealth, unit.design.base_health);
  unit.maxHealth = unit.design.base_health;
  unit.attackBuff = 0;
  unit.healthBuff = 0;
  
  return newState;
}

// ============================================
// TRIGGER HELPERS
// ============================================

/**
 * Queue effects for a specific trigger
 */
function queueTriggerEffects(
  state: GameState,
  unit: UnitInPlay,
  ownerId: string,
  trigger: 'on_attack' | 'on_damaged' | 'on_destroy'
): void {
  if (unit.isSilenced) return;
  
  const effects = unit.design.effects.filter(e => e.trigger === trigger);
  
  for (const effect of effects) {
    state.pendingEffects.push({
      id: uuidv4(),
      sourceUnitId: unit.id,
      sourcePlayerId: ownerId,
      effect,
      targetIds: [],
      trigger,
    });
  }
}

// ============================================
// VALID TARGETS
// ============================================

/**
 * Get valid attack targets for a unit
 */
export function getValidAttackTargets(state: GameState, attackerId: string): string[] {
  const attackerData = findUnit(state, attackerId);
  if (!attackerData) return [];
  
  const { owner } = attackerData;
  const opponent = owner.id === state.player1.id ? state.player2 : state.player1;
  
  // Check for frontline units
  const frontlineUnits = opponent.board.filter(u => hasKeyword(u, 'frontline'));
  
  if (frontlineUnits.length > 0) {
    // Must attack frontline units
    return frontlineUnits.map(u => u.id);
  }
  
  // Can attack any unit or face
  const targets = opponent.board.map(u => u.id);
  targets.push('face');
  
  return targets;
}

/**
 * Check if a unit can attack
 */
export function canUnitAttack(state: GameState, unitId: string): boolean {
  const unitData = findUnit(state, unitId);
  if (!unitData) return false;
  
  const { unit, owner } = unitData;
  
  // Must be active player's unit
  if (owner.id !== state.activePlayerId) return false;
  
  // Must have attack available
  if (!unit.canAttack) return false;
  
  // Must not have summoning sickness
  if (unit.hasSummoningSickness) return false;
  
  // Must have attack > 0
  if (unit.currentAttack <= 0) return false;
  
  return true;
}

