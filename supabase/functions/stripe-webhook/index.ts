import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Webhook event received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;

  if (!userId) {
    console.error("No user ID found in checkout session");
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateUserSubscription(userId, subscription, customerId);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId);

  if (error || !users || users.length === 0) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await updateUserSubscription(users[0].id, subscription, customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { error } = await supabase
    .from("users")
    .update({
      subscription_status: "cancelled",
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating user subscription:", error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { error } = await supabase
    .from("users")
    .update({
      subscription_status: "past_due",
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating user subscription status:", error);
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId: string
) {
  const subscriptionType = getSubscriptionType(subscription);
  const subscriptionStatus = mapStripeStatus(subscription.status);

  const { error } = await supabase
    .from("users")
    .update({
      subscription_id: subscription.id,
      subscription_status: subscriptionStatus,
      subscription_type: subscriptionType,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_customer_id: customerId,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }

  console.log(`Updated subscription for user ${userId}`);
}

function getSubscriptionType(subscription: Stripe.Subscription): "monthly" | "annual" | null {
  const interval = subscription.items.data[0]?.price.recurring?.interval;

  if (interval === "month") return "monthly";
  if (interval === "year") return "annual";

  return null;
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "inactive" | "cancelled" | "past_due" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "cancelled";
    default:
      return "inactive";
  }
}
