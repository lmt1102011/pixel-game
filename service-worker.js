const SOULRIFT_CACHE = "soulrift-pwa-20260607-door-aura-stable-303";
const SOULRIFT_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260607-door-aura-stable-303",
  "./src/pwa.js?v=20260607-door-aura-stable-303",
  "./src/game.js?v=20260607-door-aura-stable-303",
  "./manifest.webmanifest?v=20260607-door-aura-stable-303",
  "./version.json",
  "./assets/icons/app-icon-20260605-logo-xl-149.svg",
  "./assets/icons/app-icon-20260605-logo-xl-149-192.png",
  "./assets/icons/app-icon-20260605-logo-xl-149-512.png",
  "./assets/icons/app-icon-20260605-logo-xl-149-maskable-512.png",
  "./assets/icons/apple-touch-icon-20260605-logo-xl-149.png",
  "./assets/exported/asset-manifest.json?v=20260607-door-aura-stable-303",
  "./assets/exported-atlas/atlas-manifest.json?v=20260607-door-aura-stable-303",
  "./assets/sprites/monsters/shadow-goblin.png?v=20260607-door-aura-stable-303"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SOULRIFT_CACHE)
      .then((cache) => cache.addAll(SOULRIFT_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SOULRIFT_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const networkFirst = request.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/version.json") ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/src/pwa.js") ||
    url.pathname.endsWith("/src/game.js");
  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(SOULRIFT_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(SOULRIFT_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
