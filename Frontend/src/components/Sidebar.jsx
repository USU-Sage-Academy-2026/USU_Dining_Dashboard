import "./Sidebar.css";

export default function Sidebar({
  restaurantNames,
  selected,
  onToggleRestaurant,
  orderMethod,
  onOrderMethodChange,
}) {
  return (
    <aside className="sidebar">
      <h2>Filters</h2>

      <h3>Restaurants</h3>
      {restaurantNames.map((name) => (
        <label key={name} className="sidebar-option">
          <input
            type="checkbox"
            checked={selected.includes(name)}
            onChange={() => onToggleRestaurant(name)}
          />
          {name}
        </label>
      ))}

      <h3>Order method</h3>
      {["all", "kiosk", "mobile"].map((method) => (
        <label key={method} className="sidebar-option">
          <input
            type="radio"
            name="orderMethod"
            checked={orderMethod === method}
            onChange={() => onOrderMethodChange(method)}
          />
          {method}
        </label>
      ))}
    </aside>
  );
}