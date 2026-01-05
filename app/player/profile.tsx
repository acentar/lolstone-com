import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text, Button, Avatar, Divider, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const isDesktop = width >= 900;

export default function ProfileScreen() {
  const { player, signOut } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

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
        <LinearGradient
          colors={[colors.primary + '10', colors.primary + '05']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>💰 Ducats Balance</Text>
              <Text style={styles.balanceSubLabel}>Available currency</Text>
            </View>
            <Text style={styles.balanceValue}>
              {player?.ducats?.toLocaleString() || 0}
            </Text>
          </View>
        </LinearGradient>

        <Divider style={styles.divider} />

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>📊 Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={[colors.primary + '15', colors.primary + '05']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Games Won</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient
              colors={[colors.secondary + '15', colors.secondary + '05']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Games Lost</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient
              colors={[colors.primary + '10', colors.secondary + '10']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient
              colors={[colors.secondary + '10', colors.primary + '10']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Cards Owned</Text>
            </LinearGradient>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Settings */}
        <Text style={styles.sectionTitle}>⚙️ Account Settings</Text>

        <Pressable style={styles.menuItem}>
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={styles.menuItemGradient}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Text style={styles.menuSubText}>Update your name and avatar</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.menuItem}>
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={styles.menuItemGradient}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuSubText}>Manage game alerts</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.menuItem}>
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={styles.menuItemGradient}
          >
            <Text style={styles.menuIcon}>🎮</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Game Settings</Text>
              <Text style={styles.menuSubText}>Customize your experience</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.menuItem}>
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={styles.menuItemGradient}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Help & Support</Text>
              <Text style={styles.menuSubText}>Get assistance and FAQ</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
          </LinearGradient>
        </Pressable>

        <Divider style={styles.divider} />

        {/* Logout */}
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.logoutButton}
          buttonColor="#ef4444"
          textColor="#ffffff"
        >
          Sign Out
        </Button>

        {/* App Info */}
        <Text style={styles.versionText}>Lolstone v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: isDesktop ? 60 : 50,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: isDesktop ? 120 : 100,
    height: isDesktop ? 120 : 100,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarLetter: {
    color: colors.background,
    fontSize: isDesktop ? 24 : 20,
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
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: isDesktop ? 120 : 100,
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  statValue: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Menu Items
  menuItem: {
    marginBottom: spacing.sm,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Enhanced Logout Button
  logoutButton: {
    marginTop: spacing.lg,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
});

