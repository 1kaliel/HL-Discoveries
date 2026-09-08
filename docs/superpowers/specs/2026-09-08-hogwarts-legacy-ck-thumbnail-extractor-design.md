# Hogwarts Legacy CK thumbnail extractor design

## Goal

Add a Hogwarts Legacy Creator Kit tool that extracts cached PNG thumbnails from CK
package files. A HogwartsMP community member should be able to use a browser
interface for occasional work or a command line for repeatable batches, then use
the PNG files and manifest in their own mod scripts. Both entry points read source
files without modifying them.

The tool lives at `tools/ck-thumbnail-extractor`. Its product name is "Hogwarts
Legacy CK Thumbnail Extractor". Nothing in that directory may depend on Forge, the
HogwartsMP framework, a private registry, a local installation path, or an external
service. The tool is game-specific and framework-neutral.

## Distribution and licensing

The tool code carries an MIT license owned by HL-Discoveries contributors. The
repository's existing CC BY 4.0 terms continue to cover documentation and
database contributions. `LICENSE.md` will point to the tool's separate license.

The committed package contains source, tests, npm manifests, and documentation.
It does not contain package files, extracted thumbnails, native binaries,
credentials, generated caches, or `node_modules`.

## Package structure

- `src/embedded-png.mjs` owns byte scanning, PNG chunk validation, CRC checks,
  dimensions, and extraction limits. It accepts `Uint8Array` input so the CLI
  and browser use the same parser.
- `src/node-thumbnail.mjs` performs Node-specific decompression validation and
  BGRA-to-RGBA conversion with `pngjs`.
- `src/cli.mjs` owns arguments, recursive package discovery, relative output
  paths, overwrite policy, and terminal reporting.
- `src/zip.mjs` writes uncompressed ZIP downloads from browser-produced PNGs.
  It has no external runtime dependency.
- `ui/` contains semantic HTML, CSS, and browser behavior. Package bytes remain
  in browser memory and are never posted to the local server.
- `scripts/serve-ui.mjs` serves static files on loopback and opens the default
  browser. `start-ui.cmd` is the Windows double-click entry point.

## Command line

The CLI accepts a CK package or directory, an output directory, an explicit channel
mode, and an optional overwrite flag. Directory scans recurse through `.uasset`
files and preserve relative paths. Existing output files are protected unless
the user passes `--overwrite`.

`bgra` swaps the red and blue channels once for the CK cached-thumbnail convention.
`rgba` preserves the embedded PNG. The tool never guesses channel order. A
directory scan reports extracted, cache-miss, and failed counts. A single file with
no cached PNG returns a non-zero exit code and a plain explanation.

## Browser interface

The interface follows the approved Depth queue composition. The first viewport
has four working areas:

1. A full-width queue shows selected packages. Brightness, spacing, and scale
   indicate active, complete, pending, and failed states.
2. A file control accepts one or more files and directory selections.
3. One radio group selects `CK cached BGRA -> RGBA` or `Preserve RGBA`; only one
   option can be active.
4. The active result has a preview, filename, dimensions, byte offset, counters,
   and a `Download PNGs` action.

The visual system uses an emissive black background, ivory monospaced text, ash
depth planes, and one amber active color. It uses no external fonts, images,
gradients, cards, fantasy motifs, or brand marks. On narrow screens the queue,
controls, and active result stack in that order. Reduced-motion users receive no
background drift. Status is always available as text and never depends on color.

The browser generates one ZIP containing successful outputs and a UTF-8 JSON
manifest with CK-relative source names, output filenames, dimensions, offsets,
selected channel mode, source and output SHA256 digests, and status. Script authors
can consume this manifest without parsing terminal output. It contains no absolute
paths.

## Error handling and privacy

The parser rejects malformed chunk sizes, failed CRCs, invalid PNG structure,
unsupported dimensions, excessive compressed data, and excessive decoded size.
Symlinks are ignored by directory scans. Output names are derived from relative
input names and normalized before ZIP creation.

The UI labels local processing before file selection. It makes no network calls
after loading from loopback. It has no telemetry, analytics, remote fonts, CDN
scripts, or upload endpoint. Error messages show only the selected relative name,
never a browser-provided absolute path.

## Verification

Automated tests cover valid extraction, corrupt and truncated PNGs, size bounds,
multiple embedded signatures, BGRA conversion, byte-preserving RGBA mode,
recursive output paths, existing-output protection, missing inputs, safe ZIP
names, manifest content, and ZIP integrity.

The release check will also:

- install dependencies from the lockfile in a clean temporary copy;
- run the CLI and browser help paths;
- extract one read-only local Hogwarts Legacy CK package and verify PNG dimensions,
  expected channel behavior, and source immutability;
- inspect the browser at 1440px and 390px widths;
- exercise file selection, both channel modes, preview, cache misses, and ZIP
  download;
- scan every new or changed file for personal paths, names, secrets, private
  project references, proprietary assets, binaries, and install artifacts;
- run the repository's existing data/schema checks if present;
- review the staged diff before commit and push.

## Stop condition

Stop after the tool, documentation, tests, visual evidence, privacy audit, and
license boundary pass; the commit is pushed to `origin/main`. Native texture
payload decoding, Creator Kit editor automation, hosted processing, a searchable
dataset website, and npm package publishing are outside this change.
