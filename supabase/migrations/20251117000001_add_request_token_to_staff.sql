-- Add request_token column to staff table for shift request system
-- This token will be used to allow staff to submit shift requests without login

ALTER TABLE staff ADD COLUMN IF NOT EXISTS request_token TEXT UNIQUE;

-- Generate tokens for existing staff (UUID format)
UPDATE staff
SET request_token = gen_random_uuid()::text
WHERE request_token IS NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_staff_request_token ON staff(request_token);

-- Add comment for documentation
COMMENT ON COLUMN staff.request_token IS 'Unique token for staff to access shift request submission page without login';
