import { RIG_PHOTO_MAX_SIDE } from '@bendike/shared';

const QUALITY = 0.85;
const SMALL_ENOUGH_BYTES = 2 * 1024 * 1024;

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function resizeImage(file: File, maxSide: number = RIG_PHOTO_MAX_SIDE): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const target = fitWithin(bitmap.width, bitmap.height, maxSide);
    const untouched = target.width === bitmap.width && target.height === bitmap.height;
    if (untouched && file.size <= SMALL_ENOUGH_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^./]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
