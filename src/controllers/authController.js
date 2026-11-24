const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Helper function to send token in response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      vendorDetails: user.vendorDetails,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register (or /api/users/register)
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, address, storeName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('A user with this email address already exists', 400));
  }

  // Allow role specification (default to customer; vendors require storeName)
  const userRole = role && ['customer', 'vendor'].includes(role) ? role : 'customer';

  const userData = {
    name,
    email,
    password,
    role: userRole,
    phone: phone || '',
    address: address || {},
  };

  if (userRole === 'vendor') {
    userData.vendorDetails = {
      storeName: storeName || `${name}'s Store`,
      isApproved: true,
    };
  }

  const user = await User.create(userData);

  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/auth/login (or /api/users/login)
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide both email and password', 400));
  }

  // Check for user (must explicitly select password since select: false)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid email or password credentials', 401));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account has been deactivated. Please contact support.', 403));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid email or password credentials', 401));
  }

  sendTokenResponse(user, 200, res, 'User logged in successfully');
});

// @desc    Get current logged in user profile
// @route   GET /api/auth/me (or /api/users/profile)
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile (or /api/users/profile)
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name || req.user.name,
    phone: req.body.phone !== undefined ? req.body.phone : req.user.phone,
    address: req.body.address || req.user.address,
  };

  if (req.user.role === 'vendor' && req.body.storeName) {
    fieldsToUpdate['vendorDetails.storeName'] = req.body.storeName;
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

