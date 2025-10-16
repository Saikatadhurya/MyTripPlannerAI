-- Create unified recommendations_history table
CREATE TABLE IF NOT EXISTS planora.recommendations_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('itinerary', 'apps', 'food', 'music', 'lingo', 'packing')),
    destination VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Request data (flexible JSONB to handle different request structures)
    request_data JSONB NOT NULL,
    
    -- Response data (flexible JSONB to handle different response structures)
    response_data JSONB NOT NULL,
    
    -- Metadata
    title VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    
    -- Trip context (for itinerary and related recommendations)
    trip_context JSONB, -- Stores shared trip data like dates, budget, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT recommendations_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES planora.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendations_history_user_id ON planora.recommendations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_type ON planora.recommendations_history(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_destination ON planora.recommendations_history(destination);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_created_at ON planora.recommendations_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_tags ON planora.recommendations_history USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_trip_context ON planora.recommendations_history USING GIN(trip_context);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_recommendations_history_updated_at 
    BEFORE UPDATE ON planora.recommendations_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
