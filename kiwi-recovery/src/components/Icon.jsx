// Minimal single-path glyphs for the five process types. Kept intentionally
// crude/geometric to match the industrial, signage-like feel of the rest of
// the UI rather than importing an icon library for five shapes.
const PATHS = {
  feed: 'M3 12h11M10 7l5 5-5 5M17 6v12',
  heat: 'M12 3c2 3-2 4-2 7a2 2 0 104 0c0-1-1-1.5-1-3 2 1 3 3 3 5a4 4 0 11-8 0c0-3.5 2.5-5.5 4-9z',
  crush: 'M5 8a3 3 0 016 0 3 3 0 016 0M5 16a3 3 0 016 0 3 3 0 016 0M2 8h20M2 16h20',
  separate: 'M4 6h16M4 6l3 12h10l3-12M9 10h6M10 14h4',
  rewind: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
}

export default function Icon({ type, className }) {
  const d = PATHS[type] || PATHS.feed
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  )
}
