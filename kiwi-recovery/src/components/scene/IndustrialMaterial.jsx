import { useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import { ENABLE_PBR_TEXTURES } from '../../config'

// One named set = one folder under public/textures/<name>/ with
// basecolor.jpg + normal.jpg + roughness.jpg. See PBR_TEXTURES.md for
// exactly what to download and where to put it.
const SETS = {
  'brushed-steel': { repeat: [2, 2] },
  'tread-plate': { repeat: [6, 2] },
  rubber: { repeat: [1, 1] },
}

// Only ever mounted when ENABLE_PBR_TEXTURES is true (see IndustrialMaterial
// below), so useTexture is always called unconditionally here -- keeping the
// on/off branch out of this component (rather than inside it) is what keeps
// the hook call itself unconditional and rules-of-hooks-clean.
function TexturedMaterial({ name, ...materialProps }) {
  const [map, normalMap, roughnessMap] = useTexture([
    `/textures/${name}/basecolor.jpg`,
    `/textures/${name}/normal.jpg`,
    `/textures/${name}/roughness.jpg`,
  ])

  useEffect(() => {
    // Configuring wrap/repeat/colorSpace on a loaded three.js texture after
    // the fact is the standard drei/three idiom -- not accidental state
    // mutation, so silence the generic "don't mutate hook results" rule.
    // oxlint-disable-next-line react/immutability
    const { repeat } = SETS[name]
    for (const tex of [map, normalMap, roughnessMap]) {
      tex.wrapS = tex.wrapT = RepeatWrapping
      tex.repeat.set(...repeat)
      tex.needsUpdate = true
    }
    map.colorSpace = SRGBColorSpace
  }, [name, map, normalMap, roughnessMap])

  return <meshStandardMaterial map={map} normalMap={normalMap} roughnessMap={roughnessMap} {...materialProps} />
}

// Drop-in replacement for <meshStandardMaterial color={fallbackColor} .../>
// that renders real tiled PBR maps once ENABLE_PBR_TEXTURES is flipped on
// and the files listed in PBR_TEXTURES.md exist -- until then, the flat
// fallback color keeps the build working with zero missing-file risk.
export function IndustrialMaterial({ name, fallbackColor, ...materialProps }) {
  if (!ENABLE_PBR_TEXTURES) {
    return <meshStandardMaterial color={fallbackColor} {...materialProps} />
  }
  return <TexturedMaterial name={name} {...materialProps} />
}
