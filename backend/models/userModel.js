const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'manage_users', 'manage_products', 'manage_orders', 'view_analytics']
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    shippingAddress: {
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Constants for account locking
userSchema.statics.MAX_LOGIN_ATTEMPTS = 5;
userSchema.statics.LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Method to compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  // If account is locked, don't attempt password comparison
  if (this.isLocked) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= this.constructor.MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + this.constructor.LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to check permissions
userSchema.methods.hasPermission = function(permission) {
  if (this.isAdmin) return true;
  return this.permissions.includes(permission);
};

// Method to assign role-based permissions
userSchema.methods.assignRolePermissions = function() {
  const rolePermissions = {
    user: ['read'],
    moderator: ['read', 'write', 'manage_products'],
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_products', 'manage_orders', 'view_analytics']
  };
  
  this.permissions = rolePermissions[this.role] || ['read'];
  if (this.role === 'admin') {
    this.isAdmin = true;
  }
};

// Middleware to hash password and assign permissions before saving
userSchema.pre('save', async function (next) {
  // Assign role-based permissions if role is modified
  if (this.isModified('role')) {
    this.assignRolePermissions();
  }
  
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;