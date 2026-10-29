import "./Sidebar.css";

export default function Sidebar({
  restaurantNames = [],
  selected = [],
  onToggleRestaurant,
  orderMethod,
  onOrderMethodChange,
}) {
  const orderOptions = [
    { value: "all", label: "All Orders" },
    { value: "mobile", label: "Mobile Orders" },
    { value: "kiosk", label: "Kiosk Orders" },
  ];

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

      <h3>Order Method</h3>

      {orderOptions.map((option) => (
        <label key={option.value} className="sidebar-option">
          <input
            type="radio"
            name="orderMethod"
            value={option.value}
            checked={orderMethod === option.value}
            onChange={() => onOrderMethodChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </aside>
  );
}