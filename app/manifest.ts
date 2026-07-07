import type { MetadataRoute } from "next";

// Manifeste PWA : rend l'app installable sur ordinateur et mobile
// (« Installer RoadMap Business » dans le navigateur).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoadMap Business",
    short_name: "RoadMap",
    description:
      "Créez, priorisez et partagez vos roadmaps produit avec votre équipe.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#dceee2",
    theme_color: "#059669",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
