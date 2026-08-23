# Concept art prompts (image-gen reference)

Not yet generated — the connected image-gen provider reported "out of credits
on free plan" when this batch was submitted, so nothing was rendered or
charged. Kept here so the batch can be re-run later (e.g. via an SDXL/Flux
pipeline, or once provider credits are available) to produce mood-board /
concept-art references for each module. These are standalone product-shot
prompts (isolated studio background) meant as design reference, not tileable
textures — they are not wired into the 3D scene, which is built from
primitive geometry in `src/components/scene/`.

**Universal negative prompt** (apply to all six):

> text, watermark, logo, labels, callouts, arrows, low quality, blurry, distorted geometry, extra limbs, messy wiring, duplicate parts, photo collage, amateur render

**Recommended settings:** DPM++ 2M Karras or Euler a · 28–35 steps · CFG 6.5–7.5 · 1024x1024 (SDXL/Flux) or 768x512 (SD1.5 + Hires fix 1.5x)

## 1. Multi-Spool Infeed Station

> masterpiece, best quality, industrial product photography, multi-spool infeed station for agricultural fiber processing, dual horizontal heavy-duty steel spindle bars holding thick wound twine spools, quick-release locking hubs, cylindrical polished chrome guide rollers, safety guards, high-visibility orange powder-coated tubular steel handrails, dark charcoal metallic frame, mechanical details, studio lighting, clean solid grey background, sharp focus, 8k, octane render, unreal engine 5 render, cinematic lighting

## 2. Compact Thermal Drying Tunnel

> masterpiece, best quality, industrial engineering shot, compact industrial thermal drying tunnel chamber, brushed stainless steel sheet metal body, dark slate grey lower access panel with flush handles, top rectangular exhaust air vent, square service access hatch, red digital seven-segment LED display readout on side, red emergency stop button, modular industrial design, isometric view, isolated on neutral studio background, crisp raytracing reflections, hard surface modeling, 8k

## 3. Counter-Rotating Pulverizing Rollers

> masterpiece, best quality, technical mechanical shot, industrial double roller crusher assembly, two parallel heavy counter-rotating textured steel pulverizing drums, open protective safety frame painted industrial safety orange, mounted electric motor drive and gearbox on side, yellow warning hazard icons, dark anthracite steel chassis, isolated on neutral grey floor, clean studio rim lighting, intricate machine parts, high detail

## 4. Vibrating Shaker Table & Separation Unit

> masterpiece, best quality, industrial machinery render, multi-tier vibrating screen sorting table, stainless steel wire mesh grading sieves mounted on heavy-duty coil damping suspension springs, compact red eccentric vibration motor mounted on side bracket, lower tapered chute feeding into stainless steel collection box, studio lighting, isolated neutral background, crisp mechanical details, 3D CAD style render

## 5. Automated Outfeed Rewinding Station

> masterpiece, best quality, industrial mechanism render, automated motorized outfeed string winder unit, large heavy-duty take-up drum spool holding wound twine, mechanical spring-loaded tension control swing arms, polished chrome guide rollers, safety orange perimeter handrail guard, dark slate grey base frame, integrated electric motor drive, crisp focus, studio lighting, clean background, 8k resolution

## 6. Custom Tandem-Axle Utility Trailer Chassis

> masterpiece, best quality, empty industrial tandem-axle flatbed utility trailer, diamond-plate steel tread plate deck, dual axles with road-legal off-road alloy wheels and black mudguards, front tow hitch with jockey wheel stand, four heavy-duty deployable outrigger stabilizing drop-legs, rear fold-down access steps with orange grab rails, dark charcoal powder-coated steel frame, three-quarter perspective, isolated on clean ground plane, neutral background
