import { useEffect } from 'react';

export interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onError: (message: string) => void;
}

/**
 * Native placeholder: the iOS build gets a camera scanner with expo-camera.
 * (The web build has a working scanner in BarcodeScanner.web.tsx.)
 */
export function BarcodeScanner({ onError }: BarcodeScannerProps) {
  useEffect(() => {
    onError('Barcode scanning isn’t in this build yet. Search by name instead.');
  }, [onError]);
  return null;
}
