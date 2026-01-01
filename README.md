# Playmuusica - Jellyfin Audio Player

Un reproductor de música web moderno que se conecta a Jellyfin con sistema de suscripciones integrado.

## 🎵 Características

- **Streaming de audio desde Jellyfin**: Conecta con tu servidor Jellyfin en jelly.muusica.com
- **Sistema de suscripciones**: Planes mensuales y anuales con Stripe
- **Reproductor completo**: Play, pause, siguiente, anterior, volumen, shuffle, repeat
- **Navegación de biblioteca**: Explora álbumes, canciones y playlists
- **Descargas locales**: Descarga música para escuchar offline
- **Interfaz moderna**: Diseñada con React, TypeScript y TailwindCSS
- **Preparado para móvil**: SPA lista para convertir a app móvil con React Native

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: TailwindCSS v4
- **Backend/DB**: Supabase (PostgreSQL)
- **Autenticación**: Jellyfin API + Supabase Auth
- **Pagos**: Stripe
- **Hosting**: Netlify
- **Iconos**: Lucide React

## 📋 Requisitos Previos

- Node.js 20+
- Cuenta de Supabase
- Servidor Jellyfin configurado
- Cuenta de Stripe

## 🛠️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa los valores:

```env
# Supabase
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase

# Jellyfin
VITE_JELLYFIN_URL=https://jelly.muusica.com

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=tu-clave-publica-de-stripe
```

### 3. Configurar Supabase

Ejecuta las siguientes migraciones SQL en tu proyecto de Supabase:

```sql
-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  jellyfin_user_id TEXT NOT NULL UNIQUE,
  jellyfin_username TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'annual')),
  subscription_id TEXT,
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de tracks en playlists
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  jellyfin_item_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_jellyfin_user_id ON users(jellyfin_user_id);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Configurar Stripe

#### Crear productos y precios en Stripe:

1. Ve a tu dashboard de Stripe
2. Crea dos productos:
   - **Plan Mensual**: $9.99/mes
   - **Plan Anual**: $99.99/año
3. Copia los Price IDs y actualízalos en `src/services/stripe.ts`

#### Configurar Webhooks de Stripe (Supabase Edge Functions):

Necesitas crear Edge Functions en Supabase para manejar:
- Checkout sessions: `/functions/create-checkout-session`
- Portal sessions: `/functions/create-portal-session`
- Webhooks: `/functions/stripe-webhook`

Ejemplo de Edge Function para checkout:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const { priceId, userId, email } = await req.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    client_reference_id: userId,
    success_url: 'https://play.muusica.com/?success=true',
    cancel_url: 'https://play.muusica.com/subscribe?cancelled=true',
  })

  return new Response(JSON.stringify({ sessionId: session.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## 🧪 Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:5173

## 🏗️ Build

```bash
npm run build
```

## 🚀 Deploy en Netlify

### Opción 1: Deploy automático desde GitHub

1. Conecta tu repositorio de GitHub a Netlify
2. Configura las variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_JELLYFIN_URL`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
3. Deploy automático en cada push

### Opción 2: Deploy manual

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## 📱 Roadmap para App Móvil

Para convertir esta SPA a una app móvil:

1. Configurar React Native Web
2. Usar Expo o React Native CLI
3. Adaptar componentes para móvil
4. Implementar notificaciones push
5. Optimizar reproducción en background
6. Configurar almacenamiento offline mejorado

## 🔧 Próximas Funcionalidades

- [ ] Gestión completa de playlists personalizadas
- [ ] Almacenamiento offline con IndexedDB
- [ ] Búsqueda avanzada con filtros
- [ ] Ecualizador de audio
- [ ] Compartir canciones
- [ ] Estadísticas de reproducción
- [ ] Modo offline completo
- [ ] PWA (Progressive Web App)

## 📄 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios propuestos.

## 📞 Soporte

Para problemas o preguntas, contacta a través de GitHub Issues.
