const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateSaveAppRecommendation,
  validateUpdateAppRecommendation,
  validateGetAppRecommendation,
  validateDeleteAppRecommendation,
  validateHistoryQuery
} = require('../middleware/historyValidation');

// All routes require authentication
router.use(authMiddleware);

// Save app recommendation to history
router.post('/save', validateSaveAppRecommendation, historyController.saveAppRecommendation);

// Get user's app recommendation history with filters and pagination
router.get('/history', validateHistoryQuery, historyController.getAppHistory);

// Get specific app recommendation by ID
router.get('/:id', validateGetAppRecommendation, historyController.getAppRecommendation);

// Update app recommendation (title, tags, notes)
router.put('/:id', validateUpdateAppRecommendation, historyController.updateAppRecommendation);

// Delete app recommendation
router.delete('/:id', validateDeleteAppRecommendation, historyController.deleteAppRecommendation);

// Get user's destinations for filter dropdown
router.get('/filters/destinations', historyController.getUserDestinations);

// Get user's tags for filter dropdown
router.get('/filters/tags', historyController.getUserTags);

module.exports = router;
