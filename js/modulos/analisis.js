const Analisis = {
  grafs: [],

  // Valor de una línea (cuenta) para el período p
  valor(d, r, grupo, f, p) {
    const k = f[0];
    return k[0] === '@' ? r[p][k.slice(1)] : Number(d[grupo][k][p]) || 0;
  },

  // Datos de apoyo para calcular razones del período p (0 = año 1, 1 = año 2)
  ctx(d, r, p) {
    return {
      R: r[p],
      n: (g, k) => Number(d[g][k][p]) || 0,
      // saldo promedio: solo existe para el año 2 (necesita el año anterior)
      prom: (g, k) => p === 0 ? null : (Number(d[g][k][0]) + Number(d[g][k][1])) / 2,
      promR: k => p === 0 ? null : (r[0][k] + r[1][k]) / 2
    };
  },

  fmtV(tipo, v) {
    return (v === null || v === undefined || !isFinite(v)) ? 'N/D' : Fmt[tipo](v);
  },

  // Aquí se calculan las razones financieras (fórmulas de clase: saldos promedio y 365 días)
  razones() {
    const div = (a, b) => (b ? a / b : null);
    const x2 = v => Fmt.num(v, 2);
    return [
      { grupo: 'Liquidez', items: [
        { nombre: 'Capital de trabajo neto', formula: 'Activo corriente − Pasivo corriente', tipo: 'moneda',
          f: c => c.R.ac - c.R.pc,
          txt: v => v >= 0 ? 'Positivo: los activos corrientes cubren los pasivos corrientes.' : 'Negativo: los pasivos corrientes superan a los activos corrientes.' },
        { nombre: 'Razón corriente', formula: 'Activo corriente ÷ Pasivo corriente', tipo: 'veces',
          f: c => div(c.R.ac, c.R.pc),
          txt: v => 'Por cada C$ 1 de pasivo corriente hay C$ ' + x2(v) + ' de activo corriente.' },
        { nombre: 'Prueba ácida', formula: '(Activo corriente − Inventarios) ÷ Pasivo corriente', tipo: 'veces',
          f: c => div(c.R.ac - c.n('bg', 'inventarios'), c.R.pc),
          txt: v => 'Sin contar inventarios, hay C$ ' + x2(v) + ' por cada C$ 1 de deuda a corto plazo.' }
      ]},
      { grupo: 'Actividad (saldos promedio, 365 días)', items: [
        { nombre: 'Rotación de inventarios', formula: 'Costo de ventas ÷ Inventario promedio', tipo: 'veces',
          f: c => div(c.n('er', 'costoVentas'), c.prom('bg', 'inventarios')),
          txt: v => 'El inventario se renueva ' + x2(v) + ' veces al año.' },
        { nombre: 'Edad promedio de inventario', formula: '365 ÷ Rotación de inventarios', tipo: 'dias',
          f: c => c.prom('bg', 'inventarios') === null ? null : div(365 * c.prom('bg', 'inventarios'), c.n('er', 'costoVentas')),
          txt: v => 'El inventario tarda unos ' + Math.round(v) + ' días en venderse.' },
        { nombre: 'Período promedio de cobro (PPC)', formula: 'CxC promedio × 365 ÷ Ventas', tipo: 'dias',
          f: c => c.prom('bg', 'cxc') === null ? null : div(c.prom('bg', 'cxc') * 365, c.n('er', 'ventas')),
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en cobrar a los clientes.' },
        { nombre: 'Período promedio de pago (PPP)', formula: 'CxP promedio × 365 ÷ Costo de ventas', tipo: 'dias',
          f: c => c.prom('bg', 'cxp') === null ? null : div(c.prom('bg', 'cxp') * 365, c.n('er', 'costoVentas')),
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en pagar a los proveedores.' },
        { nombre: 'Ciclo de conversión del efectivo', formula: 'Edad de inventario + PPC − PPP', tipo: 'dias',
          f: c => {
            const inv = c.prom('bg', 'inventarios'), cxc = c.prom('bg', 'cxc'), cxp = c.prom('bg', 'cxp');
            if (inv === null) return null;
            const edad = div(365 * inv, c.n('er', 'costoVentas'));
            const ppc = div(cxc * 365, c.n('er', 'ventas'));
            const ppp = div(cxp * 365, c.n('er', 'costoVentas'));
            return (edad === null || ppc === null || ppp === null) ? null : edad + ppc - ppp;
          },
          txt: v => 'El efectivo queda comprometido unos ' + Math.round(v) + ' días entre pagar y cobrar.' },
        { nombre: 'Rotación de activos fijos', formula: 'Ventas ÷ Activos fijos promedio', tipo: 'veces',
          f: c => div(c.n('er', 'ventas'), c.prom('bg', 'activosFijos')),
          txt: v => 'Cada C$ 1 en activos fijos genera C$ ' + x2(v) + ' en ventas.' },
        { nombre: 'Rotación de activos totales', formula: 'Ventas ÷ Activo total promedio', tipo: 'veces',
          f: c => div(c.n('er', 'ventas'), c.promR('totalActivo')),
          txt: v => 'Cada C$ 1 en activos genera C$ ' + x2(v) + ' en ventas.' }
      ]},
      { grupo: 'Endeudamiento', items: [
        { nombre: 'Razón de endeudamiento', formula: 'Pasivo total ÷ Activo total', tipo: 'pct',
          f: c => div(c.R.totalPasivo, c.R.totalActivo),
          txt: v => 'El ' + Fmt.pct(v) + ' de los activos está financiado con deuda.' },
        { nombre: 'Deuda sobre patrimonio', formula: 'Pasivo total ÷ Patrimonio', tipo: 'veces',
          f: c => div(c.R.totalPasivo, c.R.patrimonio),
          txt: v => 'Por cada C$ 1 de patrimonio hay C$ ' + x2(v) + ' de deuda.' },
        { nombre: 'Cobertura de intereses', formula: 'UAII ÷ Gastos por intereses', tipo: 'veces',
          f: c => div(c.R.uaii, c.n('er', 'intereses')),
          txt: v => 'La utilidad operativa cubre ' + x2(v) + ' veces los intereses.' }
      ]},
      { grupo: 'Rentabilidad', items: [
        { nombre: 'Margen de utilidad bruta', formula: 'Utilidad bruta ÷ Ventas', tipo: 'pct',
          f: c => div(c.R.utilidadBruta, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' quedan después del costo de ventas.' },
        { nombre: 'Margen de utilidad operativa', formula: 'UAII ÷ Ventas', tipo: 'pct',
          f: c => div(c.R.uaii, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' quedan después de los gastos operativos.' },
        { nombre: 'Margen de utilidad neta', formula: 'Utilidad neta ÷ Ventas', tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.n('er', 'ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v * 100) + ' son utilidad neta.' },
        { nombre: 'Rendimiento sobre activos (ROA)', formula: 'Utilidad neta ÷ Activo total promedio', tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.promR('totalActivo')),
          txt: v => 'Cada C$ 100 invertidos en activos generan C$ ' + x2(v * 100) + ' de utilidad neta.' },
        { nombre: 'Rendimiento sobre patrimonio (ROE)', formula: 'Utilidad neta ÷ Patrimonio promedio', tipo: 'pct',
          f: c => div(c.R.utilidadNeta, c.promR('patrimonio')),
          txt: v => 'Cada C$ 100 del patrimonio generan C$ ' + x2(v * 100) + ' de utilidad neta.' }
      ]}
    ];
  },

  // Sistema DuPont para el año 2 (necesita saldos promedio)
  dupont(d, r) {
    const R = r[1];
    const ventas = Number(d.er.ventas[1]) || 0;
    const actProm = (r[0].totalActivo + r[1].totalActivo) / 2;
    const patProm = (r[0].patrimonio + r[1].patrimonio) / 2;
    const margen = ventas ? R.utilidadNeta / ventas : null;
    const rotacion = actProm ? ventas / actProm : null;
    const multiplicador = patProm ? actProm / patProm : null;
    const roe = (margen === null || rotacion === null || multiplicador === null) ? null : margen * rotacion * multiplicador;
    const roeDirecto = patProm ? R.utilidadNeta / patProm : null;
    return { margen, rotacion, multiplicador, roe, roeDirecto };
  },

  tablaHorizontal(d, r) {
    const A = d.anios;
    const filas = (grupo, lista) => lista.map(f => {
      const a = Analisis.valor(d, r, grupo, f, 0), b = Analisis.valor(d, r, grupo, f, 1);
      const abs = b - a, rel = a !== 0 ? abs / Math.abs(a) : null;
      return '<tr class="' + (f[0][0] === '@' ? 'total' : '') + '"><td>' + f[1] + '</td><td>' + Fmt.moneda(a) +
        '</td><td>' + Fmt.moneda(b) + '</td><td>' + Fmt.moneda(abs) + '</td><td>' + (rel === null ? 'N/D' : Fmt.pct(rel)) + '</td></tr>';
    }).join('');
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] +
      '</th><th>Variación C$</th><th>Variación %</th></tr>' +
      '<tr class="sub"><td colspan="5">Estado de Resultados</td></tr>' + filas('er', EST_FILAS_ER) +
      '<tr class="sub"><td colspan="5">Balance General</td></tr>' + filas('bg', EST_FILAS_BG) + '</table></div>' +
      '<p class="nota-pie">Variación % = (Año 2 − Año 1) ÷ |Año 1|. Si el año 1 es cero se muestra N/D.</p>';
  },

  tablaVertical(d, r) {
    const A = d.anios;
    const filas = (grupo, lista, claveBase) => lista.map(f => {
      const celdas = [0, 1].map(p => {
        const base = claveBase === 'ventas' ? Number(d.er.ventas[p]) || 0 : r[p].totalActivo;
        const v = Analisis.valor(d, r, grupo, f, p);
        return base ? Fmt.pct(v / base) : 'N/D';
      });
      return '<tr class="' + (f[0][0] === '@' ? 'total' : '') + '"><td>' + f[1] + '</td><td>' + celdas[0] + '</td><td>' + celdas[1] + '</td></tr>';
    }).join('');
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] + '</th></tr>' +
      '<tr class="sub"><td colspan="3">Estado de Resultados (% de las ventas)</td></tr>' + filas('er', EST_FILAS_ER, 'ventas') +
      '<tr class="sub"><td colspan="3">Balance General (% del activo total)</td></tr>' + filas('bg', EST_FILAS_BG, 'activo') + '</table></div>';
  },

  tablaRazones(d, r) {
    const A = d.anios, c0 = Analisis.ctx(d, r, 0), c1 = Analisis.ctx(d, r, 1);
    let html = '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Razón</th><th>Fórmula</th><th>' + A[0] + '</th><th>' + A[1] + '</th><th>Interpretación (' + A[1] + ')</th></tr>';
    Analisis.razones().forEach(g => {
      html += '<tr class="sub"><td colspan="5">' + g.grupo + '</td></tr>';
      g.items.forEach(it => {
        const v0 = it.f(c0), v1 = it.f(c1);
        const ok1 = v1 !== null && isFinite(v1);
        html += '<tr><td>' + it.nombre + '</td><td class="formula">' + it.formula + '</td><td>' + Analisis.fmtV(it.tipo, v0) +
          '</td><td>' + Analisis.fmtV(it.tipo, v1) + '</td><td class="interp">' + (ok1 ? it.txt(v1) : '') + '</td></tr>';
      });
    });
    return html + '</table></div>' +
      '<p class="nota-pie">Las razones de actividad y rentabilidad sobre activos o patrimonio usan saldos promedio, por eso el año 1 aparece como N/D (necesita el año anterior). ' +
      'El período de pago usa el costo de ventas como base porque el sistema no registra compras. La razón de mercado no se calcula por falta de datos de acciones.</p>';
  },

  htmlDupont(d, r) {
    const u = Analisis.dupont(d, r), A = d.anios;
    const tarj = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
    const ok = u.roe !== null && u.roeDirecto !== null && Math.abs(u.roe - u.roeDirecto) < 1e-9;
    return '<p class="aviso">ROE = Margen de utilidad neta × Rotación de activos totales × Multiplicador de capital. Año analizado: ' + A[1] + '.</p>' +
      '<div class="cadena">' +
        tarj('Margen de utilidad neta', Analisis.fmtV('pct', u.margen), 'Utilidad neta ÷ Ventas') + '<span class="op">×</span>' +
        tarj('Rotación de activos totales', Analisis.fmtV('veces', u.rotacion), 'Ventas ÷ Activo promedio') + '<span class="op">×</span>' +
        tarj('Multiplicador de capital', Analisis.fmtV('veces', u.multiplicador), 'Activo promedio ÷ Patrimonio promedio') + '<span class="op">=</span>' +
        tarj('ROE', Analisis.fmtV('pct', u.roe), 'Rendimiento sobre el patrimonio') +
      '</div>' +
      '<div class="cuadre ' + (ok ? 'ok' : 'mal') + '">' + (ok
        ? 'Comprobación: el ROE por DuPont coincide con Utilidad neta ÷ Patrimonio promedio (' + Fmt.pct(u.roeDirecto) + ').'
        : 'No se puede comprobar el ROE (faltan datos).') + '</div>' +
      '<p class="nota-pie">Lectura: el margen mide cuánta utilidad deja cada venta, la rotación mide qué tan bien se usan los activos para vender y el multiplicador mide cuánto se apoya la empresa en deuda.</p>';
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
    const A = d.anios, dat = p => [Number(d.er.ventas[p]) || 0, r[p].utilidadBruta, r[p].uaii, r[p].utilidadNeta];
    const millones = v => (v / 1e6).toFixed(1) + ' M';
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-resultados'), {
      type: 'bar',
      data: { labels: ['Ventas', 'Utilidad bruta', 'UAII', 'Utilidad neta'],
        datasets: [
          { label: String(A[0]), data: dat(0), backgroundColor: '#9db4d0' },
          { label: String(A[1]), data: dat(1), backgroundColor: '#1f3a5f' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } },
        scales: { y: { ticks: { callback: millones } } } }
    }));
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-estructura'), {
      type: 'doughnut',
      data: { labels: ['Pasivo corriente', 'Pasivo a largo plazo', 'Patrimonio'],
        datasets: [{ data: [r[1].pc, r[1].pnc, r[1].patrimonio], backgroundColor: ['#9db4d0', '#3f6fa3', '#1f3a5f'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    }));
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d);
    const tabs = [['horizontal', 'Análisis horizontal'], ['vertical', 'Análisis vertical'], ['razones', 'Razones financieras'], ['dupont', 'Sistema DuPont'], ['graficos', 'Gráficos']];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' + tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div class="tarjeta" id="sec-horizontal">' + Analisis.tablaHorizontal(d, r) + '</div>' +
      '<div class="tarjeta" id="sec-vertical" style="display:none">' + Analisis.tablaVertical(d, r) + '</div>' +
      '<div class="tarjeta" id="sec-razones" style="display:none">' + Analisis.tablaRazones(d, r) + '</div>' +
      '<div id="sec-dupont" style="display:none">' + Analisis.htmlDupont(d, r) + '</div>' +
      '<div id="sec-graficos" style="display:none"><div class="dos-col">' +
        '<div class="tarjeta"><h3>Resultados por año</h3><div class="grafico"><canvas id="g-resultados"></canvas></div></div>' +
        '<div class="tarjeta"><h3>Estructura de financiamiento ' + d.anios[1] + '</h3><div class="grafico"><canvas id="g-estructura"></canvas></div></div>' +
      '</div></div>';
    el.innerHTML = '';
    el.appendChild(raiz);
    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => { raiz.querySelector('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
      if (b.dataset.tab === 'graficos') Analisis.dibujarGraficos(raiz, d, r);
    }));
  }
};

Modulos.analisis = {
  titulo: 'Análisis financiero',
  subtitulo: 'Análisis horizontal y vertical, razones financieras y sistema DuPont',
  render(el) { Analisis.render(el); }
};