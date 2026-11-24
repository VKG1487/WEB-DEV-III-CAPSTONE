const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

// @desc    Get all products (with Search, Filter, Sort, Pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  const reqQuery = { ...req.query };

  // Fields to exclude from query filter object
  const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'category'];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryObj = {};

  // Text search
  if (req.query.search) {
    queryObj.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Filter by category slug or id
  if (req.query.category) {
    const categoryDoc = await Category.findOne({
      $or: [{ _id: req.query.category.match(/^[0-9a-fA-F]{24}$/) ? req.query.category : null }, { slug: req.query.category }],
    });
    if (categoryDoc) {
      queryObj.category = categoryDoc._id;
    }
  }

  // Price range filters: minPrice, maxPrice
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.rating) {
    queryObj.rating = { $gte: Number(req.query.rating) };
  }

  // Stock filter (inStock=true)
  if (req.query.inStock === 'true') {
    queryObj.stock = { $gt: 0 };
  }

  // Only show active products for public listing unless requested by vendor/admin
  if (!req.query.showAll) {
    queryObj.isActive = true;
  }

  // Vendor filter (if querying vendor's products)
  if (req.query.vendor) {
    queryObj.vendor = req.query.vendor;
  }

  // Build query
  let query = Product.find(queryObj)
    .populate('category', 'name slug icon')
    .populate('vendor', 'name vendorDetails email');

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  const total = await Product.countDocuments(queryObj);

  query = query.skip(startIndex).limit(limit);

  const products = await query;

  // Pagination result metadata
  const pagination = {
    currentPage: page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    totalRecords: total,
  };

  if (startIndex + limit < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: products.length,
    pagination,
    data: products,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug icon description')
    .populate('vendor', 'name vendorDetails email');

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Fetch reviews for this product
  const reviews = await Review.find({ product: product._id })
    .populate('user', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      reviews,
    },
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor, Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Add vendor to req.body
  req.body.vendor = req.user.role === 'admin' && req.body.vendor ? req.body.vendor : req.user.id;

  // Verify category exists
  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return next(new ErrorResponse(`Category not found with id of ${req.body.category}`, 404));
    }
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor owner, Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Ensure current user is product vendor or admin
  if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this product. You can only manage your own catalog.', 403)
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor owner, Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Ensure current user is product vendor or admin
  if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this product. You can only manage your own catalog.', 403)
    );
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: {},
  });
});

// @desc    Get vendor's own products
// @route   GET /api/products/vendor/my-products
// @access  Private (Vendor)
exports.getMyVendorProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ vendor: req.user.id })
    .populate('category', 'name slug')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// @desc    Add review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (Customer, Admin)
exports.addProductReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Check if user already reviewed
  const alreadyReviewed = await Review.findOne({
    product: req.params.id,
    user: req.user.id,
  });

  if (alreadyReviewed) {
    return next(new ErrorResponse('You have already submitted a review for this product', 400));
  }

  const review = await Review.create({
    user: req.user.id,
    product: req.params.id,
    rating: Number(rating),
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: review,
  });
});
