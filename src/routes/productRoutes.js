const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyVendorProducts,
  addProductReview,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Vendor-specific products listing (must come before /:id)
router.get('/vendor/my-products', protect, authorize('vendor', 'admin'), getMyVendorProducts);

// Public product listing and product creation (vendor or admin)
router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('vendor', 'admin'), createProduct);

// Single product operations
router
  .route('/:id')
  .get(getProductById)
  .put(protect, authorize('vendor', 'admin'), updateProduct)
  .delete(protect, authorize('vendor', 'admin'), deleteProduct);

// Add product review
router.post('/:id/reviews', protect, authorize('customer', 'admin'), addProductReview);

module.exports = router;
