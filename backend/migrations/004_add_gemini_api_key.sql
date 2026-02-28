-- Add gemini_api_key column to users table
ALTER TABLE planora.users 
ADD COLUMN gemini_api_key TEXT;

-- Add index for better performance
CREATE INDEX idx_users_gemini_api_key ON planora.users(gemini_api_key) WHERE gemini_api_key IS NOT NULL;
