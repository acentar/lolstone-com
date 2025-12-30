import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import CardPreview from './CardPreview';
import { CardDesign, CardRarity } from '../types/database';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RevealedCard {
  instanceId: string;
  design: CardDesign;
}

interface BoosterPackRevealProps {
  visible: boolean;
  cards: RevealedCard[];
  onClose: () => void;
}

const RARITY_COLORS: Record<CardRarity, string[]> = {
  common: ['#6b7280', '#4b5563'],
  uncommon: ['#22c55e', '#15803d'],
  rare: ['#3b82f6', '#1d4ed8'],
  epic: ['#a855f7', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
};

const RARITY_PARTICLES: Record<CardRarity, string> = {
  common: '✦',
  uncommon: '✧',
  rare: '💎',
  epic: '⚡',
  legendary: '🔥',
};

export default function BoosterPackReveal({
  visible,
  cards,
  onClose,
}: BoosterPackRevealProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(-1);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [showPack, setShowPack] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  
  // Animations
  const packScale = useRef(new Animated.Value(0)).current;
  const packRotate = useRef(new Animated.Value(0)).current;
  const packGlow = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardFlip = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Particle positions
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible && cards.length > 0) {
      resetState();
      animatePackEntry();
    }
  }, [visible, cards]);

  const resetState = () => {
    setCurrentCardIndex(-1);
    setRevealedCards([]);
    setShowPack(true);
    setShowSummary(false);
    packScale.setValue(0);
    packRotate.setValue(0);
    packGlow.setValue(0);
    cardScale.setValue(0);
    cardFlip.setValue(0);
    shakeAnim.setValue(0);
  };

  const animatePackEntry = () => {
    // Pack drops in with bounce
    Animated.spring(packScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Subtle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(packGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(packGlow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const openPack = () => {
    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // After shake, rotate and explode
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(packRotate, {
          toValue: 360,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(packScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowPack(false);
        setCurrentCardIndex(0);
        animateCardReveal(0);
      });
    }, 300);
  };

  const animateCardReveal = (index: number) => {
    const card = cards[index];
    if (!card) return;

    cardScale.setValue(0);
    cardFlip.setValue(0);

    // Card flies in
    Animated.spring(cardScale, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Flip animation
    Animated.timing(cardFlip, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Particles for rare+ cards
    if (['rare', 'epic', 'legendary'].includes(card.design.rarity)) {
      animateParticles(card.design.rarity);
    }
  };

  const animateParticles = (rarity: CardRarity) => {
    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      
      particle.x.setValue(0);
      particle.y.setValue(0);
      particle.opacity.setValue(1);
      particle.scale.setValue(0.5 + Math.random() * 0.5);

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * distance,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * distance,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const revealNextCard = () => {
    setRevealedCards(prev => [...prev, currentCardIndex]);
    
    if (currentCardIndex < cards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      animateCardReveal(nextIndex);
    } else {
      // All cards revealed, show summary
      setShowSummary(true);
    }
  };

  const currentCard = cards[currentCardIndex];
  const currentRarity = currentCard?.design.rarity || 'common';

  const packRotateStyle = {
    transform: [
      { scale: packScale },
      { translateX: shakeAnim },
      {
        rotate: packRotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const cardStyle = {
    transform: [
      { scale: cardScale },
      {
        rotateY: cardFlip.interpolate({
          inputRange: [0, 1],
          outputRange: ['90deg', '0deg'],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.98)']}
          style={styles.container}
        >
          {/* Background particles */}
          <View style={styles.particleContainer}>
            {['rare', 'epic', 'legendary'].includes(currentRarity) &&
              particles.map((particle, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.particle,
                    {
                      opacity: particle.opacity,
                      transform: [
                        { translateX: particle.x },
                        { translateY: particle.y },
                        { scale: particle.scale },
                      ],
                    },
                  ]}
                >
                  {RARITY_PARTICLES[currentRarity]}
                </Animated.Text>
              ))}
          </View>

          {/* Pack to open */}
          {showPack && (
            <Pressable onPress={openPack}>
              <Animated.View style={[styles.packContainer, packRotateStyle]}>
                <Animated.View
                  style={[
                    styles.packGlow,
                    {
                      opacity: packGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }),
                    },
                  ]}
                />
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8', '#1e40af']}
                  style={styles.pack}
                >
                  <Text style={styles.packEmoji}>🎁</Text>
                  <Text style={styles.packTitle}>BOOSTER PACK</Text>
                  <Text style={styles.packSubtitle}>6 Cards</Text>
                  <Text style={styles.packHint}>TAP TO OPEN</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          )}

          {/* Card reveal */}
          {!showPack && currentCard && !showSummary && (
            <Pressable style={styles.cardRevealArea} onPress={revealNextCard}>
              <Text style={styles.cardCounter}>
                Card {currentCardIndex + 1} of {cards.length}
              </Text>
              
              <Animated.View style={[styles.cardContainer, cardStyle]}>
                {/* Rarity glow */}
                <LinearGradient
                  colors={RARITY_COLORS[currentRarity]}
                  style={styles.cardGlow}
                />
                <CardPreview
                  name={currentCard.design.name}
                  manaCost={currentCard.design.mana_cost}
                  attack={currentCard.design.attack ?? undefined}
                  health={currentCard.design.health ?? undefined}
                  rarity={currentCard.design.rarity}
                  category={currentCard.design.category}
                  abilityText={currentCard.design.ability_text ?? undefined}
                  flavorText={currentCard.design.flavor_text ?? undefined}
                  imageUrl={currentCard.design.image_url ?? undefined}
                  cardType={currentCard.design.card_type}
                  scale={1}
                />
              </Animated.View>

              <View style={styles.rarityBadge}>
                <LinearGradient
                  colors={RARITY_COLORS[currentRarity]}
                  style={styles.rarityGradient}
                >
                  <Text style={styles.rarityText}>
                    {currentRarity.toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>

              <Text style={styles.tapHint}>
                {currentCardIndex < cards.length - 1 ? 'TAP FOR NEXT CARD' : 'TAP TO SEE ALL'}
              </Text>
            </Pressable>
          )}

          {/* Summary */}
          {showSummary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>🎉 Pack Opened!</Text>
              <Text style={styles.summarySubtitle}>You received {cards.length} cards</Text>
              
              <View style={styles.summaryGrid}>
                {cards.map((card, index) => (
                  <View key={card.instanceId} style={styles.summaryCard}>
                    <CardPreview
                      name={card.design.name}
                      manaCost={card.design.mana_cost}
                      attack={card.design.attack ?? undefined}
                      health={card.design.health ?? undefined}
                      rarity={card.design.rarity}
                      category={card.design.category}
                      imageUrl={card.design.image_url ?? undefined}
                      cardType={card.design.card_type}
                      scale={0.45}
                    />
                  </View>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={onClose}
                style={styles.doneButton}
                buttonColor="#22c55e"
              >
                Awesome! 🎮
              </Button>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },

  // Pack styles
  packContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  packGlow: {
    position: 'absolute',
    width: 250,
    height: 350,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  pack: {
    width: 200,
    height: 300,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  packEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  packTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  packSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  packHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 24,
    letterSpacing: 2,
  },

  // Card reveal styles
  cardRevealArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  cardCounter: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
    letterSpacing: 1,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGlow: {
    position: 'absolute',
    width: 280,
    height: 400,
    borderRadius: 20,
    opacity: 0.5,
  },
  rarityBadge: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 20,
  },
  rarityGradient: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  rarityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 2,
  },

  // Summary styles
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  summaryTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  summarySubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  summaryCard: {
    margin: 4,
  },
  doneButton: {
    marginBottom: 40,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
});

