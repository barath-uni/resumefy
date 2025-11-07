import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Lock, Trash2, Eye, Upload as UploadIcon, Sparkles, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import { getUserResumes } from '../lib/uploadResume'
import { useNavigate } from 'react-router-dom'
import ResumeUpload from '../components/ResumeUpload'
import { getUserTier } from '../lib/paywall'

export default function MyResumesPage() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<{ tier: string; resumes_limit: number }>({ tier: 'free', resumes_limit: 1 })
  const navigate = useNavigate()

  useEffect(() => {
    const loadUserResumes = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Load user's tier info
        const tierInfo = await getUserTier(session.user.id)
        setUserTier({ tier: tierInfo.tier, resumes_limit: tierInfo.resumes_limit })

        // Load user's resumes
        const userResumes = await getUserResumes(session.user.id)
        if (userResumes) {
          setResumes(userResumes)
        }
      }
      setLoading(false)
    }

    loadUserResumes()
  }, [])

  const handleView = (resumeUrl: string) => {
    setPdfPreviewUrl(resumeUrl)
  }

  const handleDelete = async (resumeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this resume?')) {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)

      if (!error) {
        setResumes(resumes.filter(r => r.id !== resumeId))
      }
    }
  }

  const handleUploadSuccess = async (resumeId: string, fileUrl: string) => {
    if (user) {
      const userResumes = await getUserResumes(user.id)
      if (userResumes) {
        setResumes(userResumes)
      }
      setUploadModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                My Resumes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View, edit, and manage your uploaded resumes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Resume Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Upload New Resume Card - Highlighted Position */}
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-2 border-dashed border-primary/30 hover:border-primary/60 cursor-pointer group relative bg-primary/5 h-full">
                  <div className="aspect-[8.5/11] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
                      <Plus className="w-8 h-8 text-primary" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      Upload New Resume
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[160px] leading-relaxed">
                      Add your resume to get started
                    </p>
                  </div>

                  {/* Paywall Overlay - Resume limit based on tier */}
                  {resumes.length >= userTier.resumes_limit && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">
                          Upload more resumes
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3 max-w-[180px] mx-auto leading-relaxed">
                          {userTier.tier === 'free'
                            ? 'Free tier: 1 resume. Upgrade for more'
                            : `${userTier.tier.toUpperCase()}: ${userTier.resumes_limit} resumes max`}
                        </p>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/app/billing')
                          }}
                        >
                          {userTier.tier === 'free' ? 'Upgrade' : userTier.tier === 'pro' ? 'Upgrade to Max' : 'View Plans'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Your Resume</DialogTitle>
                <DialogDescription>
                  Upload your resume in PDF or DOCX format
                </DialogDescription>
              </DialogHeader>
              {user && <ResumeUpload userId={user.id} onUploadSuccess={handleUploadSuccess} />}
            </DialogContent>
          </Dialog>

          {/* Existing Resumes */}
          {resumes.map((resume, index) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (index + 1) * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full border-2 hover:border-primary/30 cursor-pointer relative">
                {/* Resume Preview Thumbnail - Clickable */}
                <div
                  className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 border-b border-border relative aspect-[8.5/11] group-hover:from-primary/5 group-hover:to-primary/10 transition-all"
                  onClick={() => handleView(resume.file_url)}
                >
                  {/* PDF Preview (if possible) or Icon */}
                  <div className="absolute inset-3 bg-card rounded shadow-md flex items-center justify-center border border-border/50 overflow-hidden group-hover:shadow-lg transition-shadow">
                    {resume.file_url ? (
                      <iframe
                        src={`${resume.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full pointer-events-none scale-[1.1]"
                        title={`Preview ${resume.file_name}`}
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Overlay on hover with action icons */}
                  <div className="absolute inset-3 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleView(resume.file_url)
                      }}
                      className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      title="View Resume"
                    >
                      <Eye className="w-5 h-5 text-gray-900" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(resume.id, e)
                      }}
                      className="w-10 h-10 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Resume Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm truncate mb-1">
                    {resume.file_name?.replace(/\.[^/.]+$/, '') || 'My Resume'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(resume.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}

        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setPdfPreviewUrl(null)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Resume Preview</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pdfPreviewUrl, '_blank')}
                >
                  Open in New Tab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfPreviewUrl(null)}
                  className="rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
