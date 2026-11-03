-- Seguridad a nivel de fila. Principio: lectura pública solo de lo publicado y no eliminado;
-- escritura solo para administradores activos. Los reportes y valoraciones no tienen acceso
-- público directo: se insertan desde el servidor (service_role) con validación y limitación de abuso.

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.administradores a
    where a.auth_user_id = (select auth.uid())
      and a.activo
      and a.deleted_at is null
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

alter table public.categorias enable row level security;
alter table public.administradores enable row level security;
alter table public.establecimientos enable row level security;
alter table public.imagenes enable row level security;
alter table public.horarios enable row level security;
alter table public.medios_contacto enable row level security;
alter table public.productos_servicios enable row level security;
alter table public.reportes enable row level security;
alter table public.valoraciones enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.categorias, public.establecimientos, public.imagenes, public.horarios,
  public.medios_contacto, public.productos_servicios to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Lectura pública
create policy categorias_lectura_publica on public.categorias
  for select to anon, authenticated
  using (activa and deleted_at is null);

create policy establecimientos_lectura_publica on public.establecimientos
  for select to anon, authenticated
  using (estado_publicacion = 'publicado' and deleted_at is null);

create policy imagenes_lectura_publica on public.imagenes
  for select to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.establecimientos e
    where e.id = establecimiento_id and e.estado_publicacion = 'publicado' and e.deleted_at is null));

create policy horarios_lectura_publica on public.horarios
  for select to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.establecimientos e
    where e.id = establecimiento_id and e.estado_publicacion = 'publicado' and e.deleted_at is null));

create policy medios_contacto_lectura_publica on public.medios_contacto
  for select to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.establecimientos e
    where e.id = establecimiento_id and e.estado_publicacion = 'publicado' and e.deleted_at is null));

create policy productos_servicios_lectura_publica on public.productos_servicios
  for select to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.establecimientos e
    where e.id = establecimiento_id and e.estado_publicacion = 'publicado' and e.deleted_at is null));

-- Administración completa (solo administradores activos)
do $$
declare t text;
begin
  foreach t in array array['categorias', 'administradores', 'establecimientos', 'imagenes', 'horarios',
                           'medios_contacto', 'productos_servicios', 'reportes', 'valoraciones']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))',
      t || '_admin_total', t);
  end loop;
end $$;
