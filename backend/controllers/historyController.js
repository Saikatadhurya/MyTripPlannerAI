const historyModel = require('../models/historyModel');
const { validationResult } = require('express-validator');

class HistoryController {
  // Save recommendation to history
  async saveRecommendation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { recommendationType, destination, language, requestData, responseData, title, tags, notes, tripContext, tripId, tripName, prompt } = req.body;
      const userId = req.user.id;

      const result = await historyModel.saveRecommendation({
        userId,
        recommendationType,
        destination,
        language: language || 'en',
        requestData,
        responseData,
        title,
        tags,
        notes,
        tripContext,
        tripId,
        tripName,
        prompt
      });

      res.status(201).json({
        success: true,
        message: 'Recommendation saved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save recommendation',
        error: error.message
      });
    }
  }

  // Get user's recommendation history
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, search, destination, tags, recommendationType } = req.query;

      const result = await historyModel.getUserHistory({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        destination,
        tags: tags ? tags.split(',') : null,
        recommendationType
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching history'
      });
    }
  }

  // Get specific recommendation (public version for sharing)
  async getPublicRecommendation(req, res) {
    try {
      const { id } = req.params;

      const result = await historyModel.getRecommendationById({ userId: null, id });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get unified trip (public version for sharing)
  async getPublicUnifiedTrip(req, res) {
    try {
      const { tripId } = req.params;

      const result = await historyModel.getUnifiedTripById({ userId: null, tripId });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Unified trip not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching unified trip',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get specific recommendation
  async getRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.getRecommendationById({ userId, id });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching recommendation'
      });
    }
  }

  // Update recommendation
  async updateRecommendation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, tags, notes } = req.body;
      const userId = req.user.id;

      const result = await historyModel.updateRecommendation({
        userId,
        id,
        title,
        tags,
        notes
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }

      res.json({
        success: true,
        message: 'Recommendation updated successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while updating recommendation'
      });
    }
  }

  // Delete recommendation
  async deleteRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.deleteRecommendation({ userId, id });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }

      res.json({
        success: true,
        message: 'Recommendation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while deleting recommendation'
      });
    }
  }

  // Get user's destinations for filters
  async getUserDestinations(req, res) {
    try {
      const userId = req.user.id;
      const destinations = await historyModel.getUserDestinations(userId);

      res.json({
        success: true,
        data: destinations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching destinations'
      });
    }
  }

  // Get user's tags for filters
  async getUserTags(req, res) {
    try {
      const userId = req.user.id;
      const tags = await historyModel.getUserTags(userId);

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching tags'
      });
    }
  }

  // Get recommendation types for filters
  async getRecommendationTypes(req, res) {
    try {
      const userId = req.user.id;
      const types = await historyModel.getRecommendationTypes(userId);

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching recommendation types'
      });
    }
  }

  // Get recommendations by trip context
  async getRecommendationsByTrip(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

      const result = await historyModel.getRecommendationsByTripContext({ userId, tripId });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching trip recommendations'
      });
    }
  }

  // Legacy method for backward compatibility - Save app recommendation
  async saveAppRecommendation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { destination, language, requestData, responseData, title, tags, notes } = req.body;
      const userId = req.user.id;

      const result = await historyModel.saveRecommendation({
        userId,
        recommendationType: 'apps',
        destination,
        language: language || 'en',
        requestData,
        responseData,
        title,
        tags,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'App recommendation saved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while saving app recommendation'
      });
    }
  }

  // Legacy method for backward compatibility - Get app history
  async getAppHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, search, destination, tags } = req.query;

      const result = await historyModel.getUserHistory({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        destination,
        tags: tags ? tags.split(',') : null,
        recommendationType: 'apps'
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching app history'
      });
    }
  }

  // Legacy method for backward compatibility - Get app recommendation
  async getAppRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.getRecommendationById({ userId, id });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'App recommendation not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching app recommendation'
      });
    }
  }

  // Legacy method for backward compatibility - Update app recommendation
  async updateAppRecommendation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, tags, notes } = req.body;
      const userId = req.user.id;

      const result = await historyModel.updateRecommendation({
        userId,
        id,
        title,
        tags,
        notes
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'App recommendation not found'
        });
      }

      res.json({
        success: true,
        message: 'App recommendation updated successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while updating app recommendation'
      });
    }
  }

  // Legacy method for backward compatibility - Delete app recommendation
  async deleteAppRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.deleteRecommendation({ userId, id });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'App recommendation not found'
        });
      }

      res.json({
        success: true,
        message: 'App recommendation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while deleting app recommendation'
      });
    }
  }

  // Get unified trips
  async getUnifiedTrips(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await historyModel.getUnifiedTrips({
        userId,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching unified trips'
      });
    }
  }

  // Get unified trip with all recommendations
  async getUnifiedTrip(req, res) {
    try {
      const userId = req.user.id;
      const { tripId } = req.params;

      const result = await historyModel.getUnifiedTripWithRecommendations({
        userId,
        tripId
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Unified trip not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching unified trip'
      });
    }
  }

  // Delete unified trip
  async deleteUnifiedTrip(req, res) {
    try {
      const userId = req.user.id;
      const { tripId } = req.params;

      const deletedCount = await historyModel.deleteUnifiedTrip({
        userId,
        tripId
      });

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Unified trip not found'
        });
      }

      res.json({
        success: true,
        message: `Unified trip deleted successfully (${deletedCount} recommendations removed)`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while deleting unified trip'
      });
    }
  }

  // Get token usage statistics
  async getTokenUsageStats(req, res) {
    try {
      const userId = req.user.id;
      const result = await historyModel.getTokenUsageStats({ userId });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while fetching token usage statistics'
      });
    }
  }
}

module.exports = new HistoryController();