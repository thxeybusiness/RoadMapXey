import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  sendPaymentConfirmationEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/email";

// Webhook Stripe : LA source de vérité pour l'état de l'abonnement.
// On ne fait jamais confiance au retour du client après un paiement.
// Test en local : stripe listen --forward-to localhost:3000/api/webhooks/stripe

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  // Selon la version d'API, current_period_end est sur l'item ou la subscription.
  const raw =
    subscription.items?.data?.[0]?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end;
  return raw ? new Date(raw * 1000) : null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      plan: subscription.status === "active" || subscription.status === "trialing"
        ? "premium"
        : "free",
      stripePriceId: subscription.items?.data?.[0]?.price?.id ?? null,
      currentPeriodEnd: getPeriodEnd(subscription),
    },
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return Response.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[stripe webhook] signature invalide", error);
    return Response.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !customerId) break;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) break;

        // Récupère le tarif souscrit pour distinguer Pro / Business.
        let priceId: string | null = null;
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            priceId = sub.items.data[0]?.price.id ?? null;
          } catch (error) {
            console.error("[stripe webhook] récupération du tarif", error);
          }
        }

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId ?? null,
            status: "active",
            plan: "premium",
            stripePriceId: priceId,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId ?? null,
            status: "active",
            plan: "premium",
            stripePriceId: priceId,
          },
        });

        await sendPaymentConfirmationEmail(user.email);
        break;
      }

      case "customer.subscription.updated": {
        await syncSubscription(event.data.object);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "canceled", plan: "free", stripeSubscriptionId: null },
        });

        const record = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
          include: { user: true },
        });
        if (record?.user) await sendSubscriptionCanceledEmail(record.user.email);
        break;
      }

      default:
        // Événement non géré : on répond 200 pour que Stripe arrête de retenter.
        break;
    }
  } catch (error) {
    // Erreur loggée + 500 : Stripe retentera la livraison.
    console.error(`[stripe webhook] échec du traitement de ${event.type}`, error);
    return Response.json({ error: "Erreur de traitement" }, { status: 500 });
  }

  return Response.json({ received: true });
}
