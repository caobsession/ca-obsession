const CACHE_VERSION = "v6";
const CACHE_NAME = `caobsession-cache-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys.map(key => {

          // Remove old cache versions
          if (
            key.startsWith("caobsession-cache-") &&
            key !== CACHE_NAME
          ) {
            console.log("Removing old cache:", key);
            return caches.delete(key);
          }

        })

      );

    })

  );

  self.clients.claim();

});

/* =========================
   FETCH
========================= */
self.addEventListener("fetch", event => {

  // Ignore non-GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then(networkResponse => {

          // Clone response
          const responseClone = networkResponse.clone();

          // Dynamically cache safe assets
          if (
            event.request.url.startsWith(self.location.origin)
          ) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(async () => {

        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/index.html");

          if (fallback) {
            return fallback;
          }
        }

        return Response.error();
      });

    })
  );
});
/* =========================
   MESSAGE LISTENER
========================= */

self.addEventListener("message", event => {

  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }

});