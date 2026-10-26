import { useEffect, useMemo, useState } from 'react';
import 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';
import DateRangeSlider from './Daterangeslider';
import { ALL_DAYS, RESTAURANTS, getOrderData } from './Fakedata';
import './Diningcharts.css';

const COLORS = ['#0F2439', '#2E7DB5', '#E08A00'];
const LAST = ALL_DAYS.length - 1;

export default function DiningCharts() {
  // One shared range for every chart. Default: the most recent 7 days.
  const [range, setRange] = useState([LAST - 6, LAST]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const start = ALL_DAYS[range[0]];
  const end = ALL_DAYS[range[1]];

  useEffect(() => {
    let cancelled = false; // ignore a slow response if the range changed again
    setLoading(true);
    getOrderData(start, end).then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  // 1. Average bump time by hour (Chart.js Line Chart format)
  const bumpChartData = useMemo(() => {
    // Collect all unique hours across all restaurants in sorted order
    const hours = Array.from(new Set(rows.map((r) => r.hour)))
      .map(Number)
      .sort((a, b) => a - b);

    const datasets = RESTAURANTS.map((name, i) => {
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
        borderColor: COLORS[i],
        backgroundColor: COLORS[i],
        tension: 0.2,
        spanGaps: true,
      };
    });

    return {
      labels: hours,
      datasets,
    };
  }, [rows]);

  // 2. Order volume by day, stacked by restaurant (Chart.js Bar Chart format)
  const volumeChartData = useMemo(() => {
    // Collect all unique dates across all restaurants in sorted order
    const days = Array.from(new Set(rows.map((r) => r.date))).sort();

    const datasets = RESTAURANTS.map((name, i) => {
      const byDay = {};
      rows
        .filter((r) => r.restaurant === name)
        .forEach((r) => {
          byDay[r.date] = (byDay[r.date] || 0) + r.orders;
        });

      return {
        label: name,
        data: days.map((d) => byDay[d] || 0),
        backgroundColor: COLORS[i],
      };
    });

    return {
      labels: days,
      datasets,
    };
  }, [rows]);

  // Chart.js configuration for the Line Chart
  const bumpOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: {
        title: { display: true, text: 'Hour of day (24h)' },
      },
      y: {
        title: { display: true, text: 'Minutes' },
      },
    },
  };

  // Chart.js configuration for the Stacked Bar Chart
  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: { display: true, text: 'Orders' },
      },
    },
  };

  return (
    <section className="dining-charts">
      <h2>Order activity</h2>
      <DateRangeSlider days={ALL_DAYS} value={range} onCommit={setRange} />

      {!loading && rows.length === 0 ? (
        <p className="empty">No orders in this range. Drag the handles to widen the dates.</p>
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
      )}
    </section>
  );
}