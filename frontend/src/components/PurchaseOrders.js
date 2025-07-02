import React, { useEffect, useState } from 'react';
import { getPurchaseOrders, createPurchaseOrder, getItems, getVendors } from '../api';
import {
  Box, Grid, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [vendorId, setVendorId] = useState('');

  useEffect(() => {
    getPurchaseOrders().then(setPurchaseOrders);
    getItems().then(setItems);
    getVendors().then(setVendors);
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!itemId || !quantity || !vendorId) return;
    const po = await createPurchaseOrder({ itemId, quantity, vendorId });
    setPurchaseOrders([...purchaseOrders, po]);
    setItemId('');
    setQuantity('');
    setVendorId('');
  };

  return (
    <Box>
      <Box component="form" onSubmit={handleCreate} sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Item</InputLabel>
              <Select value={itemId} label="Item" onChange={e => setItemId(e.target.value)} required>
                <MenuItem value=""><em>None</em></MenuItem>
                {items.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} fullWidth size="small" required />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Vendor</InputLabel>
              <Select value={vendorId} label="Vendor" onChange={e => setVendorId(e.target.value)} required>
                <MenuItem value=""><em>None</em></MenuItem>
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button type="submit" variant="contained" color="primary" fullWidth>Add PO</Button>
          </Grid>
        </Grid>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseOrders.map(po => (
              <TableRow key={po.id}>
                <TableCell>{items.find(i => i.id === po.itemId)?.name || po.itemId}</TableCell>
                <TableCell>{po.quantity}</TableCell>
                <TableCell>{vendors.find(v => v.id === po.vendorId)?.name || po.vendorId}</TableCell>
                <TableCell>{new Date(po.date).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 