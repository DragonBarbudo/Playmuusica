import { loadStripe, type Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export interface SubscriptionCheckoutParams {
  priceId: string;
  userId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

// This would typically be handled by a backend endpoint
// For now, this is a placeholder for the client-side integration
export const createCheckoutSession = async (
  _params: SubscriptionCheckoutParams
): Promise<{ sessionId: string }> => {
  // In a real implementation, you would call your backend API here
  // which would create a Stripe Checkout session using the Stripe API
  // and return the session ID

  // Example backend call:
  // const response = await fetch('/api/create-checkout-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(params),
  // });
  // return response.json();

  throw new Error('Backend endpoint not implemented yet. You need to create a Supabase Edge Function or backend API to handle Stripe checkout sessions.');
};

export const redirectToCheckout = async (_sessionId: string): Promise<void> => {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  // Note: redirectToCheckout is deprecated, use Checkout Session URL instead
  throw new Error('Use Checkout Session URL instead of redirectToCheckout');
};

export const createPortalSession = async (_customerId: string): Promise<{ url: string }> => {
  // In a real implementation, you would call your backend API here
  // which would create a Stripe Customer Portal session

  // Example backend call:
  // const response = await fetch('/api/create-portal-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ customerId }),
  // });
  // return response.json();

  throw new Error('Backend endpoint not implemented yet. You need to create a Supabase Edge Function or backend API to handle Stripe portal sessions.');
};

export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Plan Mensual',
    type: 'monthly' as const,
    price: 9.99,
    currency: 'USD',
    stripePriceId: 'price_monthly_xxxxx', // Replace with your actual Stripe Price ID
    features: [
      'Acceso ilimitado a toda la música',
      'Reproducción sin anuncios',
      'Descargas para escuchar offline',
      'Crear y gestionar playlists',
      'Calidad de audio premium',
    ],
  },
  annual: {
    id: 'annual',
    name: 'Plan Anual',
    type: 'annual' as const,
    price: 99.99,
    currency: 'USD',
    stripePriceId: 'price_annual_xxxxx', // Replace with your actual Stripe Price ID
    features: [
      'Acceso ilimitado a toda la música',
      'Reproducción sin anuncios',
      'Descargas para escuchar offline',
      'Crear y gestionar playlists',
      'Calidad de audio premium',
      '2 meses gratis (ahorra 16%)',
    ],
  },
};
