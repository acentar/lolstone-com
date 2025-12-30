import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';

// Custom tab bar icon component
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function GMPLayout() {
  const { gameMaster, signOut } = useAuthContext();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>🃏</Text>
          <View>
            <Text style={styles.headerTitle}>GAME MASTER PANEL</Text>
            <Text style={styles.headerSubtitle}>Welcome, {gameMaster?.name || 'Master'}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📊" label="Dashboard" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="cards"
          options={{
            title: 'Card Designer',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🎨" label="Cards" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="mint"
          options={{
            title: 'Mint',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="⚡" label="Mint" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="players"
          options={{
            title: 'Players',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="👥" label="Players" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="economy"
          options={{
            title: 'Economy',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💰" label="Economy" focused={focused} />
            ),
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLogo: {
    fontSize: 32,
  },
  headerTitle: {
    ...typography.label,
    color: colors.primary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tabBar: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingTop: spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabItemFocused: {
    backgroundColor: colors.primaryGlow,
  },
  tabEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.textMuted,
  },
  tabLabelFocused: {
    color: colors.primary,
  },
});

