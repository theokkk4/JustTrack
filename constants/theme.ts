import type { TextStyle, ViewStyle } from 'react-native';

/**
 * JustTrack design tokens. iOS-first: neutrals track the system
 * light/dark grouped-background convention so cards and lists feel native.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentMuted: string;
  protein: string;
  proteinMuted: string;
  carbs: string;
  carbsMuted: string;
  fat: string;
  fatMuted: string;
  success: string;
  warning: string;
  danger: string;
  dangerMuted: string;
  overlay: string;
  tabBarBackground: string;
  tabIconDefault: string;
  tabIconSelected: string;
  scanButtonBackground: string;
  scanButtonIcon: string;
}

export const Colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5E5EA',
    borderStrong: '#D1D1D6',
    text: '#0B0D0F',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    accent: '#12B76A',
    accentMuted: '#E3F9EE',
    protein: '#FF3B5C',
    proteinMuted: '#FFE8EC',
    carbs: '#FF9500',
    carbsMuted: '#FFF2E0',
    fat: '#5E5CE6',
    fatMuted: '#EBEAFD',
    success: '#12B76A',
    warning: '#FF9500',
    danger: '#FF3B30',
    dangerMuted: '#FFEBEA',
    overlay: 'rgba(11,13,15,0.4)',
    tabBarBackground: 'rgba(255,255,255,0.92)',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0B0D0F',
    scanButtonBackground: '#0B0D0F',
    scanButtonIcon: '#FFFFFF',
  },
  dark: {
    background: '#000000',
    backgroundSecondary: '#0A0A0C',
    surface: '#1C1C1E',
    surfaceElevated: '#242426',
    border: '#2C2C2E',
    borderStrong: '#38383A',
    text: '#F5F5F7',
    textSecondary: '#98989F',
    textTertiary: '#68686C',
    textInverse: '#0B0D0F',
    accent: '#30D890',
    accentMuted: '#0F2E22',
    protein: '#FF6961',
    proteinMuted: '#3A1B1C',
    carbs: '#FFB340',
    carbsMuted: '#3A2A0F',
    fat: '#7D7AFF',
    fatMuted: '#231F45',
    success: '#30D890',
    warning: '#FFB340',
    danger: '#FF6961',
    dangerMuted: '#3A1B1C',
    overlay: 'rgba(0,0,0,0.6)',
    tabBarBackground: 'rgba(20,20,22,0.85)',
    tabIconDefault: '#68686C',
    tabIconSelected: '#F5F5F7',
    scanButtonBackground: '#F5F5F7',
    scanButtonIcon: '#0B0D0F',
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

type TypographyToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const Typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  bodyEmphasized: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  subheadEmphasized: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' },
} as const satisfies Record<string, TypographyToken>;

export type TypographyVariant = keyof typeof Typography;

type ShadowToken = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

export const Shadows: Record<ColorScheme, Record<'sm' | 'md' | 'lg', ShadowToken>> = {
  light: {
    sm: { shadowColor: '#0B0D0F', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: '#0B0D0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    lg: { shadowColor: '#0B0D0F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 8 },
  },
  dark: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 3 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 8 },
  },
};

export const MacroColorKey = {
  protein: 'protein',
  carbs: 'carbs',
  fat: 'fat',
} as const;
