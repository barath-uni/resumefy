import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Plus, X, Link as LinkIcon, FileText, Sparkles, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PaywallModal } from '../components/PaywallModal'
import { checkCanGeneratePDF } from '../lib/paywall'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { templates } from '../lib/templateData'

interface JobInput {
  id: string
  title: string
  description: string
  url?: string
  isUrlMode: boolean
  error?: string
}

interface BulkJob {
  id: string
  job_title: string
  job_description: string
  job_url?: string
  generation_status: 'pending' | 'generating' | 'completed' | 'failed'
  pdf_url?: string
  fit_score?: number
  created_at: string
  template_used?: string
}

export default function TailoringPageV2() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'max'>('free')
  const [resumeExists, setResumeExists] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('A')

  // Job input state
  const [jobInputs, setJobInputs] = useState<JobInput[]>([])
  const [maxJobs, setMaxJobs] = useState(5)
  const [existingJobsCount, setExistingJobsCount] = useState(0)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedJobs, setGeneratedJobs] = useState<BulkJob[]>([])

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'resume_limit' | 'jobs_limit' | 'pdf_generation'>('pdf_generation')
  const [paywallMessage, setPaywallMessage] = useState<string>('')

  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressMessage, setProgressMessage] = useState('Preparing your resumes...')
  const [estimatedTime, setEstimatedTime] = useState(45)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }
        setUserId(session.user.id)

        // Get user tier
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('user_id', session.user.id)
          .single()

        if (profile?.tier) {
          setUserTier(profile.tier as 'free' | 'pro' | 'max')
          // Set max jobs based on tier
          const limits = { free: 5, pro: 25, max: 100 }
          setMaxJobs(limits[profile.tier as keyof typeof limits] || 5)
        }

        // Check if resume exists
        if (resumeId) {
          const { data: resume, error } = await supabase
            .from('resumes')
            .select('id')
            .eq('id', resumeId)
            .eq('user_id', session.user.id)
            .single()

          if (!error && resume) {
            setResumeExists(true)
            // Load existing jobs count for this resume
            const { count } = await supabase
              .from('jobs')
              .select('*', { count: 'exact', head: true })
              .eq('resume_id', resumeId)

            setExistingJobsCount(count || 0)
            // Initialize with 1 empty job slot
            setJobInputs([createEmptyJob()])
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

  const createEmptyJob = (): JobInput => ({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    description: '',
    url: '',
    isUrlMode: true
  })

  const addJobSlot = () => {
    if (jobInputs.length < maxJobs) {
      setJobInputs([...jobInputs, createEmptyJob()])
    }
  }

  const removeJobSlot = (id: string) => {
    setJobInputs(jobInputs.filter(job => job.id !== id))
  }

  const updateJob = (id: string, field: keyof JobInput, value: any) => {
    setJobInputs(jobInputs.map(job =>
      job.id === id ? { ...job, [field]: value, error: undefined } : job
    ))
  }

  const toggleInputMode = (id: string) => {
    setJobInputs(jobInputs.map(job =>
      job.id === id ? { ...job, isUrlMode: !job.isUrlMode } : job
    ))
  }

  const validateJobs = (): boolean => {
    let isValid = true
    const updatedJobs = jobInputs.map(job => {
      if (!job.title.trim()) {
        isValid = false
        return { ...job, error: 'Job title is required' }
      }
      if (job.isUrlMode && !job.url?.trim()) {
        isValid = false
        return { ...job, error: 'Job URL is required' }
      }
      if (!job.isUrlMode && !job.description.trim()) {
        isValid = false
        return { ...job, error: 'Job description is required' }
      }
      return job
    })

    setJobInputs(updatedJobs)
    return isValid
  }

  const handleBulkGenerate = async () => {
    if (!userId || !resumeId) return

    // Validate inputs
    if (!validateJobs()) {
      return
    }

    // Filter out empty jobs
    const validJobs = jobInputs.filter(job => job.title.trim())
    if (validJobs.length === 0) {
      alert('Please add at least one job description')
      return
    }

    console.log('🚀 Starting bulk generation for', validJobs.length, 'jobs')

    // Paywall check
    const paywallCheck = await checkCanGeneratePDF(userId)
    if (!paywallCheck.allowed) {
      console.log('❌ [Paywall] Bulk generation blocked:', paywallCheck.reason)
      setPaywallReason('pdf_generation')
      setPaywallMessage(paywallCheck.message || 'Upgrade to generate PDFs')
      setShowPaywall(true)
      return
    }

    setIsGenerating(true)
    setShowProgressModal(true)
    setProgressMessage('Analyzing job requirements...')
    setEstimatedTime(validJobs.length * 15) // ~15 seconds per job

    try {
      // Call bulk generation endpoint
      const { data, error } = await supabase.functions.invoke('bulk-generate-resumes', {
        body: {
          resumeId,
          jobs: validJobs.map(job => ({
            title: job.title,
            description: job.description,
            url: job.url
          })),
          templateName: selectedTemplate
        }
      })

      if (error || !data?.success) {
        console.error('❌ Bulk generation error:', error || data?.error)
        alert('Failed to start generation: ' + (error?.message || data?.error || 'Unknown error'))
        setIsGenerating(false)
        setShowProgressModal(false)
        return
      }

      console.log('✅ Bulk generation started:', data.jobIds)

      // Start polling for results
      startPolling(data.jobIds)

    } catch (err) {
      console.error('❌ Unexpected error:', err)
      alert('Unexpected error: ' + (err as Error).message)
      setIsGenerating(false)
      setShowProgressModal(false)
    }
  }

  const startPolling = async (jobIds: string[]) => {
    console.log('🔄 Starting polling for job IDs:', jobIds)

    const messages = [
      'Analyzing job requirements...',
      'Matching your skills to the role...',
      'Optimizing for ATS systems...',
      'Tailoring your experience...',
      'Generating professional PDF...'
    ]
    let messageIndex = 0

    // Rotate messages every 8 seconds
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setProgressMessage(messages[messageIndex])
    }, 8000)

    const pollInterval = setInterval(async () => {
      try {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .in('id', jobIds)

        if (jobs) {
          setGeneratedJobs(jobs)

          const completedCount = jobs.filter(j => j.generation_status === 'completed').length
          const totalCount = jobs.length

          // Update progress message with count
          setProgressMessage(`Tailoring resume ${completedCount + 1} of ${totalCount}...`)

          // Decrease estimated time
          setEstimatedTime(prev => Math.max(5, prev - 2))

          // Check if all jobs are completed or failed
          const allDone = jobs.every(job =>
            job.generation_status === 'completed' || job.generation_status === 'failed'
          )

          if (allDone) {
            console.log('✅ All jobs completed')
            clearInterval(pollInterval)
            clearInterval(messageInterval)
            setProgressMessage('All done! Redirecting...')

            // Brief delay before closing modal and navigating
            setTimeout(() => {
              setIsGenerating(false)
              setShowProgressModal(false)
              navigate(`/app/generated-resumes/${resumeId}`)
            }, 1000)
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      clearInterval(messageInterval)
      if (isGenerating) {
        console.log('⏱️ Polling timeout')
        setIsGenerating(false)
        setShowProgressModal(false)
        // Navigate anyway even if timeout
        navigate(`/app/generated-resumes/${resumeId}`)
      }
    }, 300000)
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

  const filledJobs = jobInputs.filter(job => job.title.trim()).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Bulk Tailor Resume</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                You have {maxJobs - existingJobsCount} job slots remaining
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                {userTier.toUpperCase()} - {existingJobsCount}/{maxJobs} used
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate(`/app/generated-resumes/${resumeId}`)}
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Job Input List */}
          <div className="col-span-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold">Add Job Descriptions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addJobSlot}
                  disabled={jobInputs.length >= maxJobs}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Job
                </Button>
              </div>

              <div className="space-y-4">
                {jobInputs.map((job, index) => (
                  <Card key={job.id} className="p-4 relative">
                    {/* Remove button */}
                    {jobInputs.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeJobSlot(job.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="space-y-3">
                      {/* Job Number */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Job {index + 1}</p>
                      </div>

                      {/* Job Title */}
                      <div>
                        <Input
                          placeholder="Job Title (e.g., Senior Software Engineer)"
                          value={job.title}
                          onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      {/* Toggle between URL and manual input */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={job.isUrlMode ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() => toggleInputMode(job.id)}
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Paste URL
                        </Button>
                        <Button
                          size="sm"
                          variant={!job.isUrlMode ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() => toggleInputMode(job.id)}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Paste Description
                        </Button>
                      </div>

                      {/* URL or Description input */}
                      {job.isUrlMode ? (
                        <Input
                          placeholder="https://linkedin.com/jobs/..."
                          value={job.url}
                          onChange={(e) => updateJob(job.id, 'url', e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <Textarea
                          placeholder="Paste the full job description here..."
                          value={job.description}
                          onChange={(e) => updateJob(job.id, 'description', e.target.value)}
                          rows={4}
                          className="text-sm"
                        />
                      )}

                      {/* Error message */}
                      {job.error && (
                        <div className="flex items-center gap-2 text-xs text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          {job.error}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Generate Button */}
              <div className="mt-6 pt-6 border-t">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBulkGenerate}
                  disabled={isGenerating || filledJobs === 0}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating {generatedJobs.filter(j => j.generation_status === 'completed').length}/{filledJobs} resumes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {filledJobs} Tailored Resume{filledJobs !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  This will generate {filledJobs} PDF{filledJobs !== 1 ? 's' : ''} using Template {selectedTemplate}
                </p>
              </div>
            </Card>
          </div>

          {/* Right: Template Selector & Instructions */}
          <div className="col-span-4 space-y-6">
            {/* Template Selector */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">Choose Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                      <img
                        src={template.previewThumb}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`mt-2 text-center pb-2 ${
                      selectedTemplate === template.id ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}>
                      <p className="text-xs">{template.name}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* How it works */}
            <Card className="p-6 sticky top-6">
              <h3 className="text-sm font-semibold mb-4">How it works</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Add jobs</p>
                    <p className="text-xs">Paste job URLs or descriptions for positions you're applying to</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Select template</p>
                    <p className="text-xs">Choose a professional template for your resumes</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Generate</p>
                    <p className="text-xs">AI tailors your resume for each job in 30-60 seconds</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Download</p>
                    <p className="text-xs">Get all tailored PDFs with fit scores and insights</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">💡 Pro Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use job URLs for automatic extraction</li>
                  <li>Add 5-10 jobs at once to save time</li>
                  <li>Check fit scores to prioritize applications</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason={paywallReason}
        currentTier={userTier}
        message={paywallMessage}
      />

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={() => {/* Prevent closing during generation */}}>
        <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
          <div className="py-8">
            {/* Header with icon */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                AI is Working...
              </h2>
              <p className="text-muted-foreground text-sm">
                {progressMessage}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <Progress
                value={generatedJobs.length > 0
                  ? (generatedJobs.filter(j => j.generation_status === 'completed').length / generatedJobs.length) * 100
                  : 0
                }
                className="h-3"
              />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-muted-foreground">
                  {generatedJobs.filter(j => j.generation_status === 'completed').length} of {generatedJobs.length || filledJobs} completed
                </span>
                <span className="text-muted-foreground">
                  ~{estimatedTime}s remaining
                </span>
              </div>
            </div>

            {/* Job status list */}
            <div className="space-y-3">
              {generatedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {job.generation_status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : job.generation_status === 'failed' ? (
                    <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : job.generation_status === 'generating' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {job.job_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.generation_status === 'completed' && '✓ Completed'}
                      {job.generation_status === 'failed' && '✗ Failed'}
                      {job.generation_status === 'generating' && 'Generating...'}
                      {job.generation_status === 'pending' && 'Pending'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Show placeholders if no jobs loaded yet */}
              {generatedJobs.length === 0 && jobInputs.filter(j => j.title.trim()).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Preparing...
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-center text-muted-foreground">
                💡 You can come back to this page in 2 minutes to view the generated resumes
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
