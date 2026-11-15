const prisma = require('../config/prisma');

const ADMIN_FLOW = { PENDING: 'PREPARING', PREPARING: 'READY' };

const include = {
  items: true,
  customer: { select: { name: true, phone: true } },
  driver: { select: { id: true, name: true, phone: true } },
};

async function myStore(userId) {
  return prisma.store.findUnique({ where: { ownerId: userId } });
}

exports.list = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });
    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include,
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.advance = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order || order.storeId !== store.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const next = ADMIN_FLOW[order.status];
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

exports.cancel = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order || order.storeId !== store.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', history: { create: { status: 'CANCELLED', changedById: req.user.id } } },
      include,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.drivers = async (req, res) => {
  try {
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER', driverProfile: { isAvailable: true } },
      select: { id: true, name: true, phone: true },
    });
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const store = await myStore(req.user.id);
    if (!store) return res.status(404).json({ message: 'Create your store first' });
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order || order.storeId !== store.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!['PREPARING', 'READY'].includes(order.status)) {
      return res.status(400).json({ message: 'Assign a driver once the order is being prepared' });
    }
    const driverId = Number(req.body.driverId);
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true },
    });
    if (!driver || driver.role !== 'DRIVER' || !driver.driverProfile?.isAvailable) {
      return res.status(400).json({ message: 'Driver not available' });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { driverId },
      include,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};