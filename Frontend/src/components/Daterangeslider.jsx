import { useEffect, useState } from 'react';

const fmt = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

// days:     array of ISO date strings, one per slider position
// value:    [startIndex, endIndex] currently applied to the charts
// onCommit: called with the new [startIndex, endIndex] when the user lets go
export default function DateRangeSlider({ days, value, onCommit }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const max = days.length - 1;
  const [lo, hi] = draft;
  const commit = () => onCommit(draft);

  return (
    <div className="range-slider">
      <p className="range-label" aria-live="polite">
        {fmt(days[lo])} to {fmt(days[hi])}
      </p>
      <div className="range-control">
        <div className="range-track" />
        <div
          className="range-fill"
          style={{ left: `${(lo / max) * 100}%`, right: `${100 - (hi / max) * 100}%` }}
        />
        <input
          type="range"
          aria-label="Start date"
          min={0}
          max={max}
          value={lo}
          style={{ zIndex: lo > max / 2 ? 5 : 3 }}
          onChange={(e) => setDraft([Math.min(Number(e.target.value), hi), hi])}
          onPointerUp={commit}
          onKeyUp={commit}
        />
        <input
          type="range"
          aria-label="End date"
          min={0}
          max={max}
          value={hi}
          style={{ zIndex: 4 }}
          onChange={(e) => setDraft([lo, Math.max(Number(e.target.value), lo)])}
          onPointerUp={commit}
          onKeyUp={commit}
        />
      </div>
      <div className="range-ends">
        <span>{fmt(days[0])}</span>
        <span>{fmt(days[max])}</span>
      </div>
    </div>
  );
}
