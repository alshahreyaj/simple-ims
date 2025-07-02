import React, { useEffect, useState } from 'react';
import { getOrders, createOrder, getItems, getCustomers, createCustomer, updateCustomerDue, deleteOrder, updateOrder } from '../api';
import {
  Box, Grid, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton, Alert, Checkbox, FormControlLabel, Divider, Card, CardContent, Autocomplete, TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Add/Edit Order Modal State
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState([
    { itemId: '', quantity: 1, price: 0 }
  ]);
  const [customerId, setCustomerId] = useState('');
  const [tempCustomer, setTempCustomer] = useState({ name: '', mobile: '' });
  const [useTempCustomer, setUseTempCustomer] = useState(false);
  const [discount, setDiscount] = useState('');
  const [paid, setPaid] = useState('');
  const [error, setError] = useState('');
  const [markDue, setMarkDue] = useState(false);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'

  // Order Details Modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  // Delete order state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOrderState, setDeleteOrderState] = useState(null);

  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const [filterCustomer, setFilterCustomer] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [detailsProductsPage, setDetailsProductsPage] = useState(0);
  const [detailsProductsRowsPerPage, setDetailsProductsRowsPerPage] = useState(10);

  useEffect(() => {
    getOrders().then(setOrders);
    getItems().then(setItems);
    getCustomers().then(setCustomers);
  }, []);

  // Add/Edit Order Modal Handlers
  const handleOpen = () => {
    setEditMode(false);
    setOpen(true);
    setDiscountType('amount'); // Reset to 'amount' by default
  };
  const handleClose = () => {
    setOpen(false);
    setOrderItems([{ itemId: '', quantity: 1, price: 0 }]);
    setCustomerId('');
    setTempCustomer({ name: '', mobile: '' });
    setUseTempCustomer(false);
    setDiscount('');
    setPaid('');
    setError('');
    setEditMode(false);
    setEditOrderId(null);
    setMarkDue(false);
  };

  const handleOrderItemChange = (idx, field, value) => {
    const newOrderItems = [...orderItems];
    if (field === 'itemId') {
      newOrderItems[idx].itemId = value;
      const item = items.find(i => i.id === value);
      newOrderItems[idx].price = item ? (item.sellingPrice || 0) : 0;
    } else {
      newOrderItems[idx][field] = value;
    }
    setOrderItems(newOrderItems);
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { itemId: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveOrderItem = (idx) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleCustomerChange = (e) => {
    const val = e.target.value;
    if (val === 'temp') {
      setUseTempCustomer(true);
      setCustomerId('');
    } else {
      setUseTempCustomer(false);
      setCustomerId(val);
    }
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, oi) => sum + (oi.price * oi.quantity), 0);
  let discountNum = 0;
  if (discountType === 'percent') {
    const percent = Number(discount) || 0;
    discountNum = Math.round(subtotal * percent / 100);
  } else {
    discountNum = Number(discount) || 0;
  }
  const total = subtotal - discountNum;
  const paidNum = markDue ? 0 : (Number(paid) || 0);
  const dueNum = total - paidNum;

  // Add/Edit Order Submit
  const handleEditOrder = (order) => {
    setEditMode(true);
    setEditOrderId(order.id);
    setOrderItems(order.items.map(oi => ({
      itemId: oi.itemId,
      quantity: oi.quantity,
      price: oi.price
    })));
    setCustomerId(order.customerId);
    setTempCustomer(order.tempCustomer || { name: '', mobile: '' });
    setUseTempCustomer(!!order.tempCustomer);
    setDiscount(order.discountType === 'percent' && order.discountPercent !== undefined ? order.discountPercent : order.discount);
    setPaid(order.paid);
    setDiscountType(order.discountType || 'amount'); // Default to 'amount' if missing
    setOpen(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (!orderItems.every(oi => oi.itemId && oi.quantity > 0)) {
      setError('Please select all items and enter valid quantities.');
      return;
    }
    if (!customerId && !(useTempCustomer && tempCustomer.name)) {
      setError('Please select a customer or enter temporary customer info.');
      return;
    }
    if (orderItems.length === 0) {
      setError('Please add at least one item.');
      return;
    }
    let finalCustomerId = customerId;
    let orderDue = dueNum;
    let orderPaid = paidNum;
    let orderTempCustomer = null;
    if (useTempCustomer && tempCustomer.name) {
      // Do NOT create a customer, just save info in order
      orderTempCustomer = tempCustomer;
      orderDue = 0;
      orderPaid = total;
    }
    const orderData = {
      customerId: useTempCustomer ? undefined : finalCustomerId,
      items: orderItems.map(oi => ({ itemId: oi.itemId, quantity: oi.quantity, price: oi.price })),
      discount: discountNum,
      discountType,
      paid: orderPaid,
      due: orderDue,
      tempCustomer: orderTempCustomer,
    };
    if (discountType === 'percent') {
      orderData.discountPercent = discount;
    }
    if (editMode && editOrderId) {
      await updateOrder(editOrderId, orderData);
    } else {
      await createOrder(orderData);
    }
    handleClose();
    getOrders().then(setOrders);
    getCustomers().then(setCustomers);
  };

  // Show order details modal
  const handleShowDetails = (order) => {
    setDetailsOrder(order);
    setDetailsOpen(true);
  };
  const handleCloseDetails = () => setDetailsOpen(false);

  // Delete order logic
  const handleDeleteOrderRequest = (order) => {
    setDeleteOrderState(order);
    setDeleteOpen(true);
  };
  const handleDeleteOrderCancel = () => {
    setDeleteOrderState(null);
    setDeleteOpen(false);
  };
  const handleDeleteOrderConfirm = async () => {
    if (!deleteOrderState) return;
    await deleteOrder(deleteOrderState.id);
    setDeleteOrderState(null);
    setDeleteOpen(false);
    getOrders().then(setOrders);
    getCustomers().then(setCustomers);
  };

  // Calculate detailsSubtotal above the return
  const detailsSubtotal = detailsOrder ? detailsOrder.items.reduce((sum, item) => {
    const price = items.find(i => i.id === item.itemId)?.sellingPrice || 0;
    return sum + price * item.quantity;
  }, 0) : 0;
  const detailsDiscount = detailsOrder ? Number(detailsOrder.discount) || 0 : 0;
  const detailsTotal = detailsSubtotal - detailsDiscount;

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      if (!filterDate) return true;
      const orderDate = new Date(order.date).toISOString().slice(0, 10);
      return orderDate === filterDate;
    })
    .filter(order => {
      if (!filterCustomer) return true;
      if (filterCustomer.id === 'temp') return !!order.tempCustomer;
      return order.customerId === filterCustomer.id;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination logic
  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Reset page when opening/closing details modal or changing detailsOrder
  useEffect(() => { setDetailsProductsPage(0); }, [detailsOpen, detailsOrder]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
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
          options={[{ id: 'temp', name: 'Temporary Customers' }, ...customers]}
          getOptionLabel={option => option.name || ''}
          value={filterCustomer}
          onChange={(_, newValue) => setFilterCustomer(newValue)}
          renderInput={params => <TextField {...params} label="Filter by Customer" size="small" sx={{ minWidth: 220 }} />}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          clearOnEscape
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} color="primary">
          Add Order
        </Button>
      </Box>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>{editMode ? 'Edit Order' : 'Add Order'}</DialogTitle>
        <DialogContent sx={{ p: 0, maxHeight: 'none' }} dividers={false}>
          <Box component="form" onSubmit={handleCreateOrder} sx={{ mt: 1, p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="h6" sx={{ mb: 1 }}>Order Items</Typography>
            <Paper variant="outlined" sx={{ mb: 2, p: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map((oi, idx) => {
                    const item = items.find(i => i.id === oi.itemId);
                    const price = oi.price;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Autocomplete
                              options={items}
                              getOptionLabel={option => option.name || ''}
                              value={items.find(i => i.id === oi.itemId) || null}
                              onChange={(_, newValue) => handleOrderItemChange(idx, 'itemId', newValue ? newValue.id : '')}
                              renderInput={params => <TextField {...params} label="Item" size="small" required />}
                              isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={oi.quantity}
                            onChange={e => handleOrderItemChange(idx, 'quantity', Number(e.target.value))}
                            size="small"
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>{`৳${price}`}</TableCell>
                        <TableCell>{`৳${price * oi.quantity}`}</TableCell>
                        <TableCell>
                          <IconButton color="error" onClick={() => handleRemoveOrderItem(idx)} disabled={orderItems.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button onClick={handleAddOrderItem} startIcon={<AddIcon />} sx={{ mt: 1 }}>Add Item</Button>
            </Paper>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>Customer</Typography>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 300 }}>
                    <Autocomplete
                      options={[...customers, { id: 'temp', name: 'Temporary Customer' }]}
                      getOptionLabel={option => option.name || ''}
                      value={useTempCustomer ? { id: 'temp', name: 'Temporary Customer' } : customers.find(c => c.id === customerId) || null}
                      onChange={(_, newValue) => {
                        if (newValue && newValue.id === 'temp') {
                          setUseTempCustomer(true);
                          setCustomerId('');
                        } else {
                          setUseTempCustomer(false);
                          setCustomerId(newValue ? newValue.id : '');
                        }
                      }}
                      renderInput={params => <TextField {...params} label="Customer" size="small" required />}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                  </FormControl>
                </Grid>
                {useTempCustomer && (
                  <>
                    <Grid item xs={12} sm={3}>
                      <TextField label="Name" value={tempCustomer.name} onChange={e => setTempCustomer({ ...tempCustomer, name: e.target.value })} fullWidth size="small" required />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField label="Mobile" value={tempCustomer.mobile} onChange={e => setTempCustomer({ ...tempCustomer, mobile: e.target.value })} fullWidth size="small" />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            <Divider sx={{ my: 2 }} />
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
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField label="Paid" type="number" value={useTempCustomer ? total : (markDue ? 0 : paid)} onChange={e => setPaid(e.target.value)} fullWidth size="small" disabled={useTempCustomer || markDue} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={<Checkbox checked={markDue} onChange={e => setMarkDue(e.target.checked)} />}
                        label="Mark as Due (no payment)"
                        disabled={useTempCustomer}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: '#f5f6fa' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography>Subtotal: <b>৳{subtotal}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Discount: <b>৳{discountNum} {discountType === 'percent' ? `(${discount || 0}%)` : ''}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Paid: <b>৳{paidNum}</b></Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography>Due: <b>৳{dueNum}</b></Typography></Grid>
                  <Grid item xs={12} sm={12}><Typography>Total: <b>৳{total}</b></Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{editMode ? 'Save Changes' : 'Save Order'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent sx={{ minWidth: { md: 700 } }}>
          {detailsOrder && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Customer Info</Typography>
                    <Typography sx={{ mb: 1 }}>
                      <b>Name:</b> {detailsOrder.tempCustomer?.name ? detailsOrder.tempCustomer.name : (customers.find(c => c.id === detailsOrder.customerId)?.name || detailsOrder.customerId)}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      <b>Phone:</b> {detailsOrder.tempCustomer?.mobile ? detailsOrder.tempCustomer.mobile : (customers.find(c => c.id === detailsOrder.customerId)?.phone || '-')}
                    </Typography>
                    <Typography>
                      <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      <b>Date:</b> {new Date(detailsOrder.date).toLocaleString('en-BD', { hour12: true })}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#e3f2fd', boxShadow: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Order Summary</Typography>
                    <Grid container spacing={2} direction="column">
                      <Grid item xs={12}><Typography><b>Subtotal:</b> ৳{detailsSubtotal}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Discount:</b> {detailsOrder.discountType === 'percent' ? `${detailsOrder.discountPercent || ''}% (৳${detailsDiscount})` : `৳${detailsDiscount}`}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Total:</b> ৳{detailsTotal}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Paid:</b> ৳{detailsOrder.paid || 0}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Due:</b> ৳{detailsOrder.due || 0}</Typography></Grid>
                      <Grid item xs={12}><Typography><b>Items:</b> {detailsOrder.items.length}</Typography></Grid>
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
                      <TableCell>Price</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailsOrder.items.slice(detailsProductsPage * detailsProductsRowsPerPage, detailsProductsPage * detailsProductsRowsPerPage + detailsProductsRowsPerPage).map(item => {
                      const price = items.find(i => i.id === item.itemId)?.sellingPrice || 0;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{items.find(i => i.id === item.itemId)?.name || item.itemId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{`৳${price}`}</TableCell>
                          <TableCell>{`৳${price * item.quantity}`}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={detailsOrder.items.length}
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
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Due</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map(order => {
              const customer = customers.find(c => c.id === order.customerId);
              return (
                <TableRow key={order.id}>
                  <TableCell>{new Date(order.date).toLocaleString('en-BD', { hour12: true })}</TableCell>
                  <TableCell>
                    {order.tempCustomer?.name ? (
                      <>
                        {order.tempCustomer.name}
                      </>
                    ) : (
                      customer ? <><PersonIcon fontSize="small" color="info" sx={{ verticalAlign: 'middle', mr: 0.5 }} />{customer.name}</> : order.customerId
                    )}
                  </TableCell>
                  <TableCell>{order.total != null ? `৳${order.total}` : '৳0'}</TableCell>
                  <TableCell>{order.paid != null ? `৳${order.paid}` : ''}</TableCell>
                  <TableCell>{order.due != null ? `৳${order.due}` : ''}</TableCell>
                  <TableCell align="center">
                    <IconButton color="info" onClick={() => handleShowDetails(order)}><InfoIcon /></IconButton>
                    <IconButton color="primary" onClick={() => handleEditOrder(order)}><EditIcon /></IconButton>
                    {(order.id || order.date) && (
                      <IconButton color="error" onClick={() => handleDeleteOrderRequest(order)}><DeleteIcon /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredOrders.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10]}
      />
      {/* Delete Order Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteOrderCancel}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this order?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteOrderCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteOrderConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 