import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '../types/database';

// Get environment variables - these are baked in at build time for Expo static exports
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Placeholders so build (e.g. Coolify/Docker) can complete when env is not yet set. Replace with real vars and redeploy.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.placeholder';
const url = supabaseUrl || PLACEHOLDER_URL;
const key = supabaseAnonKey || PLACEHOLDER_KEY;
const hasRealConfig = !!(supabaseUrl && supabaseAnonKey);

// Log configuration status (helpful for debugging production issues)
console.log('🔧 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'MISSING',
});

if (!hasRealConfig) {
  console.error('❌ Missing required environment variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('💡 COOLIFY: Add them as Build Environment Variables, then redeploy.');
  console.error('💡 VERCEL: Add them in Project → Settings → Environment Variables, then redeploy.');
  console.error('⚠️  Variables are baked in at BUILD TIME. Redeploy after adding them.');
}

// Check if we're in a browser environment (not SSR/Node)
// This needs to be a function so it's evaluated at runtime, not module load time
const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Custom storage adapter for Supabase auth
// Uses SecureStore on native, localStorage on web, and no-op storage for SSR
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    // During SSR/static rendering, return null
    if (Platform.OS === 'web') {
      if (!isBrowser()) {
        console.log('🔑 Storage.getItem: Not in browser, returning null for', key);
        return null;
      }
      try {
        const value = window.localStorage.getItem(key);
        console.log('🔑 Storage.getItem:', key, '→', value ? 'found' : 'null');
        return value;
      } catch (e) {
        console.error('🔑 Storage.getItem error:', e);
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (!isBrowser()) {
        console.log('🔑 Storage.setItem: Not in browser, skipping', key);
        return;
      }
      try {
        console.log('🔑 Storage.setItem:', key, '→ saving...');
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('🔑 Storage.setItem error:', e);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (!isBrowser()) {
        console.log('🔑 Storage.removeItem: Not in browser, skipping', key);
        return;
      }
      try {
        console.log('🔑 Storage.removeItem:', key);
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('🔑 Storage.removeItem error:', e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

