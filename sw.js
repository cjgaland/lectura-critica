// ============================================================
//  sw.js — Service Worker · Lectura Crítica
//  Estrategia network-first con fallback a caché para uso offline.
//  Al cambiar cualquier archivo, incrementa CACHE_NAME.
// ============================================================

const CACHE_NAME = "lecturacritica-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./calculos.js",
  "./logic.js",
  "./plantillas.js",
  "./xlsx.js",
  "./docx.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./favicon-32.png",
  "./favicon-16.png",
  "./icon-512.svg"
];

self.addEventListener("install", event => {
  // Sin skipWaiting aquí: la versión nueva espera hasta que el usuario pulse
  // «Actualizar» en el aviso de la app (mensaje SKIP_WAITING).
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      // Solo las cachés de esta app: las demás apps del ecosistema comparten el
      // mismo origen (cjgaland.github.io) y sus copias sin conexión no se tocan.
      .then(keys => Promise.all(keys.filter(k => k.startsWith("lecturacritica-") && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
