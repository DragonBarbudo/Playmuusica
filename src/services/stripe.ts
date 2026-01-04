import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
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

/**
 * Creates a Stripe checkout session via Supabase Edge Function
 */
export const createCheckoutSession = async (
  params: SubscriptionCheckoutParams
): Promise<{ sessionId: string; url: string }> => {
  try {
    const { data: session } = await supabase.auth.getSession();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token || ''}`,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Redirects to Stripe checkout using the session URL
 */
export const redirectToCheckout = async (url: string): Promise<void> => {
  window.location.href = url;
};

/**
 * Creates a Stripe customer portal session via Supabase Edge Function
 */
export const createPortalSession = async (
  customerId: string,
  returnUrl?: string
): Promise<{ url: string }> => {
  try {
    const { data: session } = await supabase.auth.getSession();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token || ''}`,
        },
        body: JSON.stringify({ customerId, returnUrl }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};

/**
 * Redirects to Stripe customer portal
 */
export const redirectToPortal = async (customerId: string): Promise<void> => {
  const { url } = await createPortalSession(customerId);
  window.location.href = url;
};

export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Plan Mensual',
    type: 'monthly' as const,
    price: 175,
    currency: 'MXN',
    stripePriceId: 'prod_TiRH8VI5PyDcqV', // Replace with your actual Stripe Price ID
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
    price: 1925,
    currency: 'MXN',
    stripePriceId: 'prod_TiRI3MDsULKvvQ', // Replace with your actual Stripe Price ID
    features: [
      'Acceso ilimitado a toda la música',
      'Reproducción sin anuncios',
      'Descargas para escuchar offline',
      'Crear y gestionar playlists',
      'Calidad de audio premium',
      '1 meses gratis (ahorra 8%)',
    ],
  },
};
