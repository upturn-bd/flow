-- Add max_users column to companies table
ALTER TABLE companies ADD COLUMN max_users INTEGER DEFAULT 50;

-- Update existing companies to have a default limit if needed (optional, handled by default)
