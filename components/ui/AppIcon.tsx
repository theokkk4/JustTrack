import Ionicons from '@expo/vector-icons/Ionicons';
import type { SymbolWeight } from 'expo-symbols';
import React from 'react';
import type { ColorValue } from 'react-native';

import { AppIcons, type AppIconName } from '@/constants/icons';

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color: ColorValue;
  weight?: SymbolWeight;
}

/**
 * Non-iOS fallback (Ionicons). iOS resolves AppIcon.ios.tsx instead and
 * renders real SF Symbols. Icons are decorative: the control they sit in
 * carries the label, so assistive tech skips the glyph itself.
 */
export function AppIcon({ name, size = 24, color }: AppIconProps) {
  return <Ionicons name={AppIcons[name].ionicon} size={size} color={color} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />;
}

export type { AppIconName };
