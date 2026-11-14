const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const ALLOWED_ROLES = ['CUSTOMER', 'STORE_ADMIN', 'DRIVER'];

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'CUSTOMER' } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'name, email, phone and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role },
    });

    if (role === 'DRIVER') {
      await prisma.driverProfile.create({ data: { userId: user.id } });
    }

    res.status(201).json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};