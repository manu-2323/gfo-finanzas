// Módulo 4: Apalancamiento operativo (GAO), financiero (GAF) y total (GAT)
// Mejoras: corrección pérdidas operativas, guards denominador cero,
// origen de cada valor, período correcto en interpretaciones,
// bloques independientes GAO/GAF/GAT, simulador de impacto en ventas.
const Apalancamiento = {
  graf: null,
  grafSim: null,

  /* ── SVG icons ──────────────────────────────────────────────────────── */
  ico: {
    warn:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    block: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M4.9 4.9l14.2 14.2"/></svg>',
    ok:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6L9 17l-5-5"/></svg>',
    info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>',
    arriba:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    abajo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    gao:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    gaf:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7a2 2 0 0 1 2-2h14v2M16 14h2"/></svg>',
    gat:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    sim:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  },
  _svg(k, w, h) {
    return Apalancamiento.ico[k]
      ? Apalancamiento.ico[k]
          .replace('width="15"',  'width="'  + (w||15) + '"')
          .replace('height="15"', 'height="' + (h||15) + '"')
          .replace('width="20"',  'width="'  + (w||20) + '"')
          .replace('height="20"', 'height="' + (h||20) + '"')
          .replace('width="13"',  'width="'  + (w||13) + '"')
          .replace('height="13"', 'height="' + (h||13) + '"')
      : '';
  },

  /* ── Datos de ejemplo ───────────────────────────────────────────────── */
  ejemplo() {
    return { u1: 100000, u2: 120000, precio: 7.5, cv: 3, cf: 250000,
             intereses: 80000, dividendosPref: 40000, acciones: 20000, isr: 40 };
  },
  casoClase() {
    return { u1: 20000, u2: 30000, precio: 25, cv: 10, cf: 50000,
             intereses: 200000, dividendosPref: 0, acciones: 10000, isr: 40 };
  },
  vacio() {
    return { u1: 0, u2: 0, precio: 0, cv: 0, cf: 0,
             intereses: 0, dividendosPref: 0, acciones: 0, isr: 0 };
  },
  obtener() { return Datos.leer('apalancamiento', Apalancamiento.ejemplo()); },

  /* ── Cálculo para UN período ────────────────────────────────────────── */
  periodo(d, u) {
    const t        = d.isr / 100;
    const ventas   = d.precio * u;
    const mc       = (d.precio - d.cv) * u;
    const uaii     = mc - d.cf;
    const uai      = uaii - d.intereses;
    // Mejora 2 — impuesto solo cuando UAI > 0
    const impuesto = uai > 0 ? uai * t : 0;
    const un       = uai - impuesto;
    const disp     = un - d.dividendosPref;
    const upa      = d.acciones ? disp / d.acciones : NaN;

    // Mejora 3 — GAO: guard denominador cero/negativo
    const gao = uaii !== 0 ? mc / uaii : NaN;

    // Mejora 3 — GAF: guard denominador cero/negativo con diagnóstico
    const dapAdj  = t < 1 ? d.dividendosPref / (1 - t) : NaN;
    const baseGaf = isFinite(dapAdj)
      ? uaii - d.intereses - dapAdj
      : uaii - d.intereses;
    const gaf = (isFinite(baseGaf) && baseGaf !== 0) ? uaii / baseGaf : NaN;

    const gat = (isFinite(gao) && isFinite(gaf)) ? gao * gaf : NaN;

    // Estado del denominador del GAF (para avisos específicos)
    const estadoGaf =
      !isFinite(baseGaf)   ? 'indefinido' :
      baseGaf === 0        ? 'cero'       :
      baseGaf < 0          ? 'negativo'   : 'valido';

    return { ventas, mc, uaii, uai, impuesto, un, disp, upa,
             gao, gaf, gat, baseGaf, estadoGaf, t };
  },

  /* ── Variaciones porcentuales (dos períodos) ───────────────────────── */
  variaciones(a, b) {
    const v = (x, y) => (x && x !== 0) ? (y - x) / Math.abs(x) : NaN;
    const dV = v(a.ventas, b.ventas);
    const dU = v(a.uaii,   b.uaii);
    const dP = v(a.upa,    b.upa);
    return {
      dV, dU, dP,
      gao: (isFinite(dV) && dV !== 0 && isFinite(dU)) ? dU / dV : NaN,
      gaf: (isFinite(dU) && dU !== 0 && isFinite(dP)) ? dP / dU : NaN,
      gat: (isFinite(dV) && dV !== 0 && isFinite(dP)) ? dP / dV : NaN
    };
  },

  /* ── Mejora 1+2+3: Validaciones ampliadas ──────────────────────────── */
  validar(d, a) {
    // Recibe solo `a` (período 1) para evitar mezclar períodos — Mejora 5
    const w = [];

    if (d.precio > 0 && d.cv >= d.precio)
      w.push({ t:'riesgo', m:'El costo variable unitario es mayor o igual al precio: la empresa pierde dinero en cada unidad vendida. Los grados de apalancamiento no tienen sentido económico en esta situación.' });

    // Mejora 2 — UAII = 0
    if (a.uaii === 0 && d.u1 > 0)
      w.push({ t:'riesgo', m:'La UAII del período 1 es exactamente cero: el GAO y el GAT no están definidos (división entre cero). La empresa opera exactamente en el punto de equilibrio operativo.' });

    // Mejora 1 — Pérdida operativa: corregir interpretación
    if (a.uaii < 0)
      w.push({ t:'riesgo', m:'La UAII del período 1 es negativa (' + Fmt.moneda(a.uaii) + '): pérdida operativa. El GAO calculado (' + (isFinite(a.gao)?Fmt.num(a.gao,4):'N/D') + ') tiene signo ' + (a.gao<0?'negativo':'positivo') + '. Con pérdida operativa, un <em>aumento</em> en ventas reduce la pérdida (efecto inverso al habitual). Las interpretaciones estándar de amplificación no aplican directamente.' });

    // Mejora 3 — Denominador GAF cero o negativo
    if (a.estadoGaf === 'cero')
      w.push({ t:'riesgo', m:'El denominador del GAF es cero: UAII − Intereses − DAP/(1−T) = 0. La empresa no genera ninguna utilidad disponible para los accionistas. El GAF no está definido.' });
    if (a.estadoGaf === 'negativo')
      w.push({ t:'riesgo', m:'El denominador del GAF es negativo (' + Fmt.moneda(a.baseGaf) + '): los intereses y dividendos preferentes superan la UAII. La empresa incurre en pérdida antes de impuestos. El GAF calculado tiene signo ' + (a.gaf<0?'negativo':'positivo') + ' y no tiene la interpretación habitual de amplificación.' });
    if (a.estadoGaf === 'indefinido')
      w.push({ t:'alerta', m:'No se puede calcular el ajuste de dividendos preferentes porque la tasa de impuesto es 100 % o más. Revisa el campo T (%).' });

    if (d.intereses > 0 && a.uaii > 0 && d.intereses > a.uaii * 0.5)
      w.push({ t:'alerta', m:'Los intereses representan más del 50 % de la UAII (' + Fmt.moneda(d.intereses) + ' vs UAII ' + Fmt.moneda(a.uaii) + '). El GAF será alto: amplifica tanto las ganancias como las pérdidas al nivel de los accionistas.' });

    if (isFinite(a.gao) && Math.abs(a.gao) > 5)
      w.push({ t:'alerta', m:'GAO elevado (' + Fmt.num(a.gao,2) + '): un cambio pequeño en ventas produce un cambio mucho mayor en la UAII. Alto riesgo operativo.' });
    if (isFinite(a.gaf) && Math.abs(a.gaf) > 5)
      w.push({ t:'alerta', m:'GAF elevado (' + Fmt.num(a.gaf,2) + '): los gastos financieros fijos amplifican fuertemente las variaciones de la UAII sobre la UPA. Alto riesgo financiero.' });

    if (d.u2 === 0)
      w.push({ t:'info', m:'Sin unidades del período 2 no se puede hacer la comprobación por variaciones. Los grados directos sí se calculan con los datos del período 1.' });

    return w;
  },

  /* ── Avisos con SVG ─────────────────────────────────────────────────── */
  htmlAvisos(lista) {
    return lista.map(w => {
      const ico = w.t === 'riesgo' ? Apalancamiento._svg('block')
                : w.t === 'alerta' ? Apalancamiento._svg('warn')
                :                    Apalancamiento._svg('info');
      return '<div class="ap-aviso ap-aviso-' + w.t + '" style="display:flex;align-items:flex-start;gap:8px">' +
        '<span style="flex:none;margin-top:1px">' + ico + '</span>' +
        '<span>' + w.m + '</span>' +
      '</div>';
    }).join('');
  },

  /* ── Mejora 6: Tarjetas independientes GAO, GAF, GAT ───────────────── */
  htmlTarjetasGrado(d, a) {
    const g4 = v => isFinite(v) ? Fmt.num(v, 4) : 'N/D';
    const nivel = g =>
      !isFinite(g)       ? ''       :
      Math.abs(g) >= 5   ? 'riesgo' :
      Math.abs(g) >= 2   ? 'alerta' : 'ok';

    // Mejora 1 — advertencia especial si UAII o baseGaf < 0
    const notaGao = a.uaii < 0
      ? '<span class="chip riesgo" style="font-size:11px;margin-top:4px;display:inline-block">Pérdida operativa — interpretación invertida</span>'
      : a.uaii === 0 ? '<span class="chip riesgo" style="font-size:11px;margin-top:4px;display:inline-block">UAII = 0 — no definido</span>' : '';
    const notaGaf = a.estadoGaf !== 'valido'
      ? '<span class="chip riesgo" style="font-size:11px;margin-top:4px;display:inline-block">' +
          (a.estadoGaf === 'cero' ? 'Denominador cero' : a.estadoGaf === 'negativo' ? 'Denominador negativo' : 'No calculable') +
        '</span>'
      : '';

    const bloque = (ico, titulo, formula, origen, valor, nota, niv, desc) =>
      '<div class="tarjeta dash-kpi ' + niv + '">' +
        '<h3 style="display:flex;align-items:center;gap:7px;margin-bottom:6px">' +
          Apalancamiento._svg(ico, 18, 18) + titulo +
        '</h3>' +
        '<div class="valor" style="font-size:28px">' + valor + '</div>' +
        (nota ? '<div style="margin-top:4px">' + nota + '</div>' : '') +
        '<details style="margin-top:10px;font-size:13px">' +
          '<summary style="cursor:pointer;color:var(--suave);user-select:none">Fórmula y origen</summary>' +
          '<div style="margin-top:7px;line-height:1.6">' +
            '<div style="font-family:monospace;background:var(--arena-1);padding:7px 10px;border-radius:5px;margin-bottom:7px;font-size:12px">' + formula + '</div>' +
            '<div style="font-size:12px;color:var(--texto)">' + origen + '</div>' +
          '</div>' +
        '</details>' +
        '<p style="font-size:12px;color:var(--suave);margin-top:8px;line-height:1.5">' + desc + '</p>' +
      '</div>';

    const t = d.isr / 100;
    const origenGao =
      '<strong>MC</strong> = (' + Fmt.moneda(d.precio) + ' − ' + Fmt.moneda(d.cv) + ') × ' + Fmt.num(d.u1,0) + ' = ' + Fmt.moneda(a.mc) + '<br>' +
      '<strong>UAII</strong> = ' + Fmt.moneda(a.mc) + ' − ' + Fmt.moneda(d.cf) + ' (costos fijos) = ' + Fmt.moneda(a.uaii);
    const origenGaf =
      '<strong>UAII</strong> = ' + Fmt.moneda(a.uaii) + '<br>' +
      '<strong>Intereses</strong> = ' + Fmt.moneda(d.intereses) + '<br>' +
      (d.dividendosPref > 0
        ? '<strong>DAP/(1−T)</strong> = ' + Fmt.moneda(d.dividendosPref) + ' ÷ (1−' + Fmt.num(t,2) + ') = ' + Fmt.moneda(isFinite(a.t)?d.dividendosPref/(1-a.t):NaN) + '<br>'
        : '') +
      '<strong>Denominador</strong> = ' + Fmt.moneda(a.baseGaf);
    const origenGat =
      '<strong>GAO</strong> = ' + g4(a.gao) + '<br>' +
      '<strong>GAF</strong> = ' + g4(a.gaf);

    return '<div class="rejilla" style="margin-bottom:16px">' +
      bloque('gao', 'GAO — Apalancamiento operativo',
        'GAO = Margen de contribución ÷ UAII',
        origenGao, g4(a.gao), notaGao, nivel(a.gao),
        'Mide cuánto amplifica la estructura de costos fijos el efecto de un cambio en ventas sobre la UAII (utilidad operativa). ' +
        (isFinite(a.gao) && a.uaii > 0
          ? 'Con el GAO actual, si las ventas suben 1 %, la UAII sube ' + Fmt.num(Math.abs(a.gao),2) + ' %.'
          : '')) +

      bloque('gaf', 'GAF — Apalancamiento financiero',
        'GAF = UAII ÷ [UAII − I − DAP÷(1−T)]',
        origenGaf, g4(a.gaf), notaGaf, nivel(a.gaf),
        'Mide cuánto amplifica la deuda y los dividendos preferentes el efecto de un cambio en la UAII sobre la UPA (utilidad por acción). ' +
        (isFinite(a.gaf) && a.estadoGaf === 'valido'
          ? 'Con el GAF actual, si la UAII sube 1 %, la UPA sube ' + Fmt.num(Math.abs(a.gaf),2) + ' %.'
          : '')) +

      bloque('gat', 'GAT — Apalancamiento total',
        'GAT = GAO × GAF',
        origenGat, g4(a.gat), '', nivel(a.gat),
        'Combina el riesgo operativo y el financiero: mide cuánto amplifica la estructura completa de costos e intereses un cambio en ventas sobre la UPA. ' +
        (isFinite(a.gat)
          ? 'Con el GAT actual, si las ventas suben 1 %, la UPA sube ' + Fmt.num(Math.abs(a.gat),2) + ' %.'
          : '')) +
    '</div>';
  },

  /* ── Mejora 5: Interpretación del período correcto (solo a = P1) ────── */
  htmlInterpretacion(a) {
    const nivel = g =>
      !isFinite(g)       ? null    :
      Math.abs(g) >= 5   ? 'riesgo':
      Math.abs(g) >= 2   ? 'alerta': 'bien';

    const frase = (nombre, g, base, efecto, icoKey) => {
      if (!isFinite(g)) return '<li><div style="display:flex;align-items:flex-start;gap:8px"><span style="flex:none">' + Apalancamiento._svg('info') + '</span><span><strong>' + nombre + ':</strong> No calculable con los datos actuales.</span></div></li>';
      const niv  = nivel(g);
      const signoInv = g < 0;
      const ico  = niv === 'riesgo' ? 'block' : niv === 'alerta' ? 'warn' : 'ok';
      let txt = '<strong>' + nombre + ' = ' + Fmt.num(g,4) + ':</strong> Un cambio del 1 % en ' +
        base + ' produce un cambio del <strong>' + Fmt.num(Math.abs(g),4) + ' %</strong>' +
        (signoInv ? ' <em>en sentido contrario</em>' : '') + ' en ' + efecto + '.';
      if (signoInv)
        txt += ' <span class="ap-niv-riesgo">La interpretación es contraintuitiva porque hay pérdida operativa o denominador negativo.</span>';
      else if (niv === 'riesgo') txt += ' <span class="ap-niv-riesgo">Riesgo alto: la empresa es muy sensible a variaciones.</span>';
      else if (niv === 'alerta') txt += ' <span class="ap-niv-alerta">Riesgo moderado: hay amplificación significativa.</span>';
      else                        txt += ' <span class="ap-niv-bien">Riesgo bajo: la amplificación es moderada.</span>';
      return '<li><div style="display:flex;align-items:flex-start;gap:8px"><span style="flex:none;margin-top:2px">' + Apalancamiento._svg(ico) + '</span><span>' + txt + '</span></div></li>';
    };

    return '<ul class="ap-interp-lista" style="padding-left:0;list-style:none">' +
      frase('GAO', a.gao, 'las ventas', 'la UAII (utilidad operativa)', 'gao') +
      frase('GAF', a.gaf, 'la UAII',    'la UPA (utilidad por acción)', 'gaf') +
      frase('GAT', a.gat, 'las ventas', 'la UPA',                       'gat') +
      '</ul>' +
      (isFinite(a.gao) && isFinite(a.gaf)
        ? '<div style="background:var(--arena-1);padding:11px 14px;border-radius:7px;font-size:13px;line-height:1.6;margin-top:10px">' +
            Apalancamiento._svg('gat',14,14) + ' <strong>Efecto en cadena:</strong> Las ventas afectan la UAII (amplificadas × ' + Fmt.num(Math.abs(a.gao),2) + ' por el GAO), y la UAII afecta la UPA (amplificada × ' + Fmt.num(Math.abs(a.gaf),2) + ' por el GAF). ' +
            'Una empresa con GAT alto puede crecer muy rápido cuando las ventas suben, pero también deteriorarse muy rápido si bajan.' +
          '</div>'
        : '');
  },

  /* ── Mejora 4+5: Paso a paso con origen explícito ───────────────────── */
  htmlPasos(d, a) {
    const g4 = v => isFinite(v) ? Fmt.num(v,4) : 'N/D';
    const t  = d.isr / 100;
    const dapAdj  = t < 1 ? d.dividendosPref / (1-t) : null;
    const baseGaf = dapAdj !== null ? (a.uaii - d.intereses - dapAdj) : (a.uaii - d.intereses);

    return '<details class="ap-detalle"><summary>¿Cómo se calculan paso a paso? (período 1)</summary>' +
      '<div class="ap-pasos">' +

      '<p><strong>1. Estado de resultados del período 1 (base de los cálculos)</strong><br>' +
        'Precio: ' + Fmt.moneda(d.precio) + ' × Unidades: ' + Fmt.num(d.u1,0) + ' = Ventas: ' + Fmt.moneda(a.ventas) + '<br>' +
        'MC = (' + Fmt.moneda(d.precio) + ' − ' + Fmt.moneda(d.cv) + ') × ' + Fmt.num(d.u1,0) + ' = <strong>' + Fmt.moneda(a.mc) + '</strong><br>' +
        'UAII = ' + Fmt.moneda(a.mc) + ' − ' + Fmt.moneda(d.cf) + ' (CF) = <strong>' + Fmt.moneda(a.uaii) + '</strong>' +
        (a.uaii < 0 ? ' <span style="color:var(--malo);font-weight:600">← Pérdida operativa</span>' : '') +
      '</p>' +

      '<p><strong>2. GAO = Margen de contribución ÷ UAII</strong><br>' +
        'GAO = ' + Fmt.moneda(a.mc) + ' ÷ ' + Fmt.moneda(a.uaii) + ' = <strong>' + g4(a.gao) + '</strong><br>' +
        (a.uaii === 0
          ? '<span style="color:var(--malo)">UAII = 0: GAO no definido (división entre cero).</span>'
          : a.uaii < 0
            ? '<span style="color:var(--malo)">UAII negativa: el GAO es matemáticamente válido pero la empresa tiene pérdida operativa. Un aumento del 1 % en ventas reduce la pérdida un ' + g4(Math.abs(a.gao)) + ' %, no la aumenta.</span>'
            : 'Significa que si las ventas varían 1 %, la UAII varía ' + g4(Math.abs(a.gao)) + ' % en el mismo sentido.') +
      '</p>' +

      '<p><strong>3. GAF = UAII ÷ [UAII − I − DAP/(1−T)]</strong><br>' +
        'Denominador = ' + Fmt.moneda(a.uaii) + ' − ' + Fmt.moneda(d.intereses) +
        (d.dividendosPref > 0 && dapAdj !== null
          ? ' − ' + Fmt.moneda(dapAdj) + ' [DAP ÷ (1−T) = ' + Fmt.moneda(d.dividendosPref) + ' ÷ (1−' + Fmt.num(t,2) + ')]'
          : '') +
        ' = <strong>' + Fmt.moneda(baseGaf) + '</strong><br>' +
        (a.estadoGaf !== 'valido'
          ? '<span style="color:var(--malo)">Denominador ' + a.estadoGaf + ': GAF no tiene interpretación estándar. ' +
              (a.estadoGaf === 'cero' ? 'No hay utilidad disponible para accionistas.' : 'Los cargos financieros superan la UAII.') + '</span>'
          : 'GAF = ' + Fmt.moneda(a.uaii) + ' ÷ ' + Fmt.moneda(baseGaf) + ' = <strong>' + g4(a.gaf) + '</strong><br>' +
            (d.dividendosPref > 0 ? 'El ajuste DAP÷(1−T) convierte los dividendos preferentes (pagados después de impuestos) a una base antes de impuestos para que sean comparables con la UAII.' : '')) +
      '</p>' +

      '<p><strong>4. GAT = GAO × GAF</strong><br>' +
        'GAT = ' + g4(a.gao) + ' × ' + g4(a.gaf) + ' = <strong>' + g4(a.gat) + '</strong>' +
        (isFinite(a.gat) ? '<br>Si las ventas varían 1 %, la UPA varía ' + g4(Math.abs(a.gat)) + ' % en el mismo sentido.' : '') +
      '</p>' +

      '</div></details>';
  },

  /* ── Tabla de resultados por período (Mejora 5: sin mezclar períodos) ── */
  htmlTabla(d, a, b) {
    // Bug original: la fila "Costos variables" usaba u1/u2 hardcodeados.
    // Ahora b.mc - b.ventas no es el costo variable; lo calculamos desde d.cv
    const cv1 = d.cv * d.u1;
    const cv2 = d.cv * d.u2;
    const fila = (n, v1, v2, cls) =>
      '<tr class="' + (cls||'') + '">' +
        '<td>' + n + '</td>' +
        '<td>' + v1 + '</td>' +
        '<td>' + v2 + '</td>' +
      '</tr>';

    const nd = v => isFinite(v) ? Fmt.moneda(v) : '—';
    const aviso_perdida = (a.uaii < 0 || b.uaii < 0)
      ? '<div class="ap-aviso ap-aviso-riesgo" style="display:flex;align-items:flex-start;gap:8px;margin-top:8px">' +
          '<span style="flex:none">' + Apalancamiento._svg('block') + '</span>' +
          '<span>' +
            (a.uaii < 0 && b.uaii < 0 ? 'Ambos períodos presentan' : 'Un período presenta') +
            ' UAII negativa (pérdida operativa). El GAO y GAT tienen signo ' +
            (a.gao < 0 || b.uaii < 0 ? 'negativo' : 'diferente al habitual') +
            ': un <strong>aumento</strong> en ventas <strong>reduce</strong> la pérdida en lugar de ampliarla.' +
          '</span>' +
        '</div>'
      : '';

    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Concepto</th>' +
        '<th>' + Fmt.num(d.u1,0) + ' u. — período 1</th>' +
        '<th>' + Fmt.num(d.u2,0) + ' u. — período 2</th>' +
      '</tr>' +
      fila('Ventas totales',               Fmt.moneda(a.ventas),    Fmt.moneda(b.ventas)) +
      fila('(−) Costos variables',         Fmt.moneda(cv1),         Fmt.moneda(cv2)) +
      fila('Margen de contribución total', Fmt.moneda(a.mc),        Fmt.moneda(b.mc)) +
      fila('(−) Costos fijos',             Fmt.moneda(d.cf),        Fmt.moneda(d.cf)) +
      fila('UAII',                         Fmt.moneda(a.uaii),      Fmt.moneda(b.uaii), 'total') +
      fila('(−) Intereses',               Fmt.moneda(d.intereses),  Fmt.moneda(d.intereses)) +
      fila('UAI',                          Fmt.moneda(a.uai),       Fmt.moneda(b.uai)) +
      fila('(−) Impuesto (' + Fmt.num(d.isr,0) + ' %)', Fmt.moneda(a.impuesto), Fmt.moneda(b.impuesto)) +
      fila('Utilidad neta',                Fmt.moneda(a.un),        Fmt.moneda(b.un), 'total') +
      fila('(−) Dividendos preferentes',  Fmt.moneda(d.dividendosPref), Fmt.moneda(d.dividendosPref)) +
      fila('Utilidad para accionistas',   Fmt.moneda(a.disp),       Fmt.moneda(b.disp)) +
      fila('UPA (' + Fmt.num(d.acciones,0) + ' acc.)',
           nd(a.upa), nd(b.upa), 'total') +
    '</table></div>' + aviso_perdida;
  },

  /* ── Comparación métodos directo vs variaciones ─────────────────────── */
  htmlComparacion(a, vr) {
    if (!isFinite(vr.dV))
      return '<div class="ap-aviso ap-aviso-info" style="display:flex;align-items:flex-start;gap:8px">' +
        Apalancamiento._svg('info') + ' Sin datos del período 2 no se puede hacer la comprobación por variaciones porcentuales.</div>';

    const igual = (p,q) => isFinite(p) && isFinite(q) && Math.abs(p-q) < 1e-4;
    const fila = (nom, dir, var_) => {
      const ok = igual(dir,var_);
      const ico = ok ? Apalancamiento._svg('check') : Apalancamiento._svg('cross');
      return '<tr><td><strong>' + nom + '</strong></td>' +
        '<td>' + (isFinite(dir)  ? Fmt.num(dir,4)  : 'N/D') + '</td>' +
        '<td>' + (isFinite(var_) ? Fmt.num(var_,4) : 'N/D') + '</td>' +
        '<td style="text-align:center">' + ico + '</td></tr>';
    };
    const todoOk = igual(a.gao,vr.gao) && igual(a.gaf,vr.gaf) && igual(a.gat,vr.gat);
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Grado</th><th>Fórmula directa (P1)</th><th>Variaciones % (P1→P2)</th><th style="text-align:center">¿Coinciden?</th></tr>' +
      fila('GAO', a.gao, vr.gao) +
      fila('GAF', a.gaf, vr.gaf) +
      fila('GAT', a.gat, vr.gat) +
    '</table></div>' +
    '<div class="cuadre ' + (todoOk?'ok':'mal') + '" style="display:flex;align-items:flex-start;gap:8px;margin-top:8px">' +
      (todoOk ? Apalancamiento._svg('ok') : Apalancamiento._svg('warn')) +
      '<span>' + (todoOk
        ? 'Comprobación correcta: el método directo y el método por variaciones dan el mismo resultado.'
        : 'Los métodos no coinciden. Esto ocurre cuando hay pérdidas operativas, UAII cero en algún período, o faltan datos del período 2. En esos casos el método directo (fórmulas) es el válido.') +
      '</span>' +
    '</div>';
  },

  /* ── Mejora 7: Simulador de impacto en ventas ───────────────────────── */
  htmlSimulador() {
    return '<div class="tarjeta" id="ap-sim-bloque" style="margin-bottom:4px">' +
      '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        Apalancamiento._svg('sim') + ' Simulador: impacto de un cambio en ventas' +
      '</h3>' +
      '<p class="nota-pie" style="margin-bottom:12px">Escribe el porcentaje de cambio en ventas y verás cómo afecta la UAII y la UPA usando los grados del período 1.</p>' +
      '<div class="barra-acciones" style="align-items:flex-end;margin-bottom:14px">' +
        '<label class="campo corto">Cambio en ventas (%)<input type="text" inputmode="decimal" id="ap-sim-pct" value="10" style="max-width:120px"></label>' +
      '</div>' +
      '<div id="ap-sim-resultado"></div>' +
      '<div class="grafico" style="min-height:200px;margin-top:12px"><canvas id="ap-sim-graf"></canvas></div>' +
    '</div>';
  },

  actualizarSimulador(raiz, a, d) {
    const inp = raiz.querySelector('#ap-sim-pct');
    if (!inp) return;
    const pct    = parseFloat(inp.value.replace(/,/g,'')) || 0;
    const resEl  = raiz.querySelector('#ap-sim-resultado');
    const grafEl = raiz.querySelector('#ap-sim-graf');

    if (!isFinite(a.gao) && !isFinite(a.gat)) {
      resEl.innerHTML = '<div class="ap-aviso ap-aviso-info" style="display:flex;align-items:flex-start;gap:8px">' +
        Apalancamiento._svg('info') + ' No hay grados calculables para hacer la simulación.</div>';
      return;
    }

    const dUAII  = isFinite(a.gao) ? pct * a.gao  : null;
    const dUPA   = isFinite(a.gat) ? pct * a.gat  : null;
    const uaiiNueva = isFinite(dUAII) ? a.uaii * (1 + dUAII/100) : null;
    const upaNueva  = isFinite(dUPA)  ? a.upa  * (1 + dUPA/100)  : null;

    const dDir = v => v === null ? '—'
      : (v > 0
        ? '<span style="color:var(--ok);display:inline-flex;align-items:center;gap:3px">' + Apalancamiento._svg('arriba') + '+' + Fmt.num(v,2) + ' %</span>'
        : v < 0
          ? '<span style="color:var(--malo);display:inline-flex;align-items:center;gap:3px">' + Apalancamiento._svg('abajo') + Fmt.num(v,2) + ' %</span>'
          : '<span>0 %</span>');

    resEl.innerHTML =
      '<div class="rejilla" style="margin-bottom:4px">' +
        '<div class="tarjeta"><h3>Cambio en ventas</h3>' +
          '<div class="valor">' + dDir(pct) + '</div>' +
        '</div>' +
        '<div class="tarjeta"><h3>Cambio en UAII (×GAO ' + (isFinite(a.gao)?Fmt.num(a.gao,2):'N/D') + ')</h3>' +
          '<div class="valor">' + dDir(dUAII) + '</div>' +
          (uaiiNueva !== null ? '<div class="nota">Nueva UAII estimada: ' + Fmt.moneda(uaiiNueva) + '</div>' : '') +
        '</div>' +
        '<div class="tarjeta"><h3>Cambio en UPA (×GAT ' + (isFinite(a.gat)?Fmt.num(a.gat,2):'N/D') + ')</h3>' +
          '<div class="valor">' + dDir(dUPA) + '</div>' +
          (upaNueva !== null && isFinite(a.upa) ? '<div class="nota">Nueva UPA estimada: ' + Fmt.moneda(upaNueva) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<p class="nota-pie">Estimación lineal usando los grados del período 1. ' +
        (a.uaii < 0 ? 'La UAII base es negativa: el cambio reduce o aumenta la pérdida.' : '') +
      '</p>';

    // Gráfica del simulador
    if (Apalancamiento.grafSim) { try{Apalancamiento.grafSim.destroy();}catch(e){} Apalancamiento.grafSim=null; }
    if (typeof Chart === 'undefined' || !grafEl) return;

    const pasos   = [-30,-20,-10,-5,0,5,10,20,30];
    const labelsS = pasos.map(p => (p>=0?'+':'') + p + ' %');
    const dUAII_s = pasos.map(p => isFinite(a.gao) ? parseFloat((p * a.gao).toFixed(2)) : null);
    const dUPA_s  = pasos.map(p => isFinite(a.gat) ? parseFloat((p * a.gat).toFixed(2)) : null);

    Apalancamiento.grafSim = new Chart(grafEl, {
      type: 'line',
      data: {
        labels: labelsS,
        datasets: [
          { label: '% cambio UAII', data: dUAII_s,
            borderColor: '#0f5c4d', backgroundColor: 'rgba(15,92,77,.12)',
            tension: .3, pointRadius: 5, fill: true },
          { label: '% cambio UPA',  data: dUPA_s,
            borderColor: '#8c3b5e', backgroundColor: 'rgba(140,59,94,.08)',
            tension: .3, pointRadius: 5, borderDash: [5,3], fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + (ctx.raw !== null ? (ctx.raw>=0?'+':'')+Fmt.num(ctx.raw,2)+' %' : 'N/D') } }
        },
        scales: {
          x: { title: { display: true, text: 'Cambio en ventas' } },
          y: { title: { display: true, text: 'Cambio resultante' }, ticks: { callback: v => v + ' %' } }
        }
      }
    });
  },

  /* ── Gráfica principal de variaciones ──────────────────────────────── */
  dibujar(raiz, a, b, vr) {
    if (Apalancamiento.graf) { try{Apalancamiento.graf.destroy();}catch(x){} Apalancamiento.graf=null; }
    const c = raiz.querySelector('#ap-grafico');
    if (!c || typeof Chart === 'undefined') return;
    if (!isFinite(vr.dV)) { c.parentNode.innerHTML = '<p class="nota-pie">Sin datos del período 2 no se genera la gráfica de variaciones.</p>'; return; }

    const colores = v => v >= 0 ? 'rgba(15,92,77,.8)' : 'rgba(179,38,30,.75)';
    const vals = [vr.dV*100, vr.dU*100, vr.dP*100];
    Apalancamiento.graf = new Chart(c, {
      type: 'bar',
      data: {
        labels: ['Δ Ventas', 'Δ UAII', 'Δ UPA'],
        datasets: [{ label: 'Variación %', data: vals,
          backgroundColor: vals.map(v => colores(isFinite(v)?v:0)), borderRadius: 5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false },
          tooltip: { callbacks: { label: ctx => (ctx.raw>=0?'+':'')+Fmt.num(ctx.raw,2)+' %' } } },
        scales: { y: { ticks: { callback: v => v + ' %' } } }
      }
    });
  },

  campo(id, etiqueta, valor) {
    return '<label class="campo corto" style="flex:1;min-width:170px">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + (valor??'') + '"></label>';
  },

  /* ── RENDER PRINCIPAL ────────────────────────────────────────────────── */
  render(el) {
    const d = Apalancamiento.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">' +
        'El apalancamiento mide cuánto amplifica la estructura de costos e intereses el efecto de los cambios en ventas. ' +
        '<strong>GAO</strong> = MC ÷ UAII (riesgo operativo) · ' +
        '<strong>GAF</strong> = UAII ÷ (UAII − I − DAP/(1−T)) (riesgo financiero) · ' +
        '<strong>GAT</strong> = GAO × GAF (riesgo total). ' +
        'Todos los cálculos usan los datos del <strong>período 1</strong>.' +
      '</div>' +

      '<h2 class="titulo-seccion">Datos de entrada</h2>' +
      '<div class="barra-acciones">' +
        Apalancamiento.campo('ap-u1',    'Unidades vendidas (período 1)', d.u1) +
        Apalancamiento.campo('ap-u2',    'Unidades vendidas (período 2)', d.u2) +
        Apalancamiento.campo('ap-precio','Precio unitario (C$)', d.precio) +
        Apalancamiento.campo('ap-cv',    'Costo variable unitario (C$)', d.cv) +
        Apalancamiento.campo('ap-cf',    'Costos fijos (C$)', d.cf) +
      '</div>' +
      '<div class="barra-acciones">' +
        Apalancamiento.campo('ap-int', 'Intereses (C$)', d.intereses) +
        Apalancamiento.campo('ap-dap', 'Dividendos preferentes (C$)', d.dividendosPref) +
        Apalancamiento.campo('ap-acc', 'Acciones comunes', d.acciones) +
        Apalancamiento.campo('ap-isr', 'Tasa de impuesto T (%)', d.isr) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="ap-tor">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn" id="ap-clase">Cargar caso 20 000 / 30 000 u.</button>' +
        '<button class="btn sec" id="ap-eq">Traer costos de Punto de equilibrio</button>' +
        '<button class="btn sec" id="ap-est">Traer intereses e ISR de Estados</button>' +
        '<button class="btn sec peligro" id="ap-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="ap-msg"></div>' +
      '<div id="ap-avisos" style="margin-top:8px"></div>' +

      '<h2 class="titulo-seccion">Grados de apalancamiento — período 1</h2>' +
      '<div id="ap-tarjetas-grado"></div>' +
      '<div id="ap-interp" style="margin-top:12px"></div>' +
      '<div id="ap-pasos"  style="margin-top:10px"></div>' +

      '<h2 class="titulo-seccion">Estado de resultados por período</h2>' +
      '<div class="tarjeta" id="ap-tabla"></div>' +

      '<h2 class="titulo-seccion">Comprobación por variaciones porcentuales (P1 → P2)</h2>' +
      '<div class="cadena" id="ap-var"></div>' +
      '<div id="ap-comp" style="margin-top:10px"></div>' +

      '<h2 class="titulo-seccion">Variación % de ventas, UAII y UPA</h2>' +
      '<div class="tarjeta"><div class="grafico"><canvas id="ap-grafico"></canvas></div></div>' +

      '<h2 class="titulo-seccion">Simulador de impacto en ventas</h2>' +
      Apalancamiento.htmlSimulador();

    el.innerHTML = '';
    el.appendChild(raiz);

    const num  = id => Fmt.aNum(raiz.querySelector(id).value);
    const leer = () => ({
      u1: num('#ap-u1'), u2: num('#ap-u2'), precio: num('#ap-precio'),
      cv: num('#ap-cv'), cf: num('#ap-cf'), intereses: num('#ap-int'),
      dividendosPref: num('#ap-dap'), acciones: num('#ap-acc'), isr: num('#ap-isr')
    });
    const g4 = v => isFinite(v) ? Fmt.num(v,4) : 'N/D';

    const refrescar = () => {
      const x  = leer();
      Datos.guardar('apalancamiento', x);
      const a  = Apalancamiento.periodo(x, x.u1);
      const b  = Apalancamiento.periodo(x, x.u2);
      const vr = Apalancamiento.variaciones(a, b);

      // Mejora 5 — validar solo con `a` (período 1), no mezclar con `b`
      raiz.querySelector('#ap-avisos').innerHTML = Apalancamiento.htmlAvisos(Apalancamiento.validar(x, a));

      // Mejora 6 — tarjetas independientes GAO/GAF/GAT
      raiz.querySelector('#ap-tarjetas-grado').innerHTML = Apalancamiento.htmlTarjetasGrado(x, a);

      // Interpretación (solo período 1)
      raiz.querySelector('#ap-interp').innerHTML = Apalancamiento.htmlInterpretacion(a);

      // Paso a paso con origen de cada valor
      raiz.querySelector('#ap-pasos').innerHTML = Apalancamiento.htmlPasos(x, a);

      // Tabla (con fix del bug de costos variables)
      raiz.querySelector('#ap-tabla').innerHTML = Apalancamiento.htmlTabla(x, a, b);

      // Cadena de variaciones
      raiz.querySelector('#ap-var').innerHTML =
        '<div class="tarjeta"><h3>% cambio en ventas</h3><div class="valor">' + (isFinite(vr.dV)?Fmt.pct(vr.dV):'N/D') + '</div><div class="nota">Período 1 → Período 2</div></div>' +
        '<span class="op">→</span>' +
        '<div class="tarjeta"><h3>% cambio en UAII</h3><div class="valor">' + (isFinite(vr.dU)?Fmt.pct(vr.dU):'N/D') + '</div><div class="nota">GAO verificado = ' + g4(vr.gao) + '</div></div>' +
        '<span class="op">→</span>' +
        '<div class="tarjeta"><h3>% cambio en UPA</h3><div class="valor">' + (isFinite(vr.dP)?Fmt.pct(vr.dP):'N/D') + '</div><div class="nota">GAF verificado = ' + g4(vr.gaf) + '</div></div>' +
        '<span class="op">=</span>' +
        '<div class="tarjeta"><h3>GAT por variaciones</h3><div class="valor">' + g4(vr.gat) + '</div><div class="nota">%ΔUPA ÷ %ΔVentas</div></div>';

      raiz.querySelector('#ap-comp').innerHTML = Apalancamiento.htmlComparacion(a, vr);

      Apalancamiento.dibujar(raiz, a, b, vr);

      // Mejora 7 — simulador
      Apalancamiento.actualizarSimulador(raiz, a, x);
    };

    const cargar = (datos, msg) => {
      Datos.guardar('apalancamiento', datos);
      Apalancamiento.render(el); Validar.activar(el);
      if (msg) el.querySelector('#ap-msg').innerHTML = '<div class="cuadre ok" style="display:flex;align-items:center;gap:7px">' + Apalancamiento._svg('ok') + msg + '</div>';
    };

    raiz.addEventListener('input', e => {
      refrescar();
      // Redibujar simulador cuando cambia el % de simulación
      if (e.target.id === 'ap-sim-pct') {
        const a = Apalancamiento.periodo(leer(), leer().u1);
        Apalancamiento.actualizarSimulador(raiz, a, leer());
      }
    });

    raiz.querySelector('#ap-tor').addEventListener('click',    () => cargar(Apalancamiento.ejemplo()));
    raiz.querySelector('#ap-clase').addEventListener('click',  () => cargar(Apalancamiento.casoClase(),
      'Caso: precio C$ 25, CV C$ 10, CF C$ 50 000, intereses C$ 200 000 → GAO 1.2 · GAF 5 · GAT 6.'));
    raiz.querySelector('#ap-limpiar').addEventListener('click',() => {
      if (confirm('¿Borrar los datos de apalancamiento?')) cargar(Apalancamiento.vacio());
    });
    raiz.querySelector('#ap-eq').addEventListener('click', () => {
      const x = leer(), q = Equilibrio.obtener();
      x.precio = q.precio; x.cv = q.cv; x.cf = q.cf;
      if (!x.u1) x.u1 = q.unidades;
      cargar(x, 'Precio, costo variable y costos fijos tomados del módulo Punto de equilibrio.');
    });
    raiz.querySelector('#ap-est').addEventListener('click', () => {
      const x = leer(), est = Estados.obtener();
      x.intereses = Number(est.er.intereses[1]) || 0;
      x.isr       = Number(est.isr) || 0;
      cargar(x, 'Intereses (año ' + est.anios[1] + ') e ISR tomados de los Estados financieros.');
    });

    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.apalancamiento = {
  titulo:    'Apalancamiento',
  subtitulo: 'Grado de apalancamiento operativo, financiero y total',
  render(el) { Apalancamiento.render(el); }
};