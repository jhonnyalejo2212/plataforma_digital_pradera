import type { IconName } from "@/components/ui/icon";

export const CATEGORY_ICONS: { value: IconName; label: string }[] = [
  { value: "food", label: "Restaurante" },
  { value: "coffee", label: "Café" },
  { value: "shop", label: "Tienda" },
  { value: "pharmacy", label: "Farmacia" },
  { value: "services", label: "Servicios" },
  { value: "education", label: "Educación" },
  { value: "tourism", label: "Turismo" },
  { value: "briefcase", label: "Profesional" },
  { value: "building", label: "Edificio" },
  { value: "calendar", label: "Eventos" },
  { value: "star", label: "Destacado" },
  { value: "users", label: "Comunidad" },
  { value: "location", label: "Lugares" },
  { value: "grid", label: "General" },
];

export const CATEGORY_TONES = [
  { value: "green", label: "Verde" },
  { value: "amber", label: "Ámbar" },
  { value: "blue", label: "Azul" },
  { value: "violet", label: "Violeta" },
] as const;
