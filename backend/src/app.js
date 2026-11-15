require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const storeRoutes = require('./routes/store.routes');
const menuRoutes = require('./routes/menu.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/menu', menuRoutes);

app.use(express.static(path.join(__dirname, '../../frontend')));

module.exports = app;