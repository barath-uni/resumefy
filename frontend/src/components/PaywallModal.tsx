import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Lock, Sparkles, Zap } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  reason: 'resume_limit' | 'jobs_limit' | 'pdf_generation'
  currentTier?: string
  current?: number
  limit?: number
  message?: string
}

export function PaywallModal({
  isOpen,
  onClose,
  reason,
  currentTier = 'free',
  current,
  limit,
  message
}: PaywallModalProps) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/app/billing')
    onClose()
  }

  const content = {
    resume_limit: {
      icon: Lock,
      title: 'Resume Upload Limit Reached',
      body: message || `You've reached your resume limit (${current}/${limit}). Upgrade to upload more resumes.`,
      features: [
        'Upload up to 10 resumes (Pro) or 50 resumes (Max)',
        'Organize multiple resume versions',
        'Quick access to all your resumes'
      ],
      cta: 'Upgrade to Upload More Resumes'
    },
    jobs_limit: {
      icon: Zap,
      title: 'Job Description Limit Reached',
      body: message || `You've reached your job limit (${current}/${limit}) for this resume. Upgrade to add more job descriptions.`,
      features: [
        'Add up to 50 jobs (Pro) or 250 jobs (Max)',
        'Tailor your resume for each opportunity',
        'Track all your applications'
      ],
      cta: 'Upgrade to Add More Jobs'
    },
    pdf_generation: {
      icon: Sparkles,
      title: 'Unlock PDF Generation',
      body: message || 'Generate unlimited tailored resume PDFs with Pro or Max plan.',
      features: [
        'Unlimited PDF generation',
        'Download in multiple formats',
        'Professional ATS-friendly templates',
        'Priority support'
      ],
      cta: 'Upgrade to Generate PDFs'
    }
  }

  const { icon: Icon, title, body, features, cta } = content[reason]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <Icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {body}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              ✨ With an upgraded plan you get:
            </p>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Hint */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-foreground">
              Starting at just <span className="text-lg font-bold text-blue-600 dark:text-blue-400">$9/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cancel anytime. No questions asked.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {cta} →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
