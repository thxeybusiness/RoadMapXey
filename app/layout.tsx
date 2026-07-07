import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "RoadMap Business — Roadmaps produit partagées",
    template: "%s · RoadMap Business",
  },
  description:
    "Créez, priorisez et partagez vos roadmaps produit avec votre équipe.",
  appleWebApp: {
    capable: true,
    title: "RoadMap Business",
    statusBarStyle: "default",
  },
  // iOS lit la variante préfixée « apple- » pour l'ouverture plein écran
  // (Ajouter à l'écran d'accueil). On la force en plus du standard moderne.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#dceee2] text-zinc-900 dark:bg-[#0a1210] dark:text-zinc-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-emerald-100 py-6 text-center text-sm text-zinc-500 dark:border-emerald-950/60">
          © {new Date().getFullYear()} RoadMap Business
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
