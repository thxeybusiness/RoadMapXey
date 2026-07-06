import * as Sentry from "@sentry/nextjs";

// Ne s'active que si un DSN est configuré — aucun impact en local sans clé.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
