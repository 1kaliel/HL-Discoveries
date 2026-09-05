# Evidence, not assumptions

Asset discovery and runtime behavior answer different questions. They are recorded separately.

| Discovery evidence | What it means | What it does not mean |
| --- | --- | --- |
| `filesystem` | A file at this identifier was discovered in the source installation | Class, loadability or compatibility is confirmed |
| `registry` | Unreal's Asset Registry resolved the asset class | It successfully renders or plays in a game runtime |
| `inspected` | Selected properties were read by loading the asset in CK | It is visually approved or multiplayer-safe |

`assetClass` is confirmed metadata when present. `classHint` is only a filename/location-based
hint. Unknown values are `null` or absent, not zero, false or an invented default.

Runtime observations live under `observations/`. Each identifies a tested asset, runtime and
build, observation method, result, scope and limitations. An absent game build is explicitly
`null`. Do not extend a result to newer builds or different runtimes without retesting.

The initial static-prop observations are maintainer visual reports, not independently
reproduced tests. No public screenshots are attached. Both report rendering only; incorrect
grounding and missing two-client validation remain explicit limitations.

## Common traps

- A prop AnimSequence cannot be substituted for a player AnimSequence: skeletons matter.
- Root motion enabled is a risk marker, not a measured displacement vector.
- Mesh bounds do not reveal a hinge, authored component placement, collision shape or terrain height.
- Registry dependencies prove a reference exists, not the Blueprint's execution order.
- A Wwise event may need a bank that is not loaded in your current area.
- A Niagara asset's existence does not prove your runtime exposes Niagara spawning.
- CK/editor-only assets may not exist in a retail game's cooked content.

## Reporting problems

Describe the tested context rather than labeling an asset universally "broken". Include
runtime/build, call options, player or prop skeleton, initial conditions, and cleanup. Separate
the observed behavior from your suspected cause.
