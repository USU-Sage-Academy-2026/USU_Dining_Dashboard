import { useEffect, useMemo, useState } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import DateRangeSlider from './DateRangeSlider';
import { ALL_DAYS, RESTAURANTS, getOrderData } from './fakeData';
import './DiningCharts.css';

const Plot = createPlotlyComponent(Plotly);
const COLORS = ['#0F2439', '#2E7DB5', '#E08A00'];
const LAST = ALL_DAYS.length - 1;

const baseLayout = {
  margin: { t: 10, r: 10, b: 50, l: 55 },
  legend: { orientation: 'h', y: -0.3 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
};

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
    return () => { cancelled = true; };
  }, [start, end]);

  // Average bump time by hour. Weighted by order count so a busy hour
  // counts more than a quiet one (a plain average of averages would be wrong).
  const bumpTraces = useMemo(
    () => RESTAURANTS.map((name, i) => {
      const byHour = {};
      rows.filter((r) => r.restaurant === name).forEach((r) => {
        const h = (byHour[r.hour] ??= { orders: 0, weighted: 0 });
        h.orders += r.orders;
        h.weighted += r.orders * r.bumpMinutes;
      });
      const hours = Object.keys(byHour).map(Number).sort((a, b) => a - b);
      return {
        x: hours,
        y: hours.map((h) => byHour[h].weighted / byHour[h].orders),
        type: 'scatter', mode: 'lines+markers', name, line: { color: COLORS[i] },
      };
    }),
    [rows],
  );

  // Order volume by day, stacked by restaurant.
  const volumeTraces = useMemo(
    () => RESTAURANTS.map((name, i) => {
      const byDay = {};
      rows.filter((r) => r.restaurant === name).forEach((r) => {
        byDay[r.date] = (byDay[r.date] || 0) + r.orders;
      });
      const days = Object.keys(byDay).sort();
      return { x: days, y: days.map((d) => byDay[d]), type: 'bar', name, marker: { color: COLORS[i] } };
    }),
    [rows],
  );

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
            <Plot
              data={bumpTraces}
              layout={{ ...baseLayout, xaxis: { title: 'Hour of day (24h)', dtick: 1 }, yaxis: { title: 'Minutes' } }}
              useResizeHandler
              style={{ width: '100%', height: 320 }}
              config={{ displayModeBar: false }}
            />
          </div>
          <div>
            <h3>Order volume by day</h3>
            <Plot
              data={volumeTraces}
              layout={{ ...baseLayout, barmode: 'stack', xaxis: { type: 'category' }, yaxis: { title: 'Orders' } }}
              useResizeHandler
              style={{ width: '100%', height: 320 }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
