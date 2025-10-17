-- Create app_recommendations_history table
CREATE TABLE IF NOT EXISTS planora.app_recommendations_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    request_data JSONB NOT NULL,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    title VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    
    CONSTRAINT app_recommendations_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES planora.users(id) ON DELETE CASCADE,
    CONSTRAINT app_recommendations_history_pkey 
        PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_recommendations_history_user_id ON planora.app_recommendations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_app_recommendations_history_destination ON planora.app_recommendations_history(destination);
CREATE INDEX IF NOT EXISTS idx_app_recommendations_history_created_at ON planora.app_recommendations_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_recommendations_history_tags ON planora.app_recommendations_history USING GIN(tags);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_recommendations_history_updated_at 
    BEFORE UPDATE ON planora.app_recommendations_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

