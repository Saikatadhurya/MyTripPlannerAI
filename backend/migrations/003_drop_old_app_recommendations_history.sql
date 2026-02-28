-- Drop the old app_recommendations_history table and related objects
-- This should be run after migrating data to the new unified table

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_app_recommendations_history_updated_at ON planora.app_recommendations_history;

-- Drop the indexes
DROP INDEX IF EXISTS idx_app_recommendations_history_user_id;
DROP INDEX IF EXISTS idx_app_recommendations_history_destination;
DROP INDEX IF EXISTS idx_app_recommendations_history_created_at;
DROP INDEX IF EXISTS idx_app_recommendations_history_tags;

-- Drop the table
DROP TABLE IF EXISTS planora.app_recommendations_history;
