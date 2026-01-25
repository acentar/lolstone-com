import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text, Button, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Profile Hero Section */}
          <Animated.View entering={FadeIn.duration(400)}>
            <LinearGradient
              colors={[colors.primary + '20', colors.secondary + '10', colors.background]}
              style={styles.profileHero}
            >
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                {player?.avatar_url ? (
                  <Avatar.Image size={120} source={{ uri: player.avatar_url }} />
                ) : (
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarLetter}>
                      {player?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>✓</Text>
                </View>
              </View>
              <Text style={styles.playerName}>{player?.name || 'Player'}</Text>
              <Text style={styles.username}>@{player?.username || 'player'}</Text>
            </View>
          </LinearGradient>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={[colors.primary + '15', colors.primary + '05']}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceContent}>
                <View>
                  <Text style={styles.balanceLabel}>Ducats Balance</Text>
                  <Text style={styles.balanceSubLabel}>Available currency</Text>
                </View>
                <Text style={styles.balanceValue}>
                  {player?.ducats?.toLocaleString() || 0}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statIcon}>🏆</Text>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Games Won</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[colors.secondary + '20', colors.secondary + '10']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statIcon}>💔</Text>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Games Lost</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[colors.primary + '15', colors.secondary + '15']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={styles.statValue}>0%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[colors.secondary + '15', colors.primary + '15']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statIcon}>🃏</Text>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Cards Owned</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <Pressable style={styles.actionCard} onPress={() => router.push('/player/collection')}>
                <LinearGradient
                  colors={[colors.surface, colors.background]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🃏</Text>
                  <Text style={styles.actionTitle}>Collection</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => router.push('/player/decks')}>
                <LinearGradient
                  colors={[colors.surface, colors.background]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>📚</Text>
                  <Text style={styles.actionTitle}>Decks</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => router.push('/player/shop')}>
                <LinearGradient
                  colors={[colors.surface, colors.background]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🛒</Text>
                  <Text style={styles.actionTitle}>Shop</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => router.push('/player')}>
                <LinearGradient
                  colors={[colors.surface, colors.background]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🎮</Text>
                  <Text style={styles.actionTitle}>Play</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <Pressable style={styles.settingItem}>
              <LinearGradient
                colors={[colors.surface, colors.background]}
                style={styles.settingGradient}
              >
                <Text style={styles.settingIcon}>✏️</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingSubtitle}>Update your name and avatar</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <LinearGradient
                colors={[colors.surface, colors.background]}
                style={styles.settingGradient}
              >
                <Text style={styles.settingIcon}>🔔</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Manage game alerts</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <LinearGradient
                colors={[colors.surface, colors.background]}
                style={styles.settingGradient}
              >
                <Text style={styles.settingIcon}>🎮</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Game Settings</Text>
                  <Text style={styles.settingSubtitle}>Customize your experience</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <LinearGradient
                colors={[colors.surface, colors.background]}
                style={styles.settingGradient}
              >
                <Text style={styles.settingIcon}>❓</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Help & Support</Text>
                  <Text style={styles.settingSubtitle}>Get assistance and FAQ</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Sign Out Button */}
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          {/* App Version */}
          <Text style={styles.versionText}>Lolstone v1.1.3</Text>
          <Text style={styles.versionDate}>Last updated today</Text>
        </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 82,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentWrapper: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  logoButton: {
    paddingVertical: 8,
  },
  headerLogoContainer: {
    alignItems: 'center',
    gap: 0,
  },
  headerLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerLogoTopText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#00f5d4',
    lineHeight: 20,
  },
  headerFunnyOContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    marginHorizontal: 2,
  },
  headerFunnyO: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerFunnyOInner: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerFunnyOLeftEye: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00f5d4',
  },
  headerFunnyORightEye: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00f5d4',
  },
  headerFunnyOMouth: {
    position: 'absolute',
    bottom: 3,
    width: 10,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  headerLogoBottomText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#ffffff',
    lineHeight: 16,
    marginTop: -6,
    transform: [{ rotate: '-5deg' }],
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00f5d4',
    fontWeight: '600',
  },
  profileHero: {
    borderRadius: 20,
    padding: spacing.xl * 2,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarLetter: {
    color: colors.background,
    fontSize: 48,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadgeText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  playerName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  balanceCard: {
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceGradient: {
    padding: spacing.xl,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  balanceSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 24,
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
  actionsSection: {
    marginBottom: spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingItem: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  versionDate: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
