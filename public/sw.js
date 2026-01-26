const CACHE_NAME = "ollamaui-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Eliminando cache antiguo:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - devolver respuesta desde cache
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Verificar si recibimos una respuesta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clonar la respuesta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }),
  );
});
