import { Tabs } from 'expo-router';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Text, Avatar, Menu } from 'react-native-paper';
import { colors, spacing } from '../../src/constants/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useState } from 'react';

const { width } = Dimensions.get('window');
const isDesktop = width >= 900;

export default function PlayerLayout() {
  const { player, signOut } = useAuthContext();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>🎮 Lolstone</Text>
          </View>

          <Pressable
            style={styles.userSection}
            onPress={() => setMenuVisible(true)}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{player?.name || 'Player'}</Text>
              <Text style={styles.userBalance}>
                💰 {player?.ducats?.toLocaleString() || 0} ducats
              </Text>
            </View>
            <Avatar.Text
              size={isDesktop ? 40 : 36}
              label={player?.name?.charAt(0).toUpperCase() || '?'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </Pressable>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<View />}
            contentStyle={styles.menuContent}
            style={styles.menuContainer}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Navigate to profile
              }}
              title="Profile"
              leadingIcon="account"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Navigate to settings
              }}
              title="Settings"
              leadingIcon="cog"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                signOut();
              }}
              title="Sign Out"
              leadingIcon="logout"
              titleStyle={{ color: '#ef4444' }}
            />
          </Menu>
        </View>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveBackgroundColor: colors.primary + '20',
          tabBarItemStyle: styles.tabItem,
          tabBarIconStyle: styles.tabIconContainer,
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
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.surface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: isDesktop ? 60 : 50,
  },
  logoSection: {
    flex: 1,
  },
  logoText: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: isDesktop ? 16 : 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userBalance: {
    fontSize: isDesktop ? 12 : 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  avatar: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  avatarLabel: {
    color: colors.background,
    fontSize: isDesktop ? 16 : 14,
    fontWeight: '700',
  },
  menuContainer: {
    marginTop: 40,
  },
  menuContent: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
