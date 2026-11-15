const express = require('express');
const so = require('../controllers/storeOrder.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('STORE_ADMIN'));

// "drivers" must come before "/:id/..." routes
router.get('/drivers', so.drivers);
router.get('/', so.list);
router.put('/:id/status', so.advance);
router.put('/:id/cancel', so.cancel);
router.put('/:id/driver', so.assignDriver);

module.exports = router;