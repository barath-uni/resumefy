import { useParams } from 'react-router-dom'
import { useEffect, useState, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Plus, X, Link as LinkIcon, FileText, Sparkles, AlertCircle, Trash2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { PaywallModal } from '../components/PaywallModal'
import { checkCanGeneratePDF } from '../lib/paywall'
import { useToast } from '../hooks/use-toast'

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
  const { toast } = useToast()
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
  const [allJobs, setAllJobs] = useState<BulkJob[]>([])
  const [viewMode, setViewMode] = useState<'input' | 'table'>('input')

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'resume_limit' | 'jobs_limit' | 'pdf_generation'>('pdf_generation')
  const [paywallMessage, setPaywallMessage] = useState<string>('')

  // Delete state
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Expandable row state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // PDF Preview & Template Switcher state
  const [previewJob, setPreviewJob] = useState<BulkJob | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string>('A')
  const [isSwitchingTemplate, setIsSwitchingTemplate] = useState(false)

  // Debug preview job state
  useEffect(() => {
    console.log('🔍 previewJob state changed:', previewJob?.id || 'null')
  }, [previewJob])

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
            // Load existing jobs for this resume
            await loadExistingJobs()
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

  const loadExistingJobs = async () => {
    if (!resumeId) return

    const { data: jobs, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })

    if (jobs) {
      setAllJobs(jobs)
      setExistingJobsCount(count || 0)

      // Set viewMode based on whether jobs exist
      if (jobs.length > 0) {
        setViewMode('table')
      }

      // Check if any jobs are still generating
      const incompleteJobs = jobs.filter(
        job => job.generation_status === 'generating' || job.generation_status === 'pending'
      )

      if (incompleteJobs.length > 0) {
        console.log('🔄 Found', incompleteJobs.length, 'incomplete jobs, starting polling...')
        startContinuousPolling(incompleteJobs.map(j => j.id))
      }
    }
  }

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
        return
      }

      console.log('✅ Bulk generation started:', data.jobIds)

      // Start polling for results
      startPolling(data.jobIds)

    } catch (err) {
      console.error('❌ Unexpected error:', err)
      alert('Unexpected error: ' + (err as Error).message)
      setIsGenerating(false)
    }
  }

  const startPolling = async (jobIds: string[]) => {
    console.log('🔄 Starting polling for job IDs:', jobIds)

    const pollInterval = setInterval(async () => {
      try {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .in('id', jobIds)

        if (jobs) {
          setGeneratedJobs(jobs)

          // Check if all jobs are completed or failed
          const allDone = jobs.every(job =>
            job.generation_status === 'completed' || job.generation_status === 'failed'
          )

          if (allDone) {
            console.log('✅ All jobs completed')
            clearInterval(pollInterval)
            setIsGenerating(false)
            setViewMode('table')
            // Reload existing jobs count to update UI
            await loadExistingJobs()
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isGenerating) {
        console.log('⏱️ Polling timeout')
        setIsGenerating(false)
      }
    }, 300000)
  }

  // Continuous polling for incomplete jobs (used on page load)
  const startContinuousPolling = (jobIds: string[]) => {
    if (jobIds.length === 0) return

    console.log('🔁 Starting continuous polling for', jobIds.length, 'incomplete jobs')

    const pollInterval = setInterval(async () => {
      try {
        // Reload ALL jobs to update the table
        await loadExistingJobs()

        // Check if those specific jobs are still incomplete
        const { data: checkJobs } = await supabase
          .from('jobs')
          .select('generation_status')
          .in('id', jobIds)

        if (checkJobs) {
          const stillIncomplete = checkJobs.some(
            job => job.generation_status === 'generating' || job.generation_status === 'pending'
          )

          if (!stillIncomplete) {
            console.log('✅ All monitored jobs completed, stopping polling')
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('❌ Continuous polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      console.log('⏱️ Continuous polling timeout after 10 minutes')
    }, 600000)
  }

  const handleDeleteJob = async () => {
    if (!jobToDelete) return

    setIsDeleting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete jobs",
          variant: "destructive"
        })
        return
      }

      console.log('🗑️ Deleting job:', jobToDelete)

      const { data, error } = await supabase.functions.invoke('delete-job', {
        body: { jobId: jobToDelete },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error || !data?.success) {
        console.error('❌ Delete error:', error || data?.error)
        toast({
          title: "Failed to delete job",
          description: error?.message || data?.error || 'Unknown error',
          variant: "destructive"
        })
        return
      }

      console.log('✅ Job deleted successfully')

      // Show success toast
      toast({
        title: "Job deleted",
        description: "The job and all generated resumes have been removed",
      })

      // Reload jobs to update UI and counter
      await loadExistingJobs()

      // Close dialog
      setJobToDelete(null)
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      toast({
        title: "Unexpected error",
        description: (err as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSwitchTemplate = async (newTemplate: string) => {
    if (!previewJob || !userId) return

    setIsSwitchingTemplate(true)

    try {
      console.log('🔄 Switching template from', previewJob.template_used, 'to', newTemplate)

      // Call generate-tailored-resume with new template
      const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
        body: {
          jobId: previewJob.id,
          templateName: newTemplate
        }
      })

      if (error || !data?.success) {
        console.error('❌ Template switch error:', error || data?.error)
        toast({
          title: "Failed to switch template",
          description: error?.message || data?.error || 'Unknown error',
          variant: "destructive"
        })
        return
      }

      console.log('✅ Template switched successfully')

      toast({
        title: "Template switched",
        description: `Resume regenerated with Template ${newTemplate}`,
      })

      // Reload jobs to get updated PDF URL
      await loadExistingJobs()

      // Update preview with new template
      setPreviewTemplate(newTemplate)

      // Find and update the preview job
      const updatedJob = allJobs.find(j => j.id === previewJob.id)
      if (updatedJob) {
        setPreviewJob(updatedJob)
      }

    } catch (err) {
      console.error('❌ Unexpected error:', err)
      toast({
        title: "Unexpected error",
        description: (err as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsSwitchingTemplate(false)
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

  // Show results table if in table view mode
  if (viewMode === 'table') {
    const displayJobs = allJobs

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Generated Resumes</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All tailored resumes for this resume ({displayJobs.length} total)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  {userTier.toUpperCase()} - {existingJobsCount}/{maxJobs} used
                </Badge>
                <Button onClick={() => {
                  setViewMode('input')
                  setGeneratedJobs([])
                  setJobInputs([createEmptyJob()])
                }}>
                  Generate More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-semibold">#</th>
                    <th className="text-left p-4 text-sm font-semibold">Job Title</th>
                    <th className="text-left p-4 text-sm font-semibold">Template</th>
                    <th className="text-left p-4 text-sm font-semibold">Fit Score</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Created</th>
                    <th className="text-left p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayJobs.map((job, index) => {
                    const isExpanded = expandedJobId === job.id
                    return (
                      <Fragment key={job.id}>
                        <tr className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-sm text-muted-foreground">
                            <button
                              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>{index + 1}</span>
                            </button>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium">{job.job_title}</p>
                              {job.job_url && (
                                <a
                                  href={job.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View Job <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              Template {job.template_used || 'A'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {job.fit_score ? (
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-primary">{job.fit_score}%</div>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${job.fit_score}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {job.generation_status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                ✓ Ready
                              </Badge>
                            )}
                            {job.generation_status === 'generating' && (
                              <Badge variant="outline">
                                ⏳ Generating...
                              </Badge>
                            )}
                            {job.generation_status === 'failed' && (
                              <Badge variant="destructive">
                                ✗ Failed
                              </Badge>
                            )}
                            {job.generation_status === 'pending' && (
                              <Badge variant="secondary">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4">
                            {job.pdf_url && job.generation_status === 'completed' ? (
                              <div className="flex items-center gap-2">
                                {/* PDF Preview Thumbnail */}
                                <button
                                  onClick={() => {
                                    console.log('🖼️ Preview clicked:', job)
                                    setPreviewJob(job)
                                    setPreviewTemplate(job.template_used || 'A')
                                  }}
                                  className="relative group w-16 h-20 border-2 border-border rounded overflow-hidden hover:border-primary transition-colors"
                                >
                                  <iframe
                                    src={`${job.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                    title={`Preview ${job.job_title}`}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                    <span className="text-[10px] text-white font-medium">View</span>
                                  </div>
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setJobToDelete(job.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setJobToDelete(job.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${job.id}-expanded`} className="bg-muted/30 border-b">
                            <td colSpan={7} className="p-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Job Description
                                  </h4>
                                  <div className="text-sm text-muted-foreground bg-background rounded-md p-4 whitespace-pre-wrap border">
                                    {job.job_description || 'No description available'}
                                  </div>
                                </div>

                                {job.job_url && (
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">Job URL</h4>
                                    <a
                                      href={job.job_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      {job.job_url} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Template</h4>
                                    <p className="text-sm text-muted-foreground">Template {job.template_used || 'A'}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Created</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(job.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Status</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{job.generation_status}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {displayJobs.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <p>No generated resumes yet. Generate your first batch!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this job and all generated resumes. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteJob}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              <div className="grid grid-cols-3 gap-3">
                {['A', 'B', 'C'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                      selectedTemplate === template
                        ? 'border-primary shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                      <img
                        src={`/templates/template-${template.toLowerCase()}-thumb.svg`}
                        alt={`Template ${template}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`mt-2 text-center pb-2 ${
                      selectedTemplate === template ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}>
                      <p className="text-xs">Template {template}</p>
                    </div>
                    {selectedTemplate === template && (
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

      {/* PDF Preview & Template Switcher Modal */}
      {previewJob && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            console.log('🎯 Backdrop clicked')
            if (e.target === e.currentTarget) setPreviewJob(null)
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">{previewJob.job_title}</h2>
                <p className="text-sm text-muted-foreground">Resume Preview</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewJob(null)}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: PDF Preview */}
              <div className="flex-1 p-6 overflow-auto bg-muted/30">
                {isSwitchingTemplate ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Regenerating with Template {previewTemplate}...</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${previewJob.pdf_url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded-lg shadow-lg bg-white"
                    title={`Resume - ${previewJob.job_title}`}
                  />
                )}
              </div>

              {/* Right: Template Switcher & Actions */}
              <div className="w-80 border-l p-6 space-y-6 overflow-auto">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Switch Template</h3>
                  <div className="space-y-3">
                    {['A', 'B', 'C'].map((template) => (
                      <button
                        key={template}
                        onClick={() => handleSwitchTemplate(template)}
                        disabled={isSwitchingTemplate || previewJob.template_used === template}
                        className={`relative w-full group cursor-pointer rounded-lg border-2 transition-all p-3 text-left ${
                          previewJob.template_used === template
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isSwitchingTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img
                              src={`/templates/template-${template.toLowerCase()}-thumb.svg`}
                              alt={`Template ${template}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Template {template}</p>
                            {previewJob.template_used === template && (
                              <p className="text-xs text-primary">Current</p>
                            )}
                          </div>
                          {previewJob.template_used === template && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = previewJob.pdf_url!
                      link.download = `resume_${previewJob.job_title.replace(/\s+/g, '_')}.pdf`
                      link.click()
                    }}
                    disabled={isSwitchingTemplate}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(previewJob.pdf_url, '_blank')}
                    disabled={isSwitchingTemplate}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>

                {previewJob.fit_score && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3">Fit Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-primary">{previewJob.fit_score}%</div>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${previewJob.fit_score}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {previewJob.fit_score >= 80 ? 'Excellent match' : previewJob.fit_score >= 60 ? 'Good match' : 'Fair match'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
