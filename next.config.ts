import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

// L'upload des sourcemaps Sentry ne s'active qu'avec un token configuré
// (SENTRY_AUTH_TOKEN sur Vercel) — le build local reste inchangé.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
