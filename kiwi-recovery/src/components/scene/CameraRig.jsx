import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { STAGES, HERO_CAMERA } from '../../data/stages'
import { scrollState } from '../../state/scrollState'

// A single continuous camera path (position + look-at) running through the
// hero framing and each of the five stages in process order, so the viewer
// is always moved deliberately along the machine rather than "teleported."
export default function CameraRig() {
  const { camera } = useThree()

  const { posPath, lookPath } = useMemo(() => {
    const posPoints = [new THREE.Vector3(...HERO_CAMERA.position)]
    const lookPoints = [new THREE.Vector3(...HERO_CAMERA.lookAt)]
    STAGES.forEach((s) => {
      posPoints.push(new THREE.Vector3(...s.camera.position))
      lookPoints.push(new THREE.Vector3(...s.camera.lookAt))
    })
    return {
      posPath: new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.2),
      lookPath: new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.2),
    }
  }, [])

  useFrame(({ clock }) => {
    const u = THREE.MathUtils.clamp(scrollState.progress, 0, 1)
    // getPoint (not getPointAt/arc-length) so u divides evenly across the
    // 6 keyframes regardless of the very different distances between them
    // -- the hero->infeed leg is much longer than any inter-stage leg.
    const pos = posPath.getPoint(u)
    const look = lookPath.getPoint(u)

    // subtle idle drift near the hero beat only, so the machine feels alive
    // before the user starts scrolling
    const idleAmount = 1 - THREE.MathUtils.smoothstep(u, 0, 0.06)
    const t = clock.getElapsedTime()
    const driftX = Math.sin(t * 0.18) * 0.35 * idleAmount
    const driftY = Math.sin(t * 0.13) * 0.12 * idleAmount

    camera.position.set(pos.x + driftX, pos.y + driftY, pos.z)
    camera.lookAt(look.x + driftX * 0.4, look.y, look.z)
  })

  return null
}
