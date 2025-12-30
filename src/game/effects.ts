/**
 * Lolstone Game Engine - Effect Processor
 * 
 * Handles:
 * - Effect target resolution
 * - Effect execution
 * - Effect queue processing
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  PlayerGameState,
  UnitInPlay,
  PendingEffect,
  EffectResult,
  ValidTarget,
  getActivePlayer,
  getInactivePlayer,
  getPlayerById,
  findUnit,
  hasKeyword,
  CardInHand,
} from './types';
import { EffectTarget, EffectAction, CardEffect } from '../types/database';
import {
  dealDamageToUnit,
  dealDamageToPlayer,
  healUnit,
  healPlayer,
  destroyUnitById,
  buffUnitAttack,
  buffUnitHealth,
  silenceUnit,
  stunUnit,
} from './combat';
import { drawCards } from './state';

// ============================================
// TARGET RESOLUTION
// ============================================

/**
 * Resolve targets for an effect based on its target type
 */
export function resolveTargets(
  state: GameState,
  effect: CardEffect,
  sourcePlayerId: string,
  sourceUnitId: string | null,
  preSelectedTargetId?: string
): ValidTarget[] {
  const sourcePlayer = getPlayerById(state, sourcePlayerId)!;
  const opponent = sourcePlayerId === state.player1.id ? state.player2 : state.player1;
  
  const targets: ValidTarget[] = [];
  
  switch (effect.target) {
    case 'self':
      // Target the source unit
      if (sourceUnitId) {
        targets.push({ id: sourceUnitId, type: 'unit', playerId: sourcePlayerId });
      }
      break;
    
    case 'friendly_unit':
      // Pre-selected target or need player to choose
      if (preSelectedTargetId) {
        const unit = sourcePlayer.board.find(u => u.id === preSelectedTargetId);
        if (unit && !hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: sourcePlayerId });
        }
      }
      break;
    
    case 'enemy_unit':
      // Pre-selected target or need player to choose
      if (preSelectedTargetId) {
        const unit = opponent.board.find(u => u.id === preSelectedTargetId);
        if (unit && !hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: opponent.id });
        }
      }
      break;
    
    case 'any_unit':
      // Pre-selected target
      if (preSelectedTargetId) {
        const unitData = findUnit(state, preSelectedTargetId);
        if (unitData && !hasKeyword(unitData.unit, 'evasion')) {
          targets.push({ id: preSelectedTargetId, type: 'unit', playerId: unitData.owner.id });
        }
      }
      break;
    
    case 'friendly_player':
      targets.push({ id: sourcePlayerId, type: 'player', playerId: sourcePlayerId });
      break;
    
    case 'enemy_player':
      targets.push({ id: opponent.id, type: 'player', playerId: opponent.id });
      break;
    
    case 'all_friendly':
      for (const unit of sourcePlayer.board) {
        targets.push({ id: unit.id, type: 'unit', playerId: sourcePlayerId });
      }
      break;
    
    case 'all_enemies':
      for (const unit of opponent.board) {
        if (!hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: opponent.id });
        }
      }
      break;
    
    case 'all_units':
      for (const unit of sourcePlayer.board) {
        targets.push({ id: unit.id, type: 'unit', playerId: sourcePlayerId });
      }
      for (const unit of opponent.board) {
        if (!hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: opponent.id });
        }
      }
      break;
    
    case 'random_enemy':
      const eligibleEnemies = opponent.board.filter(u => !hasKeyword(u, 'evasion'));
      if (eligibleEnemies.length > 0) {
        const randomUnit = eligibleEnemies[Math.floor(Math.random() * eligibleEnemies.length)];
        targets.push({ id: randomUnit.id, type: 'unit', playerId: opponent.id });
      }
      break;
    
    case 'random_friendly':
      if (sourcePlayer.board.length > 0) {
        const randomUnit = sourcePlayer.board[Math.floor(Math.random() * sourcePlayer.board.length)];
        targets.push({ id: randomUnit.id, type: 'unit', playerId: sourcePlayerId });
      }
      break;
  }
  
  return targets;
}

/**
 * Check if an effect requires player targeting
 */
export function requiresTargeting(effect: CardEffect): boolean {
  const targetingTargets: EffectTarget[] = [
    'friendly_unit',
    'enemy_unit',
    'any_unit',
  ];
  return targetingTargets.includes(effect.target);
}

/**
 * Get valid targets for an effect that requires targeting
 */
export function getValidTargetsForEffect(
  state: GameState,
  effect: CardEffect,
  sourcePlayerId: string
): ValidTarget[] {
  const sourcePlayer = getPlayerById(state, sourcePlayerId)!;
  const opponent = sourcePlayerId === state.player1.id ? state.player2 : state.player1;
  const targets: ValidTarget[] = [];
  
  switch (effect.target) {
    case 'friendly_unit':
      for (const unit of sourcePlayer.board) {
        targets.push({ id: unit.id, type: 'unit', playerId: sourcePlayerId });
      }
      break;
    
    case 'enemy_unit':
      for (const unit of opponent.board) {
        if (!hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: opponent.id });
        }
      }
      break;
    
    case 'any_unit':
      for (const unit of sourcePlayer.board) {
        targets.push({ id: unit.id, type: 'unit', playerId: sourcePlayerId });
      }
      for (const unit of opponent.board) {
        if (!hasKeyword(unit, 'evasion')) {
          targets.push({ id: unit.id, type: 'unit', playerId: opponent.id });
        }
      }
      break;
  }
  
  return targets;
}

// ============================================
// EFFECT EXECUTION
// ============================================

/**
 * Execute a single effect on resolved targets
 */
