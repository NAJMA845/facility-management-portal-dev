const db = require('../db');

let mailerModule;

function getMailer() {
  if (mailerModule !== undefined) return mailerModule;
  try {
    mailerModule = require('nodemailer');
  } catch (error) {
    mailerModule = null;
  }
  return mailerModule;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+()\-\s]{7,20}$/;
const allowedStatuses = new Set(['New', 'In Review', 'Resolved']);

function normalize(value) {
  return String(value || '').trim();
}

function validateContactPayload(payload) {
  const name = normalize(payload.name);
  const email = normalize(payload.email).toLowerCase();
  const phone = normalize(payload.phone);
  const subject = normalize(payload.subject);
  const message = normalize(payload.message);

  if (!name || !email || !subject || !message) {
    return { valid: false, error: 'Name, email, subject and message are required.' };
  }

  if (name.length < 2 || name.length > 80) {
    return { valid: false, error: 'Name must be between 2 and 80 characters.' };
  }

  if (!emailPattern.test(email) || email.length > 120) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (phone && !phonePattern.test(phone)) {
    return { valid: false, error: 'Phone number format is invalid.' };
  }

  if (subject.length < 3 || subject.length > 150) {
    return { valid: false, error: 'Subject must be between 3 and 150 characters.' };
  }

  if (message.length < 10 || message.length > 2000) {
    return { valid: false, error: 'Message must be between 10 and 2000 characters.' };
  }

  return {
    valid: true,
    sanitized: { name, email, phone, subject, message }
  };
}

async function sendContactConfirmation(contact) {
  const nodemailer = getMailer();
  if (!nodemailer) {
    return { sent: false, reason: 'nodemailer_not_installed' };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL || user;

  if (!host || !user || !pass || !from) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const confirmationSubject = `We received your message: ${contact.subject}`;
  const confirmationText = [
    `Hi ${contact.name},`,
    '',
    'Thanks for contacting Facility Pro. Our team has received your message and will get back to you soon.',
    '',
    `Reference: CO-${String(contact.id).padStart(4, '0')}`,
    `Subject: ${contact.subject}`,
    '',
    'Best regards,',
    'Facility Pro Team'
  ].join('\n');

  await transporter.sendMail({
    from,
    to: contact.email,
    subject: confirmationSubject,
    text: confirmationText
  });

  const notifyTo = normalize(process.env.CONTACT_NOTIFICATION_EMAIL);
  if (notifyTo) {
    await transporter.sendMail({
      from,
      to: notifyTo,
      subject: `New contact message: ${contact.subject}`,
      text: [
        `Reference: CO-${String(contact.id).padStart(4, '0')}`,
        `Name: ${contact.name}`,
        `Email: ${contact.email}`,
        `Phone: ${contact.phone || 'N/A'}`,
        '',
        contact.message
      ].join('\n')
    });
  }

  return { sent: true };
}

// Initialize contacts array
async function ensureContactsArray() {
  await db.read();
  if (!db.data.contacts) db.data.contacts = [];
}

function canManageContacts(role) {
  return role === 'super-admin' || role === 'admin' || role === 'manager';
}

exports.getAll = async (req, res) => {
  if (!canManageContacts(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await ensureContactsArray();
  const contacts = [...(db.data.contacts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ contacts });
};

exports.create = async (req, res) => {
  const validation = validateContactPayload(req.body || {});
  if (!validation.valid) return res.status(400).json({ error: validation.error });

  const { name, email, phone, subject, message } = validation.sanitized;
  await ensureContactsArray();
  const id = db.data.contacts.length ? Math.max(...db.data.contacts.map(c => c.id)) + 1 : 1;
  const contact = { id, name, email, phone: phone || '', subject, message, status: 'New', created_at: new Date().toISOString() };
  db.data.contacts.push(contact);
  await db.write();

  let confirmation = { sent: false, reason: 'not_attempted' };
  try {
    confirmation = await sendContactConfirmation(contact);
  } catch (error) {
    confirmation = { sent: false, reason: 'send_failed' };
  }

  res.status(201).json({ contact, confirmationEmailSent: confirmation.sent });
};

exports.update = async (req, res) => {
  if (!canManageContacts(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  const status = normalize(req.body && req.body.status);
  if (!status || !allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  await ensureContactsArray();
  const idx = db.data.contacts.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const contact = db.data.contacts[idx];
  contact.status = status;
  await db.write();
  res.json({ contact });
};

exports.remove = async (req, res) => {
  if (!canManageContacts(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  await ensureContactsArray();
  const idx = db.data.contacts.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.contacts.splice(idx, 1);
  await db.write();
  res.json({ success: true });
};
