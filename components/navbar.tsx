import Link from "next/link";
import { Map } from "lucide-react";
import { auth } from "@/lib/auth";
import { gradeOf } from "@/lib/grades";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-emerald-50/80 backdrop-blur dark:border-emerald-950/60 dark:bg-[#081210]/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Map className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          RoadMap Business
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Tarifs</Link>
          </Button>
          {session?.user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu
                name={session.user.name ?? ""}
                email={session.user.email ?? ""}
                grade={gradeOf(session.user.email)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">S&apos;inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
