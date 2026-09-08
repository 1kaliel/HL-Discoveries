import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { makePng, joinBytes } from './fixtures.mjs';

const toolRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(toolRoot, 'bin', 'ck-thumbnail-extractor.mjs');

function runCli(arguments_, cwd = toolRoot) {
  return spawnSync(process.execPath, [cliPath, ...arguments_], {
    cwd,
    encoding: 'utf8',
  });
}

async function createWorkspace() {
  return mkdtemp(path.join(tmpdir(), 'ck-thumb-test-'));
}

test('CLI recursively extracts CK thumbnails and writes a script-ready manifest', async () => {
  const workspace = await createWorkspace();
  const input = path.join(workspace, 'input');
  const output = path.join(workspace, 'output');
  await mkdir(path.join(input, 'Animation', 'Human'), { recursive: true });
  await writeFile(
    path.join(input, 'Animation', 'Human', 'Thinking.uasset'),
    joinBytes([4, 2], makePng()),
  );
  await writeFile(path.join(input, 'Animation', 'NoCache.uasset'), Uint8Array.from([1, 2, 3]));
  await writeFile(path.join(input, 'Animation', 'Ignored.txt'), makePng());

  const result = runCli([input, '--output', output, '--channels', 'rgba']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 extracted, 1 cache miss, 0 failed/);

  const png = await readFile(path.join(output, 'Animation', 'Human', 'Thinking.png'));
  assert.deepEqual(png, Buffer.from(makePng()));

  const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.tool.name, 'Hogwarts Legacy CK Thumbnail Extractor');
  assert.equal(manifest.channelMode, 'rgba');
  assert.deepEqual(manifest.summary, { extracted: 1, cacheMisses: 1, failed: 0 });
  assert.deepEqual(
    manifest.files.map(({ source, output: outputName, status }) => ({ source, output: outputName, status })),
    [
      { source: 'Animation/Human/Thinking.uasset', output: 'Animation/Human/Thinking.png', status: 'extracted' },
      { source: 'Animation/NoCache.uasset', output: null, status: 'cache-miss' },
    ],
  );
  assert.equal(manifest.files[0].width, 2);
  assert.equal(manifest.files[0].height, 1);
  assert.equal(manifest.files[0].offset, 2);
  assert.match(manifest.files[0].sourceSha256, /^[a-f0-9]{64}$/);
  assert.match(manifest.files[0].outputSha256, /^[a-f0-9]{64}$/);

  const publicText = `${result.stdout}\n${result.stderr}\n${JSON.stringify(manifest)}`;
  assert.equal(publicText.includes(workspace), false);
});

test('CLI protects existing output unless overwrite is explicit', async () => {
  const workspace = await createWorkspace();
  const input = path.join(workspace, 'Spell.uasset');
  const output = path.join(workspace, 'output');
  await mkdir(output);
  await writeFile(input, makePng());
  await writeFile(path.join(output, 'Spell.png'), 'keep-me');

  const protectedResult = runCli([input, '--output', output, '--channels', 'rgba']);
  assert.notEqual(protectedResult.status, 0);
  assert.equal(await readFile(path.join(output, 'Spell.png'), 'utf8'), 'keep-me');
  assert.match(protectedResult.stderr, /already exists/i);
  assert.equal(protectedResult.stderr.includes(workspace), false);

  const overwriteResult = runCli([
    input,
    '--output', output,
    '--channels', 'rgba',
    '--overwrite',
  ]);
  assert.equal(overwriteResult.status, 0, overwriteResult.stderr);
  assert.deepEqual(await readFile(path.join(output, 'Spell.png')), Buffer.from(makePng()));
});

test('CLI reports a missing input without disclosing its absolute parent path', async () => {
  const workspace = await createWorkspace();
  const missing = path.join(workspace, 'Missing.uasset');
  const result = runCli([missing, '--output', path.join(workspace, 'output')]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing\.uasset/);
  assert.equal(result.stderr.includes(workspace), false);
});

test('CLI ignores symlinked directories during recursive package discovery', async (context) => {
  const workspace = await createWorkspace();
  const input = path.join(workspace, 'input');
  const external = path.join(workspace, 'external');
  const output = path.join(workspace, 'output');
  await mkdir(input);
  await mkdir(external);
  await writeFile(path.join(input, 'Visible.uasset'), makePng());
  await writeFile(path.join(external, 'Hidden.uasset'), makePng());
  try {
    await symlink(external, path.join(input, 'linked'), 'junction');
  } catch (error) {
    context.skip(`Junction creation is unavailable: ${error.code}`);
    return;
  }

  const result = runCli([input, '--output', output, '--channels', 'rgba']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.files.map((record) => record.source), ['Visible.uasset']);
});

test('CLI returns non-zero for a single CK package without a cached thumbnail', async () => {
  const workspace = await createWorkspace();
  const input = path.join(workspace, 'NoCache.uasset');
  await writeFile(input, Uint8Array.from([1, 2, 3, 4]));

  const result = runCli([input, '--output', path.join(workspace, 'output')]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /No cached PNG thumbnail/i);
  assert.equal(result.stderr.includes(workspace), false);
});
