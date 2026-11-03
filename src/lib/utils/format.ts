export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const formatHora = (hora: string | null) => (hora ? hora.slice(0, 5) : "");

const digits = (value: string) => value.replace(/\D/g, "");

export const telHref = (valor: string) => `tel:+${digits(valor)}`;
export const whatsappHref = (valor: string) => `https://wa.me/${digits(valor)}`;
export const mailHref = (valor: string) => `mailto:${valor}`;

export const googleMapsHref = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/** Solo permite enlaces http(s) provenientes de la base de datos. */
export const safeUrl = (valor: string) => (/^https?:\/\//i.test(valor) ? valor : undefined);
