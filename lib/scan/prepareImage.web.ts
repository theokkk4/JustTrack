import type { PhotoInput, PreparedImage } from './prepareImage';

/** Long edge after resizing. Plenty for identifying food; keeps uploads around 150–300 KB. */
const MAX_EDGE = 1280;
/** The thumbnail saved with the entries: a few KB, square-cropped. */
const THUMB_EDGE = 192;

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The photo couldn’t be read.'));
    image.src = uri;
  });
}

function draw(image: HTMLImageElement, width: number, height: number, crop: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The photo couldn’t be processed.');
  if (crop) {
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  } else {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/** Web: shrink the photo on a canvas and re-encode as JPEG before upload; make a thumbnail while at it. */
export async function prepareImage(photo: PhotoInput): Promise<PreparedImage> {
  const image = await loadImage(photo.uri);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const dataUrl = draw(image, image.naturalWidth * scale, image.naturalHeight * scale, false).toDataURL('image/jpeg', 0.82);
  const thumbnail = draw(image, THUMB_EDGE, THUMB_EDGE, true).toDataURL('image/jpeg', 0.72);
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg', thumbnail };
}
