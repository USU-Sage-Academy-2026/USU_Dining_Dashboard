import { useEffect, useMemo, useState } from 'react';
import 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';
import DateRangeSlider from './Daterangeslider';
import './Diningcharts.css';

const COLORS = ['#0F2439', '#2E7DB5', '#E08A00'];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}



export default function DiningCharts({ selected, orderMethod }) {
  // state declarations
  const [days, setDays] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [range, setRange] = useState([0, 0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [excludeOutliers, setExcludeOutliers] = useState(false);

  // Load the available dates and restaurant names once.
  useEffect(() => {
    fetchJson('/api/order-meta/')
      .then((meta) => {
        setDays(meta.days);
        setRestaurants(meta.restaurants);
        const last = meta.days.length - 1;
        setRange([Math.max(0, last - 6), last]); // default: most recent 7 days
      })
      .catch((err) => setError(err.message));
  }, []);

  const start = days[range[0]];
  const end = days[range[1]];

  // Requesting Order Data From Django
  useEffect(() => {
    if (!start || !end) return;
    let cancelled = false; // ignore a slow response if the range changed again
    setLoading(true);
       fetchJson(`/api/order-data/?start=${start}&end=${end}&method=${orderMethod}&outliers=${excludeOutliers ? 'exclude' : 'include'}`)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [start, end, orderMethod, excludeOutliers]);
  
  // 1. Average bump time by hour
  const bumpChartData = useMemo(() => {
    const hours = Array.from(new Set(rows.map((r) => r.hour)))
      .map(Number)
      .sort((a, b) => a - b);

    const datasets = restaurants.map((name, i) => {
      const byHour = {};
      rows
        .filter((r) => r.restaurant === name)
        .forEach((r) => {
          const h = (byHour[r.hour] ??= { orders: 0, weighted: 0 });
          h.orders += r.orders;
          h.weighted += r.orders * r.bumpMinutes;
        });

      return {
        label: name,
        data: hours.map((h) =>
          byHour[h] ? +(byHour[h].weighted / byHour[h].orders).toFixed(2) : null
        ),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length],
        tension: 0.2,
        spanGaps: true,
      };
    })
    .filter((d) => selected.includes(d.label));

    return { labels: hours, datasets };
  }, [rows, restaurants, selected]);


  
  // 2. Order volume by day, stacked by restaurant
  const volumeChartData = useMemo(() => {
    const dayLabels = Array.from(new Set(rows.map((r) => r.date))).sort();

    const datasets = restaurants.map((name, i) => {
      const byDay = {};
      rows
        .filter((r) => r.restaurant === name)
        .forEach((r) => {
          byDay[r.date] = (byDay[r.date] || 0) + r.orders;
        });

      return {
        label: name,
        data: dayLabels.map((d) => byDay[d] || 0),
        backgroundColor: COLORS[i % COLORS.length],
      };
    })
    .filter((d) => selected.includes(d.label));

    return { labels: dayLabels, datasets };
  }, [rows, restaurants, selected]);

  const bumpOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { title: { display: true, text: 'Hour of day (24h)' } },
      y: { title: { display: true, text: 'Minutes' } },
    },
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, title: { display: true, text: 'Orders' } },
    },
  };

  return (
    <section className="dining-charts">
      <h2>Order activity</h2>

      {error && <p className="empty">Couldn't load data: {error}</p>}
      {!error && days.length === 0 && <p className="empty">Loading…</p>}

      {days.length > 0 && (
        <DateRangeSlider days={days} value={range} onCommit={setRange} />
      )}

      {days.length > 0 && (
      <button
        type="button"
        onClick={() => setExcludeOutliers((previous) => !previous)}
      >
        {excludeOutliers ? 'Include Outliers' : 'Exclude Outliers'}
      </button>
      )}

      {days.length > 0 &&
        (!loading && rows.length === 0 ? (
          <p className="empty">
            No orders in this range. Drag the handles to widen the dates.
          </p>
        ) : (
          <div className={loading ? 'charts is-loading' : 'charts'}>
            <div>
              <h3>Average bump time by hour</h3>
              <div style={{ width: '100%', height: 320 }}>
                <Line data={bumpChartData} options={bumpOptions} />
              </div>
            </div>
            <div>
              <h3>Order volume by day</h3>
              <div style={{ width: '100%', height: 320 }}>
                <Bar data={volumeChartData} options={volumeOptions} />
              </div>
            </div>
          </div>
        ))}
    </section>
  );
}