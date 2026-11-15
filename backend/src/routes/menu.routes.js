const express = require('express');
const menu = require('../controllers/menu.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every menu route is for store admins only
router.use(requireAuth, requireRole('STORE_ADMIN'));

router.get('/mine', menu.listMine);
router.post('/', menu.createItem);
router.put('/:id', menu.updateItem);
router.delete('/:id', menu.deleteItem);

module.exports = router;