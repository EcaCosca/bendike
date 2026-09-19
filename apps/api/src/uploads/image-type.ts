export type ImageType = 'jpeg' | 'png' | 'webp';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { type: ImageType; matches: (bytes: Buffer) => boolean }[] = [
  { type: 'jpeg', matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: 'png',
    matches: (b) =>
      b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: 'webp',
    matches: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
];

export function detectImageType(bytes: Buffer): ImageType | null {
  return SIGNATURES.find((signature) => signature.matches(bytes))?.type ?? null;
}
