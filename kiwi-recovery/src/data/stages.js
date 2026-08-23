// Single source of truth for the five process stages.
// Positions are in scene units (~1 unit = 1 metre) and match the
// left-to-right material flow of the reference photograph:
// infeed -> drying tunnel -> pulverizing rollers -> shaker table -> rewinder.
//
// Each stage's camera keyframe frames the EXPLODED position (position +
// explodeOffset), not the assembled one -- by the time the scroll timeline
// settles on a stage, the machine has already finished separating, so a
// camera aimed at the assembled position would be looking at empty air (and
// clipping through whatever now occupies its old spot).

const addVec = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

const RAW_STAGES = [
  {
    id: 'infeed',
    icon: 'feed',
    name: 'Infeed',
    tagline: 'Material entry & control',
    position: [-4.6, 0.95, 0],
    explodeOffset: [-0.4, 1.1, -0.6],
    cameraBias: [0.4, 0.5, 3.2],
    accent: '#ff5a1f',
    description:
      'Raw kiwifruit waste string comes straight off the orchard post and is loaded onto the multi-spool infeed. Quick-release hubs and adjustable guides let one operator feed continuous string without manual untangling.',
    params: [
      { label: 'Spool capacity', value: '4 x 40 kg', note: 'placeholder' },
      { label: 'Feed rate', value: '~180 m/min', note: 'placeholder' },
      { label: 'Operator count', value: '1' },
    ],
  },
  {
    id: 'drying',
    icon: 'heat',
    name: 'Drying Tunnel',
    tagline: 'Moisture removal',
    position: [-2.15, 1.15, 0],
    explodeOffset: [0, 1.35, 0.9],
    cameraBias: [0, 0.45, 3.4],
    accent: '#ff6a00',
    description:
      'A compact thermal tunnel runs the string through a controlled 60-80°C airflow, driving out field moisture so the material stops clumping before it hits the rollers.',
    params: [
      { label: 'Operating temp', value: '60-80°C' },
      { label: 'Dwell time', value: '~45 sec', note: 'placeholder' },
      { label: 'Airflow', value: 'Closed-loop, filtered', note: 'placeholder' },
    ],
  },
  {
    id: 'pulverize',
    icon: 'crush',
    name: 'Pulverizing Rollers',
    tagline: 'Size reduction',
    position: [0, 1.15, 0],
    explodeOffset: [0.1, 1.45, -1.0],
    cameraBias: [0.2, 0.45, 3.8],
    accent: '#ff5a1f',
    description:
      'Dried string is drawn between counter-rotating pulverizing rollers, breaking long fibrous lengths into a manageable, uniform crumb ready for grading.',
    params: [
      { label: 'Roller speed', value: '~120 rpm', note: 'placeholder' },
      { label: 'Output size', value: '< 15 mm', note: 'placeholder' },
      { label: 'Throughput', value: '~250 kg/hr', note: 'placeholder' },
    ],
  },
  {
    id: 'shaker',
    icon: 'separate',
    name: 'Shaker Table',
    tagline: 'Grading & separation',
    position: [1.95, 1.55, 0],
    explodeOffset: [0.3, 1.3, 1.0],
    cameraBias: [0.15, 0.4, 3.4],
    accent: '#ff6a00',
    description:
      'A 2-3 tier vibrating mesh screen separates fines from usable crumb, evening out particle distribution and dropping unwanted debris clear of the clean stream.',
    params: [
      { label: 'Screen tiers', value: '2-3, interchangeable' },
      { label: 'Vibration freq.', value: '~50 Hz', note: 'placeholder' },
      { label: 'Fines reject', value: '< 5%', note: 'placeholder' },
    ],
  },
  {
    id: 'rewind',
    icon: 'rewind',
    name: 'Rewinder',
    tagline: 'Collection & output',
    position: [3.85, 1.25, 0],
    explodeOffset: [0.5, 1.15, -0.8],
    cameraBias: [0.3, 0.4, 3.4],
    accent: '#ff5a1f',
    description:
      'Graded material is automatically wound and tensioned onto take-up drums, producing a dense, transport-ready output that drops handling and storage cost downstream.',
    params: [
      { label: 'Output form', value: 'Wound coil / baled', note: 'placeholder' },
      { label: 'Tension control', value: 'Powered, auto-regulated' },
      { label: 'Cycle time', value: '~6 min/coil', note: 'placeholder' },
    ],
  },
]

export const STAGES = RAW_STAGES.map((stage, index) => {
  const exploded = addVec(stage.position, stage.explodeOffset)
  return {
    ...stage,
    index,
    camera: {
      position: addVec(exploded, stage.cameraBias),
      lookAt: exploded,
    },
  }
})

export const STAGE_COUNT = STAGES.length

// Camera framing for the opening hero beat, before any stage is active
// (the machine is still fully assembled at this point).
export const HERO_CAMERA = {
  position: [0.4, 2.35, 9.4],
  lookAt: [0.2, 1.1, 0],
}
