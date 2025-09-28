-- Seed data for development and testing
-- This file is run after migrations during `supabase db reset`

-- Insert some test email captures for development
INSERT INTO email_captures (email, uploaded_filename, job_positions, upload_timestamp) VALUES
    ('test@example.com', 'john_doe_resume.pdf', ARRAY['Software Engineer', 'Frontend Developer'], NOW() - INTERVAL '2 days'),
    ('demo@resumefy.com', 'jane_smith_resume.pdf', ARRAY['Product Manager', 'Marketing Manager'], NOW() - INTERVAL '1 day');

-- Insert corresponding magic links (expired for testing)
INSERT INTO magic_links (token, email, email_capture_id, expires_at, clicked) VALUES
    ('test_token_123', 'test@example.com', (SELECT id FROM email_captures WHERE email = 'test@example.com' LIMIT 1), NOW() - INTERVAL '1 hour', true),
    ('demo_token_456', 'demo@resumefy.com', (SELECT id FROM email_captures WHERE email = 'demo@resumefy.com' LIMIT 1), NOW() + INTERVAL '10 minutes', false);