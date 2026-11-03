import type { IconName } from "@/components/ui/icon";

export const ADMIN_SECTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Resumen", icon: "dashboard" },
  { href: "/admin/categorias", label: "Categorías", icon: "grid" },
  { href: "/admin/establecimientos", label: "Establecimientos", icon: "building" },
  { href: "/admin/imagenes", label: "Imágenes", icon: "eye" },
  { href: "/admin/horarios", label: "Horarios", icon: "clock" },
  { href: "/admin/contactos", label: "Contactos", icon: "phone" },
  { href: "/admin/oferta", label: "Oferta", icon: "briefcase" },
  { href: "/admin/administradores", label: "Administradores", icon: "users" },
  { href: "/admin/reportes", label: "Reportes", icon: "flag" },
];
