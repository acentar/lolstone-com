/**
 * Lolstone Game Engine
 * 
 * Complete game engine for the Lolstone card game.
 * Handles game state, turns, combat, effects, and all game logic.
 */

// Types
export * from './types';

// State management
export {
  createGame,
  startTurn,
  endTurn,
  playCard,
  drawCards,
  concede,
  checkWinCondition,
  cloneGameState,
  isActionLegal,
  type CreateGameOptions,
} from './state';

// Combat system
export {
  executeAttack,
  dealDamageToUnit,
  dealDamageToPlayer,
  healUnit,
  healPlayer,
  destroyUnit,
  destroyUnitById,
  buffUnitAttack,
  buffUnitHealth,
  applyBoost,
  silenceUnit,
  getValidAttackTargets,
  canUnitAttack,
  type AttackResult,
} from './combat';

// Effect processing
export {
  resolveTargets,
  requiresTargeting,
  getValidTargetsForEffect,
  executeEffect,
  processEffectQueue,
  queueStartOfTurnEffects,
  queueEndOfTurnEffects,
} from './effects';

// Reducer and actions
export {
  gameReducer,
  createAction,
  createPlayCardAction,
  createAttackAction,
  createEndTurnAction,
  createConcedeAction,
  createMulliganAction,
  GameInstance,
} from './reducer';

