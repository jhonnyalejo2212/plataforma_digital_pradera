# Pendientes — Directorio Pradera

Comparación del prototipo guía (Figma, `project pradera`) con la implementación actual,
más lo necesario a nivel general para dar el proyecto por terminado.

> Nota de diseño: en el prototipo, Imágenes, Horarios, Contactos y Oferta eran módulos
> separados del panel. En la implementación real se consolidaron como pestañas dentro de
> la ficha del establecimiento (`/admin/establecimientos/[id]`), lo cual ya está hecho.
> No aparecen aquí como pendientes.

## 1. Frente al prototipo: lo que falta

### Panel administrativo

- [ ] **Módulo de Administradores** (`/admin/administradores` — hoy "Próximamente")
  - Listado con búsqueda y filtro por estado (Activo/Inactivo).
  - Crear administrador: invitar correo vía Supabase Auth + registro en tabla `administradores`.
  - Detalle: datos de la cuenta, `auth_user_id`, establecimientos bajo su responsabilidad.
  - Activar/desactivar cuenta (confirmación + toast).
- [ ] **Módulo de Reportes** (`/admin/reportes` — hoy "Próximamente")
  - Listado con filtro por estado (Pendiente / En revisión / Revisado).
  - Revisión: ver descripción, reportante y establecimiento; cambiar estado;
    guardar `administrador_revision_id`, `fecha_revision` y `observacion_admin`.
  - Contador de reportes pendientes como badge en el menú lateral (el prototipo lo muestra).
- [ ] **Recuperación de contraseña** ("¿Olvidaste tu contraseña?" en el login del prototipo).
  - Flujo de Supabase `resetPasswordForEmail` + página de nueva contraseña.

### Sitio público

- [ ] **Orden de resultados** en `/directorio` (el prototipo tenía select:
  más recomendados / mejor calificados / más recientes — hoy no hay orden configurable).
- [ ] **"Ver todas las fotos"**: galería completa/lightbox en la ficha
  (hoy se muestran las imágenes sin vista ampliada).
- [ ] **Registro de negocio**: el CTA "Registrar mi negocio" hoy es un `mailto`.
  Decidir si queda así o se crea un formulario público que registre el establecimiento
  como `borrador`/`en_revision` para que un administrador lo publique.

## 2. Nivel general: lo necesario para terminar

- [ ] **Correo real del administrador**: `admin@pradera.example` no recibe correos
  (ver NOTAS.txt). Cambiar a un correo real antes de producción — necesario también
  para recuperar contraseña e invitar administradores.
- [ ] **Valoraciones**: la tabla `valoraciones` existe pero está reservada "para una
  versión futura". El prototipo muestra rating en tarjetas y ficha. Decidir:
  implementarla (formulario público + moderación en admin) o quitar el rating del diseño.
- [ ] **Datos reales**: cargar categorías y establecimientos definitivos vía seed/panel,
  reemplazando los datos de demostración.
- [ ] **Paginación/orden en listados del admin** donde aplique (establecimientos, reportes).
- [ ] **SEO y metadatos**: Open Graph, descripción por establecimiento, favicon final.
- [ ] **Despliegue**: variables de entorno de producción (Supabase, R2), dominio,
  revisión de políticas RLS y build final (`pnpm lint && pnpm build`).

## 3. Descartado a propósito (no hace falta)

- Módulos sueltos de Imágenes / Horarios / Contactos / Oferta → son pestañas de la ficha.
- Zonas "centro/rural" del prototipo → cubierto por el filtro de **barrios** con datos reales.
- Notificaciones push, app móvil, pagos, tags, posts/noticias del antiguo `turguide`
  → fuera del alcance del Directorio Pradera.
