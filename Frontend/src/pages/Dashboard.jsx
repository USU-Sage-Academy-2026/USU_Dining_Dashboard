import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DiningCharts from "../components/Diningcharts";
import "./Dashboard.css";

// helper function to get the CSRF token from cookies
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

const numberFormat = new Intl.NumberFormat("en-US");

// these are the state declarations and the main component for the dashboard. It fetches metadata about restaurants and days, manages selected restaurants and order methods, and renders the sidebar and dining charts. It also handles CSRF token management and logout on page hide.
export default function Dashboard({ isAdmin = false }) {
  const [restaurantNames, setRestaurantNames] = useState([]);
  const [selected, setSelected] = useState([]); // dashboard owns the state and sets it here
  const [orderMethod, setOrderMethod] = useState("all");
  const [csrfToken, setCsrfToken] = useState("");
  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");


  // first useEffect fetches the restaurant names and available days from the backend API when the component mounts. It updates the state with the fetched data or sets an error message if the request fails.
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
  }, []); // empty dependency array means this runs once on mount

  // useEffect(() => {
  //   if (!neonData || !chartRef.current) return;

  //   // Destroys old charts during hot-reloads to avoid drawing glitches
  //   if (chartInstance.current) {
  //     chartInstance.current.destroy();
  //   }

  //   const ctx = chartRef.current.getContext("2d");
  //   chartInstance.current = new Chart(ctx, {
  //     type: "line",
  //     data: {
  //       labels: neonData.labels,
  //       datasets: [
  //         {
  //           label: "Avg Bump Time (Minutes)",
  //           data: neonData.values,
  //           borderColor: "rgb(54, 162, 235)",
  //           backgroundColor: "rgba(54, 162, 235, 0.2)",
  //           tension: 0.3,
  //           fill: true,
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       scales: {
  //         y: { beginAtZero: true, title: { display: true, text: "Minutes" } },
  //         x: { title: { display: true, text: "Hour of Day" } },
  //       },
  //     },
  //   });

  //   return () => {
  //     if (chartInstance.current) chartInstance.current.destroy();
  //   };
  // }, [neonData]);

    useEffect(() => {
    fetch("/api/csrf/").then(() => setCsrfToken(getCsrfToken()));
  }, []);

  useEffect(() => {
    function logoutOnPageHide() {
      const token = getCsrfToken();
      if (!token) return;

      fetch("/accounts/logout/", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": token,
        },
        keepalive: true,
      });
    }

    window.addEventListener("pagehide", logoutOnPageHide);
    return () => window.removeEventListener("pagehide", logoutOnPageHide);
  }, []);

  function toggleRestaurant(name) { // this functions runs from onToggleRestaurant in Sidebar.jsx
    setSelected((current) => current.includes(name) // this asks if the current selection already includes the restaurant, and setSelected updates the state accordingly
      ? current.filter((item) => item !== name) // if it does, it removes the restaurant from the selection
      : [...current, name]); // if it doesn't, it adds the restaurant to the selection
  }

  const summary = useMemo(() => {
    const filteredRows = rows.filter((row) => selected.includes(row.restaurant));
    const totalOrders = filteredRows.reduce(
      (total, row) => total + (Number(row.orders) || 0),
      0,
    );
    const weightedBumpTotal = filteredRows.reduce((total, row) => {
      const orders = Number(row.orders) || 0;
      const bumpMinutes = Number(row.bumpMinutes);
      return total + (Number.isFinite(bumpMinutes) ? orders * bumpMinutes : 0);
    }, 0);
    const ordersByRestaurant = new Map();

    filteredRows.forEach((row) => {
      ordersByRestaurant.set(
        row.restaurant,
        (ordersByRestaurant.get(row.restaurant) || 0) + (Number(row.orders) || 0),
      );
    });

    const busiest = [...ordersByRestaurant.entries()]
      .sort((a, b) => b[1] - a[1])[0] || null;

    return {
      totalOrders,
      averageBump: totalOrders ? weightedBumpTotal / totalOrders : null,
      busiest,
      activeRestaurants: [...ordersByRestaurant.values()].filter((orders) => orders > 0).length,
    };
  }, [rows, selected]);

  return (
    <div className="dashboard-layout">
      <Sidebar
      // here are the 7 props that Dashboard passes to Sidebar. These include the list of restaurant names, the currently selected restaurants, and functions to toggle selection, select all, clear all, and change the order method.
        restaurantNames={restaurantNames}
        selected={selected}
        onToggleRestaurant={toggleRestaurant} // props that toggles the selection of a restaurant in the sidebar
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
