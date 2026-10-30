import type { TextStyle, ViewStyle } from 'react-native';

/**
 * JustTrack design tokens. A violet-to-white gradient crowns each screen;
 * everything below it sits on clean white (or near-black) with soft lavender
 * tints, so the food photos and the big calorie number carry the color.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  /** The page behind the phone-width column on wide screens. */
  backdrop: string;
  surface: string;
  /** Lavender-tinted cards (meal cards, macro columns). */
  surfaceTint: string;
  surfaceTintStrong: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  /** Text and icons that sit on the gradient header. */
  onGradient: string;
  onGradientMuted: string;
  accent: string;
  accentMuted: string;
  protein: string;
  carbs: string;
  fat: string;
  success: string;
  warning: string;
  danger: string;
  /** Header gradient, top to bottom. */
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  tabBarBackground: string;
  tabIconDefault: string;
  tabIconSelected: string;
  fab: string;
  fabIcon: string;
}

export const Colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F3FC',
    backdrop: '#ECE9F8',
    surface: '#FFFFFF',
    surfaceTint: '#F3F0FD',
    surfaceTintStrong: '#E9E4FB',
    border: '#E9E6F4',
    text: '#17142B',
    textSecondary: '#6F6B87',
    textTertiary: '#A6A2BA',
    textInverse: '#FFFFFF',
    onGradient: '#FFFFFF',
    onGradientMuted: 'rgba(255,255,255,0.72)',
    accent: '#6B4EF2',
    accentMuted: '#EDE9FD',
    protein: '#F0547A',
    carbs: '#F6A13B',
    fat: '#6E8CF7',
    success: '#22B573',
    warning: '#F59E0B',
    danger: '#E5484D',
    gradientStart: '#5A3BF4',
    gradientMiddle: '#A98EFF',
    gradientEnd: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabIconDefault: '#B3AFC7',
    tabIconSelected: '#17142B',
    fab: '#17142B',
    fabIcon: '#FFFFFF',
  },
  dark: {
    background: '#0F0D1A',
    backgroundSecondary: '#181527',
    backdrop: '#07060D',
    surface: '#1A1729',
    surfaceTint: '#1F1B33',
    surfaceTintStrong: '#2A2447',
    border: '#2B2742',
    text: '#F4F2FF',
    textSecondary: '#A9A5C4',
    textTertiary: '#6F6B88',
    textInverse: '#17142B',
    onGradient: '#FFFFFF',
    onGradientMuted: 'rgba(255,255,255,0.7)',
    accent: '#9D86FF',
    accentMuted: '#2A2347',
    protein: '#FF6F8E',
    carbs: '#FFB457',
    fat: '#8EA6FF',
    success: '#3DD68C',
    warning: '#FFB340',
    danger: '#FF6B6B',
    gradientStart: '#4B2EDB',
    gradientMiddle: '#2A1F6E',
    gradientEnd: '#0F0D1A',
    tabBarBackground: '#13111F',
    tabIconDefault: '#5E5A78',
    tabIconSelected: '#F4F2FF',
    fab: '#F4F2FF',
    fabIcon: '#17142B',
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  '2xl': 32,
  full: 999,
} as const;

/** The app renders as a phone-width column on wide screens. */
export const CONTENT_MAX_WIDTH = 480;

type TypographyToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const Typography = {
  /** The giant "kcal left" number. */
  display: { fontSize: 92, lineHeight: 96, fontWeight: '300', letterSpacing: -4 },
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.5 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
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
    sm: { shadowColor: '#2A1F6E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
    md: { shadowColor: '#2A1F6E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
    lg: { shadowColor: '#2A1F6E', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 32, elevation: 10 },
  },
  dark: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 1 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 4 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 10 },
  },
};
