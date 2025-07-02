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
  const { vendorId, products, payAmount, discount, discountType } = req.body;
  if (!vendorId || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'vendorId and products required' });
  }
  await db.read();
  // Validate vendor
  const vendor = db.data.vendors.find(v => v.id === vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  // Validate and update each product
  let subtotal = 0;
  for (const p of products) {
    const item = db.data.items.find(i => i.id === p.itemId);
    if (!item) return res.status(404).json({ error: `Item not found: ${p.itemId}` });
    const qty = Number(p.quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });
    item.stock += qty;
    subtotal += (Number(p.buyingPrice) || 0) * qty;
  }
  let discountNum = 0;
  if (discountType === 'percent') {
    discountNum = subtotal * (Number(discount) || 0) / 100;
  } else {
    discountNum = Number(discount) || 0;
  }
  const totalBuyAmount = subtotal - discountNum;
  const paid = Number(payAmount) || 0;
  const due = totalBuyAmount - paid;
  // Update vendor's due and total purchase
  vendor.dueAmount = (Number(vendor.dueAmount) || 0) + due;
  vendor.totalPurchase = (Number(vendor.totalPurchase) || 0) + totalBuyAmount;
  // Store purchase order
  const po = {
    id: Date.now().toString(),
    vendorId,
    products: products.map(p => ({ itemId: p.itemId, quantity: Number(p.quantity), buyingPrice: Number(p.buyingPrice) || 0 })),
    subtotal,
    discount,
    discountType,
    discountNum,
    totalBuyAmount,
    payAmount: paid,
    dueAmount: due,
    date: new Date().toISOString()
  };
  db.data.purchaseOrders.push(po);
  await db.write();
  res.status(201).json(po);
});

// Update purchase order
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vendorId, products, payAmount, discount, discountType } = req.body;
  if (!vendorId || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'vendorId and products required' });
  }
  await db.read();
  const po = db.data.purchaseOrders.find(po => po.id === id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  // Rollback previous stock and vendor due/totalPurchase
  const prevVendor = db.data.vendors.find(v => v.id === po.vendorId);
  let prevTotal = po.totalBuyAmount || 0;
  let prevDue = po.dueAmount || 0;
  if (prevVendor) {
    prevVendor.dueAmount = (Number(prevVendor.dueAmount) || 0) - prevDue;
    prevVendor.totalPurchase = (Number(prevVendor.totalPurchase) || 0) - prevTotal;
  }
  for (const p of po.products) {
    const item = db.data.items.find(i => i.id === p.itemId);
    if (item) item.stock -= Number(p.quantity);
  }
  // Validate new vendor
  const vendor = db.data.vendors.find(v => v.id === vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  // Validate and update each product
  let subtotal = 0;
  for (const p of products) {
    const item = db.data.items.find(i => i.id === p.itemId);
    if (!item) return res.status(404).json({ error: `Item not found: ${p.itemId}` });
    const qty = Number(p.quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });
    item.stock += qty;
    subtotal += (Number(p.buyingPrice) || 0) * qty;
  }
  let discountNum = 0;
  if (discountType === 'percent') {
    discountNum = subtotal * (Number(discount) || 0) / 100;
  } else {
    discountNum = Number(discount) || 0;
  }
  const totalBuyAmount = subtotal - discountNum;
  const paid = Number(payAmount) || 0;
  const due = totalBuyAmount - paid;
  // Update vendor's due and total purchase
  vendor.dueAmount = (Number(vendor.dueAmount) || 0) + due;
  vendor.totalPurchase = (Number(vendor.totalPurchase) || 0) + totalBuyAmount;
  // Update PO
  po.vendorId = vendorId;
  po.products = products.map(p => ({ itemId: p.itemId, quantity: Number(p.quantity), buyingPrice: Number(p.buyingPrice) || 0 }));
  po.totalBuyAmount = totalBuyAmount;
  po.payAmount = paid;
  po.dueAmount = due;
  po.discount = discount;
  po.discountType = discountType;
  po.discountNum = discountNum;
  po.date = new Date().toISOString();
  await db.write();
  res.json(po);
});

// Delete purchase order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const idx = db.data.purchaseOrders.findIndex(po => po.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Purchase order not found' });
  const po = db.data.purchaseOrders[idx];
  // Rollback stock and vendor due/totalPurchase
  const vendor = db.data.vendors.find(v => v.id === po.vendorId);
  if (vendor) {
    vendor.dueAmount = (Number(vendor.dueAmount) || 0) - (po.dueAmount || 0);
    vendor.totalPurchase = (Number(vendor.totalPurchase) || 0) - (po.totalBuyAmount || 0);
  }
  for (const p of po.products) {
    const item = db.data.items.find(i => i.id === p.itemId);
    if (item) item.stock -= Number(p.quantity);
  }
  db.data.purchaseOrders.splice(idx, 1);
  await db.write();
  res.json({ success: true });
});

// Pay due for a vendor
router.post('/pay-due', async (req, res) => {
  const { vendorId, amount } = req.body;
  if (!vendorId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid input' });
  await db.read();
  let remaining = amount;
  // Get all POs for this vendor, oldest first, with dueAmount > 0
  const pos = (db.data.purchaseOrders || [])
    .filter(po => po.vendorId === vendorId && po.dueAmount > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const po of pos) {
    if (remaining <= 0) break;
    const pay = Math.min(po.dueAmount, remaining);
    po.payAmount = (po.payAmount || 0) + pay;
    po.dueAmount = (po.dueAmount || 0) - pay;
    remaining -= pay;
  }
  // Recalculate vendor due
  const vendor = db.data.vendors.find(v => v.id === vendorId);
  if (vendor) {
    vendor.dueAmount = (db.data.purchaseOrders || [])
      .filter(po => po.vendorId === vendorId)
      .reduce((sum, po) => sum + (po.dueAmount || 0), 0);
  }
  await db.write();
  res.json({ success: true });
});

module.exports = router; 