# Hogwarts Legacy CK Thumbnail Extractor

Extract cached PNG thumbnails from your own Hogwarts Legacy Creator Kit `.uasset`
files. Use the local browser interface for a visual queue, or use the command line
for repeatable batches. Both routes produce ordinary PNG files and a JSON manifest
that a mod script can consume.

The tool is specific to Hogwarts Legacy Creator Kit packages, but it has no
dependency on a multiplayer framework, mod loader, private service, or fixed
installation path.

## What it extracts

Some Creator Kit package files contain a complete PNG used as a cached editor
thumbnail. This tool finds that PNG, validates its structure and checksum, then
extracts it without modifying the package.

It does not decode native Unreal texture payloads. A valid `.uasset` can therefore
report `No cached PNG`; that result means the package does not contain the supported
cache format, not that the package is broken.

## Requirements

- Node.js 20 or newer
- A local copy of Hogwarts Legacy Creator Kit package files that you are permitted
  to use

No Creator Kit path is configured or assumed.

## Local interface

On Windows:

1. Download or clone this repository.
2. Open `tools/ck-thumbnail-extractor`.
3. Double-click `start-ui.cmd`.

The launcher starts a server on `127.0.0.1` and opens the interface. The browser UI
does not install packages or require network access. On macOS or Linux, run:

```sh
npm run ui
```

Choose individual `.uasset` files, choose a folder, or drop files onto the page.
The queue reports extracted thumbnails, cache misses, and failures. Select a queue
row to inspect its preview and byte offset, then download one ZIP containing every
successful PNG and `manifest.json`.

The browser reads file bytes in memory. It does not upload files, call an API, load
remote fonts, or send telemetry.

## Command line

Install dependencies once from this directory:

```sh
npm ci --ignore-scripts
```

Extract one package:

```sh
node bin/ck-thumbnail-extractor.mjs Thinking.uasset --output thumbnails
```

Recursively scan a folder:

```sh
node bin/ck-thumbnail-extractor.mjs CreatorKitPackages --output thumbnails
```

Available options:

```text
--channels bgra|rgba  Channel handling; bgra is the default
--overwrite           Replace existing PNG and manifest files
--manifest FILE.json  Change the manifest filename
-h, --help            Show command help
```

The command preserves input-relative folders in the output. It ignores symlinks and
non-`.uasset` files. Existing outputs remain untouched unless `--overwrite` is
present.

## Channel modes

`bgra` corrects the red and blue channels used by the supported CK cached-thumbnail
convention. This is the default and is usually the right choice when a raw extracted
preview looks blue or red in the wrong places.

`rgba` validates and preserves the embedded PNG bytes exactly. Use it when the
thumbnail already has the expected colors or when byte-for-byte preservation is
important.

The tool never guesses the channel order. You choose it explicitly in either
interface.

## Manifest for scripts

The UI writes the manifest inside `hl-ck-thumbnails.zip`. The CLI writes it to the
output directory. Each file record contains:

- CK-relative source and PNG output names
- `extracted`, `cache-miss`, or `failed` status
- width, height, and embedded byte offset when extraction succeeds
- SHA256 digests for the source package and output PNG
- a short error explanation when extraction does not succeed

Absolute paths are not included. A Node.js script can select successful outputs like
this:

```js
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('thumbnails/manifest.json', 'utf8'));
const thumbnails = manifest.files.filter((file) => file.status === 'extracted');

for (const thumbnail of thumbnails) {
  console.log(thumbnail.source, '->', thumbnail.output);
}
```

The top-level `schemaVersion` is `1`. Consumers should reject schema versions they
do not support rather than assuming future fields have the same meaning.

## Safety and privacy

- Source packages are opened read-only and never changed.
- Browser processing stays on the device.
- CLI output and manifests use relative names, not local installation paths.
- PNG chunks, checksums, dimensions, compressed size, and decoded size are bounded
  before output is written.
- The repository contains no game packages or extracted game thumbnails.

Treat extracted images as game assets. You are responsible for using and sharing
them in a way permitted by the applicable game terms and local law.

## Development

```sh
npm ci --ignore-scripts
npm test
node bin/ck-thumbnail-extractor.mjs --help
```

Tests use synthetic PNG fixtures. No game content is required or committed.

## License

The tool's original code and documentation are available under the [MIT License](LICENSE).
`pngjs` is also MIT-licensed; see [third-party notices](THIRD_PARTY_NOTICES.md).

Hogwarts Legacy and related marks and assets belong to their respective owners.
This independent utility is not endorsed by Warner Bros., Avalanche Software, or
Portkey Games.
