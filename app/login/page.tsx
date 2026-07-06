import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div className="flex justify-center px-4 py-24">
      <AuthForm mode="login" />
    </div>
  );
}
