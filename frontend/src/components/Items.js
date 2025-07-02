import React, { useEffect, useState } from 'react';
import { getItems, createItem, getVendors, updateItem, deleteItem } from '../api';
import {
  Box, Grid, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Typography, Card, CardContent, Divider, Autocomplete, InputAdornment, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';

function descendingComparator(a, b, orderBy, vendors) {
  if (orderBy === 'vendor') {
    const aVendor = vendors.find(v => v.id === a.vendorId)?.name || '';
    const bVendor = vendors.find(v => v.id === b.vendorId)?.name || '';
    if (bVendor < aVendor) return -1;
    if (bVendor > aVendor) return 1;
    return 0;
  }
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy, vendors) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy, vendors)
    : (a, b) => -descendingComparator(a, b, orderBy, vendors);
}
function stableSort(array, comparator) {
  const stabilized = array.map((el, idx) => [el, idx]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map(el => el[0]);
}

export default function Items() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Add modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [measurementType, setMeasurementType] = useState('pcs');
  const [originalPrice, setOriginalPrice] = useState('');

  // Search and sort state
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const [itemPage, setItemPage] = useState(0);
  const [itemRowsPerPage, setItemRowsPerPage] = useState(10);

  useEffect(() => {
    getItems().then(setItems);
    getVendors().then(setVendors);
  }, []);

  useEffect(() => { setItemPage(0); }, [search, order, orderBy]);

  // Add a function to calculate and set selling price live
  const calculateSellingPrice = (origPrice, id) => {
    let discounts = [];
    try {
      discounts = JSON.parse(localStorage.getItem('discounts') || '[]');
    } catch {}
    let maxDiscountAmount = 0;
    for (const d of discounts) {
      if (d.productIds === 'all' || (Array.isArray(d.productIds) && d.productIds.includes(id))) {
        let discountAmount = 0;
        if (d.type === 'percent') {
          discountAmount = Number(origPrice) * (d.value / 100);
        } else if (d.type === 'amount') {
          discountAmount = Number(d.value);
        }
        discountAmount = Math.min(discountAmount, Number(origPrice));
        if (discountAmount > maxDiscountAmount) {
          maxDiscountAmount = discountAmount;
        }
      }
    }
    setSellingPrice(Math.max(0, Number(origPrice) - maxDiscountAmount));
  };

  // Add modal handlers
  const handleOpen = () => {
    setEditId(null);
    setName('');
    setStock('');
    setVendorId('');
    setBuyingPrice('');
    setOriginalPrice('');
    setSellingPrice('');
    setMeasurementType('pcs');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || stock === '' || originalPrice === '') return;
    // Fetch discounts from localStorage or API if needed
    let discounts = [];
    try {
      discounts = JSON.parse(localStorage.getItem('discounts') || '[]');
    } catch {}
    // Find all applicable discounts for this product
    let maxDiscountAmount = 0;
    let newSellingPrice = Number(originalPrice);
    for (const d of discounts) {
      if (d.productIds === 'all' || (Array.isArray(d.productIds) && d.productIds.includes(editId))) {
        let discountAmount = 0;
        if (d.type === 'percent') {
          discountAmount = Number(originalPrice) * (d.value / 100);
        } else if (d.type === 'amount') {
          discountAmount = Number(d.value);
        }
        // Don't allow discount greater than original price
        discountAmount = Math.min(discountAmount, Number(originalPrice));
        if (discountAmount > maxDiscountAmount) {
          maxDiscountAmount = discountAmount;
        }
      }
    }
    newSellingPrice = Math.max(0, Number(originalPrice) - maxDiscountAmount);
    if (editId) {
      const updated = await updateItem(editId, { name, stock, vendorId, buyingPrice, originalPrice, sellingPrice: newSellingPrice, measurementType });
      setItems(items.map(i => i.id === editId ? updated : i));
    } else {
      const item = await createItem({ name, stock, vendorId, buyingPrice, originalPrice, sellingPrice: newSellingPrice, measurementType });
      setItems([...items, item]);
    }
    handleClose();
  };

  // Edit modal handlers
  const startEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setStock(item.stock);
    setVendorId(item.vendorId || '');
    setBuyingPrice(item.buyingPrice || '');
    setOriginalPrice(item.originalPrice || item.sellingPrice || '');
    setMeasurementType(item.measurementType || 'pcs');
    setModalOpen(true);
    calculateSellingPrice(item.originalPrice || item.sellingPrice || '', item.id);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
    setName('');
    setStock('');
    setVendorId('');
    setBuyingPrice('');
    setOriginalPrice('');
    setSellingPrice('');
    setMeasurementType('pcs');
  };

  const handleDeleteRequest = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteItem(deleteId);
    setItems(items.filter(i => i.id !== deleteId));
    setConfirmOpen(false);
    setDeleteId(null);
    setDeleteName('');
  };

  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setDeleteId(null);
    setDeleteName('');
  };

  // Search and sort logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredItems = items.filter(item => {
    const vendorName = vendors.find(v => v.id === item.vendorId)?.name || '';
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.stock + '').includes(search) ||
      (item.buyingPrice + '').includes(search) ||
      (item.sellingPrice + '').includes(search) ||
      vendorName.toLowerCase().includes(search.toLowerCase())
    );
  });
  const sortedItems = stableSort(filteredItems, getComparator(order, orderBy, vendors));

  // Add useEffect to recalculate selling price when originalPrice or editId changes
  useEffect(() => {
    if (modalOpen && originalPrice !== '') {
      calculateSellingPrice(originalPrice, editId);
    }
  }, [originalPrice, editId, modalOpen]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 250, mb: { xs: 1, sm: 0 } }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} color="primary">
          Add Product
        </Button>
      </Box>
      {/* Add Modal */}
      <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Product Info</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" required autoFocus />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} fullWidth size="small" required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Unit</InputLabel>
                    <Select value={measurementType} label="Unit" onChange={e => setMeasurementType(e.target.value)}>
                      <MenuItem value="pcs">pcs</MenuItem>
                      <MenuItem value="kg">kg</MenuItem>
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="L">L</MenuItem>
                      <MenuItem value="ml">ml</MenuItem>
                      <MenuItem value="box">box</MenuItem>
                      <MenuItem value="bag">bag</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Original Price" type="number" value={originalPrice} onChange={e => { setOriginalPrice(e.target.value); calculateSellingPrice(e.target.value, editId); }} fullWidth size="small" required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Selling Price (auto)" type="number" value={sellingPrice} fullWidth size="small" InputProps={{ readOnly: true }} />
                </Grid>
              </Grid>
            </Paper>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Buying Price" type="number" value={buyingPrice} onChange={e => setBuyingPrice(e.target.value)} fullWidth size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Vendor</Typography>
              <Autocomplete
                options={vendors}
                getOptionLabel={option => option.name || ''}
                value={vendors.find(v => v.id === vendorId) || null}
                onChange={(_, newValue) => setVendorId(newValue ? newValue.id : '')}
                renderInput={params => <TextField {...params} label="Vendor" size="small" fullWidth />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Paper>
            <DialogActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleClose} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{editId ? 'Save' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'stock' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'stock'}
                  direction={orderBy === 'stock' ? order : 'asc'}
                  onClick={() => handleRequestSort('stock')}
                >
                  Stock
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'buyingPrice' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'buyingPrice'}
                  direction={orderBy === 'buyingPrice' ? order : 'asc'}
                  onClick={() => handleRequestSort('buyingPrice')}
                >
                  Buying Price
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'originalPrice' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'originalPrice'}
                  direction={orderBy === 'originalPrice' ? order : 'asc'}
                  onClick={() => handleRequestSort('originalPrice')}
                >
                  Original Price
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'sellingPrice' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'sellingPrice'}
                  direction={orderBy === 'sellingPrice' ? order : 'asc'}
                  onClick={() => handleRequestSort('sellingPrice')}
                >
                  Selling Price
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'vendor' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'vendor'}
                  direction={orderBy === 'vendor' ? order : 'asc'}
                  onClick={() => handleRequestSort('vendor')}
                >
                  Vendor
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.slice(itemPage * itemRowsPerPage, itemPage * itemRowsPerPage + itemRowsPerPage).map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.stock} {item.measurementType || 'pcs'}</TableCell>
                <TableCell>{item.buyingPrice ? `৳${item.buyingPrice}` : ''}</TableCell>
                <TableCell>{item.originalPrice ? `৳${item.originalPrice}` : ''}</TableCell>
                <TableCell>{item.sellingPrice ? `৳${item.sellingPrice}` : ''}</TableCell>
                <TableCell>{vendors.find(v => v.id === item.vendorId)?.name || ''}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => startEdit(item)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDeleteRequest(item.id, item.name)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {sortedItems.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No items found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sortedItems.length}
          page={itemPage}
          onPageChange={(_, newPage) => setItemPage(newPage)}
          rowsPerPage={itemRowsPerPage}
          onRowsPerPageChange={e => {
            setItemRowsPerPage(parseInt(e.target.value, 10));
            setItemPage(0);
          }}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <b>{deleteName}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 