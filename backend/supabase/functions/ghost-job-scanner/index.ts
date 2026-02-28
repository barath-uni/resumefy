import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * GHOST JOB SCANNER
 *
 * Analyzes a job posting URL to determine if it's a "ghost job" (fake/stale listing)
 * or a genuine opportunity, using 4 programmatic trust signals.
 *
 * Signals:
 * 1. Post Age       (0-40 pts) — older posts = higher ghost risk
 * 2. Ghost Keywords (0-30 pts) — vague "talent pool" language
 * 3. Description Quality (0-20 pts) — thin/generic vs specific
 * 4. Platform Trust (0-10 pts) — trusted job platforms score lower
 *
 * Ghost Score: 0–100 (higher = more likely ghost)
 * Verdict:
 *   0-30  → "Likely Real"   (Gold)
 *   31-60 → "Uncertain"
 *   61-100→ "Likely Ghost"
 *
 * Input:  { url: string }
 * Output: { success, ghostScore, verdict, verdictLabel, fastFacts[], signals, jobTitle, company, postDate }
 */

interface GhostSignal {
  score: number
  detail: string
  max: number
}

interface GhostScanResult {
  success: boolean
  ghostScore: number
  verdict: 'likely_real' | 'uncertain' | 'likely_ghost'
  verdictLabel: string
  fastFacts: string[]
  signals: {
    postAge: GhostSignal
    keywordDensity: GhostSignal
    descriptionQuality: GhostSignal
    platformTrust: GhostSignal
  }
  jobTitle: string
  company: string
  postDate: string | null
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('👻 [ghost-scanner] Scanning URL:', url)

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (_) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the page HTML
    let html = ''
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      html = await response.text()
      console.log('✅ [ghost-scanner] Fetched HTML, length:', html.length)
    } catch (fetchErr) {
      console.error('❌ [ghost-scanner] Fetch error:', fetchErr)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not fetch the job page. The site may block automated access. Try pasting the description instead.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hostname = parsedUrl.hostname.toLowerCase()

    // ─── Extract job metadata ─────────────────────────────────────────────────
    const jobTitle = extractJobTitle(html, hostname)
    const company = extractCompany(html, hostname)
    const postDate = extractPostDate(html, hostname)
    const description = extractDescription(html, hostname)

    console.log('🔍 [ghost-scanner] Title:', jobTitle || '(none)')
    console.log('🔍 [ghost-scanner] Company:', company || '(none)')
    console.log('🔍 [ghost-scanner] Post date:', postDate || '(none)')
    console.log('🔍 [ghost-scanner] Description length:', description.length)

    // ─── Signal 1: Post Age (0–40 pts) ───────────────────────────────────────
    const postAgeSignal = scorePostAge(postDate)

    // ─── Signal 2: Ghost Keywords (0–30 pts) ─────────────────────────────────
    const keywordSignal = scoreKeywords(description + ' ' + jobTitle)

    // ─── Signal 3: Description Quality (0–20 pts) ────────────────────────────
    const qualitySignal = scoreDescriptionQuality(description)

    // ─── Signal 4: Platform Trust (0–10 pts) ─────────────────────────────────
    const platformSignal = scorePlatform(hostname)

    // ─── Total Ghost Score ────────────────────────────────────────────────────
    const ghostScore = Math.min(
      100,
      postAgeSignal.score + keywordSignal.score + qualitySignal.score + platformSignal.score
    )

    let verdict: GhostScanResult['verdict']
    let verdictLabel: string
    if (ghostScore <= 30) {
      verdict = 'likely_real'
      verdictLabel = 'Likely Real'
    } else if (ghostScore <= 60) {
      verdict = 'uncertain'
      verdictLabel = 'Uncertain'
    } else {
      verdict = 'likely_ghost'
      verdictLabel = 'Likely Ghost'
    }

    // ─── Fast Facts (3 human-readable bullets) ───────────────────────────────
    const fastFacts = buildFastFacts(postDate, postAgeSignal, keywordSignal, qualitySignal, description)

    const result: GhostScanResult = {
      success: true,
      ghostScore,
      verdict,
      verdictLabel,
      fastFacts,
      signals: {
        postAge: postAgeSignal,
        keywordDensity: keywordSignal,
        descriptionQuality: qualitySignal,
        platformTrust: platformSignal,
      },
      jobTitle,
      company,
      postDate,
    }

    console.log(`✅ [ghost-scanner] Score: ${ghostScore}/100 — ${verdictLabel}`)
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ [ghost-scanner] Unexpected error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error: ' + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ─── POST DATE EXTRACTION ──────────────────────────────────────────────────────

function extractPostDate(html: string, hostname: string): string | null {
  // 1. JSON-LD structured data (most reliable across all platforms)
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatches) {
    for (const block of jsonLdMatches) {
      const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
      try {
        const parsed = JSON.parse(inner)
        const candidates = [parsed, ...(Array.isArray(parsed['@graph']) ? parsed['@graph'] : [])]
        for (const obj of candidates) {
          if (obj.datePosted) return obj.datePosted
          if (obj.validThrough) return obj.validThrough
        }
      } catch (_) { /* skip malformed JSON-LD */ }
    }
  }

  // 2. Meta tags
  const metaPatterns = [
    /<meta[^>]*(?:name|property)="(?:article:published_time|og:article:published_time|date)"[^>]*content="([^"]+)"/i,
    /<meta[^>]*content="([^"]+)"[^>]*(?:name|property)="(?:article:published_time|og:article:published_time|date)"/i,
  ]
  for (const pattern of metaPatterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }

  // 3. Platform-specific patterns
  if (hostname.includes('linkedin.com')) {
    const m = html.match(/Posted\s+([\w\s]+ago)/i)
      || html.match(/"postedAt"\s*:\s*"([^"]+)"/i)
      || html.match(/class="[^"]*posted-date[^"]*"[^>]*>\s*([^<]{3,50})/i)
    if (m) return m[1]
  }

  if (hostname.includes('indeed.com')) {
    const m = html.match(/PostedDate[^>]*>[^<]*<[^>]*>([^<]{3,50})/i)
      || html.match(/data-testid="job-age"[^>]*>([^<]+)/i)
    if (m) return m[1]
  }

  // 4. Generic <time> element
  const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i)
  if (timeMatch) return timeMatch[1]

  // 5. "Posted X days/weeks ago" text pattern
  const agoMatch = html.match(/(?:posted|listed|added|published)\s+((?:\d+\s+)?(?:today|yesterday|\d+\s+(?:day|week|month|year)s?\s+ago))/i)
  if (agoMatch) return agoMatch[1]

  return null
}

