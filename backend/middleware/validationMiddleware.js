const { body, param, validationResult } = require('express-validator');

// Validation middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Validation rules for updating profile
const validateUpdateProfile = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  handleValidationErrors
];

// Validation rules for changing password
const validateChangePassword = [
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  
  handleValidationErrors
];

// Validation rules for connecting social account
const validateConnectSocialAccount = [
  body('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(['google'])
    .withMessage('Provider must be google'),
  
  body('providerId')
    .notEmpty()
    .withMessage('Provider ID is required')
    .isString()
    .withMessage('Provider ID must be a string'),
  
  handleValidationErrors
];

// Validation rules for disconnecting social account
const validateDisconnectSocialAccount = [
  param('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(['google'])
    .withMessage('Provider must be google'),
  
  handleValidationErrors
];

// Validation rules for deleting account
const validateDeleteAccount = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to confirm account deletion')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  
  handleValidationErrors
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body.full_name) {
    req.body.full_name = req.body.full_name.trim().replace(/\s+/g, ' ');
  }
  
  if (req.body.email) {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  
  if (req.body.provider) {
    req.body.provider = req.body.provider.trim().toLowerCase();
  }
  
  if (req.body.providerId) {
    req.body.providerId = req.body.providerId.trim();
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUpdateProfile,
  validateChangePassword,
  validateConnectSocialAccount,
  validateDisconnectSocialAccount,
  validateDeleteAccount,
  sanitizeInput
};
