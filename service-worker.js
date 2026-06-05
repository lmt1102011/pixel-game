const SOULRIFT_CACHE = "soulrift-pwa-20260605-logo-large-148";
const SOULRIFT_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260605-logo-large-148",
  "./src/pwa.js?v=20260605-logo-large-148",
  "./src/game.js?v=20260605-logo-large-148",
  "./manifest.webmanifest?v=20260605-logo-large-148",
  "./version.json",
  "./assets/icons/app-icon-20260605-logo-large-148.svg",
  "./assets/icons/app-icon-20260605-logo-large-148-192.png",
  "./assets/icons/app-icon-20260605-logo-large-148-512.png",
  "./assets/icons/app-icon-20260605-logo-large-148-maskable-512.png",
  "./assets/icons/apple-touch-icon-20260605-logo-large-148.png"
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
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
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
