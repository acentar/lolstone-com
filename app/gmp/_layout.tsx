import { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { PaperProvider, Text, Avatar, Divider, IconButton } from 'react-native-paper';
import { useAuthContext } from '../../src/context/AuthContext';
import { adminColors, adminSpacing, adminRadius, paperTheme } from '../../src/constants/adminTheme';

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  onPress: () => void;
  collapsed?: boolean;
}

function NavItem({ icon, label, href, isActive, onPress, collapsed }: NavItemProps) {
  return (
    <Pressable
      style={[
        styles.navItem,
        isActive && styles.navItemActive,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{icon}</Text>
      {!collapsed && (
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
      )}
      {isActive && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

export default function GMPLayout() {
  const { gameMaster, signOut, loading, user, isGameMaster } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(width < 768);

  console.log('GMP Layout render - pathname:', pathname, 'loading:', loading, 'user:', !!user, 'isGM:', isGameMaster);

  const isSmallScreen = width < 768;
  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  // Allow login page to render without auth check
  const isLoginPage = pathname === '/gmp/login';

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('GMP Layout: pathname:', pathname, 'loading:', loading, 'user:', !!user, 'isGM:', isGameMaster);
    
    // Skip redirects while loading or on login page
    if (loading || isLoginPage) return;
    
    // Redirect to login if no user
    if (!user) {
      console.log('GMP Layout: No user, redirecting to login');
      router.replace('/gmp/login');
      return;
    }
    
    // Redirect to landing if not a GM
    if (!isGameMaster) {
      console.log('GMP Layout: Not a GM, redirecting to landing');
      router.replace('/');
      return;
    }
  }, [pathname, loading, user, isGameMaster, router, isLoginPage]);

  // Show login page without any GMP chrome
  if (isLoginPage) {
    return (
      <PaperProvider theme={paperTheme}>
        <Slot />
      </PaperProvider>
    );
  }

  // Show loading while checking auth or redirecting
  if (loading || !user || !isGameMaster) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🃏</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/gmp' },
    { icon: '🎨', label: 'Card Designer', href: '/gmp/cards' },
    { icon: '⚡', label: 'Minting', href: '/gmp/mint' },
    { icon: '👥', label: 'Players', href: '/gmp/players' },
    { icon: '💰', label: 'Economy', href: '/gmp/economy' },
  ];

  const isActive = (href: string) => {
    if (href === '/gmp') return pathname === '/gmp';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/gmp/login');
  };

  return (
    <PaperProvider theme={paperTheme}>
      <View style={styles.container}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🃏</Text>
            {!sidebarCollapsed && (
              <View style={styles.logoText}>
                <Text style={styles.logoTitle}>LOLSTONE</Text>
                <Text style={styles.logoSubtitle}>Game Master</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Navigation */}
          <ScrollView style={styles.navSection} showsVerticalScrollIndicator={false}>
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={isActive(item.href)}
                onPress={() => router.push(item.href as any)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </ScrollView>

          {/* User Section */}
          <View style={styles.userSection}>
            <Divider style={styles.divider} />
            <View style={styles.userInfo}>
              <Avatar.Text 
                size={36} 
                label={gameMaster?.name?.charAt(0) || 'G'} 
                style={styles.avatar}
              />
              {!sidebarCollapsed && (
                <View style={styles.userText}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {gameMaster?.name || 'Game Master'}
                  </Text>
                  <Text style={styles.userRole}>Administrator</Text>
                </View>
              )}
            </View>
            <Pressable style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutIcon}>🚪</Text>
              {!sidebarCollapsed && <Text style={styles.logoutText}>Logout</Text>}
            </Pressable>
          </View>

          {/* Collapse Toggle */}
          {!isSmallScreen && (
            <Pressable 
              style={styles.collapseButton}
              onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Text style={styles.collapseIcon}>
                {sidebarCollapsed ? '→' : '←'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Slot />
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: adminColors.background,
  },

  // Sidebar
  sidebar: {
    backgroundColor: adminColors.sidebarBg,
    height: '100%',
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoText: {
    marginLeft: adminSpacing.sm,
  },
  logoTitle: {
    color: adminColors.sidebarTextActive,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoSubtitle: {
    color: adminColors.sidebarText,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: adminSpacing.md,
  },

  // Navigation
  navSection: {
    flex: 1,
    paddingTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm + 4,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.xs,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: adminColors.sidebarHover,
  },
  navIcon: {
    fontSize: 18,
    marginRight: adminSpacing.sm,
  },
  navIconActive: {
    // same
  },
  navLabel: {
    color: adminColors.sidebarText,
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    color: adminColors.sidebarTextActive,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -8 }],
    width: 3,
    height: 16,
    backgroundColor: adminColors.accent,
    borderRadius: 2,
  },

  // User Section
  userSection: {
    paddingHorizontal: adminSpacing.sm,
    paddingTop: adminSpacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.md,
  },
  avatar: {
    backgroundColor: adminColors.accent,
  },
  userText: {
    marginLeft: adminSpacing.sm,
    flex: 1,
  },
  userName: {
    color: adminColors.sidebarTextActive,
    fontSize: 13,
    fontWeight: '600',
  },
  userRole: {
    color: adminColors.sidebarText,
    fontSize: 11,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
    marginTop: adminSpacing.xs,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: adminSpacing.sm,
  },
  logoutText: {
    color: adminColors.sidebarText,
    fontSize: 13,
  },
  collapseButton: {
    position: 'absolute',
    right: -12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: adminColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collapseIcon: {
    fontSize: 12,
    color: adminColors.textSecondary,
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: adminColors.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: adminColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 64,
    marginBottom: adminSpacing.md,
  },
  loadingSubtext: {
    color: adminColors.textSecondary,
    fontSize: 16,
  },
});
