import { defaultTheme } from "@univerjs/themes";

// Thème Univer aux couleurs de RoadMap Business : accent violet (palette
// Tailwind violet), le reste hérité du thème par défaut.
const violet = {
  50: "#f5f3ff",
  100: "#ede9fe",
  200: "#ddd6fe",
  300: "#c4b5fd",
  400: "#a78bfa",
  500: "#8b5cf6",
  600: "#7c3aed",
  700: "#6d28d9",
  800: "#5b21b6",
  900: "#4c1d95",
};

export const roadmapTheme = {
  ...defaultTheme,
  primary: violet,
  // Sélection/accents secondaires alignés sur le violet.
  hyacinth: violet,
} as typeof defaultTheme;
