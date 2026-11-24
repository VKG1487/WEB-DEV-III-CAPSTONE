const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true }).sort('name');

  // Compute product count per category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return {
        ...cat.toObject(),
        productCount: count,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: categoriesWithCounts.length,
    data: categoriesWithCounts,
  });
});

// @desc    Get single category by id or slug
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
  const category = isObjectId
    ? await Category.findById(req.params.id)
    : await Category.findOne({ slug: req.params.id });

  if (!category) {
    return next(new ErrorResponse(`Category not found with identifier ${req.params.id}`, 404));
  }

  const products = await Product.find({ category: category._id, isActive: true }).limit(8);

  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      featuredProducts: products,
    },
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Check if products exist under this category
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete category. ${productCount} active products are currently assigned to it.`,
        400
      )
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: {},
  });
});

