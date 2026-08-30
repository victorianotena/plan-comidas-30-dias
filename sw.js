
// Servicio que guarda la web en el movil para que funcione sin cobertura.
var VERSION = 'plan-3e9fcbaa';
// La base de productos tiene SU PROPIA cache, con un nombre que solo depende de
// lo que hay dentro de basees.txt. Antes se guardaba en la de VERSION, y como
// VERSION cambia con cualquier cambio del codigo —hasta un comentario—, cada
// publicacion borraba la cache entera y con ella la base: 12,4 MB de datos
// moviles a cada persona, para volver a bajar el mismo fichero. Separandola:
//   - publicacion normal  -> VERSION cambia, CACHE_BASE no: la base se queda
//   - la base cambia      -> CACHE_BASE cambia: se baja la nueva, y la vieja la
//                            borra la limpieza de abajo por tener otro nombre
// UNA CAJA POR PAIS. Si hubiera una sola, regenerar la base espanola borraria
// la britanica y al revés, y el que estuviera en Gibraltar se comeria 3,2 MB
// por un cambio que no le afecta.
var CACHES_BASE = {"es": "plan-base-es-7de0dffd", "uk": "plan-base-uk-ccadefce"};
var ES_BASE = /\/base[a-z]{2}\.txt$/;
var FICHEROS = ["index.html", "plan.html", "recetas.html", "basicos.html", "compra.html", "escanear.html", "coste.html", "nutrientes.html", "progreso.html", "imprevistos.html", "guia.html", "estilo.css?v=3e9fcbaa", "app.js?v=3e9fcbaa", "plan.json?v=3e9fcbaa", "escaner.json?v=3e9fcbaa", "icono-192.png", "icono-512.png", "icono-apple.png", "favicon.png"];

// De la direccion pedida a la caja que le toca: /baseuk.txt -> plan-base-uk-xxxx
var cajaDe = function (ruta) {
  var m = ruta.match(/\/base([a-z]{2})\.txt$/);
  return m ? CACHES_BASE[m[1]] : null;
};

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
    // Las cajas de las bases se salvan de la quema. Es TODO el arreglo: si se
    // borraran aqui, separarlas del resto no habria servido de nada. Cuando una
    // base cambie de verdad, la de antes tendra otro nombre y esta misma linea
    // la borrara -- sin tocar la del otro pais, que conserva el suyo.
    var salvadas = [VERSION];
    for (var k2 in CACHES_BASE) salvadas.push(CACHES_BASE[k2]);
    return Promise.all(claves.filter(function (k) { return salvadas.indexOf(k) < 0; })
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
  if (ES_BASE.test(new URL(e.request.url).pathname)) {
    var caja = cajaDe(new URL(e.request.url).pathname);
    if (!caja) return;                      // una base que esta web no publica
    e.respondWith(caches.open(caja).then(function (c) {
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
