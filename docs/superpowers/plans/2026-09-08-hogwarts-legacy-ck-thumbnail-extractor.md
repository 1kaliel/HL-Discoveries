# Hogwarts Legacy CK Thumbnail Extractor Implementation Plan

> **For agentic workers:** Follow this plan with `superpowers:executing-plans`. Keep the TDD order: add one failing behavior test, confirm the expected failure, add the minimum implementation, and rerun the focused test before continuing.

**Goal:** Ship a framework-neutral Hogwarts Legacy Creator Kit utility that extracts cached PNG thumbnails from users' own `.uasset` files through either a command line or a local browser interface.

**Architecture:** A dependency-free byte parser in `src/embedded-png.mjs` is shared by Node and the browser. Node-specific image validation and channel conversion use `pngjs`; the browser uses `createImageBitmap`, canvas, and Web Crypto. Both entry points produce the same privacy-safe manifest contract, while a small loopback-only static server launches the UI without accepting uploads.

**Tech stack:** Node.js 20+, ECMAScript modules, Node's built-in test runner, `pngjs` 7.0.0, semantic HTML/CSS, browser File/Canvas/Crypto APIs.

## Global constraints

- Work only in `tools/ck-thumbnail-extractor` plus the repository README/license/docs needed to introduce it.
- Do not commit `.uasset` files, extracted game thumbnails, binaries, `node_modules`, logs, local paths, credentials, or generated review captures.
- Preserve the root CC BY 4.0 boundary; place executable code under the tool's MIT license.
- Treat `.uasset` input as untrusted. Enforce chunk, dimension, compressed-size, and decoded-size limits before allocating large buffers.
- Never expose absolute input paths in manifests, browser errors, or normal CLI output.

### Task 1: Shared embedded-PNG parser

**Files:**
- Create: `tools/ck-thumbnail-extractor/test/embedded-png.test.mjs`
- Create: `tools/ck-thumbnail-extractor/test/fixtures.mjs`
- Create: `tools/ck-thumbnail-extractor/src/embedded-png.mjs`
- Create: `tools/ck-thumbnail-extractor/package.json`
- Create: `tools/ck-thumbnail-extractor/.gitignore`

**Step 1: Write the failing parser tests**

Build tiny PNG fixtures from literal chunks in `test/fixtures.mjs`. Assert that:

```js
const result = extractEmbeddedPng(packageBytes);
assert.equal(result.offset, prefix.length);
assert.deepEqual(result.bytes, pngBytes);
assert.deepEqual(result.dimensions, { width: 2, height: 1 });
```

Separate tests must catch: an earlier false PNG signature followed by a valid image, truncated chunks, invalid CRCs, missing `IEND`, oversized chunks, unsupported dimensions, and no cached PNG.

**Step 2: Verify RED**

Run `npm test -- --test-name-pattern="embedded PNG"` from the tool directory. Confirm failure is `ERR_MODULE_NOT_FOUND` for `src/embedded-png.mjs`.

**Step 3: Implement the minimum parser**

Export:

```js
export const DEFAULT_LIMITS = Object.freeze({
  maxChunkBytes: 32 * 1024 * 1024,
  maxPngBytes: 64 * 1024 * 1024,
  maxWidth: 8192,
  maxHeight: 8192,
  maxDecodedBytes: 256 * 1024 * 1024,
});

export class ThumbnailError extends Error {}
export function crc32(bytes) {}
export function extractEmbeddedPng(bytes, limits = DEFAULT_LIMITS) {}
```

Scan all signatures; accept only a structurally complete PNG with a valid `IHDR`, bounded chunks, valid CRCs, and terminating `IEND`. Return a copied `Uint8Array`, dimensions, byte offset, and compressed byte length.

**Step 4: Verify GREEN**

Run the focused command, then `npm test`. Commit only after all parser tests pass.

### Task 2: Node conversion, manifest, and CLI

**Files:**
- Create: `tools/ck-thumbnail-extractor/test/node-thumbnail.test.mjs`
- Create: `tools/ck-thumbnail-extractor/test/cli.test.mjs`
- Create: `tools/ck-thumbnail-extractor/src/node-thumbnail.mjs`
- Create: `tools/ck-thumbnail-extractor/src/manifest.mjs`
- Create: `tools/ck-thumbnail-extractor/src/cli.mjs`
- Create: `tools/ck-thumbnail-extractor/bin/ck-thumbnail-extractor.mjs`
- Modify: `tools/ck-thumbnail-extractor/package.json`
- Create: `tools/ck-thumbnail-extractor/package-lock.json`

**Step 1: Write failing conversion tests**

Use a hand-authored 2x1 RGBA fixture. Assert `rgba` mode preserves its decoded pixels and PNG bytes, while `bgra` swaps only red and blue and produces literal expected pixels. Assert decompression errors and decoded-size violations become `ThumbnailError` instances.

**Step 2: Verify RED, implement, and verify GREEN**

Run `node --test test/node-thumbnail.test.mjs`; confirm the missing-module failure. Add:

```js
export async function processThumbnail(packageBytes, { channelMode = 'bgra' } = {}) {}
export async function sha256Hex(bytes) {}
```

Validate the parser result through `PNG.sync.read`, swap channels only for `bgra`, and encode with `PNG.sync.write`. Run the focused test and full suite.

**Step 3: Write failing CLI integration tests**

Run the real CLI in temporary directories. Assert recursive `.uasset` discovery, relative `.png` output paths, manifest fields, cache-miss counts, non-zero missing-input behavior, ignored symlinks, and refusal to overwrite without `--overwrite`. Check that stdout, stderr, and the manifest do not contain the temporary absolute path.

