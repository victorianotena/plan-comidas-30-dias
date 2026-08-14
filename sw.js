
// Servicio que guarda la web en el movil para que funcione sin cobertura.
var VERSION = 'plan-794ea61b';
// La base de productos tiene SU PROPIA cache, con un nombre que solo depende de
// lo que hay dentro de basees.txt. Antes se guardaba en la de VERSION, y como
// VERSION cambia con cualquier cambio del codigo —hasta un comentario—, cada
// publicacion borraba la cache entera y con ella la base: 12,4 MB de datos
// moviles a cada persona, para volver a bajar el mismo fichero. Separandola:
//   - publicacion normal  -> VERSION cambia, CACHE_BASE no: la base se queda
//   - la base cambia      -> CACHE_BASE cambia: se baja la nueva, y la vieja la
//                            borra la limpieza de abajo por tener otro nombre
var CACHE_BASE = 'plan-base-7de0dffd';
var FICHEROS = ["index.html", "plan.html", "recetas.html", "basicos.html", "compra.html", "escanear.html", "coste.html", "nutrientes.html", "progreso.html", "imprevistos.html", "guia.html", "estilo.css?v=794ea61b", "app.js?v=794ea61b", "plan.json?v=794ea61b", "escaner.json?v=794ea61b", "icono-192.png", "icono-512.png", "icono-apple.png", "favicon.png"];

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
    // CACHE_BASE se salva de la quema. Es TODO el arreglo: si se borrara aqui,
    // separarla del resto no habria servido de nada. Cuando la base cambie de
    // verdad, la de antes tendra otro nombre y esta misma linea la borrara.
    return Promise.all(claves.filter(function (k) { return k !== VERSION && k !== CACHE_BASE; })
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

  // La base de productos son 12,4 MB y solo cambia cuando se regenera con
  // baja_base.py. Con la regla normal (red primero) se la volveria a bajar
  // ENTERA cada vez que se abriera el escaner, y comprando eso son megas del
  // movil tirados. Aqui manda la copia guardada; la version nueva llega al
  // cambiar CACHE_BASE, que deja la copia anterior sin nadie que la busque.
  //
  // Se mira DENTRO de CACHE_BASE, no con caches.match a secas: ese busca en
  // TODAS las caches, asi que en el rato entre instalar la version nueva y
  // activarla podria devolver la base vieja, que es justo lo que no se quiere
  // el dia en que la base cambia.
  if (/\/basees\.txt$/.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.open(CACHE_BASE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (r) {
        return r || fetch(e.request).then(function (n) {
          if (n.ok) c.put(e.request, n.clone());
          return n;
        });
      });
    }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (r) {
        return r || (e.request.mode === 'navigate' ? caches.match('index.html') : Promise.resolve());
      });
    })
  );
});

// La pagina puede pedir que la version nueva entre en vigor ya.
self.addEventListener('message', function (e) {
  if (e.data === 'actualizar') self.skipWaiting();
});
