"use client";

import { useEffect } from "react";

// Enregistre le service worker au chargement (nécessaire pour rendre l'app
// installable). Silencieux : aucune UI.
export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const register = () =>
      navigator.serviceWorker
        .register("/sw.js")
        .catch((e) => console.error("[pwa] enregistrement SW échoué", e));
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
