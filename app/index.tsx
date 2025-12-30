import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth-router');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🃏</Text>
        <Text style={styles.title}>LOLSTONE</Text>
        <Text style={styles.subtitle}>The Ultimate Digital Card Game</Text>

        <Pressable style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
          <Text style={styles.heroTitle}>LOLSTONE</Text>
          <Text style={styles.heroSubtitle}>
            The Ultimate Digital Card Game Battle
          </Text>
          <Text style={styles.heroDescription}>
            Command powerful units, unleash devastating effects, and outwit your opponents
            in this fast-paced strategy card game. Every battle is a hilarious chaos of memes,
            magic, and mayhem!
          </Text>

          <View style={styles.heroButtons}>
            <Animated.View entering={ZoomIn.delay(600)}>
              <Pressable style={styles.primaryButton} onPress={handleGetStarted}>
                <LinearGradient
                  colors={['#8b5cf6', '#a855f7']}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    {user ? 'Continue Playing' : 'Start Your Journey'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Floating cards animation */}
        <Animated.View style={[styles.floatingCard1, useAnimatedStyle(() => ({ opacity: glowOpacity.value }))]}>
          <Text style={styles.cardEmoji}>⚔️</Text>
        </Animated.View>
        <Animated.View style={[styles.floatingCard2, useAnimatedStyle(() => ({ opacity: cardGlow.value }))]}>
          <Text style={styles.cardEmoji}>🛡️</Text>
        </Animated.View>
        <Animated.View style={[styles.floatingCard3, useAnimatedStyle(() => ({ opacity: glowOpacity.value }))]}>
          <Text style={styles.cardEmoji}>🔥</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const HowToPlaySection = () => (
    <View style={styles.section}>
      <Animated.View entering={FadeIn.delay(300)} style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>How to Play</Text>
        <Text style={styles.sectionSubtitle}>Master the chaos in 3 simple steps</Text>

        <View style={styles.stepsContainer}>
          <Animated.View entering={SlideInUp.delay(400)} style={styles.stepCard}>
            <LinearGradient colors={['#1e1e2e', '#2d2d44']} style={styles.stepGradient}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Build Your Deck</Text>
              <Text style={styles.stepDescription}>
                Choose from hundreds of hilarious cards. Mix powerful units, devastating spells,
                and tactical effects to create your perfect strategy.
              </Text>
              <Text style={styles.stepEmoji}>📚</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(600)} style={styles.stepCard}>
            <LinearGradient colors={['#1e1e2e', '#2d2d44']} style={styles.stepGradient}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Battle Opponents</Text>
              <Text style={styles.stepDescription}>
                Face off against players worldwide. Play cards strategically, attack enemy units,
                and protect your profile to reduce their health to zero.
              </Text>
              <Text style={styles.stepEmoji}>⚔️</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(800)} style={styles.stepCard}>
            <LinearGradient colors={['#1e1e2e', '#2d2d44']} style={styles.stepGradient}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Earn & Upgrade</Text>
              <Text style={styles.stepDescription}>
                Win battles to earn ducats, buy booster packs, and unlock rare cards.
                Climb the ranks and become a Lolstone legend!
              </Text>
              <Text style={styles.stepEmoji}>🏆</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );

  const FeaturesSection = () => (
    <View style={[styles.section, styles.featuresSection]}>
      <LinearGradient colors={['#0f0f1a', '#1a0f2a', '#0f0f1a']} style={styles.featuresGradient}>
        <Animated.View entering={FadeIn.delay(500)} style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Game Features</Text>

          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌟</Text>
              <Text style={styles.featureTitle}>Dynamic Card Effects</Text>
              <Text style={styles.featureDesc}>Units that stun, heal, boost stats, and summon tokens</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💎</Text>
              <Text style={styles.featureTitle}>Crypto Payments</Text>
              <Text style={styles.featureDesc}>Buy ducats with USDC or SOL via Phantom wallet</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎭</Text>
              <Text style={styles.featureTitle}>Humor & Memes</Text>
              <Text style={styles.featureDesc}>Cards with hilarious names and effects that make you laugh</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureTitle}>Cross-Platform</Text>
              <Text style={styles.featureDesc}>Play on web, iOS, and Android with seamless sync</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureTitle}>Tournaments</Text>
              <Text style={styles.featureDesc}>Compete in ranked matches and special events</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureTitle}>Custom Cards</Text>
              <Text style={styles.featureDesc}>Game Masters can create unique cards for special events</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const CTASection = () => (
    <View style={styles.ctaSection}>
      <LinearGradient colors={['#8b5cf6', '#a855f7', '#8b5cf6']} style={styles.ctaGradient}>
        <Animated.View entering={FadeIn.delay(700)} style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Ready to Join the Chaos?</Text>
          <Text style={styles.ctaSubtitle}>
            Create your account and start your journey into the hilarious world of Lolstone!
          </Text>

          <Animated.View entering={ZoomIn.delay(900)}>
            <Pressable style={styles.ctaButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>
                  {user ? 'Continue Your Adventure' : 'Create Free Account'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeroSection />
      <HowToPlaySection />
      <FeaturesSection />
      <CTASection />

      {/* Auth Modal - Simple redirect for now */}
      {showAuthModal && (
        <View style={styles.authModal}>
          <Pressable style={styles.authOverlay} onPress={() => setShowAuthModal(false)}>
            <View style={styles.authContent}>
              <Text style={styles.authTitle}>Choose Your Path</Text>
              <Pressable
                style={styles.authButton}
                onPress={() => {
                  setShowAuthModal(false);
                  router.push('/auth/player');
                }}
              >
                <Text style={styles.authButtonText}>Create Player Account</Text>
              </Pressable>
              <Pressable
                style={styles.authButtonSecondary}
                onPress={() => {
                  setShowAuthModal(false);
                  router.push('/auth/player');
                }}
              >
                <Text style={styles.authButtonSecondaryText}>Sign In</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero Section
  heroSection: {
    height: '100vh',
    minHeight: 600,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
    zIndex: 1,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h1,
    color: '#fff',
    fontSize: 72,
    letterSpacing: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: '#8b5cf6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  heroSubtitle: {
    ...typography.h2,
    color: '#a78bfa',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  heroDescription: {
    ...typography.body,
    color: '#9ca3af',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
    maxWidth: 500,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Floating cards
  floatingCard1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  floatingCard2: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(161, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(161, 85, 247, 0.5)',
  },
  floatingCard3: {
    position: 'absolute',
    bottom: '25%',
    left: '20%',
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  cardEmoji: {
    fontSize: 24,
  },

  // Sections
  section: {
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  sectionContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    ...typography.h1,
    color: '#fff',
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.h2,
    color: '#9ca3af',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // How to Play Steps
  stepsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stepCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 350,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stepGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 200,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    color: '#9ca3af',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stepEmoji: {
    fontSize: 32,
  },

  // Features Section
  featuresSection: {
    paddingVertical: 0,
  },
  featuresGradient: {
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  featureItem: {
    flex: 1,
    minWidth: 250,
    maxWidth: 300,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  featureIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDesc: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // CTA Section
  ctaSection: {
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  ctaGradient: {
    borderRadius: 24,
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  ctaContent: {
    maxWidth: 600,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  ctaSubtitle: {
    color: '#e5e7eb',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaButtonText: {
    color: '#1e1e2e',
    fontSize: 20,
    fontWeight: '700',
  },

  // Auth Modal
  authModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  authOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  authContent: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  authTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  authButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonSecondary: {
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  authButtonSecondaryText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
});

