import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthContext } from '../../src/context/AuthContext';

export default function GMLoginScreen() {
  const { signIn, loading, user, isGameMaster } = useAuthContext();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);

  // Auto-navigate if already authenticated as GM
  React.useEffect(() => {
    // Only redirect if we're fully loaded and user is confirmed GM
    if (!loading && user && isGameMaster) {
      console.log('GMP Login: User already authenticated as GM, redirecting to dashboard');
      router.replace('/gmp');
    }
  }, [loading, user, isGameMaster, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);

      if (error) {
        Alert.alert('Access Denied', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background */}
      <View style={styles.background}>
        <View style={[styles.gradientOrb, styles.orb1]} />
        <View style={[styles.gradientOrb, styles.orb2]} />
        <View style={[styles.gradientOrb, styles.orb3]} />
        
        {/* Grid pattern */}
        <View style={styles.gridContainer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${i * 5}%` }]} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${i * 5}%` }]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🎮</Text>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.logoTitle}>LOLSTONE</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>GAME MASTER</Text>
            </View>
          </View>
        </Animated.View>

        {/* Login Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Administrator Access</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={[
              styles.inputContainer,
              isFocused === 'email' && styles.inputContainerFocused
            ]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@lolstone.com"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsFocused('email')}
                onBlur={() => setIsFocused(null)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={[
              styles.inputContainer,
              isFocused === 'password' && styles.inputContainerFocused
            ]}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#4b5563"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsFocused('password')}
                onBlur={() => setIsFocused(null)}
              />
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              isLoading && styles.loginButtonLoading,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <View style={styles.loginButtonInner}>
              <Text style={styles.loginButtonText}>
                {isLoading ? 'AUTHENTICATING...' : 'ACCESS PANEL'}
              </Text>
              {!isLoading && <Text style={styles.loginButtonArrow}>→</Text>}
            </View>
          </Pressable>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Secure connection • Authorized personnel only
            </Text>
          </View>
        </Animated.View>

        {/* Version */}
        <Animated.Text entering={FadeIn.delay(400)} style={styles.version}>
          v1.0.0 • Control Panel
        </Animated.Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },

  // Background
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 600,
    height: 600,
    backgroundColor: '#7c3aed',
    top: -300,
    right: -200,
    opacity: 0.15,
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: '#2563eb',
    bottom: -150,
    left: -150,
    opacity: 0.12,
  },
  orb3: {
    width: 200,
    height: 200,
    backgroundColor: '#ec4899',
    top: '40%',
    left: '60%',
    opacity: 0.08,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#1f2937',
    opacity: 0.3,
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 56,
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7c3aed',
    top: -10,
    left: -10,
    opacity: 0.3,
    zIndex: -1,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 6,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a78bfa',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a78bfa',
    letterSpacing: 1.5,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(17, 17, 27, 0.9)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Inputs
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
  },

  // Login Button
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#7c3aed',
  },
  loginButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginButtonLoading: {
    backgroundColor: '#4c1d95',
  },
  loginButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  loginButtonArrow: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 10,
    fontWeight: '300',
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  securityIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  securityText: {
    fontSize: 11,
    color: '#4b5563',
  },

  // Version
  version: {
    marginTop: 32,
    fontSize: 11,
    color: '#374151',
    letterSpacing: 1,
  },
});
