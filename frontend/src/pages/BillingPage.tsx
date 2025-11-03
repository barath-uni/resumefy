import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react'
import { getUserTier } from '../lib/paywall'

export default function BillingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState('free')
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic')
  const navigate = useNavigate()

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login')
        return
      }

      setUserId(session.user.id)

      // Get user's current tier
      const tierInfo = await getUserTier(session.user.id)
      setCurrentTier(tierInfo.tier)
      setLoading(false)
    }

    loadUserData()
  }, [navigate])

  const handleUpgrade = () => {
    // TODO: Integrate with Stripe
    alert(`Upgrading to ${selectedPlan.toUpperCase()} plan. Stripe integration coming soon!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choose Your Plan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                You're about to get hired faster
              </p>
            </div>
            {currentTier !== 'free' && (
              <Badge variant="secondary" className="px-3 py-1">
                Current: {currentTier.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Basic Plan */}
          <Card
            className={`relative p-6 cursor-pointer transition-all ${
              selectedPlan === 'basic'
                ? 'ring-2 ring-blue-500 shadow-xl'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedPlan('basic')}
          >
            <div className="absolute top-4 right-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'basic'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'basic' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Basic</h3>
                <p className="text-sm text-muted-foreground">Perfect for job seekers</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$9</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <Separator className="mb-6" />

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upload up to <strong>10 resumes</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>50 job descriptions</strong> per resume</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited PDF generation</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>All 3 professional templates</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>AI-powered fit score analysis</span>
              </li>
            </ul>

            {selectedPlan === 'basic' && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                MOST POPULAR
              </Badge>
            )}
          </Card>

          {/* Pro Plan */}
          <Card
            className={`relative p-6 cursor-pointer transition-all border-2 ${
              selectedPlan === 'pro'
                ? 'ring-2 ring-purple-500 shadow-xl border-purple-200'
                : 'hover:shadow-lg border-purple-100 dark:border-purple-900/20'
            }`}
            onClick={() => setSelectedPlan('pro')}
          >
            <div className="absolute top-4 right-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'pro'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'pro' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Pro</h3>
                <p className="text-sm text-muted-foreground">For power users</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$19</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <Separator className="mb-6" />

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upload up to <strong>50 resumes</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>250 job descriptions</strong> per resume</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited PDF generation</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>All premium templates + new releases</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Priority support (24h response)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Advanced analytics dashboard</span>
              </li>
            </ul>

            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400">
              BEST VALUE
            </Badge>
          </Card>
        </div>

        {/* All Benefits Section */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-100 dark:border-blue-900/20">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            All Subscription Benefits
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Quickly tailor your resume</h3>
                <p className="text-xs text-muted-foreground">
                  AI-powered optimization for every job posting in seconds
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">ATS-friendly templates</h3>
                <p className="text-xs text-muted-foreground">
                  Professional templates optimized for Applicant Tracking Systems
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Fit score analysis</h3>
                <p className="text-xs text-muted-foreground">
                  See how well your resume matches each job description (0-100%)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">24/7 customer support</h3>
                <p className="text-xs text-muted-foreground">
                  Get help whenever you need it via email or chat
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleUpgrade}
            disabled={currentTier !== 'free'}
            className="px-12 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentTier === 'free' ? (
              <>Upgrade to {selectedPlan === 'basic' ? 'Basic' : 'Pro'} →</>
            ) : (
              <>You're already on {currentTier.toUpperCase()} plan</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Cancel anytime. No questions asked. Money-back guarantee.
          </p>
        </div>

        {/* Current Plan Info (if not free) */}
        {currentTier !== 'free' && (
          <Card className="mt-8 p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Current Plan: {currentTier.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  You have full access to all features
                </p>
              </div>
              <Button variant="outline" size="sm">
                Manage Subscription
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
