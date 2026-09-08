import { deflateSync } from 'node:zlib';

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function chunk(type, data, { corruptCrc = false } = {}) {
  const typeBytes = new TextEncoder().encode(type);
  const result = new Uint8Array(12 + data.length);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.length, false);
  result.set(typeBytes, 4);
  result.set(data, 8);
  const checksum = crc32(concat([typeBytes, data]));
  view.setUint32(8 + data.length, corruptCrc ? checksum ^ 0xffffffff : checksum, false);
  return result;
}

export function makePng({
  width = 2,
  height = 1,
  pixels = Uint8Array.from([10, 20, 30, 255, 40, 50, 60, 128]),
  compressedData,
  omitIend = false,
  corruptIdatCrc = false,
} = {}) {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  ihdr.set([8, 6, 0, 0, 0], 8);

  const rows = new Uint8Array(height * (1 + width * 4));
  for (let row = 0; row < height; row += 1) {
    const destination = row * (1 + width * 4);
    rows[destination] = 0;
    rows.set(pixels.subarray(row * width * 4, (row + 1) * width * 4), destination + 1);
  }

  const parts = [
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressedData ?? deflateSync(rows), { corruptCrc: corruptIdatCrc }),
  ];
  if (!omitIend) parts.push(chunk('IEND', new Uint8Array()));
  return concat(parts);
}

export function joinBytes(...parts) {
  return concat(parts.map((part) => part instanceof Uint8Array ? part : Uint8Array.from(part)));
}
