export interface Template {
  id: 'A' | 'B' | 'C' | 'D'
  name: string
  description: string
  atsScore: number
  layout: 'single-column' | 'two-column' | 'modern' | 'compact-dense'
  previewThumb: string
  previewFull: string
  features: string[]
}

export const templates: Template[] = [
  {
    id: 'A',
    name: 'Classic Professional',
    description: 'Clean single-column layout with clear hierarchy and refined spacing. Perfect for traditional industries like finance, consulting, and corporate roles.',
    atsScore: 95,
    layout: 'single-column',
    previewThumb: '/templates/template-a-thumb.svg',
    previewFull: '/templates/template-a-thumb.svg',
    features: ['ATS-Optimized', 'Single Column', 'Grid Skills', 'Clean Layout']
  },
  {
    id: 'B',
    name: 'Modern Two-Column',
    description: 'Dark sidebar with skill bars and visual hierarchy. Great for tech, engineering, and modern workplaces.',
    atsScore: 88,
    layout: 'two-column',
    previewThumb: '/templates/template-b-thumb.svg',
    previewFull: '/templates/template-b-thumb.svg',
    features: ['Two Column', 'Skill Bars', 'Dark Sidebar', 'Modern']
  },
  {
    id: 'C',
    name: 'Creative Bold',
    description: 'Timeline-based experience layout with color zones and geometric elements. Ideal for creative, marketing, and design roles.',
    atsScore: 75,
    layout: 'modern',
    previewThumb: '/templates/template-c-thumb.svg',
    previewFull: '/templates/template-c-thumb.svg',
    features: ['Color Accents', 'Timeline', 'Bold Typography', 'Creative']
  },
  {
    id: 'D',
    name: 'Compact Dense',
    description: 'Ultra-efficient space utilization with multi-column layouts. Perfect for senior professionals with extensive experience.',
    atsScore: 92,
    layout: 'compact-dense',
    previewThumb: '/templates/template-d-thumb.svg',
    previewFull: '/templates/template-d-thumb.svg',
    features: ['Space-Efficient', 'Multi-Column', 'Dense Layout', 'Senior Level']
  }
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}
