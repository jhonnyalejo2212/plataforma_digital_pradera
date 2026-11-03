import type { IconName } from "@/components/ui/icon";

export type Categoria = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: IconName;
  tono: "green" | "amber" | "blue" | "violet";
  total: number;
};

export type Imagen = { url: string; texto_alternativo: string | null; es_principal: boolean; orden: number };
export type Horario = { dia_semana: number; hora_apertura: string | null; hora_cierre: string | null; cerrado: boolean; observacion: string | null };
export type MedioContacto = { tipo: "telefono" | "whatsapp" | "correo" | "instagram" | "facebook" | "sitio_web"; valor: string; etiqueta: string | null };
export type ProductoServicio = { id: number; nombre: string; descripcion: string | null; tipo: "producto" | "servicio"; precio: number | null; disponible: boolean };

export type EstablecimientoResumen = {
  id: number;
  nombre: string;
  slug: string;
  direccion: string | null;
  barrio: string | null;
  categoria: { nombre: string; slug: string };
  imagen: { url: string; alt: string } | null;
};

export type EstablecimientoDetalle = EstablecimientoResumen & {
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  imagenes: Imagen[];
  horarios: Horario[];
  contactos: MedioContacto[];
  productos: ProductoServicio[];
};

export type OrdenDirectorio = "nombre" | "recientes";
export type FiltrosDirectorio = { q?: string; categoria?: string; barrio?: string; orden: OrdenDirectorio; pagina: number };
