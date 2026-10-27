import { STAGES } from '../data/stages'

// Always-available quick access to every stage, independent of current
// scroll position — satisfies "hover/click a stage even when scrolled
// elsewhere" without needing a second interaction system in the 3D view.
export default function ScrollNav({ activeIndex, onNavigate, railRef, navRef }) {
  return (
    <>
      <div className="progress-rail" ref={railRef}>
        {STAGES.map((s) => (
          <div
            key={s.id}
            className={`dot-row${activeIndex === s.index ? ' active' : ''}`}
            onClick={() => onNavigate(s)}
          >
            <span className="dot-label">{s.name}</span>
            <span className="dot" />
          </div>
        ))}
      </div>

      <div className="stage-nav" ref={navRef}>
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={activeIndex === s.index ? 'active' : ''}
            onClick={() => onNavigate(s)}
          >
            <span className="num">0{s.index + 1}</span>
            {s.name}
          </button>
        ))}
      </div>
    </>
  )
}
