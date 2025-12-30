import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../src/context/AuthContext';
import { colors, typography } from '../src/constants/theme';

export default function IndexScreen() {
  const { loading, user, isGameMaster } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in - go to login
      router.replace('/auth/login');
    } else if (isGameMaster) {
      // Game Master - go to GMP dashboard
      router.replace('/gmp');
    } else {
      // Regular player - go to player home (to be built)
      router.replace('/player');
    }
  }, [loading, user, isGameMaster]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🃏</Text>
        <Text style={styles.title}>LOLSTONE</Text>
        <Text style={styles.subtitle}>Loading the chaos...</Text>
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={styles.spinner}
        />
      </View>
      
      {/* Decorative background elements */}
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
    zIndex: 1,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 42,
    letterSpacing: 8,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  spinner: {
    marginTop: 32,
  },
  glowOrb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryGlow,
    top: -100,
    right: -100,
    opacity: 0.3,
  },
  glowOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondaryGlow,
    bottom: -50,
    left: -50,
    opacity: 0.3,
  },
});

