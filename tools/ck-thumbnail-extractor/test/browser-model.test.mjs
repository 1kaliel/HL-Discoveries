import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allocateOutputName,
  createManifestRecord,
  sanitizeRelativePath,
} from '../src/browser-model.mjs';

test('browser model preserves safe CK-relative paths', () => {
  assert.equal(
    sanitizeRelativePath('Animation\\Human/Stations/Thinking.uasset'),
    'Animation/Human/Stations/Thinking.uasset',
  );
});

test('browser model strips traversal and absolute path context', () => {
  assert.equal(sanitizeRelativePath('../Animation/../../Thinking.uasset'), 'Animation/Thinking.uasset');
  assert.equal(sanitizeRelativePath('C:\\Private\\CK\\Thinking.uasset'), 'Thinking.uasset');
  assert.equal(sanitizeRelativePath('/private/ck/Thinking.uasset'), 'Thinking.uasset');
});

test('browser model allocates deterministic PNG names for duplicate sources', () => {
  const usedNames = new Set();
  assert.equal(allocateOutputName('Animation/Thinking.uasset', usedNames), 'Animation/Thinking.png');
  assert.equal(allocateOutputName('Animation/Thinking.uasset', usedNames), 'Animation/Thinking-2.png');
  assert.equal(allocateOutputName('Animation/Thinking.uasset', usedNames), 'Animation/Thinking-3.png');
});

test('browser manifest records contain only the public schema fields', () => {
  const record = createManifestRecord({
    source: 'C:\\Private\\CK\\Thinking.uasset',
    output: '../Thinking.png',
    status: 'extracted',
    width: 256,
    height: 256,
    offset: 4096,
    sourceSha256: 'a'.repeat(64),
    outputSha256: 'b'.repeat(64),
    error: null,
    absolutePath: 'must-not-survive',
  });

  assert.deepEqual(record, {
    source: 'Thinking.uasset',
    output: 'Thinking.png',
    status: 'extracted',
    width: 256,
    height: 256,
    offset: 4096,
    sourceSha256: 'a'.repeat(64),
    outputSha256: 'b'.repeat(64),
    error: null,
  });
});
