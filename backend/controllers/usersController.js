const db = require('../db');
const bcrypt = require('bcryptjs');

function canManageUsers(role) {
  return role === 'super-admin' || role === 'admin';
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

exports.getAll = async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.read();
  const users = db.data.users.map(sanitizeUser).sort((a, b) => a.name.localeCompare(b.name));
  res.json({ users });
};

exports.remove = async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  await db.read();
  const index = db.data.users.findIndex((user) => String(user.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (String(db.data.users[index].id) === String(req.user.id)) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  db.data.users.splice(index, 1);
  await db.write();
  res.json({ success: true });
};

exports.update = async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const { name, email, role, password } = req.body;

  await db.read();
  const index = db.data.users.findIndex((user) => String(user.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  const user = db.data.users[index];

  if (email && email !== user.email) {
    const emailTaken = db.data.users.some(
      (u) => String(u.id) !== String(id) && String(u.email).toLowerCase() === String(email).toLowerCase()
    );
    if (emailTaken) {
      return res.status(409).json({ error: 'Email already registered' });
    }
  }

  if (String(user.id) === String(req.user.id) && role && role !== req.user.role) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.role = role ?? user.role;
  if (password) {
    user.password = bcrypt.hashSync(password, 10);
  }
  user.updated_at = new Date().toISOString();

  await db.write();
  res.json({ user: sanitizeUser(user) });
};