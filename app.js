
(function () {
  'use strict';

  // ---- menu plegable en movil ----
  var btn = document.getElementById('btnMenu');
  var menu = document.getElementById('menuPrincipal');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      btn.querySelector('.btn-menu-txt').textContent = abierto ? 'Cerrar' : 'Menú';
    });
    // al pulsar una seccion, el menu se cierra solo
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('abierto');
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('.btn-menu-txt').textContent = 'Menú';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        menu.classList.remove('abierto');
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('.btn-menu-txt').textContent = 'Menú';
        btn.focus();
      }
    });
  }

  // ---- volver arriba ----
  // Usa IntersectionObserver sobre un testigo colocado arriba del todo.
  // El evento 'scroll' no siempre se emite (por ejemplo al saltar a un ancla
  // o al desplazarse por codigo), asi que no sirve como unica senal.
  var arriba = document.getElementById('btnArriba');
  if (arriba) {
    var testigo = document.createElement('div');
    testigo.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:500px;' +
                            'pointer-events:none;visibility:hidden';
    document.body.appendChild(testigo);
    var mostrar = function (visible) { arriba.classList.toggle('visible', !visible); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { mostrar(e[0].isIntersecting); })
        .observe(testigo);
    }
    // red de seguridad para navegadores sin IntersectionObserver
    var porScroll = function () { arriba.classList.toggle('visible', window.scrollY > 400); };
    window.addEventListener('scroll', porScroll, { passive: true });
    arriba.addEventListener('click', function () {
      var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
      var m = document.querySelector('main');
      if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); }
    });
  }

  // ---- si llegas por un enlace a un bloque plegado, se abre solo ----
  var abrirDestino = function () {
    if (!location.hash) return;
    var d = document.querySelector(location.hash);
    if (!d) return;
    var det = d.tagName === 'DETAILS' ? d : d.closest('details');
    if (det && !det.open) {
      det.open = true;
      det.scrollIntoView({ block: 'start' });
    }
  };
  abrirDestino();
  window.addEventListener('hashchange', abrirDestino);

  // ---- lista de la compra: marcar lo que ya tienes en el carro ----
  var tablas = document.querySelectorAll('table[data-lista]');
  if (!tablas.length) return;

  var CLAVE = 'compra-marcados';
  var guardado;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE) || '[]'); }
  catch (e) { guardado = []; }
  var marcados = {};
  guardado.forEach(function (k) { marcados[k] = true; });

  var guardar = function () {
    try { localStorage.setItem(CLAVE, JSON.stringify(Object.keys(marcados))); }
    catch (e) { /* modo privado: no se puede guardar, pero sigue funcionando */ }
  };

  var actualizarContador = function () {
    document.querySelectorAll('[data-contador]').forEach(function (c) {
      var lista = c.getAttribute('data-contador');
      var filas = document.querySelectorAll('table[data-lista="' + lista + '"] tr.marcable');
      var ok = document.querySelectorAll('table[data-lista="' + lista + '"] tr.marcable.hecho');
      c.textContent = ok.length + ' de ' + filas.length;
    });
  };

  tablas.forEach(function (tabla) {
    tabla.querySelectorAll('tr.marcable').forEach(function (fila) {
      var id = fila.getAttribute('data-id');
      if (marcados[id]) fila.classList.add('hecho');
      var alternar = function () {
        var hecho = fila.classList.toggle('hecho');
        if (hecho) { marcados[id] = true; } else { delete marcados[id]; }
        fila.setAttribute('aria-pressed', hecho ? 'true' : 'false');
        guardar();
        actualizarContador();
      };
      fila.setAttribute('role', 'button');
      fila.setAttribute('tabindex', '0');
      fila.setAttribute('aria-pressed', marcados[id] ? 'true' : 'false');
      fila.addEventListener('click', alternar);
      fila.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });
    });
  });

  document.querySelectorAll('.btn-reset').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('tr.marcable.hecho').forEach(function (f) {
        f.classList.remove('hecho');
        f.setAttribute('aria-pressed', 'false');
      });
      marcados = {};
      guardar();
      actualizarContador();
    });
  });

  actualizarContador();
})();
