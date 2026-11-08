// Módulo 7: Estados proforma y reporte integrado (usa los datos de los demás módulos)
const Proforma = {
  grafs: [],

  // Supuestos por defecto: salen de las razones del último año de los Estados financieros
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
      cxcPct: pct(b('cxc'), e('ventas')), invPct: pct(b('inventarios'), e('costoVentas')), cxpPct: pct(b('cxp'), e('costoVentas')),
      compraAF: e('depreciacion'), dividendosPct: un > 0 ? Math.max(0, Math.round(div / un * 100)) : 0
    };
  },
  obtener() { return Datos.leer('proforma', Proforma.porDefecto()); },

  // Aquí se hacen los cálculos de la proforma (método crítico: el efectivo se mantiene y la diferencia es el financiamiento externo requerido)
  calcular(d, r, s) {
    const e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const ventas = e('ventas') * (1 + s.crecimiento / 100);
    const costoVentas = ventas * s.costoPct / 100;
    const utilidadBruta = ventas - costoVentas;
    const gVenta = ventas * s.gVentaPct / 100, gAdmin = ventas * s.gAdminPct / 100;
    const uaii = utilidadBruta - gVenta - gAdmin - s.depreciacion;
    const otros = e('otrosIngresos');
    const uai = uaii - s.intereses + otros;
    const impuesto = uai > 0 ? uai * s.isr / 100 : 0;
    const un = uai - impuesto;
    const dividendos = un > 0 ? un * s.dividendosPct / 100 : 0;
    const cxc = ventas * s.cxcPct / 100, inv = costoVentas * s.invPct / 100, cxp = costoVentas * s.cxpPct / 100;
    const ac = b('efectivo') + cxc + inv + b('otrosAC');
    const af = b('activosFijos') + s.compraAF - s.depreciacion;
    const totalActivo = ac + af + b('otrosANC');
    const pc = cxp + b('prestCP') + b('otrosPC');
    const ur = b('utilidadesRetenidas') + un - dividendos;
    const patrimonio = b('capital') + ur;
    const totalPasivo = pc + b('prestLP');
    const fer = totalActivo - (totalPasivo + patrimonio);   // financiamiento externo requerido (+) o excedente (−)
    return { ventas, costoVentas, utilidadBruta, gVenta, gAdmin, dep: s.depreciacion, uaii, intereses: s.intereses, otros, uai, impuesto, un,
      dividendos, efectivo: b('efectivo'), cxc, inv, otrosAC: b('otrosAC'), ac, af, otrosANC: b('otrosANC'), totalActivo,
      cxp, prestCP: b('prestCP'), otrosPC: b('otrosPC'), pc, prestLP: b('prestLP'), totalPasivo, capital: b('capital'), ur, patrimonio,
      totalPP: totalPasivo + patrimonio, fer };
  },

  tablaProforma(d, r, p) {
    const a = r[1], A = d.anios[1], e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    const f = (n, x, y, cls) => '<tr class="' + (cls || '') + '"><td>' + n + '</td><td>' + Fmt.moneda(x) + '</td><td>' + Fmt.moneda(y) + '</td></tr>';
    const sub = t => '<tr class="sub"><td colspan="3">' + t + '</td></tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>Año base ' + A + '</th><th>Proforma ' + (A + 1) + '</th></tr>' +
      sub('Estado de Resultados proforma') +
      f('Ventas', e('ventas'), p.ventas) + f('(−) Costo de ventas', e('costoVentas'), p.costoVentas) +
      f('Utilidad bruta', a.utilidadBruta, p.utilidadBruta, 'total') +
      f('(−) Gastos de venta', e('gastosVenta'), p.gVenta) + f('(−) Gastos de administración', e('gastosAdmin'), p.gAdmin) +
      f('(−) Depreciación', e('depreciacion'), p.dep) + f('Utilidad operativa (UAII)', a.uaii, p.uaii, 'total') +
      f('(−) Intereses', e('intereses'), p.intereses) + f('(+) Otros ingresos netos', e('otrosIngresos'), p.otros) +
      f('Utilidad antes de impuestos', a.uai, p.uai) + f('(−) Impuesto', a.impuesto, p.impuesto) +
      f('Utilidad neta', a.utilidadNeta, p.un, 'total') +
      sub('Balance General proforma') +
      f('Efectivo (se mantiene)', b('efectivo'), p.efectivo) + f('Cuentas por cobrar', b('cxc'), p.cxc) +
      f('Inventarios', b('inventarios'), p.inv) + f('Otros activos corrientes', b('otrosAC'), p.otrosAC) +
      f('Total activo corriente', a.ac, p.ac, 'total') + f('Activos fijos netos', b('activosFijos'), p.af) +
      f('Otros activos no corrientes', b('otrosANC'), p.otrosANC) + f('TOTAL ACTIVO', a.totalActivo, p.totalActivo, 'total') +
      f('Cuentas por pagar', b('cxp'), p.cxp) + f('Préstamos a corto plazo', b('prestCP'), p.prestCP) +
      f('Otros pasivos corrientes', b('otrosPC'), p.otrosPC) + f('Total pasivo corriente', a.pc, p.pc, 'total') +
      f('Préstamos a largo plazo', b('prestLP'), p.prestLP) + f('TOTAL PASIVO', a.totalPasivo, p.totalPasivo, 'total') +
      f('Capital social', b('capital'), p.capital) + f('Utilidades retenidas', b('utilidadesRetenidas'), p.ur) +
      f('TOTAL PATRIMONIO', a.patrimonio, p.patrimonio, 'total') + f('TOTAL PASIVO + PATRIMONIO', a.totalPP, p.totalPP, 'total') +
      '</table></div>';
  },

  campo(id, et, v) {
    return '<label class="campo corto" style="flex:1;min-width:150px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + v + '"></label>';
  },

  // Reporte integrado: junta los resultados de todos los módulos
  reporte(d, r, p) {
    const C = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
    const a = r[1], A = d.anios[1], lectura = [];
    const corr = a.pc ? a.ac / a.pc : NaN, endeu = a.totalActivo ? a.totalPasivo / a.totalActivo : NaN;
    const dup = Analisis.dupont(d, r);
    let tarjetas = C('Utilidad neta ' + A, Fmt.moneda(a.utilidadNeta), 'Proforma ' + (A + 1) + ': ' + Fmt.moneda(p.un)) +
      C('Razón corriente', Fmt.veces(corr), 'Liquidez ' + A) + C('Endeudamiento', Fmt.pct(endeu), 'Pasivo total ÷ Activo total') +
      C('ROE (DuPont)', Fmt.pct(dup.roe), 'Rentabilidad sobre el patrimonio');
    lectura.push(corr >= 1.5 ? 'Liquidez: con razón corriente de ' + Fmt.num(corr, 2) + ' la empresa cubre sus deudas a corto plazo con holgura.'
      : corr >= 1 ? 'Liquidez: la razón corriente de ' + Fmt.num(corr, 2) + ' cubre las deudas de corto plazo, pero con poco margen.'
      : 'Liquidez: la razón corriente de ' + Fmt.num(corr, 2) + ' es menor que 1; hay riesgo para pagar a corto plazo.');
    lectura.push(endeu > 0.6 ? 'Endeudamiento: ' + Fmt.pct(endeu) + ' de los activos se financia con deuda, un nivel alto.'
      : 'Endeudamiento: ' + Fmt.pct(endeu) + ' de los activos se financia con deuda, un nivel manejable.');
    if (typeof Equilibrio !== 'undefined') {
      const q = Equilibrio.obtener(), b = Equilibrio.calcular({ precio: q.precio, cv: q.cv, cf: q.cf, unidades: q.unidades }, q.meta);
      tarjetas += C('Punto de equilibrio', Fmt.num(b.peU, 2) + ' u', 'Margen de seguridad ' + Fmt.pct(b.ms));
      lectura.push(b.ms >= 0.2 ? 'Punto de equilibrio: las ventas están ' + Fmt.pct(b.ms) + ' por encima del equilibrio; hay margen de seguridad.'
        : 'Punto de equilibrio: el margen de seguridad es de ' + Fmt.pct(b.ms) + '; una caída pequeña de ventas llevaría a pérdida.');
    }
    if (typeof Apalancamiento !== 'undefined') {
      const q = Apalancamiento.obtener(), g = Apalancamiento.periodo(q, q.u1);
      tarjetas += C('Apalancamiento total (GAT)', Fmt.num(g.gat, 2), 'GAO ' + Fmt.num(g.gao, 2) + ' × GAF ' + Fmt.num(g.gaf, 2));
      lectura.push('Apalancamiento: un cambio de 1 % en ventas cambia la utilidad por acción en ' + Fmt.num(g.gat, 2) + ' %; sube las ganancias en buenos tiempos y también las pérdidas en malos.');
    }
    if (typeof Flujo !== 'undefined') {
      const f = Flujo.indirecto(d, r);
      tarjetas += C('Flujo de operación ' + A, Fmt.moneda(f.flOp), 'Variación neta de efectivo: ' + Fmt.moneda(f.neta));
      lectura.push(f.flOp >= 0 ? 'Flujo de efectivo: el negocio genera ' + Fmt.moneda(f.flOp) + ' con su operación, lo que respalda inversiones y pago de deuda.'
        : 'Flujo de efectivo: la operación consume efectivo; hay que revisar cobros, inventarios y gastos.');
    }
    if (typeof Presupuestos !== 'undefined') {
      const q = Presupuestos.obtener(), ca = Presupuestos.caja(q, Presupuestos.operativo(q)), ult = ca[2];
      const falta = ca.some(c => c.financiar > 0);
      tarjetas += C('Saldo de caja proyectado', Fmt.moneda(ult.final), 'Último mes del presupuesto');
      lectura.push(falta ? 'Presupuesto de caja: en algún mes el saldo queda bajo el mínimo; conviene prever financiamiento.'
        : 'Presupuesto de caja: el saldo se mantiene sobre el mínimo deseado en los tres meses.');
    }
    tarjetas += C('Financiamiento externo ' + (A + 1), Fmt.moneda(p.fer), p.fer > 0 ? 'Fondos que faltan según la proforma' : 'Excedente según la proforma');
    lectura.push(p.fer > 0 ? 'Proforma ' + (A + 1) + ': con el crecimiento supuesto faltan ' + Fmt.moneda(p.fer) + '; hay que conseguir ese financiamiento o frenar el crecimiento de activos.'
      : 'Proforma ' + (A + 1) + ': con los supuestos dados sobra ' + Fmt.moneda(-p.fer) + ' de fondos; se puede pagar deuda o repartir más utilidades.');
    return '<div class="rejilla">' + tarjetas + '</div>' +
      '<h2 class="titulo-seccion">Lectura para decisiones</h2><div class="aviso"><ul style="padding-left:18px;line-height:1.7">' +
      lectura.map(t => '<li>' + t + '</li>').join('') + '</ul></div>';
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d), s = Proforma.obtener(), C = Proforma.campo;
    const tabs = [['proforma', 'Estados proforma'], ['reporte', 'Reporte integrado']];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' + tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div id="sec-proforma">' +
        '<div class="aviso">Proyección del año ' + (d.anioFin + 1) + ' a partir de los Estados financieros de ' + d.anios[1] + '. Método crítico: el efectivo se mantiene y la diferencia entre activos y (pasivos + patrimonio) es el financiamiento externo requerido.</div>' +
        '<h2 class="titulo-seccion">Supuestos</h2>' +
        '<div class="barra-acciones">' + C('pf-crec', 'Crecimiento de ventas (%)', s.crecimiento) + C('pf-costo', 'Costo de ventas (% de ventas)', s.costoPct) +
          C('pf-gv', 'Gastos de venta (% de ventas)', s.gVentaPct) + C('pf-ga', 'Gastos de administración (% de ventas)', s.gAdminPct) + '</div>' +
        '<div class="barra-acciones">' + C('pf-dep', 'Depreciación (C$)', s.depreciacion) + C('pf-int', 'Intereses (C$)', s.intereses) +
          C('pf-isr', 'Impuesto (%)', s.isr) + C('pf-div', 'Dividendos (% de la utilidad neta)', s.dividendosPct) + '</div>' +
        '<div class="barra-acciones">' + C('pf-cxc', 'Cuentas por cobrar (% de ventas)', s.cxcPct) + C('pf-inv', 'Inventarios (% del costo de ventas)', s.invPct) +
          C('pf-cxp', 'Cuentas por pagar (% del costo de ventas)', s.cxpPct) + C('pf-af', 'Compra de activos fijos (C$)', s.compraAF) +
          '<button class="btn sec" id="pf-reset">Restablecer desde los estados</button></div>' +
        '<div class="tarjeta" id="pf-tabla"></div>' +
        '<div class="cuadre" id="pf-cuadre"></div>' +
      '</div>' +
      '<div id="sec-reporte" style="display:none"></div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const q = id => raiz.querySelector(id), n = id => Fmt.aNum(q(id).value);
    const leer = () => ({ crecimiento: n('#pf-crec'), costoPct: n('#pf-costo'), gVentaPct: n('#pf-gv'), gAdminPct: n('#pf-ga'),
      depreciacion: n('#pf-dep'), intereses: n('#pf-int'), isr: n('#pf-isr'), dividendosPct: n('#pf-div'),
      cxcPct: n('#pf-cxc'), invPct: n('#pf-inv'), cxpPct: n('#pf-cxp'), compraAF: n('#pf-af') });
    const refrescar = () => {
      const x = leer(); Datos.guardar('proforma', x);
      const p = Proforma.calcular(d, r, x);
      q('#pf-tabla').innerHTML = Proforma.tablaProforma(d, r, p);
      const c = q('#pf-cuadre');
      c.className = 'cuadre ' + (p.fer > 0.5 ? 'mal' : 'ok');
      c.textContent = p.fer > 0.5 ? 'Financiamiento externo requerido: ' + Fmt.moneda(p.fer) + ' (Total activo − Total pasivo y patrimonio).'
        : 'No se requiere financiamiento externo; excedente de fondos: ' + Fmt.moneda(-p.fer) + '.';
      q('#sec-reporte').innerHTML = Proforma.reporte(d, r, p);
    };
    raiz.addEventListener('input', refrescar);
    q('#pf-reset').addEventListener('click', () => { Datos.guardar('proforma', Proforma.porDefecto()); Proforma.render(el); Validar.activar(el); });
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => { q('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
    }));
    refrescar();
  }
};

Modulos.proforma = {
  titulo: 'Proforma y reporte',
  subtitulo: 'Estados proforma y resumen integrado para apoyar decisiones',
  render(el) { Proforma.render(el); }
};