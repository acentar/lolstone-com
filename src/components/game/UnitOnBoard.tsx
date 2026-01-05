/**
 * Unit On Board Component
 * 
 * Displays a unit that's currently on the battlefield.
 * Handles attack animations, damage indicators, and visual states.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  interpolateColor,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  SlideInUp,
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
  isChargingAttack?: boolean;  // Unit is currently charging toward target
  isBeingAttacked?: boolean;   // Unit is being attacked
  attackingUp?: boolean;       // Direction of charge (up = toward opponent)
  onSelect?: () => void;
  onAttackTarget?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;    // Double tap to view card details
}

// Floating damage number component
function DamageNumber({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={styles.damageNumber}
    >
      <Text style={styles.damageText}>-{amount}</Text>
    </Animated.View>
  );
}

// Heal number component  
function HealNumber({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.healNumber}
    >
      <Text style={styles.healText}>+{amount}</Text>
    </Animated.View>
  );
}

const RARITY_COLORS: Record<CardRarity, { border: string[]; accent: string }> = {
  common: { border: ['#4a4a4a', '#6b6b6b'], accent: '#6b7280' },
  uncommon: { border: ['#059669', '#10b981'], accent: '#10b981' },
  rare: { border: ['#1d4ed8', '#3b82f6'], accent: '#3b82f6' },
  epic: { border: ['#7c3aed', '#a855f7'], accent: '#a855f7' },
  legendary: { border: ['#b45309', '#f59e0b', '#dc2626'], accent: '#f59e0b' },
};

// Impact explosion component
function ImpactExplosion({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Animated.View
      entering={ZoomIn.duration(150).springify()}
      exiting={FadeOut.duration(200)}
      style={impactStyles.container}
    >
      <View style={impactStyles.ring1} />
      <View style={impactStyles.ring2} />
      <View style={impactStyles.ring3} />
      <Text style={impactStyles.impactText}>💥</Text>
    </Animated.View>
  );
}

const impactStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  ring1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#f59e0b',
    opacity: 0.8,
  },
  ring2: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#ef4444',
    opacity: 0.6,
  },
  ring3: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  impactText: {
    fontSize: 32,
    zIndex: 10,
  },
});

export default function UnitOnBoard({
  unit,
  isOwned,
  canAttack,
  isValidTarget,
  isAttacking = false,
  isChargingAttack = false,
  isBeingAttacked = false,
  attackingUp = true,
  onSelect,
  onAttackTarget,
  onLongPress,
  onDoubleTap,
}: UnitOnBoardProps) {
  // Double tap detection
  const lastTapRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300;
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const shake = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  // Track previous health for damage animations
  const prevHealthRef = useRef(unit.currentHealth);
  const [damageAmount, setDamageAmount] = useState<number | null>(null);
  const [healAmount, setHealAmount] = useState<number | null>(null);
  const [showImpact, setShowImpact] = useState(false);

  const design = unit.design;
  const rarityConfig = RARITY_COLORS[design.rarity];

  // Detect health changes and trigger animations
  useEffect(() => {
    const prevHealth = prevHealthRef.current;
    const currentHealth = unit.currentHealth;
    
    if (prevHealth !== currentHealth) {
      const diff = prevHealth - currentHealth;
      
      if (diff > 0) {
        // Unit took damage!
        console.log(`💥 ${unit.design.name} took ${diff} damage!`);
        setDamageAmount(diff);
        
        // Shake animation
        shake.value = withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 50 }),
          withTiming(-3, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        
        // Red flash
        flashOpacity.value = withSequence(
          withTiming(0.6, { duration: 100 }),
          withTiming(0, { duration: 400 })
        );
      } else if (diff < 0) {
        // Unit was healed!
        setHealAmount(Math.abs(diff));
        
        // Scale up slightly
        scale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
      }
      
      prevHealthRef.current = currentHealth;
    }
  }, [unit.currentHealth, unit.design.name]);

  // Charging attack animation - dramatic charge toward target
  useEffect(() => {
    if (isChargingAttack) {
      // Direction: negative Y = up (toward opponent), positive = down
      const chargeDistance = attackingUp ? -60 : 60;
      const rotationAmount = attackingUp ? -5 : 5;
      
      // Wind up, then charge!
      translateY.value = withSequence(
        // Wind up - pull back slightly
        withTiming(attackingUp ? 8 : -8, { duration: 100, easing: Easing.out(Easing.ease) }),
        // CHARGE! - lunge forward aggressively
        withTiming(chargeDistance, { duration: 200, easing: Easing.out(Easing.exp) }),
        // Hold at impact position briefly
        withDelay(150, withTiming(0, { duration: 250, easing: Easing.out(Easing.bounce) }))
      );
      
      // Scale up during charge
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.3, { duration: 200, easing: Easing.out(Easing.exp) }),
        withDelay(150, withTiming(1, { duration: 200 }))
      );
      
      // Slight rotation for aggressive feel
      rotation.value = withSequence(
        withTiming(rotationAmount, { duration: 200 }),
        withDelay(150, withTiming(0, { duration: 250 }))
      );
    }
  }, [isChargingAttack, attackingUp]);

  // Being attacked animation - show impact explosion
  useEffect(() => {
    if (isBeingAttacked) {
      // Delay impact to sync with attacker reaching target
      setTimeout(() => {
        setShowImpact(true);
      }, 300);
    }
  }, [isBeingAttacked]);

  // Simple attack animation (for selection indication)
  useEffect(() => {
    if (isAttacking && !isChargingAttack) {
      translateY.value = withSequence(
        withTiming(-10, { duration: 150, easing: Easing.out(Easing.exp) }),
        withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) })
      );
      scale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isAttacking, isChargingAttack]);

  const handlePress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < DOUBLE_TAP_DELAY && onDoubleTap) {
      // Double tap detected - show card info
      onDoubleTap();
      lastTapRef.current = 0; // Reset to prevent triple tap
      return;
    }
    
    lastTapRef.current = now;
    
    // Single tap behavior (with slight delay to detect double tap)
    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY - 50) {
        if (isValidTarget && onAttackTarget) {
          onAttackTarget();
        } else if (isOwned && canAttack && onSelect) {
          onSelect();
        }
      }
    }, DOUBLE_TAP_DELAY);
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
      { rotateZ: `${rotation.value}deg` },
    ],
    zIndex: isChargingAttack ? 100 : 1, // Bring charging unit to front
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // Health color based on damage
  const healthPercent = unit.currentHealth / unit.maxHealth;
  const isBuffed = unit.currentAttack > unit.design.base_attack || unit.maxHealth > unit.design.base_health;
  const isDamaged = unit.currentHealth < unit.maxHealth;

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Damage Flash Overlay */}
        <Animated.View style={[styles.damageFlash, flashStyle]} pointerEvents="none" />
        
        {/* Floating Damage Number */}
        {damageAmount !== null && (
          <DamageNumber 
            amount={damageAmount} 
            onComplete={() => setDamageAmount(null)} 
          />
        )}
        
        {/* Floating Heal Number */}
        {healAmount !== null && (
          <HealNumber 
            amount={healAmount} 
            onComplete={() => setHealAmount(null)} 
          />
        )}
        
        {/* Impact Explosion when being attacked */}
        {showImpact && (
          <ImpactExplosion onComplete={() => setShowImpact(false)} />
        )}
        
        {/* Can Attack Glow - Pulsing */}
        {isOwned && canAttack && (
          <Animated.View style={[styles.canAttackGlow, { borderColor: '#22c55e' }]} />
        )}

        {/* Valid Target Indicator */}
        {isValidTarget && (
          <Animated.View style={styles.targetIndicator} />
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
  damageFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    zIndex: 100,
  },
  damageNumber: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  damageText: {
    color: '#ef4444',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  healNumber: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  healText: {
    color: '#22c55e',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
