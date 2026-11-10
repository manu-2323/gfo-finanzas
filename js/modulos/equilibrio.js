// Módulo 3: Punto de equilibrio y Costo-Volumen-Utilidad (C-V-U)
const Equilibrio = {
  graf: null,
  temporizador: null,

  ejemplo() {
    return { unidades: 100000, precio: 7.5, cv: 3, cf: 250000, meta: 100000,
             esc: [
               { nombre: 'Base', precio: 0,  cv: 0,   cf: 0,  volumen: 0  },
               { nombre: '+20% precio', precio: 20, cv: 0, cf: 0, volumen: 0 },
               { nombre: '-10% CV',     precio: 0, cv: -10, cf: 0, volumen: 0 },
               { nombre: '+30% vol',    precio: 0, cv: 0, cf: 0, volumen: 30 }
             ]};
  },
  vacio() {
    return { unidades: 0, precio: 0, cv: 0, cf: 0, meta: 0,
             esc: [{ nombre: 'Base', precio: 0, cv: 0, cf: 0, volumen: 0 }] };
  },
  obtener() { return Datos.leer('equilibrio', Equilibrio.ejemplo()); },

  calcular(p, meta) {
    const mc    = p.precio - p.cv;
    const mcPct = p.precio ? mc / p.precio : NaN;
    const peU   = mc > 0 ? p.cf / mc : NaN;
    const peC   = mcPct > 0 ? p.cf / mcPct : NaN;
    const ventas    = p.precio * p.unidades;
    const costoVar  = p.cv * p.unidades;
    const mcTotal   = ventas - costoVar;
    const uaii      = mcTotal - p.cf;
    const ms        = (p.unidades && isFinite(peU)) ? (p.unidades - peU) / p.unidades : NaN;
    const uMeta     = mc > 0 ? (p.cf + (meta || 0)) / mc : NaN;
    return { mc, mcPct, peU, peC, ventas, costoVar, mcTotal, uaii, ms, uMeta };
  },

  aplicarEsc(d, esc) {
    const f = x => 1 + (Number(x) || 0) / 100;
    return { precio: d.precio * f(esc.precio), cv: d.cv * f(esc.cv),
             cf: d.cf * f(esc.cf), unidades: d.unidades * f(esc.volumen) };
  },

  // ── Validaciones coherencia ──────────────────────────────────────────────
  validar(p) {
    const avisos = [];
    if (p.precio > 0 && p.cv >= p.precio)
      avisos.push({ tipo: 'riesgo', msg: 'El costo variable unitario (' + Fmt.moneda(p.cv) + ') es igual o mayor que el precio de venta (' + Fmt.moneda(p.precio) + '). Cada venta genera pérdida; no existe punto de equilibrio posible.' });
    else if (p.precio > 0 && p.cv > p.precio * 0.95)
      avisos.push({ tipo: 'alerta', msg: 'El costo variable es mayor al 95 % del precio. El margen de contribución es muy estrecho (' + Fmt.moneda(p.precio - p.cv) + ' por unidad).' });
    if (p.cf < 0)
      avisos.push({ tipo: 'riesgo', msg: 'Los costos fijos no pueden ser negativos.' });
    if (p.cv < 0)
      avisos.push({ tipo: 'riesgo', msg: 'El costo variable unitario no puede ser negativo.' });
    if (p.precio < 0)
      avisos.push({ tipo: 'riesgo', msg: 'El precio de venta no puede ser negativo.' });
    if (p.precio > 0 && p.cv > 0 && p.cf > 0 && p.unidades > 0 && p.unidades < (p.cf / (p.precio - p.cv)) * 0.3)
      avisos.push({ tipo: 'alerta', msg: 'Las unidades vendidas representan menos del 30 % del punto de equilibrio. La empresa opera muy por debajo del nivel mínimo para cubrir sus costos fijos.' });
    return avisos;
  },

  // ── HTML del bloque de avisos ────────────────────────────────────────────
  htmlAvisos(avisos) {
    if (!avisos.length) return '';
    return avisos.map(a =>
      '<div class="eq-aviso eq-aviso-' + a.tipo + '">' +
      (a.tipo === 'riesgo' ? '⛔ ' : '⚠ ') + a.msg + '</div>'
    ).join('');
  },

  // ── Tabla comparativa multi-escenario ───────────────────────────────────
  tablaEscenarios(d) {
    const base = { precio: d.precio, cv: d.cv, cf: d.cf, unidades: d.unidades };
    const esc  = d.esc || [];
    const params = esc.map(s => Equilibrio.aplicarEsc(d, s));
    const calcs  = params.map(p => Equilibrio.calcular(p, d.meta));

    const filas = [
      { label: 'Precio unitario',              fmt: p => Fmt.moneda(p.precio) },
      { label: 'Costo variable unitario',      fmt: p => Fmt.moneda(p.cv) },
      { label: 'Costos fijos totales',         fmt: p => Fmt.moneda(p.cf) },
      { label: 'Unidades vendidas',            fmt: p => Fmt.num(p.unidades, 0) },
      { label: 'Margen contribución unitario', fmt: (_, c) => Fmt.moneda(c.mc) },
      { label: 'Margen contribución (%)',      fmt: (_, c) => Fmt.pct(c.mcPct) },
      { label: 'Ventas totales',               fmt: (_, c) => Fmt.moneda(c.ventas) },
      { label: 'Costos variables totales',     fmt: (_, c) => Fmt.moneda(c.costoVar) },
      { label: 'Margen contribución total',    fmt: (_, c) => Fmt.moneda(c.mcTotal) },
      { label: 'Costos fijos',                 fmt: p => Fmt.moneda(p.cf) },
      { label: 'UTILIDAD OPERATIVA (UAII)',     fmt: (_, c) => Fmt.moneda(c.uaii), total: true },
      { label: 'PE (unidades)',                fmt: (_, c) => isFinite(c.peU) ? Fmt.num(c.peU, 2) : '—', total: true },
      { label: 'PE (C$)',                      fmt: (_, c) => isFinite(c.peC) ? Fmt.moneda(c.peC) : '—', total: true },
      { label: 'Margen de seguridad',          fmt: (_, c) => isFinite(c.ms) ? Fmt.pct(c.ms) : '—' },
      { label: 'Unidades para meta deseada',   fmt: (_, c) => isFinite(c.uMeta) ? Fmt.num(c.uMeta, 2) : '—' }
    ];

    // Colorear variación vs escenario base (índice 0)
    const delta = (val, base) => {
      if (typeof val !== 'number' || typeof base !== 'number' || !isFinite(val) || !isFinite(base)) return '';
      if (Math.abs(val - base) < 1e-9) return '';
      return val > base ? ' <span class="eq-delta-bien">▲</span>' : ' <span class="eq-delta-mal">▼</span>';
    };

    let encabezado = '<tr><th>Concepto</th>' + esc.map(s => '<th>' + (s.nombre || 'Escenario') + '</th>').join('') + '</tr>';
    let cuerpo = filas.map(f => {
      const celdas = params.map((p, i) => {
        const c = calcs[i];
        const txt = f.fmt(p, c);
        // Para comparar numéricamente, extraemos el número crudo
        const num0 = f.fmt(params[0], calcs[0]);
        const d_icon = i > 0 ? delta(
          typeof f.fmt(p, c) === 'string' ? parseFloat(f.fmt(p, c).replace(/[^0-9.\-]/g, '')) : NaN,
          parseFloat(num0.replace ? num0.replace(/[^0-9.\-]/g, '') : NaN)
        ) : '';
        return '<td>' + txt + d_icon + '</td>';
      }).join('');
      return '<tr class="' + (f.total ? 'total' : '') + '"><td>' + f.label + '</td>' + celdas + '</tr>';
    }).join('');

    return '<div class="tabla-scroll"><table class="tabla-datos">' + encabezado + cuerpo + '</table></div>';
  },

  // ── Interpretación del margen de seguridad ───────────────────────────────
  interpretarMS(b, pb) {
    if (!isFinite(b.ms)) return '';
    const pct = b.ms * 100;
    let nivel, msg;
    if (pct >= 40) {
      nivel = 'bien';
      msg = 'Margen de seguridad alto (' + Fmt.pct(b.ms) + '): las ventas pueden caer casi a la mitad antes de incurrir en pérdida. El riesgo operativo es bajo.';
    } else if (pct >= 20) {
      nivel = 'alerta';
      msg = 'Margen de seguridad moderado (' + Fmt.pct(b.ms) + '): las ventas tienen algo de holgura sobre el equilibrio, pero una caída significativa del mercado podría causar pérdidas.';
    } else if (pct > 0) {
      nivel = 'riesgo';
      msg = 'Margen de seguridad bajo (' + Fmt.pct(b.ms) + '): la empresa opera apenas por encima del equilibrio. Una pequeña reducción en ventas o un aumento en costos la llevaría a pérdida. El riesgo operativo es alto.';
    } else {
      nivel = 'riesgo';
      msg = 'La empresa está por debajo del punto de equilibrio: las ventas actuales no cubren los costos totales.';
    }
    return '<div class="eq-aviso eq-aviso-' + nivel + '">' +
      '<strong>Margen de seguridad y riesgo operativo.</strong> ' + msg + '<br>' +
      '<small>El margen de seguridad mide qué tan lejos están las ventas actuales del punto donde los ingresos y costos totales se igualan. Un margen alto implica mayor resistencia a shocks de demanda.</small>' +
      '</div>';
  },

  // ── Explicación paso a paso ──────────────────────────────────────────────
  htmlExplicacion(pb, b) {
    if (!(b.mc > 0)) return '';
    return '<details class="eq-detalle"><summary>¿Cómo se calculó el punto de equilibrio?</summary>' +
      '<div class="eq-pasos">' +
      '<p><strong>1. Margen de contribución unitario (MC)</strong><br>' +
      'MC = Precio − Costo variable = ' + Fmt.moneda(pb.precio) + ' − ' + Fmt.moneda(pb.cv) + ' = <strong>' + Fmt.moneda(b.mc) + '</strong><br>' +
      'Significa que por cada unidad vendida, ' + Fmt.moneda(b.mc) + ' quedan disponibles para cubrir costos fijos y generar utilidad.</p>' +
      '<p><strong>2. Punto de equilibrio en unidades (PE<sub>u</sub>)</strong><br>' +
      'PE<sub>u</sub> = Costos fijos ÷ MC = ' + Fmt.moneda(pb.cf) + ' ÷ ' + Fmt.moneda(b.mc) + ' = <strong>' + Fmt.num(b.peU, 2) + ' unidades</strong><br>' +
      'Son las unidades mínimas para que los ingresos igualen exactamente los costos totales.</p>' +
      '<p><strong>3. Punto de equilibrio en C$ (PE<sub>C$</sub>)</strong><br>' +
      'PE<sub>C$</sub> = Costos fijos ÷ MC% = ' + Fmt.moneda(pb.cf) + ' ÷ ' + Fmt.pct(b.mcPct) + ' = <strong>' + Fmt.moneda(b.peC) + '</strong></p>' +
      '<p><strong>4. Margen de seguridad</strong><br>' +
      'MS = (Unidades vendidas − PE<sub>u</sub>) ÷ Unidades vendidas = (' + Fmt.num(pb.unidades, 0) + ' − ' + Fmt.num(b.peU, 2) + ') ÷ ' + Fmt.num(pb.unidades, 0) + ' = <strong>' + Fmt.pct(b.ms) + '</strong></p>' +
      '</div></details>';
  },

  // ── Gráfica mejorada (una por escenario activo) ──────────────────────────
  dibujarGrafico(raiz, d) {
    if (Equilibrio.graf) { try { Equilibrio.graf.destroy(); } catch (x) {} Equilibrio.graf = null; }
    const caja = raiz.querySelector('#eq-grafico');
    if (!caja || typeof Chart === 'undefined') return;

    const esc  = d.esc || [];
    const base = { precio: d.precio, cv: d.cv, cf: d.cf, unidades: d.unidades };
    const params = esc.map(s => Equilibrio.aplicarEsc(d, s));
    const calcs  = params.map(p => Equilibrio.calcular(p, d.meta));

    // Rango del eje X: cubre todas las PE y todas las unidades vendidas
    let tope = 10;
    params.forEach((p, i) => {
      tope = Math.max(tope, p.unidades, isFinite(calcs[i].peU) ? calcs[i].peU * 1.6 : 0);
    });
    const pasos = 14, xs = [];
    for (let i = 0; i <= pasos; i++) xs.push(Math.round(tope * i / pasos));

    // Colores por escenario
    const paleta = ['#0f5c4d', '#1f6fa3', '#c0392b', '#e67e22', '#8e44ad'];

    const ds = [];
    // Costos fijos (solo del escenario base, línea punteada)
    ds.push({
      label: 'Costos fijos (base)', type: 'line',
      data: xs.map(() => base.cf),
      borderColor: '#aaa', borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, tension: 0
    });

    params.forEach((p, i) => {
      const color = paleta[i % paleta.length];
      const nombre = esc[i]?.nombre || ('Esc. ' + (i + 1));
      ds.push({
        label: 'Ingresos — ' + nombre, type: 'line',
        data: xs.map(q => p.precio * q),
        borderColor: color, backgroundColor: color,
        borderWidth: 2, pointRadius: 0, tension: 0,
        borderDash: i > 0 ? [8, 4] : []
      });
      ds.push({
        label: 'Costo total — ' + nombre, type: 'line',
        data: xs.map(q => p.cf + p.cv * q),
        borderColor: color, backgroundColor: color,
        borderWidth: 2, pointRadius: 0, tension: 0,
        borderDash: i > 0 ? [4, 4] : [],
        opacity: 0.6
      });
      // Punto de equilibrio marcado
      if (isFinite(calcs[i].peU)) {
        ds.push({
          label: 'PE — ' + nombre, type: 'scatter',
          data: [{ x: Fmt.num(calcs[i].peU, 0), y: p.precio * calcs[i].peU }],
          borderColor: color, backgroundColor: '#fff',
          pointRadius: 7, pointBorderWidth: 2, showLine: false
        });
      }
    });

    const mill = v => {
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + ' M';
      if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + ' k';
      return v;
    };
    Equilibrio.graf = new Chart(caja, {
      type: 'line',
      data: { labels: xs.map(x => Fmt.num(x, 0)), datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label + ': C$ ' + Fmt.num(ctx.parsed.y, 2)
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Unidades vendidas' } },
          y: { title: { display: true, text: 'C$' }, ticks: { callback: mill } }
        }
      }
    });
  },

  campo(id, etiqueta, valor, corto) {
    return '<label class="campo' + (corto ? ' corto' : '') + '">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + (valor ?? '') + '"></label>';
  },

  // ── Renderiza la sección de escenarios ───────────────────────────────────
  htmlPanelEsc(esc) {
    return esc.map((s, i) =>
      '<div class="eq-esc-bloque" data-idx="' + i + '">' +
      '<div class="eq-esc-titulo">' +
        (i === 0
          ? '<strong>Escenario base</strong>'
          : '<input type="text" class="eq-esc-nombre" placeholder="Nombre del escenario" value="' + (s.nombre || '') + '" data-idx="' + i + '">') +
        (i > 0 ? ' <button class="btn-icon eq-esc-quitar" data-idx="' + i + '" title="Quitar escenario">✕</button>' : '') +
      '</div>' +
      '<div class="barra-acciones eq-esc-campos">' +
        '<label class="campo corto">Precio (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="precio" data-idx="' + i + '" value="' + s.precio + '"></label>' +
        '<label class="campo corto">Costo var. (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="cv" data-idx="' + i + '" value="' + s.cv + '"></label>' +
        '<label class="campo corto">Costos fijos (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="cf" data-idx="' + i + '" value="' + s.cf + '"></label>' +
        '<label class="campo corto">Volumen (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="volumen" data-idx="' + i + '" value="' + s.volumen + '"></label>' +
        (i > 0 ? '<button class="btn sec eq-esc-reset" data-idx="' + i + '">Restablecer</button>' : '') +
      '</div></div>'
    ).join('');
  },

  render(el) {
    const d = Equilibrio.obtener();
    if (!d.esc || !Array.isArray(d.esc) || d.esc.length === 0)
      d.esc = [{ nombre: 'Base', precio: 0, cv: 0, cf: 0, volumen: 0 }];

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">' +
        'El punto de equilibrio es la cantidad de unidades (o el monto de ventas) donde los ingresos totales igualan exactamente a los costos totales: ni ganancia ni pérdida. ' +
        'Fórmula: <strong>PE = Costos fijos ÷ (Precio − Costo variable unitario)</strong>.' +
      '</div>' +
      '<h2 class="titulo-seccion">Datos de entrada</h2>' +
      '<div class="barra-acciones">' +
        Equilibrio.campo('eq-precio',    'Precio de venta unitario (C$)', d.precio) +
        Equilibrio.campo('eq-cv',        'Costo variable unitario (C$)', d.cv) +
        Equilibrio.campo('eq-cf',        'Costos fijos totales (C$)', d.cf) +
        Equilibrio.campo('eq-unidades',  'Unidades vendidas', d.unidades) +
        Equilibrio.campo('eq-meta',      'Utilidad deseada (C$)', d.meta) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="eq-ejemplo">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn sec" id="eq-estados">Tomar costos de Estados financieros</button>' +
        '<button class="btn sec peligro" id="eq-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="eq-aviso-estados"></div>' +
      '<div id="eq-avisos-val"></div>' +

      '<h2 class="titulo-seccion">Escenarios <span class="tip" title="Ingresa variaciones en % respecto al caso base. El caso base siempre es 0 %. Agrega hasta 4 escenarios adicionales para comparar simultáneamente.">?</span></h2>' +
      '<div id="eq-panel-esc">' + Equilibrio.htmlPanelEsc(d.esc) + '</div>' +
      '<div class="barra-acciones" style="margin-top:8px">' +
        '<button class="btn sec" id="eq-agregar-esc">+ Agregar escenario</button>' +
      '</div>' +

      '<h2 class="titulo-seccion">Resultados comparados</h2>' +
      '<div class="rejilla" id="eq-tarjetas"></div>' +
      '<div id="eq-ms-interp" style="margin-top:10px"></div>' +
      '<div id="eq-explicacion" style="margin-top:10px"></div>' +
      '<div class="tarjeta" id="eq-tabla" style="margin-top:10px"></div>' +

      '<h2 class="titulo-seccion">Gráfica C-V-U</h2>' +
      '<div class="tarjeta"><div class="grafico" style="height:360px"><canvas id="eq-grafico"></canvas></div></div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    // ── Leer todo el estado del formulario ────────────────────────────────
    const leerBase = () => ({
      precio:    Fmt.aNum(raiz.querySelector('#eq-precio').value),
      cv:        Fmt.aNum(raiz.querySelector('#eq-cv').value),
      cf:        Fmt.aNum(raiz.querySelector('#eq-cf').value),
      unidades:  Fmt.aNum(raiz.querySelector('#eq-unidades').value),
      meta:      Fmt.aNum(raiz.querySelector('#eq-meta').value)
    });
    const leerEsc = () => {
      const esc = [];
      raiz.querySelectorAll('.eq-esc-bloque').forEach((bloque, i) => {
        const nombre = i === 0 ? 'Base'
          : (bloque.querySelector('.eq-esc-nombre')?.value || ('Esc. ' + i));
        const campos = {};
        bloque.querySelectorAll('.eq-esc-campo').forEach(inp => {
          campos[inp.dataset.campo] = Fmt.aNum(inp.value);
        });
        esc.push({ nombre, precio: campos.precio ?? 0, cv: campos.cv ?? 0,
                   cf: campos.cf ?? 0, volumen: campos.volumen ?? 0 });
      });
      return esc;
    };

    const refrescar = () => {
      const base = leerBase();
      const escArr = leerEsc();
      const x = { ...base, esc: escArr };
      Datos.guardar('equilibrio', x);

      const pb = { precio: base.precio, cv: base.cv, cf: base.cf, unidades: base.unidades };
      const b  = Equilibrio.calcular(pb, base.meta);

      // Avisos de validación
      raiz.querySelector('#eq-avisos-val').innerHTML = Equilibrio.htmlAvisos(Equilibrio.validar(pb));

      // Tarjetas resumen (escenario base)
      const t = (tt, v, n) => '<div class="tarjeta"><h3>' + tt + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
      raiz.querySelector('#eq-tarjetas').innerHTML =
        t('PE (unidades)',              isFinite(b.peU)  ? Fmt.num(b.peU, 2)   : '—', 'Costos fijos ÷ margen de contribución unitario') +
        t('PE (C$)',                    isFinite(b.peC)  ? Fmt.moneda(b.peC)   : '—', 'Costos fijos ÷ margen de contribución %') +
        t('Margen de contribución',     isFinite(b.mcPct)? Fmt.pct(b.mcPct)    : '—', Fmt.moneda(b.mc) + ' por unidad') +
        t('Unidades para meta deseada', isFinite(b.uMeta)? Fmt.num(b.uMeta, 2) : '—', '(CF + utilidad deseada) ÷ margen unitario');

      // Interpretación MS + explicación
      raiz.querySelector('#eq-ms-interp').innerHTML  = Equilibrio.interpretarMS(b, pb);
      raiz.querySelector('#eq-explicacion').innerHTML = Equilibrio.htmlExplicacion(pb, b);

      // Tabla multi-escenario
      raiz.querySelector('#eq-tabla').innerHTML = Equilibrio.tablaEscenarios(x);

      // Gráfico con debounce
      clearTimeout(Equilibrio.temporizador);
      Equilibrio.temporizador = setTimeout(() => Equilibrio.dibujarGrafico(raiz, x), 220);
    };

    // ── Eventos de inputs base ────────────────────────────────────────────
    raiz.addEventListener('input', e => {
      if (!e.target.classList.contains('eq-esc-nombre')) refrescar();
    });
    raiz.addEventListener('change', refrescar);

    // ── Botones principales ───────────────────────────────────────────────
    raiz.querySelector('#eq-ejemplo').addEventListener('click', () => {
      Datos.guardar('equilibrio', Equilibrio.ejemplo());
      Equilibrio.render(el); Validar.activar(el);
    });
    raiz.querySelector('#eq-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos del punto de equilibrio?')) {
        Datos.guardar('equilibrio', Equilibrio.vacio()); Equilibrio.render(el); Validar.activar(el);
      }
    });
    raiz.querySelector('#eq-estados').addEventListener('click', () => {
      const base = leerBase();
      const aviso = raiz.querySelector('#eq-aviso-estados');
      if (!(base.unidades > 0)) {
        aviso.innerHTML = '<div class="cuadre mal">Primero escribe las unidades vendidas (los estados financieros están en C$, no en unidades).</div>'; return;
      }
      const est = Estados.obtener();
      const n = k => Number(est.er[k][1]) || 0;
      const nuevo = {
        ...Equilibrio.obtener(),
        precio:   n('ventas') / base.unidades,
        cv:       n('costoVentas') / base.unidades,
        cf:       n('gastosVenta') + n('gastosAdmin') + n('depreciacion'),
        unidades: base.unidades
      };
      Datos.guardar('equilibrio', nuevo);
      Equilibrio.render(el); Validar.activar(el);
      const nuevo2 = el.querySelector('#eq-aviso-estados');
      if (nuevo2) nuevo2.innerHTML = '<div class="cuadre ok">Datos tomados del año ' + est.anios[1] + ': precio = Ventas ÷ unidades; costo variable = Costo de ventas ÷ unidades; costos fijos = gastos de venta + administración + depreciación.</div>';
    });

    // ── Agregar escenario ─────────────────────────────────────────────────
    raiz.querySelector('#eq-agregar-esc').addEventListener('click', () => {
      const esc = leerEsc();
      if (esc.length >= 5) { alert('Máximo 5 escenarios.'); return; }
      esc.push({ nombre: 'Escenario ' + esc.length, precio: 0, cv: 0, cf: 0, volumen: 0 });
      const x = { ...leerBase(), esc };
      Datos.guardar('equilibrio', x);
      Equilibrio.render(el); Validar.activar(el);
    });

    // ── Quitar escenario ──────────────────────────────────────────────────
    raiz.querySelector('#eq-panel-esc').addEventListener('click', e => {
      if (e.target.classList.contains('eq-esc-quitar')) {
        const idx = Number(e.target.dataset.idx);
        const esc = leerEsc();
        esc.splice(idx, 1);
        const x = { ...leerBase(), esc };
        Datos.guardar('equilibrio', x);
        Equilibrio.render(el); Validar.activar(el);
      }
      if (e.target.classList.contains('eq-esc-reset')) {
        const idx = Number(e.target.dataset.idx);
        const esc = leerEsc();
        esc[idx] = { nombre: esc[idx].nombre, precio: 0, cv: 0, cf: 0, volumen: 0 };
        const x = { ...leerBase(), esc };
        Datos.guardar('equilibrio', x);
        Equilibrio.render(el); Validar.activar(el);
      }
    });

    refrescar();
  }
};

Modulos.equilibrio = {
  titulo: 'Punto de equilibrio',
  subtitulo: 'Margen de contribución, análisis C-V-U, escenarios y gráfica',
  render(el) { Equilibrio.render(el); }
};