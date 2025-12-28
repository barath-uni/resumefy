import { Card } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ContentBlock } from '../../types/resume'
import { UniversalObjectEditor } from './UniversalObjectEditor'

interface TextEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
}

export function TextEditor({ block, onUpdate }: TextEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const content = block.content

  // Handle different content types
  const isContactInfo =
    typeof content === 'object' &&
    !Array.isArray(content) &&
    (content.name || content.email || content.phone || content.location)

  const isSimpleText = typeof content === 'string'

  // Contact info editor
  if (isContactInfo) {
    const updateContactField = (field: string, value: string) => {
      onUpdate({ ...block, content: { ...content, [field]: value } })
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
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-3">
              {content.name !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Full Name
                  </label>
                  <Input
                    value={content.name || ''}
                    onChange={(e) => updateContactField('name', e.target.value)}
                    placeholder="e.g., John Doe"
                    className="text-sm"
                  />
                </div>
              )}

              {content.email !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={content.email || ''}
                    onChange={(e) => updateContactField('email', e.target.value)}
                    placeholder="e.g., john@example.com"
                    className="text-sm"
                  />
                </div>
              )}

              {content.phone !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => updateContactField('phone', e.target.value)}
                    placeholder="e.g., (555) 123-4567"
                    className="text-sm"
                  />
                </div>
              )}

              {content.location !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Location
                  </label>
                  <Input
                    value={content.location || ''}
                    onChange={(e) => updateContactField('location', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="text-sm"
                  />
                </div>
              )}

              {content.linkedin !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    LinkedIn
                  </label>
                  <Input
                    value={content.linkedin || ''}
                    onChange={(e) => updateContactField('linkedin', e.target.value)}
                    placeholder="e.g., linkedin.com/in/johndoe"
                    className="text-sm"
                  />
                </div>
              )}

              {content.github !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    GitHub
                  </label>
                  <Input
                    value={content.github || ''}
                    onChange={(e) => updateContactField('github', e.target.value)}
                    placeholder="e.g., github.com/johndoe"
                    className="text-sm"
                  />
                </div>
              )}

              {content.website !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Website
                  </label>
                  <Input
                    value={content.website || ''}
                    onChange={(e) => updateContactField('website', e.target.value)}
                    placeholder="e.g., johndoe.com"
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  // Simple text editor (for summary, etc.)
  if (isSimpleText) {
    const handleTextChange = (text: string) => {
      onUpdate({ ...block, content: text })
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
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Content
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter text content..."
                  rows={6}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Character count: {content.length}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  // Generic fallback for complex objects
  // Use UniversalObjectEditor for any object structure
  if (typeof content === 'object' && !Array.isArray(content) && content !== null) {
    const handleObjectUpdate = (newContent: Record<string, any>) => {
      onUpdate({ ...block, content: newContent })
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
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 pt-0">
              <UniversalObjectEditor
                data={content}
                onChange={handleObjectUpdate}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  // Fallback for unknown types - show as editable JSON
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {block.category}
            </h3>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Raw Content (Advanced)
              </label>
              <div className="text-sm p-3 bg-muted/30 rounded-md border border-border">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ℹ️ This is an unknown content type. Showing raw data for debugging.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
