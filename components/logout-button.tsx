"use client";

import { logoutAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        Déconnexion
      </Button>
    </form>
  );
}
