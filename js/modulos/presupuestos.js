// Módulo 6: Planeación y presupuestos (operativo + presupuesto de caja), 3 meses
const Presupuestos = {
  grafs: [],

  ejemplo() {
    // Caso El Progreso (julio a septiembre). Los datos de entrada fueron ajustados para reproducir
    // ventas 72,000/90,000/108,000, compras 42,000/54,600/64,400, costo de ventas 42,000/52,500/63,000
    // y utilidad neta 7,000/11,900/16,800.
    return {
      meses: ['Julio', 'Agosto', 'Septiembre'],
      precio: 12, costoU: 7, unidades: [6000, 7500, 9000], unidadesSig: 10000, polInv: 20, invIni: 1500,
      gastos: [20000, 20500, 21000], depre: [1000, 1000, 1000], intereses: [0, 0, 0], isr: 30,
      // presupuesto de caja (datos de ejemplo propios)
      cobroContado: 50, cobro1: 30, cobro2: 20, ventasPrev: [60000, 60000],
      pagoContado: 50, comprasPrev: 40000, otros: [0, 0, 0], saldoIni: 10000, saldoMin: 8000
    };
  },
  vacio() {
    return { meses: ['Mes 1', 'Mes 2', 'Mes 3'], precio: 0, costoU: 0, unidades: [0, 0, 0], unidadesSig: 0, polInv: 0, invIni: 0,
      gastos: [0, 0, 0], depre: [0, 0, 0], intereses: [0, 0, 0], isr: 0,
      cobroContado: 0, cobro1: 0, cobro2: 0, ventasPrev: [0, 0], pagoContado: 0, comprasPrev: 0, otros: [0, 0, 0], saldoIni: 0, saldoMin: 0 };
  },
  obtener() { return Datos.leer('presupuestos', Presupuestos.ejemplo()); },

  // Aquí se hacen los cálculos del presupuesto operativo
  operativo(d) {
    const res = [];
    let invIni = d.invIni;
    for (let i = 0; i < 3; i++) {
      const u = d.unidades[i];
      const sig = i < 2 ? d.unidades[i + 1] : d.unidadesSig;
      const invFin = sig * d.polInv / 100;                  // inventario final deseado (unidades)
      const comprasU = u + invFin - invIni;                 // Compras = Ventas + Inv. final - Inv. inicial
      const ventas = u * d.precio;
      const compras = comprasU * d.costoU;
      const costoVentas = invIni * d.costoU + compras - invFin * d.costoU;  // Inv. inicial + Compras - Inv. final
      const utilidadBruta = ventas - costoVentas;
      const uaii = utilidadBruta - d.gastos[i];
      const uai = uaii - d.intereses[i];
      const impuesto = uai > 0 ? uai * d.isr / 100 : 0;
      res.push({ u, invIni, comprasU, invFin, ventas, compras, costoVentas, utilidadBruta, gastos: d.gastos[i],
        uaii, intereses: d.intereses[i], uai, impuesto, un: uai - impuesto });
      invIni = invFin;
    }
    return res;
  },

  // Presupuesto de caja: Saldo final = Saldo inicial + Cobros - Pagos (la depreciación no es salida de caja)
  caja(d, op) {
    const V = [d.ventasPrev[0], d.ventasPrev[1]].concat(op.map(o => o.ventas));
    const C = [d.comprasPrev].concat(op.map(o => o.compras));
    const res = [];
    let saldo = d.saldoIni;
    for (let i = 0; i < 3; i++) {
      const cobros = V[i + 2] * d.cobroContado / 100 + V[i + 1] * d.cobro1 / 100 + V[i] * d.cobro2 / 100;
      const pagoCompras = C[i + 1] * d.pagoContado / 100 + C[i] * (100 - d.pagoContado) / 100;
      const gastosEf = d.gastos[i] - d.depre[i];
      const pagos = pagoCompras + gastosEf + d.intereses[i] + op[i].impuesto + d.otros[i];
      const final = saldo + cobros - pagos;
      const excedente = final - d.saldoMin;
      res.push({ ini: saldo, cobros, pagoCompras, gastosEf, intereses: d.intereses[i], impuesto: op[i].impuesto,
        otros: d.otros[i], pagos, final, excedente, financiar: excedente < 0 ? -excedente : 0 });
      saldo = final;
    }
    return res;
  },

  U(v) { return Fmt.num(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2); },

  tablaOperativo(d, op) {
    const M = d.meses, U = Presupuestos.U;
    const filaM = (n, f, esUnidad, conTotal, cls) => {
      const fmt = esUnidad ? U : Fmt.moneda;
      const tot = conTotal ? fmt(op.reduce((s, o) => s + f(o), 0)) : '';
      return '<tr class="' + (cls || '') + '"><td>' + n + '</td>' + op.map(o => '<td>' + fmt(f(o)) + '</td>').join('') + '<td>' + tot + '</td></tr>';
    };
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>' + M[0] + '</th><th>' + M[1] + '</th><th>' + M[2] + '</th><th>Total</th></tr>' +
      '<tr class="sub"><td colspan="5">Presupuesto de ventas y compras</td></tr>' +
      filaM('Ventas (unidades)', o => o.u, true, true) +
      filaM('(+) Inventario final deseado (unidades)', o => o.invFin, true, false) +
      filaM('(−) Inventario inicial (unidades)', o => o.invIni, true, false) +
      filaM('Compras (unidades)', o => o.comprasU, true, true, 'total') +
      filaM('Ventas (C$)', o => o.ventas, false, true, 'total') +
      filaM('Compras (C$)', o => o.compras, false, true, 'total') +
      '<tr class="sub"><td colspan="5">Estado de resultados proyectado</td></tr>' +
      filaM('Ventas', o => o.ventas, false, true) +
      filaM('(−) Costo de ventas (Inv. inicial + Compras − Inv. final)', o => o.costoVentas, false, true) +
      filaM('Utilidad bruta', o => o.utilidadBruta, false, true, 'total') +
      filaM('(−) Gastos de operación', o => o.gastos, false, true) +
      filaM('Utilidad operativa (UAII)', o => o.uaii, false, true, 'total') +
      filaM('(−) Intereses', o => o.intereses, false, true) +
      filaM('Utilidad antes de impuestos', o => o.uai, false, true) +
      filaM('(−) Impuesto sobre la renta', o => o.impuesto, false, true) +
      filaM('Utilidad neta', o => o.un, false, true, 'total') +
      '</table></div>';
  },

  tablaCaja(d, ca) {
    const M = d.meses;
    const f = (n, g, cls) => '<tr class="' + (cls || '') + '"><td>' + n + '</td>' + ca.map(c => '<td>' + Fmt.moneda(g(c)) + '</td>').join('') + '</tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>' + M[0] + '</th><th>' + M[1] + '</th><th>' + M[2] + '</th></tr>' +
      f('Saldo inicial de caja', c => c.ini) +
      f('(+) Cobros de ventas', c => c.cobros) +
      f('(−) Pago de compras', c => c.pagoCompras) +
      f('(−) Gastos de operación en efectivo (sin depreciación)', c => c.gastosEf) +
      f('(−) Intereses', c => c.intereses) +
      f('(−) Impuesto sobre la renta', c => c.impuesto) +
      f('(−) Otros desembolsos', c => c.otros) +
      f('Total de pagos', c => c.pagos, 'total') +
      f('Saldo final de caja', c => c.final, 'total') +
      f('Saldo mínimo deseado', () => Presupuestos._min) +
      f('Excedente (+) o faltante (−) frente al mínimo', c => c.excedente, 'total') +
      f('Financiamiento requerido', c => c.financiar) + '</table></div>';
  },

  limpiar() { Presupuestos.grafs.forEach(g => { try { g.destroy(); } catch (e) {} }); Presupuestos.grafs = []; },

  graficos(raiz, d, ca) {
    Presupuestos.limpiar();
    if (typeof Chart === 'undefined') return;
    Presupuestos.grafs.push(new Chart(raiz.querySelector('#pr-g1'), {
      type: 'bar',
      data: { labels: d.meses, datasets: [
        { label: 'Cobros', data: ca.map(c => c.cobros), backgroundColor: '#1f3a5f' },
        { label: 'Pagos', data: ca.map(c => c.pagos), backgroundColor: '#9db4d0' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    }));
    Presupuestos.grafs.push(new Chart(raiz.querySelector('#pr-g2'), {
      type: 'line',
      data: { labels: d.meses, datasets: [
        { label: 'Saldo final de caja', data: ca.map(c => c.final), borderColor: '#1f3a5f', backgroundColor: '#1f3a5f', borderWidth: 2 },
        { label: 'Saldo mínimo', data: ca.map(() => d.saldoMin), borderColor: '#b25555', backgroundColor: '#b25555', borderDash: [6, 4], borderWidth: 2, pointRadius: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    }));
  },

  inp(id, v, tipo) {
    return '<input type="text" inputmode="decimal" data-validar="' + (tipo || 'numero') + '" id="' + id + '" value="' + v +
      '" style="text-align:right;padding:6px 8px;min-width:90px">';
  },
  campo(id, et, v) {
    return '<label class="campo corto" style="flex:1;min-width:150px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + v + '"></label>';
  },
  filaIn(et, base, arr) {
    return '<tr><td>' + et + '</td>' + [0, 1, 2].map(i => '<td>' + Presupuestos.inp(base + '-' + i, arr[i]) + '</td>').join('') + '</tr>';
  },

  render(el) {
    const d = Presupuestos.obtener(), P = Presupuestos, I = P.inp, C = P.campo;
    const tabs = [['oper', 'Presupuesto operativo'], ['caja', 'Presupuesto de caja']];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="barra-acciones">' +
        '<button class="btn" id="pr-ejemplo">Cargar caso El Progreso (jul-sep)</button>' +
        '<button class="btn sec peligro" id="pr-limpiar">Limpiar datos</button></div>' +
      '<div class="pestanas">' + tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div id="sec-oper">' +
        '<div class="aviso">Compras (unidades) = Ventas + Inventario final deseado − Inventario inicial. Costo de ventas = Inventario inicial + Compras − Inventario final. ' +
        'El inventario final deseado es un % de las unidades que se venderán el mes siguiente.</div>' +
        '<h2 class="titulo-seccion">Datos de entrada</h2>' +
        '<div class="barra-acciones">' + C('pr-precio', 'Precio de venta unitario (C$)', d.precio) + C('pr-costou', 'Costo unitario (C$)', d.costoU) +
          C('pr-inv', 'Inventario inicial (unidades)', d.invIni) + C('pr-pol', 'Inventario final deseado (% de ventas del mes siguiente)', d.polInv) +
          C('pr-sig', 'Ventas en unidades del mes siguiente al último', d.unidadesSig) + C('pr-isr', 'Impuesto sobre la renta (%)', d.isr) + '</div>' +
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos"><tr><th>Dato por mes</th>' +
          [0, 1, 2].map(i => '<th>' + I('pr-mes-' + i, d.meses[i], 'nombre') + '</th>').join('') + '</tr>' +
          P.filaIn('Ventas (unidades)', 'pr-u', d.unidades) + P.filaIn('Gastos de operación (C$, incluyen depreciación)', 'pr-g', d.gastos) +
          P.filaIn('De los cuales depreciación (C$)', 'pr-dep', d.depre) + P.filaIn('Intereses (C$)', 'pr-int', d.intereses) +
        '</table></div></div>' +
        '<h2 class="titulo-seccion">Resultados</h2>' +
        '<div class="tarjeta" id="pr-tabla-op"></div>' +
      '</div>' +
      '<div id="sec-caja" style="display:none">' +
        '<div class="aviso">Saldo final = Saldo inicial + Cobros − Pagos. La depreciación no es salida de caja y el costo de ventas no se cuenta dos veces: se pagan las compras, no el costo de ventas. ' +
        'Las ventas y compras salen del presupuesto operativo.</div>' +
        '<h2 class="titulo-seccion">Datos de entrada</h2>' +
        '<div class="barra-acciones">' + C('pr-c0', 'Ventas cobradas de contado (%)', d.cobroContado) + C('pr-c1', 'Cobradas al mes siguiente (%)', d.cobro1) +
          C('pr-c2', 'Cobradas a los 2 meses (%)', d.cobro2) + C('pr-pc', 'Compras pagadas de contado (%; el resto, mes siguiente)', d.pagoContado) + '</div>' +
        '<div class="barra-acciones">' + C('pr-vp0', 'Ventas de hace 2 meses (C$)', d.ventasPrev[0]) + C('pr-vp1', 'Ventas del mes anterior (C$)', d.ventasPrev[1]) +
          C('pr-cp', 'Compras del mes anterior (C$)', d.comprasPrev) + C('pr-si', 'Saldo inicial de caja (C$)', d.saldoIni) + C('pr-sm', 'Saldo mínimo deseado (C$)', d.saldoMin) + '</div>' +
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos"><tr><th>Dato por mes</th><th class="mes-0"></th><th class="mes-1"></th><th class="mes-2"></th></tr>' +
          P.filaIn('Otros desembolsos (compra de activos, dividendos, etc.) (C$)', 'pr-ot', d.otros) + '</table></div></div>' +
        '<div id="pr-avisoc"></div>' +
        '<h2 class="titulo-seccion">Presupuesto de caja</h2>' +
        '<div class="tarjeta" id="pr-tabla-caja"></div>' +
        '<div class="aviso" id="pr-alerta" style="margin-top:14px"></div>' +
        '<div class="dos-col" style="margin-top:14px">' +
          '<div class="tarjeta"><h3>Cobros vs pagos</h3><div class="grafico"><canvas id="pr-g1"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Saldo de efectivo proyectado</h3><div class="grafico"><canvas id="pr-g2"></canvas></div></div>' +
        '</div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const q = id => raiz.querySelector(id);
    const n = id => Fmt.aNum(q(id).value);
    const tri = b => [0, 1, 2].map(i => n(b + '-' + i));
    const leer = () => ({
      meses: [0, 1, 2].map(i => q('#pr-mes-' + i).value || ('Mes ' + (i + 1))),
      precio: n('#pr-precio'), costoU: n('#pr-costou'), unidades: tri('#pr-u'), unidadesSig: n('#pr-sig'),
      polInv: n('#pr-pol'), invIni: n('#pr-inv'), gastos: tri('#pr-g'), depre: tri('#pr-dep'), intereses: tri('#pr-int'), isr: n('#pr-isr'),
      cobroContado: n('#pr-c0'), cobro1: n('#pr-c1'), cobro2: n('#pr-c2'), ventasPrev: [n('#pr-vp0'), n('#pr-vp1')],
      pagoContado: n('#pr-pc'), comprasPrev: n('#pr-cp'), otros: tri('#pr-ot'), saldoIni: n('#pr-si'), saldoMin: n('#pr-sm')
    });

    let visibleCaja = false;
    const refrescar = () => {
      const x = leer();
      Datos.guardar('presupuestos', x);
      const op = P.operativo(x), ca = P.caja(x, op);
      P._min = x.saldoMin;
      q('#pr-tabla-op').innerHTML = P.tablaOperativo(x, op);
      q('#pr-tabla-caja').innerHTML = P.tablaCaja(x, ca);
      [0, 1, 2].forEach(i => { const h = raiz.querySelector('.mes-' + i); if (h) h.textContent = x.meses[i]; });
      const suma = x.cobroContado + x.cobro1 + x.cobro2;
      q('#pr-avisoc').innerHTML = Math.abs(suma - 100) > 1e-9
        ? '<div class="cuadre mal">Los porcentajes de cobro suman ' + Fmt.num(suma, 2) + ' %; deben sumar 100 %.</div>' : '';
      const falta = ca.map((c, i) => c.financiar > 0 ? x.meses[i] + ' (' + Fmt.moneda(c.financiar) + ')' : null).filter(Boolean);
      q('#pr-alerta').innerHTML = falta.length
        ? '<strong>Alerta de financiamiento:</strong> el saldo queda por debajo del mínimo en ' + falta.join(', ') + '. Se necesita financiamiento o ajustar cobros, pagos o gastos.'
        : 'Sin alerta: el saldo de caja se mantiene en o sobre el mínimo deseado en los tres meses. Saldo final del último mes: ' + Fmt.moneda(ca[2].final) + '.';
      if (visibleCaja) P.graficos(raiz, x, ca);
    };

    raiz.addEventListener('input', refrescar);
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(z => z.classList.toggle('activa', z === b));
      tabs.forEach(t => { q('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
      visibleCaja = b.dataset.tab === 'caja';
      if (visibleCaja) refrescar(); else P.limpiar();
    }));
    q('#pr-ejemplo').addEventListener('click', () => { Datos.guardar('presupuestos', P.ejemplo()); P.render(el); Validar.activar(el); });
    q('#pr-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos de presupuestos?')) { Datos.guardar('presupuestos', P.vacio()); P.render(el); Validar.activar(el); }
    });
    refrescar();
  }
};

Modulos.presupuestos = {
  titulo: 'Planeación y presupuestos',
  subtitulo: 'Presupuesto de ventas, compras, costo de ventas, gastos y presupuesto de caja',
  render(el) { Presupuestos.render(el); }
};