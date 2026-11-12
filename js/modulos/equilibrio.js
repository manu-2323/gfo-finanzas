// Módulo 3: Punto de equilibrio y Costo-Volumen-Utilidad (C-V-U)
// Mejoras: validaciones negativas, advertencia precio<CV, redondeo hacia arriba,
// comparación PE vs ventas actuales, análisis de sensibilidad, escenarios
// optimista/normal/pesimista, margen de seguridad más claro, guard de gráfica inválida.
const Equilibrio = {
  graf: null,
  temporizador: null,

  /* ── SVG icons ──────────────────────────────────────────────────────── */
  ico: {
    warn:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    block: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M4.9 4.9l14.2 14.2"/></svg>',
    ok:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6L9 17l-5-5"/></svg>',
    info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>',
    arriba:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    abajo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
  },
  _svg(k) { return Equilibrio.ico[k] || ''; },

  ejemplo() {
    return {
      unidades: 100000, precio: 7.5, cv: 3, cf: 250000, meta: 100000,
      esc: [
        { nombre: 'Base',         precio: 0,   cv:   0, cf:  0,  volumen:  0 },
        { nombre: '+20 % precio', precio: 20,  cv:   0, cf:  0,  volumen:  0 },
        { nombre: '−10 % CV',     precio: 0,   cv: -10, cf:  0,  volumen:  0 },
        { nombre: '+30 % vol',    precio: 0,   cv:   0, cf:  0,  volumen: 30 }
      ]
    };
  },
  vacio() {
    return { unidades: 0, precio: 0, cv: 0, cf: 0, meta: 0,
             esc: [{ nombre: 'Base', precio: 0, cv: 0, cf: 0, volumen: 0 }] };
  },
  obtener() { return Datos.leer('equilibrio', Equilibrio.ejemplo()); },

  /* ── Cálculo principal ─────────────────────────────────────────────── */
  calcular(p, meta) {
    const mc     = p.precio - p.cv;
    const mcPct  = p.precio ? mc / p.precio : NaN;
    // Mejora 3 — redondeo hacia arriba en unidades de PE
    const peU    = mc > 0 ? Math.ceil(p.cf / mc) : NaN;
    const peC    = mcPct > 0 ? p.cf / mcPct : NaN;
    const ventas    = p.precio * p.unidades;
    const costoVar  = p.cv * p.unidades;
    const mcTotal   = ventas - costoVar;
    const uaii      = mcTotal - p.cf;
    const ms        = (p.unidades && isFinite(peU)) ? (p.unidades - peU) / p.unidades : NaN;
    // uMeta: redondeo hacia arriba también
    const uMeta  = mc > 0 ? Math.ceil((p.cf + (meta || 0)) / mc) : NaN;
    return { mc, mcPct, peU, peC, ventas, costoVar, mcTotal, uaii, ms, uMeta };
  },

  aplicarEsc(d, esc) {
    const f = x => 1 + (Number(x) || 0) / 100;
    return { precio: d.precio * f(esc.precio), cv: d.cv * f(esc.cv),
             cf: d.cf * f(esc.cf), unidades: d.unidades * f(esc.volumen) };
  },

  /* ── Mejora 1+2: Validaciones ampliadas ────────────────────────────── */
  validar(p) {
    const avisos = [];

    if (p.precio < 0)
      avisos.push({ tipo: 'riesgo', msg: 'El precio de venta no puede ser negativo.' });
    if (p.cv < 0)
      avisos.push({ tipo: 'riesgo', msg: 'El costo variable unitario no puede ser negativo.' });
    if (p.cf < 0)
      avisos.push({ tipo: 'riesgo', msg: 'Los costos fijos no pueden ser negativos.' });
    if (p.unidades < 0)
      avisos.push({ tipo: 'riesgo', msg: 'Las unidades vendidas no pueden ser negativas.' });

    // Mejora 2 — advertencia precio < CV
    if (p.precio > 0 && p.cv > p.precio)
      avisos.push({ tipo: 'riesgo', msg: 'El costo variable unitario (' + Fmt.moneda(p.cv) + ') supera el precio de venta (' + Fmt.moneda(p.precio) + '). Cada unidad vendida genera una pérdida de ' + Fmt.moneda(p.cv - p.precio) + '. No existe punto de equilibrio posible.' });
    else if (p.precio > 0 && p.cv === p.precio)
      avisos.push({ tipo: 'riesgo', msg: 'El costo variable unitario es igual al precio de venta: margen de contribución cero. No existe punto de equilibrio.' });
    else if (p.precio > 0 && p.cv > p.precio * 0.95)
      avisos.push({ tipo: 'alerta', msg: 'El costo variable supera el 95 % del precio. El margen de contribución es muy estrecho (' + Fmt.moneda(p.precio - p.cv) + ' por unidad).' });

    if (p.precio > 0 && p.cv > 0 && p.cf > 0 && p.unidades > 0 && p.cv < p.precio) {
      const pe = p.cf / (p.precio - p.cv);
      if (p.unidades < pe * 0.3)
        avisos.push({ tipo: 'alerta', msg: 'Las unidades vendidas representan menos del 30 % del punto de equilibrio (' + Fmt.num(pe, 0) + ' u.). La empresa opera muy por debajo del nivel mínimo para cubrir sus costos fijos.' });
    }
    return avisos;
  },

  /* ── HTML avisos con SVG ───────────────────────────────────────────── */
  htmlAvisos(avisos) {
    if (!avisos.length) return '';
    return avisos.map(a => {
      const ico = a.tipo === 'riesgo' ? Equilibrio._svg('block') : Equilibrio._svg('warn');
      return '<div class="eq-aviso eq-aviso-' + a.tipo + '" style="display:flex;align-items:flex-start;gap:8px">' +
        '<span style="flex:none;margin-top:1px">' + ico + '</span>' +
        '<span>' + a.msg + '</span>' +
      '</div>';
    }).join('');
  },

  /* ── Mejora 4: Comparación PE vs ventas actuales ───────────────────── */
  htmlComparacion(pb, b) {
    if (!isFinite(b.peU) || !pb.unidades || !pb.precio) return '';

    const actual  = pb.unidades;
    const pe      = b.peU;
    const dif     = actual - pe;
    const pct     = pe > 0 ? dif / pe : NaN;
    const sobrePE = dif >= 0;

    // Barra visual: porcentaje del llenado (máx 150% para visualizar bien)
    const fill = Math.min(actual / (pe * 1.5), 1);
    const barW = (fill * 100).toFixed(1);
    const barColor = sobrePE ? 'var(--ok)' : 'var(--malo)';

    // Tabla de comparación
    const fila = (n, v, cls) =>
      '<div class="dash-fila"><span>' + n + '</span>' +
      '<span style="' + (cls ? 'color:' + cls + ';font-weight:600' : '') + '">' + v + '</span></div>';

    return '<div class="tarjeta" style="margin-bottom:4px">' +
      '<h3 style="margin-bottom:10px">Punto de equilibrio vs situación actual</h3>' +

      /* Barra de progreso */
      '<div style="margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--suave);margin-bottom:5px">' +
          '<span>0</span>' +
          '<span>PE: ' + Fmt.num(pe, 0) + ' u.</span>' +
          '<span>' + Fmt.num(pe * 1.5, 0) + '</span>' +
        '</div>' +
        '<div style="background:var(--arena-2);border-radius:6px;height:10px;overflow:hidden;position:relative">' +
          /* Marca del PE */
          '<div style="position:absolute;left:' + (1/1.5*100).toFixed(1) + '%;top:0;bottom:0;width:2px;background:var(--suave);opacity:.4"></div>' +
          /* Barra de ventas actuales */
          '<div style="background:' + barColor + ';height:100%;width:' + barW + '%;transition:width .5s ease;border-radius:6px"></div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--suave);margin-top:4px;text-align:center">Ventas actuales: ' + Fmt.num(actual, 0) + ' u.</div>' +
      '</div>' +

      fila('Unidades actuales', Fmt.num(actual, 0)) +
      fila('Punto de equilibrio', Fmt.num(pe, 0)) +
      fila(sobrePE ? 'Superávit sobre PE' : 'Déficit hasta PE',
           Fmt.num(Math.abs(dif), 0) + ' u.' + (isFinite(pct) ? ' (' + Fmt.pct(Math.abs(pct)) + ')' : ''),
           sobrePE ? 'var(--ok)' : 'var(--malo)') +
      fila('Ventas actuales (C$)', Fmt.moneda(pb.precio * actual)) +
      fila('Ventas en el PE (C$)', Fmt.moneda(b.peC)) +
      '<div style="margin-top:10px"><span class="chip ' + (sobrePE ? 'ok' : 'riesgo') + '" style="font-size:12px">' +
        (sobrePE
          ? Equilibrio._svg('ok') + '&nbsp; Las ventas actuales superan el PE'
          : Equilibrio._svg('block') + '&nbsp; Las ventas actuales están por debajo del PE') +
      '</span></div>' +
    '</div>';
  },

  /* ── Mejora 5: Análisis de sensibilidad ────────────────────────────── */
  htmlSensibilidad(pb, b) {
    if (!isFinite(b.peU) || !(b.mc > 0)) return '';

    const variaciones = [-20, -10, -5, 5, 10, 20];
    const ico = v => v > 0
      ? '<span style="color:var(--ok);display:inline-flex;align-items:center;gap:2px">' + Equilibrio._svg('arriba') + '+' + v + '%</span>'
      : '<span style="color:var(--malo);display:inline-flex;align-items:center;gap:2px">' + Equilibrio._svg('abajo') + v + '%</span>';

    const filaP = (label, fnParam) => {
      const celdas = variaciones.map(pct => {
        const params = { ...pb };
        fnParam(params, pct);
        // Evitar precios negativos
        if (params.precio <= 0 || params.cv < 0 || params.cf < 0 || params.cv >= params.precio)
          return '<td style="text-align:right;color:var(--suave)">—</td>';
        const c   = Equilibrio.calcular(params, 0);
        const dif = c.uaii - b.uaii;
        const cls = dif > 0 ? 'color:var(--ok)' : dif < 0 ? 'color:var(--malo)' : '';
        return '<td style="text-align:right;font-size:13px;' + cls + '">' +
          Fmt.moneda(c.uaii) + '<br>' +
          '<small style="opacity:.7">' + (dif >= 0 ? '+' : '') + Fmt.moneda(dif) + '</small>' +
        '</td>';
      }).join('');
      return '<tr><td><strong>' + label + '</strong></td>' + celdas + '</tr>';
    };

    const encabezado = '<tr><th>Variable</th>' + variaciones.map(v => '<th style="text-align:right">' + ico(v) + '</th>').join('') + '</tr>';

    return '<div class="tarjeta" style="margin-bottom:4px">' +
      '<h3 style="margin-bottom:4px">Análisis de sensibilidad — impacto en la UAII</h3>' +
      '<p class="nota-pie" style="margin-bottom:10px">Muestra cómo cambia la utilidad operativa cuando se modifica una sola variable a la vez, manteniendo las demás constantes. UAII base: <strong>' + Fmt.moneda(b.uaii) + '</strong>.</p>' +
      '<div class="tabla-scroll"><table class="tabla-datos">' +
        encabezado +
        filaP('Precio',         (p, pct) => { p.precio = pb.precio * (1 + pct/100); }) +
        filaP('Costo variable', (p, pct) => { p.cv    = pb.cv    * (1 + pct/100); }) +
        filaP('Costos fijos',   (p, pct) => { p.cf    = pb.cf    * (1 + pct/100); }) +
        filaP('Volumen',        (p, pct) => { p.unidades = pb.unidades * (1 + pct/100); }) +
      '</table></div>' +
      '<p class="nota-pie" style="margin-top:8px">Las celdas con — corresponden a situaciones donde el margen de contribución sería cero o negativo: no existe punto de equilibrio.</p>' +
    '</div>';
  },

  /* ── Mejora 6: Presentación de escenarios optimista/normal/pesimista ── */
  tablaEscenarios(d) {
    const esc    = d.esc || [];
    const params = esc.map(s => Equilibrio.aplicarEsc(d, s));
    const calcs  = params.map(p => Equilibrio.calcular(p, d.meta));

    // Etiqueta visual según el nombre del escenario
    const badgeEsc = nombre => {
      const n = (nombre || '').toLowerCase();
      if (n.includes('optimist') || n.includes('+'))
        return '<span class="chip ok" style="font-size:10px;margin-left:4px">Optimista</span>';
      if (n.includes('pesimist') || n.includes('-'))
        return '<span class="chip riesgo" style="font-size:10px;margin-left:4px">Pesimista</span>';
      if (n.includes('normal') || n === 'base')
        return '<span class="chip" style="font-size:10px;margin-left:4px">Normal</span>';
      return '';
    };

    const filas = [
      { label: 'Precio unitario',              fmt: p => Fmt.moneda(p.precio) },
      { label: 'Costo variable unitario',      fmt: p => Fmt.moneda(p.cv) },
      { label: 'Costos fijos totales',         fmt: p => Fmt.moneda(p.cf) },
      { label: 'Unidades vendidas',            fmt: p => Fmt.num(p.unidades, 0) },
      { label: 'Margen contribución unit.',    fmt: (_, c) => Fmt.moneda(c.mc) },
      { label: 'Margen contribución (%)',      fmt: (_, c) => isFinite(c.mcPct) ? Fmt.pct(c.mcPct) : '—' },
      { label: 'Ventas totales',               fmt: (_, c) => Fmt.moneda(c.ventas) },
      { label: 'Costos variables totales',     fmt: (_, c) => Fmt.moneda(c.costoVar) },
      { label: 'Margen contribución total',    fmt: (_, c) => Fmt.moneda(c.mcTotal) },
      { label: 'Costos fijos',                 fmt: p => Fmt.moneda(p.cf) },
      { label: 'UTILIDAD OPERATIVA (UAII)',     fmt: (_, c) => Fmt.moneda(c.uaii), total: true },
      { label: 'PE (unidades) ↑ redondeado',   fmt: (_, c) => isFinite(c.peU) ? Fmt.num(c.peU, 0) : '—', total: true },
      { label: 'PE (C$)',                      fmt: (_, c) => isFinite(c.peC) ? Fmt.moneda(c.peC) : '—', total: true },
      { label: 'Margen de seguridad',          fmt: (_, c) => isFinite(c.ms) ? Fmt.pct(c.ms) : '—' },
      { label: 'Unidades para meta deseada ↑', fmt: (_, c) => isFinite(c.uMeta) ? Fmt.num(c.uMeta, 0) : '—' }
    ];

    const rawNum = txt => {
      if (typeof txt !== 'string') return NaN;
      return parseFloat(txt.replace(/[^0-9.\-]/g, ''));
    };
    const delta = (val, base) => {
      if (!isFinite(val) || !isFinite(base) || Math.abs(val - base) < 1e-9) return '';
      return val > base
        ? ' <span class="eq-delta-bien" style="display:inline-flex;align-items:center;gap:2px">' + Equilibrio._svg('arriba') + '</span>'
        : ' <span class="eq-delta-mal"  style="display:inline-flex;align-items:center;gap:2px">' + Equilibrio._svg('abajo')  + '</span>';
    };

    const encabezado = '<tr><th>Concepto</th>' +
      esc.map(s => '<th>' + esc(s.nombre || 'Escenario') + badgeEsc(s.nombre) + '</th>').join('') +
    '</tr>';

    const cuerpo = filas.map(f => {
      const celdas = params.map((p, i) => {
        const c   = calcs[i];
        const txt = f.fmt(p, c);
        const d_icon = i > 0 ? delta(rawNum(txt), rawNum(f.fmt(params[0], calcs[0]))) : '';
        return '<td>' + txt + d_icon + '</td>';
      }).join('');
      return '<tr class="' + (f.total ? 'total' : '') + '"><td>' + f.label + '</td>' + celdas + '</tr>';
    }).join('');

    return '<div class="tabla-scroll"><table class="tabla-datos">' + encabezado + cuerpo + '</table></div>';
  },

  /* ── Mejora 7: Interpretación del margen de seguridad ampliada ─────── */
  interpretarMS(b, pb) {
    if (!isFinite(b.ms)) return '';

    const pct    = b.ms * 100;
    const ventas = pb.precio * pb.unidades;
    const holgura_unidades = pb.unidades - b.peU;
    const holgura_pesos    = ventas - b.peC;

    let nivel, titulo, msg;
    if (pct >= 40) {
      nivel  = 'bien';
      titulo = 'Margen de seguridad alto — riesgo operativo bajo';
      msg    = 'Las ventas actuales pueden caer un ' + Fmt.pct(b.ms) + ' (' +
               Fmt.num(Math.abs(holgura_unidades), 0) + ' unidades · ' + Fmt.moneda(Math.abs(holgura_pesos)) +
               ') antes de llegar al punto donde la empresa deja de cubrir sus costos.';
    } else if (pct >= 20) {
      nivel  = 'alerta';
      titulo = 'Margen de seguridad moderado — riesgo operativo medio';
      msg    = 'Hay una holgura de ' + Fmt.num(Math.abs(holgura_unidades), 0) + ' unidades (' +
               Fmt.moneda(Math.abs(holgura_pesos)) + ') sobre el PE. ' +
               'Una caída significativa en la demanda podría generar pérdidas operativas.';
    } else if (pct > 0) {
      nivel  = 'riesgo';
      titulo = 'Margen de seguridad bajo — riesgo operativo alto';
      msg    = 'Solo hay ' + Fmt.num(Math.abs(holgura_unidades), 0) + ' unidades (' +
               Fmt.moneda(Math.abs(holgura_pesos)) + ') de margen sobre el PE. ' +
               'Cualquier reducción en ventas o aumento en costos produce pérdida operativa.';
    } else if (pct === 0) {
      nivel  = 'riesgo';
      titulo = 'En el punto de equilibrio exacto';
      msg    = 'Los ingresos igualan los costos totales: utilidad operativa cero. No hay holgura.';
    } else {
      nivel  = 'riesgo';
      titulo = 'Por debajo del punto de equilibrio';
      msg    = 'Las ventas actuales no cubren los costos totales. Faltan ' +
               Fmt.num(Math.abs(holgura_unidades), 0) + ' unidades (' +
               Fmt.moneda(Math.abs(holgura_pesos)) + ') para alcanzar el equilibrio.';
    }

    const ico = nivel === 'bien' ? Equilibrio._svg('ok') : Equilibrio._svg('warn');

    return '<div class="eq-aviso eq-aviso-' + nivel + '">' +
      '<div style="display:flex;align-items:center;gap:7px;font-weight:700;margin-bottom:5px">' +
        ico + titulo +
      '</div>' +
      '<p style="margin:0 0 6px">' + msg + '</p>' +
      '<details style="font-size:12px;opacity:.85">' +
        '<summary style="cursor:pointer;user-select:none">¿Qué es el margen de seguridad?</summary>' +
        '<p style="margin:6px 0 0">El margen de seguridad mide qué porcentaje pueden reducirse las ventas antes de que la empresa empiece a perder dinero. ' +
        'Se calcula como: <strong>MS = (Unidades vendidas − PE) ÷ Unidades vendidas</strong>. ' +
        'Un margen alto significa resistencia a bajas en la demanda. Un margen bajo o negativo indica que la estructura de costos es muy rígida respecto al nivel de ventas actual.</p>' +
      '</details>' +
    '</div>';
  },

  /* ── Explicación paso a paso ────────────────────────────────────────── */
  htmlExplicacion(pb, b) {
    if (!(b.mc > 0)) return '';
    return '<details class="eq-detalle"><summary>¿Cómo se calculó el punto de equilibrio?</summary>' +
      '<div class="eq-pasos">' +
      '<p><strong>1. Margen de contribución unitario (MC)</strong><br>' +
        'MC = Precio − Costo variable = ' + Fmt.moneda(pb.precio) + ' − ' + Fmt.moneda(pb.cv) +
        ' = <strong>' + Fmt.moneda(b.mc) + '</strong><br>' +
        'Por cada unidad vendida, ' + Fmt.moneda(b.mc) + ' quedan disponibles para cubrir costos fijos y generar utilidad.</p>' +
      '<p><strong>2. PE en unidades (redondeado hacia arriba)</strong><br>' +
        'PE<sub>u</sub> = ⌈ CF ÷ MC ⌉ = ⌈ ' + Fmt.moneda(pb.cf) + ' ÷ ' + Fmt.moneda(b.mc) + ' ⌉ = <strong>' + Fmt.num(b.peU, 0) + ' unidades</strong><br>' +
        '<small style="color:var(--suave)">Se redondea hacia arriba porque vender una fracción de unidad no es posible en la práctica; con el valor exacto la empresa aún tendría una pequeña pérdida.</small></p>' +
      '<p><strong>3. PE en C$</strong><br>' +
        'PE<sub>C$</sub> = CF ÷ MC% = ' + Fmt.moneda(pb.cf) + ' ÷ ' + Fmt.pct(b.mcPct) + ' = <strong>' + Fmt.moneda(b.peC) + '</strong></p>' +
      '<p><strong>4. Margen de seguridad</strong><br>' +
        'MS = (Unidades vendidas − PE<sub>u</sub>) ÷ Unidades vendidas = (' +
        Fmt.num(pb.unidades, 0) + ' − ' + Fmt.num(b.peU, 0) + ') ÷ ' + Fmt.num(pb.unidades, 0) +
        ' = <strong>' + Fmt.pct(b.ms) + '</strong></p>' +
      '</div></details>';
  },

  /* ── Campo de formulario ─────────────────────────────────────────────── */
  campo(id, etiqueta, valor, corto) {
    return '<label class="campo' + (corto ? ' corto' : '') + '">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + (valor ?? '') + '"></label>';
  },

  /* ── Panel de escenarios ─────────────────────────────────────────────── */
  htmlPanelEsc(escArr) {
    return escArr.map((s, i) =>
      '<div class="eq-esc-bloque" data-idx="' + i + '">' +
        '<div class="eq-esc-titulo">' +
          (i === 0
            ? '<strong>Escenario base</strong>'
            : '<input type="text" class="eq-esc-nombre" placeholder="Nombre del escenario" value="' + (s.nombre || '') + '" data-idx="' + i + '">') +
          (i > 0 ? ' <button class="btn-icon eq-esc-quitar" data-idx="' + i + '" title="Quitar escenario">' +
            Equilibrio._svg('block').replace('width="15"','width="13"').replace('height="15"','height="13"') + '</button>' : '') +
        '</div>' +
        '<div class="barra-acciones eq-esc-campos">' +
          '<label class="campo corto">Precio (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="precio" data-idx="' + i + '" value="' + s.precio + '"></label>' +
          '<label class="campo corto">Costo var. (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="cv" data-idx="' + i + '" value="' + s.cv + '"></label>' +
          '<label class="campo corto">Costos fijos (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="cf" data-idx="' + i + '" value="' + s.cf + '"></label>' +
          '<label class="campo corto">Volumen (%)<input type="text" inputmode="decimal" class="eq-esc-campo" data-campo="volumen" data-idx="' + i + '" value="' + s.volumen + '"></label>' +
          (i > 0 ? '<button class="btn sec eq-esc-reset" data-idx="' + i + '">Restablecer</button>' : '') +
        '</div>' +
      '</div>'
    ).join('');
  },

  /* ── Mejora 8: Gráfica con guard de MC ≤ 0 ──────────────────────────── */
  dibujarGrafico(raiz, d) {
    if (Equilibrio.graf) { try { Equilibrio.graf.destroy(); } catch(x){} Equilibrio.graf = null; }
    const caja = raiz.querySelector('#eq-grafico');
    if (!caja || typeof Chart === 'undefined') return;

    const esc    = d.esc || [];
    const params = esc.map(s => Equilibrio.aplicarEsc(d, s));
    const calcs  = params.map(p => Equilibrio.calcular(p, d.meta));

    // Mejora 8 — no dibujar si ningún escenario tiene MC positivo
    const hayValidos = params.some((p, i) => p.precio > p.cv && isFinite(calcs[i].peU));
    if (!hayValidos) {
      caja.parentNode.innerHTML =
        '<div class="eq-aviso eq-aviso-alerta" style="display:flex;align-items:center;gap:8px">' +
          Equilibrio._svg('warn') +
          'La gráfica no está disponible porque no hay margen de contribución positivo en ningún escenario. ' +
          'Ajusta el precio y el costo variable para que el precio supere al costo variable unitario.' +
        '</div>';
      return;
    }

    let tope = 10;
    params.forEach((p, i) => {
      tope = Math.max(tope, p.unidades, isFinite(calcs[i].peU) ? calcs[i].peU * 1.6 : 0);
    });
    const pasos = 14, xs = [];
    for (let i = 0; i <= pasos; i++) xs.push(Math.round(tope * i / pasos));

    const paleta = ['#0f5c4d','#1f6fa3','#c0392b','#e67e22','#8e44ad'];
    const ds = [];

    // Línea de costos fijos (escenario base)
    const baseCF = params[0]?.cf || d.cf;
    ds.push({
      label: 'Costos fijos', type: 'line',
      data: xs.map(() => baseCF),
      borderColor: 'rgba(100,100,100,.4)', borderDash: [4,4],
      borderWidth: 1.5, pointRadius: 0, tension: 0
    });

    params.forEach((p, i) => {
      // Solo dibuja escenarios con MC > 0
      if (p.precio <= p.cv) return;
      const color  = paleta[i % paleta.length];
      const nombre = esc[i]?.nombre || ('Esc. ' + (i+1));
      ds.push({
        label: 'Ingresos — ' + nombre, type: 'line',
        data: xs.map(q => p.precio * q),
        borderColor: color, borderWidth: 2,
        pointRadius: 0, tension: 0,
        borderDash: i > 0 ? [8,4] : []
      });
      ds.push({
        label: 'Costo total — ' + nombre, type: 'line',
        data: xs.map(q => p.cf + p.cv * q),
        borderColor: color, borderWidth: 2,
        pointRadius: 0, tension: 0, borderDash: [4,4]
      });
      if (isFinite(calcs[i].peU)) {
        const peX = calcs[i].peU;
        ds.push({
          label: 'PE — ' + nombre, type: 'scatter',
          data: [{ x: peX, y: p.precio * peX }],
          borderColor: color, backgroundColor: '#fff',
          pointRadius: 7, pointBorderWidth: 2.5, showLine: false
        });
      }
    });

    const mill = v => {
      const a = Math.abs(v);
      if (a >= 1e6) return (v/1e6).toFixed(1) + ' M';
      if (a >= 1e3) return (v/1e3).toFixed(0) + ' k';
      return v;
    };

    Equilibrio.graf = new Chart(caja, {
      type: 'line',
      data: { labels: xs.map(x => Fmt.num(x, 0)), datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': C$ ' + Fmt.num(ctx.parsed.y, 2) } }
        },
        scales: {
          x: { title: { display: true, text: 'Unidades vendidas' } },
          y: { title: { display: true, text: 'C$' }, ticks: { callback: mill } }
        }
      }
    });
  },

  /* ── RENDER PRINCIPAL ────────────────────────────────────────────────── */
  render(el) {
    const d = Equilibrio.obtener();
    if (!d.esc || !Array.isArray(d.esc) || d.esc.length === 0)
      d.esc = [{ nombre: 'Base', precio: 0, cv: 0, cf: 0, volumen: 0 }];

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">' +
        'El punto de equilibrio es la cantidad de unidades (o el monto de ventas) donde los ingresos totales igualan exactamente a los costos totales. ' +
        'Fórmula: <strong>PE = Costos fijos ÷ (Precio − Costo variable unitario)</strong>. ' +
        'Las unidades del PE se redondean hacia arriba: vender una fracción no es posible en la práctica.' +
      '</div>' +

      '<h2 class="titulo-seccion">Datos de entrada</h2>' +
      '<div class="barra-acciones">' +
        Equilibrio.campo('eq-precio',   'Precio de venta unitario (C$)', d.precio) +
        Equilibrio.campo('eq-cv',       'Costo variable unitario (C$)',  d.cv) +
        Equilibrio.campo('eq-cf',       'Costos fijos totales (C$)',     d.cf) +
        Equilibrio.campo('eq-unidades', 'Unidades vendidas',             d.unidades) +
        Equilibrio.campo('eq-meta',     'Utilidad deseada (C$)',         d.meta) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="eq-ejemplo">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn sec" id="eq-estados">Tomar costos de Estados financieros</button>' +
        '<button class="btn sec peligro" id="eq-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="eq-aviso-estados"></div>' +
      '<div id="eq-avisos-val"></div>' +

      '<h2 class="titulo-seccion">Escenarios <span class="tip" title="Variaciones en % sobre la base. Agrega hasta 4 escenarios adicionales.">?</span></h2>' +
      '<div id="eq-panel-esc">' + Equilibrio.htmlPanelEsc(d.esc) + '</div>' +
      '<div class="barra-acciones" style="margin-top:8px">' +
        '<button class="btn sec" id="eq-agregar-esc">+ Agregar escenario</button>' +
      '</div>' +

      '<h2 class="titulo-seccion">Resultados</h2>' +
      '<div class="rejilla" id="eq-tarjetas"></div>' +
      '<div id="eq-comparacion"  style="margin-top:14px"></div>' +
      '<div id="eq-ms-interp"    style="margin-top:14px"></div>' +
      '<div id="eq-sensibilidad" style="margin-top:14px"></div>' +
      '<div id="eq-explicacion"  style="margin-top:14px"></div>' +
      '<div class="tarjeta" id="eq-tabla" style="margin-top:14px"></div>' +

      '<h2 class="titulo-seccion">Gráfica C-V-U</h2>' +
      '<div class="tarjeta"><div class="grafico" style="height:360px"><canvas id="eq-grafico"></canvas></div></div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    /* ── Leer estado del formulario ──────────────────────────────────── */
    const leerBase = () => ({
      precio:   Fmt.aNum(raiz.querySelector('#eq-precio').value),
      cv:       Fmt.aNum(raiz.querySelector('#eq-cv').value),
      cf:       Fmt.aNum(raiz.querySelector('#eq-cf').value),
      unidades: Fmt.aNum(raiz.querySelector('#eq-unidades').value),
      meta:     Fmt.aNum(raiz.querySelector('#eq-meta').value)
    });
    const leerEsc = () => {
      const arr = [];
      raiz.querySelectorAll('.eq-esc-bloque').forEach((bloque, i) => {
        const nombre = i === 0 ? 'Base'
          : (bloque.querySelector('.eq-esc-nombre')?.value || ('Esc. ' + i));
        const campos = {};
        bloque.querySelectorAll('.eq-esc-campo').forEach(inp => {
          campos[inp.dataset.campo] = Fmt.aNum(inp.value);
        });
        arr.push({ nombre, precio: campos.precio ?? 0, cv: campos.cv ?? 0,
                   cf: campos.cf ?? 0, volumen: campos.volumen ?? 0 });
      });
      return arr;
    };

    const refrescar = () => {
      const base   = leerBase();
      const escArr = leerEsc();
      const x      = { ...base, esc: escArr };
      Datos.guardar('equilibrio', x);

      const pb = { precio: base.precio, cv: base.cv, cf: base.cf, unidades: base.unidades };
      const b  = Equilibrio.calcular(pb, base.meta);
      const valOk = !(b.mc <= 0);    // MC positivo = cálculos válidos

      /* Validaciones */
      raiz.querySelector('#eq-avisos-val').innerHTML = Equilibrio.htmlAvisos(Equilibrio.validar(pb));

      /* Tarjetas KPI */
      const kpi = (tt, v, nota, cls) =>
        '<div class="tarjeta' + (cls ? ' dash-kpi ' + cls : '') + '">' +
          '<h3>' + tt + '</h3>' +
          '<div class="valor">' + v + '</div>' +
          '<div class="nota">' + nota + '</div>' +
        '</div>';
      raiz.querySelector('#eq-tarjetas').innerHTML =
        kpi('PE (unidades)',              isFinite(b.peU)   ? Fmt.num(b.peU, 0)   + ' u.' : '—', 'Redondeado hacia arriba') +
        kpi('PE (C$)',                    isFinite(b.peC)   ? Fmt.moneda(b.peC)             : '—', 'Costos fijos ÷ margen %') +
        kpi('Margen de contribución',     isFinite(b.mcPct) ? Fmt.pct(b.mcPct)              : '—', Fmt.moneda(b.mc) + ' por unidad',
            !isFinite(b.mcPct) || b.mcPct <= 0 ? 'riesgo' : b.mcPct < 0.1 ? 'alerta' : '') +
        kpi('Unidades para meta deseada', isFinite(b.uMeta) ? Fmt.num(b.uMeta, 0) + ' u.' : '—', 'Redondeado hacia arriba');

      /* Mejora 4: comparación PE vs actual */
      raiz.querySelector('#eq-comparacion').innerHTML  = Equilibrio.htmlComparacion(pb, b);

      /* Mejora 7: interpretación MS ampliada */
      raiz.querySelector('#eq-ms-interp').innerHTML    = Equilibrio.interpretarMS(b, pb);

      /* Mejora 5: análisis de sensibilidad */
      raiz.querySelector('#eq-sensibilidad').innerHTML = Equilibrio.htmlSensibilidad(pb, b);

      /* Explicación paso a paso */
      raiz.querySelector('#eq-explicacion').innerHTML  = Equilibrio.htmlExplicacion(pb, b);

      /* Tabla multi-escenario */
      raiz.querySelector('#eq-tabla').innerHTML = Equilibrio.tablaEscenarios(x);

      /* Gráfica con debounce */
      clearTimeout(Equilibrio.temporizador);
      Equilibrio.temporizador = setTimeout(() => Equilibrio.dibujarGrafico(raiz, x), 220);
    };

    /* ── Eventos ─────────────────────────────────────────────────────── */
    raiz.addEventListener('input',  e => { if (!e.target.classList.contains('eq-esc-nombre')) refrescar(); });
    raiz.addEventListener('change', refrescar);

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
      const base  = leerBase();
      const aviso = raiz.querySelector('#eq-aviso-estados');
      if (!(base.unidades > 0)) {
        aviso.innerHTML = '<div class="cuadre mal">' + Equilibrio._svg('warn') + ' Primero escribe las unidades vendidas (los estados financieros están en C$, no en unidades).</div>';
        return;
      }
      const est  = Estados.obtener();
      const nv   = k => Number(est.er[k][1]) || 0;
      const nuevo = {
        ...Equilibrio.obtener(),
        precio:   nv('ventas') / base.unidades,
        cv:       nv('costoVentas') / base.unidades,
        cf:       nv('gastosVenta') + nv('gastosAdmin') + nv('depreciacion'),
        unidades: base.unidades
      };
      Datos.guardar('equilibrio', nuevo);
      Equilibrio.render(el); Validar.activar(el);
      const av2 = el.querySelector('#eq-aviso-estados');
      if (av2) av2.innerHTML = '<div class="cuadre ok">' + Equilibrio._svg('ok') +
        ' Datos tomados del año ' + est.anios[1] + ': precio = Ventas ÷ unidades; costo variable = Costo de ventas ÷ unidades; costos fijos = gastos de venta + administración + depreciación.</div>';
    });

    raiz.querySelector('#eq-agregar-esc').addEventListener('click', () => {
      const arrActual = leerEsc();
      if (arrActual.length >= 5) { alert('Máximo 5 escenarios.'); return; }
      arrActual.push({ nombre: 'Escenario ' + arrActual.length, precio: 0, cv: 0, cf: 0, volumen: 0 });
      const x = { ...leerBase(), esc: arrActual };
      Datos.guardar('equilibrio', x);
      Equilibrio.render(el); Validar.activar(el);
    });

    raiz.querySelector('#eq-panel-esc').addEventListener('click', e => {
      if (e.target.closest('.eq-esc-quitar')) {
        const idx = Number(e.target.closest('.eq-esc-quitar').dataset.idx);
        const arr = leerEsc(); arr.splice(idx, 1);
        Datos.guardar('equilibrio', { ...leerBase(), esc: arr });
        Equilibrio.render(el); Validar.activar(el);
      }
      if (e.target.classList.contains('eq-esc-reset')) {
        const idx = Number(e.target.dataset.idx);
        const arr = leerEsc();
        arr[idx] = { nombre: arr[idx].nombre, precio: 0, cv: 0, cf: 0, volumen: 0 };
        Datos.guardar('equilibrio', { ...leerBase(), esc: arr });
        Equilibrio.render(el); Validar.activar(el);
      }
    });

    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.equilibrio = {
  titulo:    'Punto de equilibrio',
  subtitulo: 'Margen de contribución, análisis C-V-U, escenarios y gráfica',
  render(el) { Equilibrio.render(el); }
};