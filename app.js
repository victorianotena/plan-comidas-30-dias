
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

  var extra = function (d) {
    var h = '';
    if (d.sacar) {
      h += '<div class="aviso atencion" style="margin:18px 0 0">' +
           '<span class="et">Antes de acostarte</span><p>' + d.sacar + '</p></div>';
    }
    if (d.cocina && d.cocina.length) {
      h += '<details class="tarjeta" style="margin:18px 0 0"><summary>' +
           '<strong>Todo lo que necesitas hoy para cocinar</strong> (' +
           d.cocina.length + ' ingredientes)</summary><ul class="lista">';
      d.cocina.forEach(function (x) {
        h += '<li><span>' + x.nombre + '</span><span class="cant">' + x.gramos + '</span></li>';
      });
      h += '</ul></details>';
    }
    if (d.quedan && d.quedan.length) {
      h += '<details class="tarjeta" style="margin:18px 0 0"><summary>' +
           '<strong>Lo que va quedando en casa</strong></summary><ul class="lista">';
      d.quedan.forEach(function (x) {
        h += '<li><span>' + x.nombre + '</span><span class="cant">' + x.queda +
             ' · ' + x.pct + ' %</span></li>';
      });
      h += '</ul><p style="margin:12px 0 0">Solo se listan los cinco que más bajos van. ' +
           'No hay compra hasta el día 16.</p></details>';
    }
    return h;
  };

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
        h += '<li><span>' + p.nombre +
             // El aviso va DENTRO del <li> del ingrediente, no en una nota
             // aparte al final: se lee con la patata en la mano, que es cuando
             // sirve. Al final de la lista ya la has echado toda a la cesta.
             (p.aviso ? '<em class="ojo"> — ' + p.aviso + '</em>' : '') +
             '</span><span class="cant">' + p.gramos + '</span></li>';
      });
      h += '</ul>';
    }
    document.getElementById('hoyCuerpo').innerHTML = h + extra(d);
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

  fetch('plan.json?v=5f252b3a').then(function (r) { return r.json(); }).then(function (j) {
    datos = j; caja.hidden = false; pintar();
  }).catch(function () { /* sin datos, la seccion se queda oculta */ });
})();

