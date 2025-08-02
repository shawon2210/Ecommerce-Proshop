const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { verifyToken } = require('../utils/generateToken');

// Middleware to protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      // Get user from the token (exclude password)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }
      
      // Check if user account is active
      if (!user.isActive) {
        res.status(403);
        throw new Error('Account has been deactivated');
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401);
      if (error.message === 'Token expired') {
        throw new Error('Token expired, please login again');
      } else if (error.message === 'Invalid token') {
        throw new Error('Invalid token, please login again');
      } else {
        throw new Error('Not authorized, token failed');
      }
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Middleware to check specific permissions
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && (req.user.isAdmin || (req.user.permissions && req.user.permissions.includes(permission)))) {
      next();
    } else {
      res.status(403);
      throw new Error(`Access denied. Required permission: ${permission}`);
    }
  };
};

// Middleware to check multiple permissions (user must have at least one)
const hasAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (req.user && (req.user.isAdmin || permissions.some(permission => req.user.permissions && req.user.permissions.includes(permission)))) {
      next();
    } else {
      res.status(403);
      throw new Error(`Access denied. Required permissions: ${permissions.join(' or ')}`);
    }
  };
};

// Middleware to check role
const hasRole = (roles) => {
  return (req, res, next) => {
    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (req.user && userRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      throw new Error(`Access denied. Required role: ${userRoles.join(' or ')}`);
    }
  };
};

module.exports = { protect, admin, hasPermission, hasAnyPermission, hasRole };