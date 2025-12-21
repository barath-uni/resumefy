/**
 * Generic Template Helpers
 *
 * These functions make templates language-agnostic and data-driven.
 * They auto-detect content structure and render accordingly.
 */

/**
 * Extract text content from any format
 * Handles: string, {text: string}, {content: string}, or any object
 */
export function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content
  }

  if (content?.text) {
    return String(content.text)
  }

  if (content?.content) {
    return String(content.content)
  }

  // Fallback: convert to string
  return String(content || '')
}

/**
 * Generate display title from category name
 * Examples: "experience" → "EXPERIENCE", "trabalho" → "TRABALHO"
 */
export function getCategoryTitle(category: string): string {
  return category.toUpperCase()
}

/**
 * Check if content is an array (list of items)
 */
export function isArrayContent(content: any): boolean {
  return Array.isArray(content)
}

/**
 * Check if content is an experience/job entry
 * Looks for: title/position + company
 */
export function isExperienceEntry(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    ((content.title || content.position) && content.company)
  )
}

/**
 * Check if content is an education entry
 * Looks for: degree + school/institution
 */
export function isEducationEntry(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    (content.degree && (content.school || content.institution))
  )
}

/**
 * Check if content is a project entry
 * Looks for: title/name + (description or technologies or bullets)
 */
export function isProjectEntry(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    ((content.title || content.name) && (content.description || content.technologies || content.bullets))
  )
}

/**
 * Check if content is a certification entry
 * Looks for: name/title + issuer
 */
export function isCertificationEntry(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    ((content.name || content.title))
  )
}
