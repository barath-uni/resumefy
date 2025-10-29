-- =====================================================
-- RESUMEFY V2 DATABASE SCHEMA
-- Created: 2025-10-02
-- Purpose: Add tables for resume storage, job tailoring, and credits
-- =====================================================

-- =====================================================
-- TABLE: resumes
-- Stores uploaded resume files and parsed data
-- =====================================================
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,                    -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size INTEGER,                         -- Size in bytes
    parsed_json JSONB,                         -- Structured resume data
    parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);

-- =====================================================
-- TABLE: jobs
-- Stores tailored resumes for specific job postings
-- =====================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    job_url TEXT,                              -- Optional job posting URL
    tailored_json JSONB,                       -- AI-optimized resume data
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    missing_skills TEXT[],                     -- Array of skills user lacks
    recommendations TEXT[],                    -- AI suggestions for improvement
    template_used TEXT DEFAULT 'A' CHECK (template_used IN ('A', 'B', 'C')),
    download_count INTEGER DEFAULT 0,          -- Track PDF downloads
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_resume_id ON jobs(resume_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- TABLE: user_credits
-- Tracks user credit balance for free tier (20 optimizations)
-- =====================================================
CREATE TABLE user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INTEGER DEFAULT 20 CHECK (credits_remaining >= 0),
    credits_used INTEGER DEFAULT 0,
    total_credits_purchased INTEGER DEFAULT 0,
    last_reset TIMESTAMP,                      -- For future subscription reset logic
    is_pro BOOLEAN DEFAULT FALSE,              -- Pro subscription status
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Resumes Table RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- Jobs Table RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
    ON jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = user_id);

-- User Credits Table RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to credits"
    ON user_credits FOR ALL
    USING (auth.role() = 'service_role');

-- Allow users to insert their initial credit record
CREATE POLICY "Users can create own credits"
    ON user_credits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp on resumes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, credits_remaining, credits_used)
    VALUES (NEW.id, 20, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create credits when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_credits();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits_remaining INTO v_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    -- Check if user has credits
    IF v_credits IS NULL OR v_credits <= 0 THEN
        RETURN FALSE;
    END IF;

    -- Deduct 1 credit
    UPDATE user_credits
    SET credits_remaining = credits_remaining - 1,
        credits_used = credits_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE resumes IS 'Stores uploaded resume files and parsed structured data';
COMMENT ON TABLE jobs IS 'Stores tailored resumes for specific job postings with AI optimization';
COMMENT ON TABLE user_credits IS 'Tracks user credit balance for free tier limit (20 optimizations)';

COMMENT ON COLUMN resumes.parsed_json IS 'Structured resume data: { header, summary, experience, education, skills }';
COMMENT ON COLUMN jobs.tailored_json IS 'AI-optimized resume data tailored to job description';
COMMENT ON COLUMN jobs.fit_score IS 'Calculated fit score between resume and job (0-100)';
COMMENT ON COLUMN jobs.missing_skills IS 'Array of skills required for job that user lacks';
