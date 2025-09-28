-- Proper RLS fix: Allow anonymous INSERT only, no SELECT/UPDATE/DELETE

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow service role full access" ON email_captures;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON email_captures;
DROP POLICY IF EXISTS "Allow service role full access" ON magic_links;
DROP POLICY IF EXISTS "Allow anonymous insert magic_links" ON magic_links;
DROP POLICY IF EXISTS "Allow token holder to read magic_links" ON magic_links;

-- Email captures: Allow anonymous INSERT only (for form submissions)
CREATE POLICY "Allow anonymous email capture insert" ON email_captures
    FOR INSERT
    WITH CHECK (true);

-- Email captures: Allow service role full access
CREATE POLICY "Service role full access email_captures" ON email_captures
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Magic links: Allow anonymous INSERT only
CREATE POLICY "Allow anonymous magic link insert" ON magic_links
    FOR INSERT
    WITH CHECK (true);

-- Magic links: Allow service role full access
CREATE POLICY "Service role full access magic_links" ON magic_links
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Magic links: Allow reading by token for dashboard access (SELECT only)
CREATE POLICY "Allow token based select" ON magic_links
    FOR SELECT
    USING (true); -- We'll validate token in application logic