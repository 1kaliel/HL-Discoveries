import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LIMITS,
  ThumbnailError,
  extractEmbeddedPng,
} from '../src/embedded-png.mjs';
import { joinBytes, makePng } from './fixtures.mjs';

test('embedded PNG extraction returns the complete image and metadata', () => {
  const prefix = Uint8Array.from([1, 3, 3, 7, 0, 12]);
  const pngBytes = makePng();
  const result = extractEmbeddedPng(joinBytes(prefix, pngBytes, [9, 9]));

  assert.equal(result.offset, prefix.length);
  assert.deepEqual(result.bytes, pngBytes);
  assert.deepEqual(result.dimensions, { width: 2, height: 1 });
  assert.equal(result.compressedBytes, pngBytes.length);
});

test('embedded PNG extraction skips a false signature before a valid image', () => {
  const falseCandidate = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 1]);
  const pngBytes = makePng();
  const result = extractEmbeddedPng(joinBytes(falseCandidate, [4, 5, 6], pngBytes));

  assert.equal(result.offset, falseCandidate.length + 3);
  assert.deepEqual(result.bytes, pngBytes);
});

test('embedded PNG extraction rejects a truncated chunk', () => {
  const pngBytes = makePng();
  assert.throws(
    () => extractEmbeddedPng(pngBytes.subarray(0, pngBytes.length - 5)),
    (error) => error instanceof ThumbnailError && /truncated/i.test(error.message),
  );
});

test('embedded PNG extraction rejects a failed CRC', () => {
  assert.throws(
    () => extractEmbeddedPng(makePng({ corruptIdatCrc: true })),
    (error) => error instanceof ThumbnailError && /CRC/i.test(error.message),
  );
});

test('embedded PNG extraction rejects a missing IEND', () => {
  assert.throws(
    () => extractEmbeddedPng(makePng({ omitIend: true })),
    (error) => error instanceof ThumbnailError && /IEND/i.test(error.message),
  );
});

test('embedded PNG extraction enforces chunk bounds', () => {
  assert.throws(
    () => extractEmbeddedPng(makePng(), { ...DEFAULT_LIMITS, maxChunkBytes: 12 }),
    (error) => error instanceof ThumbnailError && /chunk/i.test(error.message),
  );
});

test('embedded PNG extraction enforces dimension bounds', () => {
  assert.throws(
    () => extractEmbeddedPng(makePng(), { ...DEFAULT_LIMITS, maxWidth: 1 }),
    (error) => error instanceof ThumbnailError && /dimensions/i.test(error.message),
  );
});

test('embedded PNG extraction reports packages without a cached thumbnail', () => {
  assert.throws(
    () => extractEmbeddedPng(Uint8Array.from([1, 2, 3, 4])),
    (error) => error instanceof ThumbnailError && error.code === 'NO_CACHED_PNG',
  );
});
