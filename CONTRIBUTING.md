# Contributing discoveries

Use an issue for a new discovery or uncertain finding. Use a pull request for a correction
with clear evidence. You do not need to publish your server or framework implementation.

## Include

1. Exact Unreal object/package path or sound-event name.
2. Asset category and whether its class is inferred or registry-confirmed.
3. Source version: CK build and, for runtime tests, game build, platform/runtime and runtime build.
4. What you tried, the exact relevant options, what happened, and known limitations.
5. Evidence you can share publicly. Redact usernames, account identifiers, server addresses,
   private code and local paths from screenshots and logs.

Keep CK discovery evidence separate from runtime observations. A one-client rendering result
does not prove collision, grounding, interaction behavior or multiplayer synchronization.
Keep conflicting observations with their original versions; do not erase old results simply
because a different build behaves differently.

## Dataset changes

- Follow [the format](docs/data-format.md) and [asset schema](schema/assets.schema.json).
- Stable IDs are the first 24 lowercase hexadecimal characters of SHA-256 of the exact UTF-8
  asset object path. Do not normalize the path's case or silently fix apparent spelling mistakes.
- Store a record in `data/<kind>/<first character of id>.json`; each file wraps an `assets` array.
- Preserve existing order when making a correction. Maintainers normalize the export when
  publishing snapshots. Do not duplicate a path in a second shard.
- Never turn a filename hint into a confirmed class without evidence.
- Add runtime observations separately; leave untested assets without observations.
- Maintainers refresh counts, file hashes and downloadable snapshots after reviewing changes.

## Do not submit

Game packages/binaries, extracted asset files, private framework code, save files, personal
data, tokens, raw logs, guessed compatibility claims or executable content disguised as data.
Preview-media contributions are outside the initial release scope.

Credit sources and contributors. Submit only material you are entitled to contribute, and
identify any third-party material and its terms. Your original contributions are provided
under the repository's [CC BY 4.0 license](LICENSE.md).
