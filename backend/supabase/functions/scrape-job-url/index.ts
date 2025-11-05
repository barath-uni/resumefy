import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * SCRAPE JOB URL
 *
 * Simple job URL scraper with fallback to manual input.
 * Attempts to extract job title and description from common job sites.
 *
 * Input: { url: string }
 * Output: {
 *   success: boolean,
 *   title?: string,
 *   description?: string,
 *   company?: string,
 *   error?: string
 * }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'URL is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [scrape-job] Scraping URL:', url)

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (_) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid URL format'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the page
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      console.log('✅ [scrape-job] Fetched HTML, length:', html.length)

      // Extract job information based on site
      const hostname = parsedUrl.hostname.toLowerCase()

      let title = ''
      let description = ''
      let company = ''

      // LinkedIn
      if (hostname.includes('linkedin.com')) {
        title = extractText(html, /<h1[^>]*class="[^"]*topcard__title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        company = extractText(html, /<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/i)
        description = extractText(html, /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>(.*?)<\/div>/is) ||
                     extractText(html, /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/is)
      }
      // Indeed
      else if (hostname.includes('indeed.com')) {
        title = extractText(html, /<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        company = extractText(html, /<div[^>]*class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>(.*?)<\/div>/i)
        description = extractText(html, /<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/is)
      }
      // Greenhouse
      else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
        title = extractText(html, /<h1[^>]*class="[^"]*app-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        description = extractText(html, /<div[^>]*id="content"[^>]*>(.*?)<\/div>/is)
      }
      // Lever
      else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
        title = extractText(html, /<h2[^>]*class="[^"]*posting-headline[^"]*"[^>]*>(.*?)<\/h2>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        description = extractText(html, /<div[^>]*class="[^"]*section-wrapper[^"]*"[^>]*>(.*?)<\/div>/is) ||
                     extractText(html, /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is)
      }
      // Generic fallback
      else {
        // Try to find title in first h1
        title = extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        // Try to find description in common patterns
        description = extractText(html, /<div[^>]*class="[^"]*(?:description|job-description|job_description)[^"]*"[^>]*>(.*?)<\/div>/is) ||
                     extractText(html, /<section[^>]*class="[^"]*(?:description|job-description|job_description)[^"]*"[^>]*>(.*?)<\/section>/is)
      }

      // Clean up extracted text
      title = cleanText(title)
      description = cleanText(description)
      company = cleanText(company)

      if (!title && !description) {
        console.log('⚠️ [scrape-job] No data extracted, falling back to manual input')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to extract job information from this URL. Please paste the description manually.',
            fallback: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [scrape-job] Successfully extracted job info')
      return new Response(
        JSON.stringify({
          success: true,
          title,
          description,
          company
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (fetchError) {
      console.error('❌ [scrape-job] Fetch error:', fetchError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to fetch URL. Please check the link or paste the description manually.',
          fallback: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('❌ [scrape-job] Unexpected error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (err as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
function extractText(html: string, regex: RegExp): string {
  const match = html.match(regex)
  return match ? match[1] : ''
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
    .replace(/&nbsp;/g, ' ')    // Replace &nbsp;
    .replace(/&amp;/g, '&')     // Replace &amp;
    .replace(/&lt;/g, '<')      // Replace &lt;
    .replace(/&gt;/g, '>')      // Replace &gt;
    .replace(/&quot;/g, '"')    // Replace &quot;
    .replace(/&#39;/g, "'")     // Replace &#39;
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim()
}
