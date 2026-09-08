# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: a dependency-light local web interface plus a cross-platform Node.js
command-line tool. Processing stays on the user's computer.

## Users

Hogwarts Legacy Creator Kit users, including members of the HogwartsMP community,
who want thumbnails for their own mod scripts without opening Unreal Editor.

## Product purpose

HL-Discoveries is a community reference for Hogwarts Legacy asset identifiers,
measured metadata, relationships, and reproducible observations. Its thumbnail
extractor reads PNG editor thumbnails cached inside Hogwarts Legacy Creator Kit
packages. Success means a community member can turn their own CK packages into
valid PNG files and a machine-readable manifest for use in mod scripts.

## Positioning

The extractor is specific to the Hogwarts Legacy Creator Kit workflow. It reads
cached PNG data and records what it found without requiring Forge, HogwartsMP, or
another mod framework. It does not claim to decode native texture payloads or
prove that an asset works at runtime.

## Operating context

Users run the tool locally against packages from their Hogwarts Legacy Creator Kit
installation or a separate working folder. The browser interface is the main entry
point for occasional use. The command line and JSON manifest support repeatable
extraction and integration with community scripts.

## Capabilities and constraints

- Accept one CK package or a directory tree of `.uasset` files.
- Preserve relative paths and package the results for download.
- Support explicit BGRA correction and byte-preserving RGBA extraction.
- Never upload files, call remote services, or modify source packages.
- Do not include game assets, Creator Kit files, extracted thumbnails, private
  framework code, machine-specific paths, credentials, or personal information.
- Keep executable tool code under its own MIT license. Existing documentation and
  database contributions remain under the repository's CC BY 4.0 license.

## Brand commitments

The product name is "Hogwarts Legacy CK Thumbnail Extractor". It is an
HL-Discoveries utility intended for the HogwartsMP community and other Hogwarts
Legacy Creator Kit users. Its output is framework-neutral. It is unofficial and
does not imply endorsement by a publisher or engine vendor.

## Evidence on hand

The existing standalone command-line package has synthetic parser and channel
tests. A read-only Hogwarts Legacy Creator Kit animation package produced a
256x256 PNG whose corrected digest matched the previously accepted output, while
preserve mode matched the embedded PNG. No game art, testimonials, or usage claims
are available for the interface and none should be fabricated.

## Product principles

- Local files stay local.
- Make channel conversion a visible choice.
- Report cache misses plainly.
- Keep discovery evidence separate from runtime claims.
- Prefer a small auditable tool over a packaged native application.

## Accessibility and inclusion

The browser interface must work with keyboard navigation, visible focus, semantic
status text, sufficient contrast, reduced motion, and narrow screens.
