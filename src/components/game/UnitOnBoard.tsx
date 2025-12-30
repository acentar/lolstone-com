/**
 * Unit On Board Component
 * 
 * Displays a unit that's currently on the battlefield.
 * Handles attack animations and visual states.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { UnitInPlay } from '../../game/types';
import { CardRarity, KEYWORD_INFO } from '../../types/database';

interface UnitOnBoardProps {
  unit: UnitInPlay;
  isOwned: boolean;
  canAttack: boolean;
  isValidTarget: boolean;
  isAttacking?: boolean;
  onSelect?: () => void;
  onAttackTarget?: () => void;
}

const RARITY_COLORS: Record<CardRarity, string[]> = {
  common: ['#4a4a4a', '#5a5a5a'],
  uncommon: ['#22c55e', '#16a34a'],
  rare: ['#3b82f6', '#1d4ed8'],
  epic: ['#a855f7', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
};

export default function UnitOnBoard({
  unit,
  isOwned,
  canAttack,
  isValidTarget,
  isAttacking = false,
  onSelect,
  onAttackTarget,
}: UnitOnBoardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shake = useSharedValue(0);

  const design = unit.design;
  const colors = RARITY_COLORS[design.rarity];

  // Attack animation
  useEffect(() => {
    if (isAttacking) {
      translateY.value = withSequence(
        withTiming(-30, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [isAttacking]);

  // Damaged animation
  const triggerDamageAnimation = () => {
    shake.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handlePress = () => {
    if (isValidTarget && onAttackTarget) {
      onAttackTarget();
    } else if (isOwned && canAttack && onSelect) {
      onSelect();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: shake.value },
      { scale: scale.value },
    ],
  }));

  // Health color
  const healthPercent = unit.currentHealth / unit.maxHealth;
  const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';

  // Stat changes
  const attackChanged = unit.currentAttack !== unit.design.base_attack;
  const healthChanged = unit.currentHealth !== unit.design.base_health || unit.maxHealth !== unit.design.base_health;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Can Attack Indicator */}
        {isOwned && canAttack && (
          <View style={styles.canAttackGlow} />
        )}

        {/* Valid Target Indicator */}
        {isValidTarget && (
          <View style={styles.targetIndicator} />
        )}

        {/* Summoning Sickness */}
        {unit.hasSummoningSickness && (
          <View style={styles.sicknessOverlay}>
            <Text style={styles.sicknessText}>💤</Text>
          </View>
        )}

        {/* Card Border */}
        <LinearGradient
          colors={colors as any}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {/* Art */}
            <View style={styles.artFrame}>
              {design.image_url ? (
                <Image
                  source={{ uri: design.image_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.artPlaceholder}>
                  {design.card_type === 'meme_minion' ? '😂' : '⚔️'}
                </Text>
              )}
            </View>

            {/* Keywords */}
            {!unit.isSilenced && design.keywords.length > 0 && (
              <View style={styles.keywordsBar}>
                {design.keywords.map((kw) => (
                  <Text key={kw} style={styles.keywordIcon} title={KEYWORD_INFO[kw].name}>
                    {KEYWORD_INFO[kw].icon}
                  </Text>
                ))}
              </View>
            )}

            {/* Silenced Indicator */}
            {unit.isSilenced && (
              <View style={styles.silencedBadge}>
                <Text style={styles.silencedText}>🤐</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              {/* Attack */}
              <View style={[
                styles.attackBadge,
                attackChanged && styles.statBuffed,
              ]}>
                <Text style={styles.statText}>{unit.currentAttack}</Text>
              </View>

              {/* Health */}
              <View style={[
                styles.healthBadge,
                { backgroundColor: healthColor },
                healthChanged && (unit.currentHealth < unit.design.base_health ? styles.statDamaged : styles.statBuffed),
              ]}>
                <Text style={styles.statText}>{unit.currentHealth}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Name Tooltip (on hover/select) */}
        <View style={styles.nameTag}>
          <Text style={styles.nameText} numberOfLines={1}>
            {design.name}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 70,
    height: 90,
    position: 'relative',
  },
  canAttackGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  targetIndicator: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  sicknessOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  sicknessText: {
    fontSize: 14,
  },
  cardBorder: {
    flex: 1,
    borderRadius: 8,
    padding: 2,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  artFrame: {
    flex: 1,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    fontSize: 28,
    opacity: 0.7,
  },
  keywordsBar: {
    position: 'absolute',
    top: 2,
    left: 2,
    flexDirection: 'row',
    gap: 2,
  },
  keywordIcon: {
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  silencedBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silencedText: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
  },
  attackBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  healthBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  statText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  statBuffed: {
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  statDamaged: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  nameTag: {
    position: 'absolute',
    bottom: -16,
    left: -10,
    right: -10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  nameText: {
    color: '#e2e8f0',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});

