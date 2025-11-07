/**
 * PDF Rendering Utility using pdfmake
 * Renders resume blocks into PDF based on template layout decisions
 */

import PdfPrinter from 'npm:pdfmake@0.2.10'

interface ContentBlock {
  id: string
  type?: 'header' | 'section' | 'list' | 'text'
  category: string
  priority: number
  content: any
  metadata?: {
    estimatedLines: number
    isOptional: boolean
    keywords: string[]
  }
}

interface LayoutDecision {
  templateName: string
  placement: {
    [blockId: string]: {
      section: 'main' | 'sidebar' | 'header'
      order: number
      fontSize: number
      maxLines?: number
    }
  }
  fits: boolean
  overflow: any
  warnings: string[]
}

/**
 * Render Template A: Modern Single Column
 */
function renderTemplateA(blocks: ContentBlock[], layout: LayoutDecision): any {
  console.log('📄 [renderTemplateA] Blocks count:', blocks.length)

  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  console.log('📄 [renderTemplateA] Sorted blocks:', sortedBlocks.map(b => ({ id: b.id, category: b.category, type: b.type })))

  const content: any[] = []

  // Track which section titles we've already added
  const sectionsAdded = new Set<string>()

  // Render each block
  for (const block of sortedBlocks) {
    const placement = layout.placement[block.id]
    console.log(`📄 [renderTemplateA] Processing block ${block.id} (${block.category}/${block.type}), has placement: ${!!placement}`)
    if (!placement) {
      console.log(`⚠️  [renderTemplateA] Skipping block ${block.id} - no placement`)
      continue
    }

    // CONTACT BLOCK
    if (block.category === 'contact') {
      console.log('📄 Rendering contact:', block.content)
      content.push({
        text: block.content.name || 'Your Name',
        style: 'name',
        margin: [0, 0, 0, 5]
      })

      const contactInfo: string[] = []
      if (block.content.email) contactInfo.push(block.content.email)
      if (block.content.phone) contactInfo.push(block.content.phone)
      if (block.content.location) contactInfo.push(block.content.location)
      if (block.content.linkedin) contactInfo.push(block.content.linkedin)
      if (block.content.github) contactInfo.push(block.content.github)

      if (contactInfo.length > 0) {
        content.push({
          text: contactInfo.join(' | '),
          style: 'contact',
          margin: [0, 0, 0, 10]
        })
      }

      content.push({
        canvas: [{
          type: 'line',
          x1: 0, y1: 0,
          x2: 515, y2: 0,
          lineWidth: 2,
          lineColor: '#333333'
        }],
        margin: [0, 0, 0, 15]
      })
    }

    // SUMMARY BLOCK
    else if (block.category === 'summary') {
      console.log('📄 Rendering summary')
      content.push({
        text: 'PROFESSIONAL SUMMARY',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (block.content?.text) {
        content.push({
          text: block.content.text,
          style: 'body',
          margin: [0, 0, 0, 15]
        })
      }
    }

    // EXPERIENCE BLOCK
    else if (block.category === 'experience') {
      console.log('📄 Rendering experience:', block.id)

      // Add section title only once
      if (!sectionsAdded.has('experience')) {
        content.push({
          text: 'EXPERIENCE',
          style: 'sectionTitle',
          margin: [0, 5, 0, 10]
        })
        sectionsAdded.add('experience')
      }

      const exp = block.content
      if (exp.title || exp.company) {
        content.push({
          text: exp.title || exp.position || '',
          style: 'jobTitle',
          margin: [0, 0, 0, 3]
        })

        const companyLine = []
        if (exp.company) companyLine.push(exp.company)
        if (exp.location) companyLine.push(exp.location)

        if (companyLine.length > 0) {
          content.push({
            text: companyLine.join(' • '),
            style: 'company',
            margin: [0, 0, 0, 2]
          })
        }

        const dateRange = []
        if (exp.startDate) dateRange.push(exp.startDate)
        if (exp.endDate) dateRange.push(exp.endDate)

        if (dateRange.length > 0) {
          content.push({
            text: dateRange.join(' - '),
            style: 'dates',
            margin: [0, 0, 0, 5]
          })
        }

        if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
          content.push({
            ul: exp.bullets,
            style: 'bulletList',
            margin: [0, 0, 0, 12]
          })
        }
      }
    }

    // EDUCATION BLOCK
    else if (block.category === 'education') {
      console.log('📄 Rendering education:', block.id)

      // Add section title only once
      if (!sectionsAdded.has('education')) {
        content.push({
          text: 'EDUCATION',
          style: 'sectionTitle',
          margin: [0, 5, 0, 10]
        })
        sectionsAdded.add('education')
      }

      const edu = block.content
      if (edu.degree || edu.school) {
        content.push({
          text: edu.degree || '',
          style: 'degree',
          margin: [0, 0, 0, 2]
        })

        const schoolLine = []
        if (edu.school || edu.institution) schoolLine.push(edu.school || edu.institution)
        if (edu.location) schoolLine.push(edu.location)

        if (schoolLine.length > 0) {
          content.push({
            text: schoolLine.join(' • '),
            style: 'school',
            margin: [0, 0, 0, 2]
          })
        }

        if (edu.graduationDate || edu.year) {
          content.push({
            text: edu.graduationDate || edu.year,
            style: 'dates',
            margin: [0, 0, 0, 10]
          })
        }
      }
    }

    // SKILLS BLOCK
    else if (block.category === 'skills') {
      console.log('📄 Rendering skills:', block.content)

      if (!sectionsAdded.has('skills')) {
        content.push({
          text: 'SKILLS',
          style: 'sectionTitle',
          margin: [0, 5, 0, 10]
        })
        sectionsAdded.add('skills')
      }

      // Handle multiple skill formats
      let skillsText = ''

      if (Array.isArray(block.content)) {
        // Format: ["Python", "Azure", "Docker"]
        skillsText = block.content.join(' • ')
      } else if (typeof block.content === 'string') {
        // Format: "Python, Azure, Docker"
        skillsText = block.content
      } else if (block.content && typeof block.content === 'object') {
        // Format: { title: "Technical Skills", items: ["Python", "Azure"] }
        // OR: { items: ["Python", "Azure"] }
        if (block.content.title) {
          content.push({
            text: block.content.title,
            style: 'jobTitle',
            margin: [0, 0, 0, 3]
          })
        }
        if (Array.isArray(block.content.items)) {
          skillsText = block.content.items.join(' • ')
        } else if (typeof block.content.items === 'string') {
          skillsText = block.content.items
        }
      }

      if (skillsText) {
        content.push({
          text: skillsText,
          style: 'skills',
          margin: [0, 0, 0, 15]
        })
      }
    }

    // PROJECTS BLOCK
    else if (block.category === 'projects') {
      console.log('📄 Rendering projects')

      if (!sectionsAdded.has('projects')) {
        content.push({
          text: 'PROJECTS',
          style: 'sectionTitle',
          margin: [0, 5, 0, 10]
        })
        sectionsAdded.add('projects')
      }

      const proj = block.content
      if (proj.title || proj.name) {
        content.push({
          text: proj.title || proj.name || '',
          style: 'jobTitle',
          margin: [0, 0, 0, 3]
        })

        // Handle description (paragraph format)
        if (proj.description) {
          content.push({
            text: proj.description,
            style: 'body',
            margin: [0, 0, 0, 5]
          })
        }

        // Handle bullets (list format)
        if (Array.isArray(proj.bullets) && proj.bullets.length > 0) {
          content.push({
            ul: proj.bullets,
            style: 'bulletList',
            margin: [0, 0, 0, 5]
          })
        }

        // Handle technologies
        if (proj.technologies) {
          const techText = Array.isArray(proj.technologies)
            ? proj.technologies.join(', ')
            : proj.technologies

          content.push({
            text: `Technologies: ${techText}`,
            style: 'dates',
            margin: [0, 0, 0, 12]
          })
        }

        // Handle link
        if (proj.link || proj.url) {
          content.push({
            text: proj.link || proj.url,
            style: 'dates',
            margin: [0, 0, 0, 12]
          })
        }
      }
    }

    // CERTIFICATIONS BLOCK
    else if (block.category === 'certifications') {
      console.log('📄 Rendering certifications')

      if (!sectionsAdded.has('certifications')) {
        content.push({
          text: 'CERTIFICATIONS',
          style: 'sectionTitle',
          margin: [0, 5, 0, 10]
        })
        sectionsAdded.add('certifications')
      }

      const cert = block.content
      if (cert.name || cert.title) {
        content.push({
          text: cert.name || cert.title || '',
          style: 'degree',
          margin: [0, 0, 0, 2]
        })

        if (cert.issuer) {
          content.push({
            text: cert.issuer,
            style: 'school',
            margin: [0, 0, 0, 2]
          })
        }

        if (cert.date) {
          content.push({
            text: cert.date,
            style: 'dates',
            margin: [0, 0, 0, 10]
          })
        }
      }
    }
  }

  console.log('📄 [renderTemplateA] Final content length:', content.length)

  // Add warnings footer if any
  if (layout.warnings && layout.warnings.length > 0) {
    content.push({
      text: `Note: ${layout.warnings.join(', ')}`,
      style: 'footer',
      margin: [0, 20, 0, 0]
    })
  }

  return {
    content,
    styles: {
      name: {
        fontSize: 24,
        bold: true,
        color: '#000000'
      },
      contact: {
        fontSize: 10,
        color: '#555555'
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        color: '#000000',
        margin: [0, 10, 0, 5]
      },
      jobTitle: {
        fontSize: 11,
        bold: true
      },
      company: {
        fontSize: 10,
        italics: true,
        color: '#555555'
      },
      dates: {
        fontSize: 9,
        color: '#777777'
      },
      degree: {
        fontSize: 11,
        bold: true
      },
      school: {
        fontSize: 10
      },
      skills: {
        fontSize: 10
      },
      body: {
        fontSize: 10,
        lineHeight: 1.3
      },
      bulletList: {
        fontSize: 10
      },
      footer: {
        fontSize: 8,
        color: '#999999',
        italics: true
      }
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.4
    },
    pageMargins: [40, 40, 40, 40]
  }
}

/**
 * Main render function - routes to appropriate template
 */
export async function renderPDF(
  blocks: ContentBlock[],
  layout: LayoutDecision,
  templateName: string
): Promise<Uint8Array> {

  console.log('📄 [renderPDF] Rendering template:', templateName)
  console.log('📄 [renderPDF] Blocks received:', blocks.length)
  console.log('📄 [renderPDF] Layout placement keys:', Object.keys(layout.placement))
  console.log('📄 [renderPDF] First 3 blocks:', JSON.stringify(blocks.slice(0, 3), null, 2))

  let docDefinition: any

  switch (templateName) {
    case 'A':
      docDefinition = renderTemplateA(blocks, layout)
      break
    case 'B':
      // TODO: Implement Template B
      docDefinition = renderTemplateA(blocks, layout) // Use A as fallback
      break
    case 'C':
      // TODO: Implement Template C
      docDefinition = renderTemplateA(blocks, layout) // Use A as fallback
      break
    default:
      docDefinition = renderTemplateA(blocks, layout)
  }

  console.log('📄 [renderPDF] Doc definition content length:', docDefinition.content?.length || 0)
  console.log('📄 [renderPDF] Doc definition content first 3 items:', JSON.stringify(docDefinition.content?.slice(0, 3), null, 2))

  // Define fonts
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  }

  const printer = new PdfPrinter(fonts)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  // Convert stream to buffer
  const chunks: Uint8Array[] = []

  return new Promise((resolve, reject) => {
    pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    pdfDoc.on('end', () => {
      const result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      resolve(result)
    })
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })
}
