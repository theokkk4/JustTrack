import { SymbolView } from 'expo-symbols';
import React from 'react';

import { AppIcons } from '@/constants/icons';
import type { AppIconProps } from './AppIcon';

export function AppIcon({ name, size = 24, color, weight = 'regular' }: AppIconProps) {
  return (
    <SymbolView
      name={AppIcons[name].sf}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}

export type { AppIconName } from '@/constants/icons';
