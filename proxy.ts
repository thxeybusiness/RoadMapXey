import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 : `proxy.ts` remplace `middleware.ts` (convention renommée).
// Redirection rapide vers /login si non connecté. C'est une garde UX :
// la vraie vérification de session se fait côté serveur dans chaque
// page/action via requireUser() — jamais uniquement ici.

const PROTECTED_PREFIXES = ["/dashboard", "/settings"];

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Utilisateur déjà connecté sur /login ou /signup → dashboard.
  if ((pathname === "/login" || pathname === "/signup") && hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/login", "/signup"],
};
