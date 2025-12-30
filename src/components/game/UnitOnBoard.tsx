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
  onLongPress?: () => void;
}

const RARITY_COLORS: Record<CardRarity, { border: string[]; accent: string }> = {
  common: { border: ['#4a4a4a', '#6b6b6b'], accent: '#6b7280' },
  uncommon: { border: ['#059669', '#10b981'], accent: '#10b981' },
  rare: { border: ['#1d4ed8', '#3b82f6'], accent: '#3b82f6' },
  epic: { border: ['#7c3aed', '#a855f7'], accent: '#a855f7' },
  legendary: { border: ['#b45309', '#f59e0b', '#dc2626'], accent: '#f59e0b' },
};

export default function UnitOnBoard({
  unit,
  isOwned,
  canAttack,
  isValidTarget,
  isAttacking = false,
  onSelect,
  onAttackTarget,
  onLongPress,
}: UnitOnBoardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shake = useSharedValue(0);

  const design = unit.design;
  const rarityConfig = RARITY_COLORS[design.rarity];

  // Attack animation
  useEffect(() => {
    if (isAttacking) {
      translateY.value = withSequence(
        withTiming(-30, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [isAttacking]);

  const handlePress = () => {
    if (isValidTarget && onAttackTarget) {
      onAttackTarget();
    } else if (isOwned && canAttack && onSelect) {
      onSelect();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: shake.value },
      { scale: scale.value },
    ],
  }));

  // Health color based on damage
  const healthPercent = unit.currentHealth / unit.maxHealth;
  const isBuffed = unit.currentAttack > unit.design.base_attack || unit.maxHealth > unit.design.base_health;
  const isDamaged = unit.currentHealth < unit.maxHealth;

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Can Attack Glow */}
        {isOwned && canAttack && (
          <View style={[styles.canAttackGlow, { borderColor: '#22c55e' }]} />
        )}

        {/* Valid Target Indicator */}
        {isValidTarget && (
          <View style={styles.targetIndicator} />
        )}

        {/* Card Border */}
        <LinearGradient
          colors={rarityConfig.border as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {/* Art - 4:3 ratio */}
            <View style={styles.artFrame}>
              {design.image_url ? (
                <Image
                  source={{ uri: design.image_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#1e293b', '#334155']}
                  style={styles.artPlaceholderBg}
                >
                  <Text style={styles.artPlaceholder}>
                    {design.card_type === 'meme_minion' ? '😂' : '⚔️'}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Keywords */}
            {!unit.isSilenced && design.keywords.length > 0 && (
              <View style={styles.keywordsBar}>
                {design.keywords.map((kw) => (
                  <View key={kw} style={styles.keywordBadge}>
                    <Text style={styles.keywordIcon}>{KEYWORD_INFO[kw].icon}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Silenced Indicator */}
            {unit.isSilenced && (
              <View style={styles.silencedBadge}>
                <Text style={styles.silencedText}>🤐</Text>
              </View>
            )}

            {/* Summoning Sickness */}
            {unit.hasSummoningSickness && (
              <View style={styles.sicknessOverlay}>
                <Text style={styles.sicknessText}>💤</Text>
              </View>
            )}

            {/* Stats - Bottom Right */}
            <View style={styles.statsContainer}>
              {/* Attack */}
              <View style={styles.statWrapper}>
                <LinearGradient
                  colors={['#dc2626', '#ef4444']}
                  style={[
                    styles.statBadge,
                    isBuffed && unit.currentAttack > unit.design.base_attack && styles.statBuffed,
                  ]}
                >
                  <Text style={styles.statValue}>{unit.currentAttack}</Text>
                </LinearGradient>
              </View>

              <View style={[styles.statDivider, { backgroundColor: rarityConfig.accent }]} />

              {/* Health */}
              <View style={styles.statWrapper}>
                <LinearGradient
                  colors={isDamaged ? ['#b45309', '#f59e0b'] : ['#16a34a', '#22c55e']}
                  style={[
                    styles.statBadge,
                    isBuffed && unit.maxHealth > unit.design.base_health && styles.statBuffed,
                  ]}
                >
                  <Text style={styles.statValue}>{unit.currentHealth}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Rarity gem */}
            <View style={[styles.rarityGem, { backgroundColor: rarityConfig.accent }]}>
              <Text style={styles.rarityLetter}>{design.rarity.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Name Tag */}
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
    height: 95,
    position: 'relative',
  },
  canAttackGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  targetIndicator: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  cardBorder: {
    flex: 1,
    borderRadius: 8,
    padding: 2,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  
  // Art Frame - 4:3 ratio
  artFrame: {
    flex: 1,
    margin: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholderBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artPlaceholder: {
    fontSize: 24,
    opacity: 0.8,
  },
  
  // Keywords
  keywordsBar: {
    position: 'absolute',
    top: 2,
    left: 2,
    flexDirection: 'row',
    gap: 2,
  },
  keywordBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 3,
    padding: 2,
  },
  keywordIcon: {
    fontSize: 9,
  },
  
  // Silenced
  silencedBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silencedText: {
    fontSize: 14,
  },
  
  // Summoning Sickness
  sicknessOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  sicknessText: {
    fontSize: 12,
  },
  
  // Stats Container - Bottom Right
  statsContainer: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statWrapper: {},
  statBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statBuffed: {
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  statDivider: {
    width: 1,
    height: 14,
    opacity: 0.5,
  },
  
  // Rarity Gem - Bottom Left
  rarityGem: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  rarityLetter: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  
  // Name Tag
  nameTag: {
    position: 'absolute',
    bottom: -14,
    left: -8,
    right: -8,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  nameText: {
    color: '#e2e8f0',
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
});
