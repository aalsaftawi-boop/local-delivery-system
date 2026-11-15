const express = require('express');
const cart = require('../controllers/cart.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('CUSTOMER'));

router.get('/', cart.view);
router.post('/items', cart.addItem);
router.put('/items/:id', cart.updateItem);
router.delete('/items/:id', cart.removeItem);
router.delete('/', cart.clear);

module.exports = router;