import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Check, Sparkles, Zap, Shield, Crown, Loader2, Calendar, Mail } from 'lucide-react'

interface SubscriptionData {
  email?: string
  tier: string
  subscription_status?: string
  subscription_current_period_end?: string
  stripe_customer_id?: string
}

export default function BillingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({ tier: 'free' })
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'max'>('pro')
  const navigate = useNavigate()

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login')
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || '')

      // Get subscription data from user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier, subscription_status, subscription_current_period_end, stripe_customer_id')
        .eq('user_id', session.user.id)
        .single()

      if (profile) {
        setSubscriptionData({
          email: session.user.email || '',
          tier: profile.tier || 'free',
          subscription_status: profile.subscription_status,
          subscription_current_period_end: profile.subscription_current_period_end,
          stripe_customer_id: profile.stripe_customer_id
        })
      }

      setLoading(false)
    }

    loadUserData()
  }, [navigate])

  const handleUpgrade = async () => {
    if (!userId) return

    setCheckoutLoading(true)

    try {
      console.log('🔄 Creating Stripe checkout session for tier:', selectedPlan)

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier: selectedPlan },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        console.error('❌ Error creating checkout session:', error)
        throw error
      }

      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      console.log('✅ Checkout session created, redirecting to Stripe...')

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (error: any) {
      console.error('❌ Checkout error:', error)
      alert(`Error: ${error.message || 'Failed to create checkout session'}`)
      setCheckoutLoading(false)
    }
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
            {subscriptionData.tier !== 'free' && (
              <Badge variant="secondary" className="px-3 py-1">
                Current: {subscriptionData.tier.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Current Subscription Card (only show if paid) */}
        {subscriptionData.tier !== 'free' && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Current Subscription</h2>
                <Badge
                  className={
                    subscriptionData.tier === 'max'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }
                >
                  {subscriptionData.tier === 'max' && <Crown className="w-3 h-3 mr-1" />}
                  {subscriptionData.tier === 'pro' && <Zap className="w-3 h-3 mr-1" />}
                  {subscriptionData.tier.toUpperCase()} TIER
                </Badge>
              </div>
              <Badge
                variant="outline"
                className={
                  subscriptionData.subscription_status === 'active'
                    ? 'border-green-500 text-green-700 dark:text-green-400'
                    : 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                }
              >
                {subscriptionData.subscription_status?.toUpperCase() || 'ACTIVE'}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Email</p>
                  <p className="text-sm font-medium text-foreground">{userEmail}</p>
                </div>
              </div>

              {subscriptionData.subscription_current_period_end && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Billing Date</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(subscriptionData.subscription_current_period_end).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.ceil((new Date(subscriptionData.subscription_current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Pro Plan */}
          <Card
            className={`relative p-6 cursor-pointer transition-all ${
              selectedPlan === 'pro'
                ? 'ring-2 ring-blue-500 shadow-xl'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedPlan('pro')}
          >
            <div className="absolute top-4 right-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'pro'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'pro' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Pro</h3>
                <p className="text-sm text-muted-foreground">Perfect for job seekers</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$8.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <Separator className="mb-6" />

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upload up to <strong>3 resumes</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>25 job descriptions</strong> per resume (75 total)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited PDF generation</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Bulk generate up to <strong>25 resumes</strong> at once</span>
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

            {selectedPlan === 'pro' && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                MOST POPULAR
              </Badge>
            )}
          </Card>

          {/* Max Plan */}
          <Card
            className={`relative p-6 cursor-pointer transition-all border-2 ${
              selectedPlan === 'max'
                ? 'ring-2 ring-purple-500 shadow-xl border-purple-200'
                : 'hover:shadow-lg border-purple-100 dark:border-purple-900/20'
            }`}
            onClick={() => setSelectedPlan('max')}
          >
            <div className="absolute top-4 right-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'max'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'max' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Max</h3>
                <p className="text-sm text-muted-foreground">For power users</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$17.99</span>
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
                <span><strong>100 job descriptions</strong> per resume (1,000 total)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited PDF generation</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Bulk generate up to <strong>100 resumes</strong> at once</span>
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

        {/* CTA Button - Only show for free users */}
        {subscriptionData.tier === 'free' && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="px-12 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>Upgrade to {selectedPlan === 'pro' ? 'Pro' : 'Max'} →</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Cancel anytime. No questions asked. Money-back guarantee.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
