import { useEffect, useMemo, useState } from "react";
import "chart.js/auto";
import { Bar, Line } from "react-chartjs-2";
import DateRangeSlider from "./Daterangeslider";
import "./Diningcharts.css";

const COLORS = ["#0F2439", "#2D6A9F", "#C69214", "#5B829E", "#8C6D31", "#6F8796", "#B7A16A"];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  return response.json();
}

const hourLabel = (hour) => {
  const value = Number(hour);
  if (!Number.isFinite(value)) return hour;
  const suffix = value >= 12 ? "PM" : "AM";
  const display = value % 12 || 12;
  return `${display} ${suffix}`;
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 18 } },
    tooltip: { padding: 12, backgroundColor: "#102A43", titleFont: { weight: "600" }, bodySpacing: 5 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#64748B" } },
    y: { beginAtZero: true, grid: { color: "#E8EDF2" }, ticks: { color: "#64748B" } },
  },
};

export default function DiningCharts({ days, restaurants, selected, orderMethod, onRowsChange }) {
  const [range, setRange] = useState(() => {
    const last = Math.max(0, days.length - 1);
    return [Math.max(0, last - 6), last];
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [excludeOutliers, setExcludeOutliers] = useState(false);

  const start = days[range[0]];
  const end = days[range[1]];

  useEffect(() => {
    if (!start || !end) return undefined;
    let cancelled = false;
    const params = new URLSearchParams({ start, end, method: orderMethod, outliers: excludeOutliers ? "exclude" : "include" });
    if (selected.length) selected.forEach((name) => params.append("restaurants", name));
    else params.append("restaurants", "");

    fetchJson(`/api/order-data/?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setError("");
        setRows(data);
        onRowsChange(data);
        setLoading(false);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setRows([]);
          onRowsChange([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [start, end, orderMethod, selected, excludeOutliers, onRowsChange]);

  const visibleRestaurants = useMemo(
    () => restaurants.filter((name) => selected.includes(name)),
    [restaurants, selected],
  );

  const bumpChartData = useMemo(() => {
    const hours = [...new Set(rows.map((row) => Number(row.hour)))].sort((a, b) => a - b);
    const datasets = visibleRestaurants.map((name, index) => {
      const buckets = new Map();
      rows.filter((row) => row.restaurant === name && row.bumpMinutes !== null)
        .forEach((row) => {
          const current = buckets.get(Number(row.hour)) || { orders: 0, weighted: 0 };
          current.orders += Number(row.orders) || 0;
          current.weighted += (Number(row.orders) || 0) * Number(row.bumpMinutes);
          buckets.set(Number(row.hour), current);
        });
      return {
        label: name,
        data: hours.map((hour) => {
          const bucket = buckets.get(hour);
          return bucket?.orders ? Number((bucket.weighted / bucket.orders).toFixed(2)) : null;
        }),
        borderColor: COLORS[index % COLORS.length],
        backgroundColor: COLORS[index % COLORS.length],
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true,
      };
    });
    return { labels: hours.map(hourLabel), datasets };
  }, [rows, visibleRestaurants]);

  const ordersByHourData = useMemo(() => {
    const hours = [...new Set(rows.map((row) => Number(row.hour)))].sort((a, b) => a - b);
    const datasets = visibleRestaurants.map((name, index) => {
      const totals = new Map();
      rows.filter((row) => row.restaurant === name).forEach((row) => {
        const hour = Number(row.hour);
        totals.set(hour, (totals.get(hour) || 0) + (Number(row.orders) || 0));
      });
      return {
        label: name,
        data: hours.map((hour) => totals.get(hour) || 0),
        backgroundColor: COLORS[index % COLORS.length],
        borderRadius: 5,
        borderSkipped: false,
      };
    });
    return { labels: hours.map(hourLabel), datasets };
  }, [rows, visibleRestaurants]);

  const volumeByDayData = useMemo(() => {
    const dateLabels = [...new Set(rows.map((row) => row.date))].sort();
    const datasets = visibleRestaurants.map((name, index) => {
      const totals = new Map();
      rows.filter((row) => row.restaurant === name).forEach((row) => {
        totals.set(row.date, (totals.get(row.date) || 0) + (Number(row.orders) || 0));
      });
      return {
        label: name,
        data: dateLabels.map((date) => totals.get(date) || 0),
        backgroundColor: COLORS[index % COLORS.length],
        borderRadius: 4,
      };
    });
    return { labels: dateLabels, datasets };
  }, [rows, visibleRestaurants]);

  const bumpOptions = useMemo(() => ({
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      x: { ...baseOptions.scales.x, title: { display: true, text: "Hour of day" } },
      y: { ...baseOptions.scales.y, title: { display: true, text: "Average minutes" } },
    },
  }), []);

  const orderHourOptions = useMemo(() => ({
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      x: { ...baseOptions.scales.x, stacked: true, title: { display: true, text: "Hour of day" } },
      y: { ...baseOptions.scales.y, stacked: true, title: { display: true, text: "Orders" } },
    },
  }), []);

  const volumeOptions = useMemo(() => ({
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      x: { ...baseOptions.scales.x, stacked: true },
      y: { ...baseOptions.scales.y, stacked: true, title: { display: true, text: "Orders" } },
    },
  }), []);

  const noSelection = selected.length === 0;

  return (
    <section className="dining-charts">
      <div className="section-title-row">
        <div><p className="eyebrow">EXPLORE THE DATA</p><h2>Order activity</h2></div>
        <button
          type="button"
          className={`outlier-button ${excludeOutliers ? "is-active" : ""}`}
          onClick={() => setExcludeOutliers((current) => !current)}
          disabled={noSelection}
        >
          <span className="toggle-indicator" />
          {excludeOutliers ? "Outliers excluded" : "Exclude outliers"}
        </button>
      </div>

      <div className="date-filter-card">
        <div className="date-filter-heading"><div><h3>Date range</h3><p>Choose the period to include in your analysis.</p></div><span className="date-range-tag">{days.length} dates available</span></div>
        {days.length > 0 ? <DateRangeSlider days={days} value={range} onCommit={setRange} /> : <p className="empty">No dates were returned by the database.</p>}
      </div>

      {error && <div className="chart-alert" role="alert">Couldn't load dashboard data: {error}</div>}
      {noSelection && <div className="empty-state"><strong>No restaurants selected</strong><span>Choose at least one restaurant in the filters to see its data.</span></div>}
      {!error && !noSelection && !loading && rows.length === 0 && start && (
        <div className="empty-state"><strong>No orders found for these filters</strong><span>Try a wider date range or a different order method.</span></div>
      )}

      {rows.length > 0 && (
        <div className={`charts-grid ${loading ? "is-loading" : ""}`}>
          <article className="chart-card chart-card-wide">
            <div className="chart-card-heading"><div><h3>Orders by hour</h3><p>Order volume across the selected date range</p></div><span className="chart-unit">ORDERS</span></div>
            <div className="chart-canvas"><Bar data={ordersByHourData} options={orderHourOptions} /></div>
          </article>
          <article className="chart-card">
            <div className="chart-card-heading"><div><h3>Average bump time by hour</h3><p>Weighted average by restaurant</p></div><span className="chart-unit">MINUTES</span></div>
            <div className="chart-canvas"><Line data={bumpChartData} options={bumpOptions} /></div>
          </article>
          <article className="chart-card">
            <div className="chart-card-heading"><div><h3>Order volume by day</h3><p>Daily totals by restaurant</p></div><span className="chart-unit">ORDERS</span></div>
            <div className="chart-canvas"><Bar data={volumeByDayData} options={volumeOptions} /></div>
          </article>
        </div>
      )}
      {loading && <p className="refresh-note">Updating charts with your selected filters…</p>}
    </section>
  );
}