// ============================================================ REGISTRO DE PESO
(function () {
  'use strict';
  var RITMO_MIN = 0.381, RITMO_MAX = 0.709, RITMO_MED = 0.545;
  var form = document.getElementById('formPeso');
  if (!form) return;
  var CLAVE = 'registro-peso';
  var datos;
  try { datos = JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (e) { datos = []; }

  var guardar = function () {
    datos.sort(function (a, b) { return a.f < b.f ? -1 : 1; });
    // Si el navegador no puede guardar (modo privado, memoria llena), hay que
    // DECIRLO. El catch vacio dejaba el peso en la tabla y en la grafica, asi
    // que parecia apuntado; al recargar no estaba y no habia forma de saber por
    // que. Aqui no vale el silencio: es el unico dato que aporta el usuario.
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      var caja = document.getElementById('resumenPeso');
      if (caja) {
        caja.insertAdjacentHTML('afterbegin',
          '<div class="aviso atencion"><span class="et">No se ha podido guardar</span>' +
          '<p>Este peso se ve ahora en la pantalla, pero <strong>no se ha guardado</strong>: ' +
          'al cerrar la página se pierde. Suele pasar en modo incógnito o cuando el ' +
          'navegador tiene la memoria llena.</p>' +
          '<p>Apúntalo en otro sitio de momento, o abre la página fuera del modo ' +
          'incógnito.</p></div>');
      }
      return false;
    }
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
    // linea prevista: el ritmo que dan las calorias del plan, no un 1 a ojo
    var prev0 = datos[0].p, prevFin = prev0 - (dias / 7) * RITMO_MED;
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
    var dias = (new Date(b.f) - new Date(a.f)) / 86400000;
    var dif = b.p - a.p;

    // MINIMO 10 DIAS antes de proyectar un ritmo semanal. Con dos pesos en dias
    // seguidos salia "-3,50 kg por semana" y un aviso de ir al medico, en una
    // pagina que dos parrafos antes avisa de que el peso diario baila por el
    // agua. Multiplicar ese baile por 7 es fabricar una alarma.
    var MIN_DIAS = 10;
    if (dias < MIN_DIAS) {
      caja.innerHTML =
        '<dl class="datos"><div><dt>Peso inicial</dt><dd>' + kg(a.p) + '</dd></div>' +
        '<div><dt>Peso actual</dt><dd>' + kg(b.p) + '</dd></div>' +
        '<div><dt>Diferencia</dt><dd>' + (dif > 0 ? '+' : '') + kg(dif) + '</dd></div>' +
        '<div><dt>Pesos apuntados</dt><dd>' + datos.length + '</dd></div>' +
        '<div><dt>Días entre el primero y el último</dt><dd>' + Math.round(dias) + '</dd></div></dl>' +
        '<div class="aviso"><span class="et">Todavía es pronto</span>' +
        '<p>Con menos de ' + MIN_DIAS + ' días entre el primer peso y el último no se puede ' +
        'sacar un ritmo semanal que signifique nada: el peso sube y baja un kilo largo ' +
        'solo por el agua y por lo que tengas en el estómago.</p>' +
        '<p>Sigue apuntándote una o dos veces por semana. En cuanto haya ' + MIN_DIAS +
        ' días, esto te dirá si vas al ritmo previsto.</p></div>';
      return;
    }

    var sem = dif / (dias / 7);
    // Se juzga con el MISMO numero que se enseña. Comparando el decimal sin
    // redondear contra el umbral, -1,10 kg/semana mandaba "habla con tu medico"
    // en un caso y "vas bien" en otro, con la misma cifra en pantalla.
    var semMostrado = Math.round(sem * 100) / 100;
    var juicio, clase;
    // Los umbrales tambien salian del "1 kg por semana" que ya no existe:
    // estaban en -0,3 y -1,1. Con el rango real (0,4 a 0,7) un -0,35 se
    // llamaba "mas lento de lo previsto" estando dentro. Ahora cuelgan del
    // ritmo calculado, con un 40 % de margen arriba y abajo, que es mas o menos
    // lo que baila una bascula de casa de una semana a otra.
    if (semMostrado > -RITMO_MIN * 0.6) { juicio = 'Vas más lento de lo previsto. Revisa que las cantidades sean las del plan.'; clase = 'atencion'; }
    else if (semMostrado >= -Math.max(RITMO_MAX * 1.4, 1.0)) { juicio = 'Vas al ritmo previsto.'; clase = ''; }
    else { juicio = 'Estás perdiendo más rápido de lo previsto. Conviene subir las calorías y comentarlo con tu médico.'; clase = 'atencion'; }
    caja.innerHTML =
      '<dl class="datos"><div><dt>Peso inicial</dt><dd>' + kg(a.p) + '</dd></div>' +
      '<div><dt>Peso actual</dt><dd>' + kg(b.p) + '</dd></div>' +
      '<div><dt>Diferencia</dt><dd>' + (dif > 0 ? '+' : '') + kg(dif) + '</dd></div>' +
      // El signo tambien aqui: sin el, subir 1,4 kg y bajar 1,4 kg se imprimian igual.
      '<div><dt>Por semana</dt><dd>' + (semMostrado > 0 ? '+' : '') +
      semMostrado.toFixed(2).replace('.', ',') + ' kg</dd></div>' +
      '<div><dt>Pesos apuntados</dt><dd>' + datos.length + '</dd></div>' +
      '<div><dt>Días entre el primero y el último</dt><dd>' + Math.round(dias) + '</dd></div></dl>' +
      '<div class="aviso ' + clase + '"><span class="et">Cómo va</span><p>' + juicio + '</p>' +
      '<p>Con las calorías de este plan lo esperable es perder entre ' +
      '<strong>' + RITMO_MIN.toFixed(1).replace('.', ',') + ' y ' +
      RITMO_MAX.toFixed(1).replace('.', ',') + ' kg por semana</strong>, según lo que ' +
      'te muevas. La línea de puntos es el punto medio.</p>' +
      '<p>Las dos primeras semanas suelen marcar bastante más: es agua y glucógeno, ' +
      'no grasa. Y si te pasas de <strong>1 kg por semana</strong> de forma sostenida, ' +
      'eso ya es una de las señales de ' +
      '<a href="imprevistos.html">cuándo parar y mirar</a>.</p></div>';
  };

  var tabla = function () {
    var tb = document.querySelector('#tablaPeso tbody');
    tb.innerHTML = datos.map(function (d, i) {
      return '<tr><td>' + fmt(d.f) + '</td><td class="num">' + kg(d.p) + '</td>' +
             '<td><button type="button" class="btn-borrar" data-i="' + i + '">Borrar</button></td></tr>';
    }).join('') || '<tr><td colspan="3">Todavía no hay ningún peso apuntado.</td></tr>';
    tb.querySelectorAll('.btn-borrar').forEach(function (b) {
      b.addEventListener('click', function () {
        // Este boton tambien pregunta. No lo hacia, y borra sin vuelta atras:
        // si le das al primero, "Peso inicial", "Diferencia" y "Por semana"
        // salen todos de esa fila y se reescriben enteros sin avisar.
        var i = parseInt(b.dataset.i, 10);
        var d = datos[i];
        if (!d) { return; }
        var aviso = 'Se va a borrar el peso de ' + fmt(d.f) + ' (' + kg(d.p) + ').';
        if (i === 0 && datos.length > 1) {
          aviso += '\n\nEs el primero, del que salen "Peso inicial", "Diferencia" y ' +
                   '"Por semana": todas esas cifras van a cambiar.';
        }
        if (!confirm(aviso + '\n\n¿Seguro?')) { return; }
        datos.splice(i, 1); guardar(); todo();
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

// ============================================================ COPIA DE SEGURIDAD
// Lo que marcas, el dia por el que vas y los pesos se guardan en el navegador,
// y el navegador los guarda POR DIRECCION. Si la pagina cambia de direccion, el
// movil los da por datos de otra web distinta y no los encuentra: no se borran,
// se quedan huerfanos en la direccion vieja. Por eso hay que poder sacarlos a un
// fichero y volver a meterlos. Sin esto, mudar el sitio pierde el progreso.
(function () {
  'use strict';
  var bGuardar = document.getElementById('guardarCopia');
  if (!bGuardar) return;
  var fichero = document.getElementById('ficheroCopia');
  var aviso = document.getElementById('avisoCopia');
  document.getElementById('restaurarCopia').addEventListener('click', function () {
    // Se limpia antes de abrir: si eliges DOS VECES el mismo fichero, el
    // navegador no dispara 'change' la segunda y parece que el boton no va.
    fichero.value = '';
    fichero.click();
  });

  // Las claves con datos SUYOS. 'sw-ultima-comprobacion' no entra: es un apunte
  // interno del service worker y restaurarlo solo retrasaria una comprobacion de
  // version. 'escaner-cache' tampoco: eso se saca otra vez de la base en un
  // instante y ademas caduca con la version.
  //
  // 'escaner-mano' y 'escaner-historial' SI, y faltaban. La pagina del escaner le
  // promete que lo que teclea del envase queda guardado "para siempre" y que lo
  // puede exportar desde aqui; sin estas dos claves, cambiar de movil se lo
  // llevaba todo por delante despues de habérselo prometido dos veces.
  var CLAVES = ['compra-marcados', 'plan-dia-actual', 'registro-peso',
                'escaner-mano', 'escaner-historial', 'escaner-pais'];

  var decir = function (txt, mal) {
    aviso.textContent = txt;
    aviso.className = 'aviso' + (mal ? ' atencion' : '');
    aviso.hidden = false;
  };

  var dosCifras = function (n) { return String(n).padStart(2, '0'); };

  bGuardar.addEventListener('click', function () {
    var datos = {}, n = 0;
    CLAVES.forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v !== null) { datos[k] = v; n++; }
    });
    if (!n) { decir('Todavía no hay nada que guardar: no has marcado nada ni apuntado ningún peso.', true); return; }
    var h = new Date();
    var fecha = h.getFullYear() + '-' + dosCifras(h.getMonth() + 1) + '-' + dosCifras(h.getDate());
    var blob = new Blob([JSON.stringify({ version: 1, fecha: h.toISOString(), datos: datos }, null, 1)],
                        { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'plan-comidas-copia-' + fecha + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Sin esperar, Safari cancela la descarga al liberar el enlace.
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    decir('Copia guardada en tus descargas: plan-comidas-copia-' + fecha + '.json. '
        + 'Guárdala donde no se te pierda.');
  });

  fichero.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var lector = new FileReader();
    lector.onload = function () {
      var c;
      try { c = JSON.parse(lector.result); }
      catch (e) { decir('Ese fichero no es una copia de esta página. Busca uno que se llame plan-comidas-copia-…json', true); return; }
      if (!c || typeof c !== 'object' || !c.datos || typeof c.datos !== 'object') {
        decir('Ese fichero no es una copia de esta página. Busca uno que se llame plan-comidas-copia-…json', true); return;
      }
      // Solo se aceptan las tres claves conocidas y solo si su contenido tiene
      // la forma que espera el resto de la pagina. Meter cualquier cosa que
      // venga en el fichero dejaria la pagina rota y sin saber por que.
      // Se cuenta pieza a pieza y se dice cual entro y cual no. Decir
      // "Restaurado" a secas cuando solo ha vuelto una de las tres es el peor
      // fallo posible aqui: se da por recuperado lo que en realidad se ha perdido.
      var NOMBRE = { 'compra-marcados': 'lo marcado en la compra',
                     'plan-dia-actual': 'el día por el que vas',
                     'registro-peso': 'los pesos apuntados' };
      var entran = [], fuera = [];
      CLAVES.forEach(function (k) {
        var v = c.datos[k];
        if (typeof v !== 'string') { if (k in c.datos) fuera.push(NOMBRE[k]); return; }
        var d;
        try { d = JSON.parse(v); } catch (e) { d = null; }
        var vale;
        if (k === 'plan-dia-actual') {
          var n = parseInt(v, 10);
          vale = (n >= 1 && n <= 30);
        } else if (k === 'compra-marcados') {
          vale = Array.isArray(d) && !d.some(function (x) { return typeof x !== 'string'; });
        } else {
          vale = Array.isArray(d) && !d.some(function (x) {
            return !x || typeof x.f !== 'string' || typeof x.p !== 'number';
          });
        }
        if (!vale) { fuera.push(NOMBRE[k]); return; }
        try { localStorage.setItem(k, v); entran.push(NOMBRE[k]); }
        catch (e) { fuera.push(NOMBRE[k]); }
      });

      var lista = function (a) {
        return a.length < 2 ? a[0] : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
      };
      if (!entran.length) {
        decir('Esa copia no traía nada aprovechable. No se ha tocado nada de lo que ya tenías.', true);
        return;
      }
      if (fuera.length) {
        // Aviso en rojo aunque algo haya entrado: lo que falta se ha perdido y
        // hay que enterarse ahora, no dentro de dos semanas.
        // Concordancia: "Ha vuelto los pesos apuntados" chirria. Si vuelve mas
        // de una cosa, el verbo va en plural.
        decir((entran.length > 1 ? 'Han vuelto ' : 'Ha vuelto ') + lista(entran)
            + ', pero ' + lista(fuera) + (fuera.length > 1 ? ' no: esas partes de la ' : ' no: esa parte de la ')
            + 'copia estaba estropeada. Se recarga la página en un momento…', true);
      } else {
        decir('Restaurado ' + lista(entran) + '. La página se recarga sola en un momento…');
      }
      setTimeout(function () { location.reload(); }, fuera.length ? 4000 : 1200);
    };
    lector.onerror = function () { decir('No se ha podido leer el fichero.', true); };
    lector.readAsText(f);
  });
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

// ==================================================== ESCANER DE LA COMPRA
(function () {
  'use strict';
  var vista = document.getElementById('escaner');
  if (!vista) return;

  var video = document.getElementById('camara');
  var salida = document.getElementById('veredicto');
  var estado = document.getElementById('estadoEscaner');
  var btnCam = document.getElementById('btnCamara');
  var btnEtiq = document.getElementById('btnEtiqueta');
  var fotoEtiq = document.getElementById('fotoEtiqueta');
  var manual = document.getElementById('formManual');
  // DOS ALMACENES, y la diferencia importa.
  //
  // En "cache" va lo que se ha sacado solo de una base de datos. Se puede tirar
  // sin pena: se vuelve a sacar en un instante.
  //
  // En "mano" va lo que ha escrito EL, mirando el envase. Eso no se tira NUNCA.
  // Se le prometio que un producto se teclea una vez y no se le vuelve a
  // preguntar, y borrarlo por un cambio interno seria romper esa promesa sin que
  // se entere.
  //
  // Hace falta separarlos porque al cambiar las reglas de clasificacion lo
  // guardado se queda anticuado: el brocoli seguia saliendo mal despues de
  // arreglarlo, porque respondia la copia vieja. Ahora la copia automatica se
  // tira sola cuando cambia la version, y lo suyo se queda.
  var CLAVE_CACHE = 'escaner-cache';     // sacado de una base: se puede tirar
  var CLAVE_MANO = 'escaner-mano';       // escrito por el: no se tira nunca
  var CLAVE_VER = 'escaner-version';
  var CLAVE_HIST = 'escaner-historial';  // lo escaneado, para exportarlo luego

  var D = null;                          // datos del plan (escaner.json)
  var BASE = null;                       // la base del pais elegido, ya bajada
  var PAIS_BASE = null;                  // de que pais es, para poder decirlo
  var cache = {}, mano = {};
  try { cache = JSON.parse(localStorage.getItem(CLAVE_CACHE) || '{}'); } catch (e) {}
  try { mano = JSON.parse(localStorage.getItem(CLAVE_MANO) || '{}'); } catch (e) {}

  var guardaCache = function () {
    try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(cache)); } catch (e) {}
  };
  // Devuelve si ha podido de verdad. En modo privado o con la memoria llena,
  // setItem lanza; antes se tragaba la excepcion y se le prometia igualmente que
  // no se le volveria a preguntar.
  var guardaMano = function () {
    try { localStorage.setItem(CLAVE_MANO, JSON.stringify(mano)); return true; }
    catch (e) { return false; }
  };

  var apunta = function (codigo, prod, ver) {
    var h = [];
    try { h = JSON.parse(localStorage.getItem(CLAVE_HIST) || '[]'); } catch (e) {}
    h.push({ f: new Date().toISOString().slice(0, 10), cod: codigo,
             nom: prod.nombre, marca: prod.marca || '',
             kcal: prod.kcal, prot: prod.prot, hc: prod.hc,
             grasa: prod.grasa, fibra: prod.fibra,
             fuente: prod.fuente || '', hueco: ver.hueco, veredicto: ver.clase });
    // No crece sin limite: 300 productos son mas de un anio de compras.
    if (h.length > 300) h = h.slice(-300);
    try { localStorage.setItem(CLAVE_HIST, JSON.stringify(h)); } catch (e) {}
  };

  // ---------------------------------------------------------------- utiles
  var num = function (x) {
    var n = parseFloat(String(x).replace(',', '.'));
    return isFinite(n) ? n : null;
  };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var uno = function (x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); };

  // Un mismo producto se escribe de varias formas segun quien lo metiera: con
  // ceros delante, sin ellos, en UPC de 12 digitos o en EAN de 13. Buscando solo
  // la forma literal que lee la camara se pierden aciertos que SI estan.
  var variantes = function (c) {
    var v = [c], sin = c.replace(/^0+/, '');
    if (sin && v.indexOf(sin) < 0) v.push(sin);
    while (sin.length < 14) {
      sin = '0' + sin;
      if (v.indexOf(sin) < 0) v.push(sin);
    }
    return v;
  };

  // Los codigos que empiezan por 2 los genera la propia tienda al pesar: no
  // identifican un producto, identifican ESE paquete. No estan en ninguna base
  // del mundo y no van a estarlo. Buscarlos es perder el tiempo y acabar
  // pidiendole que teclee.
  var esBalanza = function (c) {
    if (!/^\d+$/.test(c)) return false;
    // Un codigo de barras de producto tiene 8, 12 o 13 digitos. Todo lo demas lo
    // ha compuesto la balanza o la etiquetadora de la tienda: en la base hay
    // 11.018 codigos de 18 digitos y 1.788 de 24, y el lector devuelve esos
    // numeros enteros porque tambien lee code_128.
    if (c.length > 13) return true;
    // Los prefijos 2 son de "circulacion restringida" en TODAS las longitudes,
    // no solo en 12 y 13. En la base habia 4.647 codigos de 8 digitos que
    // empiezan por 2 y se estaban tratando como productos de verdad.
    return c.charAt(0) === '2' && (c.length === 8 || c.length === 12 || c.length === 13);
  };

  // ------------------------------------------------------- en que hueco cae
  // Mismas reglas que escaner.py, por macros y no por el nombre: el nombre es
  // justo lo que miente.
  // EL ORDEN IMPORTA, y es el mismo que en escaner.py. Mirando la proteina
  // antes que los hidratos, una pasta de lentejas se clasificaba como fuente de
  // proteina y se comparaba contra el pollo.
  //
  // AQUI HAY UNA RAMA DE MAS que en escaner.py, y es a proposito: los alimentos
  // del plan siempre traen la fibra (se leyo de la etiqueta), pero la base
  // abierta no la trae en uno de cada cuatro productos. Sin esa rama, cualquier
  // verdura sin fibra apuntada dejaba de ser verdura.
  var huecoDe = function (p) {
    if (!p.kcal || p.kcal <= 0) return 'otro';
    if (p.prot >= 50) return 'suplemento';
    if (p.hc >= 35) return 'hidrato';
    // OJO: en JavaScript null se compara como 0, asi que "p.fibra >= 1.2" con la
    // fibra desconocida da false calladamente. Hay que preguntarlo a mano.
    var sinFibra = p.fibra === null || p.fibra === undefined;
    // La FRUTA se mira antes que la verdura. Al reves, cualquier fruta con algo
    // de fibra y pocas calorias (una manzana) salia clasificada como verdura.
    // El corte esta en 10 g de hidratos: la cebolla (9) se queda en verdura y la
    // manzana (12) pasa a fruta. No es una frontera perfecta y no puede serlo
    // solo con macros, pero los dos huecos dan el MISMO veredicto ("adelante"),
    // asi que equivocarse entre ellos solo cambia una palabra del texto.
    if (p.kcal < 80 && p.hc >= 10 && p.prot < 3 && p.grasa < 2 &&
        (sinFibra || p.fibra < 4)) return 'fruta';
    // 0,5 y no 1,2, que era el corte original. Lo bajaron dos alimentos DEL PLAN
    // que se quedaban fuera y acababan en "otro": los champiniones (1,0 g) y el
    // melon galia (0,9 g). Pero no se puede bajar a 0: el edulcorante y la
    // sriracha tambien son poco caloricos y sin proteina, y no son verdura.
    if (p.kcal < 80 && p.prot < 6 &&
        (sinFibra ? (p.grasa < 3 && p.hc < 12) : p.fibra >= 0.5)) return 'verdura';
    var p100 = p.prot * 400 / p.kcal;
    if (p.prot >= 14 && p100 >= 26) return 'proteina';
    // El "hc >= 2" es lo que separa un lacteo de una clara de huevo. Un lacteo
    // lleva lactosa (el skyr 4 g, el griego 3,6); la clara lleva 0,7. Sin ese
    // minimo, las claras salian como lacteo y se comparaban contra los yogures.
    if (p.prot >= 4 && p.prot < 14 && p.hc >= 2 && p.hc <= 12 && p.grasa <= 6 && p.kcal < 130) return 'lacteo';
    // Segunda pasada de proteina, DESPUES de descartar el lacteo. Es para el
    // huevo: el entero tiene 12,6 g y las claras 9,8, los dos por debajo de los
    // 14 que pide la regla de arriba, y la grasa del entero lo saca de lacteo.
    // Caian los dos en "otro", o sea sin comparar contra nada, cuando las claras
    // son la fuente de proteina mas pura del plan (91 g por 100 kcal).
    if (p.prot >= 9 && p100 >= 26) return 'proteina';
    if (p.grasa >= 30 || p.kcal >= 380) return 'grasa o dulce';
    return 'otro';
  };

  var valorCriterio = function (p, campo) {
    if (campo === 'prot_por_100kcal') return p.kcal ? p.prot * 100 / p.kcal : 0;
    return p[campo];
  };

  // ------------------------------------------------------------- las trampas
  // Las palabras de las trampas son EXPRESIONES REGULARES, no subcadenas.
  // Buscando "0%" con indexOf casaba dentro de "100%" y de "60%": 1.916
  // productos de la base, panes integrales incluidos. Y un aviso en falso hace
  // que dejen de creerse los que si son ciertos.
  //
  // Las expresiones ya compiladas se guardan colgadas de la propia funcion y no
  // en una variable de fuera, para que `casa` se pueda sacar del fuente y probar
  // sola. Una funcion que necesita el vecindario para funcionar es una funcion
  // que el arnes de pruebas no puede ejercitar.
  var casa = function (lista, texto) {
    if (!lista || !lista.length) return false;
    var re = casa._re || (casa._re = {});
    for (var i = 0; i < lista.length; i++) {
      var w = lista[i];
      if (!(w in re)) { try { re[w] = new RegExp(w, 'i'); } catch (e) { re[w] = null; } }
      if (re[w] ? re[w].test(texto) : texto.indexOf(w) >= 0) return true;
    }
    return false;
  };

  var trampasQueSaltan = function (p) {
    var texto = ((p.nombre || '') + ' ' + (p.marca || '') + ' ' +
                 (p.categorias || '')).toLowerCase();
    var out = [];
    D.trampas.forEach(function (t) {
      if (!casa(t.palabras, texto)) return;
      // "requiere": ademas tiene que aparecer alguna de estas. Sin esto, "griego"
      // saltaba con el queso griego (93 productos) y "legumbre" con las bebidas
      // vegetales (412 que no eran pasta).
      if (t.requiere && t.requiere.length && !casa(t.requiere, texto)) return;
      // "excluye": si aparece alguna, no salta. El aviso del atun habla de
      // escurrir la lata y saltaba con 115 pates, cremas y atunes en salsa.
      if (t.excluye && casa(t.excluye, texto)) return;
      var r = t.regla, ok = true;
      if (r.prot_menor !== undefined && !(p.prot < r.prot_menor)) ok = false;
      if (r.grasa_mayor !== undefined && !(p.grasa > r.grasa_mayor)) ok = false;
      if (r.hc_mayor !== undefined && !(p.hc > r.hc_mayor)) ok = false;
      if (r.hc_menor !== undefined && !(p.hc < r.hc_menor)) ok = false;
      // Con la fibra desconocida no se dispara: mas vale no avisar que avisar en
      // falso, porque un aviso equivocado desprestigia a los demas.
      if (r.fibra_menor !== undefined &&
          (p.fibra === null || p.fibra === undefined || !(p.fibra < r.fibra_menor))) ok = false;
      if (ok) out.push(t);
    });
    return out;
  };

  // ------------------------------------------------------------- el veredicto
  var juzga = function (p) {
    var hueco = huecoDe(p);
    var crit = D.criterio[hueco] || D.criterio.otro;
    var rivales = D.alimentos.filter(function (a) {
      return a.hueco === hueco && D.usados.indexOf(a.clave) >= 0;
    });
    var trampas = trampasQueSaltan(p);
    var faltan = ['kcal', 'prot', 'hc', 'grasa'].filter(function (k) {
      return p[k] === null || p[k] === undefined;
    });

    // 1) Falta informacion -> no se decide a ciegas.
    if (faltan.length) {
      // Los nombres que se enseñan, no las claves internas, y sin culpar a la
      // base cuando los numeros los ha puesto el.
      var COMO = { kcal: 'las calorías', prot: 'la proteína',
                   hc: 'los hidratos', grasa: 'la grasa' };
      var suyo = p.fuente === 'mano' || p.fuente === 'foto';
      return { clase: 'mirar', hueco: hueco,
               titulo: 'Faltan datos para decidir',
               texto: (suyo ? 'Falta ' : 'La ficha no trae ') +
                      faltan.map(function (k) { return COMO[k] || k; }).join(', ') +
                      '. Míralo en el envase y escríbelo aquí abajo.',
               rivales: rivales, crit: crit };
    }

    // 2) Una trampa grave manda sobre cualquier comparacion.
    var grave = trampas.filter(function (t) { return t.grave; })[0];
    if (grave) {
      return { clase: 'no', hueco: hueco, titulo: grave.titulo,
               texto: grave.texto, trampas: trampas, rivales: rivales, crit: crit };
    }

    // 3) Hay huecos que NO se comparan: cualquier verdura y cualquier fruta
    // valen. Comparandolas por "cual tiene menos calorias", el brocoli perdia
    // contra la lechuga. Eso es una tonteria, y una tonteria en un veredicto
    // hace que dejen de creerse los demas.
    if (!crit.compara) {
      // UNA BEBIDA NO ES UNA FRUTA, aunque por macros no haya quien las separe.
      // Una Coca-Cola son 42 kcal, 0 de proteina, 10,6 de hidratos, 0 de grasa y
      // la fibra sin declarar; una nectarina son 42, 1,1, 10, 0,3 y 1,6. Con la
      // fibra ausente (el 70 % de la base) no hay cuenta que valga, asi que
      // salian 3.123 refrescos, zumos y cervezas con el tick verde de "adelante".
      //
      // Dos redes: el nombre, y que no tenga NADA de proteina ni de grasa, que en
      // una verdura o una fruta de verdad no pasa.
      var _txt = ((p.nombre || '') + ' ' + (p.marca || '') + ' ' +
                  (p.categorias || '')).toLowerCase();
      var pareceBebida = casa(D.bebidas || [], _txt) ||
          ((p.fibra === null || p.fibra === undefined) && !p.prot && !p.grasa);
      if ((hueco === 'verdura' || hueco === 'fruta') && pareceBebida) {
        return { clase: 'mirar', hueco: hueco,
                 titulo: 'Esto parece una bebida',
                 texto: 'Por los números podría pasar por fruta, pero en la tabla se ' +
                        'parecen tanto que no puedo distinguirlas. Si es un refresco o un ' +
                        'zumo, cuenta como azúcar y no como fruta' +
                        (p.kcal ? ': un vaso de 330 ml son unas ' +
                                  Math.round(p.kcal * 3.3) + ' kcal.' : '.'),
                 trampas: trampas, rivales: [], crit: crit };
      }
      if (hueco === 'verdura' || hueco === 'fruta') {
        return { clase: 'si', hueco: hueco,
                 titulo: hueco === 'verdura' ? 'Verdura: adelante' : 'Fruta: adelante',
                 texto: 'Cualquier ' + (hueco === 'verdura' ? 'verdura' : 'fruta') +
                        ' te viene bien.' +
                        (p.fibra === null || p.fibra === undefined
                          ? ' La ficha no dice cuánta fibra lleva, pero andas justo de fibra ' +
                            'varios días, así que adelante.'
                          : ' Llevas ' + uno(p.fibra) + ' g de fibra por 100 g, ' +
                            'y andas justo de fibra varios días.'),
                 trampas: trampas, rivales: [], crit: crit };
      }
      return { clase: 'mirar', hueco: hueco, titulo: 'Ni entra ni estorba',
               texto: 'Es ' + (D.huecoNom[hueco] || hueco) + '. No ocupa ningún hueco del ' +
                      'plan, así que no cuadra ni descuadra nada: entra en las ' +
                      D.kcalDia + ' kcal del día o no entra.',
               trampas: trampas, rivales: [], crit: crit };
    }

    // 4) Comparar con lo TIPICO de ese hueco, no con el mejor de todos.
    if (!rivales.length) {
      return { clase: 'mirar', hueco: hueco,
               titulo: 'Esto no ocupa ningún hueco del plan',
               texto: 'No se parece a nada de lo que comes estos treinta días. ' +
                      'No quiere decir que sea malo: quiere decir que no lo necesitas.',
               trampas: trampas, rivales: [], crit: crit };
    }
    var mio = valorCriterio(p, crit.campo);
    var puntuados = rivales.map(function (a) {
      return { a: a, v: valorCriterio(a, crit.campo) };
    }).sort(function (x, y) { return crit.masEsMejor ? y.v - x.v : x.v - y.v; });

    // El dato con el que habria que juzgar no viene en la ficha. Antes esto se
    // colaba: null se compara como 0, asi que un pan integral sin la fibra
    // apuntada salia "se queda corto en fibra" sin que nadie hubiera medido nada.
    if (mio === null || mio === undefined || !isFinite(mio)) {
      return { clase: 'mirar', hueco: hueco,
               titulo: 'Falta el dato que decide',
               texto: 'Para un ' + (D.huecoNom[hueco] || hueco) + ' lo que manda es ' +
                      crit.texto + ', y la ficha no lo trae. Míralo en el envase y ' +
                      'escríbelo aquí abajo, que lo resuelvo al momento.',
               trampas: trampas, rivales: puntuados, crit: crit };
    }

    // La referencia es la MEDIANA de lo que ya usas, no el campeon. Comparando
    // contra el mejor, la ternera picada magra de verdad salia "peor que lo que
    // compras" por no llegar al pollo, y el escaner decia que no a casi todo.
    var vals = puntuados.map(function (x) { return x.v; }).slice().sort(function (a, b) { return a - b; });
    // Con un numero PAR de rivales, vals[len/2] no es la mediana: es el de
    // arriba. Con 2 rivales era directamente el maximo, o sea el "comparar
    // contra el campeon" que este mismo comentario decia haber quitado. En el
    // hueco de proteina daba 12,42 en vez de 11,24, y por eso el huevo entero y
    // el parmesano (los dos del plan) recibian "Dejalo".
    var med = vals.length % 2
      ? vals[(vals.length - 1) / 2]
      : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    var mejor = puntuados[0];
    var razon = med ? mio / med : 1;
    var gana = crit.masEsMejor ? razon >= 1.15 : razon <= 0.85;
    var pierde = crit.masEsMejor ? razon <= 0.75 : razon >= 1.35;

    if (gana) {
      var superaAlMejor = crit.masEsMejor ? mio > mejor.v : mio < mejor.v;
      return { clase: 'si', hueco: hueco, titulo: 'Mejor que lo que sueles comprar',
               texto: 'Va sobrado de ' + crit.texto + ' para ese hueco' +
                      (superaAlMejor ? ', incluso por encima de ' + mejor.a.nombre : '') + '.',
               trampas: trampas, rivales: puntuados, crit: crit };
    }
    if (pierde) {
      return { clase: 'no', hueco: hueco, titulo: 'Se queda corto para ese hueco',
               texto: 'Le falta ' + crit.texto + ' comparado con lo que ya compras. ' +
                      mejor.a.nombre + ' es lo que mejor te va ahí.',
               trampas: trampas, rivales: puntuados, crit: crit };
    }
    return { clase: 'igual', hueco: hueco, titulo: 'Te vale',
             texto: 'Está en la línea de lo que ya compras en ' + crit.texto + '. ' +
                    'Si está más barato, adelante.',
             trampas: trampas, rivales: puntuados, crit: crit };
  };

  // ------------------------------------------------------------------ pintar
  var ICONO = { si: '✓', no: '✗', igual: '=', mirar: '?' };
  var ETIQ = { si: 'Cómpralo', no: 'Déjalo', igual: 'Da igual', mirar: 'Mira la etiqueta' };
  // DE DONDE SALE CADA NUMERO, dicho en la pantalla y no solo por dentro.
  //
  // Hace falta porque el veredicto es rotundo («esto no es carne picada») y los
  // datos de los que sale NO son todos igual de firmes. Los de Open Food Facts
  // los escriben voluntarios: en la base hay picadas de cerdo con 0 g de
  // proteina, que es imposible. Mientras esto lo usaba una sola persona daba
  // igual, porque sabia de donde venia cada cosa. En cuanto lo usa alguien mas,
  // un veredicto tajante sobre un dato que puede estar mal es la forma mas
  // rapida de que dejen de creerse el resto.
  //
  // `dudoso: true` significa "esto no lo ha visto nadie de tu confianza": se
  // dice y se ofrece corregirlo.
  var FUENTE = {
    tuyo:  { txt: 'ya lo tenías escaneado', dudoso: false },
    local: { txt: 'Open Food Facts, guardado en el móvil', dudoso: true },
    off:   { txt: 'Open Food Facts, por internet', dudoso: true },
    mano:  { txt: 'lo escribiste tú del envase', dudoso: false },
    foto:  { txt: 'leído de la etiqueta con la cámara', dudoso: false },
    peso:  { txt: 'de tu propia tabla de alimentos', dudoso: false }
  };

  var pinta = function (p, v, codigo) {
    var h = [];
    h.push('<div class="ver ver-' + v.clase + '">');
    h.push('<div class="ver-cab"><span class="ver-ico" aria-hidden="true">' +
           ICONO[v.clase] + '</span><div><p class="ver-et">' + ETIQ[v.clase] + '</p>' +
           '<p class="ver-tit">' + esc(v.titulo) + '</p></div></div>');
    h.push('<p class="ver-txt">' + esc(v.texto) + '</p>');

    h.push('<p class="ver-prod"><strong>' + esc(p.nombre || 'Sin nombre') + '</strong>' +
           (p.marca ? ' · ' + esc(p.marca) : '') +
           ' <span class="ver-hueco">' + esc(D.huecoNom[v.hueco] || v.hueco) + '</span></p>');

    h.push('<table class="ver-tabla"><tr><th>por 100 g</th><th>kcal</th><th>prot</th>' +
           '<th>hidr</th><th>grasa</th><th>fibra</th></tr><tr><td>Este</td>' +
           ['kcal', 'prot', 'hc', 'grasa', 'fibra'].map(function (k) {
             return '<td>' + (p[k] == null ? '—' : uno(p[k])) + '</td>';
           }).join('') + '</tr>');
    if (v.rivales && v.rivales.length) {
      var r0 = v.rivales[0].a || v.rivales[0];
      h.push('<tr><td>' + esc(r0.nombre) + '</td>' +
             ['kcal', 'prot', 'hc', 'grasa', 'fibra'].map(function (k) {
               return '<td>' + uno(r0[k]) + '</td>';
             }).join('') + '</tr>');
    }
    h.push('</table>');

    (v.trampas || []).forEach(function (t) {
      if (v.titulo === t.titulo) return;
      h.push('<div class="ver-aviso"><strong>' + esc(t.titulo) + '.</strong> ' +
             esc(t.texto) + '</div>');
    });

    // Si los numeros los ha leido la camara de la etiqueta, no se dan por buenos
    // sin mas: se comprueba que cuadren consigo mismos (ver compruebaAtwater).
    if (p.dudoso) {
      h.push('<div class="ver-aviso"><strong>Ojo, esto lo he leído yo de la foto.</strong> ' +
             esc(p.dudoso) + '</div>');
    }

    if (v.rivales && v.rivales.length && v.clase === 'no') {
      var alt = v.rivales.slice(0, 2).map(function (x) {
        var a = x.a || x;
        return esc(a.nombre) + (a.eur_kg ? ' (' + uno(a.eur_kg) + ' €/kg)' : '');
      });
      h.push('<p class="ver-alt"><strong>En su lugar:</strong> ' + alt.join(' · ') + '</p>');
    }
    var fu = FUENTE[p.fuente];
    h.push('<p class="ver-cod">Código ' + esc(codigo || 'escrito a mano') +
           (fu ? ' · ' + fu.txt : '') + '</p>');
    // Si el numero sale de una base que escriben voluntarios, se dice, y se le
    // da la manera de arreglarlo. Lo que corrija se guarda en "mano" y no se
    // borra nunca, asi que a el ya no le vuelve a fallar ese producto.
    if (fu && fu.dudoso) {
      h.push('<p class="ver-duda">Estos números los ha subido un voluntario a ' +
             'Open Food Facts y pueden no coincidir con el envase que tienes ' +
             'delante. <button type="button" class="enlace-solo" data-corrige="' +
             esc(codigo || '') + '" data-nombre="' + esc(p.nombre || '') +
             '">No son los de mi envase →</button></p>');
    }
    h.push('</div>');
    salida.innerHTML = h.join('');
    salida.hidden = false;
    salida.scrollIntoView({ block: 'nearest' });
    try { if (navigator.vibrate) navigator.vibrate(v.clase === 'no' ? [90, 60, 90] : 60); }
    catch (e) {}
  };

  var resuelveY = function (p, codigo) {
    var v = juzga(p);
    pinta(p, v, codigo);
    apunta(codigo || '(a mano)', p, v);
  };

  // --------------------------------------------------- lo que se compra al peso
  // Un codigo de balanza no dice QUE es, solo cuanto pesa. Asi que en vez de
  // buscar en vano se le pregunta, con los productos al peso que ya usa el plan.
  var pintaPeso = function (codigo) {
    // Se recorre alPeso, NO alimentos: el orden lo decide escaner.py (mostrador
    // primero, y dentro de cada grupo lo que mas compra). Filtrando alimentos se
    // perdia ese orden calladamente y salian por donde cayera.
    var porClave = {};
    D.alimentos.forEach(function (a) { porClave[a.clave] = a; });
    var alPeso = D.alPeso.map(function (c) { return porClave[c]; })
                         .filter(function (a) { return !!a; });
    var h = ['<div class="ver ver-mirar">'];
    h.push('<div class="ver-cab"><span class="ver-ico" aria-hidden="true">⚖</span><div>' +
           '<p class="ver-et">Pesado en la tienda</p>' +
           '<p class="ver-tit">Este código no dice qué es</p></div></div>');
    h.push('<p class="ver-txt">Empieza por 2: se lo ha inventado la balanza del ' +
           'súper para <em>este</em> paquete. No está en ninguna base de datos, ' +
           'ni la va a estar. Dime qué estás cogiendo:</p>');
    h.push('<div class="peso-botones">');
    alPeso.forEach(function (a) {
      h.push('<button type="button" class="peso-bot" data-clave="' + esc(a.clave) + '">' +
             esc(a.nombre) + '</button>');
    });
    h.push('</div>');
    h.push('<p class="ver-cod">Código ' + esc(codigo) + '</p>');
    h.push('</div>');
    salida.innerHTML = h.join('');
    salida.hidden = false;
    salida.scrollIntoView({ block: 'nearest' });
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}

    salida.querySelectorAll('.peso-bot').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = D.alimentos.filter(function (x) { return x.clave === b.dataset.clave; })[0];
        if (a) pintaReferencia(a, codigo);
      });
    });
  };

  // Elegido el producto al peso, lo util no es un veredicto (ya sabemos que
  // entra en el plan): es que sepa QUE MIRAR en la etiqueta del mostrador.
  var pintaReferencia = function (a, codigo) {
    var h = ['<div class="ver ver-si">'];
    h.push('<div class="ver-cab"><span class="ver-ico" aria-hidden="true">✓</span><div>' +
           '<p class="ver-et">Del plan</p><p class="ver-tit">' + esc(a.nombre) +
           '</p></div></div>');
    var comprueba = [];
    if (a.hueco === 'proteina') {
      comprueba.push('que tenga <strong>' + uno(a.prot) + ' g de proteína</strong> o más');
      if (a.grasa <= 8) comprueba.push('y <strong>' + uno(a.grasa) + ' g de grasa</strong> o menos');
    }
    h.push('<p class="ver-txt">' + (comprueba.length
      ? 'En la etiqueta del mostrador, mira ' + comprueba.join(', ') + '. ' +
        'Si no viene, pregunta: es lo único que cambia el cálculo.'
      : 'Entra en el plan tal cual. No hay nada que comprobar.') + '</p>');
    h.push('<table class="ver-tabla"><tr><th>por 100 g</th><th>kcal</th><th>prot</th>' +
           '<th>hidr</th><th>grasa</th><th>fibra</th></tr><tr><td>El del plan</td>' +
           ['kcal', 'prot', 'hc', 'grasa', 'fibra'].map(function (k) {
             return '<td>' + uno(a[k]) + '</td>';
           }).join('') + '</tr></table>');
    if (a.g30) {
      h.push('<p class="ver-alt"><strong>En los 30 días:</strong> ' +
             (a.g30 >= 1000 ? uno(a.g30 / 1000) + ' kg' : a.g30 + ' g') +
             (a.eur_kg ? ' · unos ' + uno(a.eur_kg) + ' €/kg' : '') + '</p>');
    }
    h.push('<p class="ver-cod">Código ' + esc(codigo) + '</p></div>');
    salida.innerHTML = h.join('');
    salida.scrollIntoView({ block: 'nearest' });
    // La carne y el pescado son lo que mas compra y no aparecian en el historial,
    // porque este camino no pasa por resuelveY().
    apunta(codigo, { nombre: a.nombre, marca: '', kcal: a.kcal, prot: a.prot,
                     hc: a.hc, grasa: a.grasa, fibra: a.fibra, fuente: 'peso' },
           { hueco: a.hueco, clase: 'si' });
  };

  // ------------------------------------------------------- buscar el producto
  var deOFF = function (j) {
    var p = j.product || {}, n = p.nutriments || {};
    var kcal = num(n['energy-kcal_100g']);
    if (kcal === null && num(n['energy_100g']) !== null) kcal = num(n['energy_100g']) / 4.184;
    return {
      nombre: p.product_name_es || p.product_name || '',
      marca: (p.brands || '').split(',')[0].trim(),
      categorias: (p.categories || '') + ' ' + (p.generic_name || ''),
      kcal: kcal, prot: num(n.proteins_100g), hc: num(n.carbohydrates_100g),
      // La fibra se deja en null si no viene, igual que en la base empaquetada.
      // Poniendo 0 se estaria afirmando que no tiene, que es otra cosa.
      grasa: num(n.fat_100g), fibra: num(n.fiber_100g),
      fuente: 'off'
    };
  };

  // La base empaquetada NO es un JSON. Son mas de doscientas mil lineas de texto:
  //     codigo|nombre|marca|kcal|proteina|hidratos|grasa|fibra
  //
  // En JSON habria que convertirla en otros tantos objetos de JavaScript nada mas
  // abrir la pagina, y eso son mas de cien megas de memoria: en un movil normal
  // se cierra la pestania. Como texto se queda en una sola cadena y se busca
  // dentro con indexOf, que tarda unos milisegundos. Se escanea un producto cada
  // varios segundos, asi que sobra de largo.
  var deBase = function (linea) {
    var f = linea.split('|');
    // La fibra viene -1 cuando la base no la trae. Se convierte en null: "no lo
    // se" no es "no tiene", y confundirlos hacia que el brocoli dejara de ser
    // verdura. Uno de cada cuatro productos viene sin fibra.
    var fib = parseFloat(f[7]);
    return { nombre: f[1], marca: f[2], kcal: parseFloat(f[3]), prot: parseFloat(f[4]),
             hc: parseFloat(f[5]), grasa: parseFloat(f[6]),
             fibra: fib < 0 ? null : fib,
             categorias: '', fuente: 'local' };
  };

  var buscaEnBase = function (codigo) {
    if (!BASE) return null;
    var v = variantes(codigo);
    for (var i = 0; i < v.length; i++) {
      var j = BASE.indexOf('\n' + v[i] + '|');
      if (j >= 0) {
        var fin = BASE.indexOf('\n', j + 1);
        return deBase(BASE.slice(j + 1, fin < 0 ? BASE.length : fin));
      }
    }
    return null;
  };

  // Cuando no hay manera, el formulario sale CON EL CODIGO YA PUESTO. Sin eso,
  // lo que escribia se guardaba con codigo vacio y el mismo producto se lo
  // volvia a preguntar la siguiente vez, y la siguiente.
  // Vaciar el formulario ANTES de pedir datos nuevos.
  //
  // Sin esto pasaba lo siguiente, y es de lo peor que hay: tecleas el producto A,
  // escaneas el B, no esta en ninguna base, sale el formulario con el codigo de B
  // y LOS MACROS DE A todavia puestos. Le das al boton y se guarda B con los
  // numeros de A, "para siempre" y sin preguntar mas.
  var vaciaFormulario = function () {
    ['mNombre', 'mKcal', 'mProt', 'mHc', 'mGrasa', 'mFibra'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.value = '';
    });
  };

  var pideEtiqueta = function (codigo, et, txt) {
    vaciaFormulario();
    salida.innerHTML = '<div class="ver ver-mirar"><div class="ver-cab">' +
      '<span class="ver-ico" aria-hidden="true">?</span><div>' +
      '<p class="ver-et">' + esc(et) + '</p>' +
      '<p class="ver-tit">Código ' + esc(codigo) + '</p></div></div>' +
      '<p class="ver-txt">' + txt + '</p></div>';
    salida.hidden = false;
    document.getElementById('mCodigo').value = codigo;
    salida.scrollIntoView({ block: 'nearest' });
  };

  var buscando = false;
  var ultimo = '';
  var ultimoT = 0;

  var resuelve = function (codigo) {
    if (buscando) return;
    // El mismo codigo dos veces seguidas en menos de 3 s es la camara leyendo
    // el mismo envase, no un producto nuevo.
    var ahora = Date.now();
    if (codigo === ultimo && ahora - ultimoT < 3000) {
      // Tambien se anota AQUI, si no el reloj no se reinicia mientras sigue
      // apuntando: a los 3 s volvia a sonar, a vibrar y a meter otra linea en el
      // historial. Treinta segundos sobre un paquete eran diez entradas.
      ultimoT = ahora;
      return;
    }
    ultimo = codigo; ultimoT = ahora;

    // 1. lo que escribio EL mirando el envase. Va primero: si se tomo la
    // molestia de leer la etiqueta, eso vale mas que cualquier base de datos.
    var v = variantes(codigo), i;
    for (i = 0; i < v.length; i++) {
      if (mano[v[i]]) { resuelveY(mano[v[i]], codigo); return; }
    }
    // 2. lo que ya se saco alguna vez de una base
    for (i = 0; i < v.length; i++) {
      if (cache[v[i]]) { resuelveY(cache[v[i]], codigo); return; }
    }

    // 3. codigo de balanza: ni se intenta
    if (esBalanza(codigo)) { pintaPeso(codigo); return; }

    // 4. la base que lleva el movil encima
    var local = buscaEnBase(codigo);
    if (local) {
      cache[codigo] = local; guardaCache();
      resuelveY(local, codigo);
      return;
    }

    // 5. Open Food Facts, por si es nuevo
    buscando = true;
    estado.textContent = 'Buscando ' + codigo + '…';
    var url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(codigo) +
              '.json?fields=product_name,product_name_es,brands,categories,generic_name,nutriments';
    // Sin tiempo maximo, una wifi de supermercado que acepta la conexion y no
    // contesta dejaba "buscando" en true PARA SIEMPRE: el escaner no volvia a
    // responder a nada hasta recargar la pagina, con la camara encendida
    // gastando bateria. Seis segundos es de sobra para una consulta que
    // normalmente tarda tres decimas.
    var corta = null, ctrl = null;
    try { ctrl = new AbortController(); } catch (e) {}
    if (ctrl) corta = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 6000);
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined).then(function (r) {
      if (corta) { clearTimeout(corta); corta = null; }
      // OFF devuelve 404 limpio cuando no lo tiene, y una pagina HTML de error
      // cuando esta saturado. Sin distinguirlas, r.json() reventaba y el catch
      // decia "sin conexion", que era mentira y despistaba.
      if (r.status === 404) return { status: 0 };
      if (!r.ok) { var e = new Error('caida'); e.tipo = 'caida'; throw e; }
      return r.text().then(function (t) {
        if (t.charAt(0) !== '{') { var e2 = new Error('caida'); e2.tipo = 'caida'; throw e2; }
        return JSON.parse(t);
      });
    }).then(function (j) {
      buscando = false;
      estado.textContent = '';
      if (!j || j.status === 0 || !j.product) {
        pideEtiqueta(codigo, 'No está en ninguna base',
          'Pasa con una de cada ocho. Cópiame los números de la tabla del envase ' +
          'aquí abajo —o dale a <strong>Leer la etiqueta</strong> y los saco yo de ' +
          'una foto— y <strong>no te lo vuelvo a preguntar nunca más</strong>.');
        return;
      }
      var p = deOFF(j);
      cache[codigo] = p; guardaCache();
      resuelveY(p, codigo);
    }).catch(function (err) {
      if (corta) { clearTimeout(corta); corta = null; }
      buscando = false;
      estado.textContent = '';
      var caida = err && err.tipo === 'caida';
      pideEtiqueta(codigo,
        caida ? 'La base pública está caída' : (navigator.onLine ? 'No he podido preguntar' : 'Sin conexión'),
        (caida
          ? 'No es cosa tuya: Open Food Facts está devolviendo errores ahora mismo. '
          : 'No hay manera de llegar a internet desde aquí. ') +
        'Cópiame los números del envase y lo resuelvo igual, sin red.');
    });
  };

  // ------------------------------------------------------------- la camara
  var stream = null, corriendo = false, detector = null;

  var pararCamara = function () {
    corriendo = false;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    video.hidden = true;
    btnCam.textContent = 'Encender la cámara';
    // Al mirar el WhatsApp o apagarse la pantalla, la camara se suelta. Sin esto
    // el mensaje se quedaba en "no hace falta tocar nada" con la camara apagada,
    // y se quedaba apuntando a un envase esperando algo que no iba a pasar.
    estado.textContent = 'Cámara apagada. Dale a «Encender la cámara» para seguir.';
  };

  var bucle = function () {
    if (!corriendo || !detector) return;
    detector.detect(video).then(function (codes) {
      if (codes && codes.length) resuelve(codes[0].rawValue);
    }).catch(function () {}).then(function () {
      if (corriendo) requestAnimationFrame(bucle);
    });
  };

  var arrancarCamara = function () {
    if (corriendo) { pararCamara(); return; }
    if (!('BarcodeDetector' in window)) {
      estado.textContent = 'Este navegador no lee códigos. Escribe el número de ' +
                           'debajo del código de barras, o los datos del envase.';
      document.getElementById('mCodigo').focus();
      return;
    }
    estado.textContent = 'Pidiendo la cámara…';
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
    }).then(function (s) {
      stream = s; video.srcObject = s; video.hidden = false;
      video.play();
      detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
      });
      corriendo = true;
      btnCam.textContent = 'Apagar la cámara';
      estado.textContent = 'Apunta al código de barras. No hace falta tocar nada.';
      requestAnimationFrame(bucle);
    }).catch(function () {
      estado.textContent = 'No me has dado permiso para la cámara, o no hay. ' +
                           'Puedes escribir el código a mano.';
    });
  };

  btnCam.addEventListener('click', arrancarCamara);
  // Al salir de la pagina o apagar la pantalla, la camara se suelta: si no, se
  // queda encendida gastando bateria en el bolsillo.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && corriendo) pararCamara();
  });
  window.addEventListener('pagehide', pararCamara);

  // ------------------------------------------------- leer la tabla de la foto
  // Lo pidio desde el primer dia: "o a los codigos de barra o a los valores
  // nutricionales". Esta es la segunda mitad.
  //
  // El reconocimiento de texto no acierta siempre: hay brillos, plasticos
  // curvados y letra de 6 puntos. Por eso NO decide nada solo: rellena el
  // formulario, ensenia lo que ha leido y le pide un vistazo. Y si los numeros
  // no cuadran entre ellos, lo dice.
  var TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var tessCargando = false;

  var cargaTess = function (ok, mal) {
    if (window.Tesseract) { ok(); return; }
    // Si ya se esta bajando, se avisa en vez de no hacer nada: antes la segunda
    // pulsacion se descartaba en silencio y parecia que el boton estaba roto.
    if (tessCargando) {
      estado.textContent = 'Estoy bajando el lector de etiquetas, un momento…';
      return;
    }
    tessCargando = true;
    estado.textContent = 'Bajando el lector de etiquetas (unos 10 MB, solo la primera vez)…';
    var s = document.createElement('script');
    s.src = TESS;
    // Tambien con tiempo maximo: si el servidor acepta la conexion y no contesta,
    // ni onload ni onerror llegan nunca y se quedaba en "Leyendo la etiqueta…"
    // para siempre.
    var corta = setTimeout(function () {
      if (!window.Tesseract && tessCargando) { tessCargando = false; mal(); }
    }, 25000);
    s.onload = function () { clearTimeout(corta); tessCargando = false; ok(); };
    s.onerror = function () { clearTimeout(corta); tessCargando = false; mal(); };
    document.head.appendChild(s);
  };

  // "1.234" son mil doscientos treinta y cuatro; "12,5" son doce y medio. Si se
  // confunden, el veredicto sale disparatado.
  var numEs = function (s) {
    s = String(s).trim();
    if (s.indexOf(',') >= 0) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    var t = s.split('.');
    if (t.length === 2 && t[1].length <= 2) return parseFloat(s);
    return parseFloat(s.replace(/\./g, ''));
  };

  // La ley obliga a que la tabla venga por 100 g, asi que se busca linea a linea.
  //
  // TRES COSAS QUE PARECEN TONTERIAS Y NO LO SON:
  //
  // 1. LOS SUBTOTALES. Debajo de las grasas va "de las cuales saturadas", y
  //    debajo de los hidratos "de los cuales azucares". Colar uno de esos en
  //    lugar del total da un veredicto al reves, y con total seguridad. Lo para
  //    el guard de cada expresion (el "(?!...)"), que ademas cubre las
  //    monoinsaturadas y las poliinsaturadas de los aceites.
  //
  // 2. LA DISTANCIA. Antes se exigia que el numero estuviera a menos de 14 o 20
  //    caracteres del nombre. En las etiquetas grandes, con el nombre a la
  //    izquierda y el numero a la derecha, hay 27 espacios de por medio y no se
  //    leia ni la grasa ni la proteina, que son las dos que deciden. Ya no hay
  //    limite: dentro de un renglon, el numero que va detras del nombre es suyo.
  //
  // 3. LAS DOS COLUMNAS. Muchas etiquetas traen "por racion" y "por 100 g" una
  //    al lado de la otra. Si la racion va primero, coger el primer numero es
  //    coger la racion, y esto es lo peor de todo: los numeros de una racion son
  //    coherentes ENTRE ELLOS, asi que la comprobacion de Atwater no se entera y
  //    el veredicto sale con 30 g como si fueran 100. Se mira la cabecera para
  //    saber cual es cual, y si la racion va delante se coge el ultimo numero.
  var leeTabla = function (txt) {
    var lineas = txt.replace(/\u00a0/g, ' ').split(/\r?\n/);
    var r = { kcal: null, prot: null, hc: null, grasa: null, fibra: null };

    var racionPrimero = false;
    for (var i = 0; i < lineas.length; i++) {
      var h = lineas[i].toLowerCase();
      var ir = h.search(/raci[oó]n|porci[oó]n|unidad|envase/);
      var ic = h.search(/100\s*(g|ml)/);
      if (ir >= 0 && ic >= 0 && ir < ic) { racionPrimero = true; break; }
    }

    var elige = function (nums) {
      if (!nums || !nums.length) return null;
      return numEs(racionPrimero && nums.length > 1 ? nums[nums.length - 1] : nums[0]);
    };
    var trasClave = function (b, reClave) {
      var m = b.match(reClave);
      if (!m) return null;
      return elige(b.slice(m.index + m[0].length).match(/\d+(?:[.,]\d+)?/g));
    };

    lineas.forEach(function (l) {
      var b = l.toLowerCase();
      if (!b) return;
      var v;
      if (r.kcal === null) {
        var ks = b.match(/\d+(?:[.,]\d+)?(?=\s*k\s*cal)/g);
        if (ks) r.kcal = elige(ks);
      }
      if (r.grasa === null &&
          (v = trasClave(b, /grasas?\b(?!\s*(?:satur|trans|insatur|mono|poli))/)) !== null) r.grasa = v;
      if (r.hc === null &&
          (v = trasClave(b, /hidratos?\b(?!\D{0,40}az[úu]car)/)) !== null) r.hc = v;
      if (r.prot === null &&
          (v = trasClave(b, /prote[íi]nas?\b\s*(?:\([^)]*\))?/)) !== null) r.prot = v;
      if (r.fibra === null &&
          (v = trasClave(b, /fibra\b/)) !== null) r.fibra = v;
    });
    return r;
  };

  // Las calorias declaradas tienen que parecerse a lo que suman los macros. Es
  // la misma comprobacion que usa el proyecto entero para las etiquetas, y aqui
  // sirve para pillar un numero mal leido antes de dar un veredicto con el.
  var compruebaAtwater = function (p) {
    if (p.kcal == null || p.prot == null || p.hc == null || p.grasa == null) return null;
    var calc = p.prot * 4 + p.hc * 4 + p.grasa * 9 + (p.fibra || 0) * 2;
    if (!calc) return null;
    var desv = Math.abs(calc - p.kcal) / Math.max(p.kcal, calc);
    if (desv <= 0.25) return null;
    return 'Los macros suman ' + Math.round(calc) + ' kcal pero la etiqueta pone ' +
           Math.round(p.kcal) + '. Algún número lo habré leído mal: compruébalo antes de fiarte.';
  };

  // LAS TRES PUERTAS que tiene que pasar lo leido de una foto antes de que se
  // ofrezca como si fuera un dato.
  //
  // Medido sobre las 40 fotos de etiquetas reales del proyecto: 9 pasaban de dos
  // numeros y RELLENABAN EL FORMULARIO, ninguna con los valores correctos, y 6 de
  // esas 9 sin ningun aviso. Entre ellas, 609 g de proteina, 499 g de hidratos y
  // 2.000 kcal por 100 g. Con estas tres puertas no cuela ninguna de las 40.
  //
  // La regla: o los numeros son de fiar, o se dice que no se han podido leer.
  // Un lector que a veces acierta y a veces te da 609 g de proteina sin avisar es
  // peor que no tener lector.
  var deFiar = function (r) {
    // 1. Estan los cuatro que deciden. Con la grasa a medias no se juzga nada.
    var faltan = ['kcal', 'prot', 'hc', 'grasa'].filter(function (k) { return r[k] === null; });
    if (faltan.length) return 'Solo he sacado ' + (4 - faltan.length) + ' de los 4 números que hacen falta';
    // 2. Son numeros posibles. Es la MISMA regla que filtra la base de productos:
    //    en 100 g no caben 609 g de proteina ni 2.000 kcal.
    if (!(r.kcal > 0 && r.kcal <= 900)) return 'He leído ' + Math.round(r.kcal) + ' kcal por 100 g, que no puede ser';
    var malo = ['prot', 'hc', 'grasa', 'fibra'].filter(function (k) {
      return r[k] !== null && (r[k] < 0 || r[k] > 100);
    });
    if (malo.length) return 'He leído cantidades imposibles (más de 100 g en 100 g)';
    if (r.prot + r.hc + r.grasa > 100.5) return 'Los macros suman más de 100 g en 100 g de producto';
    // 3. Cuadran entre ellos.
    var d = compruebaAtwater(r);
    if (d) return d;
    return null;
  };

  var pon = function (id, v) {
    if (v !== null && v !== undefined && isFinite(v)) {
      document.getElementById(id).value = uno(v);
    }
  };

  var procesaFoto = function (fuente) {
    // Igual que al pedir la etiqueta: si la foto solo saca 3 de los 5 numeros,
    // los otros dos se quedarian con los del producto anterior.
    vaciaFormulario();
    estado.textContent = 'Leyendo la etiqueta…';
    cargaTess(function () {
      // Reducir y pasar a gris sube mucho el acierto y baja el tiempo.
      var c = document.createElement('canvas');
      var an = fuente.videoWidth || fuente.naturalWidth || fuente.width;
      var al = fuente.videoHeight || fuente.naturalHeight || fuente.height;
      if (!an || !al) { estado.textContent = 'No he podido coger la imagen.'; return; }
      var k = Math.min(1, 1600 / an);
      c.width = Math.round(an * k); c.height = Math.round(al * k);
      var g = c.getContext('2d');
      g.drawImage(fuente, 0, 0, c.width, c.height);
      var d = g.getImageData(0, 0, c.width, c.height), a = d.data;
      for (var i = 0; i < a.length; i += 4) {
        var y = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
        y = y < 128 ? y * 0.6 : 255 - (255 - y) * 0.6;   // mas contraste
        a[i] = a[i + 1] = a[i + 2] = y;
      }
      g.putImageData(d, 0, 0);

      window.Tesseract.recognize(c, 'spa').then(function (res) {
        var t = (res && res.data && res.data.text) || '';
        var r = leeTabla(t);
        var leidos = ['kcal', 'prot', 'hc', 'grasa', 'fibra'].filter(function (k2) {
          return r[k2] !== null;
        });
        estado.textContent = '';
        var porque = leidos.length < 2 ? 'No he sacado la tabla' : deFiar(r);
        if (porque) {
          salida.innerHTML = '<div class="ver ver-mirar"><div class="ver-cab">' +
            '<span class="ver-ico" aria-hidden="true">?</span><div>' +
            '<p class="ver-et">No me fío de lo que he leído</p>' +
            '<p class="ver-tit">Mejor escríbelos tú</p></div></div>' +
            '<p class="ver-txt">' + esc(porque) + '. Con el envase entero en la foto ' +
            'casi nunca sale: <strong>acerca la cámara hasta que la tabla ocupe toda la ' +
            'pantalla</strong>, sin brillos. Si no hay manera, son cinco números aquí ' +
            'abajo y no te los vuelvo a pedir nunca.</p></div>';
          salida.hidden = false;
          document.getElementById('mKcal').focus();
          return;
        }
        pon('mKcal', r.kcal); pon('mProt', r.prot); pon('mHc', r.hc);
        pon('mGrasa', r.grasa); pon('mFibra', r.fibra);
        salida.innerHTML = '<div class="ver ver-mirar"><div class="ver-cab">' +
          '<span class="ver-ico" aria-hidden="true">👁</span><div>' +
          '<p class="ver-et">He leído esto</p><p class="ver-tit">' +
          leidos.length + ' de 5 números</p></div></div>' +
          '<p class="ver-txt">Míralos un segundo ahí abajo y dale a <strong>Dime si ' +
          'me lo llevo</strong>. Corrige el que esté mal.</p></div>';
        salida.hidden = false;
        document.getElementById('mKcal').scrollIntoView({ block: 'center' });
      }).catch(function () {
        estado.textContent = 'No he podido leer la foto. Escribe los números abajo.';
      });
    }, function () {
      estado.textContent = 'No he podido cargar el lector de etiquetas (necesita ' +
                           'internet la primera vez). Escribe los números abajo.';
    });
  };

  if (btnEtiq) {
    btnEtiq.addEventListener('click', function () {
      // Con la camara ya abierta se coge el fotograma y no se molesta al usuario.
      if (corriendo && video.videoWidth) { procesaFoto(video); return; }
      fotoEtiq.click();
    });
  }
  if (fotoEtiq) {
    fotoEtiq.addEventListener('change', function () {
      var f = fotoEtiq.files && fotoEtiq.files[0];
      if (!f) return;
      var img = new Image();
      img.onload = function () { procesaFoto(img); URL.revokeObjectURL(img.src); };
      img.src = URL.createObjectURL(f);
    });
  }

  // --------------------------------------------------------- entrada a mano
  // «No son los de mi envase»: lleva al formulario de a mano con el codigo y el
  // nombre ya puestos, para que solo tenga que copiar los cinco numeros. Va por
  // delegacion porque el boton se pinta con el veredicto, que no existe todavia
  // cuando esto se registra.
  salida.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-corrige]') : null;
    if (!b) return;
    document.getElementById('mCodigo').value = b.getAttribute('data-corrige') || '';
    document.getElementById('mNombre').value = b.getAttribute('data-nombre') || '';
    ['mKcal', 'mProt', 'mHc', 'mGrasa', 'mFibra'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    estado.textContent = 'Copia los números del envase, por 100 g. Lo que ' +
                         'escribas se queda guardado y no te lo vuelvo a preguntar.';
    manual.scrollIntoView({ block: 'center' });
    document.getElementById('mKcal').focus();
  });

  manual.addEventListener('submit', function (e) {
    e.preventDefault();
    var nom = document.getElementById('mNombre').value;
    var p = {
      nombre: nom || 'Producto sin nombre',
      marca: '', categorias: nom || '',
      kcal: num(document.getElementById('mKcal').value),
      prot: num(document.getElementById('mProt').value),
      hc: num(document.getElementById('mHc').value),
      grasa: num(document.getElementById('mGrasa').value),
      // Sin el "|| 0" a proposito. num('') devuelve null y "null || 0" da 0,
      // o sea que dejar la casilla vacia AFIRMABA que no tiene fibra: un
      // brocoli tecleado sin fibra salia "ni entra ni estorba". Y como lo
      // tecleado no se borra nunca, se quedaba mal para siempre.
      fibra: num(document.getElementById('mFibra').value),
      fuente: 'mano'
    };
    if (p.kcal === null || p.prot === null) {
      estado.textContent = 'Hacen falta al menos las calorías y la proteína.';
      return;
    }
    p.dudoso = compruebaAtwater(p);
    var cod = document.getElementById('mCodigo').value.trim();
    // Va a "mano", no a "cache": esto lo ha leido el del envase y no se tira
    // nunca, pase lo que pase con las versiones.
    var guardado = false;
    if (cod) { mano[cod] = p; guardado = guardaMano(); }
    resuelveY(p, cod);
    if (cod) {
      estado.textContent = guardado
        ? 'Guardado para siempre. La próxima vez que escanees ese producto, ' +
          'respuesta inmediata y sin preguntarte nada.'
        : 'OJO: no he podido guardarlo (memoria llena o navegación privada). ' +
          'Te lo volveré a preguntar.';
    }
  });

  // ------------------------------------------------------------------ datos
  var listo = function () {
    estado.textContent = '';
    btnCam.disabled = false;
    if (btnEtiq) btnEtiq.disabled = false;
    document.getElementById('escanerCargando').hidden = true;
  };

  fetch('escaner.json').then(function (r) { return r.json(); }).then(function (j) {
    D = j;
    // Si han cambiado las reglas o la base, lo sacado automaticamente se tira:
    // se volvera a sacar al momento y ya con las reglas nuevas. Lo que escribio
    // el a mano NI SE TOCA.
    try {
      if (j.version && localStorage.getItem(CLAVE_VER) !== j.version) {
        cache = {};
        localStorage.removeItem(CLAVE_CACHE);
        localStorage.setItem(CLAVE_VER, j.version);
      }
    } catch (e) {}
    listo();
    // La base espanola se trae despues y sin bloquear: la pagina ya funciona
    // sin ella (busca en Open Food Facts), y con ella deja de necesitar internet.
    var n = document.getElementById('estadoBase');
    if (n) n.textContent = 'Bajando la base de productos…';
    // Se espera a que el service worker mande antes de pedir la base.
    //
    // El service worker se registra al terminar de cargar la pagina, y la base se
    // pedia enseguida: en la PRIMERA visita ganaba la carrera la peticion, asi que
    // esos 4 MB no los veia nadie y no se guardaban. A la visita siguiente se
    // volvian a bajar. Esperando (como mucho 4 segundos) se baja una sola vez y
    // queda guardada. Si el navegador no tiene service worker, se pide y ya.
    var conCache = function (sigue) {
      if (!('serviceWorker' in navigator) || navigator.serviceWorker.controller) { sigue(); return; }
      var hecho = false;
      var ya = function () { if (!hecho) { hecho = true; sigue(); } };
      try { navigator.serviceWorker.addEventListener('controllerchange', ya); } catch (e) {}
      setTimeout(ya, 4000);
    };

    conCache(function () {
    // Con el sello en la direccion. Sin el, el navegador puede servir la copia
    // que tenga guardada: se vio en una prueba contra la web publicada, donde
    // decia 238.791 productos cuando el fichero ya tenia 217.671.
    //
    // El sello es el DE LA BASE (version_base), no el general. El general
    // cambia con cualquier cambio del codigo, y una direccion nueva son 12,4 MB
    // nuevos para quien no tenga service worker todavia. El de la base solo
    // cambia cuando cambia el fichero, que es cuando hay algo que bajar.
    // QUE PAIS. Cada uno tiene su base y se baja SOLO la suya: son 12,4 MB la
    // espanola y 9,1 la britanica, y quien compra en Gibraltar no va a escanear
    // un producto de Mercadona.
    //
    // La eleccion se guarda en 'escaner-pais', que esta en la lista de claves
    // que NO se borran al cambiar de version: si se borrara, cada publicacion
    // le devolveria a Espana a quien vive en otro sitio.
    var bases = j.bases || [];
    if (!bases.length) {
      if (n) { n.textContent = 'Esta versión no trae ninguna base de productos ' +
                               'guardada. El escáner necesitará cobertura.'; }
      return;
    }
    var CLAVE_PAIS = 'escaner-pais';
    var pais = null;
    try { pais = localStorage.getItem(CLAVE_PAIS); } catch (e) {}
    if (!bases.some(function (b) { return b.cod === pais; })) pais = bases[0].cod;

    var bajaBase = function (cod) {
      var b = null;
      bases.forEach(function (x) { if (x.cod === cod) b = x; });
      if (!b) return;
      BASE = '';
      PAIS_BASE = b;
      if (n) { n.textContent = 'Bajando los productos de ' + b.nombre + '…'; }
      // El sello es el DE ESA BASE, no el general: una direccion nueva son
      // megas nuevos para quien no tenga service worker todavia.
      fetch(b.fichero + '?v=' + b.sello).then(function (r) {
        if (!r.ok) throw new Error('no');
        return r.text();
      }).then(function (t) {
        BASE = t;
        var cuantos = 0, k = -1;
        while ((k = t.indexOf('\n', k + 1)) >= 0) cuantos++;
        if (n) {
          n.textContent = Math.max(0, cuantos - 1).toLocaleString('es-ES') +
            ' productos de ' + b.nombre + ' guardados en el móvil. ' +
            'Ya funciona sin cobertura.';
        }
      }).catch(function () {
        if (n) {
          n.textContent = 'No he podido bajar la base de ' + b.nombre +
                          '. El escáner funciona igual, pero necesitará cobertura.';
        }
      });
    };

    // El selector solo se pinta si hay mas de un pais que elegir. Con uno solo
    // seria un boton que no hace nada, y eso ensucia sin informar.
    if (bases.length > 1) {
      var sel = document.getElementById('paisBase');
      if (sel) {
        sel.hidden = false;
        sel.innerHTML = bases.map(function (b) {
          return '<option value="' + b.cod + '"' + (b.cod === pais ? ' selected' : '') +
                 '>' + b.nombre + ' · ' + b.n.toLocaleString('es-ES') + ' productos</option>';
        }).join('');
        sel.addEventListener('change', function () {
          pais = sel.value;
          try { localStorage.setItem(CLAVE_PAIS, pais); } catch (e) {}
          bajaBase(pais);
        });
      }
    }
    bajaBase(pais);
    });
  }).catch(function () {
    estado.textContent = 'No se han podido cargar los datos del plan. ' +
                         'Abre la página con conexión al menos una vez.';
  });
})();
