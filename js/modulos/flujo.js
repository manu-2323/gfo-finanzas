// Módulo 5: Flujo de efectivo (operación, inversión, financiamiento)
const Flujo = {
  grafs: [],

  ejemploManual() { return { inicial: 25000, op: 20000, inv: -13000, fin: 20000 }; },
  vacioManual() { return { inicial: 0, op: 0, inv: 0, fin: 0 }; },
  obtenerManual() { return Datos.leer('flujo_manual', Flujo.ejemploManual()); },

  // Aquí se hacen los cálculos: método indirecto con los dos años de los Estados financieros
  indirecto(d, r) {
    const b = (k, p) => Number(d.bg[k][p]) || 0;
    const dif = k => b(k, 1) - b(k, 0);
    const dep = Number(d.er.depreciacion[1]) || 0;
    const un = r[1].utilidadNeta;
    const op = [
      ['Utilidad neta', un],
      ['(+) Depreciación (no sale efectivo)', dep],
      ['Cuentas por cobrar (aumento resta, disminución suma)', -dif('cxc')],
      ['Inventarios (aumento resta, disminución suma)', -dif('inventarios')],
      ['Otros activos corrientes (aumento resta, disminución suma)', -dif('otrosAC')],
      ['Cuentas por pagar (aumento suma, disminución resta)', dif('cxp')],
      ['Otros pasivos corrientes (aumento suma, disminución resta)', dif('otrosPC')]
    ];
    const compraAF = dif('activosFijos') + dep;   // activos fijos netos finales = iniciales + compras - depreciación
    const inv = [
      ['(−) Compra de activos fijos (cambio en activos fijos + depreciación)', -compraAF],
      ['Otros activos no corrientes (aumento resta, disminución suma)', -dif('otrosANC')]
    ];
    const div = b('utilidadesRetenidas', 0) + un - b('utilidadesRetenidas', 1); // UR final = UR inicial + UN - dividendos
    const fin = [
      ['Variación en préstamos a corto plazo', dif('prestCP')],
      ['Variación en préstamos a largo plazo', dif('prestLP')],
      ['Variación en capital social', dif('capital')],
      ['(−) Dividendos pagados (UR inicial + UN − UR final)', -div]
    ];
    const suma = l => l.reduce((s, x) => s + x[1], 0);
    const flOp = suma(op), flInv = suma(inv), flFin = suma(fin);
    const neta = flOp + flInv + flFin;
    const ini = b('efectivo', 0), final = ini + neta, enBalance = b('efectivo', 1);
    return { op, inv, fin, flOp, flInv, flFin, neta, ini, final, enBalance, diferencia: final - enBalance };
  },

  tabla(filas) {
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>C$</th></tr>' +
      filas.map(f => '<tr class="' + (f[2] || '') + '"><td>' + f[0] + '</td><td>' + Fmt.moneda(f[1]) + '</td></tr>').join('') + '</table></div>';
  },

  limpiar() { Flujo.grafs.forEach(g => { try { g.destroy(); } catch (e) {} }); Flujo.grafs = []; },

  grafico(canvas, op, inv, fin, neta) {
    if (typeof Chart === 'undefined') return;
    Flujo.grafs.push(new Chart(canvas, {
      type: 'bar',
      data: { labels: ['Operación', 'Inversión', 'Financiamiento', 'Variación neta'],
        datasets: [{ label: 'C$', data: [op, inv, fin, neta], backgroundColor: ['#1f3a5f', '#9db4d0', '#3f6fa3', '#3d8b6a'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }));
  },

  interpretar(op, inv, fin, neta) {
    let t = op >= 0 ? 'La operación genera efectivo (' + Fmt.moneda(op) + '). ' : 'La operación consume efectivo (' + Fmt.moneda(op) + '), señal de alerta. ';
    t += inv < 0 ? 'Se invierte ' + Fmt.moneda(-inv) + ' en activos. ' : 'La inversión aporta efectivo (' + Fmt.moneda(inv) + '). ';
    t += fin >= 0 ? 'El financiamiento aporta ' + Fmt.moneda(fin) + '. ' : 'Se salen ' + Fmt.moneda(-fin) + ' en pago de deudas y dividendos. ';
    t += neta >= 0 ? 'En total el efectivo aumenta ' + Fmt.moneda(neta) + '.' : 'En total el efectivo disminuye ' + Fmt.moneda(-neta) + '.';
    return t;
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d), I = Flujo.indirecto(d, r), m = Flujo.obtenerManual();
    const tabs = [['indirecto', 'Desde los Estados financieros'], ['manual', 'Por actividades (caso manual)']];
    const campo = (id, et, v) => '<label class="campo corto" style="flex:1;min-width:170px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + v + '"></label>';
    const filasInd = [].concat(
      [['FLUJO DE EFECTIVO DE OPERACIÓN', null, 'sub']], I.op, [['Flujo neto de operación', I.flOp, 'total']],
      [['FLUJO DE EFECTIVO DE INVERSIÓN', null, 'sub']], I.inv, [['Flujo neto de inversión', I.flInv, 'total']],
      [['FLUJO DE EFECTIVO DE FINANCIAMIENTO', null, 'sub']], I.fin, [['Flujo neto de financiamiento', I.flFin, 'total']],
      [['Variación neta de efectivo', I.neta, 'total'], ['Efectivo al inicio (' + d.anios[0] + ')', I.ini],
       ['Efectivo al final calculado', I.final, 'total'], ['Efectivo en el Balance General (' + d.anios[1] + ')', I.enBalance]]);
    const tablaInd = '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>' + d.anios[1] + ' (C$)</th></tr>' +
      filasInd.map(f => f[1] === null
        ? '<tr class="sub"><td colspan="2">' + f[0] + '</td></tr>'
        : '<tr class="' + (f[2] || '') + '"><td>' + f[0] + '</td><td>' + Fmt.moneda(f[1]) + '</td></tr>').join('') + '</table></div>';
    const ok = Math.abs(I.diferencia) < 0.5;
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' + tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div id="sec-indirecto">' +
        '<div class="aviso">Método indirecto con los datos de Estados financieros (' + d.anios[0] + ' y ' + d.anios[1] + '): Operación + Inversión + Financiamiento = Variación neta; Efectivo inicial + Variación neta = Efectivo final. Si cambias los estados, vuelve a abrir este módulo.</div>' +
        '<div class="tarjeta" style="margin-top:14px">' + tablaInd + '</div>' +
        '<div class="cuadre ' + (ok ? 'ok' : 'mal') + '">' + (ok
          ? 'Comprobación: el efectivo final calculado coincide con el efectivo del Balance General.'
          : 'No coincide con el Balance General (diferencia ' + Fmt.moneda(I.diferencia) + '). Revisa que el balance cuadre en Estados financieros.') + '</div>' +
        '<div class="aviso" style="margin-top:14px">' + Flujo.interpretar(I.flOp, I.flInv, I.flFin, I.neta) + '</div>' +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g1"></canvas></div></div>' +
      '</div>' +
      '<div id="sec-manual" style="display:none">' +
      '<div class="aviso">Escribe el flujo de cada actividad (las salidas van con signo negativo, por ejemplo −13000).</div>' +
        '<div class="barra-acciones" style="margin-top:14px">' +
          campo('fl-ini', 'Efectivo inicial (C$)', m.inicial) + campo('fl-op', 'Flujo de operación (C$)', m.op) +
          campo('fl-inv', 'Flujo de inversión (C$)', m.inv) + campo('fl-fin', 'Flujo de financiamiento (C$)', m.fin) +
        '</div>' +
        '<div class="barra-acciones"><button class="btn" id="fl-ejemplo">Cargar caso de clase</button><button class="btn sec peligro" id="fl-limpiar">Limpiar datos</button></div>' +
        '<div class="rejilla" id="fl-tarjetas"></div>' +
        '<div class="aviso" id="fl-interp" style="margin-top:14px"></div>' +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g2"></canvas></div></div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const num = id => Fmt.aNum(raiz.querySelector(id).value);
    const refrescarManual = () => {
      const x = { inicial: num('#fl-ini'), op: num('#fl-op'), inv: num('#fl-inv'), fin: num('#fl-fin') };
      Datos.guardar('flujo_manual', x);
      const neta = x.op + x.inv + x.fin, final = x.inicial + neta;
      const t = (tt, v, n) => '<div class="tarjeta"><h3>' + tt + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
      raiz.querySelector('#fl-tarjetas').innerHTML =
        t('Variación neta de efectivo', Fmt.moneda(neta), 'Operación + Inversión + Financiamiento') +
        t('Efectivo inicial', Fmt.moneda(x.inicial), 'Dato de entrada') +
        t('Efectivo final', Fmt.moneda(final), 'Efectivo inicial + Variación neta');
      raiz.querySelector('#fl-interp').textContent = Flujo.interpretar(x.op, x.inv, x.fin, neta);
      Flujo.limpiar();
      Flujo.grafico(raiz.querySelector('#fl-g2'), x.op, x.inv, x.fin, neta);
    };
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => { raiz.querySelector('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
      Flujo.limpiar();
      if (b.dataset.tab === 'indirecto') Flujo.grafico(raiz.querySelector('#fl-g1'), I.flOp, I.flInv, I.flFin, I.neta);
      else refrescarManual();
    }));
    raiz.querySelector('#sec-manual').addEventListener('input', refrescarManual);
    raiz.querySelector('#fl-ejemplo').addEventListener('click', () => {
      Datos.guardar('flujo_manual', Flujo.ejemploManual()); Flujo.render(el); Validar.activar(el);
      el.querySelector('[data-tab="manual"]').click();
    });
    raiz.querySelector('#fl-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos del flujo manual?')) {
        Datos.guardar('flujo_manual', Flujo.vacioManual()); Flujo.render(el); Validar.activar(el);
        el.querySelector('[data-tab="manual"]').click();
      }
    });
    Flujo.grafico(raiz.querySelector('#fl-g1'), I.flOp, I.flInv, I.flFin, I.neta);
  }
};

Modulos.flujo = {
  titulo: 'Flujo de efectivo',
  subtitulo: 'Actividades de operación, inversión y financiamiento',
  render(el) { Flujo.render(el); }
};