const db = require('../db');

exports.getProfile = async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
};

exports.updateProfile = async (req, res) => {
  const { name, phone, department, bio } = req.body;
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const user = db.data.users[idx];
  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.department = department ?? user.department;
  user.bio = bio ?? user.bio;
  user.updated_at = new Date().toISOString();
  await db.write();
  const { password, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
};

exports.getCurrentUser = async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
};
