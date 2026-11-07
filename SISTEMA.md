# Sistema — Directorio Digital Pradera

Documento técnico-funcional del proyecto. Describe cómo está construido, cómo fluye la
información y qué hace cada módulo. Para lo que falta, ver `PENDIENTES.md`.

---

## 1. Qué es

Directorio web de establecimientos del municipio de Pradera (Valle del Cauca).
Dos caras:

- **Sitio público** (`/`, `/directorio`, `/directorio/[slug]`): búsqueda, filtros,
  fichas con fotos/horarios/contacto/oferta, mapa y reporte de errores. Sin login.
- **Panel administrativo** (`/admin`): gestión de categorías, establecimientos,
  administradores y reportes. Requiere sesión de administrador.

## 2. Stack

| Pieza | Uso |
|---|---|
| Next.js 16 (`cacheComponents`) + React 19 + TypeScript | App Router, Server Components, Server Actions |
| Tailwind CSS v4 | Estilos con tokens de `src/app/globals.css` |
| Supabase (Postgres + Auth + RLS) | Base de datos y autenticación de administradores |
| `@supabase/ssr` + `@supabase/supabase-js` | Cliente con sesión (cookies) y clientes sin sesión/service_role |
| Cloudflare R2 (`aws4fetch`) | Almacenamiento de imágenes de establecimientos |
| zod | Validación de toda entrada en servidor |
| Leaflet | Mapa en la ficha del establecimiento |
| pnpm | Gestor de paquetes (versión fijada en `package.json`) |

## 3. Estructura

```
src/
  app/
    (public)/            → home, directorio, ficha (layout con header/footer)
    admin/
      (panel)/           → rutas protegidas: resumen, categorias,
                           establecimientos, administradores, reportes
                           (+ [modulo] placeholder "Próximamente" dinámico)
      login/             → ingreso
      recuperar/         → solicitar enlace de restablecimiento (público)
      definir-contrasena → pantalla independiente para crear la contraseña
      layout.tsx         → metadata del panel (noindex)
    auth/confirm/route.ts → canjea enlaces de correo de Supabase Auth
    proxy.ts             → middleware: renueva sesión y protege /admin/*
  components/
    ui/                  → button, icon, modal, feedback (toast/confirm),
                           url-filters (ley de UX), section-heading, logo
    admin/               → nav, ui (AdminTitle/Panel/StatusBadge), form,
                           managers de categorías/administradores/reportes,
                           establecimiento/ (pestañas: imágenes, horarios,
                           contactos, oferta), list-filters, panel-suspense
    public/              → business-card, directory-filters, directory-sort,
                           gallery (lightbox), search-bar, report-dialog,
                           home-sections, filters-toggle
    layout/              → site-header, site-footer, header-account
    map/                 → map-view (Leaflet)
  features/              → dominio por carpeta: queries/actions/schema/types
    auth/                → dal (getAdmin/requireAdmin), actions (signIn,
                           signOut, solicitarRecuperacion,
                           actualizarContrasena, establecerSesionDesdeTokens)
    categorias/          → admin-actions, schema, constants
    establecimientos/    → queries públicas, admin-queries, admin-actions,
                           detail-actions (pestañas), schemas, search-params
    administradores/     → schema, actions (invitar, estado, detalle, reenviar)
    reportes/            → actions (público crear), admin-actions (revisión)
  lib/
    supabase/            → public.ts (anon), server.ts (sesión), admin.ts (service_role)
    storage/r2.ts        → uploadObject/deleteObject firmados con aws4fetch
    utils/               → cn, format (COP/hora/tel/wa/maps/safeUrl), search (sanitize/slugify)
    image/compress.ts    → compresión cliente antes de subir a R2
  proxy.ts               → ver arriba (middleware /admin/*)
supabase/
  migrations/            → esquema + RLS + ip_hash (incrementales, no editar)
  seed.sql               → datos de demostración
```

Convención: **tablas y columnas en español**; código/archivos en inglés.

## 4. Modelo de datos (Supabase/Postgres)

Migración base: `supabase/migrations/20261102000000_esquema_inicial.sql`.

- `categorias` — nombre, slug, descripcion, icono, tono, orden, activa.
- `administradores` — `auth_user_id` (FK `auth.users`), nombre, correo, rol (`admin`),
  activo. Unicidad por `auth_user_id` y por `lower(correo)` (excluye borrados).
- `establecimientos` — FK `categoria_id`, FK `administrador_id` (responsable),
  nombre, slug, descripcion, direccion, barrio, latitud/longitud (CHECKs de rango
  y de par), `estado_publicacion` ∈ `borrador | en_revision | publicado`.
