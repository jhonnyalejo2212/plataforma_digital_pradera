-- [ext] Valoraciones de establecimientos: huella de IP para limitar abuso, lectura pública de las aprobadas
-- y promedio desnormalizado en `establecimientos` (se mantiene con un trigger) para listar y ordenar sin joins.

alter table public.valoraciones add column ip_hash varchar(64);
create index valoraciones_ip_hash_idx on public.valoraciones (ip_hash, created_at) where ip_hash is not null;
create index valoraciones_estado_idx on public.valoraciones (estado) where deleted_at is null;

alter table public.valoraciones
  add constraint valoraciones_comentario_chk check (comentario is null or char_length(comentario) <= 1000);

alter table public.establecimientos
  add column valoracion_promedio numeric(3, 2),
  add column valoraciones_total integer not null default 0;

grant select on public.valoraciones to anon;

create policy valoraciones_lectura_publica on public.valoraciones
  for select to anon, authenticated
  using (estado = 'aprobada' and deleted_at is null and exists (
    select 1 from public.establecimientos e
    where e.id = establecimiento_id and e.estado_publicacion = 'publicado' and e.deleted_at is null));

create or replace function public.recalcular_valoraciones(p_establecimiento_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.establecimientos e
  set valoracion_promedio = s.promedio,
      valoraciones_total = s.total
  from (
    select round(avg(v.puntuacion)::numeric, 2) as promedio, count(*)::integer as total
    from public.valoraciones v
    where v.establecimiento_id = p_establecimiento_id and v.estado = 'aprobada' and v.deleted_at is null
  ) s
  where e.id = p_establecimiento_id;
$$;

revoke all on function public.recalcular_valoraciones(bigint) from public, anon, authenticated;

create or replace function public.valoraciones_actualizar_promedio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalcular_valoraciones(old.establecimiento_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.establecimiento_id <> old.establecimiento_id) then
    perform public.recalcular_valoraciones(new.establecimiento_id);
  end if;
  return null;
end;
$$;

revoke all on function public.valoraciones_actualizar_promedio() from public, anon, authenticated;

create trigger valoraciones_promedio
  after insert or update or delete on public.valoraciones
  for each row execute function public.valoraciones_actualizar_promedio();

create index establecimientos_valoracion_idx on public.establecimientos (valoracion_promedio desc nulls last, valoraciones_total desc) where deleted_at is null;
