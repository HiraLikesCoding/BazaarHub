const router = require('express').Router();
const { getDashboardStats, getInventory, getCustomers } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Every route here requires a logged in admin
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/inventory', getInventory);
router.get('/customers', getCustomers);

module.exports = router;
