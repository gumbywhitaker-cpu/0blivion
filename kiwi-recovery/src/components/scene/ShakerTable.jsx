import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHighlightRef } from '../../state/HighlightContext'

const STEEL_DARK = '#24262b'
const BODY = '#3a3d44'
const ORANGE = '#ff5a1f'
const MESH_COLOR = '#8a8d92'

function useMeshTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#54575c'
    ctx.fillRect(0, 0, 64, 64)
    ctx.strokeStyle = '#2a2c30'
    ctx.lineWidth = 2
    for (let i = 0; i <= 64; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 64)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(64, i)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 3)
    return tex
  }, [])
}

function Spring({ x, z }) {
  return (
    <mesh position={[x, -0.32, z]} castShadow>
      <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
      <meshStandardMaterial color="#6a6d72" roughness={0.4} metalness={0.7} />
    </mesh>
  )
}

// Tiered vibrating mesh screen for grading. The whole tray jitters at low
// amplitude constantly, and harder while its stage is focused.
export default function ShakerTable() {
  const trayRef = useRef()
  const meshTex = useMeshTexture()
  const highlightRef = useHighlightRef()

  useFrame(({ clock }) => {
    if (!trayRef.current) return
    const t = clock.getElapsedTime()
    const amp = 0.004 + highlightRef.current * 0.018
    trayRef.current.position.x = Math.sin(t * 40) * amp
    trayRef.current.position.z = Math.cos(t * 37) * amp * 0.6
  })

  return (
    <group>
      {/* collection bin below */}
      <mesh position={[0, -0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.28, 0.7]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* vibration motor */}
      <mesh position={[0.5, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.5} />
      </mesh>

      <Spring x={0.38} z={0.28} />
      <Spring x={-0.38} z={0.28} />
      <Spring x={0.38} z={-0.28} />
      <Spring x={-0.38} z={-0.28} />

      {/* tiered mesh screen tray */}
      <group ref={trayRef}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.08, 0.75]} />
          <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <planeGeometry args={[0.85, 0.65]} />
          <meshStandardMaterial color={MESH_COLOR} map={meshTex} roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.06, 0.6]} />
          <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.4} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* fine-material chute markers */}
      {[0.42, -0.42].map((z) => (
        <mesh key={z} position={[0, -0.34, z]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.12, 4]} />
          <meshStandardMaterial color={ORANGE} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
