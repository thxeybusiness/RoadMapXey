import { defaultTheme } from "@univerjs/themes";

// Thème Univer aux couleurs de RoadMap Business : accent vert (palette
// Tailwind emerald), le reste hérité du thème par défaut.
const green = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
};

export const roadmapTheme = {
  ...defaultTheme,
  primary: green,
  // Sélection/accents secondaires alignés sur le vert.
  hyacinth: green,
} as typeof defaultTheme;
