// Panel principal para empresas de tipo "Personal": solo finanzas personales.
// Envuelve Modulos.panel.render: si la empresa es Personal dibuja este panel; si no, el de empresa.
const PanelPersonal = {
  ETQ: { ok: 'Favorable', alerta: 'Revisar', riesgo: 'Riesgo' },

  esPersonal() { return !!(Empresas.activa && Empresas.activa.sector === 'Personal'); },

  render(el) {
    document.getElementById('titulo-pagina').textContent = 'Mis finanzas personales';
    document.getElementById('subtitulo-pagina').textContent = 'Resumen de tu presupuesto: ingresos, gastos, ahorro y meta';
    const emp = Empresas.activa || {};

    // Si todavía no se ha guardado nada, se invita a empezar
    const guardado = Datos.leer('personal', null);
    const hay = guardado && ((guardado.ingresos || []).length || (guardado.gastos || []).length);
    if (!hay) {
      el.innerHTML = '<div class="dash">' + Dashboard.hero({
        ant: emp.nombre || 'Finanzas personales', titulo: 'Empieza tu presupuesto',
        sub: 'Todavía no registras ingresos ni gastos. Anótalos en Presupuesto personal y aquí verás tu saldo, tu capacidad de ahorro y en qué se va tu dinero.',
        boton: { href: 'personal', texto: 'Ir a Presupuesto personal' }
      }) + '</div>';
      return;
    }

    const x = Personal.obtener(), c = Personal.calcular(x);
    const razonGasto = c.totalIng ? c.totalGas / c.totalIng : (c.totalGas ? Infinity : 0);
    const nGas = razonGasto <= 0.7 ? 'ok' : (razonGasto <= 0.9 ? 'alerta' : 'riesgo');
    const nSaldo = c.saldo < 0 ? 'riesgo' : (c.saldo >= c.metaMonto ? 'ok' : 'alerta');
    const nCap = isFinite(c.capacidad) ? (c.capacidad >= x.meta / 100 ? 'ok' : (c.capacidad >= 0 ? 'alerta' : 'riesgo')) : null;

    const tarj = (t, v, n, nv) => '<div class="tarjeta dash-kpi ' + (nv || '') + '"><h3>' + t + '</h3><div class="valor">' + v + '</div>' +
      '<div class="nota">' + n + '</div>' + (nv ? '<div class="dash-chips"><span class="chip ' + nv + '">' + PanelPersonal.ETQ[nv] + '</span></div>' : '') + '</div>';

    // Barra de progreso de la meta de ahorro
    const prog = c.metaMonto > 0 ? Math.max(0, Math.min(1, c.saldo / c.metaMonto)) : 0;
    const barra = '<div class="pp-barra ' + nSaldo + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(prog * 100) + '">' +
      '<span style="width:' + (prog * 100).toFixed(1) + '%"></span></div>' +
      '<p class="nota-pie">' + Fmt.moneda(Math.max(0, c.saldo)) + ' disponibles de una meta de ' + Fmt.moneda(c.metaMonto) + ' (' + Fmt.num(prog * 100, 0) + ' %)</p>';

    // Avisos sencillos
    const av = [];
    if (c.totalIng === 0 && c.totalGas > 0) av.push({ nivel: 'riesgo', texto: 'Registraste gastos pero ningún ingreso. Agrega tus ingresos para ver tu capacidad de ahorro.' });
    if (c.saldo < 0) av.push({ nivel: 'riesgo', texto: 'Gastas ' + Fmt.moneda(-c.saldo) + ' más de lo que ganas. Recorta gastos o aumenta tus ingresos.' });
    else if (c.totalIng && c.saldo < c.metaMonto) av.push({ nivel: 'alerta', texto: 'No llegas a tu meta de ahorro: te faltan ' + Fmt.moneda(c.metaMonto - c.saldo) + '.' });
    else if (c.totalIng) av.push({ nivel: 'ok', texto: 'Cumples tu meta de ahorro de ' + Fmt.moneda(c.metaMonto) + '.' });
    if (c.totalIng && c.saldo >= 0 && razonGasto > 0.8) av.push({ nivel: 'alerta', texto: 'Tus gastos son el ' + Fmt.pct(razonGasto) + ' de tus ingresos.' });
    const mayor = c.porCat.slice().sort((a, b) => b.m - a.m)[0];
    if (mayor && c.totalGas) {
      const parte = mayor.m / c.totalGas;
      av.push({ nivel: parte > 0.5 ? 'alerta' : 'ok', texto: 'Tu mayor gasto es ' + mayor.c + ': ' + Fmt.pct(parte) + ' de tus gastos.' });
    }
    const lista = av.map(i => '<div class="dash-item ' + i.nivel + '">' + esc(i.texto) + '</div>').join('');

    const tabla = '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Categoría</th><th>Monto</th><th>% de gastos</th></tr>' +
      c.porCat.map(z => '<tr><td>' + esc(z.c) + '</td><td>' + Fmt.moneda(z.m) + '</td><td>' + Fmt.pct(c.totalGas ? z.m / c.totalGas : NaN) + '</td></tr>').join('') +
      '<tr class="total"><td>Total</td><td>' + Fmt.moneda(c.totalGas) + '</td><td>' + (c.totalGas ? '100.00 %' : '—') + '</td></tr></table></div>';

    const saldoTxt = c.saldo < 0 ? 'Este mes vas con saldo negativo: revisa tus gastos.' : 'Vas bien: te queda ' + Fmt.moneda(c.saldo) + ' disponible este mes.';

    el.innerHTML =
      '<div class="dash" style="margin-bottom:16px">' + Dashboard.hero({
        ant: emp.nombre || 'Finanzas personales', titulo: 'Hola, así va tu presupuesto', sub: saldoTxt
      }) + '</div>' +
      '<div class="rejilla">' +
        tarj('Total de ingresos', Fmt.moneda(c.totalIng), 'Suma de tus ingresos del mes', null) +
        tarj('Total de gastos', Fmt.moneda(c.totalGas), 'Suma de tus gastos del mes', nGas) +
        tarj('Saldo disponible', Fmt.moneda(c.saldo), 'Ingresos − Gastos', nSaldo) +
        tarj('Capacidad de ahorro', Fmt.pct(c.capacidad), 'Saldo ÷ Ingresos (tu meta: ' + Fmt.num(x.meta, 0) + ' %)', nCap) +
      '</div>' +
      '<div class="dos-col" style="margin-top:16px">' +
        '<div class="tarjeta"><h3>Meta de ahorro</h3>' + barra + '<div class="dash-lista">' + lista + '</div></div>' +
        '<div class="tarjeta"><h3>Distribución de los gastos</h3>' +
          (c.porCat.length ? '<div class="grafico"><canvas id="pp-grafico"></canvas></div>' : '<p class="nota-pie">Todavía no hay gastos registrados.</p>') + '</div>' +
      '</div>' +
      '<div class="tarjeta" style="margin-top:16px"><h3>Gastos por categoría</h3>' + tabla + '</div>' +
      '<div class="barra-acciones" style="margin-top:16px"><a class="btn" href="#personal">Editar presupuesto</a></div>';

    const lienzo = el.querySelector('#pp-grafico');
    if (lienzo && typeof Chart !== 'undefined') {
      const P = (typeof Tema !== 'undefined') ? Tema.paleta() : { marino: '#1f3a5f', acento: '#3f6fa3', claro: '#9db4d0', ok: '#3d8b6a', malo: '#b25555' };
      new Chart(lienzo, {
        type: 'doughnut',
        data: { labels: c.porCat.map(z => z.c),
          datasets: [{ data: c.porCat.map(z => z.m), backgroundColor: [P.marino, P.acento, P.claro, P.ok, '#c08a2e', P.malo, '#6b7788', '#c9d5e3'] }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: t => {
                  const total = t.dataset.data.reduce((s, v) => s + v, 0);
                  return t.label + ': ' + Fmt.moneda(t.raw) + (total ? ' (' + Fmt.pct(t.raw / total) + ')' : '');
                }
              }
            }
          }
        }
      });
    }
  }
};

(function () {
  const base = Modulos.panel.render;
  Modulos.panel.render = function (el) {
    if (PanelPersonal.esPersonal()) {
      try { PanelPersonal.render(el); }
      catch (e) { console.error(e); el.innerHTML = '<div class="aviso">No se pudo dibujar el panel: ' + esc(e.message) + '</div>'; }
      return;
    }
    base.call(this, el);
  };
})();