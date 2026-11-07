// Guarda la app en el móvil para que abra al instante y funcione sin conexión en el ensayo.
// Sube VERSION cada vez que cambies index.html para que los móviles descarguen la nueva versión.
const VERSION = "pulso-v4";
const SHELL = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co")) return; // la sincronización siempre va a la red

  // La app: primero la red (para recibir actualizaciones) y, sin conexión, la copia guardada.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // Tipografías de Google: se guardan la primera vez.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })));
  }
});
