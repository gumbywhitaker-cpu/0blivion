import { useMemo } from 'react'
import * as THREE from 'three'

const STEEL = new THREE.Color('#3d4046')
const STEEL_DARK = new THREE.Color('#24262b')
const ORANGE = new THREE.Color('#ff5a1f')
const RUBBER = new THREE.Color('#111214')

function Wheel({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.28, 20]} />
        <meshStandardMaterial color={RUBBER} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#8a8d92" roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  )
}

// The flatbed trailer that carries every processing module. Static — it
// never separates in the exploded view, it's the spine everything else is
// measured against, matching the reference photo's ~6.5 m x <2 m envelope.
export default function Chassis() {
  const railMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.35, metalness: 0.5 }),
    []
  )

  return (
    <group>
      {/* deck */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.4, 0.14, 1.9]} />
        <meshStandardMaterial color="#3a3d43" roughness={0.55} metalness={0.6} />
      </mesh>

      {/* main chassis rails */}
      <mesh position={[0, 0.46, 0.78]} castShadow>
        <boxGeometry args={[9.2, 0.18, 0.12]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.46, -0.78]} castShadow>
        <boxGeometry args={[9.2, 0.18, 0.12]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* tow hitch */}
      <mesh position={[-5.1, 0.42, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.1]} />
        <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[-5.7, 0.34, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={ORANGE} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* axles + wheels */}
      <mesh position={[1.1, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.9, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[2.1, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.9, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.7} />
      </mesh>
      <Wheel position={[1.1, 0.42, 1.0]} />
      <Wheel position={[1.1, 0.42, -1.0]} />
      <Wheel position={[2.1, 0.42, 1.0]} />
      <Wheel position={[2.1, 0.42, -1.0]} />

      {/* stabilizer legs */}
      {[-4.3, 3.9].map((x) => (
        <group key={x} position={[x, 0.3, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
            <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.14, 0.03, 0.14]} />
            <meshStandardMaterial color={STEEL_DARK} roughness={0.6} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* safety-orange guard rail along the walking clearance edge */}
      <mesh position={[0.6, 1.0, 0.95]} material={railMat} castShadow>
        <boxGeometry args={[8.6, 0.05, 0.05]} />
      </mesh>
      {[-3.6, -1.6, 0.4, 2.4, 4.4].map((x) => (
        <mesh key={x} position={[x, 0.82, 0.95]} material={railMat} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.05]} />
        </mesh>
      ))}
    </group>
  )
}
