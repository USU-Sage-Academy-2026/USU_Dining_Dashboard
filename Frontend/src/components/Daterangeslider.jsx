import { useState } from "react";

const fmt = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

export default function DateRangeSlider({ days, value, onCommit }) {
  const [draft, setDraft] = useState(value);
  if (!days?.length) return null;
  const max = Math.max(0, days.length - 1);
  const [lo, hi] = draft;
  const commit = () => onCommit(draft);
  const left = max ? (lo / max) * 100 : 0;
  const right = max ? 100 - (hi / max) * 100 : 0;

  return (
    <div className="range-slider">
      <p className="range-label" aria-live="polite">{fmt(days[lo])} to {fmt(days[hi])}</p>
      <div className="range-control">
        <div className="range-track" />
        <div className="range-fill" style={{ left: `${left}%`, right: `${right}%` }} />
        <input type="range" aria-label="Start date" min={0} max={max} value={lo}
          style={{ zIndex: lo > max / 2 ? 5 : 3 }}
          onChange={(event) => setDraft([Math.min(Number(event.target.value), hi), hi])}
          onPointerUp={commit} onKeyUp={commit} disabled={max === 0} />
        <input type="range" aria-label="End date" min={0} max={max} value={hi}
          style={{ zIndex: 4 }}
          onChange={(event) => setDraft([lo, Math.max(Number(event.target.value), lo)])}
          onPointerUp={commit} onKeyUp={commit} disabled={max === 0} />
      </div>
      <div className="range-ends"><span>{fmt(days[0])}</span><span>{fmt(days[max])}</span></div>
    </div>
  );
}