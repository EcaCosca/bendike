import { fitWithin, resizeImage } from './resize-image';

describe('fitWithin', () => {
  test.each([
    [4000, 3000, 1600, { width: 1600, height: 1200 }],
    [3000, 4000, 1600, { width: 1200, height: 1600 }],
    [1600, 1600, 1600, { width: 1600, height: 1600 }],
    [800, 600, 1600, { width: 800, height: 600 }],
  ])('%ix%i within %i', (width, height, max, expected) => {
    expect(fitWithin(width, height, max)).toEqual(expected);
  });
});

describe('resizeImage', () => {
  const original = new File([new Uint8Array(3 * 1024 * 1024)], 'IMG_0001.HEIC.png', { type: 'image/png' });
  const globals = globalThis as unknown as { createImageBitmap?: unknown };
  const saved = globals.createImageBitmap;

  afterEach(() => {
    globals.createImageBitmap = saved;
    jest.restoreAllMocks();
  });

  function stubCanvas(blob: Blob | null) {
    const drawImage = jest.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: (b: Blob | null) => void) => cb(blob),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(canvas as never);
    return { canvas, drawImage };
  }

  test('returns the file unchanged when the browser cannot decode images', async () => {
    globals.createImageBitmap = undefined;

    await expect(resizeImage(original)).resolves.toBe(original);
  });

  test('shrinks a large photo to 1600 pixels on the long side and sends it as a JPEG', async () => {
    const close = jest.fn();
    globals.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close });
    const { canvas, drawImage } = stubCanvas(new Blob(['small'], { type: 'image/jpeg' }));

    const result = await resizeImage(original);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(result).not.toBe(original);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_0001.HEIC.jpg');
  });

  test('leaves a photo that is already small alone', async () => {
    const small = new File(['tiny'], 'a.jpg', { type: 'image/jpeg' });
    globals.createImageBitmap = jest.fn().mockResolvedValue({ width: 800, height: 600, close: jest.fn() });

    await expect(resizeImage(small)).resolves.toBe(small);
  });

  test('falls back to the original when the image cannot be decoded or encoded', async () => {
    globals.createImageBitmap = jest.fn().mockRejectedValue(new Error('bad image'));
    await expect(resizeImage(original)).resolves.toBe(original);

    globals.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close: jest.fn() });
    stubCanvas(null);
    await expect(resizeImage(original)).resolves.toBe(original);
  });
});
