import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Avatar, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../src/context/AuthContext';
import { spacing } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { player, signOut } = useAuthContext();

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {player?.avatar_url ? (
              <Avatar.Image size={100} source={{ uri: player.avatar_url }} />
            ) : (
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarLetter}>
                  {player?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.playerName}>{player?.name || 'Player'}</Text>
          <Text style={styles.username}>@{player?.username}</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>💰 Ducats Balance</Text>
            <Text style={styles.balanceValue}>
              {player?.ducats?.toLocaleString() || 0}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Games Won</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Games Lost</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Cards Owned</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Settings */}
        <Text style={styles.sectionTitle}>Account</Text>
        
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuText}>Edit Profile</Text>
        </Pressable>
        
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
        </Pressable>
        
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>🎮</Text>
          <Text style={styles.menuText}>Game Settings</Text>
        </Pressable>
        
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
        </Pressable>

        <Divider style={styles.divider} />

        {/* Logout */}
        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.logoutButton}
          textColor="#ef4444"
        >
          Log Out
        </Button>

        {/* App Info */}
        <Text style={styles.versionText}>Lolstone v1.0.0</Text>
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
  content: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    color: '#3b82f6',
    fontSize: 14,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#f59e0b',
    fontSize: 24,
    fontWeight: '700',
  },
  divider: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  logoutButton: {
    borderColor: '#ef4444',
    marginTop: spacing.md,
  },
  versionText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

