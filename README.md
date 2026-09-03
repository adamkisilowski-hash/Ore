# Blockdex — a 3D Minecraft block explorer

An interactive gallery of **862 Minecraft-style blocks**, each one modelled and
rendered live in your browser. Click any block to inspect it in 3D: orbit it,
zoom in, flip through the catalogue, and look at the individual 16×16 textures
its faces are built from.

Open `index.html` in any modern browser — that's the whole install step.

```bash
git clone <this repo> && cd Ore
python3 -m http.server 8000     # or: npx serve .
# then visit http://localhost:8000
```

## What makes it unusual

**Nothing is downloaded and nothing is drawn by hand.** There are no images in
this repository, no texture packs, and no third-party libraries — not even a 3D
engine. Every block is *described* in a few lines of data and then generated at
runtime:

| Layer | File | What it does |
| --- | --- | --- |
| Seeded randomness | `js/rng.js` | mulberry32 PRNG + colour helpers, so a block looks identical on every visit |
| Textures | `js/textures.js` | ~55 procedural painters (planks, cobble, ore veins, glazed motifs, leaves, flames…) that fill 16×16 RGBA buffers |
| Geometry | `js/shapes.js` | 30 block models assembled from axis-aligned boxes and quads, with Minecraft-style UV cropping |
| Catalogue | `js/blocks.js`, `js/blocks-world.js` | the block list; whole families (13 wood sets, 16 dye colours, the stone variants, copper oxidation) are expanded programmatically |
| Renderer | `js/engine.js` | a ~300-line WebGL renderer: one shader, one context, scissored viewports |
| Interface | `js/app.js` | grid, search, category filters, and the 3D inspector |

### One canvas, many blocks

A page showing sixty spinning blocks does not create sixty renderers. A single
WebGL canvas is stretched across the viewport, and each visible card is painted
into its own scissored rectangle of it, so the whole grid costs one context and
one animation frame. Cards that scroll out of view stop drawing entirely
(`IntersectionObserver`), and meshes and texture atlases are uploaded lazily the
first time a block appears.

### Faces, atlases and UV cropping

A block declares up to six face textures (`top`, `bottom`, `side`, `front`,
`back`, `lock`). They are packed into a horizontal strip atlas, and the geometry
builder squeezes each face's UVs into its slot — so one texture and one draw call
covers the whole block. Because UVs are cropped from the parent cube's extents,
a slab shows the bottom half of its side texture and a fence post shows a 4-pixel
strip, exactly like the real thing.

### Lighting

The fragment shader combines fixed Minecraft-style face shading (top brightest,
bottom darkest) with a soft key light, then mixes in emission weighted by texel
brightness — which is why a torch's flame glows while its stick stays shaded.

## Adding a block

```js
add('honey_bricks', 'stone', {
  shape: 'stairs',                       // any model from js/shapes.js
  all:  f('bricks', ramp('#e0a83a', 4)), // any painter from js/textures.js
  glow: 0.4                              // 0–1 emission
});
```

That's the whole definition — mesh, texture atlas, inspector entry, search index
and category count all follow from it.

## Controls

| Action | How |
| --- | --- |
| Search | click the box or press <kbd>/</kbd> |
| Open a random block | `Random`, or <kbd>R</kbd> |
| Orbit / zoom | drag / scroll inside the inspector |
| Previous / next block | <kbd>←</kbd> <kbd>→</kbd> |
| Close the inspector | <kbd>Esc</kbd> |
| Halve the render resolution | the `HD` toggle |

Each block also has its own link — `index.html#glow_lichen` opens straight into
the inspector.

## Building a single file

```bash
node build.js     # -> dist/index.html (~118 kB, zero external requests)
```

Useful for dropping the whole site into one static file, an email attachment, or
an offline machine.

## Notes

A fan project, and a deliberate exercise in generating rather than shipping
assets: the textures are original procedural approximations, not Mojang's
artwork. Not affiliated with or endorsed by Mojang or Microsoft. Minecraft is a
trademark of Mojang AB.
