# Linked List UI assets

Visual assets for the Linked List lesson playfields, demo controls, HUD, and settings dialog.

- `svg/`: editable source artwork used by the web game.
- `png/`: matching PNG sprites at **2x** the SVG native size, suitable for Unity without an SVG package. UI cutouts preserve transparency; the repeating rope material intentionally fills its whole tile.
- `backgrounds/`: painted hybrid casual meadow, landscape 1536×1024 and portrait 1024×1536.
- `unity-assets.json`: paths, native/PNG dimensions, pivot, suggested Image type, and sprite borders.
- `linked-assets-preview.png`: contact sheet of the current UI sprites.
- `generation-prompts.json`: exact background prompts and generation method.
- `variant-profiles.json`: tailored node/slot aspect ratios and their intended uses.
- `linked-variants-preview.png`: contact sheet of the supplementary variants.
- `ASSET-CHOICES.vi.md`: Vietnamese notes on which assets to choose and which to slice.

## Unity handoff

1. Copy this folder into the Unity project's Assets directory. Use the PNG sprites for standard UGUI Images.
2. Import UI PNGs as Sprite (2D and UI), Single, Full Rect, pivot Center, alpha transparency enabled, mipmaps disabled. Bilinear filtering and no compression preserve thin outlines. Suggested Pixels Per Unit: 100.
3. `borderPixels` uses **PNG pixels**, in Unity's left, bottom, right, top order. Follow each entry's `unityImageType`: ordinary panels/buttons are Sliced, while the tailored node/slot profiles are Simple with Preserve Aspect. Keep `fillCenter` enabled for sliced images. PNGs are 2x; use `nativeSize` as the initial RectTransform size rather than Set Native Size.
4. Use Button transition **Sprite Swap**. The base file is Normal, `-hover` is Highlighted and Selected, `-pressed` is Pressed, and `-disabled` is Disabled. No Color Tint is needed. The web game uses the same four files.
5. Put icons in child Images and labels in TextMeshPro. Text, numbers, Vietnamese labels, and counters remain dynamic; they are deliberately not baked into sprites. The Nunito font is referenced by the existing web project and is not bundled here.
6. Use the landscape or portrait background according to the canvas aspect ratio. Scale uniformly to cover; do not distort the image. There are no interface panels baked into either background.
7. Recreate live rope paths with a LineRenderer or a UI mesh using `rope-tile.png` as the repeat texture. Rope geometry and hit targets must follow the node/socket positions. `rope-anchor.png` is the endpoint cap. The web renderer uses that same texture in an SVG pattern.
8. The Buta character sprites already live separately under `public/assets/buta/2d/`, including the motion sheets. They remain shared assets, rather than being duplicated into this kit.

Keyboard focus rings, layout, dynamic text, and rope positions remain runtime behavior. Shared map navigation and the shared victory screen have their own UI outside this lesson playfield kit. The manifest is import guidance, not a Unity scene or a tested Unity importer.

## Re-export after editing SVGs

From the repository root:

```sh
node scripts/build-linked-ui-assets.mjs
```

The script exports the Lucide-derived icons, button state variants, selected node variants, all PNGs, the manifest, and contact sheet. React, Lucide React, Playwright, and Chrome are the existing project dependencies. The backgrounds are authored separately with the built-in imagegen tool; re-exporting UI does not regenerate them. Icon source licensing is documented in the installed `lucide-react` package (ISC).
