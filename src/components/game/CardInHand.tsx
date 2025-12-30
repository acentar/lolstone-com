/**
 * Card In Hand Component
 * 
 * A smaller, interactive card for display in hand.
 * Supports dragging to play.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

const RARITY_COLORS: Record<CardRarity, string[]> = {
  common: ['#4a4a4a', '#6b6b6b'],
  uncommon: ['#22c55e', '#16a34a'],
  rare: ['#3b82f6', '#1d4ed8'],
  epic: ['#a855f7', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
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
  const isDragging = useSharedValue(false);

  // Calculate fan position
  const fanAngle = totalCards > 1 ? (index - (totalCards - 1) / 2) * 5 : 0;
  const fanOffset = totalCards > 1 ? (index - (totalCards - 1) / 2) * 15 : 0;

  const design = card.design;
  const colors = RARITY_COLORS[design.rarity];

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      zIndex.value = 100;
      scale.value = withSpring(1.1);
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;
      
      // Check if dragged to play zone (upward)
      if (canPlay && event.translationY < -100) {
        // Calculate board position based on X
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

  const costColor = canPlay ? '#22c55e' : '#ef4444';

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        {/* Card Border */}
        <LinearGradient
          colors={colors as any}
          style={styles.cardBorder}
        >
          {/* Card Inner */}
          <View style={styles.cardInner}>
            {/* Mana Cost */}
            <View style={[styles.manaCost, { backgroundColor: costColor }]}>
              <Text style={styles.manaText}>{design.mana_cost}</Text>
            </View>

            {/* Card Art */}
            <View style={styles.artFrame}>
              {design.image_url ? (
                <Animated.Image
                  source={{ uri: design.image_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.artPlaceholder}>
                  {design.category === 'action' ? '⚡' : '⚔️'}
                </Text>
              )}
            </View>

            {/* Name */}
            <Text style={styles.cardName} numberOfLines={1}>
              {design.name}
            </Text>

            {/* Stats (Units only) */}
            {design.category === 'unit' && (
              <View style={styles.statsRow}>
                <View style={styles.attackBadge}>
                  <Text style={styles.statText}>{design.base_attack}</Text>
                </View>
                <View style={styles.healthBadge}>
                  <Text style={styles.statText}>{design.base_health}</Text>
                </View>
              </View>
            )}

            {/* Keywords Icons */}
            {design.keywords.length > 0 && (
              <View style={styles.keywordsRow}>
                {design.keywords.map((kw) => (
                  <Text key={kw} style={styles.keywordIcon}>
                    {KEYWORD_INFO[kw].icon}
                  </Text>
                ))}
              </View>
            )}

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
    width: 80,
    height: 110,
    marginHorizontal: -15, // Overlap cards
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
    position: 'relative',
  },
  manaCost: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  manaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  artFrame: {
    height: 50,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    fontSize: 24,
    opacity: 0.6,
  },
  cardName: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 'auto',
    paddingBottom: 4,
  },
  attackBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  keywordsRow: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'column',
    gap: 2,
  },
  keywordIcon: {
    fontSize: 10,
  },
  cantPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

