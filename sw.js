
// Servicio que guarda la web en el movil para que funcione sin cobertura.
var VERSION = 'plan-5b5c96b397';
var FICHEROS = ["index.html", "plan.html", "recetas.html", "basicos.html", "compra.html", "coste.html", "nutrientes.html", "progreso.html", "guia.html", "estilo.css", "app.js", "plan.json", "icono-192.png", "icono-512.png", "icono-apple.png", "favicon.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(FICHEROS);
  }).then(function () { return self.skipWaiting(); }));
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
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('index.html');
      });
    })
  );
});
