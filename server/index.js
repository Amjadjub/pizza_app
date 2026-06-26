const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const menu = {
  pizzas: [
    { id: "margherita", name: "Margherita", price: 35 },
    { id: "vegetarian", name: "Vegetarian", price: 39 },
    { id: "pepperoni", name: "Pepperoni", price: 42 }
  ],
  sizes: [
    { id: "small", name: "Small", price: 0 },
    { id: "medium", name: "Medium", price: 8 },
    { id: "large", name: "Large", price: 15 }
  ],
  toppings: [
    { id: "olives", name: "Olives", price: 4 },
    { id: "mushrooms", name: "Mushrooms", price: 4 },
    { id: "corn", name: "Corn", price: 4 },
    { id: "onion", name: "Onion", price: 4.5 },
    { id: "extra_cheese", name: "Extra Cheese", price: 3.5 }
  ]
};

let orders = [];
let nextOrderId = 1;

const validStatuses = ["new", "preparing", "ready", "delivered"];

const allowedStatusTransitions = {
  new: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null
};

function findPizzaById(id) {
  return menu.pizzas.find((pizza) => pizza.id === id);
}

function findSizeById(id) {
  return menu.sizes.find((size) => size.id === id);
}

function findToppingById(id) {
  return menu.toppings.find((topping) => topping.id === id);
}

function findOrderById(id) {
  return orders.find((order) => order.id === id);
}

function hasDuplicateToppings(toppingIds) {
  return new Set(toppingIds).size !== toppingIds.length;
}

function isValidStatus(status) {
  return validStatuses.includes(status);
}

function canMoveToStatus(currentStatus, newStatus) {
  return allowedStatusTransitions[currentStatus] === newStatus;
}

function validateOrderInput(body) {
  const { customerName, phone, deliveryAddress, pizzas } = body;

  if (!customerName || !phone || !deliveryAddress) {
    return "Customer name, phone and delivery address are required";
  }

  if (!Array.isArray(pizzas) || pizzas.length === 0) {
    return "Order must include at least one pizza";
  }

  for (const pizzaItem of pizzas) {
    const { pizzaId, sizeId, toppingIds } = pizzaItem;

    const pizza = findPizzaById(pizzaId);
    if (!pizza) {
      return `Invalid pizza id: ${pizzaId}`;
    }

    const size = findSizeById(sizeId);
    if (!size) {
      return `Invalid size id: ${sizeId}`;
    }

    if (!Array.isArray(toppingIds)) {
      return "toppingIds must be an array";
    }

    if (toppingIds.length > 3) {
      return "A pizza cannot have more than 3 toppings";
    }

    // Personal rule for ID ending with 8:
    // The same topping cannot be selected twice for the same pizza.
    if (hasDuplicateToppings(toppingIds)) {
      return "The same topping cannot be selected twice for the same pizza";
    }

    for (const toppingId of toppingIds) {
      const topping = findToppingById(toppingId);
      if (!topping) {
        return `Invalid topping id: ${toppingId}`;
      }
    }
  }

  return null;
}

function calculateTotalPrice(pizzas) {
  let total = 0;

  for (const pizzaItem of pizzas) {
    const pizza = findPizzaById(pizzaItem.pizzaId);
    const size = findSizeById(pizzaItem.sizeId);

    total += pizza.price;
    total += size.price;

    for (const toppingId of pizzaItem.toppingIds) {
      const topping = findToppingById(toppingId);
      total += topping.price;
    }
  }

  return total;
}

function buildOrderPizzas(pizzas) {
  return pizzas.map((pizzaItem) => {
    const pizza = findPizzaById(pizzaItem.pizzaId);
    const size = findSizeById(pizzaItem.sizeId);

    const toppings = pizzaItem.toppingIds.map((toppingId) => {
      return findToppingById(toppingId);
    });

    return {
      pizza,
      size,
      toppings
    };
  });
}

// GET /api/menu
app.get("/api/menu", (req, res) => {
  res.status(200).json(menu);
});

// POST /api/orders
app.post("/api/orders", (req, res) => {
  const validationError = validateOrderInput(req.body);

  if (validationError) {
    return res.status(400).json({
      error: validationError
    });
  }

  const totalPrice = calculateTotalPrice(req.body.pizzas);

  const newOrder = {
    id: String(nextOrderId),
    customerName: req.body.customerName,
    phone: req.body.phone,
    deliveryAddress: req.body.deliveryAddress,
    pizzas: buildOrderPizzas(req.body.pizzas),
    totalPrice,
    status: "new",
    paymentStatus: "paid",
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  nextOrderId++;

  res.status(201).json(newOrder);
});

// GET /api/orders?status=<status>
app.get("/api/orders", (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(200).json(orders);
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({
      error: "Invalid status"
    });
  }

  const filteredOrders = orders.filter((order) => order.status === status);

  res.status(200).json(filteredOrders);
});

// GET /api/orders/:id
app.get("/api/orders/:id", (req, res) => {
  const order = findOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  res.status(200).json(order);
});

// PATCH /api/orders/:id/status
app.patch("/api/orders/:id/status", (req, res) => {
  const order = findOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  const { status } = req.body;

  if (!status || !isValidStatus(status)) {
    return res.status(400).json({
      error: "Valid status is required"
    });
  }

  if (!canMoveToStatus(order.status, status)) {
    return res.status(409).json({
      error: `Cannot change order status from ${order.status} to ${status}`
    });
  }

  order.status = status;

  res.status(200).json(order);
});

app.listen(PORT, () => {
  console.log(`Pizza server is running on port ${PORT}`);
});