-- [ext] Huella (HMAC) de la IP del reportante, solo para limitar abuso. No se almacena la IP en claro.
alter table public.reportes add column ip_hash varchar(64);
create index reportes_ip_hash_idx on public.reportes (ip_hash, created_at) where ip_hash is not null;
