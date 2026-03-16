-- =====================================================
-- INTERROGATOR FEATURE: Add conversation tracking to jobs
-- Created: 2026-03-03
-- Purpose: Enable chat-based resume tailoring with gap analysis
-- =====================================================

-- Add conversation tracking columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS conversation_status TEXT
  DEFAULT 'pending'
  CHECK (conversation_status IN (
    'pending',      -- Job added, not analyzed yet
    'analyzing',    -- Running gap analysis
    'questioning',  -- Waiting for user answers
    'processing',   -- Building final resume
    'ready',        -- PDF ready
    'error'         -- Failed
  ));

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]';
-- Structure: [
--   {role: 'ai', content: '...', timestamp: '2026-03-03T10:00:00Z'},
--   {role: 'user', content: '...', timestamp: '2026-03-03T10:01:00Z'}
-- ]

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS gaps_identified JSONB DEFAULT '[]';
-- Structure: [
--   {
--     gap: 'Budget management ($100k+)',
--     importance: 'critical',
--     reason: 'Job requires large budget oversight',
--     question: 'Did you handle budgets at Previous Company?',
--     answered: false
--   }
-- ]

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS match_score_initial INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS match_score_final INTEGER;

-- Index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_jobs_conversation_status ON jobs(conversation_status);

-- Comments for clarity
COMMENT ON COLUMN jobs.conversation_status IS 'Current state of interrogation chat flow';
COMMENT ON COLUMN jobs.conversation_history IS 'Full chat history between AI and user';
COMMENT ON COLUMN jobs.gaps_identified IS 'Array of gaps found between resume and job description';
COMMENT ON COLUMN jobs.current_question_index IS 'Tracks which question user is on (0-4 for 5 questions)';
COMMENT ON COLUMN jobs.match_score_initial IS 'Initial match score before interrogation (0-100)';
COMMENT ON COLUMN jobs.match_score_final IS 'Final match score after conversation (0-100)';
