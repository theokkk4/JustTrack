import { useEffect } from 'react';

export interface LiveCameraProps {
  /** Only opens the camera while true (the screen is focused). */
  active: boolean;
  /** A JPEG data URL of the frame the user captured. */
  onCapture: (uri: string) => void;
  /** Called once when the camera can't be used here; the screen falls back to the photo picker. */
  onUnavailable: (reason: 'denied' | 'no_camera' | 'unsupported') => void;
  /** Called with a function that captures the current frame, so the shutter can live outside the view. */
  bindCapture: (capture: (() => void) | null) => void;
}

/**
 * Native: the live viewfinder arrives with the iOS build (expo-camera);
 * until then the Scan screen uses the system camera through the picker.
 */
export function LiveCamera({ onUnavailable }: LiveCameraProps) {
  useEffect(() => {
    onUnavailable('unsupported');
  }, [onUnavailable]);
  return null;
}
