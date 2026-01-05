import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_PLANS, createCheckoutSession, redirectToCheckout } from '../services/stripe';
import { Check, Music } from 'lucide-react';

export const Subscribe: React.FC = () => {
  const { user, hasActiveSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const plan = SUBSCRIPTION_PLANS[selectedPlan];

      // Create checkout session and redirect to Stripe
      const { url } = await createCheckoutSession({
        priceId: plan.stripePriceId,
        userId: user.id,
        email: user.email,
        successUrl: `${window.location.origin}/?success=true`,
        cancelUrl: `${window.location.origin}/subscribe?cancelled=true`,
      });

      // Redirect to Stripe checkout
      await redirectToCheckout(url);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error al crear la sesión de pago. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 text-center">
          <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Suscripción Activa</h2>
          <p className="text-purple-200 mb-6">
            Ya tienes una suscripción activa a Playmuusica.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Ir a la biblioteca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Playmuusica</h1>
          </div>
          <p className="text-xl text-purple-200">
            Elige el plan perfecto para ti
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div
            className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 transition-all cursor-pointer ${
              selectedPlan === 'monthly'
                ? 'border-purple-400 scale-105'
                : 'border-white/20 hover:border-purple-300'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {SUBSCRIPTION_PLANS.monthly.name}
              </h3>
              <div className="text-4xl font-bold text-white mb-1">
                ${SUBSCRIPTION_PLANS.monthly.price}
                <span className="text-lg text-purple-200">/mes</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {SUBSCRIPTION_PLANS.monthly.features.map((feature, index) => (
                <li key={index} className="flex items-start text-purple-100">
                  <Check className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Annual Plan */}
          <div
            className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 transition-all cursor-pointer relative ${
              selectedPlan === 'annual'
                ? 'border-purple-400 scale-105'
                : 'border-white/20 hover:border-purple-300'
            }`}
            onClick={() => setSelectedPlan('annual')}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Mejor valor
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {SUBSCRIPTION_PLANS.annual.name}
              </h3>
              <div className="text-4xl font-bold text-white mb-1">
                ${SUBSCRIPTION_PLANS.annual.price}
                <span className="text-lg text-purple-200">/año</span>
              </div>
              <p className="text-sm text-green-400">
                ${(SUBSCRIPTION_PLANS.annual.price / 12).toFixed(2)}/mes
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {SUBSCRIPTION_PLANS.annual.features.map((feature, index) => (
                <li key={index} className="flex items-start text-purple-100">
                  <Check className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-12 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Procesando...' : `Suscribirse - Plan ${selectedPlan === 'monthly' ? 'Mensual' : 'Anual'}`}
          </button>

          {user && (
            <button
              onClick={() => navigate('/')}
              className="block mx-auto mt-4 text-purple-200 hover:text-white transition-colors"
            >
              Volver a la biblioteca
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