// ─── TITLE / COMPANY EXTRACTION ───────────────────────────────────────────────

function extractJobTitle(html: string, hostname: string): string {
  let title = ''
  if (hostname.includes('linkedin.com')) {
    title = extractText(html, /<h1[^>]*class="[^"]*topcard__title[^"]*"[^>]*>(.*?)<\/h1>/i)
      || extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
  } else if (hostname.includes('indeed.com')) {
    title = extractText(html, /<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i)
      || extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
  } else {
    title = extractText(html, /<h1[^>]*>(.*?)<\/h1>/i)
  }

  // JSON-LD fallback
  if (!title) {
    const m = html.match(/"title"\s*:\s*"([^"]+)"/i) || html.match(/"jobTitle"\s*:\s*"([^"]+)"/i)
    if (m) title = m[1]
  }

  return cleanText(title)
}

function extractCompany(html: string, hostname: string): string {
  let company = ''
  if (hostname.includes('linkedin.com')) {
    company = extractText(html, /<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/i)
  } else if (hostname.includes('indeed.com')) {
    company = extractText(html, /<div[^>]*class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>(.*?)<\/div>/i)
  }

  if (!company) {
    const m = html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/i)
      || html.match(/"name"\s*:\s*"([^"]+)"[^}]*"@type"\s*:\s*"Organization"/i)
    if (m) company = m[1]
  }

  return cleanText(company)
}

