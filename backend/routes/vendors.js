const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all vendors
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.vendors || []);
});

// Create new vendor
router.post('/', async (req, res) => {
  const { name, address, phone, totalPurchase, dueAmount } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await db.read();
  const newVendor = {
    id: Date.now().toString(),
    name,
    address: address || '',
    phone: phone || '',
    totalPurchase: totalPurchase || 0,
    dueAmount: dueAmount || 0
  };
  db.data.vendors.push(newVendor);
  await db.write();
  res.status(201).json(newVendor);
});

// Update vendor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, totalPurchase, dueAmount } = req.body;
  await db.read();
  const vendor = db.data.vendors.find(v => v.id === id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  if (name !== undefined) vendor.name = name;
  if (address !== undefined) vendor.address = address;
  if (phone !== undefined) vendor.phone = phone;
  if (totalPurchase !== undefined) vendor.totalPurchase = totalPurchase;
  if (dueAmount !== undefined) vendor.dueAmount = dueAmount;
  await db.write();
  res.json(vendor);
});

// Delete vendor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const idx = db.data.vendors.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Vendor not found' });
  const deleted = db.data.vendors.splice(idx, 1)[0];
  await db.write();
  res.json(deleted);
});

module.exports = router; 