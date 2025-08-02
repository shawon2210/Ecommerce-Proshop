const User = require('../models/userModel');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');

// @desc    Auth user & get token (works for both regular users and admins)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      res.status(423);
      throw new Error('Account temporarily locked due to too many failed login attempts');
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403);
      throw new Error('Account has been deactivated');
    }

    // Check password
    if (await user.matchPassword(password)) {
      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data with token (works for both users and admins)
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      });
    } else {
      // Increment login attempts on failed login
      await user.incLoginAttempts();
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    throw error;
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create new user with default role (only allow 'user' role for public registration)
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // Force user role for public registration
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        isActive: user.isActive,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    throw error;
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // Get user from database (req.user is set by the protect middleware)
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  // Get user from database
  const user = await User.findById(req.user._id);

  if (user) {
    // Update user fields if provided in request
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Update shipping address if provided
    if (req.body.shippingAddress) {
      user.shippingAddress = req.body.shippingAddress;
    }
    
    // Update password if provided (with validation)
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }
      user.password = req.body.password;
    }

    // Save updated user
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      permissions: updatedUser.permissions,
      shippingAddress: updatedUser.shippingAddress,
      token: generateToken(updatedUser._id),
      refreshToken: generateRefreshToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      permissions: updatedUser.permissions,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Register admin user
// @route   POST /api/users/admin/register
// @access  Public (for initial admin setup) or Private/Admin
const registerAdmin = async (req, res) => {
  const { name, email, password, role, adminKey } = req.body;

  try {
    console.log('Admin registration attempt:', { name, email, adminKey, role });
    
    // Check for admin setup key (for initial admin creation)
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'ADMIN2024';
    console.log('Expected admin key:', ADMIN_SETUP_KEY);
    
    // Check for admin setup key
    if (adminKey !== ADMIN_SETUP_KEY) {
      res.status(403);
      throw new Error('Invalid admin setup key');
    }

    // Set default role to admin if not provided
    const userRole = role || 'admin';
    
    // Only allow admin or moderator roles
    if (!['admin', 'moderator'].includes(userRole)) {
      res.status(400);
      throw new Error('Invalid role for admin registration');
    }

    // Validate input
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400);
      throw new Error('Admin password must be at least 6 characters long');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create new admin user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        isActive: user.isActive,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    throw error;
  }
};

// @desc    Admin login (same as regular login but with admin validation)
// @route   POST /api/users/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Check if user is admin or moderator
    if (!user.isAdmin && user.role !== 'moderator') {
      res.status(403);
      throw new Error('Access denied. Admin privileges required.');
    }

    // Check if account is locked
    if (user.isLocked) {
      res.status(423);
      throw new Error('Account temporarily locked due to too many failed login attempts');
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403);
      throw new Error('Account has been deactivated');
    }

    // Check password
    if (await user.matchPassword(password)) {
      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return admin user data with token
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      });
    } else {
      // Increment login attempts on failed login
      await user.incLoginAttempts();
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    throw error;
  }
};

// @desc    Check user permissions
// @route   GET /api/users/permissions/:permission
// @access  Private
const checkPermission = async (req, res) => {
  const { permission } = req.params;
  const user = await User.findById(req.user._id);
  
  if (user) {
    const hasPermission = user.hasPermission(permission);
    res.json({ hasPermission, permission });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

module.exports = {
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
};