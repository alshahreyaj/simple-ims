const express = require('express');
const cors = require('cors');
const itemsRouter = require('./routes/items');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const vendorsRouter = require('./routes/vendors');
const purchaseOrdersRouter = require('./routes/purchaseOrders');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('IMS Backend Running');
});

app.use('/api/items', itemsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`IMS backend running on port ${PORT}`);
}); 