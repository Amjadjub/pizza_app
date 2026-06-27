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

  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  const [employeeOrders, setEmployeeOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [staffError, setStaffError] = useState("");

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
      await loadEmployeeOrders();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTrackOrder() {
  setTrackingError("");
  setTrackedOrder(null);

  if (!trackingOrderId) {
    setTrackingError("Please enter an order number");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/${trackingOrderId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Order not found");
    }

    setTrackedOrder(data);
  } catch (err) {
    setTrackingError(err.message);
  }
}

  function formatOrderItems(order) {
  return order.pizzas
    .map((item) => {
      const toppingNames = item.toppings.length === 0
        ? "No toppings"
        : item.toppings.map((topping) => topping.name).join(", ");

      return `${item.pizza.name} / ${item.size.name} / ${toppingNames}`;
    })
    .join(" | ");
}

async function loadEmployeeOrders() {
  setStaffError("");

  try {
    const [newResponse, preparingResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/orders?status=new`),
      fetch(`${API_BASE_URL}/api/orders?status=preparing`)
    ]);

    const newOrders = await newResponse.json();
    const preparingOrders = await preparingResponse.json();

    if (!newResponse.ok || !preparingResponse.ok) {
      throw new Error("Failed to load employee orders");
    }

    setEmployeeOrders([...newOrders, ...preparingOrders]);
  } catch (err) {
    setStaffError(err.message);
  }
}

async function loadDeliveryOrders() {
  setStaffError("");

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders?status=ready`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load delivery orders");
    }

    setDeliveryOrders(data);
  } catch (err) {
    setStaffError(err.message);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  setStaffError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update order status");
    }

    await loadEmployeeOrders();
    await loadDeliveryOrders();

    if (trackedOrder && trackedOrder.id === orderId) {
      setTrackedOrder(data);
    }
  } catch (err) {
    setStaffError(err.message);
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
      <section className="panel">
  <h2>Track Order Status</h2>

  <label>
    Order Number:
    <input
      type="text"
      value={trackingOrderId}
      onChange={(event) => setTrackingOrderId(event.target.value)}
    />
  </label>

  <button onClick={handleTrackOrder}>Check Status</button>

  {trackingError && <p className="error">{trackingError}</p>}

  {trackedOrder && (
    <div className="status-box">
      <p>Order number: {trackedOrder.id}</p>
      <p>Status: {trackedOrder.status}</p>
      <p>Customer: {trackedOrder.customerName}</p>
      <p>Total price: ₪{trackedOrder.totalPrice}</p>
    </div>
  )}
</section>

    <section data-testid="employee-orders" className="panel">
  <h2>Restaurant Employee Orders</h2>

  <button onClick={loadEmployeeOrders}>Refresh Employee Orders</button>

  {staffError && <p className="error">{staffError}</p>}

  {employeeOrders.length === 0 ? (
    <p>No active employee orders</p>
  ) : (
    <ul>
      {employeeOrders.map((order) => (
        <li key={order.id} className="cart-item">
          <strong>Order #{order.id}</strong>
          <br />
          Customer: {order.customerName}
          <br />
          Items: {formatOrderItems(order)}
          <br />
          Price: ₪{order.totalPrice}
          <br />
          Status: {order.status}
          <br />

          {order.status === "new" && (
            <button onClick={() => updateOrderStatus(order.id, "preparing")}>
              Mark as Preparing
            </button>
          )}

          {order.status === "preparing" && (
            <button onClick={() => updateOrderStatus(order.id, "ready")}>
              Mark as Ready
            </button>
          )}
        </li>
      ))}
    </ul>
  )}
</section>

<section data-testid="delivery-orders" className="panel">
  <h2>Delivery Orders</h2>

  <button onClick={loadDeliveryOrders}>Refresh Delivery Orders</button>

  {deliveryOrders.length === 0 ? (
    <p>No orders ready for delivery</p>
  ) : (
    <ul>
      {deliveryOrders.map((order) => (
        <li key={order.id} className="cart-item">
          <strong>Order #{order.id}</strong>
          <br />
          Customer: {order.customerName}
          <br />
          Phone: {order.phone}
          <br />
          Address: {order.deliveryAddress}
          <br />
          Status: {order.status}
          <br />

          <button onClick={() => updateOrderStatus(order.id, "delivered")}>
            Mark as Delivered
          </button>
        </li>
      ))}
    </ul>
  )}
</section>
    </main>
  );
}

export default App;