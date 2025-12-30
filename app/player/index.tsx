import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';

export default function PlayerHomeScreen() {
  const { player, signOut } = useAuthContext();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎮</Text>
        <Text style={styles.title}>Welcome, {player?.name || 'Player'}!</Text>
        <Text style={styles.subtitle}>@{player?.username}</Text>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceValue}>💰 {player?.ducats?.toLocaleString() || 0}</Text>
          <Text style={styles.balanceUnit}>ducats</Text>
        </View>

        <Text style={styles.comingSoon}>
          Player features coming soon!{'\n'}
          Collection, Decks, Marketplace, Battles...
        </Text>

        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Background decoration */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
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
    padding: spacing.xl,
    zIndex: 1,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginTop: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.legendary,
    minWidth: 200,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  balanceValue: {
    ...typography.h1,
    color: colors.legendary,
    marginTop: spacing.sm,
  },
  balanceUnit: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  comingSoon: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 24,
  },
  logoutButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  glowOrb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.secondaryGlow,
    top: -100,
    right: -100,
    opacity: 0.2,
  },
  glowOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryGlow,
    bottom: -50,
    left: -50,
    opacity: 0.2,
  },
});