function extractDescription(html: string, hostname: string): string {
  // Smart section extraction first (platform-agnostic)
  const sections = extractJobSections(html)
  if (sections && sections.length >= 200) return sections

  // Platform fallbacks
  let desc = ''
  if (hostname.includes('linkedin.com')) {
    desc = extractText(html, /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>(.*?)<\/div>/is)
  } else if (hostname.includes('indeed.com')) {
    desc = extractText(html, /<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/is)
  } else if (hostname.includes('greenhouse.io')) {
    desc = extractText(html, /<div[^>]*id="content"[^>]*>(.*?)<\/div>/is)
  } else if (hostname.includes('lever.co')) {
    desc = extractText(html, /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is)
  } else {
    desc = extractText(html, /<main[^>]*>(.*?)<\/main>/is)
      || extractText(html, /<article[^>]*>(.*?)<\/article>/is)
  }

  return cleanText(desc)
}

// ─── SCORING FUNCTIONS ─────────────────────────────────────────────────────────

function scorePostAge(postDate: string | null): GhostSignal {
  if (!postDate) {
    return {
      score: 15,
      detail: 'Post date not found — cannot verify freshness',
      max: 40,
    }
  }

  // Try to parse the date
  const ageInfo = parseAge(postDate)

  if (ageInfo === null) {
    return {
      score: 15,
      detail: `Post date "${postDate}" could not be parsed`,
      max: 40,
    }
  }

  const { days, label } = ageInfo

  let score: number
  let detail: string
  if (days < 0) {
    score = 0
    detail = `Posted very recently (${label})`
  } else if (days <= 7) {
    score = 0
    detail = `Posted ${label} — very fresh`
  } else if (days <= 14) {
    score = 8
    detail = `Posted ${label} — still recent`
  } else if (days <= 30) {
    score = 16
    detail = `Posted ${label} — starting to age`
  } else if (days <= 60) {
    score = 28
    detail = `Posted ${label} — significantly aged`
  } else {
    score = 40
    detail = `Posted ${label} — very stale`
  }

  return { score, detail, max: 40 }
}

/** Returns days elapsed (0 if today) or null if un-parseable */
function parseAge(raw: string): { days: number; label: string } | null {
  const lower = raw.toLowerCase().trim()

  // Relative: "X days ago", "X weeks ago", etc.
  const daysAgo = lower.match(/(\d+)\s+days?\s+ago/)
  if (daysAgo) {
    const d = parseInt(daysAgo[1], 10)
    return { days: d, label: `${d} day${d !== 1 ? 's' : ''} ago` }
  }
  const weeksAgo = lower.match(/(\d+)\s+weeks?\s+ago/)
  if (weeksAgo) {
    const w = parseInt(weeksAgo[1], 10)
    return { days: w * 7, label: `${w} week${w !== 1 ? 's' : ''} ago` }
  }
  const monthsAgo = lower.match(/(\d+)\s+months?\s+ago/)
  if (monthsAgo) {
    const mo = parseInt(monthsAgo[1], 10)
    return { days: mo * 30, label: `${mo} month${mo !== 1 ? 's' : ''} ago` }
  }
  if (lower.includes('today') || lower.includes('just now') || lower.includes('hour')) {
    return { days: 0, label: 'today' }
  }
  if (lower.includes('yesterday')) {
    return { days: 1, label: 'yesterday' }
  }

  // ISO date string or locale date
  const parsed = new Date(raw)
  if (!isNaN(parsed.getTime())) {
    const days = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24))
    const label = days === 0
      ? 'today'
      : days === 1
      ? 'yesterday'
      : `${days} days ago`
    return { days, label }
  }

  return null
}

const GHOST_PHRASES = [
  'talent pool',
  'always looking',
  'building our pipeline',
  'future opportunities',
  'pipeline of candidates',
  'evergreen',
  'not currently hiring',
  'spontaneous application',
  'proactive application',
  'join our talent',
  'no specific opening',
  'general application',
  'no immediate opening',
  'seeking expressions of interest',
  'on file for future',
]

