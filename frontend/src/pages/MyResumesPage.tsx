import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Lock, Trash2, Eye, Upload as UploadIcon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import { getUserResumes } from '../lib/uploadResume'
import { useNavigate } from 'react-router-dom'
import ResumeUpload from '../components/ResumeUpload'

export default function MyResumesPage() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUserResumes = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

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
    window.open(resumeUrl, '_blank')
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

                  {/* Paywall Overlay - Free tier limit */}
                  {resumes.length >= 1 && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-6 h-6 text-amber-600" />
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">
                          Upgrade to Pro
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3 max-w-[180px] mx-auto leading-relaxed">
                          Free tier allows 1 resume. Upgrade for unlimited resumes
                        </p>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/app/billing')
                          }}
                        >
                          Upgrade Now
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
              <Card className="overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 group h-full">
                {/* Resume Preview Thumbnail */}
                <div className="bg-muted/30 p-4 border-b border-border relative aspect-[8.5/11]">
                  <div className="absolute inset-3 bg-card rounded shadow-sm flex items-center justify-center border border-border/50">
                    <FileText className="w-12 h-12 text-muted-foreground/30" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Resume Info & Actions */}
                <div className="p-3">
                  <h3 className="font-medium text-foreground text-sm truncate mb-0.5">
                    {resume.file_name?.replace(/\.[^/.]+$/, '') || 'My Resume'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(resume.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleView(resume.file_url)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(resume.id, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

        </div>
      </div>
    </div>
  )
}
