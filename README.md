# Inventory Management System (IMS)

A simple inventory management system with a Node.js/Express backend and a React frontend. The backend uses a JSON file as its database and provides RESTful APIs for managing items, customers, orders, vendors, and purchase orders.

## Project Structure

```
IMS2/
  backend/         # Node.js/Express backend
    routes/        # API route handlers
    db.json        # JSON database
    app.js, index.js
  frontend/        # React frontend (Create React App)
    src/
    public/
  .gitignore
  README.md
```

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- npm

### Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies (if a package.json is added):
   ```sh
   npm install
   ```
3. Start the backend server:
   ```sh
   node index.js
   ```
   The backend runs on [http://localhost:4000](http://localhost:4000).

### Frontend Setup
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend app:
   ```sh
   npm start
   ```
   The frontend runs on [http://localhost:3000](http://localhost:3000).

## API Overview

### Customers
- `GET    /api/customers` — List all customers
- `POST   /api/customers` — Create a new customer
- `PUT    /api/customers/:id` — Update customer details
- `PATCH  /api/customers/:id/due` — Update customer due
- `DELETE /api/customers/:id` — Delete a customer (if due is 0)
- `GET    /api/customers/:id/summary` — Get customer summary

### Items
- `GET    /api/items` — List all items
- `POST   /api/items` — Create a new item
- `PUT    /api/items/:id` — Update item details
- `PATCH  /api/items/:id/stock` — Update item stock
- `DELETE /api/items/:id` — Delete an item

### Orders
- `GET    /api/orders` — List all orders
- `GET    /api/orders/:id` — Get order by ID
- `POST   /api/orders` — Create a new order
- `PUT    /api/orders/:id` — Update an order
- `DELETE /api/orders/:id` — Delete an order

### Vendors
- `GET    /api/vendors` — List all vendors
- `POST   /api/vendors` — Create a new vendor

### Purchase Orders
- `GET    /api/purchase-orders` — List all purchase orders
- `POST   /api/purchase-orders` — Create a new purchase order (updates item stock)

## Database
- The backend uses `backend/db.json` to store all data (items, customers, orders, vendors, purchase orders).

## Notes
- The frontend and backend must be run separately.
- You may need to add a `package.json` to the backend for dependency management.
- The frontend was bootstrapped with Create React App. See `frontend/README.md` for more details.

---
Feel free to contribute or customize as needed!