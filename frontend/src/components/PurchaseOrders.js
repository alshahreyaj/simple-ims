import React, { useEffect, useState } from 'react';
import { getPurchaseOrders, createPurchaseOrder, getItems, getVendors, deletePurchaseOrder, updatePurchaseOrder } from '../api';
import {
  Box, Grid, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Divider, Card, CardContent, TablePagination
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [products, setProducts] = useState([{ itemId: '', quantity: 1 }]);
  const [payAmount, setPayAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('amount');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPO, setDetailsPO] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, po: null });
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [filterVendor, setFilterVendor] = useState(null);
  const [poPage, setPoPage] = useState(0);
  const [poRowsPerPage, setPoRowsPerPage] = useState(10);
  const [detailsProductsPage, setDetailsProductsPage] = useState(0);
  const [detailsProductsRowsPerPage, setDetailsProductsRowsPerPage] = useState(10);

  useEffect(() => {
    getPurchaseOrders().then(setPurchaseOrders);
    getItems().then(setItems);
    getVendors().then(setVendors);
  }, []);

  useEffect(() => { setPoPage(0); }, [filterDate, filterVendor]);
  useEffect(() => { setDetailsProductsPage(0); }, [detailsOpen, detailsPO]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedVendor('');
    setProducts([{ itemId: '', quantity: 1 }]);
    setPayAmount('');
    setDiscount('');
    setDiscountType('amount');
    setEditMode(false);
    setEditId(null);
  };

  const handleProductChange = (idx, field, value) => {
    setProducts(products => products.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const handleAddProduct = () => {
    setProducts([...products, { itemId: '', quantity: 1 }]);
  };
  const handleRemoveProduct = (idx) => {
    setProducts(products => products.length > 1 ? products.filter((_, i) => i !== idx) : products);
  };

  // Filter items for selected vendor
  const filteredItems = selectedVendor ? items.filter(i => i.vendorId === selectedVendor) : [];

  // Calculate total buy amount
  const subtotal = products.reduce((sum, p) => {
    const item = items.find(i => i.id === p.itemId);
    return sum + (item && p.quantity ? Number(item.buyingPrice) * Number(p.quantity) : 0);
  }, 0);
  let discountNum = 0;
  if (discountType === 'percent') {
    discountNum = subtotal * (Number(discount) || 0) / 100;
  } else {
    discountNum = Number(discount) || 0;
  }
  const totalBuyAmount = subtotal - discountNum;
  const dueAmount = totalBuyAmount - (Number(payAmount) || 0);

  const handleEditPO = (po) => {
    setEditMode(true);
    setEditId(po.id);
    setSelectedVendor(po.vendorId);
    setProducts(po.products.map(p => ({ itemId: p.itemId, quantity: p.quantity })));
    setPayAmount(po.payAmount || '');
    setDiscount(po.discount || '');
    setDiscountType(po.discountType || 'amount');
    setModalOpen(true);
  };
  const handleDeletePO = (po) => {
    setConfirmDelete({ open: true, po });
  };
  const handleDeleteConfirm = async () => {
    const po = confirmDelete.po;
    await deletePurchaseOrder(po.id);
    setPurchaseOrders(purchaseOrders.filter(p => p.id !== po.id));
    setConfirmDelete({ open: false, po: null });
  };
  const handleDeleteCancel = () => setConfirmDelete({ open: false, po: null });

  const handleCreate = async e => {
    e.preventDefault();
    if (!selectedVendor || products.some(p => !p.itemId || !p.quantity)) return;
    if (editMode && editId) {
      // Update existing PO
      const po = await updatePurchaseOrder(editId, { vendorId: selectedVendor, products, payAmount, discount, discountType });
      setPurchaseOrders(purchaseOrders.map(p => p.id === editId ? po : p));
    } else {
      // Create new PO
      const po = await createPurchaseOrder({ vendorId: selectedVendor, products, payAmount, discount, discountType });
      setPurchaseOrders([...purchaseOrders, po]);
    }
    setEditMode(false);
    setEditId(null);
    handleCloseModal();
  };

  const handleShowDetails = (po) => {
    setDetailsPO(po);
    setDetailsOpen(true);
  };
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setDetailsPO(null);
  };

  // Filter and sort purchase orders
  const filteredOrders = purchaseOrders
    .filter(po => {
      if (!filterDate) return true;
      const poDate = new Date(po.date).toISOString().slice(0, 10);
      return poDate === filterDate;
    })
    .filter(po => {
      if (!filterVendor) return true;
      return po.vendorId === filterVendor.id;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate correct subtotal for PO details modal
  const detailsSubtotal = detailsPO && items.length > 0
    ? detailsPO.products.reduce((sum, prod) => {
        const item = items.find(i => i.id === prod.itemId);
        const price = item ? Number(item.buyingPrice) : 0;
        return sum + price * (Number(prod.quantity) || 0);
      }, 0)
    : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Filter by Date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
        <Autocomplete
          options={vendors}
          getOptionLabel={option => option.name || ''}
          value={filterVendor}
          onChange={(_, newValue) => setFilterVendor(newValue)}
          renderInput={params => <TextField {...params} label="Filter by Vendor" size="small" sx={{ minWidth: 220 }} />}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          clearOnEscape
        />
        <Button variant="contained" color="primary" onClick={handleOpenModal} sx={{ minWidth: 180 }}>
          Add Purchase Order
        </Button>
      </Box>
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Add Purchase Order</DialogTitle>
        <DialogContent sx={{ p: 0, maxHeight: 'none' }} dividers={false}>
          <Box component="form" id="po-form" onSubmit={handleCreate} sx={{ mt: 1, p: 3 }}>
            {/* Vendor Selection */}
            <Typography variant="h6" sx={{ mb: 1 }}>Vendor</Typography>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={vendors}
                    getOptionLabel={option => option.name || ''}
                    value={vendors.find(v => v.id === selectedVendor) || null}
                    onChange={(_, newValue) => setSelectedVendor(newValue ? newValue.id : '')}
                    renderInput={params => <TextField {...params} label="Vendor" size="small" required />}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    sx={{ minWidth: 300 }}
                  />
                </Grid>
              </Grid>
            </Paper>
            {/* Products Table */}
            <Typography variant="h6" sx={{ mb: 1 }}>Products</Typography>
            <Paper variant="outlined" sx={{ mb: 2, p: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Buying Price</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p, idx) => {
                    const item = items.find(i => i.id === p.itemId);
                    const price = item ? Number(item.buyingPrice) : 0;
                    const subtotal = price * (Number(p.quantity) || 0);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Autocomplete
                              options={filteredItems}
                              getOptionLabel={option => option.name || ''}
                              value={items.find(i => i.id === p.itemId) || null}
                              onChange={(_, newValue) => handleProductChange(idx, 'itemId', newValue ? newValue.id : '')}
                              renderInput={params => <TextField {...params} label="Item" size="small" required />}
                              isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={p.quantity}
                            onChange={e => handleProductChange(idx, 'quantity', e.target.value)}
                            size="small"
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>{price ? `৳${price}` : ''}</TableCell>
                        <TableCell>{subtotal ? `৳${subtotal}` : ''}</TableCell>
                        <TableCell>
                          <IconButton color="error" onClick={() => handleRemoveProduct(idx)} disabled={products.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button onClick={handleAddProduct} startIcon={<AddIcon />} sx={{ mt: 1 }}>Add Product</Button>
            </Paper>
            {/* Discount Section */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>Discount</Typography>
                <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField label="Discount" type="number" value={discount} onChange={e => setDiscount(e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={discountType} label="Type" onChange={e => setDiscountType(e.target.value)}>
                          <MenuItem value="amount">Amount</MenuItem>
                          <MenuItem value="percent">Percent</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>Payment</Typography>
                <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <TextField label="Pay Amount" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} fullWidth size="small" />
                </Paper>
              </Grid>
            </Grid>
            {/* Summary Card */}
            <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: '#f5f6fa' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography>Subtotal: <b>৳{subtotal}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Discount: <b>{discountNum} {discountType === 'percent' ? `(${discount || 0}%)` : ''}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Paid: <b>৳{payAmount || 0}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Due: <b>৳{dueAmount}</b></Typography></Grid>
                  <Grid item xs={12} sm={12}><Typography>Total: <b>৳{totalBuyAmount}</b></Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
              <Button type="submit" form="po-form" variant="contained" color="primary">Add</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Due</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.slice(poPage * poRowsPerPage, poPage * poRowsPerPage + poRowsPerPage).map(po => (
              <TableRow key={po.id}>
                <TableCell>{vendors.find(v => v.id === po.vendorId)?.name || po.vendorId}</TableCell>
                <TableCell>{new Date(po.date).toLocaleString()}</TableCell>
                <TableCell>{po.totalBuyAmount != null ? `৳${po.totalBuyAmount}` : ''}</TableCell>
                <TableCell>{po.payAmount != null ? `৳${po.payAmount}` : ''}</TableCell>
                <TableCell>{po.dueAmount != null ? `৳${po.dueAmount}` : ''}</TableCell>
                <TableCell align="center">
                  <IconButton color="info" onClick={() => handleShowDetails(po)}><InfoIcon /></IconButton>
                  <IconButton color="primary" onClick={() => handleEditPO(po)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDeletePO(po)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No purchase orders found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={poPage}
          onPageChange={(_, newPage) => setPoPage(newPage)}
          rowsPerPage={poRowsPerPage}
          onRowsPerPageChange={e => {
            setPoRowsPerPage(parseInt(e.target.value, 10));
            setPoPage(0);
          }}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>
      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Purchase Order Details</DialogTitle>
        <DialogContent sx={{ minWidth: { md: 700 } }}>
          {detailsPO && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Vendor Info</Typography>
                    <Typography sx={{ mb: 1 }}><b>Name:</b> {vendors.find(v => v.id === detailsPO.vendorId)?.name || detailsPO.vendorId}</Typography>
                    <Typography sx={{ mb: 1 }}><b>Phone:</b> {vendors.find(v => v.id === detailsPO.vendorId)?.phone || '-'}</Typography>
                    <Typography><b>Date:</b> {new Date(detailsPO.date).toLocaleString()}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#e3f2fd', boxShadow: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Summary</Typography>
                    <Grid container spacing={2} direction="column">
                      <Grid item xs={12}><Typography><b>Subtotal:</b> ৳{detailsSubtotal}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Discount:</b> {detailsPO.discountType === 'percent' ? `${detailsPO.discount || 0}% (${detailsPO.discountNum || 0})` : detailsPO.discount}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Total:</b> ৳{detailsPO.totalBuyAmount}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Paid:</b> ৳{detailsPO.payAmount}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Due:</b> ৳{detailsPO.dueAmount}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Products:</b> {detailsPO.products.length}</Typography></Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Products</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fbe7' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Buying Price</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailsPO.products.slice(detailsProductsPage * detailsProductsRowsPerPage, detailsProductsPage * detailsProductsRowsPerPage + detailsProductsRowsPerPage).map((prod, idx) => {
                      const item = items.find(i => i.id === prod.itemId);
                      const price = item ? Number(item.buyingPrice) : 0;
                      const subtotal = price * (Number(prod.quantity) || 0);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{item ? item.name : prod.itemId}</TableCell>
                          <TableCell>{prod.quantity}</TableCell>
                          <TableCell>{price ? `৳${price}` : ''}</TableCell>
                          <TableCell>{subtotal ? `৳${subtotal}` : ''}</TableCell>
                        </TableRow>
                      );
                    })}
                    {detailsPO.products.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No products found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={detailsPO.products.length}
                  page={detailsProductsPage}
                  onPageChange={(_, newPage) => setDetailsProductsPage(newPage)}
                  rowsPerPage={detailsProductsRowsPerPage}
                  onRowsPerPageChange={e => {
                    setDetailsProductsRowsPerPage(parseInt(e.target.value, 10));
                    setDetailsProductsPage(0);
                  }}
                  rowsPerPageOptions={[10]}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Purchase Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this purchase order?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 