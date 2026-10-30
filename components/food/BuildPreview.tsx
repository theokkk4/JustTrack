import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/ThemedText';
import type { Ingredient, Shape } from '@/lib/food/builders/visual';

interface BuildPreviewProps {
  shape: Shape;
  ingredients: Ingredient[];
  /** 0–1: how long a sub is. */
  length?: number;
}

const W = 240;
const H = 150;

/** Deterministic scatter so a topping lands in the same spots every render. */
function scatter(seed: string, n: number, box: { x: number; y: number; w: number; h: number }): { x: number; y: number }[] {
  let state = 0;
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: n }, () => ({ x: box.x + next() * box.w, y: box.y + next() * box.h }));
}

/** One ingredient drawn in its style, inside the given area. */
function Layer({ ingredient, box, index }: { ingredient: Ingredient; box: { x: number; y: number; w: number; h: number }; index: number }) {
  const { color, style, count, id } = ingredient;
  const lift = -index * 2;
  const common = { position: 'absolute' as const, backgroundColor: color };
  const entering = ZoomIn.springify().damping(14).stiffness(180).delay(index * 20);
  if (style === 'bed') {
    const inset = 2 + index * 2;
    return <Animated.View entering={entering} exiting={FadeOut.duration(150)} style={[common, { left: inset, top: inset / 2 + lift, width: box.w - inset * 2, height: box.h - inset, borderRadius: 999, opacity: 0.96 }]} />;
  }
  if (style === 'drizzle') {
    return (
      <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} pointerEvents="none" style={[StyleSheet.absoluteFill, { top: lift }]}>
        {scatter(id, 3, { x: box.w * 0.15, y: box.h * 0.25, w: box.w * 0.6, h: box.h * 0.4 }).map((p, i) => (
          <View key={i} style={[common, { left: p.x - 22, top: p.y, width: 44 + i * 10, height: 6, borderRadius: 3, transform: [{ rotate: `${-18 + i * 14}deg` }], opacity: 0.95 }]} />
        ))}
      </Animated.View>
    );
  }
  const n = style === 'chunks' ? 5 * count : style === 'slices' ? 5 : style === 'shreds' ? 10 : 8;
  const size = style === 'chunks' ? 18 : style === 'slices' ? 14 : style === 'shreds' ? 4 : 8;
  const points = scatter(id, n, { x: box.w * 0.08, y: box.h * 0.12, w: box.w * 0.8, h: box.h * 0.6 });
  return (
    <Animated.View entering={entering} exiting={FadeOut.duration(150)} pointerEvents="none" style={[StyleSheet.absoluteFill, { top: lift }]}>
      {points.map((p, i) => (
        <View
          key={i}
          style={[
            common,
            style === 'chunks' && { left: p.x, top: p.y, width: size + (i % 3) * 3, height: size - 3, borderRadius: 6, transform: [{ rotate: `${(i * 37) % 60 - 30}deg` }] },
            style === 'slices' && { left: p.x, top: p.y, width: size + 4, height: 5, borderRadius: 3, transform: [{ rotate: `${(i * 53) % 90 - 45}deg` }] },
            style === 'shreds' && { left: p.x, top: p.y, width: 14, height: size, borderRadius: 2, transform: [{ rotate: `${(i * 41) % 120 - 60}deg` }] },
            style === 'dots' && { left: p.x, top: p.y, width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ))}
    </Animated.View>
  );
}

/**
 * A playful, not-quite-3D picture of the order: a bowl, wrap, tacos, sub or
 * plate that fills up as options are picked. Each ingredient is a layer that
 * pops in; double portions scatter more of it.
 */
export function BuildPreview({ shape, ingredients, length = 0.8 }: BuildPreviewProps) {
  const fill = shape === 'bowl' ? { x: 28, y: 34, w: W - 56, h: 54 } : shape === 'plate' ? { x: 30, y: 36, w: W - 60, h: 58 } : shape === 'wrap' ? { x: 60, y: 54, w: W - 120, h: 36 } : shape === 'tacos' ? { x: 36, y: 44, w: W - 72, h: 40 } : { x: (W - W * length) / 2 + 10, y: 52, w: W * length - 20, h: 34 };
  const label = ingredients.length === 0 ? 'Pick something to start' : `${ingredients.filter((i) => i.count === 2).length ? 'Double up · ' : ''}${ingredients.length} ${ingredients.length === 1 ? 'thing' : 'things'} in`;

  return (
    <View style={styles.stage} accessible accessibilityLabel={`Your order: ${ingredients.map((i) => (i.count === 2 ? `double ${i.label}` : i.label)).join(', ') || 'empty'}`}>
      <View style={styles.canvas}>
        {/* Vessel: back half */}
        {shape === 'bowl' || shape === 'plate' ? <View style={[styles.rimBack, shape === 'plate' && styles.plateBack]} /> : null}
        {shape === 'wrap' ? <View style={styles.wrapBody} /> : null}
        {shape === 'tacos' ? [0, 1, 2].map((i) => <View key={i} style={[styles.taco, { left: 40 + i * 58, transform: [{ rotate: `${-8 + i * 8}deg` }] }]} />) : null}
        {shape === 'sub' ? <View style={[styles.subBottom, { left: (W - W * length) / 2, width: W * length }]} /> : null}

        {/* Everything that goes in is clipped to the vessel's opening, so nothing spills over the rim. */}
        <View style={[styles.clip, { left: fill.x, top: fill.y, width: fill.w, height: fill.h, borderRadius: shape === 'sub' ? 14 : 999 }]} pointerEvents="none">
          {ingredients.map((ingredient, index) => (
            <Layer key={ingredient.id + ingredient.count} ingredient={ingredient} box={fill} index={index} />
          ))}
        </View>

        {/* Vessel: front half, drawn over the layers */}
        {shape === 'bowl' ? <View style={styles.bowlFront} /> : null}
        {shape === 'plate' ? <View style={styles.plateFront} /> : null}
        {shape === 'wrap' ? <View style={styles.wrapFold} /> : null}
        {shape === 'sub' ? <View style={[styles.subTop, { left: (W - W * length) / 2 + 6, width: W * length - 12 }]} /> : null}
        {shape === 'tacos' ? [0, 1, 2].map((i) => <View key={i} style={[styles.tacoFront, { left: 40 + i * 58, transform: [{ rotate: `${-8 + i * 8}deg` }] }]} />) : null}
      </View>
      <Animated.View key={label} entering={FadeIn.duration(200)}>
        <ThemedText variant="caption1" color="secondary" style={styles.caption}>
          {label}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const BOWL = '#4B3BBF';
const BOWL_LIGHT = '#6A5AE0';
const BREAD = '#E9C98F';
const BREAD_DARK = '#C9A262';

const styles = StyleSheet.create({
  stage: { alignItems: 'center', gap: 6 },
  canvas: { width: W, height: H - 20 },
  clip: { position: 'absolute', overflow: 'hidden' },
  rimBack: { position: 'absolute', left: 20, top: 28, width: W - 40, height: 64, borderRadius: 999, backgroundColor: BOWL_LIGHT },
  plateBack: { left: 16, top: 26, width: W - 32, height: 78, backgroundColor: '#FFFFFF', borderWidth: 8, borderColor: '#D9D2F6' },
  bowlFront: { position: 'absolute', left: 24, top: 66, width: W - 48, height: 70, borderBottomLeftRadius: 110, borderBottomRightRadius: 110, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: BOWL, opacity: 0.92 },
  plateFront: { position: 'absolute', left: 16, top: 86, width: W - 32, height: 26, borderBottomLeftRadius: 999, borderBottomRightRadius: 999, backgroundColor: '#C9C0F0', opacity: 0.55 },
  wrapBody: { position: 'absolute', left: 34, top: 44, width: W - 68, height: 64, borderRadius: 32, backgroundColor: BREAD },
  wrapFold: { position: 'absolute', left: 34, top: 44, width: 74, height: 64, borderRadius: 32, backgroundColor: BREAD_DARK, opacity: 0.55 },
  taco: { position: 'absolute', top: 40, width: 56, height: 56, borderRadius: 28, backgroundColor: BREAD },
  tacoFront: { position: 'absolute', top: 68, width: 56, height: 36, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, backgroundColor: BREAD_DARK },
  subBottom: { position: 'absolute', top: 70, height: 34, borderRadius: 18, backgroundColor: BREAD_DARK },
  subTop: { position: 'absolute', top: 22, height: 40, borderRadius: 22, backgroundColor: BREAD, opacity: 0.96 },
  caption: { textAlign: 'center' },
});
