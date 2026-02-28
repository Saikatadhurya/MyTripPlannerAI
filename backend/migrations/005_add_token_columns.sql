-- Add input_token and output_token columns to recommendations_history table
ALTER TABLE planora.recommendations_history 
ADD COLUMN IF NOT EXISTS input_token INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_token INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN planora.recommendations_history.input_token IS 'Number of tokens in the request data';
COMMENT ON COLUMN planora.recommendations_history.output_token IS 'Number of tokens in the response data';

