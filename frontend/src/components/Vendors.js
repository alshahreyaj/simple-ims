import React, { useEffect, useState } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor, getItems, getPurchaseOrders, payVendorDue } from '../api';
import {
  Box, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TablePagination, Card, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableSortLabel from '@mui/material/TableSortLabel';
import InfoIcon from '@mui/icons-material/Info';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PaymentIcon from '@mui/icons-material/Payment';
import Snackbar from '@mui/material/Snackbar';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null); // for edit
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [totalPurchase, setTotalPurchase] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoTab, setInfoTab] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [vendorPurchaseOrders, setVendorPurchaseOrders] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [payDueOpen, setPayDueOpen] = useState(false);
  const [payDueVendor, setPayDueVendor] = useState(null);
  const [payDueAmount, setPayDueAmount] = useState('');
  const [vendorPage, setVendorPage] = useState(0);
  const [vendorRowsPerPage, setVendorRowsPerPage] = useState(10);
  const [productsPage, setProductsPage] = useState(0);
  const [productsRowsPerPage, setProductsRowsPerPage] = useState(10);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(10);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  useEffect(() => { setVendorPage(0); }, [search, order, orderBy]);
  useEffect(() => { setProductsPage(0); }, [infoTab, vendorProducts]);
  useEffect(() => { setOrdersPage(0); }, [infoTab, vendorPurchaseOrders]);

  const handleOpenModal = (vendor = null) => {
    setCurrentVendor(vendor);
    setName(vendor ? vendor.name : '');
    setAddress(vendor ? vendor.address || '' : '');
    setPhone(vendor ? vendor.phone || '' : '');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentVendor(null);
    setName('');
    setAddress('');
    setPhone('');
  };

  const handleCreateOrEdit = async e => {
    e.preventDefault();
    if (!name) return;
    const vendorData = {
      name,
      address,
      phone
    };
    if (currentVendor) {
      // Edit
      const updated = await updateVendor(currentVendor.id, vendorData);
      setVendors(vendors.map(v => v.id === updated.id ? updated : v));
    } else {
      // Create
      const vendor = await createVendor(vendorData);
      setVendors([...vendors, vendor]);
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (vendorToDelete && vendorToDelete.dueAmount && Number(vendorToDelete.dueAmount) !== 0) {
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: 'Cannot delete vendor with due amount not zero.', severity: 'error' });
      setVendorToDelete(null);
      return;
    }
    await deleteVendor(vendorToDelete.id);
    setVendors(vendors.filter(v => v.id !== vendorToDelete.id));
    setDeleteDialogOpen(false);
    setVendorToDelete(null);
  };

  // Sorting logic
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Filter and sort vendors
  const filteredVendors = vendors.filter(vendor => {
    const q = search.toLowerCase();
    return (
      vendor.name?.toLowerCase().includes(q) ||
      vendor.address?.toLowerCase().includes(q) ||
      vendor.phone?.toLowerCase().includes(q)
    );
  }).sort(getComparator(order, orderBy));

  const handleOpenInfoModal = async (vendor) => {
    setSelectedVendor(vendor);
    setInfoTab(0);
    setInfoModalOpen(true);
    // Fetch products and purchase orders for this vendor
    const allItems = await getItems();
    setVendorProducts(allItems.filter(i => i.vendorId === vendor.id));
    const allPOs = await getPurchaseOrders();
    const sortedVendorPurchaseOrders = [...allPOs.filter(po => po.vendorId === vendor.id)].sort((a, b) => new Date(b.date) - new Date(a.date));
    setVendorPurchaseOrders(sortedVendorPurchaseOrders);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
    setSelectedVendor(null);
    setVendorProducts([]);
    setVendorPurchaseOrders([]);
  };

  const handlePayDueOpen = (vendor) => {
    setPayDueVendor(vendor);
    setPayDueAmount(vendor.dueAmount || '');
    setPayDueOpen(true);
  };

  const handlePayDueClose = () => {
    setPayDueOpen(false);
    setPayDueVendor(null);
    setPayDueAmount('');
  };

  const handlePayDueSubmit = async (e) => {
    e.preventDefault();
    if (!payDueVendor || !payDueAmount) return;
    try {
      await payVendorDue(payDueVendor.id, Number(payDueAmount));
      setSnackbar({ open: true, message: 'Due paid successfully', severity: 'success' });
      getVendors().then(setVendors);
      handlePayDueClose();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to pay due', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 250 }}
        />
        <Button variant="contained" color="primary" onClick={() => handleOpenModal()}>
          Create Vendor
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'address'}
                  direction={orderBy === 'address' ? order : 'asc'}
                  onClick={() => handleSort('address')}
                >
                  Address
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'phone'}
                  direction={orderBy === 'phone' ? order : 'asc'}
                  onClick={() => handleSort('phone')}
                >
                  Phone
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'totalPurchase'}
                  direction={orderBy === 'totalPurchase' ? order : 'asc'}
                  onClick={() => handleSort('totalPurchase')}
                >
                  Total Purchase
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'dueAmount'}
                  direction={orderBy === 'dueAmount' ? order : 'asc'}
                  onClick={() => handleSort('dueAmount')}
                >
                  Due Amount
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVendors.slice(vendorPage * vendorRowsPerPage, vendorPage * vendorRowsPerPage + vendorRowsPerPage).map(vendor => (
              <TableRow key={vendor.id}>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>{vendor.address}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.totalPurchase != null ? `৳${vendor.totalPurchase}` : ''}</TableCell>
                <TableCell>{vendor.dueAmount != null ? `৳${vendor.dueAmount}` : ''}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenModal(vendor)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => { setVendorToDelete(vendor); setDeleteDialogOpen(true); }}><DeleteIcon /></IconButton>
                  <IconButton color="info" onClick={() => handleOpenInfoModal(vendor)}><InfoIcon /></IconButton>
                  {vendor.dueAmount > 0 && (
                    <IconButton color="success" onClick={() => handlePayDueOpen(vendor)} title="Pay Due">
                      <PaymentIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredVendors.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No vendors found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredVendors.length}
          page={vendorPage}
          onPageChange={(_, newPage) => setVendorPage(newPage)}
          rowsPerPage={vendorRowsPerPage}
          onRowsPerPageChange={e => {
            setVendorRowsPerPage(parseInt(e.target.value, 10));
            setVendorPage(0);
          }}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{currentVendor ? 'Edit Vendor' : 'Create Vendor'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateOrEdit} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" required autoFocus sx={{ mb: 2 }} />
            <TextField label="Phone" value={phone} onChange={e => setPhone(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
            <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
            <DialogActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{currentVendor ? 'Save' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Vendor</DialogTitle>
        <DialogContent>Are you sure you want to delete this vendor?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Info Modal with Tabs */}
      <Dialog open={infoModalOpen} onClose={handleCloseInfoModal} maxWidth="md" fullWidth>
        <DialogTitle>Vendor Details: {selectedVendor?.name}</DialogTitle>
        <DialogContent sx={{ minWidth: { md: 700 } }}>
          {selectedVendor && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Vendor Info</Typography>
                    <Typography sx={{ mb: 1 }}><b>Name:</b> {selectedVendor.name}</Typography>
                    <Typography sx={{ mb: 1 }}><b>Phone:</b> {selectedVendor.phone}</Typography>
                    <Typography><b>Address:</b> {selectedVendor.address}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#e3f2fd', boxShadow: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Summary</Typography>
                    <Grid container spacing={2} direction="column">
                      <Grid item xs={12}><Typography><b>Total Products:</b> <span style={{ fontWeight: 'bold' }}>{vendorProducts.length}</span></Typography></Grid>
                      <Grid item xs={12}><Typography><b>Total Purchase:</b> <span style={{ color: 'green', fontWeight: 'bold' }}>৳{selectedVendor.totalPurchase}</span></Typography></Grid>
                      <Grid item xs={12}><Typography><b>Due:</b> <span style={{ color: 'red', fontWeight: 'bold' }}>৳{selectedVendor.dueAmount}</span></Typography></Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
            </Box>
          )}
          <Tabs value={infoTab} onChange={(_, v) => setInfoTab(v)} sx={{ mb: 2 }}>
            <Tab label="Products" />
            <Tab label="Purchase Orders" />
          </Tabs>
          {infoTab === 0 && (
            <Box>
              <Typography variant="h6">Products of this Vendor</Typography>
              <Paper variant="outlined" sx={{ mt: 1, p: 2, bgcolor: '#f9fbe7' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Buying Price</TableCell>
                      <TableCell>Selling Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorProducts.slice(productsPage * productsRowsPerPage, productsPage * productsRowsPerPage + productsRowsPerPage).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>{`৳${item.buyingPrice}`}</TableCell>
                        <TableCell>{`৳${item.sellingPrice}`}</TableCell>
                      </TableRow>
                    ))}
                    {vendorProducts.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No products found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={vendorProducts.length}
                  page={productsPage}
                  onPageChange={(_, newPage) => setProductsPage(newPage)}
                  rowsPerPage={productsRowsPerPage}
                  onRowsPerPageChange={e => {
                    setProductsRowsPerPage(parseInt(e.target.value, 10));
                    setProductsPage(0);
                  }}
                  rowsPerPageOptions={[10]}
                />
              </Paper>
            </Box>
          )}
          {infoTab === 1 && (
            <Box>
              <Typography variant="h6">Purchase Orders</Typography>
              <Paper variant="outlined" sx={{ mt: 1, p: 2, bgcolor: '#f9fbe7' }}>
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
                    {vendorPurchaseOrders.slice(ordersPage * ordersRowsPerPage, ordersPage * ordersRowsPerPage + ordersRowsPerPage).map(po => (
                      <TableRow key={po.id}>
                        <TableCell>{new Date(po.date).toLocaleString()}</TableCell>
                        <TableCell>{po.totalBuyAmount != null ? `৳${po.totalBuyAmount}` : ''}</TableCell>
                        <TableCell>{po.payAmount != null ? `৳${po.payAmount}` : ''}</TableCell>
                        <TableCell>{po.dueAmount != null ? `৳${po.dueAmount}` : ''}</TableCell>
                      </TableRow>
                    ))}
                    {vendorPurchaseOrders.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No purchase orders found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={vendorPurchaseOrders.length}
                  page={ordersPage}
                  onPageChange={(_, newPage) => setOrdersPage(newPage)}
                  rowsPerPage={ordersRowsPerPage}
                  onRowsPerPageChange={e => {
                    setOrdersRowsPerPage(parseInt(e.target.value, 10));
                    setOrdersPage(0);
                  }}
                  rowsPerPageOptions={[10]}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Pay Due Modal */}
      <Dialog open={payDueOpen} onClose={handlePayDueClose} maxWidth="xs" fullWidth>
        <DialogTitle>Pay Due for {payDueVendor?.name}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePayDueSubmit} sx={{ mt: 1 }}>
            <Typography sx={{ mb: 2 }}>Current Due: <b style={{ color: 'red' }}>৳{payDueVendor?.dueAmount}</b></Typography>
            <TextField
              label="Amount to Pay"
              type="number"
              value={payDueAmount}
              onChange={e => setPayDueAmount(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: payDueVendor?.dueAmount || 0 }}
              required
              sx={{ mb: 2 }}
            />
            <DialogActions>
              <Button onClick={handlePayDueClose} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="success">Pay Due</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 