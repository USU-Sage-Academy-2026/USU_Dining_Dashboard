import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DiningCharts from "../components/Diningcharts";
import "./Dashboard.css";

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

const numberFormat = new Intl.NumberFormat("en-US");

export default function Dashboard({ isAdmin = false }) {
  const [restaurantNames, setRestaurantNames] = useState([]);
  const [selected, setSelected] = useState([]);
  const [orderMethod, setOrderMethod] = useState("all");
  const [csrfToken, setCsrfToken] = useState("");
  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/order-meta/")
      .then((response) => {
        if (!response.ok) throw new Error(`Database options request failed (${response.status})`);
        return response.json();
      })
      .then((meta) => {
        if (cancelled) return;
        const names = meta.restaurants || [];
        setRestaurantNames(names);
        setSelected(names);
        setDays(meta.days || []);
        setMetaLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          setMetaError(error.message);
          setMetaLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch("/api/csrf/").then(() => setCsrfToken(getCsrfToken())).catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const totalOrders = rows.reduce((sum, row) => sum + (Number(row.orders) || 0), 0);
    const bumpRows = rows.filter((row) => row.bumpMinutes !== null && row.bumpMinutes !== undefined);
    const bumpOrderCount = bumpRows.reduce((sum, row) => sum + (Number(row.orders) || 0), 0);
    const weightedBumpTotal = bumpRows.reduce(
      (sum, row) => sum + (Number(row.orders) || 0) * Number(row.bumpMinutes),
      0,
    );
    const restaurantTotals = new Map();
    rows.forEach((row) => {
      const current = restaurantTotals.get(row.restaurant) || 0;
      restaurantTotals.set(row.restaurant, current + (Number(row.orders) || 0));
    });
    const busiest = [...restaurantTotals.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalOrders,
      averageBump: bumpOrderCount ? weightedBumpTotal / bumpOrderCount : null,
      busiest,
      activeRestaurants: restaurantTotals.size,
    };
  }, [rows]);

  function toggleRestaurant(name) {
    setSelected((current) => current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]);
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        restaurantNames={restaurantNames}
        selected={selected}
        onToggleRestaurant={toggleRestaurant}
        onSelectAll={() => setSelected(restaurantNames)}
        onClearAll={() => setSelected([])}
        orderMethod={orderMethod}
        onOrderMethodChange={setOrderMethod}
      />

      <main className="dashboard">
        <header className="dashboard-header">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">A</div>
            <div>
              <p className="eyebrow">UTAH STATE UNIVERSITY</p>
              <h1>Dining Analytics</h1>
              <p className="dashboard-subtitle">Campus restaurant performance at a glance</p>
            </div>
          </div>
          <nav className="dashboard-actions" aria-label="Account actions">
            {isAdmin && <a className="button button-outline" href="/admin/">Admin</a>}
            <form className="dashboard-logout" action="/accounts/logout/" method="post">
              <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
              <button className="button button-primary" type="submit">Log out</button>
            </form>
          </nav>
        </header>

        {metaError && <div className="dashboard-alert" role="alert">Couldn't load database filters: {metaError}</div>}

        <section className="overview-heading">
          <div>
            <p className="eyebrow">LIVE DATABASE OVERVIEW</p>
            <h2>Dining Performance</h2>
            <p>Metrics update when you change the restaurant, order type, or date filters.</p>
          </div>
          <span className={`connection-status ${metaLoading ? "is-loading" : ""}`}>
            <span className="status-dot" /> {metaLoading ? "Connecting" : "Database filters loaded"}
          </span>
        </section>

        <section className="summary-grid" aria-label="Dashboard summary">
          <article className="summary-card summary-card-primary">
            <span className="summary-label">Total orders</span>
            <strong>{numberFormat.format(summary.totalOrders)}</strong>
            <span className="summary-note">For current filters</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Average bump time</span>
            <strong>{summary.averageBump === null ? "—" : `${summary.averageBump.toFixed(2)} min`}</strong>
            <span className="summary-note">Weighted by order count</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Busiest restaurant</span>
            <strong className="summary-text-value">{summary.busiest?.[0] || "—"}</strong>
            <span className="summary-note">{summary.busiest ? `${numberFormat.format(summary.busiest[1])} orders` : "No matching orders"}</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Restaurants included</span>
            <strong>{summary.activeRestaurants}</strong>
            <span className="summary-note">With orders in this range</span>
          </article>
        </section>

        {metaLoading ? (
          <div className="loading-panel">Loading restaurant and date options from the database…</div>
        ) : (
          <DiningCharts
            days={days}
            restaurants={restaurantNames}
            selected={selected}
            orderMethod={orderMethod}
            onRowsChange={setRows}
          />
        )}
      </main>
    </div>
  );
}
