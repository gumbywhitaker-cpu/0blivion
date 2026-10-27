// Mutable, non-reactive store for the scroll-driven scene.
//
// GSAP's ScrollTrigger fires onUpdate on nearly every frame while scrubbing.
// Routing that through React state would re-render the whole tree constantly,
// so the raw scroll progress lives here and R3F components read it directly
// inside useFrame. React state is only touched for the handful of values the
// DOM overlay actually needs (active stage, hero visibility), and only when
// they change.

export const scrollState = {
  progress: 0, // 0..1 across the pinned hero->rewind timeline
  explode: 0, // 0..1 how far the machine has separated
  activeStageIndex: -1, // -1 = hero, 0..4 = STAGES index
}

const listeners = new Set()

export function subscribeActiveStage(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setActiveStageIndex(index) {
  if (scrollState.activeStageIndex === index) return
  scrollState.activeStageIndex = index
  listeners.forEach((fn) => fn(index))
}

// Separate, React-friendly store for user-driven focus (hover/click), which
// can momentarily disagree with scroll position.
export const interactionState = {
  hoveredStageId: null,
}
