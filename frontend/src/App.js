import React, { useState, useRef } from 'react';
import Items from './components/Items';
import Orders from './components/Sales';
import Customers from './components/Customers';
import Vendors from './components/Vendors';
import PurchaseOrders from './components/PurchaseOrders';
import DiscountManagement from './components/DiscountManagement';
import Reporting from './components/Reporting';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box, Paper } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const tabLabels = [
  { label: 'Orders', icon: <InventoryIcon fontSize="small" /> },
  { label: 'Items' },
  { label: 'Customers' },
  { label: 'Vendors' },
  { label: 'Purchase Orders' },
  { label: 'Discounts' },
  { label: 'Reporting' }
];

function App() {
  const [tab, setTab] = useState(0);
  const customersRef = useRef();

  const handleTabChange = (_, newTab) => {
    setTab(newTab);
    if (newTab === 2 && customersRef.current) {
      customersRef.current.refreshCustomers();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh' }}>
        <Box sx={{ width: '100%', maxWidth: '2000px', mx: 'auto', px: 3 }}>
          <AppBar position="static" color="primary" elevation={1} sx={{ bgcolor: 'primary.main' }}>
            <Toolbar disableGutters>
              <Typography variant="h6" sx={{ flexGrow: 1, pl: 2, pr: 1 }}>
            Inventory Management System
          </Typography>
        </Toolbar>
      </AppBar>
          <Box sx={{ py: 2 }}>
            <Paper elevation={3} sx={{ width: '100%', p: 3, borderRadius: 3, boxSizing: 'border-box' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            {tabLabels.map((t, i) => (
              <Tab key={t.label} icon={t.icon} iconPosition={t.icon ? 'start' : undefined} label={t.label} />
            ))}
          </Tabs>
          <Box>
                {tab === 0 && <Orders />}
                {tab === 1 && <Items />}
            {tab === 2 && <Customers ref={customersRef} />}
            {tab === 3 && <Vendors />}
            {tab === 4 && <PurchaseOrders />}
                {tab === 5 && <DiscountManagement />}
                {tab === 6 && <Reporting />}
              </Box>
            </Paper>
          </Box>
        </Box>
    </Box>
    </ThemeProvider>
  );
}

export default App;
