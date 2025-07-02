import React, { useEffect, useState } from 'react';
import { getVendors, createVendor } from '../api';
import {
  Box, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!name) return;
    const vendor = await createVendor({ name });
    setVendors([...vendors, vendor]);
    setName('');
  };

  return (
    <Box>
      <Box component="form" onSubmit={handleCreate} sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" required />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button type="submit" variant="contained" color="primary" fullWidth>Add Vendor</Button>
          </Grid>
        </Grid>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map(vendor => (
              <TableRow key={vendor.id}>
                <TableCell>{vendor.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 