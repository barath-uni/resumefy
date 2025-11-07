import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@13.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * CANCEL SUBSCRIPTION
 *
 * Cancels a user's Stripe subscription (at period end).
 * User retains access until the end of their billing period.
 *
 * Input: { subscriptionId: string }
 * Output: { success: boolean, message: string }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'subscriptionId is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 [cancel-subscription] Cancelling subscription:', subscriptionId)

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header to verify user owns this subscription
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('❌ [cancel-subscription] Unauthorized:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns this subscription
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.stripe_subscription_id !== subscriptionId) {
      console.error('❌ [cancel-subscription] Subscription ownership mismatch')
      return new Response(
        JSON.stringify({ success: false, error: 'Subscription not found or unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [cancel-subscription] User authorized, proceeding with cancellation')

    // Cancel subscription at period end (user keeps access until then)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    console.log('✅ [cancel-subscription] Subscription will be cancelled at period end:', subscription.cancel_at)

    // Update user profile with cancellation status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'cancelling'
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('⚠️ [cancel-subscription] Error updating profile:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAt: subscription.cancel_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ [cancel-subscription] Unexpected error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (err as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
