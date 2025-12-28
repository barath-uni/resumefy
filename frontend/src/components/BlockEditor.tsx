import { isArrayContent } from './templates/templateHelpers'
import { SkillsEditor } from './editors/SkillsEditor'
import { TextEditor } from './editors/TextEditor'
import { UniversalObjectArrayEditor } from './editors/UniversalObjectArrayEditor'
import { ContentBlock, LayoutDecision } from '../types/resume'

interface BlockEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
  layout: LayoutDecision | null
}

/**
 * BlockEditor - Routes content to appropriate universal editor
 *
 * Philosophy: Structure-based routing, NOT section-name-based
 * - Array of strings → SkillsEditor (comma-separated)
 * - Array of objects → UniversalObjectArrayEditor
 * - Single object → TextEditor (which uses UniversalObjectEditor)
 * - Plain string → TextEditor
 */
export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const content = block.content

  // 1. Array of strings (skills, languages, technologies, etc.)
  if (isArrayContent(content) && content.length > 0 && typeof content[0] === 'string') {
    return <SkillsEditor block={block} onUpdate={onUpdate} />
  }

  // 2. Array of objects (experience, education, projects, certifications, etc.)
  if (isArrayContent(content) && content.length > 0 && typeof content[0] === 'object') {
    return <UniversalObjectArrayEditor block={block} onUpdate={onUpdate} />
  }

  // 3. Empty array (treat as string array for simplicity)
  if (isArrayContent(content) && content.length === 0) {
    return <SkillsEditor block={block} onUpdate={onUpdate} />
  }

  // 4. Everything else (string, object, contact info, summary, etc.)
  return <TextEditor block={block} onUpdate={onUpdate} />
}
