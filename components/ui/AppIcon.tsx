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
 * renders real SF Symbols, which also keeps the Ionicons font out of the
 * iOS bundle.
 */
export function AppIcon({ name, size = 24, color }: AppIconProps) {
  return <Ionicons name={AppIcons[name].ionicon} size={size} color={color} />;
}

export type { AppIconName };
