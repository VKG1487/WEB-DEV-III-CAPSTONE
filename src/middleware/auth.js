const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route. Please provide a Bearer token.', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('No user found with the provided credentials', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('This user account has been deactivated. Contact administrator.', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route. Invalid or expired token.', 401));
  }
});

// Grant access to specific roles (Role-Based Access Control)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required before authorization check', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Forbidden: User role '${req.user.role}' is not authorized to access this endpoint. Required role(s): [${roles.join(', ')}]`,
          403
        )
      );
    }
    next();
  };
};

