# RoadMapXey

SaaS de roadmaps produit — Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, NextAuth, Stripe, Resend, Sentry.

## Stack & architecture

| Couche | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| Base de données | PostgreSQL (Supabase / Neon / Railway) via Prisma |
| Multi-tenant | `tenantId` en colonne partout (une seule DB) |
| Auth | NextAuth (Auth.js) — credentials + JWT, protection via `proxy.ts` |
| Paiement | Stripe Checkout + webhook de synchro d'abonnement |
| Emails | Resend (bienvenue, confirmation de paiement, annulation) |
| Monitoring | Sentry (activé dès qu'un DSN est configuré) |
| UI | Composants style shadcn/ui (`components/ui`) |

### Structure

```
app/            Pages + routes API (/, /login, /signup, /dashboard, /settings, /pricing)
  api/checkout            → session Stripe Checkout
  api/billing-portal      → portail client Stripe (annulation, factures)
  api/webhooks/stripe     → synchro de l'abonnement (source de vérité)
components/     UI (components/ui) + composants applicatifs
lib/            Clients & helpers (prisma, auth, stripe, email, zod, gating premium)
server/         Logique métier (roadmaps, users) + Server Actions
types/          Types partagés
prisma/         Schéma de la DB
proxy.ts        Protection des routes (Next 16 : remplace middleware.ts)
```

Règles clés du code :

- **Aucune logique métier dans les composants React** — tout passe par `server/`.
- **Toutes les entrées sont validées avec Zod** (`lib/validations.ts`).
- **Le gating premium est vérifié côté serveur** (`lib/subscription.ts`), jamais uniquement côté client.
- **Chaque requête DB est scopée au `tenantId`.**

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs — ne JAMAIS commit .env.local
npx prisma db push            # crée les tables sur votre PostgreSQL
npm run dev
```

### Stripe en local

1. Créer le produit « Premium » et son prix dans le dashboard Stripe (mode test).
2. Renseigner `NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Écouter les webhooks :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.
5. Activer le **portail client** Stripe (Paramètres → Billing → Customer portal) pour permettre l'annulation.

Carte de test : `4242 4242 4242 4242`, n'importe quelle date future et CVC.

## Déploiement (Vercel)

```bash
npm install -g vercel
vercel --prod
```

- Configurer **toutes** les variables de `.env.example` sur Vercel (pas juste en local).
- DB de prod **séparée** de la DB de dev.
- Créer un endpoint webhook Stripe en prod pointant sur `https://votre-domaine/api/webhooks/stripe` avec les événements `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Connecter le domaine custom, et mettre à jour `NEXT_PUBLIC_URL`.
- Renseigner `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` dès le premier déploiement.

## Checklist « ça marche »

- [x] Un utilisateur peut s'inscrire (`/signup`, email de bienvenue)
- [x] Un utilisateur peut se connecter (`/login`)
- [x] Un utilisateur peut payer et devenir premium (Checkout + webhook)
- [x] L'accès aux fonctionnalités est conditionné par l'abonnement, vérifié côté serveur
- [x] Un utilisateur peut annuler son abonnement (portail Stripe dans `/settings`)
- [x] Les erreurs sont catchées et loggées (Sentry + `ActionResult`, pas de crash silencieux)
- [x] RGPD : bouton de suppression du compte et des données dans `/settings`
