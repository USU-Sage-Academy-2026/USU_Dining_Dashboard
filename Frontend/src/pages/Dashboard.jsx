
import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import DiningCharts from "../components/Diningcharts";
import Chart from "chart.js/auto";
import "./Dashboard.css";

const allData = [
  { name: "Restaurant A", avgBumpTime: 4.2, kiosk: 70, mobile: 50 },
  { name: "Restaurant B", avgBumpTime: 6.8, kiosk: 45, mobile: 40 },
  { name: "Restaurant C", avgBumpTime: 3.1, kiosk: 120, mobile: 90 },
];

const restaurantNames = allData.map((r) => r.name);

export default function Dashboard() {
  const [selected, setSelected] = useState(restaurantNames);
  const [orderMethod, setOrderMethod] = useState("all");

  // --- Database memory ---
  const [neonData, setNeonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

    // --- Restaurant names from the database ---
  useEffect(() => {
    fetch("/api/order-meta/")
      .then((res) => res.json())
      .then((meta) => {
        setRestaurantNames(meta.restaurants);
        setSelected(meta.restaurants); // start with every restaurant ticked
      })
      .catch((err) => console.error(err));
  }, []);

  // --- Ticket calculations---
  useEffect(() => {
    fetch("http://localhost:5000/api/ticket-hours")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setNeonData(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // --- Chart.js render ---
  useEffect(() => {
    if (!neonData || !chartRef.current) return;

    // Destroys old charts during hot-reloads to avoid drawing glitches
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: neonData.labels, 
        datasets: [
          {
            label: "Avg Bump Time (Minutes)",
            data: neonData.values,
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Minutes" } },
          x: { title: { display: true, text: "Hour of Day" } },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [neonData]);

  // --- Your Existing Filtering Logic ---
  function toggleRestaurant(name) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((n) => n !== name)
        : [...current, name]
    );
  }

  const visible = allData
    .filter((r) => selected.includes(r.name))
    .map((r) => ({
      ...r,
      orders:
        orderMethod === "kiosk" ? r.kiosk
        : orderMethod === "mobile" ? r.mobile
        : r.kiosk + r.mobile,
    }));

  const fastest = visible.length
    ? visible.reduce((a, b) => (a.avgBumpTime <= b.avgBumpTime ? a : b))
    : null;

  const slowest = visible.length
    ? visible.reduce((a, b) => (a.avgBumpTime >= b.avgBumpTime ? a : b))
    : null;

  const busiest = visible.length
    ? visible.reduce((a, b) => (a.orders >= b.orders ? a : b))
    : null;

  const totalOrders = visible.reduce((sum, r) => sum + r.orders, 0);

  return (
    <div className="dashboard-layout">
      <Sidebar
        restaurantNames={restaurantNames}
        selected={selected}
        onToggleRestaurant={toggleRestaurant}
        orderMethod={orderMethod}
        onOrderMethodChange={setOrderMethod}
      />

      <main className="dashboard">
        <header className="dashboard-header">
          <nav className="dashboard-actions" aria-label="Account actions">
            {isAdmin && (
              <a className="dashboard-logout-button" href="/admin/">
                Admin
              </a>
            )}
            <form className="dashboard-logout" action="/accounts/logout/" method="post">
              <input
                type="hidden"
                name="csrfmiddlewaretoken"
                value={getCsrfToken()}
              />
              <button className="dashboard-logout-button" type="submit">
                Log out
              </button>
            </form>
          </nav>
          <h1>USU Dining Dashboard</h1>
          <p>Order times across campus restaurants</p>
        </header>

        {/* Main Graph Section */}
        <section className="dashboard-chart-box" style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "25px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "15px", fontFamily: "sans-serif" }}>Mobile Orders: Bump Time By Hour</h2>
          <div className="chart-wrapper" style={{ position: "relative", height: "300px", width: "100%" }}>
            {loading && <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>Fetching your Neon database fields...</p>}
            {error && <p style={{ color: "#ff4d4d", textAlign: "center", padding: "40px" }}>Connection Error: {error}</p>}
            {!loading && !error && <canvas ref={chartRef}></canvas>}
          </div>
        </section>

        <section className="dashboard-cards">
          {visible.map((r) => (
            <div key={r.name} className="dashboard-card">
              <h2>{r.name}</h2>
              <p className="dashboard-stat">{r.avgBumpTime} min</p>
              <p className="dashboard-label">Avg bump time</p>
              <p className="dashboard-stat">{r.orders}</p>
              <p className="dashboard-label">Orders</p>
            </div>
          ))}
        </section>

        <DiningCharts selected={selected} orderMethod={orderMethod} />

        <footer className="dashboard-findings">
          <h2>Key findings</h2>
          {visible.length === 0 ? (
            <p>Select at least one restaurant to see findings.</p>
          ) : (
            <ul>
              <li>
                Fastest bump time: <strong>{fastest.name}</strong> ({fastest.avgBumpTime} min)
              </li>
              <li>
                Slowest bump time: <strong>{slowest.name}</strong> ({slowest.avgBumpTime} min)
              </li>
              <li>
                Busiest: <strong>{busiest.name}</strong> ({busiest.orders} orders)
              </li>
              <li>
                Total orders across selected restaurants: <strong>{totalOrders}</strong>
              </li>
            </ul>
          )}
        </footer>
      </main>
    </div>
  );
}
