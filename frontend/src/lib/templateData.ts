export interface Template {
  id: 'A' | 'B' | 'C'
  name: string
  description: string
  atsScore: number
  layout: 'single-column' | 'two-column' | 'modern'
  previewThumb: string
  previewFull: string
  features: string[]
}

export const templates: Template[] = [
  {
    id: 'A',
    name: 'Classic Professional',
    description: 'Clean single-column layout with clear hierarchy. Perfect for traditional industries like finance, consulting, and corporate roles.',
    atsScore: 95,
    layout: 'single-column',
    previewThumb: '/templates/template-a-thumb.svg',
    previewFull: '/templates/template-a-thumb.svg',
    features: ['ATS-Optimized', 'Single Column', 'Clean Layout']
  },
  {
    id: 'B',
    name: 'Modern Two-Column',
    description: 'Space-efficient design with sidebar for skills and education. Great for tech, engineering, and modern workplaces.',
    atsScore: 88,
    layout: 'two-column',
    previewThumb: '/templates/template-b-thumb.svg',
    previewFull: '/templates/template-b-thumb.svg',
    features: ['Two Column', 'Compact', 'Modern']
  },
  {
    id: 'C',
    name: 'Creative Bold',
    description: 'Eye-catching design with color accents and modern typography. Ideal for creative, marketing, and design roles.',
    atsScore: 75,
    layout: 'modern',
    previewThumb: '/templates/template-c-thumb.svg',
    previewFull: '/templates/template-c-thumb.svg',
    features: ['Color Accents', 'Bold Typography', 'Creative']
  }
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}
