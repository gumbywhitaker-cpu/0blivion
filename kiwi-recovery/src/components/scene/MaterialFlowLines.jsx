import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STAGES } from '../../data/stages'
import { scrollState } from '../../state/scrollState'

const UP = new THREE.Vector3(0, 1, 0)

// Thin safety-orange rods linking consecutive stages, only visible once the
// machine has started to explode — a lightweight, always-cheap stand-in for
// the material path (waste string -> dry -> crush -> grade -> wind).
export default function MaterialFlowLines() {
  const refs = useRef([...Array(STAGES.length - 1)].map(() => ({ mesh: null })))
  const scratchStart = useMemo(() => new THREE.Vector3(), [])
  const scratchEnd = useMemo(() => new THREE.Vector3(), [])
  const scratchDir = useMemo(() => new THREE.Vector3(), [])
  const scratchQuat = useMemo(() => new THREE.Quaternion(), [])

  useFrame(() => {
    const explode = scrollState.explode
    for (let i = 0; i < STAGES.length - 1; i++) {
      const entry = refs.current[i]
      if (!entry.mesh) continue

      const a = STAGES[i]
      const b = STAGES[i + 1]
      scratchStart
        .set(...a.position)
        .add(new THREE.Vector3(...a.explodeOffset).multiplyScalar(explode))
      scratchEnd
        .set(...b.position)
        .add(new THREE.Vector3(...b.explodeOffset).multiplyScalar(explode))

      scratchDir.subVectors(scratchEnd, scratchStart)
      const length = scratchDir.length()
      scratchDir.normalize()

      entry.mesh.position.copy(scratchStart).addScaledVector(scratchDir, length / 2)
      scratchQuat.setFromUnitVectors(UP, scratchDir)
      entry.mesh.quaternion.copy(scratchQuat)
      entry.mesh.scale.set(1, length, 1)
      entry.mesh.material.opacity = THREE.MathUtils.clamp(explode * 1.6 - 0.2, 0, 0.85)
    }
  })

  return (
    <group>
      {STAGES.slice(0, -1).map((stage, i) => (
        <mesh
          key={stage.id}
          ref={(m) => (refs.current[i].mesh = m)}
          scale={[1, 1, 1]}
        >
          <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
          <meshStandardMaterial
            color="#ff5a1f"
            emissive="#ff5a1f"
            emissiveIntensity={1.4}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  )
}
