import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, ArrowLeft, RotateCcw, Download, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/button'
import { EditableContentPanel } from '../components/EditableContentPanel'
import { PDFPreviewPanel } from '../components/PDFPreviewPanel'
import { useRealtimePDFPreview } from '../hooks/useRealtimePDFPreview'
import { templates } from '../lib/templateData'
import { ContentBlock, LayoutDecision } from '../types/resume'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

export default function EditResumePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [jobTitle, setJobTitle] = useState<string>('')
  const [originalBlocks, setOriginalBlocks] = useState<ContentBlock[]>([])
  const [editedBlocks, setEditedBlocks] = useState<ContentBlock[]>([])
  const [layout, setLayout] = useState<LayoutDecision | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('A')

  // Load job data from database
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          navigate('/app/dashboard')
          return
        }

        // Fetch job data
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('job_title, template_used, resume_id')
          .eq('id', jobId)
          .eq('user_id', session.user.id)
          .single()

        if (jobError || !job) {
          console.error('❌ Failed to load job:', jobError)
          navigate('/app/my-resumes')
          return
        }

        // Fetch fresh content from backend (same approach as GeneratedResumesPage)
        const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
          body: {
            jobId: jobId,
            templateName: job.template_used || 'A',
            returnContentOnly: true // Signal we only want the content, not PDF rendering
          }
        })

        if (error || !data?.success) {
          console.error('❌ [EditResume] Backend error:', error, data)
          navigate('/app/my-resumes')
          return
        }

        // Extract blocks and layout from backend response
        const blocks = data.tailoredContent?.blocks
        const layoutData = data.tailoredContent?.layout

        if (!blocks || !layoutData) {
          console.error('❌ [EditResume] Invalid response:', data)
          navigate('/app/my-resumes')
          return
        }

        setJobTitle(job.job_title)
        setOriginalBlocks(blocks)
        setEditedBlocks(blocks) // Initialize edits with original
        setLayout(layoutData)
        setSelectedTemplate(job.template_used || 'A')

      } catch (err) {
        console.error('❌ Error loading job:', err)
        navigate('/app/my-resumes')
      } finally {
        setLoading(false)
      }
    }

    loadJobData()
  }, [jobId, navigate])

  // Real-time PDF preview
  const { pdfUrl, isGenerating } = useRealtimePDFPreview(
    editedBlocks,
    selectedTemplate as 'A' | 'B' | 'C' | 'D',
    layout
  )

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(editedBlocks) !== JSON.stringify(originalBlocks)
  }, [editedBlocks, originalBlocks])

  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Chrome requires this
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle template switch (preserves edits!)
  const handleTemplateSwitch = (newTemplate: string) => {
    setSelectedTemplate(newTemplate)
    // editedBlocks stays the same - edits preserved!
  }

  // Reset to AI version
  const handleReset = () => {
    if (confirm('Reset all edits to the original AI-generated version?')) {
      setEditedBlocks(originalBlocks)
    }
  }

  // Download edited PDF
  const handleDownload = () => {
    if (!pdfUrl) return

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `resume_${jobTitle.replace(/\s+/g, '_')}_edited.pdf`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    navigate(-1)
                  }
                } else {
                  navigate(-1)
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Editing: {jobTitle}</h1>
              <p className="text-xs text-muted-foreground">
                {hasUnsavedChanges ? '● Unsaved changes' : 'All changes saved in preview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Template Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Template {selectedTemplate}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleTemplateSwitch(template.id)}
                    className={selectedTemplate === template.id ? 'bg-primary/10' : ''}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-muted rounded overflow-hidden">
                        <img
                          src={template.previewThumb}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{template.name}</p>
                        {selectedTemplate === template.id && (
                          <p className="text-xs text-primary">Current</p>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to AI
            </Button>

            {/* Download Button */}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!pdfUrl || isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: 2-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Panel: Editor */}
        <EditableContentPanel
          blocks={editedBlocks}
          onBlocksChange={setEditedBlocks}
          layout={layout}
        />

        {/* Right Panel: PDF Preview */}
        <PDFPreviewPanel
          pdfUrl={pdfUrl}
          isGenerating={isGenerating}
          jobTitle={jobTitle}
        />
      </div>
    </div>
  )
}
