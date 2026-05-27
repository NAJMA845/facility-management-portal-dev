const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'change_this_secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '8h' });
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  await db.read();
  const exists = db.data.users.find(u => u.email === email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const id = db.data.users.length ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1;
  const user = { id, name, email, password: hash, role: role || 'user', created_at: new Date().toISOString() };
  db.data.users.push(user);
  await db.write();
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = generateToken(safe);
  res.json({ user: safe, token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = generateToken(safe);
  res.json({ user: safe, token });
};
