import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import MachineScene from './components/scene/MachineScene'
import HeroOverlay from './components/HeroOverlay'
import CalloutPanel from './components/CalloutPanel'
import ScrollNav from './components/ScrollNav'
import Outro from './components/Outro'
import { STAGES, STAGE_COUNT } from './data/stages'
import { scrollState, setActiveStageIndex, subscribeActiveStage } from './state/scrollState'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// One keyframe per stage plus the hero beat = STAGE_COUNT + 1 points along
// the scroll-driven camera path (see CameraRig). Scroll progress is divided
// into that many equal segments; the nearest keyframe is the "active" stage.
const SEGMENTS = STAGE_COUNT

export default function App() {
  const pinRef = useRef(null)
  const heroRef = useRef(null)
  const scrollCueRef = useRef(null)
  const stickyLabelRef = useRef(null)
  const railRef = useRef(null)
  const navRef = useRef(null)

  const [hoveredId, setHoveredId] = useState(null)
  const [scrollActiveStage, setScrollActiveStage] = useState(null)

  // Hover always wins visually in the 3D view; otherwise fall back to
  // whichever stage the scroll position currently frames.
  const hoveredStage = hoveredId ? STAGES.find((s) => s.id === hoveredId) : null
  const displayedStage = hoveredStage || scrollActiveStage

  useEffect(() => {
    const unsub = subscribeActiveStage((index) => {
      setScrollActiveStage(index >= 0 ? STAGES[index] : null)
    })
    return unsub
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinRef.current,
        start: 'top top',
        end: () => '+=' + window.innerHeight * 6,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate(self) {
          const p = self.progress
          scrollState.progress = p
          scrollState.explode = Math.min(1, p / 0.1)

          const raw = Math.round(p * SEGMENTS)
          const stageIdx = Math.min(STAGE_COUNT - 1, Math.max(-1, raw - 1))
          setActiveStageIndex(stageIdx)

          const heroFade = 1 - Math.min(1, p / 0.045)
          if (heroRef.current) {
            heroRef.current.style.opacity = heroFade
            heroRef.current.style.transform = `translateY(${-30 * (1 - heroFade)}px)`
          }
          if (scrollCueRef.current) scrollCueRef.current.style.opacity = heroFade

          const chromeIn = Math.min(1, Math.max(0, (p - 0.02) / 0.05))
          if (stickyLabelRef.current) stickyLabelRef.current.style.opacity = chromeIn
          if (railRef.current) railRef.current.style.opacity = chromeIn
          if (navRef.current) navRef.current.style.opacity = chromeIn
        },
      })
    }, pinRef)

    return () => ctx.revert()
  }, [])

  const handleNavigate = useCallback((stage) => {
    const trigger = ScrollTrigger.getAll()[0]
    if (!trigger) return
    const u = (stage.index + 1) / SEGMENTS
    const targetY = trigger.start + u * (trigger.end - trigger.start)
    gsap.to(window, {
      scrollTo: targetY,
      duration: 1.1,
      ease: 'power2.inOut',
    })
  }, [])

  return (
    <>
      <div className="scroll-track" ref={pinRef}>
        <div className="canvas-stage">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ fov: 38, near: 0.1, far: 100 }}
            gl={{ antialias: true, toneMappingExposure: 1.4 }}
          >
            <MachineScene hoveredId={hoveredId} onHover={setHoveredId} onSelect={handleNavigate} />
          </Canvas>

          <div className="hud">
            <HeroOverlay heroRef={heroRef} scrollCueRef={scrollCueRef} stickyLabelRef={stickyLabelRef} />
            <ScrollNav
              activeIndex={scrollActiveStage?.index ?? -1}
              onNavigate={handleNavigate}
              railRef={railRef}
              navRef={navRef}
            />
            <CalloutPanel stage={displayedStage} />
          </div>
        </div>
      </div>

      <Outro />
    </>
  )
}
