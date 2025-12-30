import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
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
  accentColor: string;
  gemColors: string[];
  animationSpeed: number;
}> = {
  common: {
    colors: ['#4a4a4a', '#6b6b6b', '#4a4a4a'],
    glowColor: 'rgba(107, 107, 107, 0.3)',
    borderColors: ['#5a5a5a', '#8a8a8a', '#5a5a5a'],
    accentColor: '#6b7280',
    gemColors: ['#6b7280', '#9ca3af'],
    animationSpeed: 0,
  },
  uncommon: {
    colors: ['#059669', '#10b981', '#059669'],
    glowColor: 'rgba(16, 185, 129, 0.4)',
    borderColors: ['#047857', '#34d399', '#047857'],
    accentColor: '#10b981',
    gemColors: ['#10b981', '#6ee7b7'],
    animationSpeed: 4000,
  },
  rare: {
    colors: ['#1d4ed8', '#3b82f6', '#1d4ed8'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    borderColors: ['#1e40af', '#60a5fa', '#1e40af'],
    accentColor: '#3b82f6',
    gemColors: ['#3b82f6', '#93c5fd'],
    animationSpeed: 3000,
  },
  epic: {
    colors: ['#7c3aed', '#a855f7', '#7c3aed'],
    glowColor: 'rgba(168, 85, 247, 0.5)',
    borderColors: ['#6d28d9', '#c084fc', '#6d28d9'],
    accentColor: '#a855f7',
    gemColors: ['#a855f7', '#d8b4fe'],
    animationSpeed: 2500,
  },
  legendary: {
    colors: ['#b45309', '#f59e0b', '#dc2626', '#f59e0b', '#b45309'],
    glowColor: 'rgba(245, 158, 11, 0.6)',
    borderColors: ['#d97706', '#fbbf24', '#ef4444', '#fbbf24', '#d97706'],
    accentColor: '#f59e0b',
    gemColors: ['#f59e0b', '#fcd34d', '#ef4444'],
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
}: CardPreviewProps) {
  const config = RARITY_CONFIGS[rarity];
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(0);
  const gemGlow = useSharedValue(0.5);

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
            withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      }

      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      gemGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
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
    opacity: shimmerPosition.value * 0.25,
    transform: [{ translateX: (shimmerPosition.value * 200) - 100 }],
  }));

  const animatedGemStyle = useAnimatedStyle(() => ({
    opacity: gemGlow.value,
  }));

  // Card dimensions - 5:7 aspect ratio for card, 4:3 for image
  const cardWidth = 220 * scale;
  const cardHeight = 308 * scale;
  const imageHeight = (cardWidth - 16 * scale) * 0.75; // 4:3 ratio

  return (
    <Animated.View style={[styles.cardWrapper, animatedCardStyle, { width: cardWidth + 10, height: cardHeight + 10 }]}>
      {/* Animated Border Layer */}
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

      {/* Glow Effect */}
      <View style={[styles.glowEffect, { 
        shadowColor: config.accentColor,
        shadowOpacity: rarity === 'legendary' ? 0.9 : rarity === 'epic' ? 0.7 : 0.5,
        shadowRadius: rarity === 'legendary' ? 25 : 15,
      }]} />

      {/* Card Container */}
      <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
        {/* Base Border */}
        <LinearGradient
          colors={config.colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        />

        {/* Card Inner Frame */}
        <View style={styles.cardInner}>
          {/* Top Frame with ornate design */}
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1a']}
            style={styles.cardFrame}
          >
            {/* Mana Cost Crystal - Top Left */}
            <View style={[styles.manaCostContainer, { transform: [{ scale }] }]}>
              <LinearGradient
                colors={['#1e40af', '#3b82f6', '#60a5fa']}
                style={styles.manaCrystalOuter}
              >
                <View style={styles.manaCrystalInner}>
                  <LinearGradient
                    colors={['#60a5fa', '#3b82f6', '#1e40af']}
                    style={styles.manaCrystalCore}
                  >
                    <Text style={[styles.manaText, { fontSize: 18 * scale }]}>{manaCost}</Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
              {/* Crystal shine */}
              <View style={styles.crystalShine} />
            </View>

            {/* Card Name Banner */}
            <View style={styles.nameBanner}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']}
                style={styles.nameBannerGradient}
              >
                <Text style={[styles.cardName, { fontSize: 13 * scale }]} numberOfLines={1}>
                  {name || 'Card Name'}
                </Text>
              </LinearGradient>
              {/* Banner decorations */}
              <View style={[styles.bannerDecorLeft, { backgroundColor: config.accentColor }]} />
              <View style={[styles.bannerDecorRight, { backgroundColor: config.accentColor }]} />
            </View>

            {/* Art Frame - 4:3 Ratio */}
            <View style={[styles.artFrame, { height: imageHeight, marginHorizontal: 8 * scale }]}>
              <LinearGradient
                colors={config.borderColors.slice(0, 3) as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.artBorder}
              >
                <View style={styles.artInner}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#1e293b', '#334155', '#1e293b']}
                      style={styles.artPlaceholderBg}
                    >
                      <Text style={[styles.artPlaceholder, { fontSize: 40 * scale }]}>
                        {TYPE_ICONS[cardType] || '🃏'}
                      </Text>
                    </LinearGradient>
                  )}
                  
                  {/* Shimmer overlay */}
                  {config.animationSpeed > 0 && (
                    <Animated.View style={[styles.shimmerOverlay, animatedShimmerStyle]}>
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  )}

                  {/* Art frame corners */}
                  <View style={[styles.artCorner, styles.artCornerTL, { borderColor: config.accentColor }]} />
                  <View style={[styles.artCorner, styles.artCornerTR, { borderColor: config.accentColor }]} />
                  <View style={[styles.artCorner, styles.artCornerBL, { borderColor: config.accentColor }]} />
                  <View style={[styles.artCorner, styles.artCornerBR, { borderColor: config.accentColor }]} />
                </View>
              </LinearGradient>
            </View>

            {/* Type Ribbon */}
            <View style={styles.typeRibbon}>
              <LinearGradient
                colors={[config.colors[0], config.colors[1], config.colors[0]] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.typeRibbonGradient}
              >
                <Text style={[styles.typeText, { fontSize: 8 * scale }]}>
                  {category === 'action' ? '✦ ACTION' : '⚔ UNIT'} • {rarity.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>

            {/* Text Box */}
            <View style={[styles.textBox, { paddingHorizontal: 10 * scale, paddingVertical: 6 * scale }]}>
              {/* Keywords */}
              {keywords.length > 0 && (
                <View style={styles.keywordsRow}>
                  {keywords.map((kw) => (
                    <View key={kw} style={[styles.keywordBadge, { borderColor: config.accentColor }]}>
                      <Text style={[styles.keywordText, { fontSize: 8 * scale, color: config.accentColor }]}>
                        {KEYWORD_INFO[kw].icon} {KEYWORD_INFO[kw].name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Ability Text */}
              <View style={styles.abilityContainer}>
                {abilityText ? (
                  <Text style={[styles.abilityText, { fontSize: 9 * scale }]} numberOfLines={3}>
                    {abilityText}
                  </Text>
                ) : (
                  <Text style={[styles.noAbilityText, { fontSize: 9 * scale }]}>
                    —
                  </Text>
                )}
              </View>

              {/* Flavor Text */}
              {flavorText && (
                <View style={styles.flavorContainer}>
                  <View style={[styles.flavorDivider, { backgroundColor: config.accentColor }]} />
                  <Text style={[styles.flavorText, { fontSize: 8 * scale }]} numberOfLines={2}>
                    "{flavorText}"
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Section - Stats for Units, Rarity gem for Actions */}
            <View style={styles.bottomSection}>
              {category === 'unit' ? (
                <>
                  {/* Rarity gem centered */}
                  <View style={styles.centerGemContainer}>
                    <Animated.View style={[styles.gemGlowAnim, animatedGemStyle]}>
                      <LinearGradient
                        colors={config.gemColors as any}
                        style={styles.rarityGemLarge}
                      >
                        <Text style={[styles.rarityLetter, { fontSize: 11 * scale }]}>
                          {rarity.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  </View>

                  {/* Stats grouped on the right */}
                  <View style={[styles.statsContainer, { right: 8 * scale, bottom: 8 * scale }]}>
                    {/* Attack */}
                    <View style={styles.statWrapper}>
                      <LinearGradient
                        colors={['#dc2626', '#ef4444', '#f87171']}
                        style={[styles.statBadge, { width: 32 * scale, height: 32 * scale }]}
                      >
                        <Text style={[styles.statValue, { fontSize: 15 * scale }]}>{attack ?? 0}</Text>
                      </LinearGradient>
                      <Text style={[styles.statLabel, { fontSize: 7 * scale }]}>ATK</Text>
                    </View>
                    
                    {/* Stat divider */}
                    <View style={[styles.statDivider, { backgroundColor: config.accentColor }]} />
                    
                    {/* Health */}
                    <View style={styles.statWrapper}>
                      <LinearGradient
                        colors={['#16a34a', '#22c55e', '#4ade80']}
                        style={[styles.statBadge, { width: 32 * scale, height: 32 * scale }]}
                      >
                        <Text style={[styles.statValue, { fontSize: 15 * scale }]}>{health ?? 0}</Text>
                      </LinearGradient>
                      <Text style={[styles.statLabel, { fontSize: 7 * scale }]}>HP</Text>
                    </View>
                  </View>
                </>
              ) : (
                /* Action card - centered gem */
                <View style={styles.actionBottomSection}>
                  <Animated.View style={[styles.gemGlowAnim, animatedGemStyle]}>
                    <LinearGradient
                      colors={config.gemColors as any}
                      style={styles.actionGem}
                    >
                      <Text style={[styles.actionGemText, { fontSize: 10 * scale }]}>
                        {category === 'action' ? '✦' : ''}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                  <Text style={[styles.actionRarityText, { fontSize: 9 * scale, color: config.accentColor }]}>
                    {rarity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
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
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 14,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  cardContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  cardInner: {
    flex: 1,
    margin: 3,
    borderRadius: 11,
    overflow: 'hidden',
  },
  cardFrame: {
    flex: 1,
    paddingTop: 4,
  },

  // Mana Cost Crystal
  manaCostContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    zIndex: 20,
  },
  manaCrystalOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  manaCrystalInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaCrystalCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaText: {
    color: '#fff',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  crystalShine: {
    position: 'absolute',
    top: 4,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Name Banner
  nameBanner: {
    marginTop: 8,
    marginHorizontal: 30,
    position: 'relative',
  },
  nameBannerGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cardName: {
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerDecorLeft: {
    position: 'absolute',
    left: -4,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerDecorRight: {
    position: 'absolute',
    right: -4,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Art Frame - 4:3 ratio
  artFrame: {
    marginTop: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  artBorder: {
    flex: 1,
    padding: 2,
    borderRadius: 6,
  },
  artInner: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
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
    opacity: 0.8,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  artCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderWidth: 2,
  },
  artCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  artCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  artCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  artCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  // Type Ribbon
  typeRibbon: {
    marginTop: 4,
    marginHorizontal: 8,
  },
  typeRibbonGradient: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    alignItems: 'center',
  },
  typeText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Text Box
  textBox: {
    flex: 1,
    minHeight: 50,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  keywordBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  keywordText: {
    fontWeight: '600',
  },
  abilityContainer: {
    flex: 1,
  },
  abilityText: {
    color: '#e2e8f0',
    lineHeight: 13,
  },
  noAbilityText: {
    color: '#475569',
    textAlign: 'center',
  },
  flavorContainer: {
    marginTop: 4,
  },
  flavorDivider: {
    height: 1,
    marginBottom: 4,
    opacity: 0.3,
  },
  flavorText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Bottom Section
  bottomSection: {
    height: 50,
    position: 'relative',
  },
  centerGemContainer: {
    position: 'absolute',
    left: '50%',
    bottom: 8,
    marginLeft: -14,
  },
  gemGlowAnim: {},
  rarityGemLarge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  rarityLetter: {
    color: '#fff',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Stats Container (bottom right)
  statsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statWrapper: {
    alignItems: 'center',
  },
  statBadge: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  statValue: {
    color: '#fff',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 2,
    height: 20,
    borderRadius: 1,
    opacity: 0.5,
  },

  // Action card bottom
  actionBottomSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionGem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionGemText: {
    color: '#fff',
  },
  actionRarityText: {
    fontWeight: '800',
    letterSpacing: 2,
  },
});
