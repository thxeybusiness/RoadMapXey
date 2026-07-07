// Service worker minimal — sa présence (avec un gestionnaire fetch) rend
// l'app installable. Stratégie « réseau d'abord » : on ne met rien en cache
// agressivement (l'app a besoin de données fraîches et d'une session), mais
// on sert une réponse de secours hors-ligne si le réseau échoue.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // On ne gère que les navigations GET de même origine.
  if (request.method !== "GET") return;
  event.respondWith(
    fetch(request).catch(() =>
      request.mode === "navigate"
        ? new Response(
            "<h1>Hors ligne</h1><p>Reconnectez-vous à Internet pour utiliser RoadMap Business.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        : Response.error()
    )
  );
});
