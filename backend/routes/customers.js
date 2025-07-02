const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all customers
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.customers || []);
});

// Create new customer
router.post('/', async (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await db.read();
  const newCustomer = {
    id: Date.now().toString(),
    name,
    phone: phone || '',
    address: address || '',
    due: 0
  };
  db.data.customers.push(newCustomer);
  await db.write();
  res.status(201).json(newCustomer);
});

// Update due
router.patch('/:id/due', async (req, res) => {
  const { id } = req.params;
  const { due } = req.body;
  await db.read();
  const customer = db.data.customers.find(c => c.id === id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  customer.due = Number(due);
  await db.write();
  res.json(customer);
});

// Delete customer
router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = (db.data.customers || []).findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  const customer = db.data.customers[idx];
  if (customer.due > 0) return res.status(400).json({ error: 'Cannot delete customer with due > 0' });
  db.data.customers.splice(idx, 1);
  await db.write();
  res.json({ success: true });
});

// Update customer (name, phone, address, due)
router.put('/:id', async (req, res) => {
  await db.read();
  const customer = db.data.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const { name, phone, address, due } = req.body;
  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (address !== undefined) customer.address = address;
  if (due !== undefined) customer.due = Number(due);
  await db.write();
  res.json(customer);
});

// Add customer summary endpoint
router.get('/:id/summary', async (req, res) => {
  await db.read();
  const customer = db.data.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const orders = (db.data.orders || []).filter(o => o.customerId === customer.id);
  const totalBuy = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  res.json({ ...customer, totalBuy });
});

module.exports = router; 