/**
 * Game Board Component
 * 
 * The main battlefield where units are placed and combat happens.
 * Shows both player's boards with 7 slots each.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import UnitOnBoard from './UnitOnBoard';
import { UnitInPlay, GAME_CONFIG } from '../../game/types';

interface GameBoardProps {
  playerBoard: UnitInPlay[];
  opponentBoard: UnitInPlay[];
  activePlayerId: string;
  playerId: string;
  selectedAttackerId: string | null;
  validAttackTargets: string[];
  onSelectUnit?: (unitId: string) => void;
  onAttackTarget?: (targetId: string) => void;
  onAttackFace?: () => void;
  canAttackFace?: boolean;
}

export default function GameBoard({
  playerBoard,
  opponentBoard,
  activePlayerId,
  playerId,
  selectedAttackerId,
  validAttackTargets,
  onSelectUnit,
  onAttackTarget,
  onAttackFace,
  canAttackFace = false,
}: GameBoardProps) {
  const isPlayerTurn = activePlayerId === playerId;

  // Animated divider glow
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const renderSlot = (index: number, unit: UnitInPlay | undefined, isOpponent: boolean) => {
    const isEmpty = !unit;
    const unitOwned = !isOpponent;
    const canAttack = unitOwned && isPlayerTurn && unit?.canAttack && !unit?.hasSummoningSickness;
    const isValidTarget = validAttackTargets.includes(unit?.id || '');
    const isAttacking = selectedAttackerId === unit?.id;

    return (
      <View key={index} style={styles.slot}>
        {isEmpty ? (
          <View style={styles.emptySlot}>
            <Text style={styles.slotNumber}>{index + 1}</Text>
          </View>
        ) : (
          <UnitOnBoard
            unit={unit}
            isOwned={unitOwned}
            canAttack={canAttack || false}
            isValidTarget={isValidTarget}
            isAttacking={isAttacking}
            onSelect={() => onSelectUnit?.(unit.id)}
            onAttackTarget={() => onAttackTarget?.(unit.id)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Opponent's Board */}
      <View style={styles.boardHalf}>
        <View style={styles.boardRow}>
          {Array.from({ length: GAME_CONFIG.MAX_BOARD_SIZE }).map((_, i) => 
            renderSlot(i, opponentBoard[i], true)
          )}
        </View>
        
        {/* Face Attack Target */}
        {canAttackFace && (
          <Pressable style={styles.faceTarget} onPress={onAttackFace}>
            <Text style={styles.faceTargetText}>⚔️ Attack Face</Text>
          </Pressable>
        )}
      </View>

      {/* Center Divider */}
      <View style={styles.dividerContainer}>
        <Animated.View style={[styles.dividerGlow, dividerStyle]}>
          <LinearGradient
            colors={['transparent', '#3b82f6', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
        </Animated.View>
        
        {/* Turn Indicator */}
        <View style={[
          styles.turnIndicator,
          isPlayerTurn ? styles.yourTurn : styles.opponentTurn,
        ]}>
          <Text style={styles.turnText}>
            {isPlayerTurn ? 'YOUR TURN' : 'OPPONENT'}
          </Text>
        </View>
      </View>

      {/* Player's Board */}
      <View style={styles.boardHalf}>
        <View style={styles.boardRow}>
          {Array.from({ length: GAME_CONFIG.MAX_BOARD_SIZE }).map((_, i) => 
            renderSlot(i, playerBoard[i], false)
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  boardHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  slot: {
    width: 74,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    width: 70,
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(51, 65, 85, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  slotNumber: {
    color: 'rgba(148, 163, 184, 0.3)',
    fontSize: 16,
    fontWeight: '600',
  },
  faceTarget: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  faceTargetText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
  dividerContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dividerGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
  },
  dividerLine: {
    flex: 1,
    height: 2,
  },
  turnIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  yourTurn: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  opponentTurn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  turnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

