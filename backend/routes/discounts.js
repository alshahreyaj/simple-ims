const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all discounts
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.discounts || []);
});

// Add a new discount
router.post('/', async (req, res) => {
  const { name, type, value, productIds } = req.body;
  if (!name || !type || value == null || !productIds) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await db.read();
  const newDiscount = {
    id: Date.now().toString(),
    name,
    type, // 'amount' or 'percent'
    value: Number(value),
    productIds,
    createdAt: new Date().toISOString()
  };
  db.data.discounts.push(newDiscount);
  await db.write();
  res.status(201).json(newDiscount);
});

// Edit a discount
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, value, productIds } = req.body;
  await db.read();
  const discount = db.data.discounts.find(d => d.id === id);
  if (!discount) return res.status(404).json({ error: 'Discount not found' });
  if (name !== undefined) discount.name = name;
  if (type !== undefined) discount.type = type;
  if (value !== undefined) discount.value = Number(value);
  if (productIds !== undefined) discount.productIds = productIds;
  await db.write();
  res.json(discount);
});

// Delete a discount
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const idx = db.data.discounts.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Discount not found' });
  const deleted = db.data.discounts.splice(idx, 1)[0];
  await db.write();
  res.json(deleted);
});

module.exports = router; 