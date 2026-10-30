import type { ImagePickerAsset } from 'expo-image-picker';

import type { PreparedImage } from './prepareImage';

/** Long edge after resizing. Plenty for identifying food; keeps uploads around 150–300 KB. */
const MAX_EDGE = 1280;

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The photo couldn’t be read.'));
    image.src = uri;
  });
}

/** Web: shrink the photo on a canvas and re-encode as JPEG before upload. */
export async function prepareImage(asset: ImagePickerAsset): Promise<PreparedImage> {
  const image = await loadImage(asset.uri);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The photo couldn’t be processed.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg' };
}
