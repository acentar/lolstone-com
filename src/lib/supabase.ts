import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '../types/database';

// Get environment variables with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('💡 Make sure to set these in your Vercel project settings:');
  console.error('   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.error('   - Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   - Redeploy after adding the variables');
  
  if (typeof window !== 'undefined') {
    console.error('Current env check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      processEnv: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    });
  }
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

