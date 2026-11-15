const prisma = require('../config/prisma');

// Loads (or creates) the customer's cart with its items
async function getCart(customerId) {
  let cart = await prisma.cart.findUnique({
    where: { customerId },
    include: { items: { include: { menuItem: true } }, store: true },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
      include: { items: { include: { menuItem: true } }, store: true },
    });
  }
  return cart;
}

function format(cart) {
  const items = cart.items.map((i) => ({
    id: i.id,
    menuItemId: i.menuItemId,
    name: i.menuItem.name,
    price: i.menuItem.price,
    quantity: i.quantity,
    lineTotal: i.menuItem.price * i.quantity,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    store: cart.store ? { id: cart.store.id, name: cart.store.name } : null,
    items,
    subtotal,
  };
}

// GET /api/cart
exports.view = async (req, res) => {
  try {
    res.json(format(await getCart(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/cart/items  { menuItemId, quantity }
exports.addItem = async (req, res) => {
  try {
    const menuItemId = Number(req.body.menuItemId);
    const quantity = Number(req.body.quantity || 1);
    if (!menuItemId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'menuItemId and a valid quantity are required' });
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({ message: 'Item not available' });
    }

    const cart = await getCart(req.user.id);

    // A cart can hold items from one store only
    if (cart.storeId && cart.storeId !== menuItem.storeId && cart.items.length > 0) {
      return res.status(409).json({ message: 'Your cart has items from another store. Clear it first.' });
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { storeId: menuItem.storeId } });

    const existing = cart.items.find((i) => i.menuItemId === menuItemId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, menuItemId, quantity } });
    }

    res.status(201).json(format(await getCart(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/cart/items/:id  { quantity }
exports.updateItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be 1 or more' });
    }
    const cart = await getCart(req.user.id);
    const item = cart.items.find((i) => i.id === Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Cart item not found' });

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    res.json(format(await getCart(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart/items/:id
exports.removeItem = async (req, res) => {
  try {
    const cart = await getCart(req.user.id);
    const item = cart.items.find((i) => i.id === Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Cart item not found' });

    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json(format(await getCart(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart  (clear)
exports.clear = async (req, res) => {
  try {
    const cart = await getCart(req.user.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } });
    res.json(format(await getCart(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};