- `imagenes` — FK establecimiento, url (R2), `storage_key` (para borrar el objeto),
  texto_alternativo, `es_principal` (única por establecimiento), orden.
- `horarios` — por establecimiento, `dia_semana` 1–7, apertura/cierre/cerrado
  (CHECK exige horas si no está cerrado).
- `medios_contacto` — tipo ∈ telefono/whatsapp/correo/instagram/facebook/sitio_web.
- `productos_servicios` — nombre, descripcion, tipo, precio ≥ 0, disponible.
- `reportes` — FK establecimiento, `administrador_revision_id`, nombre/correo
  reportante, descripcion (10–2000), estado ∈ pendiente/en_revision/revisado,
  fecha_revision, observacion_admin, `ip_hash` (anti-spam).
- `valoraciones` — tabla preparada, **sin uso** (pendiente de decisión).

Todas las tablas: `created_at`, `updated_at` (trigger `set_updated_at`) y
`deleted_at` → **borrado lógico**, nunca físico (excepto imágenes borradas
del bucket R2, cuya fila también se marca).

## 5. Seguridad

### Clientes de Supabase (`src/lib/supabase/`)

| Cliente | Clave | RLS | Uso |
|---|---|---|---|
| `createPublicClient()` | publishable | Sí | Lecturas públicas cacheadas (`"use cache"`) |
| `createClient()` | publishable + cookies | Sí | Todo lo autenticado (acciones admin, Auth) |
| `createAdminClient()` | **service_role** | No | Solo servidor: invitar/re-enlazar admins, insertar reportes con ip_hash |

### Autorización

- `proxy.ts` (middleware sobre `/admin/*`): renueva la sesión de cookies y
  redirige a `/admin/login` si no hay claims. Excepciones públicas: `/admin/login`
  y `/admin/recuperar`. Es barrera optimista.
- `requireAdmin()` / `getAdmin()` (`features/auth/dal.ts`): verificación real —
  `auth.getUser()` contra Supabase + fila activa y no borrada en `administradores`.
  Toda Server Action lo invoca antes de escribir.
- **RLS** (`rls_politicas.sql`):
  - `anon`: SELECT solo de contenido `publicado`/activo y no borrado
    (categorías activas, establecimientos publicados y sus hijos).
  - `authenticated`: acceso total en todas las tablas vía `public.es_admin()`
    (función `security definer` que exige admin activo).
  - `reportes`/`valoraciones` no tienen acceso público: el público no los lee;
    `crearReporte` inserta con `service_role` tras validar y limitar abuso.

### Otras defensas

- Toda entrada a Server Actions validada con **zod**; errores por campo.
- `sanitizeSearch()` limpia caracteres con significado en filtros PostgREST/LIKE.
- `safeUrl()` valida URLs de contacto antes de usarse en `href`.
- `ip_hash` (HMAC-SHA256 con la service key): máximo 3 reportes/hora por IP;
  honeypot `website` en el formulario público.
- Sin `dangerouslySetInnerHTML`, sin `window.confirm/alert` (feedback propio).
- Secretos solo en servidor (`server-only`); `.env.local` y `NOTAS.txt` no se versionan.

## 6. UX reactiva (ley obligatoria del proyecto)

Centralizada en `src/components/ui/url-filters.tsx`:

- `UrlFiltersProvider`: filtros en la **URL** aplicados con `router.replace`
  en `useTransition` + `useOptimistic` → sin recarga, sin perder scroll.
- `useLiveText("q")`: búsqueda con retardo ~300 ms; Enter/blur aplican al instante.
- `FilterLink`, `ClearFiltersButton`, `FiltersResults` (atenúa resultados + `aria-busy`).
- Mutaciones: Server Actions + `useActionState`/transiciones, `useToast()` y
  `useConfirm()` de `feedback.tsx` (danger para acciones destructivas).
- Modales con `<dialog>` nativo (`modal.tsx`) — accesibles, Esc y clic fuera.

## 7. Cache y datos (Next 16 + `cacheComponents`)

- Lecturas públicas: `"use cache"` + `cacheTag` (`categorias`, `establecimientos`,
  `establecimiento:<slug>`) + `cacheLife("minutes")` en
  `features/establecimientos/queries.ts`.
- Mutaciones: `updateTag(...)` (+ `revalidatePath` del admin) → la interfaz
  refleja cambios al instante.
- Acceso a request (cookies/searchParams) siempre dentro de `<Suspense>`;
  `withPanelSuspense` da skeleton de streaming en el panel.
- Contador del badge de reportes: query en `(panel)/layout.tsx`,
  revalidado con `revalidatePath("/admin", "layout")` al guardar revisiones.

