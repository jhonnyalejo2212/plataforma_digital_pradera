-- Esquema inicial de Directorio Pradera (basado en el MER del documento maestro).
-- Ajustes respecto al MER: ids bigint identity, auth_user_id uuid, booleanos reales,
-- timestamptz, CHECK en estados/tipos, y columnas auxiliares marcadas como [ext].

create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.categorias (
  id bigint generated always as identity primary key,
  nombre varchar(120) not null,
  slug varchar(140) not null,                            -- [ext] filtros y URLs
  descripcion text,
  icono varchar(30) not null default 'building',         -- [ext] icono de la tarjeta
  tono varchar(20) not null default 'green',             -- [ext] color de la tarjeta
  orden smallint not null default 0,                     -- [ext] orden de visualización
  activa boolean not null default true,                  -- [ext] estado Activa/Inactiva
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint categorias_tono_chk check (tono in ('green', 'amber', 'blue', 'violet'))
);
create unique index categorias_nombre_uk on public.categorias (lower(nombre)) where deleted_at is null;
create unique index categorias_slug_uk on public.categorias (slug) where deleted_at is null;

create table public.administradores (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  nombre varchar(150) not null,
  correo varchar(255) not null,
  rol varchar(30) not null default 'admin',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint administradores_rol_chk check (rol in ('admin'))
);
create unique index administradores_auth_user_uk on public.administradores (auth_user_id);
create unique index administradores_correo_uk on public.administradores (lower(correo)) where deleted_at is null;

create table public.establecimientos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias (id),
  administrador_id bigint references public.administradores (id) on delete set null,
  nombre varchar(180) not null,
  slug varchar(200) not null,
  descripcion text,
  direccion varchar(255),
  barrio varchar(120),
  latitud numeric(10, 7),
  longitud numeric(10, 7),
  estado_publicacion varchar(20) not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint establecimientos_estado_chk check (estado_publicacion in ('borrador', 'en_revision', 'publicado')),
  constraint establecimientos_lat_chk check (latitud is null or latitud between -90 and 90),
  constraint establecimientos_lng_chk check (longitud is null or longitud between -180 and 180),
  constraint establecimientos_coords_chk check ((latitud is null) = (longitud is null))
);
create unique index establecimientos_slug_uk on public.establecimientos (slug) where deleted_at is null;
create index establecimientos_categoria_idx on public.establecimientos (categoria_id);
create index establecimientos_administrador_idx on public.establecimientos (administrador_id);
create index establecimientos_estado_idx on public.establecimientos (estado_publicacion) where deleted_at is null;
create index establecimientos_nombre_trgm_idx on public.establecimientos using gin (nombre extensions.gin_trgm_ops);

create table public.imagenes (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  url text not null,
  storage_key text,                                      -- [ext] clave del objeto en R2 para poder borrarlo
  texto_alternativo varchar(255),
  es_principal boolean not null default false,
  orden smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index imagenes_establecimiento_idx on public.imagenes (establecimiento_id);
create unique index imagenes_principal_uk on public.imagenes (establecimiento_id) where es_principal and deleted_at is null;

create table public.horarios (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  dia_semana smallint not null,                          -- 1 = lunes ... 7 = domingo
  hora_apertura time,
  hora_cierre time,
  cerrado boolean not null default false,
  observacion varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint horarios_dia_chk check (dia_semana between 1 and 7),
  constraint horarios_horas_chk check (cerrado or (hora_apertura is not null and hora_cierre is not null))
);
create unique index horarios_dia_uk on public.horarios (establecimiento_id, dia_semana) where deleted_at is null;

create table public.medios_contacto (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  tipo varchar(30) not null,
  valor text not null,
  etiqueta varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint medios_contacto_tipo_chk check (tipo in ('telefono', 'whatsapp', 'correo', 'instagram', 'facebook', 'sitio_web'))
);
create index medios_contacto_establecimiento_idx on public.medios_contacto (establecimiento_id);

create table public.productos_servicios (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  nombre varchar(180) not null,
  descripcion text,
  tipo varchar(20) not null default 'producto',
  precio numeric(12, 2),
  disponible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint productos_servicios_tipo_chk check (tipo in ('producto', 'servicio')),
  constraint productos_servicios_precio_chk check (precio is null or precio >= 0)
);
create index productos_servicios_establecimiento_idx on public.productos_servicios (establecimiento_id);

create table public.reportes (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  administrador_revision_id bigint references public.administradores (id) on delete set null,
  nombre_reportante varchar(150),
  correo_reportante varchar(255),
  descripcion text not null,
  estado varchar(20) not null default 'pendiente',
  fecha_revision timestamptz,
  observacion_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint reportes_estado_chk check (estado in ('pendiente', 'en_revision', 'revisado')),
  constraint reportes_descripcion_chk check (char_length(descripcion) between 10 and 2000)
);
create index reportes_establecimiento_idx on public.reportes (establecimiento_id);
create index reportes_revision_idx on public.reportes (administrador_revision_id);
create index reportes_estado_idx on public.reportes (estado) where deleted_at is null;

-- [ext] Valoraciones: preparada para una versión futura. Sin interfaz ni acceso público por ahora.
create table public.valoraciones (
  id bigint generated always as identity primary key,
  establecimiento_id bigint not null references public.establecimientos (id) on delete cascade,
  puntuacion smallint not null,
  comentario text,
  nombre_autor varchar(150),
  estado varchar(20) not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint valoraciones_puntuacion_chk check (puntuacion between 1 and 5),
  constraint valoraciones_estado_chk check (estado in ('pendiente', 'aprobada', 'rechazada'))
);
create index valoraciones_establecimiento_idx on public.valoraciones (establecimiento_id);

do $$
declare t text;
begin
  foreach t in array array['categorias', 'administradores', 'establecimientos', 'imagenes', 'horarios',
                           'medios_contacto', 'productos_servicios', 'reportes', 'valoraciones']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
