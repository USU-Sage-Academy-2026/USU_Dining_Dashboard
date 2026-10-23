// Fake data shaped like the Neon tables (one row per restaurant / date / hour).
// Column names here are placeholders -- rename them to match your real columns.

export const DATA_START = '2025-09-12';
export const DATA_END = '2026-09-11';
export const RESTAURANTS = ['Restaurant A', 'Restaurant B', 'Restaurant C'];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const BASE_VOLUME = [40, 28, 18];
const HOLIDAYS = new Set(['2025-11-27', '2025-11-28', '2025-12-25', '2026-01-01', '2026-01-19', '2026-05-25']);

const toISO = (d) => d.toISOString().slice(0, 10);

// Every calendar day in the data span. The slider moves across these.
function buildDays() {
  const days = [];
  const d = new Date(`${DATA_START}T00:00:00Z`);
  const end = new Date(`${DATA_END}T00:00:00Z`);
  while (d <= end) {
    days.push(toISO(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}
export const ALL_DAYS = buildDays();

// Seeded random so the fake data is the same on every reload.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lunch (12) and dinner (18) rushes.
const rush = (h) => Math.exp(-((h - 12) ** 2) / 4) + 0.8 * Math.exp(-((h - 18) ** 2) / 3) + 0.1;

function buildRows() {
  const rand = mulberry32(42);
  const rows = [];
  for (const date of ALL_DAYS) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6 || HOLIDAYS.has(date)) continue; // gaps, like the real data
    RESTAURANTS.forEach((restaurant, i) => {
      for (const hour of HOURS) {
        const orders = Math.round(BASE_VOLUME[i] * rush(hour) * (0.8 + 0.4 * rand()));
        const bumpMinutes = 2 + 4 * rush(hour) + (i + 1) * 0.5 + rand();
        rows.push({ restaurant, date, hour, orders, bumpMinutes });
      }
    });
  }
  return rows;
}
const ALL_ROWS = buildRows();

// THE swap point: later, replace the body with a fetch to your backend, e.g.
//   const res = await fetch(`/api/orders?start=${start}&end=${end}`);
//   return res.json();
export async function getOrderData(start, end) {
  await new Promise((resolve) => setTimeout(resolve, 150)); // mimic network delay
  return ALL_ROWS.filter((r) => r.date >= start && r.date <= end);
}
