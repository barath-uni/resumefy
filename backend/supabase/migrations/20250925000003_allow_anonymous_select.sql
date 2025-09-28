-- Allow anonymous SELECT on email_captures (needed for insert...select() operations)

CREATE POLICY "Allow anonymous email capture select" ON email_captures
    FOR SELECT
    USING (true);

-- Allow anonymous SELECT on magic_links (needed for insert...select() operations)
CREATE POLICY "Allow anonymous magic link select" ON magic_links
    FOR SELECT
    USING (true);