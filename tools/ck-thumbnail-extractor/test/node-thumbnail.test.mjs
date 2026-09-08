import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateSync } from 'node:zlib';

import { PNG } from 'pngjs';

import { DEFAULT_LIMITS, ThumbnailError } from '../src/embedded-png.mjs';
import { processThumbnail, sha256Hex } from '../src/node-thumbnail.mjs';
import { joinBytes, makePng } from './fixtures.mjs';

test('RGBA mode preserves the validated embedded PNG bytes', async () => {
  const pngBytes = makePng();
  const result = await processThumbnail(joinBytes([8, 6, 7, 5], pngBytes), {
    channelMode: 'rgba',
  });

  assert.deepEqual(result.pngBytes, pngBytes);
  assert.deepEqual(result.dimensions, { width: 2, height: 1 });
  assert.equal(result.offset, 4);
});

test('BGRA mode swaps only red and blue channels', async () => {
  const result = await processThumbnail(makePng(), { channelMode: 'bgra' });
  const decoded = PNG.sync.read(Buffer.from(result.pngBytes));

  assert.deepEqual(
    [...decoded.data],
    [30, 20, 10, 255, 60, 50, 40, 128],
  );
});

test('thumbnail processing reports invalid decoded image data', async () => {
  await assert.rejects(
    () => processThumbnail(makePng({
      compressedData: deflateSync(Uint8Array.from([5, 1, 2, 3, 4, 5, 6, 7, 8])),
    })),
    (error) => error instanceof ThumbnailError && error.code === 'PNG_DECODE_FAILED',
  );
});

test('thumbnail processing enforces decoded-size limits before decoding', async () => {
  await assert.rejects(
    () => processThumbnail(makePng(), {
      limits: { ...DEFAULT_LIMITS, maxDecodedBytes: 7 },
    }),
    (error) => error instanceof ThumbnailError && error.code === 'DECODED_IMAGE_TOO_LARGE',
  );
});

test('thumbnail processing rejects ambiguous channel modes', async () => {
  await assert.rejects(
    () => processThumbnail(makePng(), { channelMode: 'auto' }),
    (error) => error instanceof ThumbnailError && error.code === 'INVALID_CHANNEL_MODE',
  );
});

test('SHA256 helper returns a lowercase digest', async () => {
  assert.equal(
    await sha256Hex(Uint8Array.from([97, 98, 99])),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});
