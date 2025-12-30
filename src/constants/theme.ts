// Lolstone Theme - Dark, chaotic internet energy with neon accents
export const colors = {
  // Core palette - Deep void with electric highlights
  background: '#0a0a0f',
  backgroundSecondary: '#12121a',
  backgroundTertiary: '#1a1a26',
  surface: '#1e1e2e',
  surfaceHover: '#2a2a3e',
  
  // Text
  textPrimary: '#e8e8f0',
  textSecondary: '#9090a8',
  textMuted: '#5a5a72',
  
  // Accent - Electric cyan with hot pink secondary
  primary: '#00f5d4',
  primaryDark: '#00c4a8',
  primaryGlow: 'rgba(0, 245, 212, 0.3)',
  
  secondary: '#ff006e',
  secondaryDark: '#cc0058',
  secondaryGlow: 'rgba(255, 0, 110, 0.3)',
  
  // Rarity colors
  common: '#8b8b8b',
  uncommon: '#4ade80',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  
  // Status
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Borders
  border: '#2e2e42',
  borderFocus: '#00f5d4',
  
  // Gradients (as array for LinearGradient)
  gradientPrimary: ['#00f5d4', '#00c4a8'],
  gradientSecondary: ['#ff006e', '#9333ea'],
  gradientDark: ['#1a1a26', '#0a0a0f'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  // Headers - Bold, impactful
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  // Labels
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  // Card text
  cardName: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  cardStat: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  }),
};