const SPECIFICITY_PHRASES = [
  'start date',
  'starting immediately',
  'start asap',
  'immediate start',
  'q1 2',
  'q2 2',
  'q3 2',
  'q4 2',
  'january 2',
  'february 2',
  'march 2',
  'april 2',
  'may 2',
  'june 2',
  'july 2',
  'august 2',
  'september 2',
  'october 2',
  'november 2',
  'december 2',
  'salary',
  'compensation',
  '$/year',
  '$/hour',
  'k/year',
  'per year',
  'annual salary',
]

function scoreKeywords(text: string): GhostSignal {
  const lower = text.toLowerCase()

  const ghostMatches = GHOST_PHRASES.filter(p => lower.includes(p))
  const specificityMatches = SPECIFICITY_PHRASES.filter(p => lower.includes(p))

  const rawScore = ghostMatches.length * 6 - specificityMatches.length * 3
  const score = Math.max(0, Math.min(30, rawScore))

  let detail: string
  if (ghostMatches.length === 0 && specificityMatches.length > 0) {
    detail = `No ghost phrases found; ${specificityMatches.length} specificity signal${specificityMatches.length !== 1 ? 's' : ''} detected`
  } else if (ghostMatches.length === 0) {
    detail = 'No ghost phrases detected in the listing'
  } else if (ghostMatches.length === 1) {
    detail = `1 ghost phrase found: "${ghostMatches[0]}"`
  } else {
    detail = `${ghostMatches.length} ghost phrases found: "${ghostMatches.slice(0, 2).join('", "')}"`
  }

  return { score, detail, max: 30 }
}

function scoreDescriptionQuality(description: string): GhostSignal {
  const len = description.trim().length

  let score: number
  let detail: string

  if (len === 0) {
    score = 20
    detail = 'No description could be extracted'
  } else if (len < 300) {
    score = 20
    detail = `Very short description (${len} chars) — generic or incomplete`
  } else if (len < 600) {
    score = 12
    detail = `Brief description (${len} chars) — limited specifics`
  } else if (len < 1200) {
    score = 6
    detail = `Moderate description (${len} chars) — reasonable detail`
  } else {
    score = 0
    detail = `Detailed description (${len} chars) — good specificity`
  }

  // Bonus: specific tech/tools mentioned reduces score
  const techSignals = (description.match(/\b(?:python|javascript|react|typescript|sql|aws|kubernetes|docker|node|java|golang|rust|c\+\+|swift|kotlin|terraform|postgresql|mongodb|redis|kafka|spark|pytorch|tensorflow)\b/gi) || []).length
  if (techSignals >= 3) {
    score = Math.max(0, score - 5)
    detail += ` (+${techSignals} specific tech keywords)`
  }

  return { score, detail, max: 20 }
}

const TRUSTED_PLATFORMS: Record<string, number> = {
  'greenhouse.io': 0,
  'boards.greenhouse.io': 0,
  'lever.co': 0,
  'jobs.lever.co': 0,
  'workday.com': 0,
  'myworkdayjobs.com': 0,
  'smartrecruiters.com': 2,
  'linkedin.com': 2,
  'indeed.com': 3,
  'glassdoor.com': 3,
  'ziprecruiter.com': 4,
  'monster.com': 5,
}

function scorePlatform(hostname: string): GhostSignal {
  for (const [domain, pts] of Object.entries(TRUSTED_PLATFORMS)) {
    if (hostname.includes(domain)) {
      const label = pts === 0
        ? 'Highly trusted ATS platform (Greenhouse/Lever/Workday)'
        : pts <= 2
        ? `Trusted platform (${hostname.replace('www.', '')})`
        : `Moderately trusted platform (${hostname.replace('www.', '')})`
      return { score: pts, detail: label, max: 10 }
    }
  }

  // Company career page is reasonably trustworthy
  const careerPatterns = ['careers.', 'jobs.', 'career.', '/careers', '/jobs']
  const isCareersPage = careerPatterns.some(p => hostname.includes(p) || (hostname + '/').includes(p))
  if (isCareersPage) {
    return { score: 3, detail: `Company careers page (${hostname.replace('www.', '')})`, max: 10 }
  }

  return { score: 6, detail: `Unknown platform — harder to verify (${hostname.replace('www.', '')})`, max: 10 }
}

