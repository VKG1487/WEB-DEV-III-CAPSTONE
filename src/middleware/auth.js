const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes - Course Role & User Authentication (Unit 2 & 4 Middleware)
exports.protect = asyncHandler(async (req, res, next) => {
  let userId = req.headers['x-user-id'] || req.headers['user-id'] || req.headers['authorization'];
  const roleHeader = req.headers['role'];

  // Clean Bearer prefix if sent
  if (userId && typeof userId === 'string' && userId.startsWith('Bearer ')) {
    userId = userId.split(' ')[1];
  }

  let user = null;

  if (userId) {
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: userId });
    }
  }

  // Fallback: If role header is specified (matching course role-based middleware)
  if (!user && roleHeader) {
    user = await User.findOne({ role: roleHeader, isActive: true });
  }

  if (!user) {
    return next(
      new ErrorResponse(
        'Not authorized to access this route. Please provide authentication headers (x-user-id or role).',
        401
      )
    );
  }

  if (!user.isActive) {
    return next(new ErrorResponse('This user account has been deactivated. Contact administrator.', 403));
  }

  req.user = user;
  next();
});

// Grant access to specific roles (Role-Based Access Control - Unit 4 Lecture 37)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user && req.user.role) || req.headers['role'];

    if (!userRole) {
      return next(new ErrorResponse('Role header or authentication required before authorization check', 401));
    }

    if (!roles.includes(userRole)) {
      return next(
        new ErrorResponse(
          `Forbidden: User role '${userRole}' is not authorized to access this endpoint. Required role(s): [${roles.join(', ')}]`,
          403
        )
      );
    }
    next();
  };
};
