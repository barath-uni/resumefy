import { PDFViewer } from '@react-pdf/renderer'
import { TemplateRenderer, validateTemplateData } from '../lib/templateRenderer'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'

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

interface ResumePreviewProps {
  templateId: 'A' | 'B' | 'C'
  blocks: ContentBlock[]
  layout: LayoutDecision
  className?: string
  showControls?: boolean
}

/**
 * ResumePreview Component
 *
 * Renders a live preview of the resume using @react-pdf/renderer PDFViewer
 * Shows real-time updates when template or data changes
 *
 * Features:
 * - Live preview with PDFViewer
 * - Validation error display
 * - Zoom controls (future enhancement)
 * - Warnings for overflow or issues
 */
export default function ResumePreview({
  templateId,
  blocks,
  layout,
  className = '',
  showControls = true,
}: ResumePreviewProps) {
  const [zoom, setZoom] = useState<'fit' | 'actual'>(
'fit')

  // Validate data before rendering
  const validationErrors = validateTemplateData(blocks, layout)
  const hasErrors = validationErrors.length > 0

  // Check for warnings
  const hasWarnings = layout?.warnings && layout.warnings.length > 0
  const hasOverflow = layout?.overflow?.hasOverflow

  if (hasErrors) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive mb-2">Cannot Preview Resume</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls and Warnings */}
      {(showControls || hasWarnings || hasOverflow) && (
        <div className="flex items-center justify-between gap-3">
          {/* Warnings */}
          <div className="flex items-center gap-2 flex-1">
            {hasOverflow && (
              <Badge variant="destructive" className="text-xs">
                Content Overflow
              </Badge>
            )}
            {hasWarnings && !hasOverflow && (
              <Badge variant="secondary" className="text-xs">
                {layout.warnings.length} Warning{layout.warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Zoom Controls (Future Enhancement) */}
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom('fit')}
                className={zoom === 'fit' ? 'bg-accent' : ''}
              >
                <Maximize2 className="w-4 h-4 mr-1" />
                Fit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom('actual')}
                className={zoom === 'actual' ? 'bg-accent' : ''}
              >
                <ZoomIn className="w-4 h-4 mr-1" />
                100%
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Warning Messages */}
      {hasWarnings && (
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">Resume Warnings:</p>
              <ul className="space-y-0.5">
                {layout.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* PDF Preview */}
      <Card className="overflow-hidden bg-muted/30">
        <PDFViewer
          width="100%"
          height="800px"
          showToolbar={true}
          className="border-0"
        >
          <TemplateRenderer
            templateId={templateId}
            blocks={blocks}
            layout={layout}
          />
        </PDFViewer>
      </Card>

      {/* Preview Info */}
      <div className="text-xs text-muted-foreground text-center">
        Preview updates in real-time. Use browser's PDF viewer controls to zoom and navigate.
      </div>
    </div>
  )
}
