import assert from 'node:assert/strict';
import test from 'node:test';

import { createStaticServer } from '../scripts/serve-ui.mjs';

async function withServer(run) {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('local UI server serves the semantic interface only over loopback', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/ui/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.match(await response.text(), /Hogwarts Legacy CK Thumbnail Extractor/);
  });
});

test('local UI server supports HEAD without returning a body', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/src/embedded-png.mjs`, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/javascript/);
    assert.equal(await response.text(), '');
  });
});

test('local UI server rejects write methods and traversal attempts', async () => {
  await withServer(async (origin) => {
    const post = await fetch(`${origin}/ui/`, { method: 'POST' });
    assert.equal(post.status, 405);

    const traversal = await fetch(`${origin}/%2e%2e/%2e%2e/package.json`);
    assert.equal(traversal.status, 404);
  });
});
