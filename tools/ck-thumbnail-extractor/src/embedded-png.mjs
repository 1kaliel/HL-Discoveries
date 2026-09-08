const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const textDecoder = new TextDecoder('ascii');

export const DEFAULT_LIMITS = Object.freeze({
  maxChunkBytes: 32 * 1024 * 1024,
  maxPngBytes: 64 * 1024 * 1024,
  maxWidth: 8192,
  maxHeight: 8192,
  maxDecodedBytes: 256 * 1024 * 1024,
});

export class ThumbnailError extends Error {
  constructor(message, code = 'INVALID_CACHED_PNG') {
    super(message);
    this.name = 'ThumbnailError';
    this.code = code;
  }
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hasSignatureAt(bytes, offset) {
  if (offset + PNG_SIGNATURE.length > bytes.length) return false;
  return PNG_SIGNATURE.every((value, index) => bytes[offset + index] === value);
}

function checkedLimits(limits) {
  const merged = { ...DEFAULT_LIMITS, ...limits };
  for (const [name, value] of Object.entries(merged)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`${name} must be a positive safe integer.`);
    }
  }
  return merged;
}

function parseCandidate(bytes, offset, limits) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let cursor = offset + PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let dimensions;
  let hasIdat = false;

  while (cursor < bytes.length) {
    if (cursor - offset > limits.maxPngBytes) {
      throw new ThumbnailError('Cached PNG exceeds the compressed-size limit.', 'PNG_TOO_LARGE');
    }
    if (cursor + 12 > bytes.length) {
      throw new ThumbnailError('Cached PNG contains a truncated chunk.', 'TRUNCATED_PNG');
    }

    const dataLength = view.getUint32(cursor, false);
    if (dataLength > limits.maxChunkBytes) {
      throw new ThumbnailError('Cached PNG chunk exceeds the configured limit.', 'CHUNK_TOO_LARGE');
    }

    const chunkEnd = cursor + 12 + dataLength;
    if (!Number.isSafeInteger(chunkEnd) || chunkEnd > bytes.length) {
      throw new ThumbnailError('Cached PNG contains a truncated chunk.', 'TRUNCATED_PNG');
    }
    if (chunkEnd - offset > limits.maxPngBytes) {
      throw new ThumbnailError('Cached PNG exceeds the compressed-size limit.', 'PNG_TOO_LARGE');
    }

    const typeBytes = bytes.subarray(cursor + 4, cursor + 8);
    const type = textDecoder.decode(typeBytes);
    const data = bytes.subarray(cursor + 8, cursor + 8 + dataLength);
    const expectedCrc = view.getUint32(cursor + 8 + dataLength, false);
    const actualCrc = crc32(bytes.subarray(cursor + 4, cursor + 8 + dataLength));
    if (expectedCrc !== actualCrc) {
      throw new ThumbnailError(`Cached PNG ${type || 'chunk'} failed its CRC check.`, 'CRC_MISMATCH');
    }

    if (chunkIndex === 0) {
      if (type !== 'IHDR' || dataLength !== 13) {
        throw new ThumbnailError('Cached PNG does not begin with a valid IHDR chunk.', 'INVALID_IHDR');
      }
      const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const width = dataView.getUint32(0, false);
      const height = dataView.getUint32(4, false);
      if (width === 0 || height === 0 || width > limits.maxWidth || height > limits.maxHeight) {
        throw new ThumbnailError('Cached PNG dimensions exceed the configured limits.', 'DIMENSIONS_TOO_LARGE');
      }
      const decodedBytes = width * height * 4;
      if (!Number.isSafeInteger(decodedBytes) || decodedBytes > limits.maxDecodedBytes) {
        throw new ThumbnailError('Cached PNG decoded size exceeds the configured limit.', 'DECODED_IMAGE_TOO_LARGE');
      }
      dimensions = { width, height };
    } else if (type === 'IHDR') {
      throw new ThumbnailError('Cached PNG contains more than one IHDR chunk.', 'INVALID_PNG_STRUCTURE');
    }

    if (type === 'IDAT') hasIdat = true;
    if (type === 'IEND') {
      if (dataLength !== 0 || !hasIdat || !dimensions) {
        throw new ThumbnailError('Cached PNG has an invalid IEND sequence.', 'INVALID_PNG_STRUCTURE');
      }
      return {
        bytes: bytes.slice(offset, chunkEnd),
        dimensions,
        offset,
        compressedBytes: chunkEnd - offset,
      };
    }

    cursor = chunkEnd;
    chunkIndex += 1;
  }

  throw new ThumbnailError('Cached PNG is missing its IEND chunk.', 'MISSING_IEND');
}

export function extractEmbeddedPng(input, limits = DEFAULT_LIMITS) {
  const bytes = input instanceof Uint8Array
    ? input
    : new Uint8Array(input);
  const safeLimits = checkedLimits(limits);
  let candidateError;
  let foundSignature = false;

  for (let offset = 0; offset <= bytes.length - PNG_SIGNATURE.length; offset += 1) {
    if (!hasSignatureAt(bytes, offset)) continue;
    foundSignature = true;
    try {
      return parseCandidate(bytes, offset, safeLimits);
    } catch (error) {
      if (!(error instanceof ThumbnailError)) throw error;
      candidateError = error;
    }
  }

  if (foundSignature && candidateError) throw candidateError;
  throw new ThumbnailError('No cached PNG thumbnail was found in this package.', 'NO_CACHED_PNG');
}
