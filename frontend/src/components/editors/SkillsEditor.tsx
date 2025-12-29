import { Card } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ContentBlock } from '../../types/resume'

interface SkillsEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
}

export function SkillsEditor({ block, onUpdate }: SkillsEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const skills: string[] = Array.isArray(block.content) ? block.content : []

  // Convert skills array to comma-separated string for editing
  const skillsText = skills.join(', ')

  const handleSkillsChange = (text: string) => {
    // Split by comma, trim whitespace, filter empty strings
    const newSkills = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    onUpdate({ ...block, content: newSkills })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {block.category}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({skills.length} {skills.length === 1 ? 'skill' : 'skills'})
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Skills (comma-separated)
              </label>
              <Textarea
                value={skillsText}
                onChange={(e) => handleSkillsChange(e.target.value)}
                placeholder="e.g., JavaScript, React, Node.js, Python, AWS"
                rows={4}
                className="text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Separate each skill with a comma. Example: Python, React, AWS, Docker
              </p>
            </div>

            {/* Preview of parsed skills */}
            {skills.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Preview ({skills.length} skills)
                </label>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
