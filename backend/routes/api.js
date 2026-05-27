const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const workorders = require('../controllers/workordersController');
const assets = require('../controllers/assetsController');
const tenants = require('../controllers/tenantsController');
const contacts = require('../controllers/contactsController');
const profile = require('../controllers/profileController');
const dashboard = require('../controllers/dashboardController');
const users = require('../controllers/usersController');
const revenue = require('../controllers/revenueController');
const { authenticate } = require('../middleware/auth');

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Work orders (protected)
router.get('/workorders', authenticate, workorders.getAll);
router.post('/workorders', authenticate, workorders.create);
router.put('/workorders/:id', authenticate, workorders.update);
router.delete('/workorders/:id', authenticate, workorders.remove);

// Assets (protected)
router.get('/assets', authenticate, assets.getAll);
router.post('/assets', authenticate, assets.create);
router.put('/assets/:id', authenticate, assets.update);
router.delete('/assets/:id', authenticate, assets.remove);

// Tenant requests
router.get('/tenants/requests', authenticate, tenants.getRequests);
router.post('/tenants/requests', tenants.createRequest);
router.put('/tenants/requests/:id', authenticate, tenants.update);
router.delete('/tenants/requests/:id', authenticate, tenants.remove);

// Contacts
router.get('/contacts', authenticate, contacts.getAll);
router.post('/contacts', contacts.create);
router.put('/contacts/:id', authenticate, contacts.update);
router.delete('/contacts/:id', authenticate, contacts.remove);

// Profile
router.get('/profile', authenticate, profile.getProfile);
router.put('/profile', authenticate, profile.updateProfile);
router.get('/profile/current', authenticate, profile.getCurrentUser);

// Dashboard
router.get('/dashboard/stats', authenticate, dashboard.stats);

// Users
router.get('/users', authenticate, users.getAll);
router.put('/users/:id', authenticate, users.update);
router.delete('/users/:id', authenticate, users.remove);

// Revenue
router.get('/revenue', authenticate, revenue.getAll);
router.post('/revenue', authenticate, revenue.create);
router.put('/revenue/:id', authenticate, revenue.update);
router.delete('/revenue/:id', authenticate, revenue.remove);
router.get('/revenue/summary', authenticate, revenue.summary);

module.exports = router;
