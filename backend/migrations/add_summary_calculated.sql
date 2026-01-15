-- Migration: Add summary_calculated column to recommendations table
-- This tracks whether the recommendation was pre-computed during batch processing
-- vs. generated on-demand with AI

ALTER TABLE recommendations ADD COLUMN summary_calculated INTEGER DEFAULT 1;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reco_summary_calculated ON recommendations(summary_calculated);

-- Update existing recommendations to be marked as pre-computed
UPDATE recommendations SET summary_calculated = 1 WHERE summary_calculated IS NULL;






