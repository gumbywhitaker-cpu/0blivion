import { createContext, useContext, useRef } from 'react'

// A mutable ref shared from StageGroup down to its geometry children so
// per-stage animations (roller spin, shaker jitter, rewinder winding) can
// react to "is this stage focused" every frame without going through React
// state / re-renders.
export const HighlightContext = createContext({ current: 0 })

export function useHighlightRef() {
  return useContext(HighlightContext)
}

export function useNewHighlightRef() {
  return useRef(0)
}
