const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// @desc    Get all users (with search and role filter)
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res, next) => {
  const queryObj = {};

  if (req.query.role) {
    queryObj.role = req.query.role;
  }

  if (req.query.search) {
    queryObj.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const users = await User.find(queryObj).select('-password').sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details or role
// @route   PUT /api/users/:id
// @access  Private (Admin / Owner)
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, isActive, vendorDetails } = req.body;

  // STRICT RULE: Only the system owner has permission to change user roles
  if (role && req.user.role !== 'owner') {
    return next(new ErrorResponse('Forbidden: Only the system owner has permission to change user roles', 403));
  }

  // Enforce single owner rule
  if (role === 'owner') {
    const existingOwner = await User.findOne({ role: 'owner', _id: { $ne: req.params.id } });
    if (existingOwner) {
      return next(new ErrorResponse('Only one owner account is permitted in the system.', 400));
    }
  }

  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (email) fieldsToUpdate.email = email;
  if (role) fieldsToUpdate.role = role;
  if (typeof isActive === 'boolean') fieldsToUpdate.isActive = isActive;
  if (vendorDetails) fieldsToUpdate.vendorDetails = vendorDetails;

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
});

// @desc    Toggle/update user role (Owner only)
// @route   PUT /api/users/:id/role
// @access  Private (Owner only)
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role) {
    return next(new ErrorResponse('Please specify a role to assign', 400));
  }

  const validRoles = ['customer', 'vendor', 'admin', 'owner'];
  if (!validRoles.includes(role)) {
    return next(new ErrorResponse(`Invalid role. Valid options: ${validRoles.join(', ')}`, 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Prevent demoting current owner
  if (user.role === 'owner' && role !== 'owner') {
    return next(new ErrorResponse('The system owner role cannot be demoted directly', 400));
  }

  // Enforce single owner rule
  if (role === 'owner' && user.role !== 'owner') {
    const existingOwner = await User.findOne({ role: 'owner', _id: { $ne: user._id } });
    if (existingOwner) {
      return next(new ErrorResponse('Only one owner account is permitted in the system.', 400));
    }
  }

  user.role = role;
  if (role === 'vendor' && !user.vendorDetails?.storeName) {
    user.vendorDetails = {
      storeName: `${user.name}'s Store`,
      businessLicense: 'VERIFIED-OWNER-ASSIGNED',
      isApproved: true,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `User role successfully updated to ${role}`,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin / Owner)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Prevent deleting the system owner account
  if (user.role === 'owner') {
    return next(new ErrorResponse('The system owner account cannot be deleted', 400));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.id) {
    return next(new ErrorResponse('You cannot delete your own admin account', 400));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {},
  });
});

