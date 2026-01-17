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

      // Extract title and company based on site
      if (hostname.includes('linkedin.com')) {
        title = extractText(html, /<h1[^>]*class="[^"]*topcard__title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        company = extractText(html, /<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/i)
      } else if (hostname.includes('indeed.com')) {
        title = extractText(html, /<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
        company = extractText(html, /<div[^>]*class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>(.*?)<\/div>/i)
      } else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
        title = extractText(html, /<h1[^>]*class="[^"]*app-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
      } else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
        title = extractText(html, /<h2[^>]*class="[^"]*posting-headline[^"]*"[^>]*>(.*?)<\/h2>/i) ||
                extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
      } else {
        // Generic - try to find title in first h1
        title = extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
      }

      // Clean up extracted text
      title = cleanText(title)
      company = cleanText(company)

      console.log('🔍 [scrape-job] Title:', title ? `found ("${title.substring(0, 50)}...")` : 'not found')

      // STRATEGY: Try smart section extraction FIRST (works for all sites)
      console.log('🔄 [scrape-job] Trying smart section extraction...')
      description = extractJobSections(html)

      // If smart extraction got good content, we're done!
      if (description && description.length >= 200) {
        console.log('✅ [scrape-job] Smart extraction successful! Length:', description.length)
      } else {
        // FALLBACK: Try traditional regex patterns as backup
        console.log('⚠️ [scrape-job] Smart extraction insufficient (length:', description?.length || 0, ')')
        console.log('🔄 [scrape-job] Trying traditional regex patterns...')

        if (hostname.includes('linkedin.com')) {
          description = extractText(html, /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/is)
        } else if (hostname.includes('indeed.com')) {
          description = extractText(html, /<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/is)
        } else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
          description = extractText(html, /<div[^>]*id="content"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*body[^"]*"[^>]*>(.*?)<\/div>/is)
        } else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
          description = extractText(html, /<div[^>]*class="[^"]*section-wrapper[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*posting-description[^"]*"[^>]*>(.*?)<\/div>/is)
        } else {
          // Generic fallback
          description = extractText(html, /<div[^>]*class="[^"]*(?:description|job-description|job_description)[^"]*"[^>]*>(.*?)<\/div>/is) ||
                       extractText(html, /<section[^>]*class="[^"]*(?:description|job-description|job_description)[^"]*"[^>]*>(.*?)<\/section>/is) ||
                       extractText(html, /<main[^>]*>(.*?)<\/main>/is) ||
                       extractText(html, /<article[^>]*>(.*?)<\/article>/is) ||
                       extractText(html, /<div[^>]*class="[^"]*(?:main|primary|body|content)[^"]*"[^>]*>(.*?)<\/div>/is)
        }

        description = cleanText(description)
        console.log('🟢 [scrape-job] Regex extraction result: length', description?.length || 0)
      }

      // CRITICAL: Require meaningful description (min 200 chars for AI to work well)
      // Job description is mandatory for AI tailoring to work
      if (!description || description.trim().length < 200) {
        console.log('⚠️ [scrape-job] Description missing or too short (length:', description?.length || 0, ')')
        console.log('⚠️ [scrape-job] Falling back to manual input')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to extract job information from this URL. Please paste the description manually.',
            fallback: true,
            title: title || '',  // Pass title back so frontend can use it
            company: company || ''
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [scrape-job] Successfully extracted job info')
      console.log('✅ [scrape-job] Title:', title?.substring(0, 50) + '...')
      console.log('✅ [scrape-job] Description length:', description.length, 'chars')
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

/**
 * Smart section extraction - finds job-related sections by headings
 * Returns complete job description by combining all relevant sections
 */
function extractJobSections(html: string): string {
  console.log('🔍 [extractJobSections] Starting smart section extraction...')

  // Job-related heading keywords (case-insensitive)
  const jobKeywords = [
    'responsibilities',
    'responsibility',
    'requirements',
    'requirement',
    'qualifications',
    'qualification',
    'about the role',
    'about role',
    'about this role',
    'the role',
    'your role',
    'what you',
    'what we',
    'job description',
    'description',
    'your mission',
    'mission',
    'duties',
    'skills',
    'experience',
    'nice to have',
    'bonus',
    'perks',
    'benefits',
    'who you are',
    'ideal candidate'
  ]

  // Create regex pattern for job-related headings (H1-H4)
  const keywordPattern = jobKeywords.join('|')
  const headingRegex = new RegExp(
    `<h[1-4][^>]*>\\s*(?:[^<]*?(${keywordPattern})[^<]*?)\\s*<\\/h[1-4]>`,
    'gis'
  )

  // Find all job-related headings
  const headings = html.match(headingRegex) || []
  console.log(`🔍 [extractJobSections] Found ${headings.length} job-related headings`)

  if (headings.length === 0) {
    console.log('⚠️ [extractJobSections] No job headings found')
    return ''
  }

  const sections: string[] = []

  // For each heading, extract content until next heading or closing tag
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const headingIndex = html.indexOf(heading)

    if (headingIndex === -1) continue

    // Find the next heading or a reasonable endpoint
    let nextHeadingIndex = html.length
    if (i < headings.length - 1) {
      nextHeadingIndex = html.indexOf(headings[i + 1], headingIndex + heading.length)
    }

    // Extract content between this heading and next
    let sectionContent = html.substring(
      headingIndex + heading.length,
      nextHeadingIndex !== -1 ? nextHeadingIndex : html.length
    )

    // Limit section to first closing div/section/article to avoid grabbing too much
    const closingTags = [
      sectionContent.indexOf('</section>'),
      sectionContent.indexOf('</article>'),
      sectionContent.indexOf('</div></div>')  // Two closing divs usually indicate end of section
    ].filter(idx => idx !== -1)

    if (closingTags.length > 0) {
      const minClosing = Math.min(...closingTags)
      sectionContent = sectionContent.substring(0, minClosing)
    }

    // Clean the section
    const cleanedSection = cleanText(heading + ' ' + sectionContent)

    // Only include sections with meaningful content (>20 chars)
    if (cleanedSection.length > 20) {
      sections.push(cleanedSection)
      console.log(`✅ [extractJobSections] Section ${i + 1}: ${cleanedSection.substring(0, 50)}... (${cleanedSection.length} chars)`)
    }
  }

  // Combine all sections
  const fullDescription = sections.join('\n\n')
  console.log(`✅ [extractJobSections] Extracted ${sections.length} sections, total ${fullDescription.length} chars`)

  return fullDescription
}
