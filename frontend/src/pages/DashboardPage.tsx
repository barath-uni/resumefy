import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, Sparkles, Mail, FileCheck, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
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

  const resumeScore = 84
  const progressMetrics = [
    { icon: FileText, label: 'Resume building', value: currentResume ? 84 : 0, status: currentResume ? 'active' : 'pending' },
    { icon: FileCheck, label: 'Resume tailoring', value: 0, status: 'pending' },
    { icon: Mail, label: 'Resume distribution', value: 0, status: 'pending' },
    { icon: Sparkles, label: 'Cover letter crafting', value: 0, status: 'pending' }
  ]

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
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className={typography.h1 + " mb-3"}>Hi {userName}!</h1>
          <p className={typography.lead}>What is your goal today?</p>
          <div className="flex gap-3 mt-8">
            <Button variant="default" size="lg" className="rounded-full font-semibold shadow-sm">Resume building</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {progressMetrics.map((metric, index) => {
                const Icon = metric.icon
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={"w-12 h-12 rounded-xl flex items-center justify-center transition-colors " + (metric.status === 'active' ? 'bg-primary/10 border border-primary/20' : 'bg-muted border border-border')}>
                          <Icon className={"w-6 h-6 " + (metric.status === 'active' ? 'text-primary' : 'text-muted-foreground')} strokeWidth={2} />
                        </div>
                        <span className="font-medium text-foreground text-base">{metric.label}</span>
                      </div>
                      <span className="text-3xl font-bold text-foreground tabular-nums">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-2.5" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className={"shadow-sm " + (currentResume ? 'bg-gradient-to-br from-blue-50 via-primary/5 to-teal-50' : '')}>
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20 font-medium px-3 py-1">Resume building</Badge>
                  <CardTitle className={typography.h3 + " mb-3"}>{currentResume ? "You are almost in the top 10 percent" : "Lets build your resume"}</CardTitle>
                  <CardDescription className="leading-relaxed">{currentResume ? 'Great work. Your resume is strong! Add one more element for the perfect score.' : 'Upload your resume to get started with AI-powered optimization'}</CardDescription>
                </div>
                {currentResume && (
                  <div className="flex flex-col items-center ml-4">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-2 shadow-lg border-4 border-white">
                      <span className="text-2xl font-bold text-primary-foreground tabular-nums">{resumeScore}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold tracking-wide">Resume Score</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {currentResume ? (
                <div className="space-y-6">
                  <div className="relative bg-white rounded-xl border-2 border-border shadow-md overflow-hidden aspect-[8.5/11] max-w-[320px]">
                    <div className="absolute inset-0 p-6">
                      <div className="w-full h-full bg-gradient-to-b from-foreground/[0.03] to-foreground/[0.08] rounded-lg flex items-center justify-center">
                        <FileText className="w-24 h-24 text-muted-foreground/20" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl p-5 border-2 border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" strokeWidth={2} />
                      </div>
                      <span className="font-semibold text-foreground text-base">Add skills</span>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary font-bold px-3 py-1 text-sm">+4%</Badge>
                  </div>
                  <div className="pt-2">
                    <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full h-12 text-base font-medium" size="lg">
                          <Upload className="w-5 h-5 mr-2" />Replace Resume
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center bg-muted/30 hover:border-primary/40 hover:bg-muted/50 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center border-2 border-border">
                      <Upload className="w-10 h-10 text-muted-foreground" strokeWidth={2} />
                    </div>
                    <h3 className={typography.h4 + " mb-3"}>No resume uploaded yet</h3>
                    <p className={typography.muted + " mb-8 max-w-md mx-auto"}>Upload your resume to get your personalized score and AI-powered recommendations</p>
                    <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                      <DialogTrigger asChild>
                        <ShimmerButton className="h-14 px-8 text-base font-semibold shadow-lg">
                          <Upload className="w-5 h-5 mr-2" />Upload Resume
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
                  </div>
                </div>
              )}
              {isExtracting && (
                <div className="flex items-center gap-3 text-base text-muted-foreground mt-6 bg-muted/50 rounded-lg p-4">
                  <Clock className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing your resume...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Centered CTA Button - Only show if resume exists */}
        {currentResume && (
          <div className="flex justify-center mt-12">
            <ShimmerButton
              onClick={() => navigate(`/app/tailor/${currentResume.id}`)}
              className="shadow-2xl px-12 py-4 text-base font-semibold"
              background="hsl(var(--primary))"
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
            >
              <FileCheck className="w-5 h-5 mr-2" />
              Tailor Resume
            </ShimmerButton>
          </div>
        )}
      </div>
    </div>
  )
}
