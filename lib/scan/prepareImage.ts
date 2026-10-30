import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** What the picker or the live camera hands over: a URI, plus base64 and a MIME type when native already has them. */
export interface PhotoInput {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
}

export interface PreparedImage {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** A small copy to keep with the logged entries; null when one couldn't be made. */
  thumbnail: string | null;
}

/** Long edge after resizing. Plenty for identifying food; keeps uploads around 150–300 KB. */
const MAX_EDGE = 1280;
/** The thumbnail saved with the entries: a few KB as a data URL, so it outlives the camera's temp file. */
const THUMB_EDGE = 192;

/**
 * Native: a phone photo is 12 MP and several megabytes, so it's resized on
 * the device before upload, and a small copy is kept for the meal card.
 * (The web build does the same on a canvas — see prepareImage.web.ts.)
 */
export async function prepareImage(photo: PhotoInput): Promise<PreparedImage> {
  const upload = await ImageManipulator.manipulate(photo.uri).resize({ width: MAX_EDGE, height: null }).renderAsync();
  const uploaded = await upload.saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: true });
  if (!uploaded.base64) throw new Error('The photo couldn’t be read.');

  let thumbnail: string | null = null;
  try {
    const small = await ImageManipulator.manipulate(photo.uri).resize({ width: THUMB_EDGE, height: null }).renderAsync();
    const saved = await small.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
    thumbnail = saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
  } catch {
    // The entry just shows an emoji instead.
  }
  return { base64: uploaded.base64, mediaType: 'image/jpeg', thumbnail };
}
