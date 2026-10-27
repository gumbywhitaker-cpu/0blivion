# Kiwifruit Waste String Recovery System — Digital Twin

An interactive, scroll-driven 3D product site for an investor audience. React
drives the page, React Three Fiber (Three.js) renders the machine, and GSAP
ScrollTrigger ties scroll position to the camera path, the exploded-view
separation, and the technical callout cards. The reference photo is the
source of truth for layout, proportions, and color blocking; the model is
reconstructed from primitive geometry rather than an imported mesh, tuned
against that photo (see [Modeling notes](#modeling-notes)).

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Architecture

**One continuous scroll timeline drives everything.** A single
`ScrollTrigger` pins the canvas for six viewport-heights of scroll (hero +
five stages) and exposes one number, `scrollState.progress` (0→1). Three
other things are derived from it every frame:

- **Camera path** — a Catmull-Rom spline through 6 keyframes (hero + one per
  stage). `progress` maps linearly across the keyframes via `curve.getPoint()`
  (not `getPointAt()` — see the callout in `CameraRig.jsx` about arc-length
  parameterization silently desyncing the camera from the active-stage label
  when keyframes are unevenly spaced).
- **Explode amount** — ramps 0→1 over the first 10% of scroll, then holds.
  Each module's own offset is scaled by this and applied in local space, so
  the separation reads as one clean "pull-apart" rather than five independent
  animations.
- **Active stage index** — `round(progress × 5) − 1`, i.e. the nearest of the
  6 keyframes, converted to a stage index (or `-1` during the hero beat).

**Two state channels, deliberately kept separate:**

1. `scrollState` (`src/state/scrollState.js`) is a plain mutable object.
   `ScrollTrigger.onUpdate` fires on nearly every frame while scrubbing;
   routing that through React state would re-render the whole tree
   constantly. R3F components read it directly inside `useFrame` instead.
2. React state (`activeStage`, `hoveredId` in `App.jsx`) exists only for the
   DOM overlay — the callout card's content, which nav item is bold — and
   only changes when the *value* changes (a subscriber in `scrollState.js`
   dedupes), not on every scroll tick.

**Hover/click are decoupled from scroll on purpose.** Hovering a module in
the 3D view highlights it immediately regardless of scroll position (a
`HighlightContext` ref, set by `StageGroup`, read by each module's own
`useFrame` for roller spin / shaker jitter / rewinder winding speed).
Clicking a module (in the 3D view or the always-visible stage nav) smoothly
scrolls the page to that stage's position in the timeline — scroll position
stays the single source of truth for "what's in focus," so there's no second
camera-override system to keep in sync with the first.

## File structure

```
src/
  App.jsx                    — owns the ScrollTrigger, wires scroll state to the DOM chrome
  data/stages.js              — the 5 stages: geometry offsets, camera keyframes, copy, params
  state/
    scrollState.js            — mutable scroll-driven store + active-stage subscription
    HighlightContext.js       — per-stage-group ref, threaded down to geometry for reactive FX
  components/
    HeroOverlay.jsx            Icon.jsx            CalloutPanel.jsx
    ScrollNav.jsx               Outro.jsx
    scene/
      MachineScene.jsx        — composes Lighting + Chassis + the 5 StageGroups + flow lines
      CameraRig.jsx            — the scroll → camera-spline mapping
      StageGroup.jsx           — per-module: explode offset, hover/click, highlight/dim
      Lighting.jsx             — key/rim/fill lights + procedural (network-free) env reflections
      Chassis.jsx               — static trailer bed, axles, wheels, guard rail
      InfeedStation.jsx  DryingTunnel.jsx  PulverizingRollers.jsx  ShakerTable.jsx  Rewinder.jsx
      MaterialFlowLines.jsx    — orange connectors between exploded stages
reference/
  concept-art-prompts.md      — image-gen prompts for mood-board references (not yet rendered)
```

## Camera keyframes target the *exploded* position, not the assembled one

Each stage's camera `lookAt`/`position` in `data/stages.js` is computed as
`position + explodeOffset`, not the assembled `position` alone:

```js
const exploded = addVec(stage.position, stage.explodeOffset)
camera: {
  position: addVec(exploded, stage.cameraBias),
  lookAt: exploded,
}
```

By the time the scroll timeline settles on a stage, explode has already
finished ramping (within the first 10% of scroll). A camera aimed at the
assembled position would be looking at empty air — and, worse, clipping
through whatever neighboring module now occupies that spot after separating.
This was the first real bug found while testing in-browser: framing looked
right on paper but put the camera inside the drying tunnel's mesh once explode
had run. Fixing the keyframes to target the post-explode position (with
`getPoint`, not `getPointAt`, for the spline sampling — the two bugs compound
if you only fix one) resolved it.

## Example: one full stage end-to-end (Infeed)

**1. Data** (`data/stages.js`) — geometry offsets, camera framing, copy, and
placeholder technical params live in one object per stage:

```js
{
  id: 'infeed',
  position: [-4.6, 0.95, 0],       // assembled position on the chassis
  explodeOffset: [-0.4, 1.1, -0.6], // local offset once separated
  cameraBias: [0.4, 0.5, 3.2],      // camera stand-off from the exploded position
  accent: '#ff5a1f',
  description: 'Raw kiwifruit waste string comes straight off the orchard post…',
  params: [{ label: 'Feed rate', value: '~180 m/min', note: 'placeholder' }, /* … */],
}
```

**2. Geometry** (`scene/InfeedStation.jsx`) — built from primitives in local
space (StageGroup positions the whole thing at `stage.position`), reading the
shared highlight ref for its one bit of stage-specific motion (an animated
feed ribbon that brightens when focused):

```jsx
const highlightRef = useHighlightRef()
useFrame(({ clock }) => {
  const h = highlightRef.current
  ribbonRef.current.material.opacity = 0.25 + h * 0.55
})
```

**3. Interaction + highlight** (`scene/StageGroup.jsx`) — wraps the geometry,
handles pointer events, and drives the "this module glows orange, the rest
desaturate" effect by walking the module's own mesh materials each frame
(cheap at this mesh count) rather than a post-processing pass:

```jsx
<group
  position={stage.position}
  onPointerOver={(e) => { e.stopPropagation(); onHover(stage.id) }}
  onClick={(e) => { e.stopPropagation(); onSelect(stage) }}
>
  <group ref={explodeRef}>
    <HighlightContext.Provider value={highlightRef}>{children}</HighlightContext.Provider>
  </group>
</group>
```

**4. Callout card** (`components/CalloutPanel.jsx`) — reads whichever stage
is currently "displayed" (hover wins over scroll position; see `App.jsx`),
crossfades with a short GSAP tween on change, and renders the icon, stage
index, description, and params table straight from the data object above.

**5. Scroll wiring** (`App.jsx`) — the one `ScrollTrigger.onUpdate` that ties
it all together:

```js
onUpdate(self) {
  const p = self.progress
  scrollState.progress = p
  scrollState.explode = Math.min(1, p / 0.1)
  const stageIdx = Math.min(STAGE_COUNT - 1, Math.max(-1, Math.round(p * SEGMENTS) - 1))
  setActiveStageIndex(stageIdx) // no-ops if unchanged — see scrollState.js
}
```

## Modeling notes

The reference photo was used directly as a build-order and proportion guide
rather than traced into a CAD import: each module's world position along the
trailer's X axis matches the photo's left-to-right layout (infeed → drying
tunnel → pulverizing rollers → shaker table → rewinder), and each module's
own local geometry (spool count, tunnel access panel, twin rollers, tiered
mesh screen, drum + tension arm) mirrors what's visible in the photo, built
from boxes/cylinders/cones rather than an authored mesh. Color blocking
follows the photo directly: deep near-black/charcoal bodies
(`#24262b`–`#3d4046`), safety-orange accents (`#ff5a1f`) on every guard rail,
hub, warning triangle, and structural post.

`reference/concept-art-prompts.md` holds a set of product-photography-style
image-gen prompts (one per module + the bare chassis) for generating
mood-board references — useful for a follow-up pass that refines proportions
or swaps in baked textures. They haven't been rendered yet (the connected
image-gen provider is out of credits on its free plan); the prompts are
provider-agnostic (SD/SDXL-style with recommended sampler settings) so they
can be run through whatever image tool is available when needed.

## Known trade-offs (given the scope)

- **Primitive geometry, not an authored mesh.** Gets the layout, proportions,
  and color-blocking right at a fraction of the effort; a follow-up pass
  could import GLTF assets per module without touching the scroll/camera/
  interaction architecture, which doesn't care how each `StageGroup`'s
  children are built.
- **No baked textures.** Materials are flat `MeshStandardMaterial` colors
  plus a couple of canvas-generated textures (the temperature readout, the
  wound-drum stripe, the mesh-screen grid). Environment reflections come from
  procedural drei `Lightformer`s specifically to avoid a network HDR fetch
  that fails in network-restricted environments (this was the first crash
  found in-browser — `drei`'s `preset="warehouse"` tries to fetch from a CDN).
- **Bundle size.** `three` + `@react-three/fiber` + `@react-three/drei` +
  `gsap` in one chunk is ~1.3 MB unminified-adjacent; fine for a single-page
  investor demo, worth code-splitting (dynamic `import()` on the Canvas) if
  this becomes a production marketing page with other routes.
