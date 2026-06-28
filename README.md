# Pizza Ordering System

## Students

Student 1: Amjad Jubran
ID: 211875828

Student 2: Naseem Srour
ID: 214229627

## Repository Link

https://github.com/Amjadjub/pizza_app

---

## Project Description

This project is a simple pizza ordering system implemented with a server side and a client side.

The system allows a customer to view the menu, build a pizza order, perform a fake payment, receive an order confirmation, and track the order status.

The system also includes a restaurant employee section and a delivery worker section. The restaurant employee can update orders from `new` to `preparing` and from `preparing` to `ready`. The delivery worker can see orders that are ready for delivery and update them to `delivered`.

The client is implemented as a single-page React interface with separate sections for the customer, restaurant employee, and delivery worker.

---

## Technologies Used

### Server

* Node.js
* Express
* REST API
* CORS

### Client

* React
* Vite

### Data Storage

Orders are stored in memory only.
There is no database in this project.

---

## Project Structure

```text
pizza_app_211875828
├── server
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── client
│   ├── src
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## How to Run the Server

Open a terminal in the server folder:

```bash
cd server
npm install
npm start
```

The server runs on:

```text
http://localhost:3001
```

If the environment variable `PORT` is defined, the server will use it.
Otherwise, it uses port `3001`.

---

## How to Run the Client

Open another terminal in the client folder:

```bash
cd client
npm install
npm run dev
```

The client runs on:

```text
http://localhost:5173
```

To build the client:

```bash
npm run build
```

---

## Server API Endpoints

### Get Menu

```http
GET /api/menu
```

Returns the pizza menu, sizes, and toppings.

### Create Order

```http
POST /api/orders
```

Creates a new order.

The request body must include:

```json
{
  "customerName": "Customer Name",
  "phone": "0500000000",
  "deliveryAddress": "Address",
  "pizzas": []
}
```

### Get Order by ID

```http
GET /api/orders/:id
```

Returns a specific order by its ID.

### Filter Orders by Status

```http
GET /api/orders?status=<status>
```

Returns orders filtered by status.

Supported statuses:

```text
new
preparing
ready
delivered
```

If no matching orders exist, the server returns an empty array.

### Update Order Status

```http
PATCH /api/orders/:id/status
```

Request body:

```json
{
  "status": "preparing"
}
```

Allowed status transitions:

```text
new → preparing → ready → delivered
```

Skipping a status is not allowed.

---

## Price Calculation

The final order price is calculated only on the server.

The client displays an estimated price to help the customer, but the real final price is calculated again by the server when the order is created.

This is important because the server is the source of truth. A user can change data in the browser, so the system must not trust prices sent from the client.

The server calculates the price according to:

* selected pizza type
* selected size
* selected toppings
* valid menu prices stored on the server

---

## Personal Business Rule

The last digit of the submitting student's ID is:

```text
8
```

Therefore, the personal rule is:

```text
The same topping cannot be selected twice for the same pizza.
```

Example of an invalid pizza:

```json
{
  "pizzaId": "margherita",
  "sizeId": "medium",
  "toppingIds": ["olives", "olives"]
}
```

This rule is implemented on the server in `server/index.js`.

The validation checks whether the same topping ID appears more than once in the same pizza. If it does, the server rejects the order with status code `400`.

---

## Changes from Exercise 1

The implementation is based on the previous UML planning exercise.

Small implementation adjustments were made in order to keep the system simple and suitable for this assignment:

* The client is implemented as one React page with separate sections for each role.
* There is no real authentication system.
* There is no real payment system.
* Orders are stored in memory only and not in a database.
* The employee and delivery worker sections are visible on the same page for simplicity.

These changes were made because the assignment focuses on server logic, client-server communication, validation, and order status management.

---

## Required Client Test IDs

The following required `data-testid` values are implemented in the React client:

```text
data-testid="menu-list"
data-testid="cart"
data-testid="order-summary-panel"
data-testid="checkout-button"
data-testid="order-confirmation"
data-testid="employee-orders"
data-testid="delivery-orders"
```

---

## Answers to Required Questions

### Question 1: What is the difference between the client side and the server side in your system?

The client side is the React user interface. It displays the menu, allows the customer to build an order, shows the cart, sends requests to the server, and displays order status updates.

The server side is the Express application. It stores the menu and orders, validates the input, calculates the final price, saves orders in memory, and controls legal order status transitions.

---

### Question 2: Where is the total price calculated and why?

The total price is calculated on the server.

The client shows only an estimated price. The final price must be calculated on the server because the server is the source of truth and should not trust data coming from the browser.

---

### Question 3: What happens when a customer sends an invalid order?

When the customer sends an invalid order, the server rejects the request and returns status code `400`.

Examples of invalid orders:

* missing customer name
* missing phone
* missing delivery address
* no pizzas in the order
* invalid pizza ID
* invalid size ID
* invalid topping ID
* more than three toppings on one pizza
* the same topping selected twice for the same pizza

The client displays the error message returned by the server.

---

### Question 4: What happens after the fake payment succeeds?

After the fake payment succeeds, the client sends the order to the server.

If the order is valid, the server creates a new order, calculates the final price, gives the order a unique ID, sets the order status to `new`, sets the payment status to `paid`, and returns the order confirmation to the client.

The client then displays the order number, current status, payment status, and final price from the server.

---

### Question 5: What is your personal business rule?

The personal business rule is based on the last digit `8`.

The rule is:

```text
The same topping cannot be selected twice for the same pizza.
```

This rule is implemented on the server in the order validation logic.

---

### Question 6: What was the most challenging part of the assignment?

The most challenging part was connecting the client and the server correctly and making sure the order flow works from beginning to end.

This included sending the correct request body from React, validating it on the server, calculating the price on the server, saving the order in memory, and updating the order status correctly.

---

### Question 7: What is one design decision you made and why?

One design decision was to build the React client as a single-page interface with separate sections for the customer, restaurant employee, and delivery worker.

This decision keeps the system simple and clear while still allowing each role to perform the required actions. Since the assignment does not require authentication or multiple pages, this approach is enough for the project requirements.

---

## Notes

* The system does not use a database.
* The system does not include real authentication.
* The system does not include real payment processing.
* The payment action is simulated.
* Orders are deleted when the server process restarts because they are stored only in memory.
