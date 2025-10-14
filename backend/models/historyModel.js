const { pool } = require('../config/db');

class HistoryModel {
  // Save a new app recommendation to history
  async saveAppRecommendation({ userId, destination, language, requestData, responseData, title, tags, notes }) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO planora.app_recommendations_history 
        (user_id, destination, language, request_data, response_data, title, tags, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `;
      
      const values = [
        userId,
        destination,
        language,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        title || null,
        tags || null,
        notes || null
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get user's app recommendation history with pagination
  async getUserAppHistory({ userId, page = 1, limit = 10, search, destination, tags }) {
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

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM planora.app_recommendations_history
        WHERE ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT 
          id,
          destination,
          language,
          title,
          tags,
          notes,
          created_at,
          -- Extract summary info from JSON
          jsonb_array_length(response_data->'transportAndTravel') as transport_apps_count,
          jsonb_array_length(response_data->'foodAndDining') as food_apps_count,
          jsonb_array_length(response_data->'stayAndLiving') as stay_apps_count,
          jsonb_array_length(response_data->'entertainmentAndLeisure') as entertainment_apps_count,
          jsonb_array_length(response_data->'shoppingAndEssentials') as shopping_apps_count,
          jsonb_array_length(response_data->'explorationAndTours') as exploration_apps_count,
          jsonb_array_length(response_data->'utilitiesAndSafety') as utilities_apps_count,
          jsonb_array_length(response_data->'festivalsAndSeasonal') as festivals_apps_count
        FROM planora.app_recommendations_history
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

  // Get specific app recommendation by ID
  async getAppRecommendationById({ userId, id }) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id,
          destination,
          language,
          request_data,
          response_data,
          title,
          tags,
          notes,
          created_at
        FROM planora.app_recommendations_history
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await client.query(query, [id, userId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Update app recommendation (title, tags, notes)
  async updateAppRecommendation({ userId, id, title, tags, notes }) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE planora.app_recommendations_history
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

  // Delete app recommendation
  async deleteAppRecommendation({ userId, id }) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM planora.app_recommendations_history
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
        FROM planora.app_recommendations_history
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
        FROM planora.app_recommendations_history
        WHERE user_id = $1 AND tags IS NOT NULL
        ORDER BY tag
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => row.tag);
    } finally {
      client.release();
    }
  }
}

module.exports = new HistoryModel();
