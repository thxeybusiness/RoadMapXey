import { Resend } from "resend";
import { getBaseUrl } from "@/lib/env";

// Emails transactionnels via Resend.
// Sans RESEND_API_KEY, on log au lieu d'envoyer — l'app ne casse jamais
// à cause d'un email (les erreurs d'envoi sont catchées et loggées).

const from = process.env.EMAIL_FROM ?? "RoadMap Business <onboarding@resend.dev>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.info(`[email] RESEND_API_KEY absent — email "${subject}" pour ${to} non envoyé`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error(`[email] échec d'envoi "${subject}" à ${to}`, error);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send(
    to,
    "Bienvenue sur RoadMap Business 🎉",
    `<h1>Bienvenue ${name} !</h1>
     <p>Votre compte RoadMap Business est prêt. Créez votre première roadmap dès maintenant :</p>
     <p><a href="${getBaseUrl()}/dashboard">Accéder au dashboard</a></p>`
  );
}

export async function sendPaymentConfirmationEmail(to: string) {
  await send(
    to,
    "Paiement confirmé — bienvenue en Premium ✨",
    `<h1>Merci pour votre abonnement !</h1>
     <p>Votre compte est passé en <strong>Premium</strong> : roadmaps et items illimités.</p>
     <p><a href="${getBaseUrl()}/dashboard">Retourner au dashboard</a></p>`
  );
}

export async function sendTeamInviteEmail(
  to: string,
  teamName: string,
  joinUrl: string
) {
  await send(
    to,
    `Invitation à rejoindre ${teamName} sur RoadMap Business`,
    `<h1>Vous êtes invité·e à rejoindre ${teamName}</h1>
     <p>Rejoignez l'espace d'équipe pour collaborer sur les mêmes roadmaps.</p>
     <p><a href="${joinUrl}">Rejoindre l'équipe</a></p>
     <p style="color:#888;font-size:12px">Si vous n'avez pas de compte, créez-en un avec cette adresse email, puis rouvrez ce lien.</p>`
  );
}

export async function sendSubscriptionCanceledEmail(to: string) {
  await send(
    to,
    "Votre abonnement a été annulé",
    `<h1>Abonnement annulé</h1>
     <p>Votre abonnement Premium est annulé. Vous repassez au plan gratuit à la fin de la période en cours.</p>
     <p>Vous pouvez vous réabonner à tout moment depuis la <a href="${getBaseUrl()}/pricing">page tarifs</a>.</p>`
  );
}
