import "./Sidebar.css";

export default function Sidebar({
  // these are the 7 props Sidebar receives from Dashboard. Sidebar doesn't receive these from Django but from the parent component Dashboard.
  restaurantNames = [],
  selected = [], // The selected prop is updated by the parent component using useState
  onToggleRestaurant,
  onSelectAll,
  onClearAll,
  orderMethod,
  onOrderMethodChange,
}) {
  const orderOptions = [
    { value: "all", label: "All orders" },
    { value: "mobile", label: "Mobile" },
    { value: "kiosk", label: "Kiosk" },
  ];

  return (
    <aside style={{ position: 'sticky', top: 0, height: '100vh' }}>
  {
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">A</div>
        <div><strong>AGGIE</strong><span>DINING DATA</span></div>
      </div>

      <div className="filter-heading">
        <div>
        <h2>Filters</h2></div>
        <span className="filter-count">{selected.length}/{restaurantNames.length}</span>
      </div>

      <section className="filter-section">
        <div className="filter-section-heading">
          <h3>Restaurants</h3>
          <div className="filter-actions">
            <button type="button" onClick={onSelectAll}>All</button>
            <span>·</span>
            <button type="button" onClick={onClearAll}>Clear</button>
          </div>
        </div>

        // the most important part of sidebar component
        {restaurantNames.length === 0 ? (
          <p className="sidebar-empty">No restaurants returned by the database.</p>
        ) : restaurantNames.map((name) => ( // creates a checkbox for each restaurant name
          <label key={name} className="sidebar-option">
            <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggleRestaurant(name)} />
            // calling onToggleRestaurant here runs toggleRestaurant function from Dashboard.jsx
            <span>{name}</span>
          </label>
        ))}
      </section>

      <section className="filter-section">
        <h3>Order method</h3>
        <div className="method-options">
          {orderOptions.map((option) => (
            <label key={option.value} className={`method-option ${orderMethod === option.value ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="orderMethod"
                value={option.value}
                checked={orderMethod === option.value}
                onChange={() => onOrderMethodChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="sidebar-footnote">
        <span className="status-dot" /> Filters are applied to database queries
      </div>
    </aside>
}
</aside>
  );
}