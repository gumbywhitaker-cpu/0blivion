// Flip to true once the PBR texture files listed in
// PBR_TEXTURES.md exist under public/textures/. Off by default so the
// build never depends on files that may not be present yet -- flat
// MeshStandardMaterial colors are the safe fallback.
export const ENABLE_PBR_TEXTURES = false
