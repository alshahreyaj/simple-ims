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
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await db.read();
  const newVendor = {
    id: Date.now().toString(),
    name
  };
  db.data.vendors.push(newVendor);
  await db.write();
  res.status(201).json(newVendor);
});

module.exports = router; 