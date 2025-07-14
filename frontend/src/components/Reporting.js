import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Button, MenuItem, Select, FormControl, InputLabel, Table, TableHead, TableRow, TableCell, TableBody, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOrders, getItems } from '../api';

// Ensure autoTable is attached to jsPDF
if (typeof jsPDF.API.autoTable === 'undefined') {
  jsPDF.API.autoTable = autoTable;
}

function getMonthStartEnd() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [start, end];
}

export default function Reporting() {
  const [reportType, setReportType] = useState('salesByProduct');
  const [dateRange, setDateRange] = useState(getMonthStartEnd());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    if (reportType === 'salesByProduct') {
      const [start, end] = dateRange;
      const orders = await getOrders();
      const items = await getItems();
      // Filter orders by date
      const filteredOrders = orders.filter(o => {
        const d = new Date(o.date);
        return d >= start && d <= end;
      });
      // Aggregate sales by product
      const salesMap = {};
      filteredOrders.forEach(order => {
        order.items.forEach(oi => {
          if (!salesMap[oi.itemId]) {
            salesMap[oi.itemId] = { name: oi.name || oi.itemId, quantity: 0, amount: 0 };
          }
          salesMap[oi.itemId].quantity += Number(oi.quantity);
          salesMap[oi.itemId].amount += Number(oi.price) * Number(oi.quantity);
        });
      });
      // Add products with zero sales
      items.forEach(item => {
        if (!salesMap[item.id]) {
          salesMap[item.id] = { name: item.name, quantity: 0, amount: 0 };
        }
      });
      setData(Object.values(salesMap));
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      if (typeof doc.autoTable !== 'function') {
        alert('PDF export requires jspdf-autotable. Please ensure it is installed.');
        return;
      }
      doc.text('Sales by Product Report', 14, 16);
      doc.autoTable({
        startY: 24,
        head: [['Product', 'Quantity Sold', 'Total Amount']],
        body: data.map(row => [row.name, row.quantity, `৳${row.amount}`]),
      });
      doc.save('sales_by_product_report.pdf');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Reporting</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Report Type</InputLabel>
              <Select value={reportType} label="Report Type" onChange={e => setReportType(e.target.value)}>
                <MenuItem value="salesByProduct">Sales by Product</MenuItem>
                {/* Add more report types here */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={6}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange[0]}
                    onChange={date => setDateRange([date, dateRange[1]])}
                    renderInput={params => <TextField size="small" fullWidth {...params} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="End Date"
                    value={dateRange[1]}
                    onChange={date => setDateRange([dateRange[0], date])}
                    renderInput={params => <TextField size="small" fullWidth {...params} />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={2} md={2}>
            <Button variant="contained" onClick={handleGenerate} disabled={loading} fullWidth>Generate</Button>
          </Grid>
          <Grid item xs={12} sm={2} md={2}>
            <Button variant="outlined" onClick={handleDownloadPDF} disabled={data.length === 0} fullWidth>Download PDF</Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Report Data</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Quantity Sold</TableCell>
              <TableCell>Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>৳{row.amount}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow><TableCell colSpan={3} align="center">No data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
} 