const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all items
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.items || []);
});

// Create new item
router.post('/', async (req, res) => {
  const { name, stock, vendorId, buyingPrice, sellingPrice, originalPrice, measurementType } = req.body;
  if (!name || stock == null) return res.status(400).json({ error: 'Name and stock required' });
  await db.read();
  const newItem = {
    id: Date.now().toString(),
    name,
    stock: Number(stock),
    vendorId: vendorId || null,
    buyingPrice: buyingPrice != null ? Number(buyingPrice) : null,
    sellingPrice: sellingPrice != null ? Number(sellingPrice) : null,
    originalPrice: originalPrice != null ? Number(originalPrice) : null,
    measurementType: measurementType || 'pcs'
  };
  db.data.items.push(newItem);
  await db.write();
  res.status(201).json(newItem);
});

// Update item (name, prices, vendor, etc.)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stock, vendorId, buyingPrice, sellingPrice, originalPrice, measurementType } = req.body;
  await db.read();
  const item = db.data.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (name !== undefined) item.name = name;
  if (stock !== undefined) item.stock = Number(stock);
  if (vendorId !== undefined) item.vendorId = vendorId;
  if (buyingPrice !== undefined) item.buyingPrice = Number(buyingPrice);
  if (sellingPrice !== undefined) item.sellingPrice = Number(sellingPrice);
  if (originalPrice !== undefined) item.originalPrice = Number(originalPrice);
  if (measurementType !== undefined) item.measurementType = measurementType;
  await db.write();
  res.json(item);
});

// Delete item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const idx = db.data.items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const deleted = db.data.items.splice(idx, 1)[0];
  await db.write();
  res.json(deleted);
});

// Update stock
router.patch('/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  await db.read();
  const item = db.data.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.stock = Number(stock);
  await db.write();
  res.json(item);
});

module.exports = router; 