const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all orders
router.get('/', async (req, res) => {
  await db.read();
  const orders = (db.data.orders || []).map(order => {
    if (order.total != null) {
      return order;
    }
    // fallback: calculate total if missing
    const itemsTotal = (order.items || []).reduce((sum, oi) => {
      const item = db.data.items.find(i => i.id === oi.itemId);
      return sum + (item ? item.price * oi.quantity : 0);
    }, 0);
    let discount = order.discount || 0;
    if (order.discountType === 'percent' && order.discountPercent !== undefined) {
      discount = Math.round(itemsTotal * (order.discountPercent / 100));
    }
    return { ...order, total: itemsTotal - discount };
  });
  res.json(orders);
});

// Get order by id
router.get('/:id', async (req, res) => {
  await db.read();
  const order = (db.data.orders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Create order
router.post('/', async (req, res) => {
  const { customerId, items, discount, discountType, paid, due, date, tempCustomer } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Order must have items' });
  await db.read();
  // Check and update stock
  for (const oi of items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    if (!item) return res.status(400).json({ error: `Item not found: ${oi.itemId}` });
    if (item.stock < oi.quantity) return res.status(400).json({ error: `Insufficient stock for item: ${item.name}` });
  }
  for (const oi of items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    item.stock -= oi.quantity;
  }
  // Calculate total using oi.price from frontend
  const itemsTotal = (items || []).reduce((sum, oi) => {
    return sum + ((oi.price || 0) * oi.quantity);
  }, 0);
  let calcDiscount = discount || 0;
  let discountPercent = req.body.discountPercent;
  if (discountType === 'percent' && discountPercent !== undefined) {
    calcDiscount = Math.round(itemsTotal * (discountPercent / 100));
  }
  const total = itemsTotal - calcDiscount;
  const order = {
    id: Date.now().toString(),
    customerId,
    items,
    discount: discount || 0,
    discountType: discountType || 'amount',
    paid: paid || 0,
    due: due || 0,
    date: date || new Date().toISOString(),
    tempCustomer: tempCustomer || null,
    total,
  };
  if (discountType === 'percent' && discountPercent !== undefined) {
    order.discountPercent = discountPercent;
  }
  db.data.orders = db.data.orders || [];
  db.data.orders.push(order);
  recalcCustomerDue(db, customerId);
  await db.write();
  res.status(201).json(order);
});

// Helper to recalculate customer due
function recalcCustomerDue(db, customerId) {
  if (!customerId) return;
  let customer = db.data.customers.find(c => c.id === customerId);
  if (!customer) {
    // Add missing customer with due = 0
    customer = { id: customerId, name: 'Unknown', due: 0 };
    db.data.customers.push(customer);
  }
  customer.due = (db.data.orders || [])
    .filter(o => o.customerId === customerId)
    .reduce((sum, o) => sum + (o.due || 0), 0);
}

// Update order
router.put('/:id', async (req, res) => {
  await db.read();
  const idx = (db.data.orders || []).findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  const oldOrder = db.data.orders[idx];
  const oldCustomerId = oldOrder.customerId;
  const { customerId, items, discount, discountType, paid, due, date, tempCustomer } = req.body;
  // Revert old stock
  for (const oi of oldOrder.items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    if (item) item.stock += oi.quantity;
  }
  // Check and update new stock
  for (const oi of items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    if (!item) return res.status(400).json({ error: `Item not found: ${oi.itemId}` });
    if (item.stock < oi.quantity) return res.status(400).json({ error: `Insufficient stock for item: ${item.name}` });
  }
  for (const oi of items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    item.stock -= oi.quantity;
  }
  // Calculate total using oi.price from frontend
  const itemsTotal = (items || []).reduce((sum, oi) => {
    return sum + ((oi.price || 0) * oi.quantity);
  }, 0);
  let calcDiscount = discount || 0;
  let discountPercent = req.body.discountPercent;
  if (discountType === 'percent' && discountPercent !== undefined) {
    calcDiscount = Math.round(itemsTotal * (discountPercent / 100));
  }
  const total = itemsTotal - calcDiscount;
  db.data.orders[idx] = {
    ...db.data.orders[idx],
    ...req.body,
    total,
  };
  if (discountType === 'percent' && discountPercent !== undefined) {
    db.data.orders[idx].discountPercent = discountPercent;
  }
  recalcCustomerDue(db, oldCustomerId);
  recalcCustomerDue(db, customerId);
  await db.write();
  res.json(db.data.orders[idx]);
});

// Delete order
router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = (db.data.orders || []).findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  const [deleted] = db.data.orders.splice(idx, 1);
  // Revert stock
  for (const oi of deleted.items) {
    const item = db.data.items.find(i => i.id === oi.itemId);
    if (item) item.stock += oi.quantity;
  }
  recalcCustomerDue(db, deleted.customerId);
  await db.write();
  res.json(deleted);
});

module.exports = router; 