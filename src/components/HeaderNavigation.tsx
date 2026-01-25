import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter, usePathname } from 'expo-router';
import { useAuthContext } from '../context/AuthContext';
import { colors, spacing } from '../constants/theme';

export default function HeaderNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { player } = useAuthContext();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const isActive = (path: string) => {
    const normalizedPath = pathname.replace(/\/$/, '');
    const normalizedCheck = path.replace(/\/$/, '');
    
    if (normalizedCheck === '/') {
      return normalizedPath === '/';
    }
    
    if (normalizedCheck === '/player') {
      // Active only for /player or /player/index, not for sub-routes like /player/collection
      return normalizedPath === '/player' || normalizedPath === '/player/index';
    }
    
    // For specific routes like /player/collection, /player/decks, etc., match exactly
    return normalizedPath === normalizedCheck;
  };

  return (
    <View style={styles.headerLeft}>
      <Pressable style={styles.logoButton} onPress={() => router.push('/')}>
        <View style={styles.headerLogoContainer}>
          <View style={styles.headerLogoTopContainer}>
            <Text style={styles.headerLogoTopText}>L</Text>
            <View style={styles.headerFunnyOContainer}>
              <View style={styles.headerFunnyO}>
                <View style={styles.headerFunnyOInner}>
                  <View style={styles.headerFunnyOLeftEye} />
                  <View style={styles.headerFunnyORightEye} />
                  <View style={styles.headerFunnyOMouth} />
                </View>
              </View>
            </View>
            <Text style={styles.headerLogoTopText}>L</Text>
          </View>
          <Text style={styles.headerLogoBottomText}>STONE</Text>
        </View>
      </Pressable>
      
      <View style={styles.navLinks}>
        <Pressable style={styles.navLink} onPress={() => router.push('/')}>
          <Text style={[styles.navLinkText, isActive('/') && styles.navLinkTextActive]}>Home</Text>
          {isActive('/') && <View style={styles.navLinkUnderline} />}
        </Pressable>
        <Pressable style={styles.navLink} onPress={() => router.push('/player/shop')}>
          <Text style={[styles.navLinkText, isActive('/player/shop') && styles.navLinkTextActive]}>Buy boosters</Text>
          {isActive('/player/shop') && <View style={styles.navLinkUnderline} />}
        </Pressable>
        {player ? (
          <Pressable style={styles.navLink} onPress={() => router.push('/player/trade')}>
            <Text style={[styles.navLinkText, isActive('/player/trade') && styles.navLinkTextActive]}>Trade</Text>
            {isActive('/player/trade') && <View style={styles.navLinkUnderline} />}
          </Pressable>
        ) : (
          <Pressable style={styles.navLink} onPress={() => router.push('/auth/player')}>
            <Text style={styles.navLinkText}>Trade</Text>
          </Pressable>
        )}
        {player ? (
          <Pressable style={styles.navLink} onPress={() => router.push('/player')}>
            <Text style={[styles.navLinkText, isActive('/player') && styles.navLinkTextActive]}>Play</Text>
            {isActive('/player') && <View style={styles.navLinkUnderline} />}
          </Pressable>
        ) : (
          <Pressable style={styles.navLink} onPress={() => router.push('/auth/player')}>
            <Text style={styles.navLinkText}>Play</Text>
          </Pressable>
        )}
        <Pressable style={styles.navLink} onPress={() => router.push(player ? '/player/collection' : '/auth/player')}>
          <Text style={[styles.navLinkText, isActive('/player/collection') && styles.navLinkTextActive]}>Cards</Text>
          {isActive('/player/collection') && <View style={styles.navLinkUnderline} />}
        </Pressable>
        <Pressable style={styles.navLink} onPress={() => router.push(player ? '/player/decks' : '/auth/player')}>
          <Text style={[styles.navLinkText, isActive('/player/decks') && styles.navLinkTextActive]}>Decks</Text>
          {isActive('/player/decks') && <View style={styles.navLinkUnderline} />}
        </Pressable>
        <Pressable style={styles.navLink} onPress={() => router.push(player ? '/player/profile' : '/auth/player')}>
          <Text style={[styles.navLinkText, isActive('/player/profile') && styles.navLinkTextActive]}>Profile</Text>
          {isActive('/player/profile') && <View style={styles.navLinkUnderline} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
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
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  navLinkText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(148, 163, 184, 0.7)',
  },
  navLinkTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navLinkUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});
