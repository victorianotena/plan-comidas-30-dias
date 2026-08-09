
(function () {
  'use strict';

  // ---- la cabecera pegajosa cambia de alto: hay que medirla ----
  var cab = document.querySelector('.cab');
  if (cab) {
    var medirCab = function () {
      document.documentElement.style.setProperty('--alto-cab', (cab.offsetHeight + 18) + 'px');
    };
    medirCab();
    window.addEventListener('resize', medirCab);
    window.addEventListener('orientationchange', medirCab);
  }

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

  // Cada boton desmarca SOLO su lista. Antes borraba las dos quincenas de golpe y
  // sin avisar: con media compra marcada en el super, se perdia entera.
  document.querySelectorAll('.btn-reset').forEach(function (b) {
    b.addEventListener('click', function () {
      var lid = b.getAttribute('data-lista');
      var filas = document.querySelectorAll(
        lid ? 'table[data-lista="' + lid + '"] tr.marcable.hecho' : 'tr.marcable.hecho');
      if (!filas.length) return;
      if (!window.confirm('Se van a desmarcar ' + filas.length +
          (filas.length === 1 ? ' producto de esta lista.' : ' productos de esta lista.') +
          ' ¿Seguro?')) return;
      filas.forEach(function (f) {
        f.classList.remove('hecho');
        f.setAttribute('aria-pressed', 'false');
        delete marcados[f.getAttribute('data-id')];
      });
      guardar();
      actualizarContador();
    });
  });

  actualizarContador();
})();

// ============================================================ QUE TOCA HOY
(function () {
  'use strict';
  var caja = document.getElementById('hoy');
  if (!caja) return;
  var CLAVE = 'plan-dia-actual';
  var dia = parseInt(localStorage.getItem(CLAVE) || '1', 10);
  if (!(dia >= 1 && dia <= 30)) dia = 1;
  var datos = null;

  var pintar = function () {
    if (!datos) return;
    var d = datos[String(dia)];
    document.getElementById('hoyDia').textContent = 'día ' + dia;
    document.getElementById('hoyBloque').textContent = d.bloque + ' de 6';
    var h = '';
    if (d.cocinaHoy) {
      h += '<div class="aviso" style="margin:18px 0"><span class="et">Hoy toca cocinar en tanda</span>' +
           '<p>' + d.tanda + '</p></div>';
    }
    h += '<p class="hoy-plato">' + d.titulo + '</p>';
    if (d.recetas.length) {
      h += '<p class="etiqueta">Ya cocinado</p><ul class="lista caja-rac">';
      d.recetas.forEach(function (r) {
        h += '<li><a class="ir-receta" href="' + r.enlace + '">' + r.nombre +
             '<span class="flecha" aria-hidden="true">&rsaquo;</span></a>' +
             '<span class="cant">' + r.cantidad + '</span></li>';
      });
      h += '</ul>';
    }
    if (d.pesar.length) {
      h += '<p class="etiqueta">Pesar y preparar</p><ul class="lista">';
      d.pesar.forEach(function (p) {
        h += '<li><span>' + p.nombre + '</span><span class="cant">' + p.gramos + '</span></li>';
      });
      h += '</ul>';
    }
    document.getElementById('hoyCuerpo').innerHTML = h;
    document.getElementById('diaMenos').disabled = (dia === 1);
    document.getElementById('diaMas').disabled = (dia === 30);
    localStorage.setItem(CLAVE, String(dia));
  };

  var mover = function (n) {
    dia = Math.min(30, Math.max(1, dia + n));
    pintar();
  };
  document.getElementById('diaMenos').addEventListener('click', function () { mover(-1); });
  document.getElementById('diaMas').addEventListener('click', function () { mover(1); });
  document.getElementById('hoyReiniciar').addEventListener('click', function () {
    dia = 1; pintar();
  });

  fetch('plan.json?v=36e74dac').then(function (r) { return r.json(); }).then(function (j) {
    datos = j; caja.hidden = false; pintar();
  }).catch(function () { /* sin datos, la seccion se queda oculta */ });
})();

