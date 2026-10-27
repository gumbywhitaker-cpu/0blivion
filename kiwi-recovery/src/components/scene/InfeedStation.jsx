import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useHighlightRef } from '../../state/HighlightContext'

const STEEL = '#2c2f34'
const ORANGE = '#ff5a1f'
const STRING = '#c9b083'

function Spool({ z }) {
  const ribbonRef = useRef()
  const highlightRef = useHighlightRef()

  useFrame(({ clock }) => {
    if (!ribbonRef.current) return
    const t = clock.getElapsedTime()
    const h = highlightRef.current
    // gentle "material feeding forward" cue when this stage is in focus
    ribbonRef.current.position.x = 0.55 + Math.sin(t * 2.4) * 0.03 * h
    ribbonRef.current.material.opacity = 0.25 + h * 0.55
  })

  return (
    <group position={[-0.25, 0, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.42, 24]} />
        <meshStandardMaterial color={STRING} roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.36, 0.36, 0.03, 24]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.22]}>
        <cylinderGeometry args={[0.36, 0.36, 0.03, 24]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>
      {/* animated feed ribbon suggesting string entering the machine */}
      <mesh ref={ribbonRef}>
        <boxGeometry args={[0.5, 0.02, 0.02]} />
        <meshStandardMaterial
          color={ORANGE}
          emissive={ORANGE}
          emissiveIntensity={1.2}
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  )
}

// Multi-spool infeed: the point of entry for raw waste string. Local
// coordinates are centered on the assembly; StageGroup places it on chassis.
export default function InfeedStation() {
  return (
    <group>
      {/* base plate */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.06, 1.0]} />
        <meshStandardMaterial color={STEEL} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* A-frame stand */}
      {[0.42, -0.42].map((z) => (
        <mesh key={z} position={[0.1, 0.05, z]} castShadow>
          <boxGeometry args={[0.05, 0.55, 0.05]} />
          <meshStandardMaterial color={ORANGE} roughness={0.35} metalness={0.55} />
        </mesh>
      ))}
      <mesh position={[0.1, 0.32, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.94]} />
        <meshStandardMaterial color={ORANGE} roughness={0.35} metalness={0.55} />
      </mesh>

      <Spool z={0.28} />
      <Spool z={-0.28} />

      {/* safety guide rollers */}
      {[0.28, -0.28].map((z) => (
        <mesh key={z} rotation={[Math.PI / 2, 0, 0]} position={[0.62, 0, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 12]} />
          <meshStandardMaterial color="#8a8d92" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* safety guard cage, laser-cut look */}
      <mesh position={[-0.15, 0.28, 0]}>
        <boxGeometry args={[0.03, 0.5, 0.9]} />
        <meshStandardMaterial
          color={ORANGE}
          roughness={0.5}
          metalness={0.3}
          transparent
          opacity={0.16}
        />
      </mesh>
    </group>
  )
}
