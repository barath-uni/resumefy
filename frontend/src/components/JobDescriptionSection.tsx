import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Briefcase, Plus, Loader2, FileText, Download, Eye, AlertCircle } from 'lucide-react'

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

interface JobDescriptionSectionProps {
  resumeId: string
  userId: string
}

export default function JobDescriptionSection({ resumeId, userId }: JobDescriptionSectionProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load user's jobs
  useEffect(() => {
    loadJobs()
  }, [resumeId])

  const loadJobs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data)
    }
    setLoading(false)
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setJobTitle('')
      setJobDescription('')
      setJobUrl('')
      setShowAddForm(false)
    } else {
      alert('Failed to add job: ' + error?.message)
    }

    setIsSubmitting(false)
  }

  const handleGeneratePDF = async (jobId: string, templateName: string) => {
    // Update local state to show generating
    setJobs(jobs.map(j =>
      j.id === jobId
        ? { ...j, generation_status: 'generating' as const, template_used: templateName }
        : j
    ))

    // Call backend Edge Function
    const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
      body: { jobId, templateName }
    })

    if (error || !data.success) {
      alert('Failed to generate PDF: ' + (data?.error || error?.message))
      setJobs(jobs.map(j =>
        j.id === jobId ? { ...j, generation_status: 'failed' as const } : j
      ))
    } else {
      // Reload jobs to get updated status
      loadJobs()
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading jobs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">Job Applications</h2>
              <p className="text-sm text-gray-500">{jobs.length}/5 jobs added</p>
            </div>
          </div>
          {jobs.length < 5 && !showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium border-0 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </Button>
          )}
        </div>

        {/* Add Job Form */}
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddJob}
            className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job URL (Optional)
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium border-0"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Job'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs added yet</h3>
          <p className="text-gray-600 mb-4">
            Add a job description to generate tailored resumes for specific positions
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Job
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onGeneratePDF={handleGeneratePDF}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Job Card Component
function JobCard({ job, onGeneratePDF }: { job: Job; onGeneratePDF: (jobId: string, template: string) => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('A')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.job_title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Added {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={job.generation_status} />
      </div>

      {job.generation_status === 'pending' && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Pick a template:</p>
            <div className="grid grid-cols-3 gap-3">
              {['A', 'B', 'C'].map((template) => (
                <button
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedTemplate === template
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${
                      selectedTemplate === template ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium">Template {template}</p>
                    <p className="text-xs text-gray-500">
                      {template === 'A' && 'Single Column'}
                      {template === 'B' && 'Two Column'}
                      {template === 'C' && 'Modern Color'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onGeneratePDF(job.id, selectedTemplate)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium border-0"
          >
            🎨 Start Tailoring (Template {selectedTemplate})
          </Button>
        </>
      )}

      {job.generation_status === 'generating' && (
        <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-blue-900 font-medium">
            Generating your tailored resume... (Template {job.template_used})
          </span>
        </div>
      )}

      {job.generation_status === 'completed' && job.pdf_url && (
        <>
          {/* Fit Score Display */}
          {job.fit_score !== undefined && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Resume Fit Score</span>
                <span className={`text-2xl font-bold ${
                  job.fit_score >= 80 ? 'text-emerald-600' :
                  job.fit_score >= 60 ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {job.fit_score}%
                </span>
              </div>
              {job.fit_score_breakdown && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">Keywords</div>
                    <div className="font-medium text-gray-900">{job.fit_score_breakdown.keywords}/40</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Experience</div>
                    <div className="font-medium text-gray-900">{job.fit_score_breakdown.experience}/40</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Qualifications</div>
                    <div className="font-medium text-gray-900">{job.fit_score_breakdown.qualifications}/20</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Missing Skills */}
          {job.missing_skills && job.missing_skills.length > 0 && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">
                Missing Skills ({job.missing_skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.missing_skills.slice(0, 5).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white rounded-md text-xs font-medium text-orange-700 border border-orange-300"
                  >
                    {skill.skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PDF Download Section */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-medium text-emerald-900 mb-3">
              ✅ Tailored resume generated (Template {job.template_used})!
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.open(job.pdf_url, '_blank')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium border-0 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View PDF
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = job.pdf_url!
                  link.download = `resume_${job.job_title.replace(/\s+/g, '_')}_template_${job.template_used}.pdf`
                  link.click()
                }}
                variant="outline"
              className="flex-1 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
          </div>
        </>
      )}

      {job.generation_status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-900">
            Generation failed. Please try again or contact support.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-gray-100 text-gray-700',
    generating: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700'
  }

  const labels = {
    pending: 'Ready',
    generating: 'Generating...',
    completed: 'Completed',
    failed: 'Failed'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}
