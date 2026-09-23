import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { APP_NAME, LOGO_PATHS, LOGO_VIEWBOX } from '@/constants/brand';
import { useAppTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  width?: number;
  /** Defaults to the theme's text color, so the mark is black in light mode and white in dark mode. */
  color?: string;
}

export function Logo({ width = 56, color }: LogoProps) {
  const { colors } = useAppTheme();
  const fill = color ?? colors.text;
  const height = (width * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      accessibilityRole="image"
      accessibilityLabel={APP_NAME}
    >
      <Path d={LOGO_PATHS.j} fill={fill} />
      <Path d={LOGO_PATHS.t} fill={fill} />
    </Svg>
  );
}
