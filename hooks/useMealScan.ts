import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { prepareImage } from '@/lib/scan/prepareImage';
import { failAnalysis, finishAnalysis, startAnalysis } from '@/lib/scan/reviewStore';
import { analyzeMealPhoto, ScanError } from '@/services/mealScanService';

/**
 * Take or choose a photo, hand it to the analyzer, and open the review
 * screen while it works. Camera and photo access are only requested here,
 * at the moment the user asks to scan.
 */
export function useMealScan() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const scan = async (from: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    try {
      if (from === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph a meal, or choose a photo from your library instead.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: Platform.OS !== 'web', exif: false };
      const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;

      startAnalysis(asset.uri);
      router.push('/scan/review');
      try {
        const prepared = await prepareImage(asset);
        finishAnalysis(await analyzeMealPhoto(prepared));
      } catch (error) {
        failAnalysis(error instanceof Error ? error.message : 'Something went wrong.', error instanceof ScanError ? error.code : null);
      }
    } finally {
      setBusy(false);
    }
  };

  return { scan, busy };
}
