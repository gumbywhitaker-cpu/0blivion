import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useHighlightRef } from '../../state/HighlightContext'

const BODY = '#3a3d44'
const STEEL_DARK = '#24262b'
const ORANGE = '#ff5a1f'
const ROLLER = '#3a3d43'

function Roller({ y, direction }) {
  const spinRef = useRef()
  const highlightRef = useHighlightRef()

  useFrame((_, delta) => {
    if (!spinRef.current) return
    const speed = 0.4 + highlightRef.current * 3.2
    spinRef.current.rotation.y += direction * speed * delta
  })

  return (
    <group position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh ref={spinRef} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.85, 20]} />
        <meshStandardMaterial color={ROLLER} roughness={0.75} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  )
}

// Twin counter-rotating pulverizing rollers inside a shielded housing.
export default function PulverizingRollers() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 1.0, 1.0]} />
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* maintenance access + safety shield */}
      <mesh position={[0, -0.05, 0.51]}>
        <boxGeometry args={[0.75, 0.7, 0.02]} />
        <meshStandardMaterial
          color={ORANGE}
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.22}
        />
      </mesh>

      <Roller y={0.18} direction={1} />
      <Roller y={-0.18} direction={-1} />

      {/* motor housing */}
      <mesh position={[0.62, -0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 16]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.5} metalness={0.7} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0.62, -0.1, -0.12 + i * 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.01, 16]} />
          <meshStandardMaterial color="#0d0e10" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* warning decal */}
      <mesh position={[-0.34, 0.32, 0.511]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.07, 0.07, 3]} />
        <meshStandardMaterial color="#ffb800" emissive="#ffb800" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
