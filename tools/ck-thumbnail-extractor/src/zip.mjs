import { sanitizeRelativePath } from './browser-model.mjs';
import { crc32 } from './embedded-png.mjs';

const encoder = new TextEncoder();
const ZIP32_MAX = 0xffffffff;

function concat(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  if (!Number.isSafeInteger(length) || length > ZIP32_MAX) {
    throw new RangeError('Archive exceeds ZIP32 bounds.');
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 0xffff) {
    throw new RangeError('Archive entry count exceeds ZIP32 bounds.');
  }
  const names = new Set();
  return entries.map((entry) => {
    const rawName = String(entry.name ?? '').replaceAll('\\', '/');
    const safeName = sanitizeRelativePath(rawName);
    if (rawName !== safeName || rawName.startsWith('/') || /^[a-zA-Z]:/.test(rawName)) {
      throw new Error(`ZIP entry name must be a safe relative path: ${rawName || '(empty)'}`);
    }
    const key = safeName.toLowerCase();
    if (names.has(key)) throw new Error(`Duplicate ZIP entry name: ${safeName}`);
    names.add(key);

    const length = entry.bytes?.length;
    if (!Number.isSafeInteger(length) || length < 0 || length > ZIP32_MAX) {
      throw new RangeError(`ZIP32 cannot store entry: ${safeName}`);
    }
    if (!(entry.bytes instanceof Uint8Array)) {
      throw new TypeError(`ZIP entry bytes must be a Uint8Array: ${safeName}`);
    }
    const nameBytes = encoder.encode(safeName);
    if (nameBytes.length > 0xffff) throw new RangeError(`ZIP entry name is too long: ${safeName}`);
    return { name: safeName, nameBytes, bytes: entry.bytes, crc: crc32(entry.bytes) };
  });
}

function localHeader(entry) {
  const header = new Uint8Array(30 + entry.nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0x0021, true);
  view.setUint32(14, entry.crc, true);
  view.setUint32(18, entry.bytes.length, true);
  view.setUint32(22, entry.bytes.length, true);
  view.setUint16(26, entry.nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(entry.nameBytes, 30);
  return header;
}

function centralHeader(entry, localOffset) {
  const header = new Uint8Array(46 + entry.nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0x0021, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.bytes.length, true);
  view.setUint32(24, entry.bytes.length, true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint32(42, localOffset, true);
  header.set(entry.nameBytes, 46);
  return header;
}

export function createStoredZip(entries) {
  const normalized = normalizeEntries(entries);
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const entry of normalized) {
    const header = localHeader(entry);
    localParts.push(header, entry.bytes);
    centralParts.push(centralHeader(entry, localOffset));
    localOffset += header.length + entry.bytes.length;
    if (localOffset > ZIP32_MAX) throw new RangeError('Archive exceeds ZIP32 bounds.');
  }

  const centralDirectory = concat(centralParts);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, normalized.length, true);
  view.setUint16(10, normalized.length, true);
  view.setUint32(12, centralDirectory.length, true);
  view.setUint32(16, localOffset, true);

  return concat([...localParts, centralDirectory, end]);
}
