// Admin Panel Theme - Clean, professional white theme
import { MD3LightTheme } from 'react-native-paper';

export const adminColors = {
  // Core palette - Clean whites and grays
  background: '#f8f9fb',
  surface: '#ffffff',
  surfaceVariant: '#f1f3f5',
  
  // Primary - Deep charcoal/near black
  primary: '#1a1a2e',
  primaryLight: '#2d2d44',
  onPrimary: '#ffffff',
  
  // Accent - Subtle blue for interactive elements
  accent: '#4361ee',
  accentLight: '#e8ecff',
  
  // Text
  textPrimary: '#1a1a2e',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  
  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Borders
  border: '#e9ecef',
  borderLight: '#f1f3f5',
  
  // Sidebar
  sidebarBg: '#1a1a2e',
  sidebarText: '#a0a0b0',
  sidebarTextActive: '#ffffff',
  sidebarHover: '#2d2d44',
  
  // Rarity colors (for card-related features)
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const adminSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const adminRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

// React Native Paper theme
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: adminColors.primary,
    onPrimary: adminColors.onPrimary,
    primaryContainer: adminColors.surfaceVariant,
    secondary: adminColors.accent,
    background: adminColors.background,
    surface: adminColors.surface,
    surfaceVariant: adminColors.surfaceVariant,
    error: adminColors.error,
    outline: adminColors.border,
  },
  roundness: 8,
};

