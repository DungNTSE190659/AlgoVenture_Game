# Array — Live UI assets

This folder is used by the live project, not a review mockup.

- `items/`: 8 individually illustrated camping props and front/back playing cards, PNG with alpha. Values and suits remain runtime text.
- `items/merge-leaf.png`: hand-painted leaf sprite generated with built-in ImageGen, with alpha. Shared by split previews, source leaves, output and drag ghosts; numbers and identity marks remain runtime elements. Prompt: `MERGE-LEAF-PROMPT.json`.
- `characters/`: 8 plush illustrations, mapped by `item.id % 8`. Fox / rabbit / raccoon / bear species and scarf identities follow items through swaps and moves.
- `illustrations/`: five village environments; decorative artwork does not replace interaction targets.
- `svg/` and `png/`: softer Array map tiles, cream panels, sage action buttons, number tags and leaf states.
- `PROMPTS.json` and `CHARACTER-PROMPTS.json`: built-in ImageGen prompts and source files. The reference is the existing Array village background.
- `manifest.json`: asset inventory and character identity mapping.

Regenerate SVG/PNG UI exports with `node scripts/build-array-game-assets.mjs`. This preserves generated raster artwork. The live stylesheet is `src/arrayGameAssets.css`; it follows `sortingPortrait.css` and overrides the earlier scrolling layout for the five Sort games only.

Portrait phone layouts reserve header/footer space before sizing the board. Short landscape phones place playback/actions beside the board. No parent transforms or zoom are applied, so drag coordinates and movement animations remain in native units. Gameplay engines and scoring are unchanged.

The route map remains vertically navigable to reach all lesson islands; it hides its scrollbar, as before. Game screens fit the viewport without page or game-board scrolling. Settings dialogs can scroll when needed to keep all input fields accessible.
