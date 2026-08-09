
// Servicio que guarda la web en el movil para que funcione sin cobertura.
var VERSION = 'plan-977b0c9c';
var FICHEROS = ["index.html", "plan.html", "recetas.html", "basicos.html", "compra.html", "coste.html", "nutrientes.html", "progreso.html", "imprevistos.html", "guia.html", "estilo.css?v=977b0c9c", "app.js?v=977b0c9c", "plan.json?v=977b0c9c", "icono-192.png", "icono-512.png", "icono-apple.png", "favicon.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    // 'reload' salta la cache del navegador: si no, guardariamos otra vez
    // la copia vieja que Chrome tiene retenida hasta 10 minutos.
    return Promise.all(FICHEROS.map(function (f) {
      return fetch(f, { cache: 'reload' }).then(function (r) {
        if (r.ok) return c.put(f, r);
      }).catch(function () {});
    }));
  }).then(function () {
    // Entra en vigor sin esperar a que se cierren las pestanias abiertas.
    // Es seguro porque cada version tiene sus propias direcciones (?v=...),
    // y evita que la version nueva se quede esperando indefinidamente.
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; })
                             .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Primero la red (para tener siempre lo ultimo), y si no hay cobertura, la copia guardada.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  // El video pesa 15 MB: se sirve de la red y no se guarda, o se come la cache
  // que el movil reserva para la app entera.
  if (/\.(mp4|webm|mov)$/i.test(new URL(e.request.url).pathname)) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (r) {
        return r || caches.match('index.html');
      });
    })
  );
});

// La pagina puede pedir que la version nueva entre en vigor ya.
self.addEventListener('message', function (e) {
  if (e.data === 'actualizar') self.skipWaiting();
});
