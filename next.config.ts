import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Politique de sécurité du contenu. 'unsafe-inline' est nécessaire pour les
// scripts/styles injectés par Next (bootstrap RSC, CSS critique) sans nonce.
// Sentry (si activé) et les data:/blob: (images, polices) sont autorisés.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// L'upload des sourcemaps Sentry ne s'active qu'avec un token configuré
// (SENTRY_AUTH_TOKEN sur Vercel) — le build local reste inchangé.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
