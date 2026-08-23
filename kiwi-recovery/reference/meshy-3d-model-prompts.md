# Meshy text-to-3D prompts

Six separate generations — one per sub-assembly, not one prompt for the
whole machine. Text-to-3D tools reliably produce one coherent object per
generation; asking for a multi-stage trailer in one shot tends to blend or
drop parts. Generate each below independently, export as glTF/GLB, then
assemble them in the scene using the positions already defined in
`src/data/stages.js` (each stage's `position` there is the exact anchor
point to place the corresponding model).

All six share one material language so they read as one machine — restated
in every prompt on purpose, since each generation has no memory of the
others:

- **Body panels:** dark charcoal/graphite powder-coated steel, semi-matte,
  not glossy (roughness ~0.5, slight metalness).
- **Accent/safety elements:** safety-orange (hex `#ff5a1f`) powder-coated
  steel — guard rails, hubs, warning triangles, structural posts.
- **Bare metal parts:** brushed/galvanized steel, slightly cooler gray than
  the charcoal body.
- **Rubber:** matte black, low sheen (tires, vibration mounts).

Scale reference for all six: the reference photo's total assembled trailer
is **~6.5 m long, under 2 m wide**. Per-module target footprints are given
in each prompt so the six pieces come out proportionate to each other.

Generation settings that matter for this use case: **art style = realistic
(PBR)**, not the stylized/cartoon preset; topology = **quad, mid-poly**
(this is a scroll-driven web scene rendered small, not a hero close-up —
no need to burn budget on the high-poly option); **symmetry on** where a
part is bilaterally symmetric (the chassis, the pulverizer housing).

---

## 1. Tandem-Axle Utility Trailer Chassis (bare, no equipment mounted)

```
A bare industrial tandem-axle flatbed utility trailer chassis, empty deck,
no machinery mounted on it. Overall footprint approximately 6.5 meters
long by 1.8 meters wide, deck height about 0.7 meters off the ground.
Diamond-plate steel tread deck surface. Two axles side by side toward the
rear third of the trailer, each with a pair of road-legal pneumatic
off-road tires on black steel wheels -- four wheels total, matte black
rubber tires with visible tread pattern. Front tow hitch/coupler with a
manual jockey wheel stand for detaching from a tow vehicle. Four
retractable box-section stabilizer legs with flat foot pads, positioned
near each corner, shown in the lowered/deployed position. A single
continuous safety-orange tubular steel guard rail running the length of
one long edge of the deck, mounted on vertical orange posts spaced evenly
along that edge -- this is a walking-clearance handrail, open on the
opposite edge. Dark charcoal powder-coated steel main chassis rails and
axle mounts visible underneath the deck. Rear step with small orange grab
rail for accessing the deck. No fenders over the wheels beyond simple
mudguards. Clean industrial fabrication, exposed structural steel, bolted
and welded joints visible, road-legal trailer -- not a shipping container,
not a car trailer with a ramp. Empty deck: do not include any of the
processing equipment.
```

---

## 2. Multi-Spool Infeed Station

```
A multi-spool infeed station for feeding continuous strand material into
an industrial processing line. A compact stand-mounted unit, roughly 0.7
meters wide, 0.5 meters tall, 1.0 meter deep, designed to sit on a
trailer deck. Two horizontal spool holders mounted side by side on a
shared safety-orange tubular steel A-frame stand -- each spool is a large
wound cylindrical roll of beige/tan fibrous cord material, roughly 0.4
meters in diameter, mounted on a heavy-duty steel spindle bar that passes
through the spool's center on a horizontal axis, so the spool's flat
circular ends face forward toward the direction of feed. Safety-orange
disc-shaped end caps and quick-release locking hubs at each end of both
spindle bars, allowing a spool to be swapped without tools. In front of
the spools, two small chrome/polished-steel cylindrical guide rollers
mounted horizontally, spaced apart, that the material threads through
before leaving the station. A low-profile dark charcoal steel base plate
under the whole assembly. A thin safety-orange tubular guard cage or bar
partially enclosing the spools from the side, laser-cut/tubular look, not
solid sheet metal. Industrial, functional, no decorative elements, exposed
mechanical hardware, matte powder-coated steel finish throughout except
for the polished chrome guide rollers.
```

---

## 3. Compact Thermal Drying Tunnel

```
A compact enclosed industrial thermal drying tunnel chamber, a single
sealed rounded rectangular box roughly 1.7 meters long, 1.0 meter tall,
1.2 meters deep, designed to sit on a trailer deck with material passing
through it horizontally end to end. Body is brushed/galvanized steel sheet
metal with softly rounded corners and edges, semi-matte finish. One flat
side face has a removable rectangular access panel, dark charcoal colored,
with two flush recessed handles, roughly 0.5 x 0.5 meters, centered in the
upper-middle of that face. A small round exhaust vent pipe, about 0.15
meters in diameter, protrudes vertically from the top of the tunnel body
near one end. On the same face as the access panel, lower down, a small
recessed control panel: a rectangular digital display bezel with a bright
orange glowing readout area (leave the display screen blank/glowing, no
legible text needed on the mesh -- the number will be added as a texture
later), and beside it a single small round illuminated push-button,
safety-orange colored, slightly recessed. A thin horizontal seam or vent
slit near the bottom edge of that face where a warm interior glow would be
visible, subtly recessed, dark colored. No exposed insulation, no visible
internal machinery -- this is a sealed enclosure, a single self-contained
pressure-vessel-like box with only the panel, vent, and control details
described. Industrial appliance aesthetic, similar to a large sealed
processing oven or dryer unit, not a tunnel you can see through.
```

