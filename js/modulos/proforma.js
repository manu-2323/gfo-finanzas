// Módulo 7: Estados proforma y reporte integrado
const Proforma = {
  grafs: [],

  // ── Supuestos por defecto desde los estados históricos ───────────────────
  porDefecto() {
    const d = Estados.obtener(), r = Estados.calcular(d);
    const e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const pct = (x, y) => y ? Math.round(x / y * 10000) / 100 : 0;
    const un = r[1].utilidadNeta;
    const div = (Number(d.bg.utilidadesRetenidas[0]) || 0) + un - b('utilidadesRetenidas');
    return {
      crecimiento: 10, costoPct: pct(e('costoVentas'), e('ventas')),
      gVentaPct: pct(e('gastosVenta'), e('ventas')), gAdminPct: pct(e('gastosAdmin'), e('ventas')),
      depreciacion: e('depreciacion'), intereses: e('intereses'), isr: Number(d.isr) || 0,
      cxcPct: pct(b('cxc'), e('ventas')), invPct: pct(b('inventarios'), e('costoVentas')),
      cxpPct: pct(b('cxp'), e('costoVentas')), compraAF: e('depreciacion'),
      prestCPDelta: 0, prestLPDelta: 0,
      dividendosPct: un > 0 ? Math.max(0, Math.round(div / un * 100)) : 0
    };
  },
  obtener() { return Datos.leer('proforma', Proforma.porDefecto()); },

  // ── Cálculo de la proforma para un set de supuestos ──────────────────────
  calcular(d, r, s) {
    const e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const ventas        = e('ventas') * (1 + s.crecimiento / 100);
    const costoVentas   = ventas * s.costoPct / 100;
    const utilidadBruta = ventas - costoVentas;
    const gVenta = ventas * s.gVentaPct / 100, gAdmin = ventas * s.gAdminPct / 100;
    const uaii   = utilidadBruta - gVenta - gAdmin - s.depreciacion;
    const otros  = e('otrosIngresos');
    const uai    = uaii - s.intereses + otros;
    const impuesto = uai > 0 ? uai * s.isr / 100 : 0;
    const un       = uai - impuesto;
    const dividendos = un > 0 ? un * s.dividendosPct / 100 : 0;
    const cxc  = ventas      * s.cxcPct  / 100;
    const inv  = costoVentas * s.invPct  / 100;
    const cxp  = costoVentas * s.cxpPct  / 100;
    const ac   = b('efectivo') + cxc + inv + b('otrosAC');
    const af   = b('activosFijos') + s.compraAF - s.depreciacion;
    const totalActivo = ac + af + b('otrosANC');
    const prestCP = b('prestCP') + (s.prestCPDelta || 0);
    const prestLP = b('prestLP') + (s.prestLPDelta || 0);
    const pc  = cxp + prestCP + b('otrosPC');
    const ur  = b('utilidadesRetenidas') + un - dividendos;
    const patrimonio  = b('capital') + ur;
    const totalPasivo = pc + prestLP;
    const fer = totalActivo - (totalPasivo + patrimonio);
    return {
      ventas, costoVentas, utilidadBruta, gVenta, gAdmin, dep: s.depreciacion,
      uaii, intereses: s.intereses, otros, uai, impuesto, un, dividendos,
      efectivo: b('efectivo'), cxc, inv, otrosAC: b('otrosAC'), ac, af,
      otrosANC: b('otrosANC'), totalActivo, cxp, prestCP, otrosPC: b('otrosPC'), pc,
      prestLP, totalPasivo, capital: b('capital'), ur, patrimonio,
      totalPP: totalPasivo + patrimonio, fer
    };
  },

  // ── Escenarios optimista / base / pesimista ──────────────────────────────
  escenarios(d, r, s) {
    const adj = (s, dCrecimientos) => {
      const s2 = { ...s, crecimiento: s.crecimiento + dCrecimientos };
      return Proforma.calcular(d, r, s2);
    };
    return {
      pesimista: adj(s, -5),
      base:      Proforma.calcular(d, r, s),
      optimista: adj(s, +5)
    };
  },

  // ── Tabla proforma con comparación histórico vs proyectado ───────────────
  tablaProforma(d, r, p) {
    const a = r[1], A = d.anios[1], e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const var_ = (hist, proy) => {
      if (!hist) return '—';
      const v = (proy - hist) / Math.abs(hist);
      const cls = v > 0 ? 'pf-var-bien' : v < 0 ? 'pf-var-mal' : '';
      return '<span class="' + cls + '">' + Fmt.pct(v) + '</span>';
    };
    const f = (n, x, y, cls) =>
      '<tr class="' + (cls || '') + '"><td>' + n + '</td>' +
      '<td>' + Fmt.moneda(x) + '</td>' +
      '<td>' + Fmt.moneda(y) + '</td>' +
      '<td>' + var_(x, y) + '</td></tr>';
    const sub = t => '<tr class="sub"><td colspan="4">' + t + '</td></tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Concepto</th><th>Histórico ' + A + '</th><th>Proforma ' + (A + 1) + '</th><th>Variación</th></tr>' +
      sub('Estado de Resultados proforma') +
      f('Ventas', e('ventas'), p.ventas) +
      f('(−) Costo de ventas', e('costoVentas'), p.costoVentas) +
      f('Utilidad bruta', a.utilidadBruta, p.utilidadBruta, 'total') +
      f('(−) Gastos de venta', e('gastosVenta'), p.gVenta) +
      f('(−) Gastos de administración', e('gastosAdmin'), p.gAdmin) +
      f('(−) Depreciación', e('depreciacion'), p.dep) +
      f('Utilidad operativa (UAII)', a.uaii, p.uaii, 'total') +
      f('(−) Intereses', e('intereses'), p.intereses) +
      f('(+) Otros ingresos netos', e('otrosIngresos'), p.otros) +
      f('Utilidad antes de impuestos', a.uai, p.uai) +
      f('(−) Impuesto', a.impuesto, p.impuesto) +
      f('Utilidad neta', a.utilidadNeta, p.un, 'total') +
      sub('Balance General proforma') +
      f('Efectivo', b('efectivo'), p.efectivo) +
      f('Cuentas por cobrar', b('cxc'), p.cxc) +
      f('Inventarios', b('inventarios'), p.inv) +
      f('Otros activos corrientes', b('otrosAC'), p.otrosAC) +
      f('Total activo corriente', a.ac, p.ac, 'total') +
      f('Activos fijos netos', b('activosFijos'), p.af) +
      f('Otros activos no corrientes', b('otrosANC'), p.otrosANC) +
      f('TOTAL ACTIVO', a.totalActivo, p.totalActivo, 'total') +
      f('Cuentas por pagar', b('cxp'), p.cxp) +
      f('Préstamos a corto plazo', b('prestCP'), p.prestCP) +
      f('Otros pasivos corrientes', b('otrosPC'), p.otrosPC) +
      f('Total pasivo corriente', a.pc, p.pc, 'total') +
      f('Préstamos a largo plazo', b('prestLP'), p.prestLP) +
      f('TOTAL PASIVO', a.totalPasivo, p.totalPasivo, 'total') +
      f('Capital social', b('capital'), p.capital) +
      f('Utilidades retenidas', b('utilidadesRetenidas'), p.ur) +
      f('TOTAL PATRIMONIO', a.patrimonio, p.patrimonio, 'total') +
      f('TOTAL PASIVO + PATRIMONIO', a.totalPP, p.totalPP, 'total') +
      '</table></div>';
  },

  // ── Tabla de los 3 escenarios ────────────────────────────────────────────
  tablaEscenarios(d, esc, s) {
    const A = d.anios[1];
    const f = (nom, fn, cls) =>
      '<tr class="' + (cls || '') + '"><td>' + nom + '</td>' +
      '<td>' + fn(esc.pesimista) + '</td>' +
      '<td>' + fn(esc.base) + '</td>' +
      '<td>' + fn(esc.optimista) + '</td></tr>';
    const crecPes = s.crecimiento - 5, crecOpt = s.crecimiento + 5;
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Concepto</th>' +
        '<th>Pesimista<br><small>Crec. ' + Fmt.num(crecPes, 1) + ' %</small></th>' +
        '<th>Base<br><small>Crec. ' + Fmt.num(s.crecimiento, 1) + ' %</small></th>' +
        '<th>Optimista<br><small>Crec. ' + Fmt.num(crecOpt, 1) + ' %</small></th>' +
      '</tr>' +
      f('Ventas proyectadas',         p => Fmt.moneda(p.ventas)) +
      f('Costo de ventas',            p => Fmt.moneda(p.costoVentas)) +
      f('Utilidad bruta',             p => Fmt.moneda(p.utilidadBruta), 'total') +
      f('Utilidad operativa (UAII)',  p => Fmt.moneda(p.uaii), 'total') +
      f('Utilidad neta',              p => Fmt.moneda(p.un), 'total') +
      f('Total activo',               p => Fmt.moneda(p.totalActivo)) +
      f('Total pasivo',               p => Fmt.moneda(p.totalPasivo)) +
      f('Patrimonio',                 p => Fmt.moneda(p.patrimonio)) +
      f('FER (financiamiento ext.)',  p => {
        const cls2 = p.fer > 0.5 ? 'pf-var-mal' : 'pf-var-bien';
        return '<span class="' + cls2 + '">' + Fmt.moneda(p.fer) + '</span>';
      }) +
      '</table></div>' +
      '<p class="nota-pie">Escenario pesimista = crecimiento − 5 pp · Base = supuesto ingresado · Optimista = crecimiento + 5 pp. Todos los demás supuestos se mantienen iguales.</p>';
  },

  // ── Explicación de cambios en cuentas principales ────────────────────────
  htmlCambios(d, r, p) {
    const A = d.anios[1], e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const linea = (cuenta, hist, proy, razon) => {
      if (Math.abs(proy - hist) < 1) return '';
      const sube = proy > hist;
      return '<li><strong>' + cuenta + '</strong>: ' + Fmt.moneda(hist) + ' → ' + Fmt.moneda(proy) +
        ' <span class="' + (sube ? 'pf-var-bien' : 'pf-var-mal') + '">(' + (sube ? '▲' : '▼') + ' ' + Fmt.pct(Math.abs((proy - hist) / Math.abs(hist || 1))) + ')</span>. ' +
        razon + '</li>';
    };
    const lines = [
      linea('Ventas', e('ventas'), p.ventas, 'Proyectadas con la tasa de crecimiento supuesta.'),
      linea('Costo de ventas', e('costoVentas'), p.costoVentas, 'Se mantiene como porcentaje fijo de las ventas proyectadas.'),
      linea('UAII', r[1].uaii, p.uaii, 'Refleja el efecto combinado de más ventas y los gastos operativos proyectados.'),
      linea('Utilidad neta', r[1].utilidadNeta, p.un, 'Después de intereses, impuestos y otros ingresos.'),
      linea('Cuentas por cobrar', b('cxc'), p.cxc, 'Proyectadas como porcentaje de las ventas (razón de actividad).'),
      linea('Inventarios', b('inventarios'), p.inv, 'Proyectados como porcentaje del costo de ventas.'),
      linea('Cuentas por pagar', b('cxp'), p.cxp, 'Proyectadas como porcentaje del costo de ventas.'),
      linea('Activos fijos netos', b('activosFijos'), p.af, 'Activos del año base + compras supuestas − depreciación.'),
      linea('Utilidades retenidas', b('utilidadesRetenidas'), p.ur, 'Año base + utilidad neta − dividendos pagados.')
    ].filter(Boolean);
    if (!lines.length) return '';
    return '<details class="pf-detalle"><summary>Explicación de los principales cambios en las cuentas proyectadas</summary>' +
      '<ul class="pf-cambios">' + lines.join('') + '</ul>' +
      '</details>';
  },

  // ── Explicación del FER ──────────────────────────────────────────────────
  htmlFER(p, A) {
    const esFer = p.fer > 0.5;
    return '<div class="pf-aviso ' + (esFer ? 'riesgo' : 'bien') + '">' +
      (esFer
        ? '<strong>⚠ Financiamiento externo requerido (FER): ' + Fmt.moneda(p.fer) + '</strong><br>' +
          'El total de activos proyectado (' + Fmt.moneda(p.totalActivo) + ') supera la suma de pasivos + patrimonio proyectados (' + Fmt.moneda(p.totalPP) + '). ' +
          'La diferencia (' + Fmt.moneda(p.fer) + ') representa los fondos que la empresa deberá conseguir externamente: ' +
          'nueva deuda, aportación de capital o reducción de activos. ' +
          'Sin ese financiamiento el Balance General no cierra y el plan de crecimiento no es sostenible.<br>' +
          '<small>Opciones: aumentar préstamos a corto o largo plazo en los supuestos, reducir la tasa de crecimiento, o mejorar la gestión de cobros e inventarios para liberar efectivo.</small>'
        : '<strong>✔ No se requiere financiamiento externo.</strong> ' +
          'Los pasivos y el patrimonio proyectados cubren los activos. ' +
          'Excedente de fondos: ' + Fmt.moneda(-p.fer) + '. Este excedente puede destinarse a pagar deuda, hacer inversiones adicionales o repartir dividendos.')
      + '</div>';
  },

  // ── Verificación de que el Balance cuadra ───────────────────────────────
  htmlCuadre(p) {
    const diff = Math.abs(p.totalActivo - p.totalPP);
    const cuadra = diff < 0.5 || Math.abs(p.fer) > 0.5;
    // Con FER, el BG no cuadra hasta ajustar la deuda, eso es intencional (método crítico)
    return '<div class="cuadre ' + (Math.abs(p.fer) > 0.5 ? 'mal' : 'ok') + '" style="margin-top:8px">' +
      (Math.abs(p.fer) > 0.5
        ? 'El Balance General proyectado no cuadra por diseño del método crítico: la diferencia de ' + Fmt.moneda(p.fer) + ' es el FER. Para que cuadre, ajusta los préstamos en los supuestos avanzados.'
        : 'Balance General proyectado cuadrado: Activo = Pasivo + Patrimonio = ' + Fmt.moneda(p.totalActivo) + '.') +
      '</div>';
  },

  // ── Conclusiones automáticas de la proforma ──────────────────────────────
  htmlConclusiones(d, r, p, s) {
    const A = d.anios[1];
    const concs = [];
    const margenBase = r[1].utilidadNeta / (Number(d.er.ventas[1]) || 1);
    const margenProy = p.un / (p.ventas || 1);
    if (p.un > r[1].utilidadNeta)
      concs.push({ t: 'bien', m: 'La utilidad neta proyectada (' + Fmt.moneda(p.un) + ') supera a la del año base (' + Fmt.moneda(r[1].utilidadNeta) + '). El margen neto pasa de ' + Fmt.pct(margenBase) + ' a ' + Fmt.pct(margenProy) + '.' });
    else
      concs.push({ t: 'riesgo', m: 'La utilidad neta proyectada (' + Fmt.moneda(p.un) + ') es menor a la del año base. Revisa los supuestos de costos y gastos.' });
    if (p.fer > 0.5)
      concs.push({ t: 'alerta', m: 'La empresa necesitará conseguir ' + Fmt.moneda(p.fer) + ' de financiamiento externo para sostener el crecimiento proyectado. Sin esos fondos, el plan no es factible.' });
    else
      concs.push({ t: 'bien', m: 'El plan no requiere financiamiento externo adicional con los supuestos actuales.' });
    const endeudProy = p.totalActivo ? p.totalPasivo / p.totalActivo : NaN;
    const endeudBase = r[1].totalActivo ? r[1].totalPasivo / r[1].totalActivo : NaN;
    if (isFinite(endeudProy) && isFinite(endeudBase)) {
      if (endeudProy > endeudBase + 0.05)
        concs.push({ t: 'alerta', m: 'El nivel de endeudamiento proyectado (' + Fmt.pct(endeudProy) + ') sube respecto al año base (' + Fmt.pct(endeudBase) + '). El riesgo financiero aumenta.' });
      else if (endeudProy < endeudBase - 0.02)
        concs.push({ t: 'bien', m: 'El nivel de endeudamiento proyectado (' + Fmt.pct(endeudProy) + ') mejora respecto al año base (' + Fmt.pct(endeudBase) + ').' });
    }
    if (p.af < r[1].totalActivo * 0.1 && s.compraAF < s.depreciacion)
      concs.push({ t: 'alerta', m: 'Los activos fijos proyectados disminuyen porque la compra supuesta (' + Fmt.moneda(s.compraAF) + ') no cubre la depreciación (' + Fmt.moneda(s.depreciacion) + '). La capacidad productiva se deterioraría.' });
    if (p.cxc > p.cxp * 2)
      concs.push({ t: 'alerta', m: 'Las cuentas por cobrar proyectadas (' + Fmt.moneda(p.cxc) + ') duplican las cuentas por pagar (' + Fmt.moneda(p.cxp) + '). La empresa financia más a sus clientes de lo que recibe financiamiento de proveedores.' });

    return '<div class="pf-conclusiones">' +
      '<h3>Conclusiones automáticas de la proyección</h3>' +
      concs.map(c =>
        '<div class="pf-aviso ' + c.t + '">' +
        (c.t === 'bien' ? '✔ ' : c.t === 'alerta' ? '⚠ ' : '⛔ ') + c.m + '</div>'
      ).join('') +
      '</div>';
  },

  campo(id, et, v) {
    return '<label class="campo corto" style="flex:1;min-width:150px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + (v ?? '') + '"></label>';
  },

  // ── Reporte integrado ────────────────────────────────────────────────────
  reporte(d, r, p) {
    const C = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
    const a = r[1], A = d.anios[1], lectura = [], alertas = [];
    const corr = a.pc ? a.ac / a.pc : NaN;
    const endeu = a.totalActivo ? a.totalPasivo / a.totalActivo : NaN;
    const dup = Analisis.dupont(d, r);

    let tarjetas =
      C('Utilidad neta ' + A,  Fmt.moneda(a.utilidadNeta), 'Proforma ' + (A + 1) + ': ' + Fmt.moneda(p.un)) +
      C('Razón corriente',     Fmt.veces(corr),            'Liquidez ' + A) +
      C('Endeudamiento',       Fmt.pct(endeu),             'Pasivo total ÷ Activo total') +
      C('ROE (DuPont)',         Fmt.pct(dup.roe),           'Rentabilidad sobre el patrimonio');

    // Liquidez
    if (corr >= 1.5) lectura.push('✔ Liquidez sólida: razón corriente de ' + Fmt.num(corr, 2) + '.');
    else if (corr >= 1) { lectura.push('⚠ Liquidez ajustada: razón corriente de ' + Fmt.num(corr, 2) + '.'); alertas.push('Liquidez por debajo del nivel recomendado (1.5).'); }
    else { lectura.push('⛔ Liquidez crítica: razón corriente de ' + Fmt.num(corr, 2) + ' (menor a 1).'); alertas.push('Riesgo de no poder pagar obligaciones a corto plazo.'); }

    // Endeudamiento
    if (endeu > 0.6) { lectura.push('⚠ Endeudamiento alto: ' + Fmt.pct(endeu) + ' de los activos financiados con deuda.'); alertas.push('Nivel de deuda elevado; evalúa capitalización.'); }
    else lectura.push('✔ Endeudamiento manejable: ' + Fmt.pct(endeu) + '.');

    // Punto de equilibrio
    if (typeof Equilibrio !== 'undefined') {
      const q = Equilibrio.obtener(), b2 = Equilibrio.calcular({ precio: q.precio, cv: q.cv, cf: q.cf, unidades: q.unidades }, q.meta);
      tarjetas += C('Punto de equilibrio', isFinite(b2.peU) ? Fmt.num(b2.peU, 2) + ' u' : 'N/D', 'Margen de seguridad ' + (isFinite(b2.ms) ? Fmt.pct(b2.ms) : 'N/D'));
      if (isFinite(b2.ms)) {
        if (b2.ms >= 0.3) lectura.push('✔ Punto de equilibrio: margen de seguridad del ' + Fmt.pct(b2.ms) + '.');
        else { lectura.push('⚠ Punto de equilibrio: margen de seguridad bajo (' + Fmt.pct(b2.ms) + ').'); alertas.push('Ventas cercanas al punto de equilibrio; alto riesgo operativo.'); }
      }
    }

    // Apalancamiento
    if (typeof Apalancamiento !== 'undefined') {
      const q = Apalancamiento.obtener(), g = Apalancamiento.periodo(q, q.u1);
      tarjetas += C('Apalancamiento total (GAT)', isFinite(g.gat) ? Fmt.num(g.gat, 2) : 'N/D', 'GAO ' + (isFinite(g.gao) ? Fmt.num(g.gao, 2) : 'N/D') + ' × GAF ' + (isFinite(g.gaf) ? Fmt.num(g.gaf, 2) : 'N/D'));
      if (isFinite(g.gat)) {
        if (Math.abs(g.gat) >= 5) alertas.push('GAT elevado (' + Fmt.num(g.gat, 2) + '): las variaciones en ventas se amplifican fuertemente en la UPA.');
        lectura.push((Math.abs(g.gat) >= 5 ? '⚠' : '✔') + ' Apalancamiento: 1 % en ventas → ' + Fmt.num(Math.abs(g.gat), 2) + ' % en UPA.');
      }
    }

    // Flujo
    if (typeof Flujo !== 'undefined') {
      const f = Flujo.indirecto(d, r);
      tarjetas += C('Flujo de operación ' + A, Fmt.moneda(f.flOp), 'Variación neta: ' + Fmt.moneda(f.neta));
      if (f.flOp >= 0) lectura.push('✔ Flujo operativo positivo: ' + Fmt.moneda(f.flOp) + '.');
      else { lectura.push('⛔ Flujo operativo negativo: ' + Fmt.moneda(f.flOp) + '.'); alertas.push('La operación consume efectivo; prioriza mejorar cobros e inventarios.'); }
    }

    // Presupuesto de caja
    if (typeof Presupuestos !== 'undefined') {
      try {
        const q = Presupuestos.obtener(), ca = Presupuestos.caja(q, Presupuestos.operativo(q)), ult = ca[2];
        const falta = ca.some(c => c.financiar > 0);
        tarjetas += C('Saldo de caja proyectado', Fmt.moneda(ult.final), 'Último mes del presupuesto');
        if (falta) { lectura.push('⚠ Presupuesto de caja: en algún mes el saldo baja del mínimo.'); alertas.push('Revisar cronograma de pagos y cobros.'); }
        else lectura.push('✔ Presupuesto de caja: saldo sobre el mínimo en los tres meses.');
      } catch (err) {}
    }

    // FER proforma
    tarjetas += C('Financiamiento externo ' + (A + 1), Fmt.moneda(p.fer), p.fer > 0 ? 'Fondos que faltan según la proforma' : 'Excedente proyectado');
    if (p.fer > 0) alertas.push('Proforma: se necesitan ' + Fmt.moneda(p.fer) + ' adicionales para sostener el crecimiento.');
    else lectura.push('✔ Proforma: no se requiere financiamiento externo.');

    // Bloque de alertas resumen
    const bloqueAlertas = alertas.length
      ? '<div class="pf-aviso riesgo" style="margin-bottom:12px"><strong>⚠ Aspectos a atender:</strong><ul style="margin:6px 0 0 1rem">' +
        alertas.map(a2 => '<li>' + a2 + '</li>').join('') + '</ul></div>'
      : '<div class="pf-aviso bien" style="margin-bottom:12px">✔ No se identificaron alertas críticas con los datos actuales.</div>';

    return bloqueAlertas +
      '<div class="rejilla">' + tarjetas + '</div>' +
      '<h2 class="titulo-seccion">Lectura para decisiones</h2>' +
      '<div class="aviso"><ul style="padding-left:18px;line-height:1.9">' +
      lectura.map(t => '<li>' + t + '</li>').join('') + '</ul></div>';
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d), s = Proforma.obtener();
    const C = Proforma.campo;
    const A = d.anios[1];
    const tabs = [
      ['proforma',   'Estados proforma'],
      ['escenarios', 'Escenarios'],
      ['reporte',    'Reporte integrado']
    ];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' +
        tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') +
      '</div>' +

      /* ── Pestaña Proforma ── */
      '<div id="sec-proforma">' +
        '<div class="aviso">Proyección del año ' + (A + 1) + ' a partir de los Estados financieros de ' + A + '. ' +
          'Método crítico: el efectivo se mantiene y la diferencia entre activos y (pasivos + patrimonio) es el Financiamiento Externo Requerido (FER).</div>' +
        '<h2 class="titulo-seccion">Supuestos principales</h2>' +
        '<div class="barra-acciones">' +
          C('pf-crec',  'Crecimiento de ventas (%)', s.crecimiento) +
          C('pf-costo', 'Costo de ventas (% de ventas)', s.costoPct) +
          C('pf-gv',    'Gastos de venta (% de ventas)', s.gVentaPct) +
          C('pf-ga',    'Gastos de administración (% de ventas)', s.gAdminPct) +
        '</div>' +
        '<div class="barra-acciones">' +
          C('pf-dep', 'Depreciación (C$)', s.depreciacion) +
          C('pf-int', 'Intereses (C$)', s.intereses) +
          C('pf-isr', 'Impuesto (%)', s.isr) +
          C('pf-div', 'Dividendos (% utilidad neta)', s.dividendosPct) +
        '</div>' +
        '<details class="pf-detalle" style="margin-bottom:12px"><summary>Supuestos avanzados (Balance General)</summary>' +
          '<div class="barra-acciones" style="margin-top:8px">' +
            C('pf-cxc', 'Cuentas por cobrar (% de ventas)', s.cxcPct) +
            C('pf-inv', 'Inventarios (% del costo de ventas)', s.invPct) +
            C('pf-cxp', 'Cuentas por pagar (% del costo de ventas)', s.cxpPct) +
            C('pf-af',  'Compra de activos fijos (C$)', s.compraAF) +
          '</div>' +
          '<div class="barra-acciones">' +
            C('pf-pcp', 'Cambio en préstamos C/P (C$, negativo = pago)', s.prestCPDelta) +
            C('pf-plp', 'Cambio en préstamos L/P (C$, negativo = pago)', s.prestLPDelta) +
          '</div>' +
        '</details>' +
        '<div class="barra-acciones">' +
          '<button class="btn sec" id="pf-reset">Restablecer desde los estados</button>' +
        '</div>' +
        '<div class="tarjeta" id="pf-tabla"></div>' +
        '<div id="pf-fer"></div>' +
        '<div id="pf-cuadre"></div>' +
        '<div id="pf-cambios" style="margin-top:10px"></div>' +
        '<div id="pf-conclusiones" style="margin-top:10px"></div>' +
      '</div>' +

      /* ── Pestaña Escenarios ── */
      '<div id="sec-escenarios" style="display:none">' +
        '<div class="aviso">Comparación automática de tres escenarios: pesimista (crecimiento − 5 pp), base y optimista (crecimiento + 5 pp). Los demás supuestos son los mismos.</div>' +
        '<div class="tarjeta" id="pf-esc-tabla"></div>' +
      '</div>' +

      /* ── Pestaña Reporte ── */
      '<div id="sec-reporte" style="display:none"></div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    const q = id => raiz.querySelector(id), n = id => Fmt.aNum(q(id).value);
    const leer = () => ({
      crecimiento: n('#pf-crec'), costoPct: n('#pf-costo'),
      gVentaPct:   n('#pf-gv'),  gAdminPct: n('#pf-ga'),
      depreciacion: n('#pf-dep'), intereses: n('#pf-int'),
      isr: n('#pf-isr'), dividendosPct: n('#pf-div'),
      cxcPct: n('#pf-cxc'), invPct: n('#pf-inv'),
      cxpPct: n('#pf-cxp'), compraAF: n('#pf-af'),
      prestCPDelta: n('#pf-pcp'), prestLPDelta: n('#pf-plp')
    });

    const refrescar = () => {
      const x = leer();
      Datos.guardar('proforma', x);
      const p   = Proforma.calcular(d, r, x);
      const esc = Proforma.escenarios(d, r, x);

      q('#pf-tabla').innerHTML       = Proforma.tablaProforma(d, r, p);
      q('#pf-fer').innerHTML         = Proforma.htmlFER(p, A);
      q('#pf-cuadre').innerHTML      = Proforma.htmlCuadre(p);
      q('#pf-cambios').innerHTML     = Proforma.htmlCambios(d, r, p);
      q('#pf-conclusiones').innerHTML = Proforma.htmlConclusiones(d, r, p, x);
      q('#pf-esc-tabla').innerHTML   = Proforma.tablaEscenarios(d, esc, x);
      q('#sec-reporte').innerHTML    = Proforma.reporte(d, r, p);
    };

    raiz.addEventListener('input', refrescar);
    q('#pf-reset').addEventListener('click', () => {
      Datos.guardar('proforma', Proforma.porDefecto());
      Proforma.render(el); Validar.activar(el);
    });
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => { q('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
    }));
    refrescar();
  }
};

Modulos.proforma = {
  titulo: 'Proforma y reporte',
  subtitulo: 'Estados proforma, escenarios y resumen integrado para apoyar decisiones',
  render(el) { Proforma.render(el); }
};