**Step 4: Verify RED, implement, and verify GREEN**

Run `node --test test/cli.test.mjs`; confirm failure because the CLI entry point is absent. Implement:

```text
ck-thumbnail-extractor <input> --output <directory>
  [--channels bgra|rgba] [--overwrite] [--manifest <filename>]
```

Single-file output is `<stem>.png`; directory output preserves the relative tree. Emit a manifest with schema version, tool name/version, channel mode, timestamp, and per-file relative source/output names, dimensions, offset, hashes, status, and a relative error message. Run the focused and full suites.

### Task 3: Browser processing and ZIP download

**Files:**
- Create: `tools/ck-thumbnail-extractor/test/zip.test.mjs`
- Create: `tools/ck-thumbnail-extractor/test/browser-model.test.mjs`
- Create: `tools/ck-thumbnail-extractor/src/zip.mjs`
- Create: `tools/ck-thumbnail-extractor/src/browser-model.mjs`
- Create: `tools/ck-thumbnail-extractor/ui/app.mjs`

**Step 1: Write failing ZIP and model tests**

Assert ZIP entries have safe forward-slash paths, directory traversal and drive prefixes are stripped, duplicate output names are deterministically suffixed, local path segments never enter manifest records, and an archive contains both successful PNG entries and `manifest.json` with valid CRC/central-directory metadata.

**Step 2: Verify RED, implement, and verify GREEN**

Run `node --test test/zip.test.mjs test/browser-model.test.mjs`; confirm missing-module failures. Implement:

```js
export function sanitizeRelativePath(value) {}
export function allocateOutputName(sourceName, usedNames) {}
export function createStoredZip(entries) {}
export function createManifestRecord(fields) {}
```

Use only `Uint8Array`, `DataView`, and `TextEncoder` so the modules run in Node and browsers. Then implement the browser coordinator: read selected files into memory, call the shared parser, hash with `crypto.subtle`, use canvas for channel conversion, render text statuses, revoke preview URLs, and download one ZIP. Run focused and full suites.

### Task 4: Local UI and public documentation

**Files:**
- Create: `tools/ck-thumbnail-extractor/ui/index.html`
- Create: `tools/ck-thumbnail-extractor/ui/styles.css`
- Create: `tools/ck-thumbnail-extractor/scripts/serve-ui.mjs`
- Create: `tools/ck-thumbnail-extractor/start-ui.cmd`
- Create: `tools/ck-thumbnail-extractor/README.md`
- Create: `tools/ck-thumbnail-extractor/LICENSE`
- Modify: `README.md`
- Modify: `LICENSE.md`

**Step 1: Complete the approved visual specification**

Use `.impeccable/mocks/depth-queue-a.png` as the approved direction. Generate its grid/regions/font evidence, then implement the first viewport with the queue as the dominant plane. Before editing UI files, read Impeccable's craft-floor reference. Use system monospace fonts, semantic controls, visible focus, text status labels, a single amber active color, and no external assets or network requests.

**Step 2: Add the loopback launcher**

Bind only to `127.0.0.1`, serve the tool root with explicit MIME types and traversal protection, reject non-GET/HEAD methods, and open the default browser. `start-ui.cmd` calls Node without embedding a machine-specific path. Add an automated smoke test if any non-trivial server behavior is introduced.

**Step 3: Document community use**

Explain what a cached CK thumbnail is, supported `.uasset` inputs, `bgra` versus `rgba`, UI and CLI quick starts, manifest fields, script consumption, error meanings, privacy behavior, limitations, and license. Link the tool from the root README and state in the root license that executable code in the tool directory uses its own MIT license.

**Step 4: Verify the interface**

Run the local server and exercise file selection, both channel modes, preview, cache misses, clear/reset, and ZIP download. Capture full-page 1440px and 390px evidence under `.impeccable/review/`, run the mechanical UI detector once, perform the Impeccable reviewer gate (degraded single-agent path because delegation is unavailable), and fix only findings that materially affect usability or accessibility.

### Task 5: Release verification, privacy audit, and push

**Files:**
- Modify only files needed to fix verified release failures.

**Step 1: Run clean-install verification**

Copy the tracked tool files to a temporary directory, run `npm ci`, `npm test`, `node bin/ck-thumbnail-extractor.mjs --help`, and start the UI server long enough to request `/ui/` over loopback. Ensure no installation artifacts appear in git status.

**Step 2: Prove one real CK extraction**

Record the source `.uasset` SHA256, run the CLI into a temporary output directory in both `bgra` and `rgba` modes, validate each PNG with `pngjs`, assert expected dimensions and channel behavior, and confirm the source SHA256 did not change. Do not copy the source or output into the repository.

**Step 3: Audit the public payload**

Scan tracked additions and the staged diff for usernames, drive paths, email addresses, credentials, private project names, Forge dependencies, proprietary assets, generated binaries, and dependency/install caches. Inspect `git diff --cached --check`, the repository's existing verification scripts, and `npm pack --dry-run` output.

**Step 4: Commit and push**

Commit the tested implementation with a CK-specific Conventional Commit subject. Fetch `origin`, verify the branch is fast-forwardable, push `main`, and confirm `git ls-remote origin refs/heads/main` equals local `HEAD`.

**Final evidence:** Report the remote commit, automated test count, real CK extraction hashes/dimensions, clean-install result, privacy/license result, and any honest limitations. Do not claim native Texture2D decoding or full `.uasset` support.
