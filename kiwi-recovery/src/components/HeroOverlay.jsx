export default function HeroOverlay({ heroRef, scrollCueRef, stickyLabelRef }) {
  return (
    <>
      <div className="brandmark">
        <div className="mark">
          Kiwi<span>String</span>Recovery
        </div>
        <div className="sub">Orchard Waste Processing</div>
      </div>

      <div className="sticky-label" ref={stickyLabelRef} style={{ opacity: 0 }}>
        Kiwifruit Waste String <b>Recovery System</b>
      </div>

      <div className="hero-copy" ref={heroRef}>
        <div className="eyebrow">Digital Twin &middot; Investor Preview</div>
        <h1>Kiwifruit Waste String Recovery System</h1>
        <p>
          A single trailer-mounted line that turns tangled orchard waste string into
          dry, sized, and wound material &mdash; ready to transport, store, or resell.
          Scroll to see it come apart.
        </p>
      </div>

      <div className="scroll-cue" ref={scrollCueRef}>
        <span>Scroll</span>
        <span className="stem" />
      </div>
    </>
  )
}