## 8. Flujos funcionales

### Sitio público

- **Home** (`/`): hero + buscador (`HeroSearchBar` → `/directorio?q=…`),
  categorías con conteo, destacados, secciones estáticas, CTA "Registrar mi
  negocio" → `mailto:` de `siteConfig.contactEmail`.
- **Directorio** (`/directorio`): `parseFiltros` (zod) valida `q, categoria,
  barrio, orden, pagina` desde la URL. Query paginada (`PAGE_SIZE=9`) con
  ilike multi-campo. Filtros laterales (radio) + chips activos + select de
  orden (A–Z, Z–A, recientes, antiguos) + paginación — todo por URL.
- **Ficha** (`/directorio/[slug]`): galería con **lightbox** (dialog, flechas,
  teclado, miniaturas), info, oferta con precio COP, horarios por día, contacto
  (whatsapp/tel/mail/redes vía helpers `format.ts`), mapa Leaflet + "Cómo
  llegar", y `ReportDialog` (form público → `crearReporte` → cola admin).
- **Metadatos** por establecimiento desde `generateMetadata`.

### Panel administrativo (`/admin`)

- **Resumen**: vista general.
- **Categorías**: CRUD en modal (nombre, descripción, ícono, tono, orden,
  activa); slug único generado; borrado protegido si tiene establecimientos.
- **Establecimientos**: listado con búsqueda + filtro categoría/estado +
  paginación; alta/edición con estado de publicación y responsable;
  **ficha con pestañas**: Datos, **Imágenes** (subida a R2 con compresión
  previa en cliente, principal, orden, borrado de objeto+fila), **Horarios**,
  **Contactos**, **Oferta**; eliminar (borrado lógico).
- **Administradores**: listado con búsqueda y filtro Activo/Inactivo;
  **Invitar** → `inviteUserByEmail` (service_role) + fila en tabla;
  **Detalle** (correo, `auth_user_id` copiable, establecimientos asignados);
  **Activar/Desactivar** (no permite desactivarte a ti ni al último activo);
  **Reenviar**: reenvía invitación → si falla usa `resetPasswordForEmail` →
  si el correo está bloqueado por límite, `generateLink` y muestra el enlace
  en modal para copiar.
- **Reportes**: listado con búsqueda, filtro por estado y paginación;
  **Revisar** en modal → estado + `observacion_admin` + sello de
  `administrador_revision_id`/`fecha_revision`; badge del menú se actualiza.

### Autenticación

- **Login**: `signInWithPassword` + exige fila activa en `administradores`
  (si no, cierra sesión y muestra "correo o contraseña incorrectos").
- **Invitación/recuperación**: el correo apunta a
  `/auth/confirm?next=/admin/definir-contrasena`.
  `/auth/confirm` acepta `?code=` (PKCE → `exchangeCodeForSession`) y
  `token_hash`+`type` (`verifyOtp`). Cuando Supabase entrega los tokens en el
  **hash** `#access_token=...` (flujo implícito de invitaciones), cae a
  `/admin/login?next=...` y `login-form` lee el hash del navegador, canjea la
  sesión con `establecerSesionDesdeTokens` (valida admin activo) y redirige.
- **Definir contraseña**: `/admin/definir-contrasena` (pantalla limpia, sin
  menú, sesión requerida) → `updateUser` → entra al panel. Sirve igual para
  invitación, recuperación y cambio voluntario.

### Imágenes

- Cliente comprime (`lib/image/compress.ts`), la acción valida tipo por bytes
  (webp/jpg), sube a **Cloudflare R2** con `uploadObject` (aws4fetch firmado,
  `Cache-Control` inmutable) y guarda `url` pública + `storage_key`.
  Borrar elimina objeto y marca `deleted_at`. `next.config` permite el host
  de `R2_PUBLIC_URL` para `next/image` (avif/webp).

## 9. Entorno y comandos

`.env.local` (no versionado): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_URL`.

Windows (bash): `export PATH="/c/laragon/bin/nodejs/node-v24.14.0-win-x64:$PATH"`.

- `pnpm dev` — desarrollo
- `pnpm lint` — ESLint
- `pnpm build` — build de producción
- `pnpm exec tsc --noEmit` — typecheck

## 10. Limitaciones conocidas

- Correos de Auth usan el **SMTP integrado de Supabase** (~3/hora): para
  invitaciones/recuperación real hay que configurar SMTP propio (pendiente).
- `valoraciones` existe pero sin interfaz — pendiente de decisión.
- Registro de negocio es `mailto:` — pendiente decisión de formulario público.
- Los correos `*.example` del seed no reciben nada (datos de desarrollo).
