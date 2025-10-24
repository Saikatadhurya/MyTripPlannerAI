const { pool } = require('../config/db');

class HistoryModel {
  // Save a new recommendation to history
  async saveRecommendation({ userId, recommendationType, destination, language, requestData, responseData, title, tags, notes, tripContext, tripId, tripName }) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO planora.recommendations_history 
        (user_id, recommendation_type, destination, language, request_data, response_data, title, tags, notes, trip_context, trip_id, trip_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, created_at
      `;
      
      const values = [
        userId,
        recommendationType,
        destination,
        language,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        title || null,
        tags || null,
        notes || null,
        tripContext ? JSON.stringify(tripContext) : null,
        tripId || null,
        tripName || null
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user's recommendation history with pagination
  async getUserHistory({ userId, page = 1, limit = 10, search, destination, tags, recommendationType }) {
    const client = await pool.connect();
    try {
      let whereConditions = ['user_id = $1'];
      let queryParams = [userId];
      let paramCount = 1;

      // Add search condition
      if (search) {
        paramCount++;
        whereConditions.push(`(
          title ILIKE $${paramCount} OR 
          destination ILIKE $${paramCount} OR 
          notes ILIKE $${paramCount}
        )`);
        queryParams.push(`%${search}%`);
      }

      // Add destination filter
      if (destination) {
        paramCount++;
        whereConditions.push(`destination ILIKE $${paramCount}`);
        queryParams.push(`%${destination}%`);
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        paramCount++;
        whereConditions.push(`tags && $${paramCount}`);
        queryParams.push(tags);
      }

      // Add recommendation type filter
      if (recommendationType) {
        paramCount++;
        whereConditions.push(`recommendation_type = $${paramCount}`);
        queryParams.push(recommendationType);
      }

      // Exclude unified trip recommendations (those with trip_id)
      whereConditions.push('trip_id IS NULL');

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM planora.recommendations_history
        WHERE ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT 
          id,
          recommendation_type as "recommendationType",
          destination,
          language,
          request_data as "requestData",
          response_data as "responseData",
          title,
          tags,
          notes,
          trip_context as "tripContext",
          created_at as "created_at",
          updated_at as "updated_at",
          -- Extract summary info from JSON based on recommendation type
          CASE 
            WHEN recommendation_type = 'apps' THEN
              jsonb_array_length(response_data->'transportAndTravel') +
              jsonb_array_length(response_data->'foodAndDining') +
              jsonb_array_length(response_data->'stayAndLiving') +
              jsonb_array_length(response_data->'entertainmentAndLeisure') +
              jsonb_array_length(response_data->'shoppingAndEssentials') +
              jsonb_array_length(response_data->'explorationAndTours') +
              jsonb_array_length(response_data->'utilitiesAndSafety') +
              jsonb_array_length(response_data->'festivalsAndSeasonal')
            WHEN recommendation_type = 'food' THEN
              jsonb_array_length(response_data->'breakfast') +
              jsonb_array_length(response_data->'lunch') +
              jsonb_array_length(response_data->'snacksAndStreetFood') +
              jsonb_array_length(response_data->'dinner') +
              jsonb_array_length(response_data->'dessertAndSweets') +
              jsonb_array_length(response_data->'drinksAndBeverages') +
              jsonb_array_length(response_data->'iconicDishes') +
              jsonb_array_length(response_data->'hiddenRecipes') +
              jsonb_array_length(response_data->'trendingOrViralFoods') +
              jsonb_array_length(response_data->'chefsSpecials') +
              jsonb_array_length(response_data->'seasonalSpecials') +
              jsonb_array_length(response_data->'festivalAndStreetFoods')
            WHEN recommendation_type = 'music' THEN
              jsonb_array_length(response_data->'musicCategories')
            WHEN recommendation_type = 'lingo' THEN
              jsonb_array_length(response_data->'categories')
            WHEN recommendation_type = 'packing' THEN
              jsonb_array_length(response_data->'clothingAndFootwear') +
              jsonb_array_length(response_data->'toiletriesAndPersonalCare') +
              jsonb_array_length(response_data->'medicinesAndHealth') +
              jsonb_array_length(response_data->'electronicsAndGear') +
              jsonb_array_length(response_data->'documentsAndMoney') +
              jsonb_array_length(response_data->'optionalComfortItems') +
              jsonb_array_length(response_data->'adventureClothing') +
              jsonb_array_length(response_data->'locallyAvailableItems')
            WHEN recommendation_type = 'itinerary' THEN
              jsonb_array_length(response_data->'plan')
            ELSE 0
          END as total_items_count
        FROM planora.recommendations_history
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await client.query(dataQuery, queryParams);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } finally {
      client.release();
    }
  }

  // Get specific recommendation by ID
  async getRecommendationById({ userId, id }) {
    const client = await pool.connect();
    try {
      let query, params;
      
      if (userId) {
        // Authenticated request - check user ownership
        query = `
          SELECT 
            id,
            recommendation_type as "recommendationType",
            destination,
            language,
            request_data as "requestData",
            response_data as "responseData",
            title,
            tags,
            notes,
            trip_context as "tripContext",
            created_at as "created_at",
            updated_at as "updated_at"
          FROM planora.recommendations_history
          WHERE id = $1 AND user_id = $2
        `;
        params = [id, userId];
      } else {
        // Public request - no user check
        query = `
          SELECT 
            id,
            recommendation_type as "recommendationType",
            destination,
            language,
            request_data as "requestData",
            response_data as "responseData",
            title,
            tags,
            notes,
            trip_context as "tripContext",
            trip_id as "tripId",
            trip_name as "tripName",
            created_at as "created_at",
            updated_at as "updated_at"
          FROM planora.recommendations_history
          WHERE id = $1
        `;
        params = [id];
      }
      
      const result = await client.query(query, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Get unified trip by ID (can be either trip_id or regular id)
  async getUnifiedTripById({ userId, tripId }) {
    const client = await pool.connect();
    try {
      let query, params;
      
      if (userId) {
        // Authenticated request - check user ownership
        // First try to find by trip_id, if not found, try to find by id and get its trip_id
        query = `
          WITH trip_lookup AS (
            SELECT DISTINCT trip_id
            FROM planora.recommendations_history
            WHERE (trip_id = $1 OR id = $1) AND user_id = $2
            LIMIT 1
          )
          SELECT 
            id,
            trip_id as "tripId",
            trip_name as "tripName",
            destination,
            language,
            recommendation_type as "recommendationType",
            request_data as "requestData",
            response_data as "responseData",
            title,
            tags,
            notes,
            trip_context as "tripContext",
            created_at as "created_at",
            updated_at as "updated_at"
          FROM planora.recommendations_history
          WHERE trip_id = (SELECT trip_id FROM trip_lookup) AND user_id = $2
          ORDER BY created_at ASC
        `;
        params = [tripId, userId];
      } else {
        // Public request - no user check
        // First try to find by trip_id, if not found, try to find by id and get its trip_id
        query = `
          WITH trip_lookup AS (
            SELECT DISTINCT trip_id
            FROM planora.recommendations_history
            WHERE trip_id = $1 OR id = $1
            LIMIT 1
          )
          SELECT 
            id,
            trip_id as "tripId",
            trip_name as "tripName",
            destination,
            language,
            recommendation_type as "recommendationType",
            request_data as "requestData",
            response_data as "responseData",
            title,
            tags,
            notes,
            trip_context as "tripContext",
            created_at as "created_at",
            updated_at as "updated_at"
          FROM planora.recommendations_history
          WHERE trip_id = (SELECT trip_id FROM trip_lookup)
          ORDER BY created_at ASC
        `;
        params = [tripId];
      }
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Group recommendations by type and create unified trip structure
      const recommendations = result.rows;
      const firstRec = recommendations[0];
      
      const unifiedTrip = {
        tripId: firstRec.tripId,
        tripName: firstRec.tripName,
        destination: firstRec.destination,
        language: firstRec.language,
        created_at: firstRec.created_at,
        
        // Group recommendations by type
        recommendations: recommendations,
        itinerary: recommendations.find(r => r.recommendationType === 'itinerary')?.responseData || null,
        packingList: recommendations.find(r => r.recommendationType === 'packing')?.responseData || null,
        foodRecommendations: recommendations.find(r => r.recommendationType === 'food')?.responseData || null,
        appRecommendations: recommendations.find(r => r.recommendationType === 'apps')?.responseData || null,
        musicRecommendations: recommendations.find(r => r.recommendationType === 'music')?.responseData || null,
        lingoRecommendations: recommendations.find(r => r.recommendationType === 'lingo')?.responseData || null,
        
        // Metadata
        recommendation_types: [...new Set(recommendations.map(r => r.recommendationType))],
        recommendation_count: recommendations.length,
        
        // Use the first recommendation's request data as questionnaire data
        questionnaireData: firstRec.requestData
      };
      
      return unifiedTrip;
    } finally {
      client.release();
    }
  }

  // Update recommendation (title, tags, notes)
  async updateRecommendation({ userId, id, title, tags, notes }) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE planora.recommendations_history
        SET title = $3, tags = $4, notes = $5, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, title, tags, notes, updated_at
      `;
      
      const result = await client.query(query, [id, userId, title, tags, notes]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Delete recommendation
  async deleteRecommendation({ userId, id }) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM planora.recommendations_history
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await client.query(query, [id, userId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Get user's destinations for filter dropdown
  async getUserDestinations(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT destination
        FROM planora.recommendations_history
        WHERE user_id = $1
        ORDER BY destination
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => row.destination);
    } finally {
      client.release();
    }
  }

  // Get user's tags for filter dropdown
  async getUserTags(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT unnest(tags) as tag
        FROM planora.recommendations_history
        WHERE user_id = $1 AND tags IS NOT NULL
        ORDER BY tag
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => row.tag);
    } finally {
      client.release();
    }
  }

