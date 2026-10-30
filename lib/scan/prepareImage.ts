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

/**
 * Native: the picker already returns base64 at the quality we asked for, and
 * its file URI serves as the thumbnail. (The web build resizes on a canvas
 * instead — see prepareImage.web.ts.)
 */
export async function prepareImage(photo: PhotoInput): Promise<PreparedImage> {
  if (!photo.base64) throw new Error('The photo couldn’t be read.');
  const mediaType = photo.mimeType === 'image/png' ? 'image/png' : photo.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  return { base64: photo.base64, mediaType, thumbnail: photo.uri };
}
