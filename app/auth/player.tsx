import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';

export default function PlayerAuthScreen() {
  const router = useRouter();
  const { signIn, player, loading: authLoading } = useAuthContext();
  
  // All hooks must be called before any early returns
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Logo animation values
  const funnyOAnimation = useSharedValue(0);

  // Animated styles for funny O
  const funnyOAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(funnyOAnimation.value, [0, 1], [1, 1.05]) },
      { rotate: `${interpolate(funnyOAnimation.value, [0, 1], [0, 5])}deg` },
    ],
  }));

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && player) {
      router.replace('/player/profile');
    }
  }, [player, authLoading, router]);

  // Start logo animations
  useEffect(() => {
    funnyOAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Don't render if already logged in (will redirect)
  if (player) {
    return null;
  }

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarUri) return null;

    try {
      const ext = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${userId}_${Date.now()}.${ext}`;

      const response = await fetch(avatarUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

      if (error) {
        console.error('Avatar upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/player');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('📝 Starting registration...');
    
    if (!email || !password || !displayName || !username) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Checking if username is taken:', username.toLowerCase());
      
      // Check if username is taken - use maybeSingle() to avoid error on no match
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('players')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (usernameCheckError) {
        console.error('📝 Username check error:', usernameCheckError);
        // Don't block registration on username check error, continue with signup
      }

      if (existingUser) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      console.log('📝 Creating auth user...');
      
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        console.error('📝 SignUp error:', signUpError);
        // Handle specific error messages
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('📝 No user returned from signUp');
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      console.log('📝 Auth user created:', authData.user.id);

      // Upload avatar if selected
      let uploadedAvatarUrl: string | null = null;
      if (avatarUri) {
        console.log('📝 Uploading avatar...');
        uploadedAvatarUrl = await uploadAvatar(authData.user.id);
      }

      console.log('📝 Creating player profile...');
      
      // Create player profile
      const { error: profileError } = await supabase
        .from('players')
        .insert({
          user_id: authData.user.id,
          name: displayName.trim(),
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          avatar_url: uploadedAvatarUrl,
          ducats: 0, // Starting currency - new users get 0 ducats
        });

      if (profileError) {
        console.error('📝 Profile creation error:', profileError);
        // Try to provide a more helpful error message
        if (profileError.message.includes('duplicate key')) {
          if (profileError.message.includes('username')) {
            setError('Username is already taken');
          } else if (profileError.message.includes('email')) {
            setError('Email is already registered');
          } else {
            setError('Account with these details already exists');
          }
        } else {
          setError('Account created but profile setup failed. Please try logging in.');
        }
        setLoading(false);
        return;
      }

      console.log('📝 Player profile created! Auto signing in...');

      // Auto sign in
      const { error: signInError } = await signIn(email.trim(), password);
      
      if (signInError) {
        console.log('📝 Auto sign-in failed:', signInError);
        Alert.alert('Account Created', 'Your account has been created! Please log in with your new account.');
        setIsRegister(false);
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setUsername('');
        setAvatarUri(null);
      } else {
        console.log('📝 Registration complete, navigating to player home');
        router.replace('/player');
      }
    } catch (e: any) {
      console.error('📝 Registration exception:', e);
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoTopContainer}>
                <Text style={styles.logoTop}>L</Text>
                <Animated.View style={[styles.funnyOContainer, funnyOAnimatedStyle]}>
                  <View style={styles.funnyO}>
                    <View style={styles.funnyOInner}>
                      <View style={styles.funnyOLeftEye} />
                      <View style={styles.funnyORightEye} />
                      <View style={styles.funnyOMouth} />
                    </View>
                  </View>
                </Animated.View>
                <Text style={styles.logoTop}>L</Text>
              </View>
              <Text style={styles.logoBottom}>STONE</Text>
            </View>
            <Text style={styles.subtitle}>Player Portal</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isRegister ? 'Join the arena and start collecting' : 'Sign in to continue playing'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Avatar (Register only) */}
            {isRegister && (
              <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Name & Username (Register only) */}
            {isRegister && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DISPLAY NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#64748b"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>USERNAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="unique_username"
                    placeholderTextColor="#64748b"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading 
                  ? (isRegister ? 'CREATING ACCOUNT...' : 'SIGNING IN...') 
                  : (isRegister ? 'CREATE ACCOUNT' : 'SIGN IN')}
              </Text>
            </Pressable>

            {/* Toggle Mode */}
            <Pressable style={styles.toggleMode} onPress={() => {
              setIsRegister(!isRegister);
              setError('');
            }}>
              <Text style={styles.toggleModeText}>
                {isRegister 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Create One"}
              </Text>
            </Pressable>

            {/* Back to Landing */}
            <Pressable style={styles.backLink} onPress={() => router.push('/')}>
              <Text style={styles.backLinkText}>
                ← Back to Lolstone
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Collect. Battle. Meme.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  logoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoTop: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#00f5d4',
    zIndex: 1,
    lineHeight: 70,
  },
  funnyOContainer: {
    width: 70,
    height: 70,
    position: 'relative',
    marginHorizontal: 4,
  },
  funnyO: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  funnyOInner: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  funnyOLeftEye: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f5d4',
  },
  funnyORightEye: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f5d4',
  },
  funnyOMouth: {
    position: 'absolute',
    bottom: 10,
    width: 26,
    height: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },
  logoBottom: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#ffffff',
    zIndex: 1,
    lineHeight: 46,
    marginTop: -16,
    transform: [{ rotate: '-5deg' }],
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 1,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Avatar
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00f5d4',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0f0f14',
    borderRadius: 8,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Submit
  submitButton: {
    backgroundColor: '#00f5d4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0a0a0f',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Toggle
  toggleMode: {
    marginTop: 20,
    padding: 8,
  },
  toggleModeText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Back Link
  backLink: {
    marginTop: 12,
    padding: 8,
  },
  backLinkText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Footer
  footer: {
    marginTop: 40,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '400',
  },
});

