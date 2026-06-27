import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:3001";

function App() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/menu`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load menu");
        }
        return response.json();
      })
      .then((data) => {
        setMenu(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <main className="app">
        <h1>Pizza Ordering System</h1>
        <p className="error">Error: {error}</p>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="app">
        <h1>Pizza Ordering System</h1>
        <p>Loading menu...</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Pizza Ordering System</h1>

      <section data-testid="menu-list" className="panel">
        <h2>Menu</h2>

        <h3>Pizzas</h3>
        <ul>
          {menu.pizzas.map((pizza) => (
            <li key={pizza.id}>
              {pizza.name} - ₪{pizza.price}
            </li>
          ))}
        </ul>

        <h3>Sizes</h3>
        <ul>
          {menu.sizes.map((size) => (
            <li key={size.id}>
              {size.name} - ₪{size.price}
            </li>
          ))}
        </ul>

        <h3>Toppings</h3>
        <ul>
          {menu.toppings.map((topping) => (
            <li key={topping.id}>
              {topping.name} - ₪{topping.price}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;