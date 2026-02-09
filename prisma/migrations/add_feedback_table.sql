-- Create feedback table for customer reviews
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_reservation_id ON feedback(reservation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Add reminder_sent column to reservations if not exists
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can do everything" ON feedback
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON feedback TO service_role;
GRANT SELECT, INSERT ON feedback TO anon;
GRANT SELECT, INSERT ON feedback TO authenticated;
