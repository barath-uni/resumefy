import React from 'react'
import TemplateA from '../components/templates/TemplateA'
import TemplateB from '../components/templates/TemplateB'
import TemplateC from '../components/templates/TemplateC'

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
  templateId: 'A' | 'B' | 'C'
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
export function getTemplateComponent(templateId: 'A' | 'B' | 'C') {
  switch (templateId) {
    case 'A':
      return TemplateA
    case 'B':
      return TemplateB
    case 'C':
      return TemplateC
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
export function getTemplateMetadata(templateId: 'A' | 'B' | 'C') {
  const metadata = {
    A: {
      name: 'Classic Professional',
      description: 'Clean single-column layout with clear hierarchy',
      layout: 'single-column',
      atsScore: 95,
      features: ['ATS-Optimized', 'Single Column', 'Clean Layout'],
      supportsInlineEdit: true,
    },
    B: {
      name: 'Modern Two-Column',
      description: 'Space-efficient design with sidebar for skills and education',
      layout: 'two-column',
      atsScore: 88,
      features: ['Two Column', 'Compact', 'Modern'],
      supportsInlineEdit: true,
    },
    C: {
      name: 'Creative Bold',
      description: 'Eye-catching design with color accents and modern typography',
      layout: 'modern',
      atsScore: 75,
      features: ['Color Accents', 'Bold Typography', 'Creative'],
      supportsInlineEdit: true,
    },
  }

  return metadata[templateId]
}
