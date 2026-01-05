import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CardRarity, CardCategory, CardKeyword } from '../types/database';

export interface CardPreviewProps {
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
  // Collectible info
  cardId?: string;
  edition?: number;
  serialNumber?: number;
  totalMinted?: number;
  showCollectibleInfo?: boolean;
  // Interaction
  onPress?: () => void;
}

const RARITY_CONFIGS: Record<CardRarity, {
  colors: string[];
  glowColor: string;
  borderColors: string[];
  accentColor: string;
  animationSpeed: number;
}> = {
  common: {
    colors: ['#52525b', '#71717a'],
    glowColor: 'rgba(113, 113, 122, 0.2)',
    borderColors: ['#71717a', '#a1a1aa', '#71717a'],
    accentColor: '#a1a1aa',
    animationSpeed: 0,
  },
  uncommon: {
    colors: ['#059669', '#10b981'],
    glowColor: 'rgba(16, 185, 129, 0.4)',
    borderColors: ['#047857', '#34d399', '#047857'],
    accentColor: '#10b981',
    animationSpeed: 4000,
  },
  rare: {
    colors: ['#1d4ed8', '#3b82f6'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    borderColors: ['#1e40af', '#60a5fa', '#1e40af'],
    accentColor: '#3b82f6',
    animationSpeed: 3000,
  },
  epic: {
    colors: ['#7c3aed', '#a855f7'],
    glowColor: 'rgba(168, 85, 247, 0.5)',
    borderColors: ['#6d28d9', '#c084fc', '#6d28d9'],
    accentColor: '#a855f7',
    animationSpeed: 2500,
  },
  legendary: {
    colors: ['#d97706', '#f59e0b', '#ef4444'],
    glowColor: 'rgba(245, 158, 11, 0.6)',
    borderColors: ['#d97706', '#fbbf24', '#ef4444', '#fbbf24', '#d97706'],
    accentColor: '#f59e0b',
    animationSpeed: 2000,
  },
};

const TYPE_ICONS: Record<string, string> = {
  meme_minion: '😂',
  viral_spell: '⚡',
  troll_legendary: '🧌',
  reaction_trap: '🎭',
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
  cardId,
  edition,
  serialNumber,
  totalMinted,
  showCollectibleInfo = true,
  onPress,
}: CardPreviewProps) {
  console.log('🖼️ CardPreview for:', name, 'imageUrl:', imageUrl);

  const config = RARITY_CONFIGS[rarity];
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    if (config.animationSpeed > 0) {
      rotation.value = withRepeat(
        withTiming(360, { duration: config.animationSpeed, easing: Easing.linear }),
        -1,
        false
      );

      if (rarity === 'legendary') {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.015, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      }

      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [rarity, config.animationSpeed]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerPosition.value * 0.3,
    transform: [{ translateX: (shimmerPosition.value * 250) - 125 }],
  }));

  // Card dimensions
  const cardWidth = 200 * scale;
  const cardHeight = 290 * scale;
  const cardPadding = 8 * scale;
  // Art frame: 4:3 ratio, width = card width - padding on both sides
  const artWidth = cardWidth - (cardPadding * 2);
  const artHeight = artWidth * 0.75; // 4:3 ratio

  const CardContent = () => (
    <Animated.View style={[styles.cardWrapper, animatedCardStyle, { width: cardWidth + 12, height: cardHeight + 12 }]}>
      {/* Animated Border for rare+ cards */}
      {config.animationSpeed > 0 && (
        <Animated.View style={[styles.animatedBorderWrapper, animatedBorderStyle]}>
          <LinearGradient
            colors={config.borderColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.animatedBorder, { width: cardWidth * 2.5, height: cardHeight * 2.5 }]}
          />
        </Animated.View>
      )}

      {/* Glow */}
      <View style={[styles.glowEffect, { 
        shadowColor: config.accentColor,
        shadowOpacity: rarity === 'legendary' ? 0.8 : rarity === 'epic' ? 0.6 : 0.4,
        shadowRadius: rarity === 'legendary' ? 20 : 12,
      }]} />

      {/* Main Card */}
      <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
        <LinearGradient
          colors={['#1e1e28', '#121218']}
          style={styles.cardBackground}
        >
          {/* Top accent bar */}
          <LinearGradient
            colors={config.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.topAccent, { height: 3 * scale }]}
          />

          {/* Card Content with Padding */}
          <View style={[styles.cardContent, { padding: cardPadding }]}>
            
            {/* Header Row: Name | Cost */}
            <View style={[styles.headerRow, { marginBottom: 6 * scale }]}>
              {/* Card Name */}
              <Text 
                style={[styles.cardName, { fontSize: 10 * scale }]} 
                numberOfLines={1}
              >
                {name || 'Card Name'}
              </Text>

              {/* Mana Cost */}
              <View style={[styles.costContainer, { 
                width: 16 * scale,
                height: 16 * scale,
                borderRadius: 3 * scale,
              }]}>
                <Text style={[styles.costText, { fontSize: 9 * scale }]}>{manaCost}</Text>
              </View>
            </View>

            {/* Art Frame - 4:3 ratio */}
            <View style={[styles.artFrame, { 
              width: artWidth,
              height: artHeight,
              borderRadius: 4 * scale,
              marginBottom: 8 * scale,
            }]}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#282832', '#1a1a22']}
                  style={styles.artPlaceholder}
                >
                  <Text style={[styles.artIcon, { fontSize: 32 * scale }]}>
                    {TYPE_ICONS[cardType] || '🃏'}
                  </Text>
                </LinearGradient>
              )}
              
              {/* Shimmer */}
              {config.animationSpeed > 0 && (
                <Animated.View style={[styles.shimmer, animatedShimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </View>

            {/* Type Line */}
            <View style={[styles.typeLine, { marginBottom: 6 * scale }]}>
              <View style={[styles.typeLineAccent, { backgroundColor: config.accentColor }]} />
              <Text style={[styles.typeText, { fontSize: 7 * scale }]}>
                {category === 'action' ? 'ACTION' : 'UNIT'} — {rarity.toUpperCase()}
              </Text>
              <View style={[styles.typeLineAccent, { backgroundColor: config.accentColor }]} />
            </View>

            {/* Text Box */}
            <View style={[styles.textBox, { 
              padding: 8 * scale,
              borderRadius: 4 * scale,
            }]}>
              {/* Ability */}
              {abilityText ? (
                <Text style={[styles.abilityText, { fontSize: 8 * scale }]} numberOfLines={4}>
                  {abilityText}
                </Text>
              ) : (
                <Text style={[styles.noAbility, { fontSize: 8 * scale }]}>—</Text>
              )}

              {/* Flavor */}
              {flavorText && (
                <Text style={[styles.flavorText, { fontSize: 7 * scale, marginTop: 4 * scale }]} numberOfLines={2}>
                  "{flavorText}"
                </Text>
              )}
            </View>

            {/* Bottom Row: Printed Info + Stats */}
            <View style={[styles.bottomRow, { marginTop: 6 * scale }]}>
              {/* Printed Info (left) */}
              {showCollectibleInfo ? (
                <View style={styles.printedInfo}>
                  <Text style={[styles.printedText, { fontSize: 5 * scale }]}>
                    {cardId || '████-████'}
                  </Text>
                  <Text style={[styles.printedText, { fontSize: 5 * scale }]}>
                    {edition ? `${edition}${getOrdinalSuffix(edition)} ED` : '1ST ED'} • {serialNumber ?? '???'}/{totalMinted ?? '???'}
                  </Text>
                </View>
              ) : (
                <View style={styles.printedInfo} />
              )}

              {/* Stats - Bottom Right for Units */}
              {category === 'unit' && (
                <View style={[styles.statsContainer, { 
                  borderRadius: 3 * scale,
                  paddingHorizontal: 6 * scale,
                  paddingVertical: 2 * scale,
                }]}>
                  <Text style={[styles.attackText, { fontSize: 10 * scale }]}>{attack ?? 0}</Text>
                  <Text style={[styles.statsDivider, { fontSize: 8 * scale }]}>/</Text>
                  <Text style={[styles.healthText, { fontSize: 10 * scale }]}>{health ?? 0}</Text>
                </View>
              )}
            </View>

          </View>

          {/* Bottom rarity accent */}
          <LinearGradient
            colors={config.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bottomAccent, { height: 3 * scale }]}
          />
        </LinearGradient>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <CardContent />
      </Pressable>
    );
  }

  return <CardContent />;
}

function getOrdinalSuffix(n: number): string {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
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
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
  },
  cardContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardBackground: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
  },
  topAccent: {
    width: '100%',
  },
  bottomAccent: {
    width: '100%',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    flex: 1,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  costContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  costText: {
    color: '#93c5fd',
    fontWeight: '700',
  },

  // Art Frame
  artFrame: {
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artIcon: {
    opacity: 0.4,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Type Line
  typeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLineAccent: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  typeText: {
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginHorizontal: 8,
  },

  // Text Box
  textBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  abilityText: {
    color: '#cbd5e1',
    lineHeight: 12,
  },
  noAbility: {
    color: '#334155',
    textAlign: 'center',
  },
  flavorText: {
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  printedInfo: {
    flex: 1,
  },
  printedText: {
    color: '#3f3f4a',
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  attackText: {
    color: '#f87171',
    fontWeight: '900',
  },
  statsDivider: {
    color: '#475569',
    fontWeight: '400',
    marginHorizontal: 2,
  },
  healthText: {
    color: '#4ade80',
    fontWeight: '900',
  },
});
