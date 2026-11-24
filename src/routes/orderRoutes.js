const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getVendorOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer personal orders (must come before /:id)
router.get('/my-orders', protect, authorize('customer', 'admin'), getMyOrders);

// Vendor orders
router.get('/vendor/my-orders', protect, authorize('vendor', 'admin'), getVendorOrders);

// Place order (customer/admin) and Get all orders (admin)
router
  .route('/')
  .post(protect, authorize('customer', 'admin'), createOrder)
  .get(protect, authorize('admin'), getAllOrders);

// Single order details
router.get('/:id', protect, getOrderById);

// Update status (vendor/admin)
router.put('/:id/status', protect, authorize('vendor', 'admin'), updateOrderStatus);

// Cancel order (customer/admin)
router.put('/:id/cancel', protect, authorize('customer', 'admin'), cancelOrder);

module.exports = router;
