const { body, param, query } = require('express-validator');

// Validation for saving recommendation (unified)
const validateSaveRecommendation = [
  body('recommendationType')
    .notEmpty()
    .withMessage('Recommendation type is required')
    .isIn(['itinerary', 'apps', 'food', 'music', 'lingo', 'packing'])
    .withMessage('Invalid recommendation type'),
  
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ max: 255 })
    .withMessage('Destination must be less than 255 characters'),
  
  body('language')
    .optional()
    .isLength({ max: 40 })
    .withMessage('Language must be less than 40 characters'),
  
  body('requestData')
    .notEmpty()
    .withMessage('Request data is required')
    .isObject()
    .withMessage('Request data must be a valid object'),
  
  body('responseData')
    .notEmpty()
    .withMessage('Response data is required')
    .isObject()
    .withMessage('Response data must be a valid object'),
  
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  
  body('tripContext')
    .optional()
    .isObject()
    .withMessage('Trip context must be a valid object')
];

// Validation for updating recommendation (unified)
const validateUpdateRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Validation for getting recommendation (unified)
const validateGetRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Validation for deleting recommendation (unified)
const validateDeleteRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Validation for history query parameters (enhanced)
const validateHistoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters'),
  
  query('destination')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Destination filter must be less than 255 characters'),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  query('recommendationType')
    .optional()
    .isIn(['itinerary', 'apps', 'food', 'music', 'lingo', 'packing'])
    .withMessage('Invalid recommendation type filter')
];

// Legacy validation for saving app recommendation (backward compatibility)
const validateSaveAppRecommendation = [
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ max: 255 })
    .withMessage('Destination must be less than 255 characters'),
  
  body('language')
    .optional()
    .isLength({ max: 40 })
    .withMessage('Language must be less than 40 characters'),
  
  body('requestData')
    .notEmpty()
    .withMessage('Request data is required')
    .isObject()
    .withMessage('Request data must be a valid object'),
  
  body('responseData')
    .notEmpty()
    .withMessage('Response data is required')
    .isObject()
    .withMessage('Response data must be a valid object'),
  
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Legacy validation for updating app recommendation (backward compatibility)
const validateUpdateAppRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Legacy validation for getting app recommendation (backward compatibility)
const validateGetAppRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Legacy validation for deleting app recommendation (backward compatibility)
const validateDeleteAppRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

module.exports = {
  // Unified validation functions
  validateSaveRecommendation,
  validateUpdateRecommendation,
  validateGetRecommendation,
  validateDeleteRecommendation,
  validateHistoryQuery,
  
  // Legacy validation functions for backward compatibility
  validateSaveAppRecommendation,
  validateUpdateAppRecommendation,
  validateGetAppRecommendation,
  validateDeleteAppRecommendation
};