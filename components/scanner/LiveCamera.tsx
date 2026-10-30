import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

export interface LiveCameraProps {
  /** Only opens the camera while true (the screen is focused). */
  active: boolean;
  /** The captured frame: a file URI on native, a JPEG data URL on the web. */
  onCapture: (uri: string) => void;
  /** Called once when the camera can't be used here; the screen falls back to the photo picker. */
  onUnavailable: (reason: 'denied' | 'no_camera' | 'unsupported') => void;
  /** Called with a function that captures the current frame, so the shutter can live outside the view. */
  bindCapture: (capture: (() => void) | null) => void;
}

/**
 * Native: the back camera as a viewfinder (expo-camera). Permission is
 * requested the first time the Scan tab is opened — that is the moment the
 * user is asking to scan. The view is only mounted while the tab is focused.
 */
export function LiveCamera({ active, onCapture, onUnavailable, bindCapture }: LiveCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active || !permission || permission.granted) return;
    if (!permission.canAskAgain) {
      onUnavailable('denied');
      return;
    }
    requestPermission().then((result) => {
      if (!result.granted) onUnavailable('denied');
    });
  }, [active, permission, requestPermission, onUnavailable]);

  useEffect(() => {
    if (!active || !ready || !permission?.granted) {
      bindCapture(null);
      return;
    }
    let taking = false;
    bindCapture(() => {
      if (taking) return;
      taking = true;
      camera.current
        ?.takePictureAsync({ quality: 0.85, exif: false, shutterSound: false })
        .then((picture) => onCapture(picture.uri))
        .catch(() => undefined)
        .finally(() => {
          taking = false;
        });
    });
    return () => bindCapture(null);
  }, [active, ready, permission?.granted, onCapture, bindCapture]);

  if (!active || !permission?.granted) return null;

  return (
    <CameraView
      ref={camera}
      style={StyleSheet.absoluteFill}
      facing="back"
      mute
      onCameraReady={() => setReady(true)}
      onMountError={() => onUnavailable('no_camera')}
    />
  );
}
