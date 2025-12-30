/**
 * Card In Hand Component
 * 
 * A smaller, interactive card for display in hand.
 * Supports dragging to play.
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { CardInHand as CardInHandType } from '../../game/types';
import { CardRarity, KEYWORD_INFO } from '../../types/database';

interface CardInHandProps {
  card: CardInHandType;
  index: number;
  totalCards: number;
  canPlay: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onPlay?: (position: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const RARITY_COLORS: Record<CardRarity, { border: string[]; accent: string }> = {
  common: { border: ['#4a4a4a', '#6b6b6b'], accent: '#6b7280' },
  uncommon: { border: ['#059669', '#10b981'], accent: '#10b981' },
  rare: { border: ['#1d4ed8', '#3b82f6'], accent: '#3b82f6' },
  epic: { border: ['#7c3aed', '#a855f7'], accent: '#a855f7' },
  legendary: { border: ['#b45309', '#f59e0b', '#dc2626'], accent: '#f59e0b' },
};

export default function CardInHand({
  card,
  index,
  totalCards,
  canPlay,
  isSelected = false,
  onSelect,
  onPlay,
  onDragStart,
  onDragEnd,
}: CardInHandProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(index);

  const fanAngle = totalCards > 1 ? (index - (totalCards - 1) / 2) * 5 : 0;
  const fanOffset = totalCards > 1 ? (index - (totalCards - 1) / 2) * 15 : 0;

  const design = card.design;
  const rarityConfig = RARITY_COLORS[design.rarity];

  const panGesture = Gesture.Pan()
    .onStart(() => {
      zIndex.value = 100;
      scale.value = withSpring(1.15);
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (canPlay && event.translationY < -100) {
        const position = Math.floor((event.absoluteX / 350) * 7);
        if (onPlay) runOnJS(onPlay)(Math.max(0, Math.min(6, position)));
      }
      
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = index;
      if (onDragEnd) runOnJS(onDragEnd)();
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onSelect) runOnJS(onSelect)();
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + fanOffset },
      { translateY: translateY.value + (isSelected ? -20 : 0) },
      { rotate: `${fanAngle}deg` },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        {/* Card Border */}
        <LinearGradient
          colors={rarityConfig.border as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          {/* Card Inner */}
          <View style={styles.cardInner}>
            {/* Mana Crystal - Top Left */}
            <View style={styles.manaCostContainer}>
              <LinearGradient
                colors={canPlay ? ['#1e40af', '#3b82f6'] : ['#991b1b', '#ef4444']}
                style={styles.manaCrystal}
              >
                <Text style={styles.manaText}>{design.mana_cost}</Text>
              </LinearGradient>
            </View>

            {/* Card Art - 4:3 ratio */}
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
                    {design.category === 'action' ? '⚡' : '⚔️'}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Name */}
            <View style={styles.nameContainer}>
              <Text style={styles.cardName} numberOfLines={1}>
                {design.name}
              </Text>
            </View>

            {/* Stats - Bottom Right (Units only) */}
            {design.category === 'unit' && (
              <View style={styles.statsContainer}>
                <View style={styles.statBadge}>
                  <LinearGradient
                    colors={['#dc2626', '#ef4444']}
                    style={styles.statGradient}
                  >
                    <Text style={styles.statText}>{design.base_attack}</Text>
                  </LinearGradient>
                </View>
                <View style={[styles.statDivider, { backgroundColor: rarityConfig.accent }]} />
                <View style={styles.statBadge}>
                  <LinearGradient
                    colors={['#16a34a', '#22c55e']}
                    style={styles.statGradient}
                  >
                    <Text style={styles.statText}>{design.base_health}</Text>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Keywords Icons - Top Right */}
            {design.keywords.length > 0 && (
              <View style={styles.keywordsRow}>
                {design.keywords.slice(0, 2).map((kw) => (
                  <View key={kw} style={styles.keywordBadge}>
                    <Text style={styles.keywordIcon}>
                      {KEYWORD_INFO[kw].icon}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rarity indicator */}
            <View style={[styles.rarityDot, { backgroundColor: rarityConfig.accent }]} />

            {/* Can't play overlay */}
            {!canPlay && (
              <View style={styles.cantPlayOverlay} />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 75,
    height: 105,
    marginHorizontal: -12,
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
  
  // Mana Crystal
  manaCostContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    zIndex: 10,
  },
  manaCrystal: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  manaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  
  // Art Frame - 4:3 ratio
  artFrame: {
    height: 45, // 4:3 ratio for ~60px width
    marginHorizontal: 3,
    marginTop: 3,
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
    fontSize: 20,
    opacity: 0.7,
  },
  
  // Name
  nameContainer: {
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  cardName: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
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
  statBadge: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  statGradient: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  statDivider: {
    width: 1,
    height: 12,
    opacity: 0.5,
  },
  
  // Keywords
  keywordsRow: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'column',
    gap: 1,
  },
  keywordBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 3,
    padding: 1,
  },
  keywordIcon: {
    fontSize: 8,
  },
  
  // Rarity
  rarityDot: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Overlay
  cantPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
