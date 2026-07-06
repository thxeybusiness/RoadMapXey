import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "RoadMapXey — Roadmaps produit partagées",
    template: "%s · RoadMapXey",
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
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} RoadMapXey
        </footer>
      </body>
    </html>
  );
}
