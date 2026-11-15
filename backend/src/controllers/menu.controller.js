const prisma = require('../config/prisma');

// Finds the store that belongs to the logged-in admin
async function myStore(userId) {
  return prisma.store.findUnique({ where: { ownerId: userId } });
}

// GET /api/menu/mine (store admin) - all my items, including unavailable
exports.listMine = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });

    const items = await prisma.menuItem.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/menu (store admin) - add an item
exports.createItem = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });

    const { name, description, price, category, imageUrl } = req.body;
    if (!name || price === undefined || Number(price) < 0 || Number.isNaN(Number(price))) {
      return res.status(400).json({ message: 'name and a valid price are required' });
    }

    const item = await prisma.menuItem.create({
      data: { storeId: store.id, name, description, price: Number(price), category, imageUrl },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/menu/:id (store admin) - edit an item (only in my own store)
exports.updateItem = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });

    const id = Number(req.params.id);
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.storeId !== store.id) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        category,
        imageUrl,
        isAvailable,
        price: price !== undefined ? Number(price) : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/menu/:id (store admin)
exports.deleteItem = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });

    const id = Number(req.params.id);
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.storeId !== store.id) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};