const historyModel = require('../models/historyModel');
const { validationResult } = require('express-validator');

class HistoryController {
  // Save app recommendation to history
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

      const result = await historyModel.saveAppRecommendation({
        userId,
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
      console.error('Error saving app recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while saving app recommendation'
      });
    }
  }

  // Get user's app recommendation history
  async getAppHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, search, destination, tags } = req.query;

      const result = await historyModel.getUserAppHistory({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        destination,
        tags: tags ? tags.split(',') : null
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching app history:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching app history'
      });
    }
  }

  // Get specific app recommendation
  async getAppRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.getAppRecommendationById({ userId, id });

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
      console.error('Error fetching app recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching app recommendation'
      });
    }
  }

  // Update app recommendation
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

      const result = await historyModel.updateAppRecommendation({
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
      console.error('Error updating app recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating app recommendation'
      });
    }
  }

  // Delete app recommendation
  async deleteAppRecommendation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await historyModel.deleteAppRecommendation({ userId, id });

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
      console.error('Error deleting app recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting app recommendation'
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
      console.error('Error fetching user destinations:', error);
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
      console.error('Error fetching user tags:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching tags'
      });
    }
  }
}

module.exports = new HistoryController();
