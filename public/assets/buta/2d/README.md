# Buta — 2D emotion artwork

Eight original transparent WebP sprites made with the built-in ImageGen tool
(edit / identity-preserve workflow), October 2026. No external stock art.
The rejected 3D design is not shipped.

`happy` is the style reference for `thinking`, `oops`, `celebrate`, `pointing`,
`explaining`, `surprised` and `proud`. Full prompts are in [prompts.json](prompts.json).
Delivery encoding preserves the generated canvas dimensions and alpha channel.

Keep warm brown outlines, pink/sage/khaki pastel colors, simple 2D shading,
the explorer hat and orange scarf. Emotions should read at small mobile sizes.
Avoid realistic materials, 3D lighting, extra props and decorative UI labels.
Keep the full character, consistent standing baseline and transparent margins.

`src/components/Pig.tsx` retains the shared mood API and layout proportions.
The map owns travel motion; selecting completed lessons must not trigger travel.

## Animation

`motion/` contains eight transparent 2x2 sprite sheets (four drawn frames each),
also generated with built-in ImageGen; see [motion-prompts.json](motion-prompts.json).
Read tiles left-to-right, top-to-bottom. The frames change eyelids, mouth, head
and arms. CSS plays a short gesture/blink then rests before repeating.
The atlas uses compositor transforms, no per-frame React state updates or timers.
Only the currently needed motion sheet loads; a still pose remains until it is ready.
Reduced motion uses still artwork. Modal/settings and demo pause freeze the sprite
on its current frame. Parent map travel remains independent from idle gestures.
