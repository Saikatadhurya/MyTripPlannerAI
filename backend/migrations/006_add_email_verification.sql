-- Add email verification columns to users table
ALTER TABLE planora.users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create email_otps table for OTP management
CREATE TABLE IF NOT EXISTS planora.email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('signup', 'password_reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT email_otps_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES planora.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON planora.email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON planora.email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_otp_code ON planora.email_otps(otp_code);
CREATE INDEX IF NOT EXISTS idx_email_otps_type ON planora.email_otps(otp_type);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON planora.email_otps(expires_at);

-- Mark existing users as verified (they signed up before this feature)
UPDATE planora.users 
SET is_verified = true, email_verified_at = created_at 
WHERE is_verified IS NULL OR is_verified = false;

