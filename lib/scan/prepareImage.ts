import type { ImagePickerAsset } from 'expo-image-picker';

export interface PreparedImage {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Native: the picker already returns base64 at the quality we asked for.
 * (The web build resizes on a canvas instead — see prepareImage.web.ts.)
 */
export async function prepareImage(asset: ImagePickerAsset): Promise<PreparedImage> {
  if (!asset.base64) throw new Error('The photo couldn’t be read.');
  const mediaType = asset.mimeType === 'image/png' ? 'image/png' : asset.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  return { base64: asset.base64, mediaType };
}
