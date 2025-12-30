/**
 * Player Profile Component
 * 
 * Displays player's avatar, name, health bar, and bandwidth (mana)
 */

import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface PlayerProfileProps {
  name: string;
  avatarUrl?: string;
  health: number;
  maxHealth: number;
  bandwidth: number;
  maxBandwidth: number;
  isActive: boolean;
  isOpponent?: boolean;
  onPress?: () => void;
  deckCount?: number;
  fatigueCount?: number;
}

export default function PlayerProfile({
  name,
  avatarUrl,
  health,
  maxHealth,
  bandwidth,
  maxBandwidth,
  isActive,
  isOpponent = false,
  onPress,
  deckCount = 0,
  fatigueCount = 0,
}: PlayerProfileProps) {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const damageFlash = useSharedValue(0);

  // Animate health bar color based on health percentage
  const getHealthColor = () => {
    if (healthPercent > 60) return ['#22c55e', '#16a34a'];
    if (healthPercent > 30) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#b91c1c'];
  };

  const animatedHealthStyle = useAnimatedStyle(() => ({
    backgroundColor: damageFlash.value > 0 ? '#ef4444' : 'transparent',
    opacity: damageFlash.value,
  }));

  const triggerDamageFlash = () => {
    damageFlash.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(0, { duration: 200 })
    );
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={[
        styles.container,
        isActive && styles.activeContainer,
        isOpponent && styles.opponentContainer,
      ]}>
        {/* Active Turn Indicator */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeDot} />
          </View>
        )}

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={isOpponent ? ['#ef4444', '#b91c1c'] : ['#3b82f6', '#1d4ed8']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarLetter}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          
          {/* Health Badge */}
          <View style={styles.healthBadge}>
            <Text style={styles.healthNumber}>{health}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Name */}
          <Text style={styles.playerName} numberOfLines={1}>
            {name}
          </Text>

          {/* Health Bar */}
          <View style={styles.healthBarContainer}>
            <View style={styles.healthBarBackground}>
              <Animated.View style={[styles.damageOverlay, animatedHealthStyle]} />
              <LinearGradient
                colors={getHealthColor() as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.healthBarFill, { width: `${healthPercent}%` }]}
              />
            </View>
            <Text style={styles.healthText}>
              {health}/{maxHealth}
            </Text>
          </View>

          {/* Bandwidth Crystals */}
          <View style={styles.bandwidthContainer}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bandwidthCrystal,
                  i < bandwidth && styles.bandwidthActive,
                  i >= maxBandwidth && styles.bandwidthLocked,
                ]}
              >
                {i < maxBandwidth && (
                  <Text style={styles.bandwidthText}>
                    {i < bandwidth ? '💎' : '◇'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Deck Counter */}
        <View style={styles.deckContainer}>
          <View style={styles.deckIcon}>
            <Text style={styles.deckEmoji}>🃏</Text>
          </View>
          <Text style={styles.deckCount}>{deckCount}</Text>
          {fatigueCount > 0 && (
            <Text style={styles.fatigueWarning}>⚠️</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    gap: 12,
  },
  activeContainer: {
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  opponentContainer: {
    // Flip orientation for opponent at top
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    left: 12,
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#334155',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  healthBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  healthNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  infoSection: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  healthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  damageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  healthText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 40,
  },
  bandwidthContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  bandwidthCrystal: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandwidthActive: {},
  bandwidthLocked: {
    opacity: 0.2,
  },
  bandwidthText: {
    fontSize: 10,
  },
  deckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deckIcon: {
    width: 32,
    height: 40,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deckEmoji: {
    fontSize: 16,
  },
  deckCount: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  fatigueWarning: {
    fontSize: 12,
  },
});

