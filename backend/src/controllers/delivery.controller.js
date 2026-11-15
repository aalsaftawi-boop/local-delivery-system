const prisma = require('../config/prisma');

const include = {
  items: true,
  store: { select: { name: true, address: true, phone: true } },
  customer: { select: { name: true } },
};

// GET /api/deliveries (driver) - orders assigned to me
exports.list = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { driverId: req.user.id },
      include,
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/deliveries/:id/status: READY -> OUT_FOR_DELIVERY -> DELIVERED
const DRIVER_FLOW = { READY: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' };

exports.advance = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order || order.driverId !== req.user.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const next = DRIVER_FLOW[order.status];
    if (!next) {
      return res.status(400).json({ message: `Cannot change an order that is ${order.status}` });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: next, history: { create: { status: next, changedById: req.user.id } } },
      include,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};