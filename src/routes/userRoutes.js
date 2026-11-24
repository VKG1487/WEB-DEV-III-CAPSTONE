const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Allow /api/users/register, /api/users/login, /api/users/profile directly to match guidelines exactly!
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin user management routes
router.use(protect, authorize('admin'));

router.route('/').get(getUsers);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
