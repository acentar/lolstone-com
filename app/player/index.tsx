import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/constants/theme';

export default function PlayerHomeScreen() {
  const { player } = useAuthContext();
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.playerName}>{player?.name || 'Player'}</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>💰</Text>
            <Text style={styles.balanceValue}>{player?.ducats?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Quick Play Button */}
        <Pressable
          style={styles.playButton}
          onPress={() => router.push('/player/play')}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playGradient}
          >
            <Text style={styles.playEmoji}>⚔️</Text>
            <View>
              <Text style={styles.playText}>FIND A MATCH</Text>
              <Text style={styles.playSubtext}>Battle other players</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Games Won</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Cards Owned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Decks Built</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/player/collection')}
          >
            <Text style={styles.actionIcon}>🃏</Text>
            <Text style={styles.actionText}>View Collection</Text>
          </Pressable>
          
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/player/decks')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Build Deck</Text>
          </Pressable>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyEmoji}>🎮</Text>
          <Text style={styles.emptyText}>No recent games</Text>
          <Text style={styles.emptySubtext}>Start playing to see your history!</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  greeting: {},
  welcomeText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 16,
  },
  balanceValue: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
  },
  playButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  playEmoji: {
    fontSize: 32,
  },
  playText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    gap: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyActivity: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: 100,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});
