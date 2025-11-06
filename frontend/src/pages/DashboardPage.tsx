import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, FileCheck, Clock, ArrowRight, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { ShimmerButton } from '../components/ui/shimmer-button'
import { Ripple } from '../components/ui/ripple'
import { RetroGrid } from '../components/ui/retro-grid'
import { supabase } from '../lib/supabase'
import { getUserResumes } from '../lib/uploadResume'
import { extractResumeText } from '../lib/parseResume'
import { analytics } from '../lib/analytics'
import { typography } from '../lib/typography'
import ResumeUpload from '../components/ResumeUpload'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentResume, setCurrentResume] = useState<any>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }
        setUser(session.user)
        const resumes = await getUserResumes(session.user.id)
        if (resumes && resumes.length > 0) { setCurrentResume(resumes[0]) }
        analytics.trackDashboardReached()
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally { setLoading(false) }
    }
    loadUserData()
  }, [])

  const handleUploadSuccess = async (resumeId: string, fileUrl: string) => {
    if (user) {
      const resumes = await getUserResumes(user.id)
      if (resumes && resumes.length > 0) { setCurrentResume(resumes[0]) }
      setIsExtracting(true)
      await extractResumeText(resumeId, fileUrl)
      setIsExtracting(false)
      setUploadModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
        <RetroGrid className="opacity-30" />
        <Ripple />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className={typography.h1 + " mb-3"}>Hi {userName}!</h1>
          <p className={typography.lead}>
            {currentResume
              ? "Your resume is ready. Let's tailor it for a specific job."
              : "Upload your resume to start tailoring it for jobs"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {!currentResume ? (
          /* Before Upload: Large, prominent upload section */
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg border-2">
              <CardContent className="pt-12 pb-12">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-16 text-center bg-muted/30 hover:border-primary/40 hover:bg-muted/50 transition-all">
                  <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-8 flex items-center justify-center border-2 border-primary/20">
                    <Upload className="w-12 h-12 text-primary" strokeWidth={2} />
                  </div>
                  <h2 className={typography.h2 + " mb-4"}>Upload Your Resume</h2>
                  <p className={typography.lead + " mb-10 max-w-xl mx-auto"}>
                    Get started by uploading your resume. We'll help you tailor it for specific job opportunities.
                  </p>
                  <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                    <DialogTrigger asChild>
                      <ShimmerButton className="h-16 px-12 text-lg font-semibold shadow-lg">
                        <Upload className="w-6 h-6 mr-3" />Upload Resume
                      </ShimmerButton>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Upload Your Resume</DialogTitle>
                        <DialogDescription className="text-base">Upload your resume in PDF or DOCX format to get started</DialogDescription>
                      </DialogHeader>
                      {user && <ResumeUpload userId={user.id} onUploadSuccess={handleUploadSuccess} existingResume={undefined} />}
                    </DialogContent>
                  </Dialog>
                  <p className={typography.muted + " mt-8"}>PDF or DOCX • Max 5MB</p>
                </div>

                {/* How it works section */}
                <div className="mt-16 max-w-2xl mx-auto">
                  <h3 className={typography.h3 + " text-center mb-8"}>How it works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground mx-auto mb-4 flex items-center justify-center font-bold text-lg">1</div>
                      <h4 className="font-semibold mb-2">Upload Resume</h4>
                      <p className="text-sm text-muted-foreground">Upload your current resume in PDF or DOCX format</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground mx-auto mb-4 flex items-center justify-center font-bold text-lg">2</div>
                      <h4 className="font-semibold mb-2">Add Job Description</h4>
                      <p className="text-sm text-muted-foreground">Paste the job description you're applying for</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground mx-auto mb-4 flex items-center justify-center font-bold text-lg">3</div>
                      <h4 className="font-semibold mb-2">Get Tailored Resume</h4>
                      <p className="text-sm text-muted-foreground">Receive an optimized resume tailored to the job</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isExtracting && (
              <div className="flex items-center justify-center gap-3 text-base text-muted-foreground mt-8 bg-muted/50 rounded-lg p-6">
                <Clock className="w-5 h-5 animate-spin" />
                <span className="font-medium">Analyzing your resume...</span>
              </div>
            )}
          </div>
        ) : (
          /* After Upload: Resume preview + tailoring action */
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Resume Preview Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Resume
                  </CardTitle>
                  <CardDescription>Current resume ready for tailoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resume Preview */}
                  <div className="relative bg-white rounded-xl border-2 border-border shadow-md overflow-hidden aspect-[8.5/11] max-w-[400px] mx-auto">
                    <div className="absolute inset-0">
                      {currentResume.file_url ? (
                        <iframe
                          src={currentResume.file_url}
                          className="w-full h-full"
                          title="Resume Preview"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-foreground/[0.03] to-foreground/[0.08] flex items-center justify-center p-8">
                          <div className="text-center">
                            <FileText className="w-24 h-24 text-muted-foreground/20 mx-auto mb-4" strokeWidth={1.5} />
                            <p className="text-sm text-muted-foreground font-medium">
                              {currentResume.original_filename || 'Resume uploaded'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 max-w-[400px] mx-auto">
                    {currentResume.file_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(currentResume.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />View Full
                      </Button>
                    )}
                    <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />Replace
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Upload Your Resume</DialogTitle>
                          <DialogDescription className="text-base">Upload a new version of your resume in PDF or DOCX format</DialogDescription>
                        </DialogHeader>
                        {user && <ResumeUpload userId={user.id} onUploadSuccess={handleUploadSuccess} existingResume={currentResume} />}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Next Step: Tailor Resume Card */}
              <Card className="shadow-sm bg-gradient-to-br from-blue-50 via-primary/5 to-teal-50 border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Next Step: Tailor Your Resume
                  </CardTitle>
                  <CardDescription>Optimize your resume for specific job opportunities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-primary/10">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Add a Job Description</h4>
                        <p className="text-sm text-muted-foreground">Paste the job posting you want to apply for</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-primary/10">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">AI-Powered Optimization</h4>
                        <p className="text-sm text-muted-foreground">Our AI tailors your resume to match the job requirements</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-primary/10">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Download & Apply</h4>
                        <p className="text-sm text-muted-foreground">Get your tailored resume and stand out</p>
                      </div>
                    </div>
                  </div>

                  <ShimmerButton
                    onClick={() => navigate(`/app/tailor/${currentResume.id}`)}
                    className="w-full h-14 text-base font-semibold shadow-lg"
                    background="hsl(var(--primary))"
                    shimmerColor="#ffffff"
                    shimmerSize="0.1em"
                  >
                    <FileCheck className="w-5 h-5 mr-2" />
                    Start Tailoring
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </ShimmerButton>
                </CardContent>
              </Card>
            </div>

            {isExtracting && (
              <div className="flex items-center justify-center gap-3 text-base text-muted-foreground bg-muted/50 rounded-lg p-6">
                <Clock className="w-5 h-5 animate-spin" />
                <span className="font-medium">Analyzing your resume...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
