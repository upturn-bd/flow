-- Add max_device_limit to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_device_limit INTEGER DEFAULT 3;

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_info TEXT,
    status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own devices
CREATE POLICY "Users can view their own devices" ON user_devices
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own devices (needed for initial registration request)
CREATE POLICY "Users can insert their own devices" ON user_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins/managers can update status (This needs to be enforced via application logic or specific roles)
-- For now, we'll allow users to update 'last_login' but not 'status'.
-- Actually, it's better to use a function for updating last_login to avoid giving update permissions on status.

-- Grant permissions
GRANT ALL ON user_devices TO authenticated;
GRANT ALL ON user_devices TO service_role;
