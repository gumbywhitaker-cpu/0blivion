import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { useHighlightRef } from '../../state/HighlightContext'
import { IndustrialMaterial } from './IndustrialMaterial'

const BODY = '#3a3d44'
const PANEL = '#24262b'
const ORANGE = '#ff5a1f'

function useReadoutTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0a0b0c'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ff5a1f'
    ctx.lineWidth = 4
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    ctx.fillStyle = '#ff7a3d'
    ctx.font = '700 40px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('60-80°C', canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

// Compact thermal drying tunnel. Local origin sits at the tunnel's centre.
export default function DryingTunnel() {
  const readout = useReadoutTexture()
  const glowRef = useRef()
  const highlightRef = useHighlightRef()

  useFrame(({ clock }) => {
    if (!glowRef.current) return
    const t = clock.getElapsedTime()
    const h = highlightRef.current
    const pulse = 0.5 + Math.sin(t * 1.6) * 0.5
    glowRef.current.material.emissiveIntensity = 0.4 + pulse * 0.6 + h * 1.6
  })

  return (
    <group>
      <RoundedBox args={[1.7, 0.95, 1.15]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <IndustrialMaterial name="brushed-steel" fallbackColor={BODY} roughness={0.45} metalness={0.55} />
      </RoundedBox>

      {/* removable access panel */}
      <mesh position={[0, 0.1, 0.581]}>
        <boxGeometry args={[0.55, 0.5, 0.02]} />
        <meshStandardMaterial color={PANEL} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* exhaust vent */}
      <mesh position={[0.2, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.1, 16]} />
        <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* internal heat glow visible through the seam */}
      <mesh ref={glowRef} position={[0, -0.05, 0.585]}>
        <boxGeometry args={[0.62, 0.06, 0.01]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.6} />
      </mesh>

      {/* temperature readout */}
      <mesh position={[-0.45, -0.1, 0.581]}>
        <planeGeometry args={[0.4, 0.15]} />
        <meshStandardMaterial map={readout} emissive="#ff7a3d" emissiveIntensity={0.35} />
      </mesh>

      {/* control panel + power indicator */}
      <mesh position={[-0.45, -0.32, 0.581]}>
        <boxGeometry args={[0.4, 0.14, 0.015]} />
        <meshStandardMaterial color={PANEL} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-0.58, -0.32, 0.59]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}
