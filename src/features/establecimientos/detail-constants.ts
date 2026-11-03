export const TIPOS_CONTACTO = [
  { value: "telefono", label: "Teléfono", placeholder: "+57 602 000 0000" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "+57 300 000 0000" },
  { value: "correo", label: "Correo electrónico", placeholder: "contacto@negocio.co" },
  { value: "instagram", label: "Instagram", placeholder: "@usuario o https://instagram.com/usuario" },
  { value: "facebook", label: "Facebook", placeholder: "https://facebook.com/pagina" },
  { value: "sitio_web", label: "Sitio web", placeholder: "https://www.negocio.co" },
] as const;

export const MAX_IMAGENES = 12;
export const MAX_IMAGEN_BYTES = 1_500_000;
