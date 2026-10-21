import { useState } from "react";
import Sidebar from "../components/Sidebar";
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
          <h1>USU Dining Dashboard</h1>
          <p>Order times across campus restaurants</p>
        </header>

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