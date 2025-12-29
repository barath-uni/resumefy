import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { typography } from '../lib/typography'
import { Calendar, Mail, Crown, Zap, CreditCard, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface SubscriptionData {
  email?: string
  tier: string
  subscription_status?: string
  subscription_current_period_end?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

export default function BillingDetailsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({ tier: 'free' })
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [selectedNewTier, setSelectedNewTier] = useState<'pro' | 'max'>('pro')
  const [isSwitchingPlan, setIsSwitchingPlan] = useState(false)
  const { toast } = useToast()
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
        .select('tier, subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', session.user.id)
        .single()

      if (profile) {
        setSubscriptionData({
          email: session.user.email || '',
          tier: profile.tier || 'free',
          subscription_status: profile.subscription_status,
          subscription_current_period_end: profile.subscription_current_period_end,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_subscription_id: profile.stripe_subscription_id
        })
      }

      setLoading(false)
    }

    loadUserData()
  }, [navigate])

  const handleCancelSubscription = async () => {
    if (!subscriptionData.stripe_subscription_id) {
      toast({
        title: "Error",
        description: "No active subscription found",
        variant: "destructive"
      })
      return
    }

    setIsCancelling(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to cancel your subscription",
          variant: "destructive"
        })
        return
      }

      // Call cancel-subscription edge function
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscriptionData.stripe_subscription_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error || !data?.success) {
        toast({
          title: "Failed to cancel subscription",
          description: error?.message || data?.error || 'Unknown error',
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Subscription cancelled",
        description: "Your subscription will remain active until the end of the billing period",
      })

      // Reload page to refresh subscription data
      window.location.reload()

    } catch (err) {
      toast({
        title: "Unexpected error",
        description: (err as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsCancelling(false)
      setCancelDialogOpen(false)
    }
  }

  const handleSwitchPlan = async () => {
    if (!userId) return

    setIsSwitchingPlan(true)

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Call Edge Function to create checkout session or update subscription
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier: selectedNewTier },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        throw error
      }

      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (error: any) {
      toast({
        title: "Failed to switch plan",
        description: error.message || 'Failed to switch plan',
        variant: "destructive"
      })
      setIsSwitchingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading subscription details...</p>
      </div>
    )
  }

  const canUpgrade = subscriptionData.tier === 'free' || subscriptionData.tier === 'pro'
  const isActive = subscriptionData.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={typography.h2 + " mb-2"}>Billing & Subscription</h1>
          <p className={typography.muted}>Manage your subscription and billing details</p>
        </div>

        {/* Current Subscription Card */}
        <Card className="mb-6 p-6 border-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={typography.h3 + " mb-2"}>Current Plan</h2>
              <Badge
                className={
                  subscriptionData.tier === 'free'
                    ? 'bg-muted text-muted-foreground'
                    : subscriptionData.tier === 'max'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-primary text-primary-foreground'
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
                    ? 'border-primary text-primary'
                    : 'border-destructive text-destructive'
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

          {/* Cancel Subscription Button (only for active paid users) */}
          {subscriptionData.tier !== 'free' && isActive && (
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Plan Switcher (for active paid users who can upgrade) */}
        {canUpgrade && (
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {subscriptionData.tier === 'free' ? 'Upgrade Your Plan' : 'Upgrade to Max'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscriptionData.tier === 'free'
                    ? 'Unlock unlimited PDF generation and premium features'
                    : 'Get access to priority support and advanced features'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select
                value={selectedNewTier}
                onValueChange={(value) => setSelectedNewTier(value as 'pro' | 'max')}
                disabled={isSwitchingPlan}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionData.tier === 'free' && (
                    <SelectItem value="pro">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Pro - $4.99/mo (44% off)</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="max">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span>Max - $8.99/mo (40% off)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleSwitchPlan}
                disabled={isSwitchingPlan}
              >
                {isSwitchingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {subscriptionData.tier === 'free' ? 'Upgrade Now' : 'Switch to ' + selectedNewTier.toUpperCase()}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Free tier CTA */}
        {subscriptionData.tier === 'free' && (
          <Card className="mt-6 p-6 bg-muted border-2">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">Start with a Free Trial</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try Pro for free and upgrade anytime
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/app/billing')}
              >
                View All Plans
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
                  <span>5 tailorings total</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>All core features (AI tailoring, fit scores, ATS analysis)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>All 4 professional templates</span>
                </div>
              </>
            )}
            {subscriptionData.tier === 'pro' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>30 tailorings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All Free features included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Bulk template generation (all 4 at once)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Priority email support (48h response)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Early access to new templates</span>
                </div>
              </>
            )}
            {subscriptionData.tier === 'max' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>100 tailorings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All Pro features included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Priority email support (24h response)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Analytics dashboard (coming soon)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Priority feature requests</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period ({subscriptionData.subscription_current_period_end ? new Date(subscriptionData.subscription_current_period_end).toLocaleDateString() : 'end of period'}), after which you'll be downgraded to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
