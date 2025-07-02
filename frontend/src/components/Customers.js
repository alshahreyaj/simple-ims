import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getCustomers, createCustomer, updateCustomerDue, getOrders, deleteCustomer, updateCustomer, getCustomerSummary } from '../api';
import {
  Box, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, TableSortLabel, Typography, Autocomplete
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';

const Customers = forwardRef((props, ref) => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [due, setDue] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [showOrdersId, setShowOrdersId] = useState(null);
  const [showOrdersCustomer, setShowOrdersCustomer] = useState(null);
  const [showOrdersList, setShowOrdersList] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, customer: null });
  const [totalBuy, setTotalBuy] = useState(null);
  const [totalPaid, setTotalPaid] = useState(null);
  const [orderCount, setOrderCount] = useState(null);

  const refreshCustomers = () => {
    getCustomers().then(setCustomers);
  };

  useImperativeHandle(ref, () => ({
    refreshCustomers
  }));

  useEffect(() => {
    refreshCustomers();
  }, []);

  const handleModalOpen = (customer) => {
    if (customer) {
      setEditId(customer.id);
      setName(customer.name);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setDue(customer.due ?? '');
    } else {
      setEditId(null);
      setName('');
      setPhone('');
      setAddress('');
      setDue('');
    }
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setEditId(null);
    setName('');
    setPhone('');
    setAddress('');
    setDue('');
  };
  const handleModalSave = async (e) => {
    e.preventDefault();
    if (!name) return;
    if (editId) {
      await updateCustomer(editId, { name, phone, address, due });
    } else {
      await createCustomer({ name, phone, address });
    }
    refreshCustomers();
    handleModalClose();
  };
  const handleDelete = (customer) => {
    if (customer.due > 0) {
      setSnackbar({ open: true, message: 'Cannot delete customer with due > 0', severity: 'error' });
      return;
    }
    setConfirmDelete({ open: true, customer });
  };
  const handleDeleteConfirm = async () => {
    const customer = confirmDelete.customer;
    try {
      await deleteCustomer(customer.id);
      refreshCustomers();
      setSnackbar({ open: true, message: 'Customer deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
    setConfirmDelete({ open: false, customer: null });
  };
  const handleDeleteCancel = () => setConfirmDelete({ open: false, customer: null });
  const handleShowOrders = async (customer) => {
    setShowOrdersId(customer.id);
    setShowOrdersCustomer(customer);
    const allOrders = await getOrders();
    let custOrders = allOrders.filter(o => o.customerId === customer.id);
    // Sort by date descending
    custOrders = custOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Only last 10 orders
    setShowOrdersList(custOrders.slice(0, 10));
    // Fetch total buy
    const summary = await getCustomerSummary(customer.id);
    setTotalBuy(summary.totalBuy);
    // Calculate total paid and order count
    const paid = custOrders.reduce((sum, o) => sum + (o.paid || 0), 0);
    setTotalPaid(paid);
    setOrderCount(custOrders.length);
  };
  const handleCloseOrders = () => {
    setShowOrdersId(null);
    setShowOrdersCustomer(null);
    setShowOrdersList([]);
    setTotalBuy(null);
    setTotalPaid(null);
    setOrderCount(null);
  };

  // Sorting and filtering logic
  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let v1 = a[sortBy] ?? '';
    let v2 = b[sortBy] ?? '';
    if (sortBy === 'due') {
      v1 = Number(v1);
      v2 = Number(v2);
    } else {
      v1 = v1.toString().toLowerCase();
      v2 = v2.toString().toLowerCase();
    }
    if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
    if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          size="small"
          sx={{ minWidth: 220 }}
        />
        <Button variant="contained" onClick={() => handleModalOpen(null)}>Add Customer</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortDir : 'asc'}
                  onClick={() => handleSort('name')}
                >Name</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'phone'}
                  direction={sortBy === 'phone' ? sortDir : 'asc'}
                  onClick={() => handleSort('phone')}
                >Phone</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'address'}
                  direction={sortBy === 'address' ? sortDir : 'asc'}
                  onClick={() => handleSort('address')}
                >Address</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'due'}
                  direction={sortBy === 'due' ? sortDir : 'asc'}
                  onClick={() => handleSort('due')}
                >Due</TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCustomers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone || ''}</TableCell>
                <TableCell>{customer.address || ''}</TableCell>
                <TableCell>{customer.due}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleModalOpen(customer)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(customer)}><DeleteIcon /></IconButton>
                  <IconButton color="info" onClick={() => handleShowOrders(customer)}><ListAltIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Add/Edit Customer Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleModalSave} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" required sx={{ mb: 2 }} />
            <TextField label="Phone" value={phone} onChange={e => setPhone(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
            <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
            {editId && <TextField label="Due" type="number" value={due} onChange={e => setDue(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />}
            <DialogActions>
              <Button onClick={handleModalClose} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{editId ? 'Save' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete.open} onClose={handleDeleteCancel} maxWidth="xs">
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <b>{confirmDelete.customer?.name}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Show Orders for Customer */}
      <Dialog open={!!showOrdersId} onClose={handleCloseOrders} maxWidth="md" fullWidth>
        <DialogTitle>Customer Orders</DialogTitle>
        <DialogContent>
          {showOrdersCustomer && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'row', gap: 4 }}>
              {/* Left: Customer Info */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Customer Info</Typography>
                <Typography variant="body2"><b>Name:</b> {showOrdersCustomer.name}</Typography>
                <Typography variant="body2"><b>Phone:</b> {showOrdersCustomer.phone || '-'}</Typography>
                <Typography variant="body2"><b>Address:</b> {showOrdersCustomer.address || '-'}</Typography>
              </Box>
              {/* Right: Economic Summary */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Economic Summary</Typography>
                <Typography variant="body2"><b>Number of Orders:</b> {orderCount !== null ? orderCount : '-'}</Typography>
                <Typography variant="body2"><b>Total Buy:</b> <span style={{ color: 'green', fontWeight: 'bold' }}>৳{totalBuy !== null ? totalBuy : '-'}</span></Typography>
                <Typography variant="body2"><b>Total Paid:</b> <span style={{ color: 'blue', fontWeight: 'bold' }}>৳{totalPaid !== null ? totalPaid : '-'}</span></Typography>
                <Typography variant="body2"><b>Current Due:</b> <span style={{ color: 'red', fontWeight: 'bold' }}>৳{showOrdersCustomer.due}</span></Typography>
              </Box>
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showOrdersList.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{new Date(order.date).toLocaleString('en-BD', { hour12: true })}</TableCell>
                  <TableCell>{order.total !== undefined ? `৳${order.total}` : '৳0'}</TableCell>
                  <TableCell>{order.paid !== undefined ? `৳${order.paid}` : '-'}</TableCell>
                  <TableCell>{order.due !== undefined ? `৳${order.due}` : '৳0'}</TableCell>
                </TableRow>
              ))}
              {showOrdersList.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrders} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
});

export default Customers; 