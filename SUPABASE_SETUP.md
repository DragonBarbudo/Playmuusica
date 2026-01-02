# Guía de Configuración de Supabase Edge Functions

Esta guía te ayudará a deployar las Edge Functions de Supabase para manejar los pagos de Stripe.

## 📋 Prerequisitos

1. Cuenta de Supabase
2. Cuenta de Stripe configurada
3. Supabase CLI instalado

## 🛠️ Instalación del Supabase CLI

### macOS/Linux:
```bash
brew install supabase/tap/supabase
```

### Windows:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verificar instalación:
```bash
supabase --version
```

## 🔐 Configuración

### 1. Login en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 2. Link tu proyecto

```bash
supabase link --project-ref tu-project-ref
```

**Para obtener tu project-ref:**
1. Ve a tu proyecto en https://supabase.com/dashboard
2. En Settings > General > Reference ID

### 3. Configurar variables de entorno

Crea un archivo `.env` en el directorio `supabase/`:

```bash
cd supabase
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
STRIPE_SECRET_KEY=sk_live_o_test_tu_clave_secreta
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Configurar secrets en Supabase

**IMPORTANTE**: Las Edge Functions en producción usan secrets de Supabase, no archivos .env locales.

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_live_tu_clave_secreta

# Stripe Webhook Secret (lo obtendrás después de crear el webhook)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# Supabase URL (opcional, auto-configurado)
supabase secrets set SUPABASE_URL=https://tu-proyecto.supabase.co

# Supabase Service Role Key (opcional, auto-configurado)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**Para obtener STRIPE_SECRET_KEY:**
1. Ve a https://dashboard.stripe.com/apikeys
2. Copia tu "Secret key" (empieza con `sk_test_` o `sk_live_`)

**Para verificar secrets:**
```bash
supabase secrets list
```

## 🚀 Deploy de las Edge Functions

### Deploy todas las funciones:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

### O deploy todas a la vez:

```bash
supabase functions deploy
```

### Verificar deploy:

```bash
supabase functions list
```

Deberías ver:
```
┌───────────────────────────┬─────────┬────────────────────────────┐
│         Function          │ Status  │         Updated At         │
├───────────────────────────┼─────────┼────────────────────────────┤
│ create-checkout-session   │ ACTIVE  │ 2024-01-01 12:00:00        │
│ create-portal-session     │ ACTIVE  │ 2024-01-01 12:00:00        │
│ stripe-webhook            │ ACTIVE  │ 2024-01-01 12:00:00        │
└───────────────────────────┴─────────┴────────────────────────────┘
```

## 🔗 Configurar Webhook de Stripe

### 1. Obtener URL del webhook

Después del deploy, tu webhook URL será:
```
https://tu-proyecto.supabase.co/functions/v1/stripe-webhook
```

### 2. Crear webhook en Stripe Dashboard

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en "Add endpoint"
3. URL del endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
4. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

5. Click en "Add endpoint"

### 3. Obtener Webhook Secret

1. Una vez creado el webhook, click en él
2. En la sección "Signing secret", revela el secret
3. Copia el valor (empieza con `whsec_`)
4. Configúralo en Supabase:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret
```

### 4. Re-deploy el webhook (para que tome el nuevo secret):

```bash
supabase functions deploy stripe-webhook
```

## 🧪 Pruebas Locales (Opcional)

### 1. Iniciar servidor local:

```bash
# Desde el directorio raíz del proyecto
supabase start
```

### 2. Servir funciones localmente:

```bash
supabase functions serve
```

Las funciones estarán disponibles en:
- `http://localhost:54321/functions/v1/create-checkout-session`
- `http://localhost:54321/functions/v1/create-portal-session`
- `http://localhost:54321/functions/v1/stripe-webhook`

### 3. Testing con Stripe CLI (webhooks locales):

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a tu función local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

Esto te dará un webhook secret para desarrollo que empieza con `whsec_`.

### 4. Trigger eventos de prueba:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

## 🔍 Debugging

### Ver logs de las funciones:

```bash
# Logs en tiempo real
supabase functions logs

# Logs de una función específica
supabase functions logs create-checkout-session

# Logs con filtro
supabase functions logs --filter "error"
```

### Ver logs en Supabase Dashboard:

1. Ve a tu proyecto en Supabase Dashboard
2. Edge Functions > Logs
3. Selecciona la función que quieres ver

## ✅ Verificación

### Test de checkout session:

```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-anon-key" \
  -d '{
    "priceId": "price_tu_price_id",
    "userId": "test-user-id",
    "email": "test@example.com"
  }'
```

Deberías recibir una respuesta con `sessionId` y `url`.

### Test de portal session:

```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/create-portal-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-anon-key" \
  -d '{
    "customerId": "cus_tu_customer_id"
  }'
```

Deberías recibir una respuesta con `url`.

## 🔄 Actualizar funciones

Cuando hagas cambios en el código de las Edge Functions:

```bash
# Deploy la función actualizada
supabase functions deploy nombre-de-la-funcion

# O todas las funciones
supabase functions deploy
```

## 📚 Recursos Adicionales

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## 🆘 Troubleshooting

### Error: "Missing Stripe secret key"
- Verifica que configuraste `STRIPE_SECRET_KEY` con `supabase secrets set`
- Verifica que re-deploye después de configurar el secret

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- Asegúrate que el secret coincida con el de tu webhook en Stripe Dashboard

### Error: "CORS error"
- Las funciones ya tienen CORS configurado
- Verifica que estés haciendo la petición desde un dominio permitido

### Función no responde:
- Verifica los logs: `supabase functions logs nombre-funcion`
- Verifica que la función esté ACTIVE: `supabase functions list`
- Re-deploy la función: `supabase functions deploy nombre-funcion`

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación Playmuusica tendrá:
- ✅ Checkout de suscripciones funcionando
- ✅ Portal de gestión de suscripciones
- ✅ Webhooks procesando eventos de Stripe
- ✅ Base de datos actualizándose automáticamente

Para probar el flujo completo:
1. Ve a https://play.muusica.com/subscribe
2. Selecciona un plan
3. Click en "Suscribirse"
4. Deberías ser redirigido a Stripe Checkout
5. Completa el pago (usa tarjeta de prueba en modo test: 4242 4242 4242 4242)
6. Deberías ser redirigido de vuelta y tu suscripción debería estar activa
