# Saba Noticias Actuales

Agregador personal de noticias argentinas e internacionales con resumen por IA.

## Qué incluye este scaffold

- **RSS** (`lib/rss/`): fetch y normalización de feeds de medios argentinos e internacionales.
- **IA** (`lib/ai/summarize.ts`): deduplica noticias entre medios, arma clusters, y le pide a
  Claude que genere categoría, importancia, resumen original, resumen ampliado, tags e impacto
  económico para Argentina.
- **API** (`app/api/news`): orquesta RSS + IA con cache de 5 minutos (`NEWS_CACHE_TTL_SECONDS`).
- **Login** (`app/login`, `app/auth/callback`, `middleware.ts`): Supabase Auth con magic link
  por email. Sin contraseñas: el usuario pone su email, recibe un link, y queda logueado.
- **Supabase** (`lib/supabase/`, `app/api/favorites`, `app/api/alerts`): persistencia de
  favoritos y alertas por usuario, con Row Level Security — cada uno ve solo lo suyo.
- **UI** (`components/NewsDashboard.tsx`): panel con categorías, buscador, modo claro/oscuro,
  resumen diario, favoritos y sesión de usuario, con auto-refresh cada 5 minutos.

## Cómo funciona el login

1. El usuario entra a `/login` (o hace clic en "Ingresar" desde el dashboard).
2. Pone su email y Supabase le manda un magic link.
3. Al abrir el link, `app/auth/callback/route.ts` intercambia el código por una sesión y
   redirige al dashboard ya logueado.
4. `middleware.ts` refresca esa sesión en cada request para que no expire mientras navega.
5. Con sesión activa, los favoritos y alertas persisten en Supabase; sin sesión, tocar el
   ícono de favorito lo manda directo a `/login`.

Para habilitarlo necesitás un proyecto de Supabase real con:
- El esquema de `lib/supabase/schema.sql` aplicado.
- Auth → Providers → Email habilitado (viene activado por default).
- Auth → URL Configuration → agregar `http://localhost:3000/auth/callback` en desarrollo y
  `https://tu-dominio.vercel.app/auth/callback` en producción, como Redirect URLs permitidas.

## Lo que falta para producción (a propósito, fuera de este scaffold)

1. **Verificar cada URL de RSS** en `lib/rss/sources.ts` — varias cambian con frecuencia y
   algunos medios internacionales (Bloomberg, FT, WSJ, NYT, AP) no tienen RSS público, así que
   están comentados; requieren evaluar su API oficial de pago.
2. **Cron real**: Vercel resetea el cache en memoria en cada cold start. Para un refresco
   verdaderamente cada 5-10 min sin depender del tráfico, agregar un
   [Vercel Cron Job](https://vercel.com/docs/cron-jobs) que pegue a `/api/news` periódicamente
   y guarde el resultado en Supabase en vez de en memoria.
3. **Notificaciones push/email** para las alertas — la tabla `alert_subscriptions` ya existe;
   falta el disparador (ej. una Edge Function de Supabase o un cron que compare noticias nuevas
   contra los temas suscriptos), y una pantalla en la UI para que el usuario elija sus propios
   temas en vez de la lista fija que se muestra hoy.

## Instalación local

```bash
npm install
cp .env.example .env.local   # completar las claves
npm run dev
```

Abrir http://localhost:3000

### Variables de entorno requeridas

Ver `.env.example`. Como mínimo para que cargue algo en pantalla necesitás `ANTHROPIC_API_KEY`
(los feeds RSS no requieren clave). Para favoritos/alertas necesitás además un proyecto de
Supabase con el esquema de `lib/supabase/schema.sql` aplicado.

## Despliegue en Vercel

1. Subir este repo a GitHub.
2. Importarlo en [vercel.com/new](https://vercel.com/new).
3. Cargar las mismas variables de entorno del `.env.example` en el panel de Vercel.
4. Deploy.

## Derechos de autor

La app **nunca** reproduce artículos completos. Cada noticia muestra solo título, medio,
imagen (cuando el feed la provee), metadatos y un resumen original generado por IA a partir del
copete del feed — nunca copiado textual. El botón "Leer noticia completa" siempre enlaza al
sitio del medio original.
