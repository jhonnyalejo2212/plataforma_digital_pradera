export const siteConfig = {
  name: "Directorio Pradera",
  tagline: "Todo Pradera en un solo lugar",
  description:
    "Directorio digital de la oferta comercial, gastronómica, de servicios y turística de Pradera, Valle del Cauca.",
  location: "Pradera, Valle del Cauca",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
  },
} as const;
