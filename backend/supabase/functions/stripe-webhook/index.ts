import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@17.4.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

console.log('🔔 Stripe webhook function initialized')

Deno.serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')

  if (!signature) {
    console.error('❌ No Stripe signature found')
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await request.text()

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SIGNING_SECRET not configured')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log(`✅ Webhook verified: ${event.type}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Checkout completed:', session.id)

        // Get customer email from session
        const customerEmail = session.customer_email || session.customer_details?.email

        if (!customerEmail) {
          console.error('❌ No customer email in session')
          break
        }

        console.log('📧 Customer email:', customerEmail)

        // Find user by email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

        if (userError) {
          console.error('❌ Error fetching users:', userError)
          break
        }

        const user = userData.users.find(u => u.email === customerEmail)

        if (!user) {
          console.error('❌ User not found for email:', customerEmail)
          break
        }

        console.log('👤 Found user:', user.id)

        // Determine tier from price ID
        const priceId = session.line_items?.data[0]?.price?.id
        const proPriceId = Deno.env.get('STRIPE_PRICE_ID_PRO')
        const maxPriceId = Deno.env.get('STRIPE_PRICE_ID_MAX')

        let tier = 'free'
        if (priceId === proPriceId) {
          tier = 'pro'
        } else if (priceId === maxPriceId) {
          tier = 'max'
        }

        console.log('🎯 Upgrading user to tier:', tier)

        // Update user profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            subscription_current_period_end: null // Will be set by subscription event
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('❌ Error updating user profile:', updateError)
        } else {
          console.log('✅ User upgraded successfully to', tier)
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('📝 Subscription updated:', subscription.id, 'Status:', subscription.status)

        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, tier')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (profileError || !profile) {
          console.error('❌ User profile not found for customer:', subscription.customer)
          break
        }

        console.log('👤 Updating subscription for user:', profile.user_id)

        // Update subscription status
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('user_id', profile.user_id)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
        } else {
          console.log('✅ Subscription updated:', subscription.status)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🗑️ Subscription canceled:', subscription.id)

        // Find user by customer ID
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (profileError || !profile) {
          console.error('❌ User profile not found for customer:', subscription.customer)
          break
        }

        console.log('👤 Downgrading user to free tier:', profile.user_id)

        // Downgrade to free tier
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_current_period_end: null
          })
          .eq('user_id', profile.user_id)

        if (updateError) {
          console.error('❌ Error downgrading user:', updateError)
        } else {
          console.log('✅ User downgraded to free tier')
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('⚠️ Payment failed for customer:', invoice.customer)

        // Find user and mark subscription as past_due
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (profileError || !profile) {
          console.error('❌ User profile not found for customer:', invoice.customer)
          break
        }

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'past_due'
          })
          .eq('user_id', profile.user_id)

        if (updateError) {
          console.error('❌ Error updating payment status:', updateError)
        } else {
          console.log('⚠️ User marked as past_due')
        }

        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