// ============================================================ REGISTRO DE PESO
(function () {
  'use strict';
  var form = document.getElementById('formPeso');
  if (!form) return;
  var CLAVE = 'registro-peso';
  var datos;
  try { datos = JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (e) { datos = []; }

  var guardar = function () {
    datos.sort(function (a, b) { return a.f < b.f ? -1 : 1; });
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  };

  var fmt = function (iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  };
  // En espaniol el decimal se escribe con coma
  var kg = function (n) { return n.toFixed(1).replace('.', ',') + ' kg'; };

  var grafica = function () {
    var svg = document.getElementById('grafica');
    // El SVG se dibuja en pixeles REALES. Con un viewBox fijo de 600, en el movil
    // se escalaba a la mitad y los numeros del eje salian a 6,6 px, ilegibles.
    var W = Math.max(300, Math.round(svg.clientWidth || 600)), H = 260;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    if (datos.length < 2) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="currentColor" ' +
        'font-size="18">Apunta al menos dos pesos para ver la gráfica</text>';
      return;
    }
    var mx = 54, my = 26;
    var pesos = datos.map(function (d) { return d.p; });
    var min = Math.min.apply(null, pesos) - 1, max = Math.max.apply(null, pesos) + 1;
    var t0 = new Date(datos[0].f).getTime();
    var t1 = new Date(datos[datos.length - 1].f).getTime();
    var dias = Math.max(1, (t1 - t0) / 86400000);
    var X = function (f) { return mx + ((new Date(f).getTime() - t0) / 86400000 / dias) * (W - mx - my); };
    var Y = function (p) { return my + (1 - (p - min) / (max - min)) * (H - my * 2); };
    var s = '';
    // rejilla
    for (var i = 0; i <= 4; i++) {
      var v = min + (max - min) * i / 4, y = Y(v);
      s += '<line x1="' + mx + '" y1="' + y + '" x2="' + (W - my) + '" y2="' + y +
           '" stroke="currentColor" stroke-opacity=".15"/>' +
           '<text x="' + (mx - 8) + '" y="' + (y + 6) + '" text-anchor="end" font-size="16" ' +
           'fill="currentColor" fill-opacity=".75">' + v.toFixed(1).replace('.', ',') + '</text>';
    }
    // linea prevista: -1 kg por semana desde el primer peso
    var prev0 = datos[0].p, prevFin = prev0 - (dias / 7) * 1;
    if (prevFin > min && prevFin < max) {
      s += '<line x1="' + X(datos[0].f) + '" y1="' + Y(prev0) + '" x2="' + X(datos[datos.length - 1].f) +
           '" y2="' + Y(prevFin) + '" stroke="currentColor" stroke-opacity=".35" ' +
           'stroke-dasharray="7 5" stroke-width="2"/>';
    }
    // linea real
    var pts = datos.map(function (d) { return X(d.f) + ',' + Y(d.p); }).join(' ');
    s += '<polyline points="' + pts + '" fill="none" stroke="var(--acento)" stroke-width="3" ' +
         'stroke-linejoin="round" stroke-linecap="round"/>';
    datos.forEach(function (d) {
      s += '<circle cx="' + X(d.f) + '" cy="' + Y(d.p) + '" r="5" fill="var(--acento)"/>';
    });
    svg.innerHTML = s;
  };

  var resumen = function () {
    var caja = document.getElementById('resumenPeso');
    if (datos.length < 2) { caja.innerHTML = ''; return; }
    var a = datos[0], b = datos[datos.length - 1];
    var dias = Math.max(1, (new Date(b.f) - new Date(a.f)) / 86400000);
    var dif = b.p - a.p;
    var sem = dif / (dias / 7);
    var juicio, clase;
    if (sem > -0.3) { juicio = 'Vas más lento de lo previsto. Revisa que las cantidades sean las del plan.'; clase = 'atencion'; }
    else if (sem >= -1.1) { juicio = 'Vas al ritmo previsto.'; clase = ''; }
    else { juicio = 'Estás perdiendo más rápido de lo previsto. Conviene subir las calorías y comentarlo con tu médico.'; clase = 'atencion'; }
    caja.innerHTML =
      '<dl class="datos"><div><dt>Peso inicial</dt><dd>' + kg(a.p) + '</dd></div>' +
      '<div><dt>Peso actual</dt><dd>' + kg(b.p) + '</dd></div>' +
      '<div><dt>Diferencia</dt><dd>' + (dif > 0 ? '+' : '') + kg(dif) + '</dd></div>' +
      '<div><dt>Por semana</dt><dd>' + sem.toFixed(2).replace('.', ',') + ' kg</dd></div>' +
      '<div><dt>Días registrados</dt><dd>' + Math.round(dias) + '</dd></div></dl>' +
      '<div class="aviso ' + clase + '"><span class="et">Cómo va</span><p>' + juicio + '</p>' +
      '<p>El plan prevé perder alrededor de <strong>1 kg por semana</strong>. ' +
      'La línea de puntos de la gráfica es ese ritmo.</p></div>';
  };

  var tabla = function () {
    var tb = document.querySelector('#tablaPeso tbody');
    tb.innerHTML = datos.map(function (d, i) {
      return '<tr><td>' + fmt(d.f) + '</td><td class="num">' + kg(d.p) + '</td>' +
             '<td><button type="button" class="btn-borrar" data-i="' + i + '">Borrar</button></td></tr>';
    }).join('') || '<tr><td colspan="3">Todavía no hay ningún peso apuntado.</td></tr>';
    tb.querySelectorAll('.btn-borrar').forEach(function (b) {
      b.addEventListener('click', function () {
        datos.splice(parseInt(b.dataset.i, 10), 1); guardar(); todo();
      });
    });
  };

  var todo = function () { tabla(); grafica(); resumen(); };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var campo = document.getElementById('valorPeso');
    var f = document.getElementById('fechaPeso').value;
    // Aqui se escribe con COMA. Un input type=number la rechaza y deja el campo
    // vacio sin decir nada, asi que es de texto y se convierte a mano.
    var p = parseFloat(String(campo.value).replace(',', '.'));
    campo.setCustomValidity('');
    if (!f) { document.getElementById('fechaPeso').reportValidity(); return; }
    if (!(p > 20 && p < 400)) {
      campo.setCustomValidity('Escribe un peso entre 20 y 400 kilos. Por ejemplo 98,4');
      campo.reportValidity();
      return;
    }
    datos = datos.filter(function (d) { return d.f !== f; });
    datos.push({ f: f, p: p });
    guardar(); todo();
    campo.value = '';
  });
  document.getElementById('valorPeso').addEventListener('input', function () {
    this.setCustomValidity('');
  });

  document.getElementById('borrarTodo').addEventListener('click', function () {
    if (datos.length && confirm('¿Borrar todos los pesos apuntados?')) {
      datos = []; guardar(); todo();
    }
  });

  var hoy = new Date();
  document.getElementById('fechaPeso').value =
    hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') +
    '-' + String(hoy.getDate()).padStart(2, '0');
  todo();
})();

