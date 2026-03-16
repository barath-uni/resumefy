import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, MessageSquare, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { AddJobModal } from '../components/AddJobModal'
import { ChatPanel } from '../components/ChatPanel'
import { toast } from '../hooks/use-toast'

interface Job {
  id: string
  job_title: string
  job_description: string
  job_url?: string
  conversation_status: 'pending' | 'analyzing' | 'questioning' | 'processing' | 'ready' | 'error'
  match_score_initial?: number
  match_score_final?: number
  gaps_identified?: any[]
  conversation_history?: any[]
  pdf_url?: string
  created_at: string
}

export default function InterrogatorPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'max'>('free')
  const [maxJobs, setMaxJobs] = useState(5)

  useEffect(() => {
    loadData()
    setupRealtimeSubscription()
  }, [resumeId])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/app/my-resumes')
        return
      }

      // Get user tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.tier) {
        setUserTier(profile.tier as 'free' | 'pro' | 'max')
        const limits = { free: 5, pro: 30, max: 100 }
        setMaxJobs(limits[profile.tier as keyof typeof limits] || 5)
      }

      // Load jobs for this resume
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading jobs:', error)
        toast({
          title: 'Error',
          description: 'Failed to load jobs',
          variant: 'destructive'
        })
      } else {
        setJobs(jobsData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('jobs-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `resume_id=eq.${resumeId}` },
        (payload) => {
          console.log('Job updated:', payload)
          setJobs(prev => prev.map(job =>
            job.id === payload.new.id ? { ...job, ...payload.new } : job
          ))

          // Update selected job if it's the one that changed
          if (selectedJob?.id === payload.new.id) {
            setSelectedJob(prev => prev ? { ...prev, ...payload.new } : null)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const handleAddJob = () => {
    if (jobs.length >= maxJobs) {
      toast({
        title: 'Limit Reached',
        description: `You've reached your limit of ${maxJobs} jobs. Upgrade to add more.`,
        variant: 'destructive'
      })
      return
    }
    setShowAddModal(true)
  }

  const handleOpenChat = (job: Job) => {
    setSelectedJob(job)
    setShowChatPanel(true)
  }

  const handleCloseChat = () => {
    setShowChatPanel(false)
    setSelectedJob(null)
  }

  const getStatusBadge = (status: Job['conversation_status']) => {
    switch (status) {
      case 'analyzing':
        return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzing...</Badge>
      case 'questioning':
        return <Badge className="bg-orange-100 text-orange-700"><MessageSquare className="w-3 h-3 mr-1" />Needs Your Input</Badge>
      case 'processing':
        return <Badge className="bg-purple-100 text-purple-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing...</Badge>
      case 'ready':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/my-resumes')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Resumes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Resume Interrogator</h1>
            <p className="text-gray-600 mt-1">Chat with AI to tailor your resume for specific jobs</p>
          </div>
          <Button onClick={handleAddJob}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job Posting
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Jobs: {jobs.length}/{maxJobs} • Tier: {userTier.toUpperCase()}
        </div>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first job posting to start tailoring your resume with AI
          </p>
          <Button onClick={handleAddJob}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job Posting
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.job_title}</h3>
                    {getStatusBadge(job.conversation_status)}
                  </div>

                  {job.match_score_initial && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span>Match Score:</span>
                      {job.match_score_final ? (
                        <span className="font-semibold text-green-600">
                          {job.match_score_initial}% → {job.match_score_final}%
                          <span className="text-green-500 ml-1">
                            (+{job.match_score_final - job.match_score_initial}%)
                          </span>
                        </span>
                      ) : (
                        <span className="font-semibold">{job.match_score_initial}%</span>
                      )}
                    </div>
                  )}

                  {job.gaps_identified && job.gaps_identified.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{job.gaps_identified.length} gaps identified</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {job.conversation_status === 'questioning' && (
                    <Button onClick={() => handleOpenChat(job)}>
                      Continue Chat
                    </Button>
                  )}
                  {job.conversation_status === 'ready' && job.pdf_url && (
                    <Button variant="outline" asChild>
                      <a href={job.pdf_url} download>Download PDF</a>
                    </Button>
                  )}
                  {(job.conversation_status === 'ready' || job.conversation_status === 'processing') && (
                    <Button variant="ghost" onClick={() => handleOpenChat(job)}>
                      View Chat
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <AddJobModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          resumeId={resumeId!}
          onJobAdded={() => {
            setShowAddModal(false)
            loadData()
          }}
        />
      )}

      {/* Chat Panel */}
      {showChatPanel && selectedJob && (
        <ChatPanel
          job={selectedJob}
          onClose={handleCloseChat}
          onJobUpdated={loadData}
        />
      )}
    </div>
  )
}
