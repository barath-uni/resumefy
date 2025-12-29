import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, X, Trash2, ChevronDown, ChevronRight, ExternalLink, Sparkles, Edit } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
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
import { useToast } from '../hooks/use-toast'
import { templates } from '../lib/templateData'
import { usePDFExport } from '../hooks/usePDFExport'

interface BulkJob {
  id: string
  job_title: string
  job_description: string
  job_url?: string
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
    importance: 'high' | 'medium' | 'low'
    reason: string
    suggestions: Array<{
      type: 'certification' | 'course' | 'bootcamp' | 'book' | 'practice'
      name: string
      provider: string
      estimatedTime: string
      cost: string
      link: string
    }>
  }>
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low'
    category: 'skill_gap' | 'content' | 'strategy' | 'network' | 'preparation'
    title: string
    description: string
    impact: string
    timeframe: string
  }>
  created_at: string
  template_used?: string
  tailored_json?: {
    blocks: any[]
    layout: any
  }
}

export default function GeneratedResumesPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { generatePDF } = usePDFExport()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'max'>('free')
  const [resumeExists, setResumeExists] = useState(false)
  const [allJobs, setAllJobs] = useState<BulkJob[]>([])
  const [maxJobs, setMaxJobs] = useState(5)
  const [existingJobsCount, setExistingJobsCount] = useState(0)

  // Delete state
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Expandable row state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // PDF Preview & Template Switcher state
  const [previewJob, setPreviewJob] = useState<BulkJob | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string>('A')
  const [isSwitchingTemplate, setIsSwitchingTemplate] = useState(false)


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
          }
        }
      } catch (error) {
        // Error loading page
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
      .select('*, fit_score_breakdown, missing_skills, recommendations', { count: 'exact' })
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })

    if (jobs) {
      // Parse JSONB data if it comes as string arrays
      const parsedJobs = jobs.map(job => {
        const parsed = { ...job }

        // Parse missing_skills if it's an array of strings
        if (Array.isArray(job.missing_skills) && job.missing_skills.length > 0 && typeof job.missing_skills[0] === 'string') {
          try {
            parsed.missing_skills = job.missing_skills.map((s: string) => JSON.parse(s))
          } catch (e) {
            // Failed to parse missing_skills
          }
        }

        // Parse recommendations if it's an array of strings
        if (Array.isArray(job.recommendations) && job.recommendations.length > 0 && typeof job.recommendations[0] === 'string') {
          try {
            parsed.recommendations = job.recommendations.map((s: string) => JSON.parse(s))
          } catch (e) {
            // Failed to parse recommendations
          }
        }

        return parsed
      })

      setAllJobs(parsedJobs)
      setExistingJobsCount(count || 0)

      // Check if any jobs are still generating
      const incompleteJobs = jobs.filter(
        job => job.generation_status === 'generating' || job.generation_status === 'pending'
      )

      if (incompleteJobs.length > 0) {
        startContinuousPolling(incompleteJobs.map(j => j.id))
      }
    }
  }

  // Continuous polling for incomplete jobs (used on page load)
  const startContinuousPolling = (jobIds: string[]) => {
    if (jobIds.length === 0) return

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

  const handleSwitchTemplate = async (newTemplate: string, targetJob?: BulkJob) => {
    const jobToSwitch = targetJob || previewJob
    if (!jobToSwitch || !userId) return

    setIsSwitchingTemplate(true)

    try {
      // ALWAYS fetch fresh content from backend (don't trust database tailored_json - it might be in pdfmake format)
      const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
        body: {
          jobId: jobToSwitch.id,
          templateName: newTemplate,
          returnContentOnly: true // Signal we only want the content, not PDF rendering
        }
      })

      if (error || !data?.success) {
        console.error('❌ [Frontend PDF] Backend error:', error, data)
        throw new Error(error?.message || data?.error || 'Failed to fetch resume content')
      }

      // Extract blocks and layout from backend response
      const blocks = data.tailoredContent?.blocks
      const layout = data.tailoredContent?.layout

      if (!blocks || !layout) {
        console.error('❌ [Frontend PDF] Invalid response:', data)
        throw new Error('Backend did not return tailored content')
      }

      // ALWAYS use Frontend PDF Generation

      const pdfBlob = await generatePDF({
        templateId: newTemplate as 'A' | 'B' | 'C' | 'D',
        blocks: blocks,
        layout: layout
      })

      if (!pdfBlob) {
        throw new Error('Failed to generate PDF')
      }

      // Convert blob to object URL for preview (NO UPLOAD - just in-memory preview)
      const pdfObjectUrl = URL.createObjectURL(pdfBlob)

      // Update the job in the list
      const updatedJobs = allJobs.map(j =>
        j.id === jobToSwitch.id
          ? { ...j, template_used: newTemplate, pdf_url: pdfObjectUrl }
          : j
      )
      setAllJobs(updatedJobs)

      // If this is the preview job, update it too
      if (previewJob?.id === jobToSwitch.id) {
        setPreviewTemplate(newTemplate)
        setPreviewJob({
          ...jobToSwitch,
          template_used: newTemplate,
          pdf_url: pdfObjectUrl
        })
      }
      toast({
        title: "Template switched",
        description: `Resume regenerated with Template ${newTemplate}`,
      })

    } catch (err) {
      console.error('❌ [Frontend PDF] Error:', err)
      toast({
        title: "Failed to switch template",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Generated Resumes</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                All tailored resumes for this resume ({allJobs.length} total)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                {userTier.toUpperCase()} - {existingJobsCount}/{maxJobs} used
              </Badge>
              <Button onClick={() => navigate(`/app/tailor/${resumeId}`)}>
                <Sparkles className="w-4 h-4 mr-2" />
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
                {allJobs.map((job, index) => {
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
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-primary">{job.fit_score}%</div>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${job.fit_score}%` }}
                                  />
                                </div>
                                {job.fit_score >= 80 ? '🟢' : job.fit_score >= 60 ? '🟡' : '🔴'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {job.missing_skills && Array.isArray(job.missing_skills) && job.missing_skills.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-amber-600">⚠️</span>
                                    {job.missing_skills.length} skill{job.missing_skills.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {job.recommendations && Array.isArray(job.recommendations) && job.recommendations.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-blue-600">💡</span>
                                    {job.recommendations.length} tip{job.recommendations.length !== 1 ? 's' : ''}
                                  </span>
                                )}
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
                                variant="outline"
                                onClick={() => navigate(`/app/edit-resume/${job.id}`)}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
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
                        <tr key={`${job.id}-expanded`} className="bg-gradient-to-br from-muted/30 to-muted/10 border-b">
                          <td colSpan={7} className="p-6">
                            <div className="space-y-6">
                              {/* Top Section: Mini-Cards Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Fit Score Card */}
                                {job.fit_score && (
                                  <Card className="p-4 bg-background/80 backdrop-blur-sm border-2">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fit Score</h4>
                                        {job.fit_score >= 80 ? '🟢' : job.fit_score >= 60 ? '🟡' : '🔴'}
                                      </div>
                                      <div className="text-4xl font-bold text-primary">{job.fit_score}%</div>
                                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                                          style={{ width: `${job.fit_score}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {job.fit_score >= 80 ? 'Excellent match' : job.fit_score >= 60 ? 'Good match' : 'Needs improvement'}
                                      </p>

                                      {/* Breakdown */}
                                      {job.fit_score_breakdown && (
                                        <div className="pt-3 border-t space-y-2">
                                          <p className="text-xs font-medium text-muted-foreground">Breakdown</p>
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                              <span>Keywords</span>
                                              <span className="font-medium">{job.fit_score_breakdown.keywords}%</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span>Experience</span>
                                              <span className="font-medium">{job.fit_score_breakdown.experience}%</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span>Qualifications</span>
                                              <span className="font-medium">{job.fit_score_breakdown.qualifications}%</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                )}

                                {/* Template Picker Card */}
                                <Card className="p-4 bg-background/80 backdrop-blur-sm border-2 border-primary/20">
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template Picker</h4>
                                    <p className="text-sm text-muted-foreground">Switch between styles</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {templates.map((template) => (
                                        <button
                                          key={template.id}
                                          onClick={() => handleSwitchTemplate(template.id, job)}
                                          disabled={isSwitchingTemplate || job.template_used === template.id}
                                          className={`relative rounded-lg border-2 p-2 text-left transition-all ${
                                            job.template_used === template.id
                                              ? 'border-primary bg-primary/5'
                                              : 'border-border hover:border-primary/50'
                                          } ${isSwitchingTemplate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                                              <img
                                                src={template.previewThumb}
                                                alt={template.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium truncate">{template.id}</p>
                                              {job.template_used === template.id && (
                                                <p className="text-[10px] text-primary">Active</p>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </Card>

                                {/* Download Card */}
                                {job.pdf_url && (
                                  <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border-2 border-primary/30">
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ready to Use</h4>
                                      <p className="text-sm text-muted-foreground">Your tailored resume</p>
                                      <div className="space-y-2">
                                        <Button
                                          className="w-full"
                                          size="lg"
                                          onClick={() => {
                                            const link = document.createElement('a')
                                            link.href = job.pdf_url!
                                            link.download = `resume_${job.job_title.replace(/\s+/g, '_')}.pdf`
                                            link.click()
                                          }}
                                        >
                                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          Download PDF
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            setPreviewJob(job)
                                            setPreviewTemplate(job.template_used || 'A')
                                          }}
                                        >
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          Preview
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                )}
                              </div>

                              {/* Skills & Recommendations Section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Missing Skills */}
                                {job.missing_skills && Array.isArray(job.missing_skills) && job.missing_skills.length > 0 && (
                                  <Card className="p-4 bg-background/80">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                          <span className="text-amber-600">⚠️</span>
                                          Add These Skills
                                        </h4>
                                        <Badge variant="secondary" className="text-xs">
                                          {job.missing_skills.length}
                                        </Badge>
                                      </div>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {job.missing_skills.slice(0, 5).map((skill, idx) => (
                                          <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{skill.skill}</p>
                                              <p className="text-xs text-muted-foreground line-clamp-1">{skill.reason}</p>
                                            </div>
                                            <Badge
                                              variant={skill.importance === 'high' ? 'destructive' : skill.importance === 'medium' ? 'default' : 'secondary'}
                                              className="text-[10px] flex-shrink-0"
                                            >
                                              {skill.importance}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                      {job.missing_skills.length > 5 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            setPreviewJob(job)
                                            setPreviewTemplate(job.template_used || 'A')
                                          }}
                                        >
                                          View all {job.missing_skills.length} skills →
                                        </Button>
                                      )}
                                    </div>
                                  </Card>
                                )}

                                {/* Recommendations */}
                                {job.recommendations && Array.isArray(job.recommendations) && job.recommendations.length > 0 && (
                                  <Card className="p-4 bg-background/80">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                          <span className="text-blue-600">💡</span>
                                          Quick Wins
                                        </h4>
                                        <Badge variant="secondary" className="text-xs">
                                          {job.recommendations.length}
                                        </Badge>
                                      </div>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {job.recommendations
                                          .sort((a, b) => {
                                            const priorityOrder = { high: 0, medium: 1, low: 2 }
                                            return priorityOrder[a.priority] - priorityOrder[b.priority]
                                          })
                                          .slice(0, 5)
                                          .map((rec, idx) => (
                                          <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium line-clamp-1">{rec.title}</p>
                                              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                <span>{rec.timeframe}</span>
                                                <span>•</span>
                                                <span className="line-clamp-1">{rec.impact}</span>
                                              </p>
                                            </div>
                                            <Badge
                                              variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                              className="text-[10px] flex-shrink-0"
                                            >
                                              {rec.priority}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                      {job.recommendations.length > 5 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            setPreviewJob(job)
                                            setPreviewTemplate(job.template_used || 'A')
                                          }}
                                        >
                                          View all {job.recommendations.length} tips →
                                        </Button>
                                      )}
                                    </div>
                                  </Card>
                                )}
                              </div>

                              {/* Job Description Section */}
                              {(job.job_description || job.job_url) && (
                                <details className="group">
                                  <summary className="cursor-pointer list-none">
                                    <Card className="p-4 bg-background/80 hover:bg-background transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="text-sm font-semibold">Job Details</h4>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            View original job description
                                            {job.job_url && ' and posting link'}
                                          </p>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
                                      </div>
                                    </Card>
                                  </summary>
                                  <Card className="mt-2 p-4 bg-background/80 border-t-0 rounded-t-none">
                                    <div className="space-y-4">
                                      {job.job_url && (
                                        <div>
                                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Job Posting
                                          </h5>
                                          <a
                                            href={job.job_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            {job.job_url}
                                          </a>
                                        </div>
                                      )}
                                      {job.job_description && (
                                        <div>
                                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Description
                                          </h5>
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto p-3 bg-muted/30 rounded-lg border">
                                            {job.job_description}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </details>
                              )}
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

          {allJobs.length === 0 && (
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

      {/* PDF Preview & Template Switcher Modal */}
      {previewJob && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
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
                    key={`${previewJob.id}-${previewJob.template_used}`}
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
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSwitchTemplate(template.id)}
                        disabled={isSwitchingTemplate || previewJob.template_used === template.id}
                        className={`relative w-full group cursor-pointer rounded-lg border-2 transition-all p-3 text-left ${
                          previewJob.template_used === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isSwitchingTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img
                              src={template.previewThumb}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{template.name}</p>
                            {previewJob.template_used === template.id && (
                              <p className="text-xs text-primary">Current</p>
                            )}
                          </div>
                          {previewJob.template_used === template.id && (
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
                  <div className="pt-6 border-t space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Fit Score</h3>
                      <div className="flex items-center gap-3 mb-3">
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

                      {/* Fit Score Breakdown */}
                      {previewJob.fit_score_breakdown && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Score Breakdown</p>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Keywords Match</span>
                                <span className="font-medium">{previewJob.fit_score_breakdown.keywords}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${previewJob.fit_score_breakdown.keywords}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Experience Match</span>
                                <span className="font-medium">{previewJob.fit_score_breakdown.experience}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${previewJob.fit_score_breakdown.experience}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Qualifications Match</span>
                                <span className="font-medium">{previewJob.fit_score_breakdown.qualifications}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500"
                                  style={{ width: `${previewJob.fit_score_breakdown.qualifications}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Missing Skills Section */}
                {previewJob.missing_skills && previewJob.missing_skills.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Skills to Develop
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {previewJob.missing_skills.length}
                      </Badge>
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {previewJob.missing_skills.map((skill, idx) => (
                        <div key={idx} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{skill.skill}</p>
                              <p className="text-xs text-muted-foreground mt-1">{skill.reason}</p>
                            </div>
                            <Badge
                              variant={skill.importance === 'high' ? 'destructive' : skill.importance === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {skill.importance}
                            </Badge>
                          </div>

                          {skill.suggestions && skill.suggestions.length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-primary hover:underline">
                                View learning resources ({skill.suggestions.length})
                              </summary>
                              <div className="mt-2 space-y-2 pl-2">
                                {skill.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                                  <div key={sIdx} className="border-l-2 border-primary/20 pl-2">
                                    <p className="font-medium">{suggestion.name}</p>
                                    <p className="text-muted-foreground">{suggestion.provider}</p>
                                    <div className="flex gap-2 mt-1">
                                      <span className="text-muted-foreground">⏱️ {suggestion.estimatedTime}</span>
                                      <span className="text-muted-foreground">💰 {suggestion.cost}</span>
                                    </div>
                                    {suggestion.link && (
                                      <a
                                        href={suggestion.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                      >
                                        Learn more
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations Section */}
                {previewJob.recommendations && previewJob.recommendations.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        Recommendations
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {previewJob.recommendations.length}
                      </Badge>
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {previewJob.recommendations
                        .sort((a, b) => {
                          const priorityOrder = { high: 0, medium: 1, low: 2 }
                          return priorityOrder[a.priority] - priorityOrder[b.priority]
                        })
                        .map((rec, idx) => (
                        <div key={idx} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{rec.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                            </div>
                            <Badge
                              variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Impact: {rec.impact}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {rec.timeframe}
                            </span>
                          </div>
                        </div>
                      ))}
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
