# Food, ingredients and pickup props

Start with [the curated item collection](../collections/items.json). These are identifiers and
metadata, not gameplay item definitions. There are no prices, weights, recipes, effects or
framework-specific item IDs in this project.

## Useful mesh folders

| Folder under /Game/ | Examples |
| --- | --- |
| Gameplay/InventoryObjects/PotionIngredients/Meshes | Dugbog tongue, leech juice, spider fang, troll mucus, moonstone |
| Gameplay/InventoryObjects/Loot/Meshes | Pouches, compass, coins, jewellery, instruments |
| Environment/BanditCamps/Bandit_Camp_Shared_Props/Food | Food props including the red apple |

Example exact paths:

```text
/Game/Environment/BanditCamps/Bandit_Camp_Shared_Props/Food/SM_BCProps_Apple_A.SM_BCProps_Apple_A
/Game/Gameplay/InventoryObjects/PotionIngredients/Meshes/SM_Potion_DugbogTongue.SM_Potion_DugbogTongue
/Game/Gameplay/InventoryObjects/Loot/Meshes/SM_Loot_Pouch_01.SM_Loot_Pouch_01
/Game/Gameplay/InventoryObjects/Loot/Meshes/SM_Muggle_Compass.SM_Muggle_Compass
```

The apple and cedar-chest meshes have limited single-client rendering reports on HogwartsMP
`8bb1e99`; see [the observations](../observations/static-props-8bb1e99.json). This does not extend
to every item in these folders.

## Before using an item prop

Confirm its class, check whether it exists in your installed game build, inspect size and pivot,
then test rendering, placement and any needed collision. If `boundsCm` exists, it describes
native mesh-local extents. It does not provide terrain height, runtime collision or an authored
spawn offset. Other records have not had their bounds measured.

Filename similarity is useful for discovery, not enough to assert that a mesh matches a
particular inventory icon or localized item. Unverified matches should stay candidates.
