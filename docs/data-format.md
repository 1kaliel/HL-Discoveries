# Data format v1

JSON files in `data/<kind>/` are the canonical records. Each contains `schemaVersion: 1` and
an `assets` array. The JSON Schema is in [schema/assets.schema.json](../schema/assets.schema.json).

| Field | Meaning |
| --- | --- |
| `id` | Stable 24-character SHA-256 prefix of the exact object path |
| `name` | Generated readable label, not an authoritative localized item name |
| `path` | Exact Unreal object path |
| `kind` | Discovery category; not a promise of runtime support |
| `assetClass` | Registry-confirmed class, or null |
| `classHint` | Inferred class hint; never treat as confirmed |
| `evidence` | filesystem, registry or inspected |
| `sourceId` | Reference to sources.json |
| `tags` | Search tokens |
| `properties` | Only measured properties available for this record |

Properties can include `boundsCm` (mesh-local minimum/maximum at native scale), `skeleton`,
`durationSeconds`, `rootMotionEnabled` and `forceRootLock`. Missing properties are unknown.

`manifest.json` lists snapshot counts and SHA-256 hashes of data, source, relationship,
collection and observation JSON files. It does not hash itself or documentation.
`collections/` contains curated groups of asset IDs. `relationships/` contains directional
references and their evidence. Relationship endpoints can be package paths not present as
independent asset records; this is intentional for skeletons and dependency-only references.

## Downloads

Each release offers:

- `hl-discoveries-<version>.json.gz`: compressed asset records, with schema/version wrapper.
- `hl-discoveries-<version>.sqlite`: indexed `assets` table plus `metadata` table.
- `SHA256SUMS.txt`: download integrity hashes.
- GitHub's source archive: full repository, including sources, guides and observations.

The JSON/SQLite asset downloads are convenience indexes, not a replacement for the repository's
provenance and observations. They contain no game assets and have no hosted API dependency.

Example SQLite searches:

```sql
SELECT name, path, asset_class, evidence
FROM assets
WHERE kind = 'prop' AND lower(path) LIKE '%dugbog%';

SELECT name, path, properties_json
FROM assets
WHERE kind = 'animation.prop' AND lower(path) LIKE '%chest%';
```

`tags_json` and `properties_json` store JSON. `source_id` joins conceptually to `sources.json`;
the source table is not duplicated in the SQLite convenience index. SQL parameter binding is
recommended when incorporating user input into your own tooling.

No extractor, private project code, framework integration or runnable application is included.