// ============================================================ APP INSTALABLE
// Las actualizaciones son SILENCIOSAS a proposito.
// Cada version tiene sus propias direcciones (?v=...) y el service worker se
// activa solo, asi que la version nueva entra sin que el usuario haga nada:
// la vera la proxima vez que abra la app. No hay avisos ni recargas
// automaticas, que es de donde salian los bucles.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(function (reg) {
        // Buscar novedades como mucho una vez por hora, y nunca de forma
        // que interrumpa lo que se esta mirando.
        var CLAVE = 'sw-ultima-comprobacion';
        var comprobar = function () {
          var t = parseInt(localStorage.getItem(CLAVE) || '0', 10);
          if (Date.now() - t < 3600000) return;
          try { localStorage.setItem(CLAVE, String(Date.now())); } catch (e) {}
          reg.update();
        };
        comprobar();
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) comprobar();
        });
      }).catch(function () {});
  });
}

(function () {
  'use strict';
  var caja = document.getElementById('instalar');
  if (!caja) return;
  var accion = document.getElementById('instAccion');
  var sub = document.getElementById('instSub');

  // ¿ya esta instalada? entonces no hace falta decir nada
  var yaInstalada = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;
  if (yaInstalada) return;

  var ua = navigator.userAgent;
  var esIOS = /iPad|iPhone|iPod/.test(ua) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var esAndroid = /Android/.test(ua);
  var esFirefox = /Firefox/.test(ua);
  var esSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

  var pasos = function (lista, nota) {
    var h = '<ol class="pasos" style="margin-top:18px">';
    lista.forEach(function (p) { h += '<li>' + p + '</li>'; });
    h += '</ol>';
    if (nota) h += '<p class="inst-nota">' + nota + '</p>';
    return h;
  };

  // 1) Chromium (Android y escritorio): boton real de instalacion
  var evento = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    evento = e;
    accion.innerHTML = '<button type="button" class="enlace-video" id="btnInstalar" ' +
      'style="border:none;cursor:pointer;font-size:19px;margin-top:16px">' +
      'Instalar en este dispositivo</button>' +
      '<p class="inst-nota">Un toque y listo. Ocupa menos de un megabyte.</p>';
    document.getElementById('btnInstalar').addEventListener('click', function () {
      evento.prompt();
      evento.userChoice.then(function (r) {
        if (r.outcome === 'accepted') {
          accion.innerHTML = '<p class="inst-ok">Instalada. Búscala en la pantalla de inicio.</p>';
        }
      });
    });
    caja.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    accion.innerHTML = '<p class="inst-ok">Instalada. Búscala en la pantalla de inicio.</p>';
  });

  // 2) Instrucciones segun el movil, por si el navegador no ofrece el boton
  setTimeout(function () {
    if (evento) return;   // ya hay boton real, no hacen falta instrucciones
    if (esIOS) {
      sub.textContent = 'En iPhone y iPad se añade a mano, desde Safari.';
      accion.innerHTML = pasos([
        'Abre esta página en <strong>Safari</strong> (no funciona desde Chrome ni desde Instagram).',
        'Toca el botón <strong>Compartir</strong>: el cuadrado con la flecha hacia arriba, ' +
        'abajo en el centro de la pantalla.',
        'Baja por la lista y toca <strong>«Añadir a pantalla de inicio»</strong>.',
        'Toca <strong>«Añadir»</strong> arriba a la derecha.'
      ], 'Safari no enseña ningún aviso automático: hay que hacerlo así.');
    } else if (esAndroid && esFirefox) {
      sub.textContent = 'En Firefox para Android se añade desde el menú.';
      accion.innerHTML = pasos([
        'Toca el <strong>menú de tres puntos</strong>, arriba a la derecha.',
        'Toca <strong>«Instalar»</strong> o <strong>«Añadir a la pantalla de inicio»</strong>.'
      ]);
    } else if (esAndroid) {
      sub.textContent = 'En Android se añade desde el menú del navegador.';
      accion.innerHTML = pasos([
        'Toca el <strong>menú de tres puntos</strong>, arriba a la derecha.',
        'Toca <strong>«Añadir a pantalla de inicio»</strong> o <strong>«Instalar aplicación»</strong>.',
        'Confirma tocando <strong>«Instalar»</strong>.'
      ], 'Si no aparece la opción, prueba a abrirla en Chrome.');
    } else if (esSafari) {
      sub.textContent = 'En Safari de Mac se añade desde el Dock.';
      accion.innerHTML = pasos([
        'En el menú <strong>Archivo</strong>, elige <strong>«Añadir al Dock»</strong>.'
      ]);
    } else {
      sub.textContent = 'En el ordenador se instala desde la barra de direcciones.';
      accion.innerHTML = pasos([
        'Busca el icono de <strong>instalar</strong> (una pantalla con una flecha) ' +
        'a la derecha de la barra de direcciones.',
        'También está en el menú del navegador, como <strong>«Instalar…»</strong>.'
      ], 'Si no lo ves, no pasa nada: la web funciona igual desde el navegador.');
    }
    caja.hidden = false;
  }, 1200);
})();
