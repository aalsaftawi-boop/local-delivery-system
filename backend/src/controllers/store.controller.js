const prisma = require('../config/prisma');

// GET /api/stores (public) - list stores, optional ?search=
exports.listStores = async (req, res) => {
  try {
    const { search } = req.query;
    const stores = await prisma.store.findMany({
      where: search ? { name: { contains: search } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/stores/:id (public) - one store with its available menu
exports.getStore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const store = await prisma.store.findUnique({
      where: { id },
      include: { menuItems: { where: { isAvailable: true } } },
    });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/stores/mine (store admin) - my store
exports.getMyStore = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.user.id },
    });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/stores (store admin) - create my store (one per admin)
exports.createStore = async (req, res) => {
  try {
    const { name, description, category, city, address, phone, imageUrl } = req.body;

    if (!name || !category || !city || !address) {
      return res.status(400).json({ message: 'name, category, city and address are required' });
    }

    const existing = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'You already have a store' });
    }

    const store = await prisma.store.create({
      data: { ownerId: req.user.id, name, description, category, city, address, phone, imageUrl },
    });
    res.status(201).json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/stores/mine (store admin) - update my store
exports.updateStore = async (req, res) => {
  try {
    const { name, description, category, city, address, phone, imageUrl, isOpen } = req.body;

    const existing = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Create your store first' });
    }

    const store = await prisma.store.update({
      where: { id: existing.id },
      data: { name, description, category, city, address, phone, imageUrl, isOpen },
    });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};