-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email captures table
CREATE TABLE email_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    uploaded_filename VARCHAR(255),
    job_positions TEXT[], -- Array of job position texts
    upload_timestamp TIMESTAMP DEFAULT NOW(),
    magic_link_clicked BOOLEAN DEFAULT false,
    magic_link_clicked_at TIMESTAMP
);

-- Magic links table
CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_capture_id UUID REFERENCES email_captures(id),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    clicked BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX idx_email_captures_email ON email_captures(email);
CREATE INDEX idx_email_captures_upload_timestamp ON email_captures(upload_timestamp);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Allow inserts for authenticated users (we'll use service role for backend operations)
CREATE POLICY "Allow service role full access" ON email_captures
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON magic_links
    FOR ALL USING (auth.role() = 'service_role');