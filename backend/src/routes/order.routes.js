const express = require('express');
const order = require('../controllers/order.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('CUSTOMER'));

router.post('/', order.placeOrder);
router.get('/', order.myOrders);
router.get('/:id', order.getOrder);

module.exports = router;