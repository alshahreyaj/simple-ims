import React, { useState, useRef } from 'react';
import Items from './components/Items';
import Orders from './components/Sales';
import Customers from './components/Customers';
import Vendors from './components/Vendors';
import PurchaseOrders from './components/PurchaseOrders';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box, Paper } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';

const tabLabels = [
  { label: 'Items', icon: <InventoryIcon fontSize="small" /> },
  { label: 'Orders' },
  { label: 'Customers' },
  { label: 'Vendors' },
  { label: 'Purchase Orders' }
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
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Inventory Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
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
            {tab === 0 && <Items />}
            {tab === 1 && <Orders />}
            {tab === 2 && <Customers ref={customersRef} />}
            {tab === 3 && <Vendors />}
            {tab === 4 && <PurchaseOrders />}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
