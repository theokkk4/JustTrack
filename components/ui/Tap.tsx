import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TapProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held; 1 disables the effect. */
  pressScale?: number;
  haptic?: 'selection' | 'light' | 'medium' | null;
  children?: React.ReactNode;
}

/** A Pressable that springs down while held and back when released: the app's one press feel. */
export function Tap({ style, pressScale = 0.96, haptic = 'selection', onPressIn, onPressOut, onPress, children, ...rest }: TapProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.set(withSpring(pressScale, { damping: 18, stiffness: 320 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic === 'selection') Haptics.selectionAsync();
        else if (haptic) Haptics.impactAsync(haptic === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(event);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
