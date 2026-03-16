import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { supabase } from '../lib/supabase'
import { toast } from '../hooks/use-toast'
import { Loader2, Link as LinkIcon, FileText } from 'lucide-react'

interface AddJobModalProps {
  isOpen: boolean
  onClose: () => void
  resumeId: string
  onJobAdded: () => void
}

export function AddJobModal({ isOpen, onClose, resumeId, onJobAdded }: AddJobModalProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isUrlMode, setIsUrlMode] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)

  const handleScrapeUrl = async () => {
    if (!jobUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a job URL',
        variant: 'destructive'
      })
      return
    }

    setIsScraping(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-job-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url: jobUrl })
      })

      const result = await response.json()

      if (result.success) {
        setJobTitle(result.jobTitle || '')
        setJobDescription(result.jobDescription || '')
        toast({
          title: 'Success',
          description: 'Job details scraped successfully'
        })
      } else {
        throw new Error(result.error || 'Failed to scrape URL')
      }
    } catch (error: any) {
      console.error('Error scraping URL:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to scrape job URL',
        variant: 'destructive'
      })
    } finally {
      setIsScraping(false)
    }
  }

  const handleSubmit = async () => {
    if (!jobTitle || !jobDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Step 1: Create job record
      const { data: job, error: insertError } = await supabase
        .from('jobs')
        .insert({
          user_id: session.user.id,
          resume_id: resumeId,
          job_title: jobTitle,
          job_description: jobDescription,
          job_url: jobUrl || null,
          conversation_status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log('Job created:', job.id)

      // Step 2: Start interrogation
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interrogator-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'start',
          jobId: job.id
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to start interrogation')
      }

      console.log('Interrogation started:', result)

      toast({
        title: 'Success',
        description: 'Job added! Starting analysis...'
      })

      onJobAdded()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Error adding job:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add job',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setJobTitle('')
    setJobDescription('')
    setJobUrl('')
    setIsUrlMode(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Job Posting</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={isUrlMode ? 'default' : 'outline'}
              onClick={() => setIsUrlMode(true)}
              className="flex-1"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Job URL
            </Button>
            <Button
              variant={!isUrlMode ? 'default' : 'outline'}
              onClick={() => setIsUrlMode(false)}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Paste Description
            </Button>
          </div>

          {/* URL Mode */}
          {isUrlMode && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobUrl">Job URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="jobUrl"
                    type="url"
                    placeholder="https://company.com/jobs/senior-pm"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleScrapeUrl}
                    disabled={isScraping || !jobUrl}
                  >
                    {isScraping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Scrape'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  We'll extract the job details automatically
                </p>
              </div>
            </div>
          )}

          {/* Job Title */}
          <div>
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              placeholder="Senior Product Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Job Description */}
          <div>
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              placeholder="We're looking for a Senior PM with 5+ years experience..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={12}
              className="mt-1 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              Paste the full job description for best results
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !jobTitle || !jobDescription}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
