// Análisis horizontal y vertical con las cuentas de la empresa y el par de períodos elegido.
// Sustituye Analisis.render: las razones, el DuPont y los gráficos siguen en analisis.js.
Analisis.valorCuenta = (raw, id, pid) => Number((raw.valores[pid] || {})[id]) || 0;

Analisis.htmlHorizontal = function (raw, ids, d, r) {
  const A = d.anios;
  const fila = (nombre, a, b, total) => {
    const abs = b - a, rel = a !== 0 ? abs / Math.abs(a) : null;
    return '<tr class="' + (total ? 'total' : '') + '"><td>' + esc(nombre) + '</td><td>' + Fmt.moneda(a) +
      '</td><td>' + Fmt.moneda(b) + '</td><td>' + Fmt.moneda(abs) + '</td><td>' + (rel === null ? 'N/D' : Fmt.pct(rel)) + '</td></tr>';
  };
  const bloque = (estado, orden) => orden.map(item => {
    if (item[0] === '@') {
      const k = item.slice(1);
      return fila(ETIQUETAS_TOTAL[k], r[0][k], r[1][k], true);
    }
    return raw.cuentas[estado].filter(a => a.grupo === item).map(a =>
      fila(a.nombre, Analisis.valorCuenta(raw, a.id, ids[0]), Analisis.valorCuenta(raw, a.id, ids[1]), false)).join('');
  }).join('');
  return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] +
    '</th><th>Variación C$</th><th>Variación %</th></tr>' +
    '<tr class="sub"><td colspan="5">Estado de Resultados</td></tr>' + bloque('er', ER_ORDEN) +
    '<tr class="sub"><td colspan="5">Balance General</td></tr>' + bloque('bg', BG_ORDEN) + '</table></div>' +
    '<p class="nota-pie">Variación % = (' + A[1] + ' − ' + A[0] + ') ÷ |' + A[0] + '|. Si el período base es cero se muestra N/D.</p>';
};

Analisis.htmlVertical = function (raw, ids, d, r) {
  const A = d.anios;
  const pct = (v, base) => base ? Fmt.pct(v / base) : 'N/D';
  const bloque = (estado, orden) => {
    const base = estado === 'er' ? [d.er.ventas[0], d.er.ventas[1]] : [r[0].totalActivo, r[1].totalActivo];
    return orden.map(item => {
      if (item[0] === '@') {
        const k = item.slice(1);
        return '<tr class="total"><td>' + ETIQUETAS_TOTAL[k] + '</td><td>' + pct(r[0][k], base[0]) + '</td><td>' + pct(r[1][k], base[1]) + '</td></tr>';
      }
      return raw.cuentas[estado].filter(a => a.grupo === item).map(a =>
        '<tr><td>' + esc(a.nombre) + '</td><td>' + pct(Analisis.valorCuenta(raw, a.id, ids[0]), base[0]) +
        '</td><td>' + pct(Analisis.valorCuenta(raw, a.id, ids[1]), base[1]) + '</td></tr>').join('');
    }).join('');
  };
  return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Cuenta</th><th>' + A[0] + '</th><th>' + A[1] + '</th></tr>' +
    '<tr class="sub"><td colspan="3">Estado de Resultados (% de las ventas)</td></tr>' + bloque('er', ER_ORDEN) +
    '<tr class="sub"><td colspan="3">Balance General (% del activo total)</td></tr>' + bloque('bg', BG_ORDEN) + '</table></div>';
};

Analisis.render = function (el) {
  const raw = Estados.leerCrudo(), ids = Seleccion.ids();
  const d = Estados.compat(raw, ids), r = Estados.calcular(d);
  const tabs = [['horizontal', 'Análisis horizontal'], ['vertical', 'Análisis vertical'], ['razones', 'Razones financieras'], ['dupont', 'Sistema DuPont'], ['graficos', 'Gráficos']];
  const raiz = document.createElement('div');
  raiz.innerHTML =
    Lectura.html(Lectura.estados(raw, ids), 'Lectura financiera del par de períodos') +
    '<div class="pestanas">' + tabs.map((t, i) => '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div class="tarjeta" id="sec-horizontal">' + Analisis.htmlHorizontal(raw, ids, d, r) + '</div>' +
    '<div class="tarjeta" id="sec-vertical" style="display:none">' + Analisis.htmlVertical(raw, ids, d, r) + '</div>' +
    '<div class="tarjeta" id="sec-razones" style="display:none">' + Analisis.tablaRazones(d, r) + '</div>' +
    '<div id="sec-dupont" style="display:none">' + Analisis.htmlDupont(d, r) + '</div>' +
    '<div id="sec-graficos" style="display:none"><div class="dos-col">' +
      '<div class="tarjeta"><h3>Resultados por período</h3><div class="grafico"><canvas id="g-resultados"></canvas></div></div>' +
      '<div class="tarjeta"><h3>Estructura de financiamiento ' + d.anios[1] + '</h3><div class="grafico"><canvas id="g-estructura"></canvas></div></div>' +
    '</div></div>';
  el.innerHTML = '';
  el.appendChild(raiz);
  raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
    raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
    tabs.forEach(t => { raiz.querySelector('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
    if (b.dataset.tab === 'graficos') Analisis.dibujarGraficos(raiz, d, r);
  }));
};