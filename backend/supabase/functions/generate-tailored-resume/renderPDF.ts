/**
 * PDF Rendering Utility using pdfmake
 * Renders resume blocks into PDF based on template layout decisions
 */

import PdfPrinter from 'npm:pdfmake@0.2.10'

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: string
  priority: number
  content: any
  metadata: {
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
  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  const content: any[] = []

  // Render each block
  for (const block of sortedBlocks) {
    const placement = layout.placement[block.id]
    if (!placement) continue

    if (block.category === 'contact' && block.type === 'header') {
      // Header block
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

      if (contactInfo.length > 0) {
        content.push({
          text: contactInfo.join(' | '),
          style: 'contact',
          margin: [0, 0, 0, 10]
        })
      }

      content.push({
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0,
            lineWidth: 2,
            lineColor: '#333333'
          }
        ],
        margin: [0, 0, 0, 15]
      })

    } else if (block.category === 'experience' && block.type === 'section') {
      // Experience section
      content.push({
        text: 'EXPERIENCE',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (Array.isArray(block.content)) {
        for (const entry of block.content) {
          content.push({
            text: entry.title || entry.position || '',
            style: 'jobTitle',
            margin: [0, 0, 0, 3]
          })
          content.push({
            text: entry.company || '',
            style: 'company',
            margin: [0, 0, 0, 2]
          })
          if (entry.dates) {
            content.push({
              text: entry.dates,
              style: 'dates',
              margin: [0, 0, 0, 5]
            })
          }
          if (entry.bullets && Array.isArray(entry.bullets)) {
            content.push({
              ul: entry.bullets,
              style: 'bulletList',
              margin: [0, 0, 0, 10]
            })
          }
        }
      }

    } else if (block.category === 'education' && block.type === 'section') {
      // Education section
      content.push({
        text: 'EDUCATION',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (Array.isArray(block.content)) {
        for (const entry of block.content) {
          content.push({
            text: entry.degree || '',
            style: 'degree',
            margin: [0, 0, 0, 2]
          })
          content.push({
            text: entry.school || entry.institution || '',
            style: 'school',
            margin: [0, 0, 0, 2]
          })
          if (entry.year) {
            content.push({
              text: entry.year,
              style: 'dates',
              margin: [0, 0, 0, 8]
            })
          }
        }
      }

    } else if (block.category === 'skills' && block.type === 'list') {
      // Skills section
      content.push({
        text: 'SKILLS',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (Array.isArray(block.content)) {
        content.push({
          text: block.content.join(' • '),
          style: 'skills',
          margin: [0, 0, 0, 10]
        })
      }

    } else if (block.category === 'projects' && block.type === 'section') {
      // Projects section
      content.push({
        text: 'PROJECTS',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (Array.isArray(block.content)) {
        for (const project of block.content) {
          content.push({
            text: project.title || project.name || '',
            style: 'jobTitle',
            margin: [0, 0, 0, 3]
          })
          if (project.description) {
            content.push({
              text: project.description,
              style: 'body',
              margin: [0, 0, 0, 5]
            })
          }
          if (project.technologies) {
            const techText = Array.isArray(project.technologies)
              ? project.technologies.join(', ')
              : project.technologies
            content.push({
              text: `Technologies: ${techText}`,
              style: 'dates',
              margin: [0, 0, 0, 8]
            })
          }
        }
      }

    } else if (block.category === 'certifications' && block.type === 'section') {
      // Certifications section
      content.push({
        text: 'CERTIFICATIONS',
        style: 'sectionTitle',
        margin: [0, 5, 0, 10]
      })

      if (Array.isArray(block.content)) {
        for (const cert of block.content) {
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
              margin: [0, 0, 0, 8]
            })
          }
        }
      }
    }
  }

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
