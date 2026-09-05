# Chest discoveries

These are CK-inspected candidates, not a shipped chest system. See the
[machine-readable collection](../collections/chests.json) and [relationships](../relationships/chests.json).

## Native chest animations

| Animation name | Duration | Skeleton family | Root motion |
| --- | ---: | --- | --- |
| GoldChest_Open_anm | 1.3333 s | GAC_TreasureChest | Disabled |
| Disillusionment_Chest_Open_anm | 5.6667 s | DisillusionmentChest | Disabled |
| HouseChest_Open_anm | 15 s | House_Chests_Collectibles | Disabled |

Gold chest pair:

```text
/Game/RiggedObjects/Props/Chest/GAC_TreasureChest/SK_GAC_TreasureChest_Master.SK_GAC_TreasureChest_Master
/Game/Animation/Props/Chests/GoldChest/GoldChest_Open_anm.GoldChest_Open_anm
```

The sequence's inspected skeleton is
`/Game/RiggedObjects/Props/Chest/GAC_TreasureChest/SK_GAC_TreasureChest_Master_Skeleton.SK_GAC_TreasureChest_Master_Skeleton`.
The matching Animation Blueprint references that skeleton and the opening sequence.

## Player interaction clips

Under `/Game/Animation/Human/`:

| Asset name | Duration | Root motion enabled |
| --- | ---: | --- |
| Hu_BM_Loot_OpenChestW2hands_LF_anm | 2.7 s | Yes |
| Hu_BM_Loot_OpenChestW2Hnads_RF_anm | 2.7 s | Yes |
| Hu_BM_Loot_OpenChestW2Hands_Loop_anm | 3.6667 s | Yes |
| Hu_BM_Loot_OpenChestW2Hands_2Idle_anm | 1.6333 s | Yes |

The `Hnads` spelling is intentional: it is the actual asset identifier. These use the
biped skeleton, not the chest skeleton. Root displacement, hand alignment, playback cleanup
and compatibility with different character rigs have not been validated here.

## Static body/lid alternative

```text
/Game/Environment/Objects/Interactables/SM_Chest_RewardContainer_A.SM_Chest_RewardContainer_A
/Game/Environment/Objects/Interactables/SM_Chest_RewardContainer_A_Lid.SM_Chest_RewardContainer_A_Lid
```

Both load as StaticMesh. Body dimensions from bounds are approximately 65.43 × 36.83 × 33.46 cm;
lid dimensions are 64.55 × 36.41 × 20.90 cm. Bounds are available in their asset records.
The hinge, authored closed transform and opening angle remain unverified. Do not infer them
from bounds alone. Creating two objects does not automatically establish correct lid animation.

## Sound

Wwise event candidates:

- `BP_M_TreasureChest_Open`
- `BP_M_TreasureChest_Open_Hitch_Motion`
- `Music_Stinger_Chest_Open`

The original treasure-chest Blueprint references these events. It also references native loot
selection functionality; spawning a native Blueprint is not equivalent to spawning a neutral
animated prop. Blueprint behavior and ability task timelines have not been inspected here.

## HogwartsMP compatibility note

The scripting reference inspected on 2026-09-04 documents
[`WorldObject.create`](https://docs.hogwarts-mp.com/reference/server/classes/worldobject/) for
static meshes. It does not document skeletal-prop clip playback on that class.
[`LocalPlayer.playClip`](https://docs.hogwarts-mp.com/reference/client/variables/localplayer/)
targets the player, not a chest. Consult the current documentation for newer capabilities.

Animation existence, CK compatibility and runtime API support are separate questions.
