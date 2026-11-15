const express = require('express');
const store = require('../controllers/store.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Store admin routes ("mine" must come BEFORE "/:id")
router.get('/mine', requireAuth, requireRole('STORE_ADMIN'), store.getMyStore);
router.put('/mine', requireAuth, requireRole('STORE_ADMIN'), store.updateStore);
router.post('/', requireAuth, requireRole('STORE_ADMIN'), store.createStore);

// Public routes
router.get('/', store.listStores);
router.get('/:id', store.getStore);

module.exports = router;