import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHighlightRef } from '../../state/HighlightContext'

const STEEL_DARK = '#24262b'
const ORANGE = '#ff5a1f'

function useWoundTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 32
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#c9b083'
    ctx.fillRect(0, 0, 128, 32)
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 2
    for (let i = 0; i < 128; i += 6) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 32)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.repeat.set(6, 1)
    return tex
  }, [])
}

// Automated outfeed rewinding station: winds finished material onto a drum.
export default function Rewinder() {
  const drumRef = useRef()
  const highlightRef = useHighlightRef()
  const woundTex = useWoundTexture()

  useFrame((_, delta) => {
    if (!drumRef.current) return
    const speed = 0.35 + highlightRef.current * 2.2
    drumRef.current.rotation.x += speed * delta
  })

  return (
    <group>
      {/* base + posts */}
      <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.06, 1.05]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.55} metalness={0.55} />
      </mesh>
      {[0.42, -0.42].map((z) => (
        <mesh key={z} position={[0.3, -0.02, z]} castShadow>
          <boxGeometry args={[0.05, 0.68, 0.05]} />
          <meshStandardMaterial color={ORANGE} roughness={0.35} metalness={0.55} />
        </mesh>
      ))}

      {/* rewinding drum, wound material */}
      <mesh
        ref={drumRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0.3, -0.02, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.26, 0.26, 0.72, 28]} />
        <meshStandardMaterial map={woundTex} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.3, -0.02, 0.37]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 28]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.3, -0.02, -0.37]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 28]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* tension control arm */}
      <mesh position={[-0.35, 0.1, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.4, 0.03, 0.03]} />
        <meshStandardMaterial color={ORANGE} roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[-0.5, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
        <meshStandardMaterial color="#8a8d92" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* guide rollers leading into the drum */}
      {[-0.75, -0.55].map((x, i) => (
        <mesh key={x} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.02 - i * 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.65, 16]} />
          <meshStandardMaterial color="#8a8d92" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
