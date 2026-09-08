import assert from 'node:assert/strict';
import test from 'node:test';

import { crc32 } from '../src/embedded-png.mjs';
import { createStoredZip } from '../src/zip.mjs';

function readLocalEntries(zipBytes) {
  const entries = [];
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const decoder = new TextDecoder();
  let cursor = 0;

  while (view.getUint32(cursor, true) === 0x04034b50) {
    const crc = view.getUint32(cursor + 14, true);
    const size = view.getUint32(cursor + 18, true);
    const nameLength = view.getUint16(cursor + 26, true);
    const extraLength = view.getUint16(cursor + 28, true);
    const nameStart = cursor + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(zipBytes.subarray(nameStart, nameStart + nameLength));
    const bytes = zipBytes.slice(dataStart, dataStart + size);
    entries.push({ name, bytes, crc });
    cursor = dataStart + size;
  }

  return { entries, centralDirectoryOffset: cursor };
}

test('stored ZIP contains PNG and manifest entries with valid CRCs', () => {
  const pngBytes = Uint8Array.from([137, 80, 78, 71]);
  const manifestBytes = new TextEncoder().encode('{"schemaVersion":1}\n');
  const zipBytes = createStoredZip([
    { name: 'Animation/Thinking.png', bytes: pngBytes },
    { name: 'manifest.json', bytes: manifestBytes },
  ]);
  const { entries, centralDirectoryOffset } = readLocalEntries(zipBytes);

  assert.deepEqual(entries.map((entry) => entry.name), [
    'Animation/Thinking.png',
    'manifest.json',
  ]);
  assert.deepEqual(entries[0].bytes, pngBytes);
  assert.deepEqual(entries[1].bytes, manifestBytes);
  assert.equal(entries[0].crc, crc32(pngBytes));
  assert.equal(entries[1].crc, crc32(manifestBytes));

  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  assert.equal(view.getUint32(centralDirectoryOffset, true), 0x02014b50);
  assert.equal(view.getUint32(zipBytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(zipBytes.length - 12, true), 2);
});

test('stored ZIP rejects unsafe and duplicate entry names', () => {
  const bytes = Uint8Array.from([1]);
  assert.throws(
    () => createStoredZip([{ name: '../secret.png', bytes }]),
    /safe relative path/i,
  );
  assert.throws(
    () => createStoredZip([
      { name: 'same.png', bytes },
      { name: 'same.png', bytes },
    ]),
    /duplicate/i,
  );
});

test('stored ZIP rejects entries that exceed classic ZIP bounds', () => {
  assert.throws(
    () => createStoredZip([{ name: 'huge.png', bytes: { length: 0x1_0000_0000 } }]),
    /ZIP32/i,
  );
});