// ─── FAST FACTS ────────────────────────────────────────────────────────────────

function buildFastFacts(
  postDate: string | null,
  postAgeSignal: GhostSignal,
  keywordSignal: GhostSignal,
  qualitySignal: GhostSignal,
  description: string
): string[] {
  const facts: string[] = []

  // Fact 1: Post age
  if (!postDate) {
    facts.push('Post date not visible — a common sign of evergreen ghost listings')
  } else {
    const ageInfo = parseAge(postDate)
    if (ageInfo) {
      if (ageInfo.days <= 7) {
        facts.push(`Posted ${ageInfo.label} — this is a fresh listing`)
      } else if (ageInfo.days <= 14) {
        facts.push(`Posted ${ageInfo.label} — still within a healthy window`)
      } else if (ageInfo.days <= 30) {
        facts.push(`Posted ${ageInfo.label} — starting to age; worth applying soon`)
      } else if (ageInfo.days <= 60) {
        facts.push(`Posted ${ageInfo.label} — significantly stale; may no longer be active`)
      } else {
        facts.push(`Posted ${ageInfo.label} — very old; high risk this role was never filled or is a ghost`)
      }
    } else {
      facts.push(`Post date detected: "${postDate}"`)
    }
  }

  // Fact 2: Ghost keyword signal
  if (keywordSignal.score === 0) {
    facts.push('No ghost phrases found — the language reads like a real, targeted opening')
  } else if (keywordSignal.score <= 10) {
    facts.push('Minor ghost-phrase signals — description language is slightly vague')
  } else {
    facts.push(`Ghost language alert: the description uses typical evergreen/talent-pool phrasing`)
  }

  // Fact 3: Description quality
  const len = description.trim().length
  if (len === 0) {
    facts.push('Description could not be extracted — scan manually for red flags')
  } else if (len < 300) {
    facts.push(`Description is very short (${len} chars) — genuine jobs usually have more detail`)
  } else if (len < 600) {
    facts.push(`Description has ${len} characters — moderate detail; look for specific deliverables`)
  } else {
    facts.push(`Detailed description (${len} chars) — specificity is a positive signal for a real opening`)
  }

  return facts
}

// ─── HTML HELPERS (same as scrape-job-url) ────────────────────────────────────

function extractText(html: string, regex: RegExp): string {
  const match = html.match(regex)
  return match ? match[1] : ''
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractJobSections(html: string): string {
  const jobKeywords = [
    'responsibilities', 'responsibility', 'requirements', 'requirement',
    'qualifications', 'qualification', 'about the role', 'about role',
    'about this role', 'the role', 'your role', 'what you', 'what we',
    'job description', 'description', 'your mission', 'mission', 'duties',
    'skills', 'experience', 'nice to have', 'bonus', 'perks', 'benefits',
    'who you are', 'ideal candidate',
  ]

  const keywordPattern = jobKeywords.join('|')
  const headingRegex = new RegExp(
    `<h[1-4][^>]*>\\s*(?:[^<]*?(${keywordPattern})[^<]*?)\\s*<\\/h[1-4]>`,
    'gis'
  )

  const headings = html.match(headingRegex) || []
  if (headings.length === 0) return ''

  const sections: string[] = []

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const headingIndex = html.indexOf(heading)
    if (headingIndex === -1) continue

    let nextHeadingIndex = html.length
    if (i < headings.length - 1) {
      nextHeadingIndex = html.indexOf(headings[i + 1], headingIndex + heading.length)
    }

    let sectionContent = html.substring(
      headingIndex + heading.length,
      nextHeadingIndex !== -1 ? nextHeadingIndex : html.length
    )

    const closingTags = [
      sectionContent.indexOf('</section>'),
      sectionContent.indexOf('</article>'),
      sectionContent.indexOf('</div></div>'),
    ].filter(idx => idx !== -1)

    if (closingTags.length > 0) {
      sectionContent = sectionContent.substring(0, Math.min(...closingTags))
    }

    const cleaned = cleanText(heading + ' ' + sectionContent)
    if (cleaned.length > 20) sections.push(cleaned)
  }

  return sections.join('\n\n')
}
