import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { colors, spacing } from '../../src/constants/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import HeaderNavigation from '../../src/components/HeaderNavigation';
import { useState, useEffect } from 'react';

const { width } = Dimensions.get('window');
const isDesktop = width >= 900;

export default function PlayerLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { player } = useAuthContext();
  const [onlinePlayers, setOnlinePlayers] = useState(24);
  const [activeGames, setActiveGames] = useState(6);

  // Check if we're on a game route
  const isGameRoute = pathname?.includes('/player/game/');

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers(prev => {
        const change = Math.floor(Math.random() * 11) - 5;
        return Math.max(9, Math.min(36, prev + change));
      });
      setActiveGames(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(3, Math.min(9, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Header with Navigation - Same as Homepage - Hidden on game routes */}
      {!isGameRoute && (
      <View style={styles.topHeader}>
        <View style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <HeaderNavigation />
            
            <View style={styles.statsRow}>
              <View style={styles.statTag}>
                <Text style={styles.statTagText}>
                  <Text style={styles.statTagNumber}>{onlinePlayers.toLocaleString()}</Text>
                  <Text> Online</Text>
                </Text>
              </View>
              <View style={styles.statTag}>
                <Text style={styles.statTagText}>
                  <Text style={[styles.statTagNumber, { color: '#10b981' }]}>
                    {activeGames.toLocaleString()}
                  </Text>
                  <Text> Active Games</Text>
                </Text>
              </View>
            </View>

            {player ? (
              <Pressable style={styles.avatarButton} onPress={() => router.push('/player/profile')}>
                {player.avatar_url ? (
                  <Avatar.Image size={36} source={{ uri: player.avatar_url }} />
                ) : (
                  <Avatar.Text
                    size={36}
                    label={player.name?.charAt(0).toUpperCase() || '?'}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.playButton} onPress={() => router.push('/auth/player')}>
                <Text style={styles.playButtonText}>Play Now</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={[styles.tabIcon, { color }]}>⚔️</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={[styles.tabIcon, { color }]}>🛒</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={[styles.tabIcon, { color }]}>🃏</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={[styles.tabIcon, { color }]}>📚</Text>
            </View>
          ),
        }}
      />
      {/* Play is now integrated into Home */}
      <Tabs.Screen
        name="play"
        options={{
          href: null, // Hidden - integrated into home
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={[styles.tabIcon, { color }]}>👤</Text>
            </View>
          ),
        }}
      />
      {/* Hidden routes - Game screen with hidden tab bar */}
      <Tabs.Screen
        name="game/[id]"
        options={{
          href: null, // Hide from tab bar
          tabBarStyle: { display: 'none' }, // Hide entire tab bar during game
        }}
      />
      <Tabs.Screen
        name="deck/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  },
  headerBlur: {
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(20px)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: 'auto',
    marginRight: spacing.md,
  },
  statTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statTagText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statTagNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  playButtonText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarButton: {
    padding: 2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: isDesktop ? 70 : 65,
    paddingBottom: isDesktop ? 12 : 8,
    paddingTop: isDesktop ? 12 : 8,
    shadowColor: colors.surface,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
  },
  tabLabel: {
    fontSize: isDesktop ? 12 : 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.xxs,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: isDesktop ? 44 : 40,
    height: isDesktop ? 44 : 40,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: colors.primary + '20',
  },
  tabIcon: {
    fontSize: isDesktop ? 24 : 20,
    textAlign: 'center',
  },
});
