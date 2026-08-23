# Adding PBR textures

The material code is already wired in
(`src/components/scene/IndustrialMaterial.jsx`) and off by default
(`src/config.js` → `ENABLE_PBR_TEXTURES = false`). Drop
the files below into place, flip that flag to `true`, and the flat colors
on the trailer deck, tunnel/pulverizer bodies, and tires switch to real
tiled PBR materials automatically — no other code changes needed.

I couldn't fetch these myself: this environment's network policy blocks
outbound access to texture/asset sites (Poly Haven, Sketchfab, etc. all
return `EGRESS_BLOCKED`), so I can't verify exact current download URLs or
grab the files directly. The instructions below are deliberately generic
(search terms, not links) rather than guessed URLs that might be stale or
wrong.

## What to get

**Poly Haven** (polyhaven.com/textures) is the best fit — CC0 (public
domain, no attribution required), consistent quality, no login needed.
Search each term below, pick any close match, and download the **1K JPG**
resolution (2K is fine too but roughly 4x the file size for a difference
you won't see on a scroll-driven site).

| Search term on Poly Haven | Used for | Save as |
|---|---|---|
| "brushed metal" or "metal plate" | drying tunnel body, pulverizer housing | `public/textures/brushed-steel/` |
| "diamond plate" or "corrugated metal" | trailer deck | `public/textures/tread-plate/` |
| "rubber" (tire/car tire texture) | wheel tires | `public/textures/rubber/` |

Each Poly Haven texture download gives you a folder of maps named things
like `*_diff.jpg` (diffuse/basecolor), `*_nor_gl.jpg` (normal, OpenGL
convention — this project uses OpenGL-style normals, not DirectX), and
`*_rough.jpg` (roughness). Rename them to match exactly what the code
expects:

```
public/textures/
  brushed-steel/
    basecolor.jpg   <- the _diff file
    normal.jpg       <- the _nor_gl file
    roughness.jpg    <- the _rough file
  tread-plate/
    basecolor.jpg
    normal.jpg
    roughness.jpg
  rubber/
    basecolor.jpg
    normal.jpg
    roughness.jpg
```

## Turning it on

1. Confirm all 9 files exist at the paths above (3 sets x 3 maps).
2. In `src/config.js`, change `ENABLE_PBR_TEXTURES = false` to `true`.
3. `npm run build` and check it — if a file is missing this will throw
   (drei's `useTexture` fails loudly on a 404 rather than silently falling
   back), so you'll know immediately if a name doesn't match.

## Adding a fourth set later

To texture something else (e.g. the shaker table's mesh screen, the
rewinder's tension arms), add an entry to the `SETS` object in
`src/components/scene/IndustrialMaterial.jsx` with a tiling
`repeat: [x, y]` tuned to that surface's size, drop the matching folder
under `public/textures/`, and use
`<IndustrialMaterial name="your-new-name" fallbackColor="..." />` in place
of `<meshStandardMaterial color="..." />` at the call site, the same way
the existing ones do.
