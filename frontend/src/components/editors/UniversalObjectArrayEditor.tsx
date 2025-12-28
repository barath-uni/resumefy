import { Card } from '../ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ContentBlock } from '../../types/resume'
import { UniversalObjectEditor } from './UniversalObjectEditor'

interface UniversalObjectArrayEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
}

/**
 * Universal Object Array Editor
 *
 * For editing arrays of objects (experience, education, projects, certifications, etc.)
 * Uses UniversalObjectEditor for each item
 */
export function UniversalObjectArrayEditor({ block, onUpdate }: UniversalObjectArrayEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const items: Record<string, any>[] = Array.isArray(block.content) ? block.content : []

  const updateItem = (index: number, newItem: Record<string, any>) => {
    const newItems = [...items]
    newItems[index] = newItem
    onUpdate({ ...block, content: newItems })
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
              ({items.length} {items.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Entry {index + 1}
                  </span>
                </div>
                <UniversalObjectEditor
                  data={item}
                  onChange={(newItem) => updateItem(index, newItem)}
                  isNested={false}
                />
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No entries found
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
