import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'

// A soft point light that rides just off the camera, so whatever module the
// scroll timeline is currently framing stays readable regardless of which
// way the camera is looking — a common product-shot trick standing in for a
// full multi-rig relighting pass per stage.
function CameraFill() {
  const ref = useRef()
  const { camera } = useThree()
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.copy(camera.position)
  })
  return <pointLight ref={ref} intensity={38} distance={14} decay={2} color="#eef2f8" />
}

// Soft key + cool rim + warm bounce, tuned for a dark "product event" stage.
// Environment gives the brushed-metal panels believable reflections without
// needing baked HDRs of our own (built from procedural Lightformers so there
// is zero network dependency).
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#8b93a0" />
      <hemisphereLight args={['#c9d4e4', '#0a0a0c', 0.85]} />

      <directionalLight
        position={[6, 9, 6]}
        intensity={5.5}
        color="#fff6ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0003}
      />

      <directionalLight position={[-8, 4, -6]} intensity={1.6} color="#5b7bff" />

      <spotLight
        position={[-2, 6, -3]}
        angle={0.5}
        penumbra={1}
        intensity={10}
        color="#ff7a3d"
        distance={20}
      />

      <CameraFill />

      <Environment resolution={256}>
        <Lightformer intensity={2.6} color="#e9edf5" position={[0, 5, -6]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.6} color="#ffb98a" position={[-6, 2, 3]} scale={[4, 6, 1]} rotation-y={Math.PI / 3} />
        <Lightformer intensity={1.2} color="#5b7bff" position={[6, 1, -2]} scale={[4, 6, 1]} rotation-y={-Math.PI / 3} />
        <Lightformer intensity={1.4} color="#f4f4f2" position={[0, 3, 6]} scale={[6, 3, 1]} rotation-y={Math.PI} />
        <Lightformer intensity={1} color="#20222a" form="ring" position={[0, -4, 0]} scale={10} />
      </Environment>

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={22}
        blur={2.2}
        far={4}
        resolution={1024}
        color="#000000"
      />

      <fog attach="fog" args={['#0a0b0d', 14, 36]} />
    </>
  )
}
