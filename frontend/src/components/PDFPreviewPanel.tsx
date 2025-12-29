import { Loader2 } from 'lucide-react'

interface PDFPreviewPanelProps {
  pdfUrl: string | null
  isGenerating: boolean
  jobTitle: string
}

export function PDFPreviewPanel({ pdfUrl, isGenerating, jobTitle }: PDFPreviewPanelProps) {
  return (
    <div className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border-l border-border flex flex-col">
      {/* Preview Header */}
      <div className="p-4 border-b border-border bg-card/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
            <p className="text-xs text-muted-foreground">
              {isGenerating ? 'Updating preview...' : 'Preview updates as you edit'}
            </p>
          </div>
          {isGenerating && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-6 overflow-auto">
        {!pdfUrl ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Generating initial preview...</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-3xl h-full bg-white rounded-lg shadow-2xl overflow-hidden">
              <iframe
                key={pdfUrl} // Force re-render when URL changes
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full"
                title={`Resume Preview - ${jobTitle}`}
                style={{ border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
