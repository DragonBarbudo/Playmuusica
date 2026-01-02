import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    console.log('Webhook event type:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get user ID from metadata
        const userId = session.metadata?.userId || session.client_reference_id

        if (!userId) {
          console.error('No userId found in session metadata')
          break
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Determine subscription type based on interval
        const subscriptionType = subscription.items.data[0]?.price.recurring?.interval === 'year'
          ? 'annual'
          : 'monthly'

        // Update user in database
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_type: subscriptionType,
            subscription_id: subscriptionId,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating user subscription:', error)
        } else {
          console.log(`Subscription activated for user ${userId}`)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No userId found in subscription metadata')
          break
        }

        // Determine status
        let status: 'active' | 'inactive' | 'cancelled' | 'past_due' = 'inactive'
        if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        } else if (subscription.status === 'canceled') {
          status = 'cancelled'
        }

        // Determine subscription type
        const subscriptionType = subscription.items.data[0]?.price.recurring?.interval === 'year'
          ? 'annual'
          : 'monthly'

        // Update user in database
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: status,
            subscription_type: subscriptionType,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('subscription_id', subscription.id)

        if (error) {
          console.error('Error updating user subscription:', error)
        } else {
          console.log(`Subscription updated for subscription ${subscription.id}`)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update user subscription status to cancelled
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('subscription_id', subscription.id)

        if (error) {
          console.error('Error cancelling user subscription:', error)
        } else {
          console.log(`Subscription cancelled for subscription ${subscription.id}`)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Update user subscription status to past_due
          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating user subscription to past_due:', error)
          } else {
            console.log(`Subscription marked as past_due for subscription ${invoice.subscription}`)
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook handler failed',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
