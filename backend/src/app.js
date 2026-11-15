require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Serve the frontend from the same server
app.use(express.static(path.join(__dirname, '../../frontend')));

module.exports = app;