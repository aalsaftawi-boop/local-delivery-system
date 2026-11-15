const prisma = require('../config/prisma');

const DELIVERY_FEE = 5;

// POST /api/orders (customer) - turns the cart into an order
// body: { city, street, building, notes, phone, customerNotes }
exports.placeOrder = async (req, res) => {
  try {
    const { city, street, building, notes, phone, customerNotes } = req.body;
    if (!city || !street || !phone) {
      return res.status(400).json({ message: 'city, street and phone are required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { customerId: req.user.id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!cart || cart.items.length === 0 || !cart.storeId) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const store = await prisma.store.findUnique({ where: { id: cart.storeId } });
    if (!store || !store.isOpen) {
      return res.status(400).json({ message: 'This store is closed right now' });
    }

    const unavailable = cart.items.find((i) => !i.menuItem.isAvailable);
    if (unavailable) {
      return res.status(400).json({ message: `"${unavailable.menuItem.name}" is no longer available` });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
    const total = subtotal + DELIVERY_FEE;

    // Everything below succeeds together or not at all
    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: { userId: req.user.id, city, street, building, notes },
      });

      const created = await tx.order.create({
        data: {
          customerId: req.user.id,
          storeId: store.id,
          addressId: address.id,
          subtotal,
          deliveryFee: DELIVERY_FEE,
          total,
          customerNotes,
          deliveryAddressText: [city, street, building].filter(Boolean).join(', '),
          customerPhone: phone,
          items: {
            create: cart.items.map((i) => ({
              menuItemId: i.menuItemId,
              nameSnapshot: i.menuItem.name,
              priceSnapshot: i.menuItem.price,
              quantity: i.quantity,
            })),
          },
          history: { create: { status: 'PENDING', changedById: req.user.id } },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });
      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders (customer) - my order history
exports.myOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: { store: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/:id (customer) - one of my orders with status history
exports.getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        store: { select: { name: true } },
        items: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order || order.customerId !== req.user.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};