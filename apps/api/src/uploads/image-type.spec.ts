import { detectImageType, MAX_IMAGE_BYTES } from './image-type';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const gif = Buffer.from('GIF89a\x01\x00', 'binary');

describe('detectImageType', () => {
  test.each([
    ['jpeg', jpeg],
    ['png', png],
    ['webp', webp],
  ] as const)('recognises %s by its leading bytes', (type, buffer) => {
    expect(detectImageType(buffer)).toBe(type);
  });

  test('rejects a GIF, whatever it is called', () => {
    expect(detectImageType(gif)).toBeNull();
  });

  test('rejects text and empty input', () => {
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  test('a RIFF file that is not WebP is rejected', () => {
    expect(detectImageType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt ')]))).toBeNull();
  });

  test('the size limit is 5 MB', () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });
});
