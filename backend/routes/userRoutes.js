const express = require('express');
const router = express.Router();
const {
  authUser,
  adminLogin,
  registerUser,
  registerAdmin,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  checkPermission,
} = require('../controllers/userController');
const { protect, admin, hasPermission, hasRole } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/securityMiddleware');

// Public routes with rate limiting
router.route('/').post(registerLimiter, registerUser).get(protect, hasPermission('manage_users'), getUsers);
router.post('/login', loginLimiter, authUser);

// Admin routes
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/admin/register', registerAdmin);

// Protected routes
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Permission check route
router.get('/permissions/:permission', protect, checkPermission);

// Admin routes with specific permissions
router
  .route('/:id')
  .delete(protect, hasPermission('manage_users'), deleteUser)
  .get(protect, hasPermission('manage_users'), getUserById)
  .put(protect, hasPermission('manage_users'), updateUser);

module.exports = router;