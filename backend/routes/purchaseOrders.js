const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all purchase orders
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.purchaseOrders || []);
});

// Create purchase order (update stock)
router.post('/', async (req, res) => {
  const { itemId, quantity, vendorId } = req.body;
  if (!itemId || !quantity || !vendorId) return res.status(400).json({ error: 'itemId, quantity, and vendorId required' });
  await db.read();
  const item = db.data.items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.stock += Number(quantity);
  const po = {
    id: Date.now().toString(),
    itemId,
    quantity: Number(quantity),
    vendorId,
    date: new Date().toISOString()
  };
  db.data.purchaseOrders.push(po);
  await db.write();
  res.status(201).json(po);
});

module.exports = router; 