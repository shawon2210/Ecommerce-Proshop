const jwt = require('jsonwebtoken');

// Generate JWT token with enhanced security
const generateToken = (id, options = {}) => {
  const payload = { 
    id,
    iat: Math.floor(Date.now() / 1000),
    type: options.type || 'access'
  };
  
  const tokenOptions = {
    expiresIn: options.expiresIn || '24h', // Reduced from 30d for better security
    issuer: 'ecommerce-app',
    audience: 'ecommerce-users'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return generateToken(id, {
    expiresIn: '7d',
    type: 'refresh'
  });
};

// Verify token with enhanced validation
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ecommerce-app',
      audience: 'ecommerce-users'
    });
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

module.exports = { generateToken, generateRefreshToken, verifyToken };