import { createHash } from 'node:crypto';

import { PNG } from 'pngjs';

import { ThumbnailError, extractEmbeddedPng } from './embedded-png.mjs';

const CHANNEL_MODES = new Set(['bgra', 'rgba']);

export async function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function processThumbnail(
  packageBytes,
  { channelMode = 'bgra', limits } = {},
) {
  if (!CHANNEL_MODES.has(channelMode)) {
    throw new ThumbnailError(
      'Channel mode must be either bgra or rgba.',
      'INVALID_CHANNEL_MODE',
    );
  }

  const extracted = extractEmbeddedPng(packageBytes, limits);
  let decoded;
  try {
    decoded = PNG.sync.read(Buffer.from(extracted.bytes));
  } catch {
    throw new ThumbnailError(
      'Cached PNG image data could not be decoded.',
      'PNG_DECODE_FAILED',
    );
  }

  if (
    decoded.width !== extracted.dimensions.width
    || decoded.height !== extracted.dimensions.height
  ) {
    throw new ThumbnailError(
      'Cached PNG dimensions changed during decoding.',
      'PNG_DECODE_FAILED',
    );
  }

  if (channelMode === 'rgba') {
    return { ...extracted, pngBytes: extracted.bytes };
  }

  for (let index = 0; index < decoded.data.length; index += 4) {
    const red = decoded.data[index];
    decoded.data[index] = decoded.data[index + 2];
    decoded.data[index + 2] = red;
  }

  return {
    ...extracted,
    pngBytes: Uint8Array.from(PNG.sync.write(decoded)),
  };
}
