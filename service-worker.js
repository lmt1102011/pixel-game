const VERSION_META_PATH = "./version.json";
let SOULRIFT_CACHE_VERSION = "soulrift-pwa-20260609-minecraft-smooth-room-311";
const SOULRIFT_CACHE = `soulrift-pwa-${SOULRIFT_CACHE_VERSION}`;
const SOULRIFT_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=" + SOULRIFT_CACHE_VERSION,
  "./src/pwa.js?v=" + SOULRIFT_CACHE_VERSION,
  "./src/game.js?v=" + SOULRIFT_CACHE_VERSION,
  "./manifest.webmanifest?v=" + SOULRIFT_CACHE_VERSION,
  "./version.json",
  "./assets/icons/app-icon-20260605-logo-xl-149.svg",
  "./assets/icons/app-icon-20260605-logo-xl-149-192.png",
  "./assets/icons/app-icon-20260605-logo-xl-149-512.png",
  "./assets/icons/app-icon-20260605-logo-xl-149-maskable-512.png",
  "./assets/icons/apple-touch-icon-20260605-logo-xl-149.png",
  "./assets/exported/asset-manifest.json?v=" + SOULRIFT_CACHE_VERSION,
  "./assets/exported-atlas/atlas-manifest.json?v=" + SOULRIFT_CACHE_VERSION
  // large textures (sprite frames) are NOT fully prefetched here to avoid big install payload;
  // they will be runtime cached with stale-while-revalidate.
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

function isTextureRequest(url) {
  return url.pathname.startsWith("/assets/") &&
    (url.pathname.includes("/sprites/") || url.pathname.includes("/exported-atlas/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".webp"));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for navigation and core scripts/styles/version
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

  // For textures/atlases use stale-while-revalidate to keep app responsive while updating cache
  if (isTextureRequest(url)) {
    event.respondWith(
      caches.open(SOULRIFT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => null);
        // return cached immediately if available, otherwise wait network
        return cached || network;
      })
    );
    return;
  }

  // Default: cache-first falling back to network (for icons/manifest/other static)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(SOULRIFT_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => null);
    })
  );
});
