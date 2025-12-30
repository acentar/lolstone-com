import { useState } from 'react';
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
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';

export default function PlayerAuthScreen() {
  const router = useRouter();
  const { signIn } = useAuthContext();
  
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        router.replace('/');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
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

    setLoading(true);
    setError('');

    try {
      // Check if username is taken
      const { data: existingUser } = await supabase
        .from('players')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      // Upload avatar if selected
      let uploadedAvatarUrl: string | null = null;
      if (avatarUri) {
        uploadedAvatarUrl = await uploadAvatar(authData.user.id);
      }

      // Create player profile
      const { error: profileError } = await supabase
        .from('players')
        .insert({
          user_id: authData.user.id,
          name: displayName,
          username: username.toLowerCase(),
          avatar_url: uploadedAvatarUrl,
          ducats: 100, // Starting currency
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError('Account created but profile setup failed. Please contact support.');
        setLoading(false);
        return;
      }

      // Auto sign in
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        Alert.alert('Account Created', 'Please log in with your new account.');
        setIsRegister(false);
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed');
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
        {/* Background */}
        <View style={styles.bgGradient1} />
        <View style={styles.bgGradient2} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎮</Text>
            <Text style={styles.title}>LOLSTONE</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PLAYER PORTAL</Text>
            </View>
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
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Avatar (Register only) */}
            {isRegister && (
              <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderIcon}>📷</Text>
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

            {/* GM Link */}
            <Pressable style={styles.gmLink} onPress={() => router.push('/auth/login')}>
              <Text style={styles.gmLinkText}>
                Game Master? Go to GM Login →
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Collect. Battle. Meme. 🔥
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  bgGradient1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#22c55e',
    top: -150,
    right: -100,
    opacity: 0.08,
  },
  bgGradient2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#3b82f6',
    bottom: -100,
    left: -100,
    opacity: 0.08,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 4,
  },
  badge: {
    marginTop: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 1,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
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
    fontSize: 13,
    textAlign: 'center',
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
    borderColor: '#22c55e',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  avatarPlaceholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarPlaceholderText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f0f14',
    borderRadius: 8,
    padding: 14,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Submit
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0a0a0f',
    fontSize: 14,
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
  },

  // GM Link
  gmLink: {
    marginTop: 8,
    padding: 8,
  },
  gmLinkText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },

  // Footer
  footer: {
    marginTop: 32,
    color: '#475569',
    fontSize: 13,
  },
});

