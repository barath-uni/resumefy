import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserResumes } from '../lib/uploadResume'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

export default function TailorResumePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }
        setUser(session.user)

        const userResumes = await getUserResumes(session.user.id)
        if (userResumes && userResumes.length > 0) {
          setResumes(userResumes)
          setSelectedResumeId(userResumes[0].id)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleStartTailoring = () => {
    if (selectedResumeId) {
      navigate(`/app/generated-resumes/${selectedResumeId}`)
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

  if (!user || resumes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Tailor Resume
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Optimize your resume for specific job postings
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No resumes found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Upload a resume first to start tailoring it for job applications
            </p>
            <Button onClick={() => navigate('/app/my-resumes')}>
              Go to My Resumes
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Tailor Resume
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a resume and tailor it for specific job postings
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Resume
              </label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>
                          {resume.file_name?.replace(/\.[^/.]+$/, '') || 'My Resume'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose which resume you want to tailor for job applications
              </p>
            </div>

            {selectedResumeId && (
              <div className="pt-4">
                <Button
                  onClick={handleStartTailoring}
                  className="w-full"
                  size="lg"
                >
                  Continue to Tailoring
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
