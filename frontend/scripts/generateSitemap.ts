/**
 * Sitemap Generator
 *
 * Generates sitemap.xml for SEO optimization
 * Includes all static pages and dynamically generated blog posts
 *
 * Usage: tsx scripts/generateSitemap.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import jobTemplates from '../src/data/jobTemplates.json' assert { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BASE_URL = 'https://resumefy.ai'
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml')

interface SitemapEntry {
  url: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

function generateSitemap() {
  console.log('🗺️  Generating sitemap.xml...\n')

  const today = new Date().toISOString().split('T')[0]

  const entries: SitemapEntry[] = [
    // Static pages
    {
      url: `${BASE_URL}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/support`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5,
    },
  ]

  // Add blog posts
  for (const [slug] of Object.entries(jobTemplates)) {
    entries.push({
      url: `${BASE_URL}/blog/${slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8,
    })
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, xml)

  console.log(`✅ Sitemap generated with ${entries.length} URLs`)
  console.log(`📁 Saved to: ${OUTPUT_PATH}`)
}

// Run the script
generateSitemap()
