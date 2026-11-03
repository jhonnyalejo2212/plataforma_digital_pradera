-- Datos de demostración. Para una base recién migrada (no es idempotente).
-- Los establecimientos son ficticios: no corresponden a registros comerciales verificados.
-- Las imágenes apuntan a Unsplash; se reemplazan por objetos en R2 al cargar contenido real.
-- No se crean administradores aquí: dependen de usuarios de Supabase Auth (ver README).

insert into public.categorias (nombre, slug, descripcion, icono, tono, orden) values
  ('Restaurantes', 'restaurantes', 'Restaurantes, cafeterías y oferta gastronómica.', 'food', 'amber', 1),
  ('Tiendas', 'tiendas', 'Comercio local y venta de productos.', 'shop', 'blue', 2),
  ('Farmacias', 'farmacias', 'Droguerías y productos de salud.', 'pharmacy', 'green', 3),
  ('Servicios', 'servicios', 'Servicios técnicos, profesionales y personales.', 'services', 'violet', 4),
  ('Educación', 'educacion', 'Instituciones y programas educativos.', 'education', 'blue', 5),
  ('Turismo', 'turismo', 'Alojamiento, rutas y experiencias turísticas.', 'tourism', 'green', 6);

insert into public.establecimientos (categoria_id, nombre, slug, descripcion, direccion, barrio, latitud, longitud, estado_publicacion)
select c.id, v.nombre, v.slug, 'Dato de demostración: ' || v.descripcion, v.direccion, v.barrio, v.lat, v.lng, v.estado
from (values
  ('restaurantes', 'Café Raíces de Pradera', 'cafe-raices-de-pradera', 'café de especialidad y desayunos con productos de la región.', 'Carrera 11 # 7-24', 'Centro', 3.4192000, -76.2431000, 'publicado'),
  ('restaurantes', 'Sazón del Valle', 'sazon-del-valle', 'cocina vallecaucana tradicional con menú del día.', 'Calle 8 # 12-31', 'El Jardín', 3.4210000, -76.2452000, 'publicado'),
  ('turismo', 'Hotel Las Palmas', 'hotel-las-palmas', 'alojamiento sencillo en el centro del municipio.', 'Calle 6 # 10-18', 'Centro', 3.4185000, -76.2440000, 'en_revision'),
  ('tiendas', 'Pradera Bike Center', 'pradera-bike-center', 'venta y mantenimiento de bicicletas y accesorios.', 'Carrera 8 # 5-42', 'Berlín', 3.4170000, -76.2418000, 'borrador'),
  ('farmacias', 'Droguería La 11', 'drogueria-la-11', 'medicamentos, cuidado personal y orientación farmacéutica.', 'Carrera 11 # 6-15', 'Centro', 3.4188000, -76.2429000, 'publicado'),
  ('educacion', 'Centro Educativo Semillas', 'centro-educativo-semillas', 'programas educativos, talleres y acompañamiento académico.', 'Calle 4 # 15-20', 'Primero de Mayo', 3.4225000, -76.2470000, 'publicado'),
  ('tiendas', 'Mercado Campesino Pradera', 'mercado-campesino-pradera', 'productos frescos de pequeños productores de la zona.', 'Carrera 10 # 8-04', 'Plaza principal', 3.4196000, -76.2437000, 'publicado'),
  ('servicios', 'Soluciones Técnicas Rivera', 'soluciones-tecnicas-rivera', 'diagnóstico y mantenimiento técnico a domicilio.', 'Calle 5 # 7-38', 'Berlín', 3.4175000, -76.2422000, 'publicado')
) as v(categoria, nombre, slug, descripcion, direccion, barrio, lat, lng, estado)
join public.categorias c on c.slug = v.categoria;

insert into public.horarios (establecimiento_id, dia_semana, hora_apertura, hora_cierre, cerrado)
select e.id, d.dia, d.apertura::time, d.cierre::time, d.cerrado
from public.establecimientos e
cross join (values
  (1, '08:00', '18:00', false), (2, '08:00', '18:00', false), (3, '08:00', '18:00', false),
  (4, '08:00', '18:00', false), (5, '08:00', '19:00', false), (6, '09:00', '16:00', false),
  (7, null, null, true)
) as d(dia, apertura, cierre, cerrado);

