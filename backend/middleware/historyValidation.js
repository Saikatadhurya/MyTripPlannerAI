const { body, param, query } = require('express-validator');

// Validation for saving app recommendation
const validateSaveAppRecommendation = [
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ max: 255 })
    .withMessage('Destination must be less than 255 characters'),
  
  body('language')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Language must be less than 10 characters'),
  
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

// Validation for updating app recommendation
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

// Validation for getting app recommendation
const validateGetAppRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Validation for deleting app recommendation
const validateDeleteAppRecommendation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Validation for history query parameters
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
    .withMessage('Tags must be a comma-separated string')
];

module.exports = {
  validateSaveAppRecommendation,
  validateUpdateAppRecommendation,
  validateGetAppRecommendation,
  validateDeleteAppRecommendation,
  validateHistoryQuery
};
