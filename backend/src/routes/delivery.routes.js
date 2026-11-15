const express = require('express');
const delivery = require('../controllers/delivery.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('DRIVER'));

router.get('/', delivery.list);
router.put('/:id/status', delivery.advance);

module.exports = router;