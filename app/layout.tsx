import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "RoadMap Business — Roadmaps produit partagées",
    template: "%s · RoadMap Business",
  },
  description:
    "Créez, priorisez et partagez vos roadmaps produit avec votre équipe.",
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
      </body>
    </html>
  );
}
