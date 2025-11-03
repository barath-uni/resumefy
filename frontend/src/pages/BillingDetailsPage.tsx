import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Calendar, Mail, Crown, Zap, CreditCard, ArrowRight } from 'lucide-react'

interface SubscriptionData {
  email?: string
  tier: string
  subscription_status?: string
  subscription_current_period_end?: string
  stripe_customer_id?: string
}

export default function BillingDetailsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({ tier: 'free' })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading subscription details...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>

        {/* Current Subscription Card */}
        <Card className="mb-6 p-6 border-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Current Plan</h2>
              <Badge
                className={
                  subscriptionData.tier === 'max'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : subscriptionData.tier === 'pro'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }
              >
                {subscriptionData.tier === 'max' && <Crown className="w-3 h-3 mr-1" />}
                {subscriptionData.tier === 'pro' && <Zap className="w-3 h-3 mr-1" />}
                {subscriptionData.tier.toUpperCase()} TIER
              </Badge>
            </div>
            {subscriptionData.subscription_status && (
              <Badge
                variant="outline"
                className={
                  subscriptionData.subscription_status === 'active'
                    ? 'border-green-500 text-green-700 dark:text-green-400'
                    : 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                }
              >
                {subscriptionData.subscription_status.toUpperCase()}
              </Badge>
            )}
          </div>

          <Separator className="mb-6" />

          <div className="space-y-4">
            {/* Account Email */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Account Email</p>
                <p className="text-base font-semibold text-foreground">{userEmail}</p>
              </div>
            </div>

            {/* Next Billing Date */}
            {subscriptionData.subscription_current_period_end && (
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Next Billing Date</p>
                  <p className="text-base font-semibold text-foreground">
                    {new Date(subscriptionData.subscription_current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.ceil((new Date(subscriptionData.subscription_current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                  </p>
                </div>
              </div>
            )}

            {/* Stripe Customer ID */}
            {subscriptionData.stripe_customer_id && (
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                  <p className="text-sm font-mono text-foreground">{subscriptionData.stripe_customer_id}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Upgrade CTA for Free Users */}
        {subscriptionData.tier === 'free' && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">You're on the Free Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to unlock unlimited PDF generation and premium features
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/app/billing')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                View Plans & Upgrade
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Plan Features (show current tier features) */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Your Plan Includes</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {subscriptionData.tier === 'free' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>1 Resume</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>5 Job Descriptions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>PDF Generation</span>
                </div>
              </>
            )}
            {subscriptionData.tier === 'pro' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>10 Resumes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>50 Job Descriptions per Resume</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Unlimited PDF Generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All Premium Templates</span>
                </div>
              </>
            )}
            {subscriptionData.tier === 'max' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>50 Resumes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>250 Job Descriptions per Resume</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Unlimited PDF Generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Priority Support</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
