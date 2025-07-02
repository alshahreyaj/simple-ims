import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Snackbar, Alert, Select, MenuItem, InputLabel, FormControl, Autocomplete, Checkbox, ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getItems, updateItem } from '../api';

const API_URL = 'http://localhost:4000/api/discounts';

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('amount');
  const [value, setValue] = useState('');
  const [productIds, setProductIds] = useState([]);
  const [allProducts, setAllProducts] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  useEffect(() => {
    fetchDiscounts();
    getItems().then(setItems);
  }, []);

  const fetchDiscounts = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setDiscounts(data);
    localStorage.setItem('discounts', JSON.stringify(data));
    await updateAllItemsSellingPrice();
  };

  const handleOpenModal = (discount = null) => {
    if (discount) {
      setEditId(discount.id);
      setName(discount.name);
      setType(discount.type);
      setValue(discount.value);
      setAllProducts(discount.productIds === 'all');
      setProductIds(discount.productIds === 'all' ? [] : discount.productIds);
    } else {
      setEditId(null);
      setName('');
      setType('amount');
      setValue('');
      setAllProducts(false);
      setProductIds([]);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditId(null);
    setName('');
    setType('amount');
    setValue('');
    setAllProducts(false);
    setProductIds([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || value === '' || (!allProducts && productIds.length === 0)) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    const discount = {
      name,
      type,
      value: Number(value),
      productIds: allProducts ? 'all' : productIds
    };
    try {
      if (editId) {
        await fetch(`${API_URL}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discount)
        });
        setSnackbar({ open: true, message: 'Discount updated', severity: 'success' });
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discount)
        });
        setSnackbar({ open: true, message: 'Discount added', severity: 'success' });
      }
      fetchDiscounts();
      handleCloseModal();
    } catch {
      setSnackbar({ open: true, message: 'Failed to save discount', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    await fetch(`${API_URL}/${confirmDelete.id}`, { method: 'DELETE' });
    setSnackbar({ open: true, message: 'Discount deleted', severity: 'success' });
    setConfirmDelete({ open: false, id: null });
    fetchDiscounts();
  };

  const handleDeleteCancel = () => setConfirmDelete({ open: false, id: null });

  const updateAllItemsSellingPrice = async () => {
    let discounts = [];
    try {
      discounts = JSON.parse(localStorage.getItem('discounts') || '[]');
    } catch {}
    const items = await getItems();
    for (const item of items) {
      let maxDiscountAmount = 0;
      for (const d of discounts) {
        if (d.productIds === 'all' || (Array.isArray(d.productIds) && d.productIds.includes(item.id))) {
          let discountAmount = 0;
          if (d.type === 'percent') {
            discountAmount = Number(item.originalPrice || item.sellingPrice) * (d.value / 100);
          } else if (d.type === 'amount') {
            discountAmount = Number(d.value);
          }
          discountAmount = Math.min(discountAmount, Number(item.originalPrice || item.sellingPrice));
          if (discountAmount > maxDiscountAmount) {
            maxDiscountAmount = discountAmount;
          }
        }
      }
      const newSellingPrice = Math.max(0, Number(item.originalPrice || item.sellingPrice) - maxDiscountAmount);
      if (item.sellingPrice !== newSellingPrice) {
        await updateItem(item.id, { ...item, sellingPrice: newSellingPrice });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Discount Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Add Discount
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discounts.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.type}</TableCell>
                <TableCell>{d.type === 'percent' ? `${d.value}%` : `৳${d.value}`}</TableCell>
                <TableCell>
                  {d.productIds === 'all' ? 'All Products' :
                    d.productIds.map(pid => items.find(i => i.id === pid)?.name).filter(Boolean).join(', ')}
                </TableCell>
                <TableCell>{d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenModal(d)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(d.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {discounts.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No discounts found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSave} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" required sx={{ mb: 2 }} />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select value={type} label="Type" onChange={e => setType(e.target.value)}>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="percent">Percent</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Value" type="number" value={value} onChange={e => setValue(e.target.value)} fullWidth size="small" required sx={{ mb: 2 }} />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={allProducts}
                  onChange={e => {
                    setAllProducts(e.target.checked);
                    if (e.target.checked) setProductIds([]);
                  }}
                  id="all-products-checkbox"
                />
                <label htmlFor="all-products-checkbox" style={{ cursor: 'pointer' }}>All Products</label>
              </Box>
              <Autocomplete
                multiple
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.filter(i => productIds.includes(i.id))}
                onChange={(_, newValue) => setProductIds(newValue.map(i => i.id))}
                disabled={allProducts}
                renderInput={params => <TextField {...params} label="Products" placeholder="Search products..." size="small" />}
              />
            </FormControl>
            <DialogActions>
              <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{editId ? 'Save' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDelete.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Discount</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this discount?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 