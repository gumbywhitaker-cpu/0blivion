import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Icon from './Icon'

// Technical callout card synced to whichever stage is currently focused
// (by scroll position, hover, or click). Content swaps are eased with a
// short GSAP crossfade rather than a hard cut.
export default function CalloutPanel({ stage }) {
  const ref = useRef(null)
  const contentKey = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!stage) {
      gsap.to(el, { autoAlpha: 0, x: -16, duration: 0.35, ease: 'power2.out' })
      contentKey.current = null
      return
    }

    if (contentKey.current === stage.id) return
    contentKey.current = stage.id

    gsap.fromTo(
      el,
      { autoAlpha: 0, x: -16 },
      { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' }
    )
  }, [stage])

  return (
    <div className="callout" ref={ref} style={{ borderLeftColor: stage?.accent }}>
      {stage && (
        <>
          <div className="callout-index">
            <Icon type={stage.icon} className="icon" />
            Stage 0{stage.index + 1} / 05 &mdash; {stage.tagline}
          </div>
          <h3>{stage.name}</h3>
          <p className="tagline">{stage.tagline}</p>
          <p className="desc">{stage.description}</p>
          <div className="params">
            {stage.params.map((p) => (
              <div className="param-row" key={p.label}>
                <span className="param-label">{p.label}</span>
                <span className="param-value">
                  {p.value}
                  {p.note && <span className="note">{p.note}</span>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
