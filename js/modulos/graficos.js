// FASE 4B: Gráficos financieros (comparación, cascada, tendencia y estructura de financiamiento)
const Graficos = {
  C: Tema.paleta(),

  corto(v) {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    return s + (a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + ' M' : a >= 1e3 ? (a / 1e3).toFixed(0) + ' mil' : a.toFixed(0));
  },

  // Datos de TODOS los períodos de la empresa (usa la capa de compatibilidad de Estados)
  datos() {
    const raw = Estados.leerCrudo(), ps = Empresas.periodos || [], ids = ps.map(p => p.id);
    const d = Estados.compat(raw, ids), r = Estados.calcular(d);
    const par = Seleccion.ids();
    // vacio[i] = true si el período i no tiene ningún monto escrito
    const vacio = r.map((x, i) => !x.totalActivo && !x.totalPasivo && !x.patrimonio && !x.utilidadNeta && !(Number(d.er.ventas[i]) || 0));
    return { d, r, vacio, etq: ps.map(p => p.etiqueta), ia: ids.indexOf(par[0]), ib: ids.indexOf(par[1]) };
  },

  opciones(extra) {
    const base = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: x => (x.dataset.label ? x.dataset.label + ': ' : '') + Fmt.moneda(x.raw) } } },
      scales: { y: { ticks: { callback: v => Graficos.corto(v) } } }
    };
    return Object.assign(base, extra || {});
  },

  // Cascada: de las ventas a la utilidad neta del período analizado
  cascada(canvas, D) {
    const { d, r, ib } = D, C = Graficos.C, e = k => Number(d.er[k][ib]) || 0;
    let nivel = 0;
    const etq = [], barras = [], reales = [], colores = [];
    const total = (n, v) => { etq.push(n); barras.push([Math.min(0, v), Math.max(0, v)]); reales.push(v); colores.push(C.marino); nivel = v; };
    const delta = (n, v) => { const a = nivel, b = nivel + v; etq.push(n); barras.push([Math.min(a, b), Math.max(a, b)]); reales.push(v); colores.push(v >= 0 ? C.ok : C.malo); nivel = b; };
    total('Ventas', e('ventas'));
    delta('Costo de ventas', -e('costoVentas'));
    total('Utilidad bruta', nivel);
    delta('Gastos operativos', -(e('gastosVenta') + e('gastosAdmin') + e('depreciacion')));
    total('UAII', nivel);
    delta('Intereses y otros', e('otrosIngresos') - e('intereses'));
    delta('Impuesto', -r[ib].impuesto);
    total('Utilidad neta', nivel);
    new Chart(canvas, {
      type: 'bar',
      data: { labels: etq, datasets: [{ data: barras, backgroundColor: colores, borderRadius: 3 }] },
      options: Graficos.opciones({
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => Fmt.moneda(reales[x.dataIndex]) } } }
      })
    });
  },

  tendencia(canvas, D) {
    const { d, r, etq, vacio } = D, C = Graficos.C;
    const lin = (nombre, datos, color) => ({ label: nombre, data: datos.map((v, i) => (vacio[i] ? null : v)), borderColor: color, backgroundColor: color, tension: .25, pointRadius: 4, spanGaps: false });
    new Chart(canvas, {
      type: 'line',
      data: { labels: etq, datasets: [
        lin('Ventas', d.er.ventas.map(Number), C.marino),
        lin('Utilidad bruta', r.map(x => x.utilidadBruta), C.acento),
        lin('Utilidad neta', r.map(x => x.utilidadNeta), C.ok)] },
      options: Graficos.opciones()
    });
  },

  estructura(canvas, D) {
    const { r, etq, vacio } = D, C = Graficos.C;
    const serie = (n, f, color) => ({ label: n, data: r.map((x, i) => (vacio[i] ? null : f(x))), backgroundColor: color });
    new Chart(canvas, {
      type: 'bar',
      data: { labels: etq, datasets: [
        serie('Pasivo corriente', x => x.pc, C.malo), serie('Pasivo no corriente', x => x.pnc, C.claro), serie('Patrimonio', x => x.patrimonio, C.marino)] },
      options: Graficos.opciones({ scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => Graficos.corto(v) } } } })
    });
  },

  comparar(canvas, D) {
    const { d, r, ia, ib } = D, C = Graficos.C;
    const f = p => [Number(d.er.ventas[p]) || 0, r[p].utilidadBruta, r[p].uaii, r[p].utilidadNeta];
    new Chart(canvas, {
      type: 'bar',
      data: { labels: ['Ventas', 'Utilidad bruta', 'UAII', 'Utilidad neta'], datasets: [
        { label: d.anios[ia], data: f(ia), backgroundColor: C.claro },
        { label: d.anios[ib], data: f(ib), backgroundColor: C.marino }] },
      options: Graficos.opciones()
    });
  },

  render(el) {
    if (typeof Chart === 'undefined') { el.innerHTML = '<div class="aviso">No se encontró librerias/chart.umd.js.</div>'; return; }
    const D = Graficos.datos();
    if (D.ia < 0 || D.ib < 0 || D.vacio.every(Boolean)) {
      el.innerHTML = '<div class="aviso">Todavía no hay montos. Escríbelos en Estados financieros y vuelve aquí.</div>';
      return;
    }
    // Si falta algún dato, la tarjeta muestra un mensaje en vez de un gráfico vacío
    const caja = (id, titulo, nota, faltaMsg) => '<div class="tarjeta"><h3>' + titulo + '</h3>' + (nota ? '<p class="nota-pie">' + nota + '</p>' : '') +
      (faltaMsg ? '<div class="aviso">' + faltaMsg + '</div>'
                : '<div style="position:relative;height:320px"><canvas id="' + id + '"></canvas></div>') + '</div>';
    const nb = esc(D.d.anios[D.ia]), na = esc(D.d.anios[D.ib]);
    const vacA = D.vacio[D.ib], vacB = D.vacio[D.ia];
    const msgA = vacA ? 'El período analizado (' + na + ') no tiene montos. Escríbelos en Estados financieros.' : '';
    const msgC = (vacA || vacB) ? 'Para comparar, los dos períodos necesitan montos (' + (vacB ? nb : na) + ' está vacío).' : '';
    el.innerHTML =
      '<div class="aviso">Gráficos con los datos de Estados financieros. La comparación y la cascada usan el par de períodos elegido en el menú lateral (' +
        nb + ' vs ' + na + '); la tendencia y la estructura muestran todos los períodos.</div>' +
      '<div style="margin-top:16px">' + caja('gr-cascada', 'Cascada: de las ventas a la utilidad neta (' + na + ')',
        'Azul: totales. Verde: aumentos. Rojo: lo que se resta.', msgA) + '</div>' +
       '<div class="dos-col" style="margin-top:16px">' + caja('gr-comparar', 'Comparación de períodos', 'Compara las mismas cuentas en dos períodos, una al lado de la otra.', msgC) + caja('gr-tendencia', 'Tendencia por período', 'Cómo subió o bajó cada cuenta período a período.') + '</div>' +
      '<div style="margin-top:16px">' + caja('gr-estructura', 'Estructura de financiamiento por período', 'Pasivo corriente + pasivo no corriente + patrimonio = total del activo.') + '</div>';
    const q = id => el.querySelector('#' + id);
    if (q('gr-cascada')) Graficos.cascada(q('gr-cascada'), D);
    if (q('gr-comparar')) Graficos.comparar(q('gr-comparar'), D);
    Graficos.tendencia(q('gr-tendencia'), D); Graficos.estructura(q('gr-estructura'), D);
  }
};

// Registro en el menú (grupo Reportes) y en los módulos
(function () {
  const item = { id: 'graficos', nombre: 'Gráficos', icono: 'barras' };
  const sec = SECCIONES.find(s => s.titulo === 'Reportes');
  if (sec) sec.items.unshift(item); else SECCIONES.push({ titulo: 'Reportes', items: [item] });
})();
Modulos.graficos = {
  titulo: 'Gráficos',
  subtitulo: 'Cascada, comparación de períodos, tendencia y estructura de financiamiento',
  render(el) { Graficos.render(el); }
};