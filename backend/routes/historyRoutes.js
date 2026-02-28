const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateSaveRecommendation,
  validateUpdateRecommendation,
  validateGetRecommendation,
  validateDeleteRecommendation,
  validateHistoryQuery,
  validateSaveAppRecommendation,
  validateUpdateAppRecommendation,
  validateGetAppRecommendation,
  validateDeleteAppRecommendation
} = require('../middleware/historyValidation');

// Public routes for sharing (no authentication required)
router.get('/share/:id', historyController.getPublicRecommendation);
router.get('/share/unified-trips/:tripId', historyController.getPublicUnifiedTrip);

// All other routes require authentication
router.use(authMiddleware);

// Unified recommendation routes
// Save recommendation to history
router.post('/save', validateSaveRecommendation, historyController.saveRecommendation);

// Get user's recommendation history with filters and pagination
router.get('/history', validateHistoryQuery, historyController.getHistory);

// Unified trip routes (must be before /:id route to avoid conflicts)
// Get unified trips
router.get('/unified-trips', historyController.getUnifiedTrips);

// Get unified trip with all recommendations
router.get('/unified-trips/:tripId', historyController.getUnifiedTrip);

// Delete unified trip
router.delete('/unified-trips/:tripId', historyController.deleteUnifiedTrip);

// Get token usage statistics
router.get('/token-usage', historyController.getTokenUsageStats);

// Get specific recommendation by ID
router.get('/:id', validateGetRecommendation, historyController.getRecommendation);

// Update recommendation (title, tags, notes)
router.put('/:id', validateUpdateRecommendation, historyController.updateRecommendation);

// Delete recommendation
router.delete('/:id', validateDeleteRecommendation, historyController.deleteRecommendation);

// Filter endpoints
// Get user's destinations for filter dropdown
router.get('/filters/destinations', historyController.getUserDestinations);

// Get user's tags for filter dropdown
router.get('/filters/tags', historyController.getUserTags);

// Get recommendation types for filter dropdown
router.get('/filters/types', historyController.getRecommendationTypes);

// Get recommendations by trip context
router.get('/trip/:tripId', historyController.getRecommendationsByTrip);

// Legacy app-specific routes for backward compatibility
// Save app recommendation to history
router.post('/save-app', validateSaveAppRecommendation, historyController.saveAppRecommendation);

// Get user's app recommendation history with filters and pagination
router.get('/app-history', validateHistoryQuery, historyController.getAppHistory);

// Get specific app recommendation by ID
router.get('/app/:id', validateGetAppRecommendation, historyController.getAppRecommendation);

// Update app recommendation (title, tags, notes)
router.put('/app/:id', validateUpdateAppRecommendation, historyController.updateAppRecommendation);

// Delete app recommendation
router.delete('/app/:id', validateDeleteAppRecommendation, historyController.deleteAppRecommendation);

module.exports = router;