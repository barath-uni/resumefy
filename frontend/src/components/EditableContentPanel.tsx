import { BlockEditor } from './BlockEditor'
import { Card } from './ui/card'
import { ContentBlock, LayoutDecision } from '../types/resume'

interface EditableContentPanelProps {
  blocks: ContentBlock[]
  onBlocksChange: (newBlocks: ContentBlock[]) => void
  layout: LayoutDecision | null
}

export function EditableContentPanel({ blocks, onBlocksChange, layout }: EditableContentPanelProps) {
  const handleBlockUpdate = (blockId: string, updatedBlock: ContentBlock) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? updatedBlock : block
    )
    onBlocksChange(newBlocks)
  }

  // Sort blocks by priority (higher priority first)
  const sortedBlocks = [...blocks].sort((a, b) => b.priority - a.priority)

  return (
    <div className="overflow-y-auto bg-muted/20 border-r border-border">
      <div className="p-6 space-y-4">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Edit Resume Sections</h2>
          <p className="text-xs text-muted-foreground">
            Edit your resume content below. Changes update the preview in real-time.
          </p>
        </div>

        {sortedBlocks.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No content blocks found</p>
          </Card>
        ) : (
          sortedBlocks.map((block) => (
            <BlockEditor
              key={block.id}
              block={block}
              onUpdate={(updatedBlock) => handleBlockUpdate(block.id, updatedBlock)}
              layout={layout}
            />
          ))
        )}
      </div>
    </div>
  )
}
