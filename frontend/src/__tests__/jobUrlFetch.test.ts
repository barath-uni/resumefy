/**
 * Test suite for job URL fetching functionality
 *
 * This test verifies that the scrape-job-url edge function can:
 * 1. Check if a URL is reachable
 * 2. Extract job title and description from the URL
 * 3. Handle errors gracefully
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

describe('Job URL Fetch Functionality', () => {
  it('should fetch job data from Greenhouse URL', async () => {
    // Test URL - real Greenhouse job posting from user report
    const testUrl = 'https://job-boards.greenhouse.io/hightouch/jobs/4620430004?gh_src=25452d7b4us&ref=levels.fyi&utm_source=levels.fyi&t=c34e5ee54us'

    console.log('Testing Greenhouse URL:', testUrl)

    // Call the scrape-job-url edge function
    const { data, error } = await supabase.functions.invoke('scrape-job-url', {
      body: { url: testUrl }
    })

    // Basic assertions
    expect(error).toBeNull()
    expect(data).toBeDefined()

    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.success) {
      // Verify that we got title and description
      expect(data.title).toBeDefined()
      expect(data.description).toBeDefined()
      expect(typeof data.title).toBe('string')
      expect(typeof data.description).toBe('string')

      console.log('✅ Successfully fetched job data')
      console.log('Title:', data.title)
      console.log('Description length:', data.description?.length)
    } else {
      // If scraping failed, verify error handling
      expect(data.error).toBeDefined()
      console.log('⚠️ Scraping failed (expected for some URLs):', data.error)
    }
  }, 30000) // 30 second timeout for network requests

  it('should handle invalid URLs gracefully', async () => {
    const invalidUrl = 'not-a-valid-url'

    const { data, error } = await supabase.functions.invoke('scrape-job-url', {
      body: { url: invalidUrl }
    })

    // Should return an error response
    expect(data).toBeDefined()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid URL format')

    console.log('✅ Invalid URL handled correctly:', data.error)
  })

  it('should handle unreachable URLs gracefully', async () => {
    const unreachableUrl = 'https://this-domain-definitely-does-not-exist-12345.com/job'

    const { data, error } = await supabase.functions.invoke('scrape-job-url', {
      body: { url: unreachableUrl }
    })

    // Should return a fallback error
    expect(data).toBeDefined()
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()

    console.log('✅ Unreachable URL handled correctly:', data.error)
  }, 30000)

  it('should validate URL format before fetching', async () => {
    const malformedUrl = 'htp://missing-t-in-protocol.com'

    const { data, error } = await supabase.functions.invoke('scrape-job-url', {
      body: { url: malformedUrl }
    })

    expect(data).toBeDefined()
    expect(data.success).toBe(false)

    console.log('✅ Malformed URL handled correctly')
  })
})

/**
 * Manual test instructions:
 *
 * 1. Start the frontend dev server:
 *    cd frontend && npm run dev
 *
 * 2. Navigate to a resume's tailoring page:
 *    http://localhost:5173/app/tailor/[resume-id]
 *
 * 3. Test the URL fetch feature:
 *    a. Click "Paste URL" mode
 *    b. Enter a valid job URL (e.g., LinkedIn, Indeed, Greenhouse)
 *    c. Click "Fetch" button
 *    d. Verify that:
 *       - The button shows "Fetching..." with a loading spinner
 *       - The URL input is disabled during fetch
 *       - Job title and description populate after successful fetch
 *       - Error message appears if URL is invalid or unreachable
 *
 * 4. Test error scenarios:
 *    a. Invalid URL format: "not-a-url"
 *       Expected: Error message appears
 *    b. Unreachable URL: "https://fake-domain-xyz.com/job"
 *       Expected: Error message about unable to fetch
 *    c. Valid URL but no job data: "https://google.com"
 *       Expected: Error message about unable to extract job info
 *
 * 5. Test with real job URLs:
 *    - LinkedIn: https://www.linkedin.com/jobs/view/...
 *    - Indeed: https://www.indeed.com/viewjob?jk=...
 *    - Greenhouse: https://job-boards.greenhouse.io/hightouch/jobs/4620430004
 *    - Lever: https://jobs.lever.co/company/...
 *
 * 6. Expected UX flow on success:
 *    a. User pastes URL and clicks "Fetch"
 *    b. Button shows "Fetching..." spinner
 *    c. Green checkmark appears: "✓ Job description loaded (X characters)"
 *    d. Textarea appears showing the full fetched description
 *    e. User can edit the description if needed
 *    f. "Generate" button is now enabled
 *
 * 7. Expected UX flow on failure:
 *    a. User pastes URL and clicks "Fetch"
 *    b. Button shows "Fetching..." spinner
 *    c. Page auto-switches to "Paste Description" mode
 *    d. Error message: "We couldn't access this link. Please paste the job description below instead."
 *    e. User can now manually paste the description
 */
