/**
 * Asset Generation Script
 *
 * This script generates downloadable resume templates (PDF and DOCX) for each job title.
 * Run this script at build time to populate the /public/downloads directory.
 *
 * Usage: tsx scripts/generateTemplates.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import jobTemplates from '../src/data/jobTemplates.json' assert { type: 'json' }

interface JobTemplate {
  title: string
  category: string
  skills: string[]
  sampleBullets: string[]
  commonResponsibilities: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DOWNLOADS_DIR = path.join(__dirname, '../public/downloads')

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
}

/**
 * Generate a simple markdown template that can be converted to PDF/DOCX
 * In production, you would use a proper PDF generation library
 */
function generateTemplateMarkdown(slug: string, data: JobTemplate): string {
  return `# ${data.title} Resume Template

## Contact Information
[Your Name]
[Your Email] | [Your Phone] | [LinkedIn] | [Portfolio/GitHub]

## Professional Summary
[Write 2-3 sentences highlighting your experience, key skills, and career achievements relevant to ${data.title}]

## Core Competencies
${data.skills.slice(0, 8).join(' • ')}

## Professional Experience

### [Job Title] | [Company Name] | [Location] | [Start Date] - [End Date]

${data.sampleBullets.slice(0, 3).map(bullet => `- ${bullet}`).join('\n')}

### [Job Title] | [Company Name] | [Location] | [Start Date] - [End Date]

${data.sampleBullets.slice(3, 5).map(bullet => `- ${bullet}`).join('\n')}

## Education

**[Degree]** | [University Name] | [Graduation Year]
- Relevant coursework: [List key courses]
- GPA: [If 3.5+]

## Certifications & Awards
- [Certification Name] | [Year]
- [Award/Recognition] | [Year]

## Additional Skills
- **Languages:** [Programming languages or spoken languages]
- **Tools:** [Software, platforms, or tools relevant to ${data.title}]
- **Soft Skills:** Communication, Leadership, Problem Solving, Teamwork

---
**Instructions:**
1. Replace all [bracketed] placeholders with your information
2. Customize bullets to match your actual experience
3. Remove sections that don't apply to you
4. Keep it to 1-2 pages maximum
`
}

/**
 * Generate template files for all job titles and template styles
 */
async function generateAllTemplates() {
  console.log('🚀 Starting template generation...\n')

  const templateStyles = ['A', 'B', 'C', 'D']
  let generatedCount = 0

  for (const [slug, data] of Object.entries(jobTemplates)) {
    const jobData = data as JobTemplate
    console.log(`📄 Generating templates for: ${jobData.title}`)

    // Generate markdown template
    const markdownContent = generateTemplateMarkdown(slug, jobData)

    for (const style of templateStyles) {
      // Save markdown template (can be converted to PDF/DOCX later)
      const mdFileName = `${slug}-resume-template-${style}.md`
      const mdFilePath = path.join(DOWNLOADS_DIR, mdFileName)
      fs.writeFileSync(mdFilePath, markdownContent)

      // Create placeholder PDF (in production, use a PDF library like pdfmake)
      const pdfFileName = `${slug}-resume-template-${style}.pdf`
      const pdfFilePath = path.join(DOWNLOADS_DIR, pdfFileName)
      const pdfPlaceholder = `PDF Template ${style} for ${jobData.title}\n\nThis is a placeholder. In production, use pdfmake or similar library to generate actual PDFs.`
      fs.writeFileSync(pdfFilePath, pdfPlaceholder)

      // Create placeholder DOCX
      const docxFileName = `${slug}-resume-template-${style}.docx`
      const docxFilePath = path.join(DOWNLOADS_DIR, docxFileName)
      const docxPlaceholder = `DOCX Template ${style} for ${jobData.title}\n\nThis is a placeholder. In production, use docx library to generate actual Word documents.`
      fs.writeFileSync(docxFilePath, docxPlaceholder)

      generatedCount += 3 // MD + PDF + DOCX
    }

    console.log(`   ✅ Generated ${templateStyles.length * 3} files for ${jobData.title}`)
  }

  console.log(`\n✨ Template generation complete!`)
  console.log(`📊 Total files generated: ${generatedCount}`)
  console.log(`📁 Output directory: ${DOWNLOADS_DIR}`)
}

// Run the script
generateAllTemplates().catch((error) => {
  console.error('❌ Error generating templates:', error)
  process.exit(1)
})
