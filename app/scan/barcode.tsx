import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { rememberFoods } from '@/lib/food/foodStore';
import { getOpenFoodFactsProduct } from '@/lib/food/openFoodFacts';
import { useLightStatusBar } from '@/lib/statusBar';
import { getErrorMessage } from '@/utils/errors';

type Status = { kind: 'scanning' } | { kind: 'looking_up'; code: string } | { kind: 'not_found'; code: string } | { kind: 'error'; message: string };

/** Point at a package barcode; Open Food Facts supplies the label's nutrition. */
export default function BarcodeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>({ kind: 'scanning' });
  useLightStatusBar();

  const onDetected = useCallback(
    async (code: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus({ kind: 'looking_up', code });
      try {
        const food = await getOpenFoodFactsProduct(code);
        if (!food) {
          setStatus({ kind: 'not_found', code });
          return;
        }
        rememberFoods([food]);
        router.replace({ pathname: '/food/[id]', params: { id: food.id } });
      } catch (error) {
        setStatus({ kind: 'error', message: getErrorMessage(error) });
      }
    },
    [router]
  );
  const onError = useCallback((message: string) => setStatus({ kind: 'error', message }), []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.viewport}>
        {status.kind === 'scanning' || status.kind === 'looking_up' ? <BarcodeScanner onDetected={onDetected} onError={onError} /> : null}
        <View pointerEvents="none" style={styles.frame}>
          <View style={styles.reticle} />
        </View>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={[styles.close, { top: insets.top + Spacing.md }]}>
          <AppIcon name="close" size={18} color="#FFFFFF" weight="semibold" />
        </Pressable>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {status.kind === 'scanning' ? (
          <>
            <ThemedText variant="headline">Scan a barcode</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              Line the barcode up inside the frame.
            </ThemedText>
          </>
        ) : null}
        {status.kind === 'looking_up' ? (
          <View style={styles.inline}>
            <ActivityIndicator color={colors.accent} />
            <ThemedText variant="subhead" color="secondary">
              Looking up {status.code}…
            </ThemedText>
          </View>
        ) : null}
        {status.kind === 'not_found' ? (
          <>
            <ThemedText variant="headline">We couldn’t find this food</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              Barcode {status.code} isn’t in Open Food Facts yet. You can still search for it by name.
            </ThemedText>
            <Button label="Search by name" onPress={() => router.replace('/food/search')} />
            <Button label="Scan again" variant="secondary" onPress={() => setStatus({ kind: 'scanning' })} />
          </>
        ) : null}
        {status.kind === 'error' ? (
          <>
            <ThemedText variant="headline">Camera unavailable</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              {status.message}
            </ThemedText>
            <Button label="Search by name" onPress={() => router.replace('/food/search')} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { flex: 1, backgroundColor: '#000000' },
  frame: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  reticle: { width: 260, height: 150, borderRadius: Radii.lg, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  close: { position: 'absolute', left: Spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  panel: { padding: Spacing.xl, gap: Spacing.md, minHeight: 160 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
