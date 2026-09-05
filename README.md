# HL-Discoveries

**A community reference for Hogwarts Legacy assets and modding discoveries.**

Find asset paths, animation properties, related meshes and sounds, and build-specific
runtime observations. This is a **data-only reference**, not a multiplayer framework,
game resource, asset pack, or replacement for official API documentation.

## Start here

- [Chest discoveries](guides/chests.md): opening clips, matching skeletons, separate lids and sound.
- [Food and ingredient meshes](guides/items.md): useful drop-object candidates.
- [Understanding evidence](docs/evidence.md): what is known, inferred and still untested.
- [Data format and queries](docs/data-format.md): consume the database in your own tools.
- [Download JSON or SQLite](https://github.com/1kaliel/HL-Discoveries/releases/latest).
- [Contribute a discovery](CONTRIBUTING.md).

## Browse the database

| Category | Records in v0.1.0 | Browse |
| --- | ---: | --- |
| Static-mesh candidates | 23,765 | [Props](data/prop) |
| Player animation candidates | 10,605 | [Player clips](data/animation.clip) |
| Prop/environment animation candidates | 909 | [Prop clips](data/animation.prop) |
| Skeletal-prop candidates | 2,330 | [Rigged props](data/prop.skeletal) |
| Sound-event candidates | 6,353 | [Audio](data/audio) |
| Effect candidates | 5,364 | [VFX](data/vfx) |
| Icon candidates | 8,099 | [Icons](data/ui.icon) |
| Character preset candidates | 577 | [Creator presets](data/creator.preset) |
| Gear appearance candidates | 911 | [Gear appearances](data/gear.appearance) |
| Blueprint references | 257 | [Blueprints](data/blueprint.reference) |
| Camera references | 273 | [Cameras](data/camera.asset) |
| Editor-tool references | 60 | [Editor references](data/editor.reference) |

**59,503 records is discovery coverage, not a count of usable or runtime-tested assets.**
The first snapshot was discovered in Creator Kit build `1404437`. Coverage is partial;
the repository is not an exhaustive dump of the game. Display labels are generated from
asset names and may not match the game's localized names.

An asset found in CK may not be cooked into your game build. A valid Unreal path does not
mean your modding runtime exposes the right spawning or playback API. Missing observations
mean **untested**, not broken. See [sources](sources.json) and [manifest](manifest.json).

## What belongs here

Identifiers, measured metadata, relationships, research explanations and reproducible
observations. Contributions should help someone select and test an asset with fewer guesses.

No private framework code, server configuration, player data, raw logs, local installation
paths, compiled mods, `.uasset` files, game archives, or extracted mesh/audio/texture binaries
are included. The initial release contains no thumbnails or preview media.

## Project status

The repository and downloadable datasets are the first release. A searchable visual website
is a future addition, not an existing feature. There is no hosted API or runtime dependency.

## Attribution

Maintained by [1kaliel](https://github.com/1kaliel) and community contributors.
Original documentation and database contributions are available under [CC BY 4.0](LICENSE.md).
Referenced game assets and trademarks remain with their respective owners; this repository
does not grant rights to those assets. Independent and unofficial; not endorsed by Warner
Bros., Avalanche Software, Portkey Games, or HogwartsMP.
