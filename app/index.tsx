import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  const handlePlayerPortal = () => {
    router.push('/auth/player');
  };

  const handleGMLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.heroSection}
      >
        {/* Background Elements */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />
        <View style={styles.gridOverlay} />

        <View style={styles.heroContent}>
          <Text style={styles.emoji}>🃏</Text>
          <Text style={styles.title}>LOLSTONE</Text>
          <Text style={styles.tagline}>The Ultimate Digital Card Game</Text>
          <Text style={styles.description}>
            Collect powerful cards, build unstoppable decks, and battle players
            in chaotic, meme-filled matches. Where strategy meets absurdity.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <Pressable style={styles.primaryButton} onPress={handlePlayerPortal}>
              <Text style={styles.primaryButtonText}>🎮 Play Now</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleGMLogin}>
              <Text style={styles.secondaryButtonText}>⚡ Game Master</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Play LOLSTONE?</Text>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🃏</Text>
            <Text style={styles.featureTitle}>Collect Cards</Text>
            <Text style={styles.featureDesc}>
              Build your collection with unique, meme-inspired cards
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚔️</Text>
            <Text style={styles.featureTitle}>Battle Players</Text>
            <Text style={styles.featureDesc}>
              Test your strategy against players worldwide
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Earn Rewards</Text>
            <Text style={styles.featureDesc}>
              Win matches and complete quests for ducats
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={styles.featureTitle}>Pure Chaos</Text>
            <Text style={styles.featureDesc}>
              Unpredictable effects and hilarious moments
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Create Account</Text>
            <Text style={styles.stepDesc}>Sign up and get 100 free ducats</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Build Your Deck</Text>
            <Text style={styles.stepDesc}>Collect cards and craft strategies</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Battle & Win</Text>
            <Text style={styles.stepDesc}>Compete in matches and climb rankings</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with chaos and memes 🔥
        </Text>
        <Text style={styles.footerSubtext}>
          LOLSTONE - Where strategy meets absurdity
        </Text>
      </View>
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
    minHeight: height * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  glowOrb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primary,
    top: -200,
    right: -150,
    opacity: 0.06,
  },
  glowOrb2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.secondary,
    bottom: -150,
    left: -100,
    opacity: 0.06,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    // Grid pattern would be an image in production
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  emoji: {
    fontSize: 100,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: Math.min(width * 0.12, 60),
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 6,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: Math.min(width * 0.06, 24),
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: Math.min(width * 0.04, 16),
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  featureCard: {
    width: Math.min((width - spacing.xl * 2 - spacing.lg * 2) / 2, 250),
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // How It Works
  howItWorksSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