  // Get recommendations by trip context (for grouping related recommendations)
  async getRecommendationsByTripContext({ userId, tripId }) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id,
          recommendation_type as "recommendationType",
          destination,
          language,
          title,
          tags,
          notes,
          created_at as "created_at"
        FROM planora.recommendations_history
        WHERE user_id = $1 AND trip_context->>'tripId' = $2
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId, tripId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get recommendation types for filter dropdown
  async getRecommendationTypes(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT recommendation_type
        FROM planora.recommendations_history
        WHERE user_id = $1
        ORDER BY recommendation_type
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => row.recommendation_type);
    } finally {
      client.release();
    }
  }

  // Get unified trips (trips with trip_id)
  async getUnifiedTrips({ userId, page = 1, limit = 10 }) {
    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          trip_id as "tripId",
          trip_name as "tripName",
          destination,
          language,
          MIN(created_at) as "created_at",
          COUNT(*) as recommendation_count,
          ARRAY_AGG(recommendation_type) as recommendation_types
        FROM planora.recommendations_history
        WHERE user_id = $1 AND trip_id IS NOT NULL
        GROUP BY trip_id, trip_name, destination, language
        ORDER BY MIN(created_at) DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await client.query(query, [userId, limit, offset]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get unified trip with all its recommendations
  async getUnifiedTripWithRecommendations({ userId, tripId }) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id,
          recommendation_type as "recommendationType",
          destination,
          language,
          request_data as "requestData",
          response_data as "responseData",
          title,
          tags,
          notes,
          trip_context as "tripContext",
          trip_id as "tripId",
          trip_name as "tripName",
          created_at as "created_at"
        FROM planora.recommendations_history
        WHERE trip_id = $1 AND user_id = $2
        ORDER BY created_at ASC
      `;
      
      const result = await client.query(query, [tripId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Group by trip and return structured data in UnifiedPlan format
      const trip = {
        tripId: result.rows[0].tripId,
        tripName: result.rows[0].tripName,
        destination: result.rows[0].destination,
        language: result.rows[0].language,
        created_at: result.rows[0].created_at,
        questionnaireData: result.rows[0].requestData, // Use the first recommendation's request data as questionnaire data
        // Structure the recommendations into UnifiedPlan format
        itinerary: null,
        packingList: null,
        foodRecommendations: null,
        appRecommendations: null,
        musicRecommendations: null,
        lingoRecommendations: null
      };

      // Map each recommendation to its appropriate field
      result.rows.forEach(row => {
        switch (row.recommendationType) {
          case 'itinerary':
            trip.itinerary = row.responseData;
            break;
          case 'packing':
            trip.packingList = row.responseData;
            break;
          case 'food':
            trip.foodRecommendations = row.responseData;
            break;
          case 'apps':
            trip.appRecommendations = row.responseData;
            break;
          case 'music':
            trip.musicRecommendations = row.responseData;
            break;
          case 'lingo':
            trip.lingoRecommendations = row.responseData;
            break;
        }
      });
      
      return trip;
    } finally {
      client.release();
    }
  }

  // Delete unified trip (deletes all recommendations with the same trip_id)
  async deleteUnifiedTrip({ userId, tripId }) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM planora.recommendations_history
        WHERE trip_id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await client.query(query, [tripId, userId]);
      return result.rows.length;
    } finally {
      client.release();
    }
  }
}

module.exports = new HistoryModel();