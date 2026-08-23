import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../state/scrollState'
import { HighlightContext, useNewHighlightRef } from '../../state/HighlightContext'

const DIM_GRAY = new THREE.Color('#3d3f43')

// Wraps one process module: positions it at its home spot on the chassis,
// carries it out to its exploded position as scrollState.explode ramps up,
// and drives the hover/focus highlight (desaturate the rest of the machine,
// bloom this module in safety orange) that both scroll position and direct
// pointer interaction can trigger.
export default function StageGroup({ stage, hoveredId, onHover, onSelect, children }) {
  const explodeRef = useRef()
  const lightRef = useRef()
  const highlightRef = useNewHighlightRef()
  const meshEntries = useRef([])

  useEffect(() => {
    const entries = []
    explodeRef.current?.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.color) {
        entries.push({
          mesh: obj,
          baseColor: obj.material.color.clone(),
          baseEmissive: obj.material.emissiveIntensity ?? 0,
        })
      }
    })
    meshEntries.current = entries
  }, [])

  useFrame((_, delta) => {
    const explode = scrollState.explode
    const [ex, ey, ez] = stage.explodeOffset
    if (explodeRef.current) {
      explodeRef.current.position.set(ex * explode, ey * explode, ez * explode)
    }

    const isScrollActive = scrollState.activeStageIndex === stage.index
    const isHovered = hoveredId === stage.id
    const targetHighlight = isScrollActive || isHovered ? 1 : 0
    highlightRef.current = THREE.MathUtils.damp(highlightRef.current, targetHighlight, 6, delta)
    const h = highlightRef.current

    const someoneElseFocused =
      (scrollState.activeStageIndex !== -1 || hoveredId) && !isScrollActive && !isHovered
    const dimTarget = someoneElseFocused ? 0.75 : 0

    meshEntries.current.forEach(({ mesh, baseColor, baseEmissive }) => {
      const mat = mesh.material
      const prevDim = mat.userData.dim || 0
      const dim = THREE.MathUtils.lerp(prevDim, dimTarget, 0.06)
      mat.userData.dim = dim
      mat.color.copy(baseColor).lerp(DIM_GRAY, dim)
      mat.emissiveIntensity = baseEmissive + h * 1.2
    })

    if (lightRef.current) {
      lightRef.current.intensity = h * 5
    }
  })

  return (
    <group
      position={stage.position}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(stage.id)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover((current) => (current === stage.id ? null : current))
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(stage)
      }}
    >
      <pointLight ref={lightRef} color={stage.accent} intensity={0} distance={3.2} decay={2} />
      <group ref={explodeRef}>
        <HighlightContext.Provider value={highlightRef}>{children}</HighlightContext.Provider>
      </group>
    </group>
  )
}
