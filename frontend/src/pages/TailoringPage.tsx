import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Languages, Plus, Briefcase, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import TemplatePicker from '../components/TemplatePicker'
import { PaywallModal } from '../components/PaywallModal'
import { checkCanGeneratePDF, checkCanAddJob } from '../lib/paywall'

interface Job {
  id: string
  job_title: string
  job_description: string
  job_url?: string
  template_used?: string
  generation_status: 'pending' | 'generating' | 'completed' | 'failed'
  pdf_url?: string
  fit_score?: number
  fit_score_breakdown?: {
    keywords: number
    experience: number
    qualifications: number
  }
  missing_skills?: Array<{
    skill: string
    importance: string
    suggestions: any[]
  }>
  recommendations?: Array<{
    priority: string
    title: string
    description: string
  }>
  created_at: string
}

export default function TailoringPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeExists, setResumeExists] = useState(false)

  // Job management
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [showAddJobForm, setShowAddJobForm] = useState(false)

  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState('A')

  // Cache tracking - Map of jobId+template to cached PDF URL
  const [cachedPDFs, setCachedPDFs] = useState<Record<string, string>>({})

  // Track if currently generating (local state, not from DB)
  const [isGenerating, setIsGenerating] = useState(false)

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'resume_limit' | 'jobs_limit' | 'pdf_generation'>('pdf_generation')
  const [paywallMessage, setPaywallMessage] = useState<string>('')
  const [paywallCurrent, setPaywallCurrent] = useState<number | undefined>()
  const [paywallLimit, setPaywallLimit] = useState<number | undefined>()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }
        setUserId(session.user.id)

        if (resumeId) {
          const { data: resume, error } = await supabase
            .from('resumes')
            .select('id')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single()

          if (!error && resume) {
            setResumeExists(true)
            loadJobs(resumeId)
          }
        }
      } catch (error) {
        console.error('Error loading tailoring page:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [resumeId])

  const loadJobs = async (resumeId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data)
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].id)
      }

      // Load cached PDFs for all jobs
      await loadCachedPDFs(data.map(j => j.id))
    }
  }

  const loadCachedPDFs = async (jobIds: string[]) => {
    // Get tailored_content_cache entries for these jobs
    const { data: contentCache } = await supabase
      .from('tailored_content_cache')
      .select('id, job_id')
      .in('job_id', jobIds)

    if (!contentCache || contentCache.length === 0) return

    // Get all generated_resumes for these content cache IDs
    const { data: generatedResumes } = await supabase
      .from('generated_resumes')
      .select('tailored_content_id, template_id, pdf_url')
      .in('tailored_content_id', contentCache.map(c => c.id))

    if (!generatedResumes) return

    // Build a map of jobId+template -> pdf_url
    const pdfMap: Record<string, string> = {}
    generatedResumes.forEach(gr => {
      const contentEntry = contentCache.find(c => c.id === gr.tailored_content_id)
      if (contentEntry) {
        const key = `${contentEntry.job_id}-${gr.template_id}`
        pdfMap[key] = gr.pdf_url
      }
    })

    setCachedPDFs(pdfMap)
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !resumeId) return

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        job_title: jobTitle,
        job_description: jobDescription,
        job_url: jobUrl || null,
        generation_status: 'pending'
      })
      .select()
      .single()

    if (!error && data) {
      setJobs([data, ...jobs])
      setSelectedJobId(data.id)
      setJobTitle('')
      setJobDescription('')
      setJobUrl('')
      setShowAddJobForm(false)
    }

    setIsSubmitting(false)
  }

  const handleGenerateResume = async () => {
    if (!selectedJobId || !userId) return

    console.log('🚀 Starting resume generation for job:', selectedJobId)

    // ============================
    // PAYWALL CHECK - Frontend Layer
    // ============================
    console.log('🔒 [Paywall] Checking if user can generate PDF...')
    const paywallCheck = await checkCanGeneratePDF(userId)

    if (!paywallCheck.allowed) {
      console.log('❌ [Paywall] PDF generation blocked:', paywallCheck.reason)
      setPaywallReason('pdf_generation')
      setPaywallMessage(paywallCheck.message || 'Upgrade to generate PDFs')
      setShowPaywall(true)
      return // STOP HERE - Don't even call backend
    }

    console.log('✅ [Paywall] User authorized to generate PDF (tier:', paywallCheck.tier, ')')

    // Set local generating state (don't update DB status)
    setIsGenerating(true)

    try {
      // Call backend Edge Function
      console.log('📡 Calling backend with:', { jobId: selectedJobId, templateName: selectedTemplate })

      const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
        body: { jobId: selectedJobId, templateName: selectedTemplate }
      })

      console.log('📥 Backend response:', { data, error })

      // Check for paywall error from backend (double-check)
      if (error?.message?.includes('payment_required') || data?.error === 'payment_required') {
        console.log('❌ [Paywall] Backend also blocked PDF generation')
        setPaywallReason('pdf_generation')
        setPaywallMessage(data?.paywall?.message || 'Upgrade to generate PDFs')
        setShowPaywall(true)
        setIsGenerating(false)
        return
      }

      if (error) {
        console.error('❌ Supabase function error:', error)
        alert('Failed to generate PDF: ' + error.message)
        setIsGenerating(false)
        return
      }

      if (!data || !data.success) {
        console.error('❌ Backend returned failure:', data)
        alert('Failed to generate PDF: ' + (data?.error || 'Unknown error'))
        setIsGenerating(false)
        return
      }

      console.log('✅ Success! Updating cache...')

      // Update cached PDF map immediately with the returned URL
      if (data.pdfUrl) {
        const cacheKey = `${selectedJobId}-${selectedTemplate}`
        setCachedPDFs(prev => ({
          ...prev,
          [cacheKey]: data.pdfUrl
        }))
      }

      // Reload jobs to get updated fit scores and other metadata
      await loadJobs(resumeId!)
      console.log('✅ Jobs reloaded')

      // Clear generating state
      setIsGenerating(false)
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      alert('Unexpected error: ' + (err as Error).message)
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId || !resumeId || !resumeExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Resume not found</p>
        </div>
      </div>
    )
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId)

  // Check if PDF exists for selected job + template
  const cachedPDFKey = selectedJobId && selectedTemplate ? `${selectedJobId}-${selectedTemplate}` : null
  const cachedPDFUrl = cachedPDFKey ? cachedPDFs[cachedPDFKey] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Tailor Resume</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a job and template to generate your tailored resume
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Languages className="w-4 h-4" />
              English
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: Job Descriptions List */}
          <div className="col-span-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Job Descriptions</h3>
                <Dialog open={showAddJobForm} onOpenChange={setShowAddJobForm}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Job Description</DialogTitle>
                      <DialogDescription>
                        Add a job description to tailor your resume for this position
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddJob} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Job Title *</label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Job Description *</label>
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
                          rows={6}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Job URL (Optional)</label>
                        <input
                          type="url"
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? 'Adding...' : 'Add Job'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddJobForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Job List */}
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground mb-3">No jobs added yet</p>
                  <Button size="sm" onClick={() => setShowAddJobForm(true)}>
                    Add First Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job, index) => (
                    <Card
                      key={job.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedJobId === job.id
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {job.job_title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {job.fit_score && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {job.fit_score}% fit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* MIDDLE: Template Picker */}
          <div className="col-span-5">
            {cachedPDFUrl ? (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Template Selection</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['A', 'B', 'C'].map((templateId) => {
                    const cacheKey = selectedJobId ? `${selectedJobId}-${templateId}` : null
                    const hasCached = cacheKey && cachedPDFs[cacheKey]

                    return (
                      <Card
                        key={templateId}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedTemplate === templateId
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTemplate(templateId)}
                      >
                        <div className="aspect-[8.5/11] bg-muted/30 rounded mb-2" />
                        <h4 className="text-xs font-semibold mb-1">Template {templateId}</h4>
                        {hasCached && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Generated
                          </Badge>
                        )}
                      </Card>
                    )
                  })}
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    ✓ Resume already generated for this template
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    View it in the preview panel →
                  </p>
                </div>
              </Card>
            ) : (
              <TemplatePicker
                selectedTemplateId={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
                onConfirm={handleGenerateResume}
                isGenerating={isGenerating}
                compact={true}
              />
            )}
          </div>

          {/* RIGHT: Preview Panel */}
          <div className="col-span-4">
            <Card className="sticky top-6 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Resume Preview</h3>

              {!selectedJob ? (
                <div className="aspect-[8.5/11] bg-muted/30 rounded flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Select a job to preview</p>
                </div>
              ) : cachedPDFUrl || (selectedJob.generation_status === 'completed' && selectedJob.pdf_url) ? (
                <div className="space-y-4">
                  {/* PDF Preview iframe */}
                  <div className="aspect-[8.5/11] bg-muted/30 rounded overflow-hidden border border-border">
                    <iframe
                      src={cachedPDFUrl || selectedJob.pdf_url}
                      className="w-full h-full"
                      title="Resume Preview"
                    />
                  </div>

                  {/* Fit Score */}
                  {selectedJob.fit_score && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">Fit Score</span>
                        <span className="text-lg font-bold text-primary">{selectedJob.fit_score}%</span>
                      </div>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => window.open(cachedPDFUrl || selectedJob.pdf_url, '_blank')}
                    >
                      View PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = cachedPDFUrl || selectedJob.pdf_url!
                        link.download = `resume_${selectedJob.job_title.replace(/\s+/g, '_')}_template_${selectedTemplate}.pdf`
                        link.click()
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="aspect-[8.5/11] bg-muted/30 rounded flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Generating resume...</p>
                    <p className="text-[10px] text-muted-foreground mt-1">This may take 10-20 seconds</p>
                  </div>
                </div>
              ) : selectedJob.generation_status === 'failed' ? (
                <div className="aspect-[8.5/11] bg-destructive/10 rounded flex items-center justify-center border border-destructive/20">
                  <div className="text-center p-4">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-xs text-destructive font-medium">Generation Failed</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        setJobs(jobs.map(j =>
                          j.id === selectedJobId ? { ...j, generation_status: 'pending' as const } : j
                        ))
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[8.5/11] bg-muted/30 rounded flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Select template and generate</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason={paywallReason}
        currentTier="free"
        current={paywallCurrent}
        limit={paywallLimit}
        message={paywallMessage}
      />
    </div>
  )
}