export function executeEffect(
  state: GameState,
  effect: CardEffect,
  targets: ValidTarget[],
  sourcePlayerId: string
): { state: GameState; result: EffectResult } {
  let newState = { ...state };
  const result: EffectResult = { success: true };
  
  for (const target of targets) {
    switch (effect.action) {
      case 'damage':
        if (target.type === 'unit') {
          newState = dealDamageToUnit(newState, target.id, effect.value, sourcePlayerId);
          result.damage = (result.damage || 0) + effect.value;
        } else if (target.type === 'player') {
          newState = dealDamageToPlayer(newState, target.id, effect.value);
          result.damage = (result.damage || 0) + effect.value;
        }
        break;
      
      case 'heal':
        if (target.type === 'unit') {
          newState = healUnit(newState, target.id, effect.value);
          result.healing = (result.healing || 0) + effect.value;
        } else if (target.type === 'player') {
          newState = healPlayer(newState, target.id, effect.value);
          result.healing = (result.healing || 0) + effect.value;
        }
        break;
      
      case 'draw':
        const player = getPlayerById(newState, sourcePlayerId);
        if (player) {
          drawCards(player, effect.value);
          result.cardsDrawn = effect.value;
        }
        break;
      
      case 'buff_attack':
        if (target.type === 'unit') {
          newState = buffUnitAttack(newState, target.id, effect.value);
        }
        break;
      
      case 'buff_health':
        if (target.type === 'unit') {
          newState = buffUnitHealth(newState, target.id, effect.value);
        }
        break;
      
      case 'destroy':
        if (target.type === 'unit') {
          newState = destroyUnitById(newState, target.id);
          result.unitsDestroyed = [...(result.unitsDestroyed || []), target.id];
        }
        break;
      
      case 'silence':
        if (target.type === 'unit') {
          newState = silenceUnit(newState, target.id);
        }
        break;
      
      case 'return_hand':
        if (target.type === 'unit') {
          newState = returnUnitToHand(newState, target.id);
        }
        break;
      
      case 'summon':
        // Summon requires additional handling (summon_card_id)
        // Will be implemented with card database integration
        break;
      
      case 'copy':
        // Copy requires additional handling
        // Will be implemented with card database integration
        break;
      
      case 'stun':
        if (target.type === 'unit') {
          newState = stunUnit(newState, target.id);
        }
        break;
    }
  }
  
  return { state: newState, result };
}

/**
 * Return a unit to its owner's hand
 */
function returnUnitToHand(state: GameState, unitId: string): GameState {
  const newState = { ...state };
  const unitData = findUnit(newState, unitId);
  
  if (!unitData) return state;
  
  const { unit, owner } = unitData;
  
  // Remove from board
  const index = owner.board.findIndex(u => u.id === unitId);
  if (index !== -1) {
    owner.board.splice(index, 1);
    
    // Add to hand if not full
    if (owner.hand.length < 10) {
      const cardInHand: CardInHand = {
        id: uuidv4(),
        cardInstanceId: unit.cardInstanceId,
        design: unit.design,
      };
      owner.hand.push(cardInHand);
    }
    
    // Re-index positions
    owner.board.forEach((u, i) => {
      u.position = i;
    });
  }
  
  return newState;
}

// ============================================
// EFFECT QUEUE PROCESSING
// ============================================

/**
 * Process all pending effects in the queue
 */
export function processEffectQueue(state: GameState): GameState {
  let newState = { ...state };
  
  while (newState.pendingEffects.length > 0) {
    // Get the first effect
    const pendingEffect = newState.pendingEffects.shift()!;
    
    // Resolve targets if not pre-resolved
    let targets: ValidTarget[];
    if (pendingEffect.targetIds.length > 0) {
      // Use pre-selected targets
      targets = pendingEffect.targetIds.map(id => {
        const unitData = findUnit(newState, id);
        if (unitData) {
          return { id, type: 'unit' as const, playerId: unitData.owner.id };
        }
        // Assume it's a player ID
        return { id, type: 'player' as const, playerId: id };
      });
    } else {
      // Resolve targets
      targets = resolveTargets(
        newState,
        pendingEffect.effect,
        pendingEffect.sourcePlayerId,
        pendingEffect.sourceUnitId
      );
    }
    
    // Execute the effect
    const { state: resultState } = executeEffect(
      newState,
      pendingEffect.effect,
      targets,
      pendingEffect.sourcePlayerId
    );
    
    newState = resultState;
  }
  
  return newState;
}

/**
 * Queue start of turn effects
 */
export function queueStartOfTurnEffects(state: GameState): GameState {
  const newState = { ...state };
  const activePlayer = getActivePlayer(newState);
  
  for (const unit of activePlayer.board) {
    if (unit.isSilenced) continue;
    
    const startEffects = unit.design.effects.filter(e => e.trigger === 'start_of_turn');
    for (const effect of startEffects) {
      newState.pendingEffects.push({
        id: uuidv4(),
        sourceUnitId: unit.id,
        sourcePlayerId: activePlayer.id,
        effect,
        targetIds: [],
        trigger: 'start_of_turn',
      });
    }
  }
  
  return newState;
}

/**
 * Queue end of turn effects
 */
export function queueEndOfTurnEffects(state: GameState): GameState {
  const newState = { ...state };
  const activePlayer = getActivePlayer(newState);
  
  for (const unit of activePlayer.board) {
    if (unit.isSilenced) continue;
    
    const endEffects = unit.design.effects.filter(e => e.trigger === 'end_of_turn');
    for (const effect of endEffects) {
      newState.pendingEffects.push({
        id: uuidv4(),
        sourceUnitId: unit.id,
        sourcePlayerId: activePlayer.id,
        effect,
        targetIds: [],
        trigger: 'end_of_turn',
      });
    }
  }
  
  return newState;
}

