-- Drop old generated_resumes table if exists (from previous migration)
DROP TABLE IF EXISTS generated_resumes CASCADE;

-- Layer 1 Cache: Tailored content blocks (resume + job)
-- This caches the expensive AI call that generates tailored content
CREATE TABLE IF NOT EXISTS tailored_content_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Cached AI response
    tailored_blocks JSONB NOT NULL, -- The ContentBlock[] array from AI
    layout_decision JSONB NOT NULL, -- The LayoutDecision from AI
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    fit_score_breakdown JSONB,
    missing_skills JSONB, -- Missing skills analysis
    recommendations JSONB, -- Recommendations for improvement

    created_at TIMESTAMP DEFAULT NOW(),

    -- One content cache per resume+job combination
    UNIQUE(resume_id, job_id)
);

-- Layer 2 Cache: Rendered PDFs (resume + job + template)
-- This caches the final PDF output for each template type
CREATE TABLE IF NOT EXISTS generated_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tailored_content_id UUID NOT NULL REFERENCES tailored_content_cache(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL CHECK (template_id IN ('A', 'B', 'C')),

    -- Cached PDF output
    pdf_url TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    -- One PDF per content+template combination
    UNIQUE(tailored_content_id, template_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_tailored_content_resume_job ON tailored_content_cache(resume_id, job_id);
CREATE INDEX idx_generated_resumes_content_template ON generated_resumes(tailored_content_id, template_id);

-- RLS Policies
ALTER TABLE tailored_content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_resumes ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cached content
CREATE POLICY "Users can view their own tailored content"
    ON tailored_content_cache FOR SELECT
    USING (
        resume_id IN (
            SELECT id FROM resumes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own tailored content"
    ON tailored_content_cache FOR INSERT
    WITH CHECK (
        resume_id IN (
            SELECT id FROM resumes WHERE user_id = auth.uid()
        )
    );

-- Users can only access their own generated PDFs
CREATE POLICY "Users can view their own generated resumes"
    ON generated_resumes FOR SELECT
    USING (
        tailored_content_id IN (
            SELECT id FROM tailored_content_cache
            WHERE resume_id IN (
                SELECT id FROM resumes WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their own generated resumes"
    ON generated_resumes FOR INSERT
    WITH CHECK (
        tailored_content_id IN (
            SELECT id FROM tailored_content_cache
            WHERE resume_id IN (
                SELECT id FROM resumes WHERE user_id = auth.uid()
            )
        )
    );
