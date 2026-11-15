require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const storeRoutes = require('./routes/store.routes');
const menuRoutes = require('./routes/menu.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const storeOrderRoutes = require('./routes/storeOrder.routes');
const deliveryRoutes = require('./routes/delivery.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/store-orders', storeOrderRoutes);
app.use('/api/deliveries', deliveryRoutes);

app.use(express.static(path.join(__dirname, '../../frontend')));

module.exports = app;