import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:3001";

function App() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");

  const [selectedPizzaId, setSelectedPizzaId] = useState("margherita");
  const [selectedSizeId, setSelectedSizeId] = useState("small");
  const [selectedToppingIds, setSelectedToppingIds] = useState([]);

  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [checkoutError, setCheckoutError] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function findPizzaById(id) {
    return menu.pizzas.find((pizza) => pizza.id === id);
  }

  function findSizeById(id) {
    return menu.sizes.find((size) => size.id === id);
  }

  function findToppingById(id) {
    return menu.toppings.find((topping) => topping.id === id);
  }

  function calculateItemPrice(item) {
    const pizza = findPizzaById(item.pizzaId);
    const size = findSizeById(item.sizeId);

    let total = pizza.price + size.price;

    for (const toppingId of item.toppingIds) {
      const topping = findToppingById(toppingId);
      total += topping.price;
    }

    return total;
  }

  function calculateCartTotal() {
    return cart.reduce((total, item) => {
      return total + calculateItemPrice(item);
    }, 0);
  }

  function handleToppingChange(toppingId) {
    if (selectedToppingIds.includes(toppingId)) {
      setSelectedToppingIds(
        selectedToppingIds.filter((id) => id !== toppingId)
      );
      return;
    }

    if (selectedToppingIds.length >= 3) {
      setError("You can select up to 3 toppings for one pizza");
      return;
    }

    setError("");
    setSelectedToppingIds([...selectedToppingIds, toppingId]);
  }

  function addPizzaToCart() {
    const newItem = {
      id: Date.now(),
      pizzaId: selectedPizzaId,
      sizeId: selectedSizeId,
      toppingIds: selectedToppingIds
    };

    setCart([...cart, newItem]);
    setSelectedToppingIds([]);
    setError("");
    setOrderConfirmation(null);
  }

  function removeFromCart(itemId) {
    setCart(cart.filter((item) => item.id !== itemId));
  }

  async function handleCheckout() {
    setCheckoutError("");
    setOrderConfirmation(null);

    if (cart.length === 0) {
      setCheckoutError("Cart is empty");
      return;
    }

    if (!customerName || !phone || !deliveryAddress) {
      setCheckoutError("Customer name, phone and delivery address are required");
      return;
    }

    const orderBody = {
      customerName,
      phone,
      deliveryAddress,
      pizzas: cart.map((item) => ({
        pizzaId: item.pizzaId,
        sizeId: item.sizeId,
        toppingIds: item.toppingIds
      }))
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      setOrderConfirmation(data);
      setCart([]);
      setCustomerName("");
      setPhone("");
      setDeliveryAddress("");
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !menu) {
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

      <section className="panel">
        <h2>Build Your Pizza</h2>

        <label>
          Pizza:
          <select
            value={selectedPizzaId}
            onChange={(event) => setSelectedPizzaId(event.target.value)}
          >
            {menu.pizzas.map((pizza) => (
              <option key={pizza.id} value={pizza.id}>
                {pizza.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Size:
          <select
            value={selectedSizeId}
            onChange={(event) => setSelectedSizeId(event.target.value)}
          >
            {menu.sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </label>

        <div className="toppings-box">
          <h3>Toppings</h3>

          {menu.toppings.map((topping) => (
            <label key={topping.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedToppingIds.includes(topping.id)}
                onChange={() => handleToppingChange(topping.id)}
              />
              {topping.name} - ₪{topping.price}
            </label>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <button onClick={addPizzaToCart}>Add to Cart</button>
      </section>

      <section data-testid="cart" className="panel">
        <h2>Cart</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <ul>
            {cart.map((item) => {
              const pizza = findPizzaById(item.pizzaId);
              const size = findSizeById(item.sizeId);
              const toppings = item.toppingIds.map(findToppingById);
              const itemPrice = calculateItemPrice(item);

              return (
                <li key={item.id} className="cart-item">
                  <strong>{pizza.name}</strong> / {size.name}
                  <br />
                  Toppings:{" "}
                  {toppings.length === 0
                    ? "None"
                    : toppings.map((topping) => topping.name).join(", ")}
                  <br />
                  Price: ₪{itemPrice}
                  <br />
                  <button onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section data-testid="order-summary-panel" className="panel">
        <h2>Order Summary</h2>

        <p>Number of pizzas: {cart.length}</p>
        <p>Estimated total price: ₪{calculateCartTotal()}</p>
        <p className="note">
          This is only an estimated price. The final price will be calculated by
          the server.
        </p>
      </section>

      <section className="panel">
        <h2>Customer Details</h2>

        <label>
          Customer Name:
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </label>

        <label>
          Phone:
          <input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>

        <label>
          Delivery Address:
          <input
            type="text"
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
          />
        </label>

        {checkoutError && <p className="error">{checkoutError}</p>}

        <button
          data-testid="checkout-button"
          onClick={handleCheckout}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Fake Payment and Submit Order"}
        </button>
      </section>

      {orderConfirmation && (
        <section data-testid="order-confirmation" className="panel success">
          <h2>Order Confirmation</h2>
          <p>Order number: {orderConfirmation.id}</p>
          <p>Status: {orderConfirmation.status}</p>
          <p>Payment status: {orderConfirmation.paymentStatus}</p>
          <p>Final price from server: ₪{orderConfirmation.totalPrice}</p>
        </section>
      )}
    </main>
  );
}

export default App;