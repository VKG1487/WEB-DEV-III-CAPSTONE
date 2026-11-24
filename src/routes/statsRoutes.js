const express = require('express');
const { getAdminStats, getVendorStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminStats);
router.get('/vendor', protect, authorize('vendor'), getVendorStats);

module.exports = router;
