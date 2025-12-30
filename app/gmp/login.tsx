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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useAuthContext } from '../../src/context/AuthContext';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

export default function GMLoginScreen() {
  const { signIn, loading, user, isGameMaster } = useAuthContext();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-navigate if already authenticated as GM
  React.useEffect(() => {
    console.log('GM Login - Auth state:', { loading, user: user?.email, isGameMaster });
    if (!loading && user && isGameMaster) {
      console.log('GM Login - Redirecting to GMP dashboard');
      router.replace('/gmp');
    } else if (!loading && user && !isGameMaster) {
      console.log('GM Login - User authenticated but not GM, staying on login page');
    } else if (!loading && !user) {
      console.log('GM Login - No user, staying on login page');
    }
  }, [loading, user, isGameMaster, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('GM Login - Attempting login for:', email);
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      console.log('GM Login - Sign in result:', { error, hasError: !!error });

      if (error) {
        console.error('GM Login - Auth error:', error);
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
      } else {
        console.log('GM Login - Auth successful, waiting for role check...');
        // Success case will be handled by the useEffect above
      }
    } catch (error: any) {
      console.error('GM Login - Exception:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLanding = () => {
    router.push('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[adminColors.background, '#0f0f1a', adminColors.background]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackToLanding}>
            <Text style={styles.backButtonText}>← Back to Lolstone</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View entering={FadeIn.delay(200)} style={styles.loginCard}>
            <LinearGradient
              colors={[adminColors.surface, 'rgba(30, 41, 59, 0.8)', adminColors.surface]}
              style={styles.loginGradient}
            >
              {/* Logo */}
              <View style={styles.logoSection}>
                <Text style={styles.logoEmoji}>🃏</Text>
                <Text style={styles.logoTitle}>LOLSTONE</Text>
                <Text style={styles.logoSubtitle}>Game Master Portal</Text>
              </View>

              {/* Form */}
              <Animated.View entering={SlideInUp.delay(400)} style={styles.form}>
                <Text style={styles.welcomeText}>Welcome Back, Game Master</Text>
                <Text style={styles.instructionText}>
                  Enter your administrator credentials to access the Game Master Panel
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@lolstone.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Pressable
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#475569', '#334155'] : ['#8b5cf6', '#a855f7']}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Authenticating...' : 'Access Game Master Panel'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Debug: Force navigation if auth works but redirect fails */}
                {user && !isGameMaster && !loading && (
                  <Pressable
                    style={styles.debugButton}
                    onPress={() => {
                      console.log('Debug - Forcing GMP navigation');
                      router.replace('/gmp');
                    }}
                  >
                    <Text style={styles.debugButtonText}>Debug: Force GMP Access</Text>
                  </Pressable>
                )}
              </Animated.View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Game Master access is restricted to authorized administrators only.
                </Text>
                <Text style={styles.footerText}>
                  For player accounts, return to the main Lolstone website.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeOrb1} />
        <View style={styles.decorativeOrb2} />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: adminColors.textSecondary,
    fontSize: 16,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  loginCard: {
    borderRadius: adminRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  loginGradient: {
    padding: adminSpacing.xl,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: adminSpacing.xl,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: adminSpacing.sm,
  },
  logoTitle: {
    color: adminColors.textActive,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: adminSpacing.xs,
  },
  logoSubtitle: {
    color: adminColors.accent,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
  },

  // Form
  form: {
    marginBottom: adminSpacing.xl,
  },
  welcomeText: {
    color: adminColors.textActive,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: adminSpacing.sm,
  },
  instructionText: {
    color: adminColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: adminSpacing.xl,
  },

  // Inputs
  inputGroup: {
    marginBottom: adminSpacing.lg,
  },
  inputLabel: {
    color: adminColors.textActive,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: adminSpacing.sm,
  },
  input: {
    backgroundColor: adminColors.inputBg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    color: adminColors.textActive,
    fontSize: 16,
  },

  // Login Button
  loginButton: {
    borderRadius: adminRadius.md,
    overflow: 'hidden',
    marginTop: adminSpacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    marginTop: adminSpacing.sm,
    padding: adminSpacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  debugButtonText: {
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: adminSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  footerText: {
    color: adminColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: adminSpacing.xs,
  },

  // Decorative Elements
  decorativeOrb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: adminColors.accent,
    top: '10%',
    right: '10%',
    opacity: 0.1,
  },
  decorativeOrb2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: adminColors.primary,
    bottom: '15%',
    left: '15%',
    opacity: 0.1,
  },
});
