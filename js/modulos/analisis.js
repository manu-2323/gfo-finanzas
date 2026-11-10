const Analisis = {
  grafs: [],

  valor(d, r, grupo, f, p) {
    const k = f[0];
    return k[0] === '@' ? r[p][k.slice(1)] : Number(d[grupo][k][p]) || 0;
  },

  ctx(d, r, p) {
    return {
      R: r[p],
      n: (g, k) => Number(d[g][k][p]) || 0,
      prom: (g, k) => p === 0 ? null : (Number(d[g][k][0]) + Number(d[g][k][1])) / 2,
      promR: k => p === 0 ? null : (r[0][k] + r[1][k]) / 2
    };
  },

  fmtV(tipo, v) {
    return (v === null || v === undefined || !isFinite(v)) ? 'N/D' : Fmt[tipo](v);
  },

  // ── Semáforo: devuelve 'bien' | 'alerta' | 'riesgo' | '' según el indicador
  semaforo(nombre, v) {
    if (v === null || !isFinite(v)) return '';
    const r = {
      'Capital de trabajo neto':      v >= 0        ? 'bien' : 'riesgo',
      'Razón corriente':              v >= 1.5      ? 'bien' : v >= 1 ? 'alerta' : 'riesgo',
      'Prueba ácida':                 v >= 1        ? 'bien' : v >= 0.7 ? 'alerta' : 'riesgo',
      'Rotación de inventarios':      v >= 4        ? 'bien' : v >= 2 ? 'alerta' : 'riesgo',
      'Edad promedio de inventario':  v <= 60       ? 'bien' : v <= 90 ? 'alerta' : 'riesgo',
      'Período promedio de cobro (PPC)': v <= 30    ? 'bien' : v <= 60 ? 'alerta' : 'riesgo',
      'Período promedio de pago (PPP)': v >= 30     ? 'bien' : 'alerta',
      'Ciclo de conversión del efectivo': v <= 60   ? 'bien' : v <= 90 ? 'alerta' : 'riesgo',
      'Rotación de activos fijos':    v >= 1        ? 'bien' : 'alerta',
      'Rotación de activos totales':  v >= 0.5      ? 'bien' : 'alerta',
      'Razón de endeudamiento':       v <= 0.5      ? 'bien' : v <= 0.65 ? 'alerta' : 'riesgo',
      'Deuda sobre patrimonio':       v <= 1        ? 'bien' : v <= 1.5 ? 'alerta' : 'riesgo',
      'Cobertura de intereses':       v >= 3        ? 'bien' : v >= 1.5 ? 'alerta' : 'riesgo',
      'Margen de utilidad bruta':     v >= 0.3      ? 'bien' : v >= 0.15 ? 'alerta' : 'riesgo',
      'Margen de utilidad operativa': v >= 0.1      ? 'bien' : v >= 0.05 ? 'alerta' : 'riesgo',
      'Margen de utilidad neta':      v >= 0.05     ? 'bien' : v >= 0.02 ? 'alerta' : 'riesgo',
      'Rendimiento sobre activos (ROA)': v >= 0.05  ? 'bien' : v >= 0.02 ? 'alerta' : 'riesgo',
      'Rendimiento sobre patrimonio (ROE)': v >= 0.1 ? 'bien' : v >= 0.05 ? 'alerta' : 'riesgo'
    };
    return r[nombre] || '';
  },

  // ── Recomendaciones automáticas según resultado
  recomendacion(nombre, v) {
    if (v === null || !isFinite(v)) return null;
    const sem = Analisis.semaforo(nombre, v);
    if (sem !== 'alerta' && sem !== 'riesgo') return null;
    const rec = {
      'Capital de trabajo neto':         'Considera financiar activos corrientes con deuda a largo plazo o incrementar el capital.',
      'Razón corriente':                 'Evalúa convertir deuda a corto en deuda a largo plazo para mejorar la cobertura.',
      'Prueba ácida':                    'El efectivo disponible sin inventarios es bajo; revisa la gestión de cobros.',
      'Rotación de inventarios':         'El inventario rota lento; analiza si hay productos de baja salida que ocupan capital.',
      'Edad promedio de inventario':     'El inventario tarda más de lo ideal en venderse; considera reducir niveles de stock.',
      'Período promedio de cobro (PPC)': 'El plazo de cobro es elevado; considera políticas de crédito más cortas o descuentos por pronto pago.',
      'Ciclo de conversión del efectivo':'El ciclo de caja es largo; negocia mejores plazos con proveedores o cobra más rápido.',
      'Razón de endeudamiento':          'El nivel de deuda es alto; evalúa refinanciamiento o capitalización para reducir el apalancamiento.',
      'Deuda sobre patrimonio':          'La deuda supera al patrimonio; refuerza la capitalización antes de solicitar nuevos créditos.',
      'Cobertura de intereses':          'La utilidad operativa cubre los intereses con poco margen; reduce gastos financieros o mejora la UAII.',
      'Margen de utilidad bruta':        'El margen bruto es bajo; revisa costos de producción o política de precios.',
      'Margen de utilidad operativa':    'Los gastos operativos consumen gran parte de las ventas; identifica rubros a optimizar.',
      'Margen de utilidad neta':         'La utilidad neta final es baja; combina mejora de precios con control de gastos e impuestos.',
      'Rendimiento sobre activos (ROA)': 'Los activos no están generando suficiente rendimiento; evalúa activos improductivos.',
      'Rendimiento sobre patrimonio (ROE)':'El retorno al accionista es bajo; revisa estructura de financiamiento y eficiencia operativa.'
    };
    return rec[nombre] || null;
  },

  razones() {
    const div = (a, b) => (b ? a / b : null);
    const x2 = v => Fmt.num(v, 2);
    return [
      { grupo: 'Liquidez', desc: 'Miden la capacidad de la empresa para cubrir sus obligaciones de corto plazo.', items: [
        { nombre: 'Capital de trabajo neto',
          formula: 'Activo corriente − Pasivo corriente',
          queEs: 'Los recursos que quedan disponibles después de cubrir todas las deudas a corto plazo.',
          tipo: 'moneda',
          f: c => c.R.ac - c.R.pc,
          txt: v => v >= 0 ? 'Positivo: los activos corrientes cubren los pasivos corrientes.' : 'Negativo: los pasivos corrientes superan a los activos corrientes.' },
        { nombre: 'Razón corriente',
          formula: 'Activo corriente ÷ Pasivo corriente',
          queEs: 'Cuántos córdobas de activo corriente respaldan cada córdoba de deuda a corto plazo.',
          tipo: 'veces',
          f: c => div(c.R.ac, c.R.pc),
          txt: v => 'Por cada C$ 1 de pasivo corriente hay C$ ' + x2(v) + ' de activo corriente.' },
        { nombre: 'Prueba ácida',
          formula: '(Activo corriente − Inventarios) ÷ Pasivo corriente',
          queEs: 'Igual que la razón corriente pero excluyendo inventarios, que son los activos menos líquidos.',
          tipo: 'veces',
          f: c => div(c.R.ac - c.n('bg', 'inventarios'), c.R.pc),
          txt: v => 'Sin contar inventarios, hay C$ ' + x2(v) + ' por cada C$ 1 de deuda a corto plazo.' }
      ]},
      { grupo: 'Actividad (saldos promedio, 365 días)', desc: 'Miden la eficiencia con la que la empresa gestiona sus activos operativos.', items: [
        { nombre: 'Rotación de inventarios',
          formula: 'Costo de ventas ÷ Inventario promedio',
          queEs: 'Cuántas veces se renueva el inventario durante el año. Mayor rotación = mejor gestión de stock.',
          tipo: 'veces',
          f: c => div(c.n('er', 'costoVentas'), c.prom('bg', 'inventarios')),
          txt: v => 'El inventario se renueva ' + x2(v) + ' veces al año.' },
        { nombre: 'Edad promedio de inventario',
          formula: '365 ÷ Rotación de inventarios',
          queEs: 'Cuántos días tarda en promedio el inventario en convertirse en venta.',
          tipo: 'dias',
          f: c => c.prom('bg', 'inventarios') === null ? null : div(365 * c.prom('bg', 'inventarios'), c.n('er', 'costoVentas')),
          txt: v => 'El inventario tarda unos ' + Math.round(v) + ' días en venderse.' },
        { nombre: 'Período promedio de cobro (PPC)',
          formula: 'CxC promedio × 365 ÷ Ventas',
          queEs: 'Cuántos días se tarda en cobrar a los clientes después de realizadas las ventas.',
          tipo: 'dias',
          f: c => c.prom('bg', 'cxc') === null ? null : div(c.prom('bg', 'cxc') * 365, c.n('er', 'ventas')),
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en cobrar a los clientes.' },
        { nombre: 'Período promedio de pago (PPP)',
          formula: 'CxP promedio × 365 ÷ Costo de ventas',
          queEs: 'Cuántos días se tarda en pagar a los proveedores. Un PPP mayor que el PPC es favorable.',
          tipo: 'dias',
          f: c => c.prom('bg', 'cxp') === null ? null : div(c.prom('bg', 'cxp') * 365, c.n('er', 'costoVentas')),
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en pagar a los proveedores.' },
        { nombre: 'Ciclo de conversión del efectivo',
          formula: 'Edad de inventario + PPC − PPP',
          queEs: 'Cuántos días el dinero queda "atrapado" en el ciclo operativo antes de regresar como efectivo.',
          tipo: 'dias',
          f: c => {
            const inv = c.prom('bg', 'inventarios'), cxc = c.prom('bg', 'cxc'), cxp = c.prom('bg', 'cxp');
            if (inv === null) return null;
            const edad = div(365 * inv, c.n('er', 'costoVentas'));
            const ppc  = div(cxc * 365, c.n('er', 'ventas'));
            const ppp  = div(cxp * 365, c.n('er', 'costoVentas'));
            return (edad === null || ppc === null || ppp === null) ? null : edad + ppc - ppp;
          },
          txt: v => 'El efectivo queda comprometido unos ' + Math.round(v) + ' días entre pagar y cobrar.' },
        { nombre: 'Rotación de activos fijos',
          formula: 'Ventas ÷ Activos fijos promedio',
          queEs: 'Cuántos córdobas de venta genera cada córdoba invertido en propiedad, planta y equipo.',
          tipo: 'veces',
          f: c => div(c.n('er', 'ventas'), c.prom('bg', 'activosFijos')),
          txt: v => 'Cada C$ 1 en activos fijos genera C$ ' + x2(v) + ' en ventas.' },
        { nombre: 'Rotación de activos totales',
          formula: 'Ventas ÷ Activo total promedio',
          queEs: 'Cuántos córdobas de venta genera cada córdoba de activo total.',
          tipo: 'veces',
          f: c => div(c.n('er', 'ventas'), c.promR('totalActivo')),
          txt: v => 'Cada C$ 1 en activos genera C$ ' + x2(v) + ' en ventas.' }
      ]},
      { grupo: 'Endeudamiento', desc: 'Miden qué porción de los activos está financiada con deuda y qué capacidad tiene la empresa para cubrirla.', items: [
        { nombre: 'Razón de endeudamiento',
          formula: 'Pasivo total ÷ Activo total',
          queEs: 'Qué fracción de los activos pertenece a los acreedores (no al dueño).',
          tipo: 'pct',
          f: c => div(c.R.totalPasivo, c.R.totalActivo),
          txt: v => 'El ' + Fmt.pct(v) + ' de los activos está financiado con deuda.' },
        { nombre: 'Deuda sobre patrimonio',
          formula: 'Pasivo total ÷ Patrimonio',
          queEs: 'Cuántos córdobas se deben por cada córdoba que pertenece a los propietarios.',
          tipo: 'veces',
          f: c => div(c.R.totalPasivo, c.R.patrimonio),
          txt: v => 'Por cada C$ 1 de patrimonio hay C$ ' + x2(v) + ' de deuda.' },
        { nombre: 'Cobertura de intereses',
          formula: 'UAII ÷ Gastos por intereses',
          queEs: 'Cuántas veces la utilidad operativa puede pagar los intereses de la deuda.',
          tipo: 'veces',
          f: c => div(c.R.uaii, c.n('er', 'intereses')),
          txt: v => 'La utilidad operativa cubre ' + x2(v) + ' veces los intereses.' }
      ]},
      { grupo: 'Rentabilidad', desc: 'Miden qué tan eficientemente la empresa convierte sus ventas y activos en utilidad.', items: [
        { nombre: 'Margen de utilidad bruta',
          formula: 'Utilidad bruta ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda después de descontar el costo de los bienes vendidos.',
          tipo: 'pct',
          f: c => div(c.R.utilidadBruta, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' quedan después del costo de ventas.' },
        { nombre: 'Margen de utilidad operativa',
          formula: 'UAII ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda después de todos los gastos operativos.',
          tipo: 'pct',
          f: c => div(c.R.uaii, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' quedan después de los gastos operativos.' },
        { nombre: 'Margen de utilidad neta',
          formula: 'Utilidad neta ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda como ganancia real después de impuestos e intereses.',
          tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' son utilidad neta.' },
        { nombre: 'Rendimiento sobre activos (ROA)',
          formula: 'Utilidad neta ÷ Activo total promedio',
          queEs: 'Cuánto rinde cada córdoba invertido en activos, independientemente de cómo se financia.',
          tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.promR('totalActivo')),
          txt: v => 'Cada C$ 100 invertidos en activos generan C$ ' + x2(v * 100) + ' de utilidad neta.' },
        { nombre: 'Rendimiento sobre patrimonio (ROE)',
          formula: 'Utilidad neta ÷ Patrimonio promedio',
          queEs: 'Cuánto rinde el dinero invertido por los propietarios.',
          tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.promR('patrimonio')),
          txt: v => 'Cada C$ 100 del patrimonio generan C$ ' + x2(v * 100) + ' de utilidad neta.' }
      ]}
    ];
  },

  dupont(d, r) {
    const R = r[1];
    const ventas = Number(d.er.ventas[1]) || 0;
    const actProm = (r[0].totalActivo + r[1].totalActivo) / 2;
    const patProm = (r[0].patrimonio + r[1].patrimonio) / 2;
    const margen       = ventas   ? R.utilidadNeta / ventas   : null;
    const rotacion     = actProm  ? ventas / actProm           : null;
    const multiplicador= patProm  ? actProm / patProm          : null;
    const roe          = (margen === null || rotacion === null || multiplicador === null) ? null : margen * rotacion * multiplicador;
    const roeDirecto   = patProm  ? R.utilidadNeta / patProm  : null;
    return { margen, rotacion, multiplicador, roe, roeDirecto };
  },

  tablaHorizontal(d, r) {
    const A = d.anios;
    const filas = (grupo, lista) => lista.map(f => {
      const a = Analisis.valor(d, r, grupo, f, 0), b = Analisis.valor(d, r, grupo, f, 1);
      const abs = b - a, rel = a !== 0 ? abs / Math.abs(a) : null;
      // Diferenciamos cero real de N/D
      const pctTxt = rel === null ? '<span class="nd-cero">N/D <span class="tip" title="El año base es cero, no se puede calcular variación porcentual.">?</span></span>'
                                  : Fmt.pct(rel);
      return '<tr class="' + (f[0][0] === '@' ? 'total' : '') + '"><td>' + f[1] + '</td><td>' + Fmt.moneda(a) +
        '</td><td>' + Fmt.moneda(b) + '</td><td>' + Fmt.moneda(abs) + '</td><td>' + pctTxt + '</td></tr>';
    }).join('');
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] + '</th><th>Variación C$</th><th>Variación %</th></tr>' +
      '<tr class="sub"><td colspan="5">Estado de Resultados</td></tr>' + filas('er', EST_FILAS_ER) +
      '<tr class="sub"><td colspan="5">Balance General</td></tr>' + filas('bg', EST_FILAS_BG) +
      '</table></div>' +
      '<p class="nota-pie">Variación % = (Año 2 − Año 1) ÷ |Año 1|. Si el año 1 es cero aparece N/D porque no se puede dividir entre cero; si el resultado fue exactamente 0 % se muestra 0.00 %.</p>';
  },

  tablaVertical(d, r) {
    const A = d.anios;
    const filas = (grupo, lista, claveBase) => lista.map(f => {
      const celdas = [0, 1].map(p => {
        const base = claveBase === 'ventas' ? Number(d.er.ventas[p]) || 0 : r[p].totalActivo;
        const v = Analisis.valor(d, r, grupo, f, p);
        return base ? Fmt.pct(v / base) : '<span class="nd-cero">N/D</span>';
      });
      return '<tr class="' + (f[0][0] === '@' ? 'total' : '') + '"><td>' + f[1] + '</td><td>' + celdas[0] + '</td><td>' + celdas[1] + '</td></tr>';
    }).join('');
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] + '</th></tr>' +
      '<tr class="sub"><td colspan="3">Estado de Resultados (% de las ventas)</td></tr>' + filas('er', EST_FILAS_ER, 'ventas') +
      '<tr class="sub"><td colspan="3">Balance General (% del activo total)</td></tr>' + filas('bg', EST_FILAS_BG, 'activo') +
      '</table></div>' +
      '<p class="nota-pie">Los porcentajes del ER se calculan sobre las ventas netas; los del Balance General sobre el total del activo.</p>';
  },

  // ── TABLA DE RAZONES mejorada: semáforo + tooltip "qué es" + recomendación
  tablaRazones(d, r) {
    const A = d.anios, c0 = Analisis.ctx(d, r, 0), c1 = Analisis.ctx(d, r, 1);
    const iconoSem = s => s === 'bien' ? '<span class="sem-bien" title="Dentro del rango saludable">●</span>'
                        : s === 'alerta' ? '<span class="sem-alerta" title="Requiere atención">●</span>'
                        : s === 'riesgo' ? '<span class="sem-riesgo" title="Indicador de riesgo">●</span>'
                        : '';
    let html = '';
    // Contador de alertas y riesgos para el resumen
    let totalAlerta = 0, totalRiesgo = 0;
    const filasTmp = [];
    Analisis.razones().forEach(g => {
      let bloque = '<tr class="sub"><td colspan="6">' + g.grupo;
      if (g.desc) bloque += ' <span class="grup-desc">— ' + g.desc + '</span>';
      bloque += '</td></tr>';
      g.items.forEach(it => {
        const v0 = it.f(c0), v1 = it.f(c1);
        const ok1 = v1 !== null && isFinite(v1);
        const sem = ok1 ? Analisis.semaforo(it.nombre, v1) : '';
        if (sem === 'alerta') totalAlerta++;
        if (sem === 'riesgo') totalRiesgo++;
        const rec = ok1 ? Analisis.recomendacion(it.nombre, v1) : null;
        // Diferencia N/D (sin datos) de cero real
        const fmtCelda = (v) => {
          if (v === null || !isFinite(v)) return '<span class="nd-cero" title="Sin datos suficientes para calcular">N/D</span>';
          const f = Analisis.fmtV(it.tipo, v);
          return f === 'N/D' ? '<span class="nd-cero" title="Sin datos suficientes para calcular">N/D</span>' : f;
        };
        bloque += '<tr>' +
          '<td><span class="raz-nombre">' + it.nombre + '</span>' +
          (it.queEs ? ' <span class="tip" title="' + it.queEs.replace(/"/g, '&quot;') + '">?</span>' : '') +
          '</td>' +
          '<td class="formula">' + it.formula + '</td>' +
          '<td>' + fmtCelda(v0) + '</td>' +
          '<td>' + fmtCelda(v1) + (sem ? ' ' + iconoSem(sem) : '') + '</td>' +
          '<td class="interp">' + (ok1 ? it.txt(v1) : '') + '</td>' +
          '<td class="rec">' + (rec ? '<span class="rec-txt">⚑ ' + rec + '</span>' : '') + '</td>' +
          '</tr>';
      });
      filasTmp.push(bloque);
    });
    // Resumen de semáforo al tope
    const resumen = (totalRiesgo > 0 || totalAlerta > 0)
      ? '<div class="sem-resumen ' + (totalRiesgo > 0 ? 'riesgo' : 'alerta') + '">' +
        (totalRiesgo > 0 ? '⚠ ' + totalRiesgo + ' indicador(es) en riesgo' : '') +
        (totalRiesgo > 0 && totalAlerta > 0 ? ' · ' : '') +
        (totalAlerta > 0 ? totalAlerta + ' indicador(es) requieren atención' : '') +
        '. Revisa las recomendaciones en la última columna.</div>'
      : '<div class="sem-resumen bien">✔ Todos los indicadores calculados se encuentran dentro de rangos saludables.</div>';
    html = resumen + '<div class="tabla-scroll"><table class="tabla-datos tabla-razones">' +
      '<tr><th>Razón</th><th>Fórmula</th><th>' + A[0] + '</th><th>' + A[1] + '</th><th>Interpretación (' + A[1] + ')</th><th>Recomendación</th></tr>' +
      filasTmp.join('') + '</table></div>' +
      '<p class="nota-pie">● Verde = saludable · ● Naranja = requiere atención · ● Rojo = indicador de riesgo. ' +
      'Las razones de actividad y rentabilidad usan saldos promedio, por eso el año base aparece N/D. ' +
      'N/D con fondo gris = sin datos suficientes; 0.00 = el resultado es efectivamente cero.</p>';
    return html;
  },

  htmlDupont(d, r) {
    const u = Analisis.dupont(d, r), A = d.anios;
    const tarj = (t, v, n) =>
      '<div class="tarjeta dp-tarj"><h3>' + t + '</h3>' +
      '<div class="valor dp-val">' + v + '</div>' +
      '<div class="nota dp-nota">' + n + '</div></div>';
    const ok = u.roe !== null && u.roeDirecto !== null && Math.abs(u.roe - u.roeDirecto) < 1e-9;
    return '<p class="aviso">ROE = Margen × Rotación × Multiplicador. Año analizado: ' + A[1] + '. Usa saldos promedio entre ' + A[0] + ' y ' + A[1] + '.</p>' +
      '<div class="cadena">' +
        tarj('Margen de utilidad neta',       Analisis.fmtV('pct',   u.margen),        'Utilidad neta ÷ Ventas') +
        '<span class="op">×</span>' +
        tarj('Rotación de activos totales',   Analisis.fmtV('veces', u.rotacion),      'Ventas ÷ Activo promedio') +
        '<span class="op">×</span>' +
        tarj('Multiplicador de capital',      Analisis.fmtV('veces', u.multiplicador), 'Activo promedio ÷ Patrimonio promedio') +
        '<span class="op">=</span>' +
        tarj('ROE',                           Analisis.fmtV('pct',   u.roe),           'Rendimiento sobre el patrimonio') +
      '</div>' +
      '<div class="cuadre ' + (ok ? 'ok' : 'mal') + '">' + (ok
        ? 'Comprobación OK: el ROE por DuPont (' + Fmt.pct(u.roe) + ') coincide con Utilidad neta ÷ Patrimonio promedio (' + Fmt.pct(u.roeDirecto) + ').'
        : 'No se puede comprobar el ROE (faltan datos).') + '</div>' +
      '<p class="nota-pie">El margen mide cuánta utilidad deja cada venta; la rotación mide qué tan bien se usan los activos para vender; el multiplicador mide cuánto se apoya la empresa en deuda (apalancamiento financiero). Un ROE alto con multiplicador alto puede esconder riesgo financiero.</p>';
  },

  limpiarGraficos() {
    Analisis.grafs.forEach(g => { try { g.destroy(); } catch (e) {} });
    Analisis.grafs = [];
  },

  dibujarGraficos(raiz, d, r) {
    Analisis.limpiarGraficos();
    if (typeof Chart === 'undefined') {
      raiz.querySelector('#sec-graficos').innerHTML = '<div class="aviso">No se encontró librerias/chart.umd.js.</div>';
      return;
    }
    const A = d.anios;
    const c0 = Analisis.ctx(d, r, 0), c1 = Analisis.ctx(d, r, 1);
    const div = (a, b) => (b ? a / b : null);

    // Gráfico 1: Resultados comparados
    const dat = p => [Number(d.er.ventas[p]) || 0, r[p].utilidadBruta, r[p].uaii, r[p].utilidadNeta];
    const millones = v => {
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + ' M';
      if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + ' k';
      return v;
    };
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-resultados'), {
      type: 'bar',
      data: {
        labels: ['Ventas', 'Util. bruta', 'UAII', 'Util. neta'],
        datasets: [
          { label: String(A[0]), data: dat(0), backgroundColor: '#9db4d0' },
          { label: String(A[1]), data: dat(1), backgroundColor: '#0f5c4d' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' C$ ' + Fmt.num(ctx.raw, 2) } } },
        scales: { y: { ticks: { callback: millones } } }
      }
    }));

    // Gráfico 2: Estructura de financiamiento
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-estructura'), {
      type: 'doughnut',
      data: {
        labels: ['Pasivo corriente', 'Pasivo L/P', 'Patrimonio'],
        datasets: [{ data: [r[1].pc, r[1].pnc, r[1].patrimonio], backgroundColor: ['#e06c5a', '#f0a500', '#0f5c4d'] }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' C$ ' + Fmt.num(ctx.raw, 2) } } }
      }
    }));

    // Gráfico 3: Razones de liquidez comparadas entre períodos
    const razLiq = [
      { label: 'Razón corriente', v0: div(r[0].ac, r[0].pc), v1: div(r[1].ac, r[1].pc) },
      { label: 'Prueba ácida',    v0: div(r[0].ac - (Number(d.bg.inventarios[0]) || 0), r[0].pc),
                                  v1: div(r[1].ac - (Number(d.bg.inventarios[1]) || 0), r[1].pc) }
    ];
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-liquidez'), {
      type: 'bar',
      data: {
        labels: razLiq.map(x => x.label),
        datasets: [
          { label: String(A[0]), data: razLiq.map(x => x.v0 || 0), backgroundColor: '#9db4d0' },
          { label: String(A[1]), data: razLiq.map(x => x.v1 || 0), backgroundColor: '#0f5c4d' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' ' + Fmt.num(ctx.raw, 2) + ' veces' } } },
        scales: { y: { beginAtZero: true } }
      }
    }));

    // Gráfico 4: Márgenes comparados
    const marg = p => [
      r[p].utilidadBruta   / (Number(d.er.ventas[p]) || 1),
      r[p].uaii            / (Number(d.er.ventas[p]) || 1),
      r[p].utilidadNeta    / (Number(d.er.ventas[p]) || 1)
    ];
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-margenes'), {
      type: 'bar',
      data: {
        labels: ['Margen bruto', 'Margen operativo', 'Margen neto'],
        datasets: [
          { label: String(A[0]), data: marg(0), backgroundColor: '#9db4d0' },
          { label: String(A[1]), data: marg(1), backgroundColor: '#0f5c4d' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' ' + Fmt.pct(ctx.raw) } } },
        scales: { y: { ticks: { callback: v => Fmt.pct(v) } } }
      }
    }));
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d);
    const tabs = [
      ['horizontal', 'Análisis horizontal'],
      ['vertical',   'Análisis vertical'],
      ['razones',    'Razones financieras'],
      ['dupont',     'Sistema DuPont'],
      ['graficos',   'Gráficos']
    ];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' +
        tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') +
      '</div>' +
      '<div class="tarjeta" id="sec-horizontal">'  + Analisis.tablaHorizontal(d, r) + '</div>' +
      '<div class="tarjeta" id="sec-vertical" style="display:none">'  + Analisis.tablaVertical(d, r)  + '</div>' +
      '<div class="tarjeta" id="sec-razones"  style="display:none">'  + Analisis.tablaRazones(d, r)   + '</div>' +
      '<div id="sec-dupont"  style="display:none">' + Analisis.htmlDupont(d, r) + '</div>' +
      '<div id="sec-graficos" style="display:none">' +
        '<div class="dos-col">' +
          '<div class="tarjeta"><h3>Resultados por año</h3><div class="grafico"><canvas id="g-resultados"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Estructura de financiamiento ' + d.anios[1] + '</h3><div class="grafico"><canvas id="g-estructura"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Liquidez comparada</h3><div class="grafico"><canvas id="g-liquidez"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Márgenes comparados</h3><div class="grafico"><canvas id="g-margenes"></canvas></div></div>' +
        '</div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => {
        const s = raiz.querySelector('#sec-' + t[0]);
        if (s) s.style.display = t[0] === b.dataset.tab ? '' : 'none';
      });
      if (b.dataset.tab === 'graficos') Analisis.dibujarGraficos(raiz, d, r);
    }));
  }
};

Modulos.analisis = {
  titulo: 'Análisis financiero',
  subtitulo: 'Análisis horizontal y vertical, razones financieras y sistema DuPont',
  render(el) { Analisis.render(el); }
};