insert into public.medios_contacto (establecimiento_id, tipo, valor, etiqueta)
select e.id, v.tipo, v.valor, v.etiqueta
from (values
  ('cafe-raices-de-pradera', 'telefono', '+57 602 000 0001', null),
  ('cafe-raices-de-pradera', 'whatsapp', '+57 300 000 0001', null),
  ('cafe-raices-de-pradera', 'correo', 'contacto.demo1@directoriopradera.co', null),
  ('cafe-raices-de-pradera', 'instagram', 'https://instagram.com/establecimiento_demo', '@establecimiento_demo'),
  ('sazon-del-valle', 'telefono', '+57 602 000 0002', null),
  ('sazon-del-valle', 'whatsapp', '+57 300 000 0002', null),
  ('sazon-del-valle', 'correo', 'contacto.demo2@directoriopradera.co', null),
  ('hotel-las-palmas', 'telefono', '+57 602 000 0003', null),
  ('hotel-las-palmas', 'whatsapp', '+57 300 000 0003', null),
  ('hotel-las-palmas', 'correo', 'contacto.demo3@directoriopradera.co', null),
  ('pradera-bike-center', 'telefono', '+57 602 000 0004', null),
  ('pradera-bike-center', 'whatsapp', '+57 300 000 0004', null),
  ('drogueria-la-11', 'telefono', '+57 602 000 0005', null),
  ('drogueria-la-11', 'whatsapp', '+57 300 000 0005', null),
  ('centro-educativo-semillas', 'telefono', '+57 602 000 0006', null),
  ('centro-educativo-semillas', 'correo', 'contacto.demo6@directoriopradera.co', null),
  ('mercado-campesino-pradera', 'telefono', '+57 602 000 0007', null),
  ('mercado-campesino-pradera', 'facebook', 'https://facebook.com/establecimiento.demo', 'Establecimiento demostrativo'),
  ('soluciones-tecnicas-rivera', 'whatsapp', '+57 300 000 0008', null),
  ('soluciones-tecnicas-rivera', 'correo', 'contacto.demo8@directoriopradera.co', null)
) as v(slug, tipo, valor, etiqueta)
join public.establecimientos e on e.slug = v.slug;

insert into public.productos_servicios (establecimiento_id, nombre, tipo)
select e.id, v.nombre, v.tipo
from (values
  ('cafe-raices-de-pradera', 'Menú del día', 'producto'), ('cafe-raices-de-pradera', 'Bebidas', 'producto'),
  ('cafe-raices-de-pradera', 'Opciones vegetarianas', 'producto'), ('cafe-raices-de-pradera', 'Servicio para llevar', 'servicio'),
  ('sazon-del-valle', 'Menú del día', 'producto'), ('sazon-del-valle', 'Bebidas', 'producto'),
  ('sazon-del-valle', 'Servicio para llevar', 'servicio'),
  ('hotel-las-palmas', 'Alojamiento', 'servicio'), ('hotel-las-palmas', 'Información turística', 'servicio'),
  ('hotel-las-palmas', 'Reservas', 'servicio'),
  ('pradera-bike-center', 'Venta de bicicletas', 'producto'), ('pradera-bike-center', 'Asesoría personalizada', 'servicio'),
  ('pradera-bike-center', 'Domicilios locales', 'servicio'),
  ('drogueria-la-11', 'Medicamentos', 'producto'), ('drogueria-la-11', 'Cuidado personal', 'producto'),
  ('drogueria-la-11', 'Orientación farmacéutica', 'servicio'),
  ('centro-educativo-semillas', 'Programas educativos', 'servicio'), ('centro-educativo-semillas', 'Talleres', 'servicio'),
  ('centro-educativo-semillas', 'Acompañamiento académico', 'servicio'),
  ('mercado-campesino-pradera', 'Frutas y verduras', 'producto'), ('mercado-campesino-pradera', 'Productos de la región', 'producto'),
  ('mercado-campesino-pradera', 'Domicilios locales', 'servicio'),
  ('soluciones-tecnicas-rivera', 'Diagnóstico', 'servicio'), ('soluciones-tecnicas-rivera', 'Mantenimiento', 'servicio'),
  ('soluciones-tecnicas-rivera', 'Atención programada', 'servicio')
) as v(slug, nombre, tipo)
join public.establecimientos e on e.slug = v.slug;

insert into public.imagenes (establecimiento_id, url, texto_alternativo, es_principal, orden)
select e.id,
       'https://images.unsplash.com/' || v.foto || '?auto=format&fit=crop&w=1200&q=80',
       e.nombre || ' (imagen de demostración)',
       true,
       1
from (values
  ('cafe-raices-de-pradera', 'photo-1445116572660-236099ec97a0'),
  ('sazon-del-valle', 'photo-1414235077428-338989a2e8c0'),
  ('hotel-las-palmas', 'photo-1566073771259-6a8506099945'),
  ('pradera-bike-center', 'photo-1571068316344-75bc76f77890'),
  ('drogueria-la-11', 'photo-1586015555751-63bb77f4322a'),
  ('centro-educativo-semillas', 'photo-1523050854058-8df90110c9f1'),
  ('mercado-campesino-pradera', 'photo-1604719312566-8912e9227c6a'),
  ('soluciones-tecnicas-rivera', 'photo-1571068316344-75bc76f77890')
) as v(slug, foto)
join public.establecimientos e on e.slug = v.slug;

insert into public.reportes (establecimiento_id, nombre_reportante, correo_reportante, descripcion, estado)
select e.id, 'Persona de demostración', 'reporte.demo@directoriopradera.co', v.descripcion, v.estado
from (values
  ('cafe-raices-de-pradera', 'El horario del domingo requiere revisión.', 'pendiente'),
  ('sazon-del-valle', 'Posible inconsistencia en el número de la dirección.', 'en_revision'),
  ('drogueria-la-11', 'El teléfono publicado no corresponde a un contacto real.', 'revisado')
) as v(slug, descripcion, estado)
join public.establecimientos e on e.slug = v.slug;