---

## 4. Counter-Rotating Pulverizing Roller Unit

```
An industrial twin-roller crusher/pulverizer assembly housed in a
rectangular steel enclosure roughly 1.0 x 1.0 x 1.0 meter, designed to sit
on a trailer deck with material passing through it horizontally. Dark
charcoal powder-coated steel housing, boxy and rectilinear. On one broad
face, a large rectangular safety shield/access window, safety-orange
tinted translucent polycarbonate or a safety-orange steel mesh grille,
through which two parallel heavy horizontal cylindrical rollers are
visible stacked one above the other with a narrow gap between them --
these rollers are dark, coarsely textured/grooved steel drums, each with
safety-orange steel end caps/bearing housings at both ends. On one side of
the housing, a cylindrical electric motor housing with visible cooling
fins (radial ribbed disks) mounted horizontally, connected to the roller
shafts, painted the same dark charcoal as the main housing. A small bright
yellow triangular warning/hazard decal-shaped raised element on the front
face near a top corner (a simple raised triangle shape, no text needed --
texture added later). Exposed structural bolts and panel seams typical of
heavy industrial equipment. Compact, dense, boxy silhouette -- this is a
crusher/roller mill, not a conveyor, not a shredder with blades.
```

---

## 5. Vibrating Shaker Table & Separation Unit

```
An industrial multi-tier vibrating shaker/screening table for grading
granular material, roughly 1.0 meter wide, 0.9 meters deep, 0.9 meters
tall overall including its support structure, designed to sit on a
trailer deck. At the top, a shallow rectangular tray, roughly 0.9 x 0.7 x
0.1 meters, with its top surface being a fine woven wire mesh screen
(gray steel mesh grid pattern), set inside a dark charcoal steel frame
lip. The tray is suspended above a base structure by four thin cylindrical
coil compression springs, one at each corner, chrome or bare steel
springs, clearly visible as helical coils. Below the tray, a dark charcoal
steel open-frame stand with a small red/orange cylindrical vibration motor
with an offset eccentric weight mounted horizontally on one side bracket
of the stand. At the very bottom, a rectangular open-top collection bin/
hopper, dark charcoal steel, sized to catch material falling through the
mesh screen above -- positioned directly beneath the tray. Two small
safety-orange downward-pointing conical or funnel-shaped chutes flanking
the underside of the tray, directing fine material toward the collection
bin. Industrial fabrication look, visible bolted joints, no enclosure
walls -- the mechanism should be visible, not hidden in a cabinet.
```

---

## 6. Automated Outfeed Rewinding Station

```
An automated motorized outfeed rewinding station for collecting finished
strand material onto a take-up drum, roughly 0.9 meters wide, 1.0 meter
deep, 0.7 meters tall, designed to sit on a trailer deck. A low dark
charcoal steel base plate. Two vertical safety-orange tubular steel
support posts rising from the base, spaced apart along the material's feed
direction, between which a single horizontal rewinding drum is mounted on
a spindle -- the drum itself is shown partially wound with beige/tan
fibrous cord material in a neat helical wrap pattern, with safety-orange
disc-shaped end flanges at both ends of the drum, larger in diameter than
the wound material so they contain it. On one side, a spring-loaded
tension-control swing arm: a slender safety-orange steel arm angled up and
outward from a pivot point near the base, with a small chrome/polished
steel pulley wheel at its free end. In front of the drum (the material
infeed side), two small horizontal chrome guide rollers, spaced apart,
that the material passes over before reaching the drum. Compact,
mechanical, functional industrial fabrication -- exposed spindle, visible
bearing housings at the drum ends, no decorative shrouding.
```

---

## Optional: Text-to-Texture prompts (if retexturing an existing mesh)

If you generate geometry elsewhere and want Meshy's Text-to-Texture step
to skin it, these four cover the whole machine's material palette:

**Body panels (charcoal powder-coat steel):**
```
Dark charcoal gray powder-coated industrial steel sheet metal, semi-matte
finish, very subtle fine orange-peel texture typical of powder coating,
faint machined panel seams and countersunk bolt heads, no rust, no
stickers, no logos.
```

**Safety accents (safety-orange powder-coat steel):**
```
Vivid safety-orange (hex FF5A1F) powder-coated steel, semi-matte finish,
subtle orange-peel powder-coat texture, occasional light edge wear
revealing bare steel at high-contact corners, no rust, no stickers.
```

**Bare/brushed steel (rollers, guide bars, spindles):**
```
Brushed galvanized steel, cool gray, fine linear brushing texture aligned
with the part's long axis, moderate reflectivity, light surface oxidation
in recessed areas only.
```

**Rubber (tires, vibration mounts):**
```
Matte black industrial rubber, fine irregular micro-texture, low
reflectivity, no tread pattern unless generating a tire specifically (then
add a simple longitudinal tread groove pattern).
```
