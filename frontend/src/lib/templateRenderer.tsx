import TemplateA from '../components/templates/TemplateA'
import TemplateB from '../components/templates/TemplateB'
import TemplateC from '../components/templates/TemplateC'
import TemplateD from '../components/templates/TemplateD'

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom'
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
  overflow: {
    hasOverflow: boolean
    overflowLines: number
    recommendations: string[]
  }
  warnings: string[]
}

interface TemplateRendererProps {
  templateId: 'A' | 'B' | 'C' | 'D'
  blocks: ContentBlock[]
  layout: LayoutDecision
}

/**
 * Template Renderer Factory
 * Returns the appropriate template component based on templateId
 *
 * Usage:
 * ```tsx
 * <TemplateRenderer
 *   templateId="B"
 *   blocks={tailoredBlocks}
 *   layout={layoutDecision}
 * />
 * ```
 */
export function TemplateRenderer({ templateId, blocks, layout }: TemplateRendererProps) {
  switch (templateId) {
    case 'A':
      return <TemplateA blocks={blocks} layout={layout} />
    case 'B':
      return <TemplateB blocks={blocks} layout={layout} />
    case 'C':
      return <TemplateC blocks={blocks} layout={layout} />
    case 'D':
      return <TemplateD blocks={blocks} layout={layout} />
    default:
      // Fallback to Template A
      console.warn(`Unknown template ID: ${templateId}, falling back to Template A`)
      return <TemplateA blocks={blocks} layout={layout} />
  }
}

/**
 * Get template component class directly (useful for PDF generation)
 *
 * Usage:
 * ```tsx
 * const TemplateComponent = getTemplateComponent('B')
 * const pdf = <TemplateComponent blocks={blocks} layout={layout} />
 * ```
 */
export function getTemplateComponent(templateId: 'A' | 'B' | 'C' | 'D') {
  switch (templateId) {
    case 'A':
      return TemplateA
    case 'B':
      return TemplateB
    case 'C':
      return TemplateC
    case 'D':
      return TemplateD
    default:
      console.warn(`Unknown template ID: ${templateId}, falling back to Template A`)
      return TemplateA
  }
}

/**
 * Validate template data before rendering
 * Returns validation errors if any
 */
export function validateTemplateData(blocks: ContentBlock[], layout: LayoutDecision): string[] {
  const errors: string[] = []

  // Check if blocks exist
  if (!blocks || blocks.length === 0) {
    errors.push('No content blocks provided')
  }

  // Check if layout exists
  if (!layout || !layout.placement) {
    errors.push('No layout decision provided')
  }

  // Check if at least one block has placement
  if (layout && layout.placement) {
    const blocksWithPlacement = blocks.filter(b => layout.placement[b.id])
    if (blocksWithPlacement.length === 0) {
      errors.push('No blocks have placement information')
    }
  }

  // Check for contact block (required for all templates)
  const hasContact = blocks.some(b => b.category === 'contact')
  if (!hasContact) {
    errors.push('Missing contact information block')
  }

  return errors
}

/**
 * Get template metadata
 */
export function getTemplateMetadata(templateId: 'A' | 'B' | 'C' | 'D') {
  const metadata = {
    A: {
      name: 'Classic Professional',
      description: 'Clean single-column layout with clear hierarchy and refined spacing',
      layout: 'single-column',
      atsScore: 95,
      features: ['ATS-Optimized', 'Single Column', 'Grid Skills', 'Clean Layout'],
      supportsInlineEdit: true,
    },
    B: {
      name: 'Modern Two-Column',
      description: 'Dark sidebar with skill bars and visual hierarchy',
      layout: 'two-column',
      atsScore: 88,
      features: ['Two Column', 'Skill Bars', 'Dark Sidebar', 'Modern'],
      supportsInlineEdit: true,
    },
    C: {
      name: 'Creative Bold',
      description: 'Timeline-based experience layout with color zones and geometric elements',
      layout: 'modern',
      atsScore: 75,
      features: ['Color Accents', 'Timeline', 'Bold Typography', 'Creative'],
      supportsInlineEdit: true,
    },
    D: {
      name: 'Compact Dense',
      description: 'Ultra-efficient space utilization with multi-column layouts',
      layout: 'compact-dense',
      atsScore: 92,
      features: ['Space-Efficient', 'Multi-Column', 'Dense Layout', 'Senior Level'],
      supportsInlineEdit: true,
    },
  }

  return metadata[templateId]
}
