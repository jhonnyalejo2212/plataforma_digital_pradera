<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del proyecto (Directorio Pradera)

## Ley de UX: interfaz reactiva, sin recargas completas

Toda la interfaz debe sentirse como una aplicación, no como un sitio que recarga. Esta regla es obligatoria en todo desarrollo nuevo y en cualquier modificación.

- **Nunca** usar un `<form>` nativo que navegue (GET o POST) con recarga completa. Un `Enter` en un campo no puede recargar la página: prevenir el envío y manejarlo con JavaScript.
- **Filtros, búsquedas, orden y paginación**: se guardan en la URL, pero se aplican con `router.replace` dentro de `useTransition`, sin recargar y sin saltar el scroll. Usar siempre los bloques de `src/components/ui/url-filters.tsx` (`UrlFiltersProvider`, `FilterLink`, `FiltersResults`, `useLiveText`, `ClearFiltersButton`). No construir enlaces o formularios de filtro por cuenta propia.
- **Respuesta inmediata**: el estado de los controles (opción marcada, valor del select, texto) se actualiza al instante (estado optimista) y los resultados se atenúan mientras llegan los nuevos. Nunca dejar la pantalla en blanco ni reemplazar contenido por un spinner de página completa.
- **Búsqueda en vivo**: texto con retardo (~300 ms); `Enter` y perder el foco aplican de inmediato.
- **Mutaciones** (crear, editar, eliminar, reportar): Server Actions con `useActionState`; mostrar estado de envío (`pending`), errores por campo y confirmación en la misma pantalla. Tras guardar, invalidar la caché con `updateTag` para que la interfaz refleje el cambio de inmediato.
- **Acciones destructivas**: pedir confirmación en la interfaz antes de ejecutar.
- **Prohibido** usar `window.confirm`, `alert` o `prompt` nativos. Todo mensaje al usuario usa los componentes propios de `src/components/ui/feedback.tsx`: `useConfirm()` (confirmaciones, con `tone: "danger"` para acciones destructivas) y `useToast()` (`toast.success`, `toast.error`, `toast.info`). Errores de campo se muestran en línea junto al campo; el resultado de una acción se muestra con un toast; usar siempre iconos acordes al tipo de mensaje.
- Los enlaces siempre son `<a>`/`Link` reales (accesibles, abren en pestaña nueva), con el clic normal interceptado para navegar sin recargar.
- Mantener accesibilidad: `aria-busy`, `aria-current`, `role="alert"` en errores, foco visible.

## Seguridad

- Las claves secretas (`SUPABASE_SERVICE_ROLE_KEY`, `R2_*`) solo se usan en código de servidor (`server-only`). Nunca en componentes de cliente ni en variables `NEXT_PUBLIC_*`.
- `.env.local` y `NOTAS.txt` no se versionan. Solo `.env.example` (sin valores).
- Toda lectura pública pasa por RLS (solo lo publicado). Toda escritura exige `requireAdmin()` y validación con zod en el servidor.
- Datos de la base usados en enlaces (`href`) se validan (`safeUrl`). No usar `dangerouslySetInnerHTML`.

## Arquitectura y convenciones

- Tablas y campos en español (según el MER); componentes, funciones y archivos en inglés o descriptivos, estilo ya existente.
- Estructura: `src/app` (rutas), `src/components/{ui,layout,public,admin,map}`, `src/features/<dominio>` (queries, actions, schema, types), `src/lib` (supabase, utils), `supabase/` (migraciones y seed).
- Estilos con Tailwind v4 y los tokens de `src/app/globals.css`. No añadir CSS global; no rediseñar pantallas del prototipo sin justificación.
- Next.js 16 con `cacheComponents`: el acceso a datos de la petición (cookies, searchParams) va dentro de `<Suspense>`; lo público se cachea con `"use cache"` + `cacheTag`. El archivo de interceptación es `src/proxy.ts`.
- Las migraciones SQL son incrementales y nuevas (no editar las ya aplicadas).

## Comandos (Windows, Node de Laragon)

- Antes de usar node/pnpm en una terminal bash: `export PATH="/c/laragon/bin/nodejs/node-v24.14.0-win-x64:$PATH"`.
- Gestor de paquetes: pnpm (versión fijada en `package.json`). Verificación: `pnpm lint` y `pnpm build`. Desarrollo: `pnpm dev`.
