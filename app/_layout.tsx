// Import polyfills for Solana/Buffer support
import '../src/polyfills';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/context/AuthContext';
import { WalletContextProvider } from '../src/context/WalletContext';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  // Debug: Log when the app initializes
  useEffect(() => {
    console.log('🚀 RootLayout mounted');
    console.log('📍 Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseKey: !!(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
  }, []);

  return (
    <PaperProvider>
      <WalletContextProvider>
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            />
          </View>
        </AuthProvider>
      </WalletContextProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

