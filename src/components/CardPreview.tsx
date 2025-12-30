import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CardRarity, CardCategory, CardKeyword, KEYWORD_INFO } from '../types/database';

interface CardPreviewProps {
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  rarity: CardRarity;
  category: CardCategory;
  abilityText?: string;
  flavorText?: string;
  keywords?: CardKeyword[];
  imageUrl?: string;
  cardType?: string;
  scale?: number;
}

const RARITY_CONFIGS: Record<CardRarity, {
  colors: string[];
  glowColor: string;
  borderColors: string[];
  animationSpeed: number;
}> = {
  common: {
    colors: ['#4a4a4a', '#6b6b6b', '#4a4a4a'],
    glowColor: 'rgba(107, 107, 107, 0.3)',
    borderColors: ['#5a5a5a', '#7a7a7a', '#5a5a5a'],
    animationSpeed: 0,
  },
  uncommon: {
    colors: ['#22c55e', '#4ade80', '#22c55e'],
    glowColor: 'rgba(34, 197, 94, 0.4)',
    borderColors: ['#16a34a', '#4ade80', '#16a34a'],
    animationSpeed: 4000,
  },
  rare: {
    colors: ['#3b82f6', '#60a5fa', '#3b82f6'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    borderColors: ['#2563eb', '#93c5fd', '#2563eb'],
    animationSpeed: 3000,
  },
  epic: {
    colors: ['#a855f7', '#c084fc', '#a855f7'],
    glowColor: 'rgba(168, 85, 247, 0.5)',
    borderColors: ['#9333ea', '#d8b4fe', '#9333ea'],
    animationSpeed: 2500,
  },
  legendary: {
    colors: ['#f59e0b', '#fbbf24', '#f59e0b', '#ef4444', '#f59e0b'],
    glowColor: 'rgba(245, 158, 11, 0.6)',
    borderColors: ['#d97706', '#fcd34d', '#ef4444', '#fcd34d', '#d97706'],
    animationSpeed: 2000,
  },
};

const TYPE_ICONS: Record<string, string> = {
  meme_minion: '😂',
  viral_spell: '🌐',
  troll_legendary: '🧌',
  reaction_trap: '😱',
  copypasta_enchantment: '📜',
};

export default function CardPreview({
  name,
  manaCost,
  attack,
  health,
  rarity,
  category,
  abilityText,
  flavorText,
  keywords = [],
  imageUrl,
  cardType = 'meme_minion',
  scale = 1,
}: CardPreviewProps) {
  const config = RARITY_CONFIGS[rarity];
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    if (config.animationSpeed > 0) {
      // Rotating gradient animation for rare+ cards
      rotation.value = withRepeat(
        withTiming(360, { duration: config.animationSpeed, easing: Easing.linear }),
        -1,
        false
      );

      // Subtle pulse for legendary
      if (rarity === 'legendary') {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      }

      // Shimmer effect
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [rarity, config.animationSpeed]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
    ],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerPosition.value * 0.3,
    transform: [
      { translateX: shimmerPosition.value * 100 - 50 },
    ],
  }));

  const cardWidth = 240 * scale;
  const cardHeight = 340 * scale;

  return (
    <Animated.View style={[styles.cardWrapper, animatedCardStyle, { width: cardWidth + 8, height: cardHeight + 8 }]}>
      {/* Animated Border Layer */}
      {config.animationSpeed > 0 && (
        <Animated.View style={[styles.animatedBorderWrapper, animatedBorderStyle]}>
          <LinearGradient
            colors={config.borderColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.animatedBorder, { width: cardWidth * 2, height: cardHeight * 2 }]}
          />
        </Animated.View>
      )}

      {/* Glow Effect */}
      <View style={[styles.glowEffect, { 
        shadowColor: config.glowColor.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')'),
        shadowOpacity: rarity === 'legendary' ? 0.8 : rarity === 'epic' ? 0.6 : 0.4,
        shadowRadius: rarity === 'legendary' ? 20 : 12,
      }]} />

      {/* Card Container */}
      <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
        {/* Card Background */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#1a1a2e']}
          style={styles.cardBackground}
        />

        {/* Static Border */}
        <LinearGradient
          colors={config.colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        />

        {/* Card Inner */}
        <View style={styles.cardInner}>
          {/* Header - Name & Mana */}
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.cardName, { fontSize: 14 * scale }]} numberOfLines={1}>
                {name || 'Card Name'}
              </Text>
            </View>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={[styles.manaCrystal, { width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale }]}
            >
              <Text style={[styles.manaText, { fontSize: 16 * scale }]}>{manaCost}</Text>
            </LinearGradient>
          </View>

          {/* Art Frame */}
          <View style={[styles.artFrame, { height: 100 * scale }]}>
            <LinearGradient
              colors={['#0f172a', '#1e293b', '#0f172a']}
              style={styles.artBackground}
            >
              <Text style={[styles.artPlaceholder, { fontSize: 48 * scale }]}>
                {TYPE_ICONS[cardType] || '🃏'}
              </Text>
              
              {/* Shimmer Overlay */}
              {config.animationSpeed > 0 && (
                <Animated.View style={[styles.shimmerOverlay, animatedShimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </LinearGradient>
          </View>

          {/* Type Bar */}
          <LinearGradient
            colors={[config.colors[0], config.colors[1], config.colors[0]] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.typeBar}
          >
            <Text style={[styles.typeText, { fontSize: 9 * scale }]}>
              {category === 'action' ? '⚡ ACTION' : '⚔️ UNIT'} • {rarity.toUpperCase()}
            </Text>
          </LinearGradient>

          {/* Text Box */}
          <View style={[styles.textBox, { flex: 1, minHeight: 80 * scale }]}>
            {/* Keywords */}
            {keywords.length > 0 && (
              <View style={styles.keywordsRow}>
                {keywords.map((kw) => (
                  <View key={kw} style={styles.keywordBadge}>
                    <Text style={[styles.keywordText, { fontSize: 9 * scale }]}>
                      {KEYWORD_INFO[kw].icon} {KEYWORD_INFO[kw].name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ability Text */}
            {abilityText ? (
              <Text style={[styles.abilityText, { fontSize: 10 * scale }]} numberOfLines={4}>
                {abilityText}
              </Text>
            ) : (
              <Text style={[styles.noAbilityText, { fontSize: 10 * scale }]}>
                No ability text
              </Text>
            )}

            {/* Flavor Text */}
            {flavorText && (
              <Text style={[styles.flavorText, { fontSize: 9 * scale }]} numberOfLines={2}>
                "{flavorText}"
              </Text>
            )}
          </View>

          {/* Stats Bar (Units only) */}
          {category === 'unit' && (
            <View style={styles.statsBar}>
              {/* Attack */}
              <View style={styles.statContainer}>
                <LinearGradient
                  colors={['#ef4444', '#b91c1c']}
                  style={[styles.statBadge, { width: 36 * scale, height: 36 * scale, borderRadius: 18 * scale }]}
                >
                  <Text style={[styles.statIcon, { fontSize: 10 * scale }]}>⚔️</Text>
                  <Text style={[styles.statValue, { fontSize: 16 * scale }]}>{attack ?? 0}</Text>
                </LinearGradient>
              </View>

              {/* Rarity Gem */}
              <View style={[styles.rarityGem, { backgroundColor: config.colors[1] }]}>
                <Text style={[styles.rarityLetter, { fontSize: 12 * scale }]}>
                  {rarity.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Health */}
              <View style={styles.statContainer}>
                <LinearGradient
                  colors={['#22c55e', '#15803d']}
                  style={[styles.statBadge, { width: 36 * scale, height: 36 * scale, borderRadius: 18 * scale }]}
                >
                  <Text style={[styles.statIcon, { fontSize: 10 * scale }]}>❤️</Text>
                  <Text style={[styles.statValue, { fontSize: 16 * scale }]}>{health ?? 0}</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Actions don't have stats bar, show rarity */}
          {category === 'action' && (
            <View style={styles.actionFooter}>
              <LinearGradient
                colors={config.borderColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionRarityBar}
              >
                <Text style={[styles.actionRarityText, { fontSize: 10 * scale }]}>
                  {rarity.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animatedBorderWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  animatedBorder: {
    position: 'absolute',
  },
  glowEffect: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
  },
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    padding: 3,
  },
  cardInner: {
    flex: 1,
    margin: 3,
    borderRadius: 9,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  manaCrystal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  manaText: {
    color: '#fff',
    fontWeight: '800',
  },
  artFrame: {
    marginHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
  },
  artBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  artPlaceholder: {
    opacity: 0.9,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  typeBar: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
    marginHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  typeText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  textBox: {
    padding: 8,
    paddingTop: 6,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  keywordBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  keywordText: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  abilityText: {
    color: '#e2e8f0',
    lineHeight: 14,
    marginBottom: 4,
  },
  noAbilityText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  flavorText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  statContainer: {
    alignItems: 'center',
  },
  statBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statIcon: {
    position: 'absolute',
    top: 2,
  },
  statValue: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 6,
  },
  rarityGem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rarityLetter: {
    color: '#fff',
    fontWeight: '800',
  },
  actionFooter: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionRarityBar: {
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionRarityText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 2,
  },
});

