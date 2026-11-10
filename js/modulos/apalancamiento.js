// Módulo 4: Apalancamiento operativo (GAO), financiero (GAF) y total (GAT)
const Apalancamiento = {
  graf: null,

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

  // ── Cálculos para UN período ──────────────────────────────────────────────
  periodo(d, u) {
    const t = d.isr / 100;
    const ventas  = d.precio * u;
    const mc      = (d.precio - d.cv) * u;
    const uaii    = mc - d.cf;
    const uai     = uaii - d.intereses;
    const impuesto= uai > 0 ? uai * t : 0;
    const un      = uai - impuesto;
    const disp    = un - d.dividendosPref;
    const upa     = d.acciones ? disp / d.acciones : NaN;
    // Fórmulas directas
    const gao = (uaii !== 0) ? mc / uaii : NaN;
    const dapAdj  = (t < 1) ? d.dividendosPref / (1 - t) : NaN;
    const baseGaf = isFinite(dapAdj) ? (uaii - d.intereses - dapAdj) : NaN;
    const gaf = (isFinite(baseGaf) && baseGaf !== 0) ? uaii / baseGaf : NaN;
    const gat = (isFinite(gao) && isFinite(gaf)) ? gao * gaf : NaN;
    return { ventas, mc, uaii, uai, impuesto, un, disp, upa, gao, gaf, gat };
  },

  // ── Variaciones porcentuales (dos períodos) ───────────────────────────────
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

  // ── Validaciones y advertencias ───────────────────────────────────────────
  validar(d, a, b) {
    const w = [];
    if (d.precio > 0 && d.cv >= d.precio)
      w.push({ t: 'riesgo', m: 'El costo variable unitario es mayor o igual al precio: la empresa pierde dinero en cada unidad vendida. Los grados de apalancamiento no tienen sentido económico en esta situación.' });
    if (a.uaii === 0)
      w.push({ t: 'riesgo', m: 'La UAII del período 1 es exactamente cero: GAO y GAT no están definidos (división entre cero).' });
    if (a.uaii < 0)
      w.push({ t: 'riesgo', m: 'La UAII del período 1 es negativa (' + Fmt.moneda(a.uaii) + '): la empresa opera con pérdida operativa. El GAO calculado es matemáticamente válido pero su interpretación es contraintuitiva: un aumento en ventas reduciría la pérdida, no la aumentaría.' });
    if (isFinite(a.gaf) && a.uaii > 0 && (a.uaii - d.intereses) <= 0)
      w.push({ t: 'riesgo', m: 'Los intereses superan la UAII (' + Fmt.moneda(d.intereses) + ' vs ' + Fmt.moneda(a.uaii) + '): la empresa no puede cubrir sus gastos financieros con la utilidad operativa.' });
    if (d.intereses > 0 && a.uaii > 0 && d.intereses > a.uaii * 0.5)
      w.push({ t: 'alerta', m: 'Los intereses representan más del 50 % de la UAII. El GAF será alto, lo que amplifica tanto las ganancias como las pérdidas al nivel de los accionistas.' });
    if (isFinite(a.gao) && Math.abs(a.gao) > 5)
      w.push({ t: 'alerta', m: 'GAO elevado (' + Fmt.num(a.gao, 2) + '): un cambio pequeño en ventas produce un cambio mucho mayor en la UAII. Alto riesgo operativo.' });
    if (isFinite(a.gaf) && Math.abs(a.gaf) > 5)
      w.push({ t: 'alerta', m: 'GAF elevado (' + Fmt.num(a.gaf, 2) + '): los gastos financieros fijos amplifican fuertemente las variaciones de la UAII sobre la UPA. Alto riesgo financiero.' });
    if (d.u2 === 0)
      w.push({ t: 'info', m: 'Sin unidades del período 2 no se puede hacer la comprobación por variaciones. Los grados directos sí se calculan.' });
    return w;
  },

  htmlAvisos(lista) {
    return lista.map(w =>
      '<div class="ap-aviso ap-aviso-' + w.t + '">' +
      (w.t === 'riesgo' ? '⛔ ' : w.t === 'alerta' ? '⚠ ' : 'ℹ ') + w.m + '</div>'
    ).join('');
  },

  // ── Paso a paso de cada grado ─────────────────────────────────────────────
  htmlPasos(d, a) {
    const t = d.isr / 100;
    const dapAdj = t < 1 ? d.dividendosPref / (1 - t) : null;
    const baseGaf = dapAdj !== null ? (a.uaii - d.intereses - dapAdj) : (a.uaii - d.intereses);
    return '<details class="ap-detalle"><summary>¿Cómo se calculan paso a paso?</summary>' +
      '<div class="ap-pasos">' +

      '<p><strong>Grado de Apalancamiento Operativo (GAO)</strong><br>' +
      'Mide cuánto amplifica la estructura de costos fijos el efecto de un cambio en ventas sobre la UAII.<br>' +
      'GAO = Margen de contribución ÷ UAII<br>' +
      'GAO = ' + Fmt.moneda(a.mc) + ' ÷ ' + Fmt.moneda(a.uaii) + ' = <strong>' + (isFinite(a.gao) ? Fmt.num(a.gao, 4) : 'N/D') + '</strong><br>' +
      '<em>Interpretación: si las ventas suben 1 %, la UAII sube ' + (isFinite(a.gao) ? Fmt.num(Math.abs(a.gao), 4) : '—') + ' %.</em></p>' +

      '<p><strong>Grado de Apalancamiento Financiero (GAF)</strong><br>' +
      'Mide cuánto amplifica la deuda y los dividendos preferentes el efecto de un cambio en la UAII sobre la UPA.<br>' +
      'GAF = UAII ÷ [UAII − Intereses − (DAP ÷ (1 − T))]<br>' +
      'GAF = ' + Fmt.moneda(a.uaii) + ' ÷ [' + Fmt.moneda(a.uaii) + ' − ' + Fmt.moneda(d.intereses) +
        (d.dividendosPref > 0 ? ' − ' + Fmt.moneda(d.dividendosPref) + ' ÷ (1 − ' + Fmt.num(t, 2) + ')' : '') + ']<br>' +
      'GAF = ' + Fmt.moneda(a.uaii) + ' ÷ ' + Fmt.moneda(baseGaf) + ' = <strong>' + (isFinite(a.gaf) ? Fmt.num(a.gaf, 4) : 'N/D') + '</strong><br>' +
      (d.dividendosPref > 0
        ? '<em>El ajuste DAP ÷ (1 − T) convierte los dividendos preferentes (pagados después de impuestos) a una base antes de impuestos para que sean comparables con la UAII.</em><br>'
        : '') +
      (d.intereses > 0
        ? '<em>Los intereses son un costo fijo financiero: igual que los costos fijos operativos amplifican la UAII, los intereses amplifican el efecto sobre la UPA.</em>'
        : '<em>Sin intereses ni dividendos preferentes, el GAF es 1 (la deuda no amplifica ni reduce el efecto).</em>') + '</p>' +

      '<p><strong>Grado de Apalancamiento Total (GAT)</strong><br>' +
      'Combina el riesgo operativo y el financiero: mide cuánto amplifica la estructura completa un cambio en ventas sobre la UPA.<br>' +
      'GAT = GAO × GAF = ' + (isFinite(a.gao) ? Fmt.num(a.gao, 4) : 'N/D') + ' × ' + (isFinite(a.gaf) ? Fmt.num(a.gaf, 4) : 'N/D') +
      ' = <strong>' + (isFinite(a.gat) ? Fmt.num(a.gat, 4) : 'N/D') + '</strong><br>' +
      '<em>Si las ventas suben 1 %, la UPA sube ' + (isFinite(a.gat) ? Fmt.num(Math.abs(a.gat), 4) : '—') + ' %.</em></p>' +

      '</div></details>';
  },

  // ── Interpretación detallada según nivel de cada grado ───────────────────
  htmlInterpretacion(a) {
    const nivel = g => !isFinite(g) ? null : Math.abs(g) >= 5 ? 'riesgo' : Math.abs(g) >= 2 ? 'alerta' : 'bien';
    const frase = (nombre, g, base, efecto) => {
      if (!isFinite(g)) return '<li><strong>' + nombre + ':</strong> No calculable con los datos actuales.</li>';
      const niv = nivel(g);
      const signo = g < 0 ? ' en sentido contrario' : '';
      let txt = '<strong>' + nombre + ' = ' + Fmt.num(g, 4) + ':</strong> Un cambio del 1 % en ' + base + ' provoca un cambio del ' +
        Fmt.num(Math.abs(g), 4) + ' %' + signo + ' en ' + efecto + '.';
      if (niv === 'riesgo') txt += ' <span class="ap-niv-riesgo">⛔ Riesgo alto: la empresa es muy sensible a variaciones.</span>';
      else if (niv === 'alerta') txt += ' <span class="ap-niv-alerta">⚠ Riesgo moderado: hay amplificación significativa.</span>';
      else txt += ' <span class="ap-niv-bien">✔ Riesgo bajo: la amplificación es moderada.</span>';
      return '<li>' + txt + '</li>';
    };
    return '<ul class="ap-interp-lista">' +
      frase('GAO', a.gao, 'las ventas', 'la UAII (utilidad operativa)') +
      frase('GAF', a.gaf, 'la UAII', 'la UPA (utilidad por acción)') +
      frase('GAT', a.gat, 'las ventas', 'la UPA') +
      '</ul>' +
      (isFinite(a.gao) && isFinite(a.gaf)
        ? '<p class="ap-nota-efecto">Efecto en cadena: las ventas afectan la UAII (amplificadas por el GAO), y la UAII afecta la UPA (amplificada por el GAF). ' +
          'Una empresa con GAT alto puede crecer muy rápido cuando las ventas suben, pero también puede deteriorarse muy rápido si bajan.</p>'
        : '');
  },

  // ── Comparación directas vs variaciones ──────────────────────────────────
  htmlComparacion(a, vr, d) {
    if (!isFinite(vr.dV)) return '<div class="cuadre mal">Sin datos del período 2 no se puede hacer la comprobación por variaciones porcentuales.</div>';
    const igual = (p, q) => isFinite(p) && isFinite(q) && Math.abs(p - q) < 1e-4;
    const fila = (nom, dir, var_) => {
      const ok = igual(dir, var_);
      return '<tr><td>' + nom + '</td>' +
        '<td>' + (isFinite(dir) ? Fmt.num(dir, 4) : 'N/D') + '</td>' +
        '<td>' + (isFinite(var_) ? Fmt.num(var_, 4) : 'N/D') + '</td>' +
        '<td>' + ((!isFinite(dir) || !isFinite(var_)) ? '—' : ok ? '✔' : '✗') + '</td>' +
        '</tr>';
    };
    const todoOk = igual(a.gao, vr.gao) && igual(a.gaf, vr.gaf) && igual(a.gat, vr.gat);
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Grado</th><th>Fórmula directa (P1)</th><th>Variaciones % (P1→P2)</th><th>¿Coinciden?</th></tr>' +
      fila('GAO', a.gao, vr.gao) +
      fila('GAF', a.gaf, vr.gaf) +
      fila('GAT', a.gat, vr.gat) +
      '</table></div>' +
      '<div class="cuadre ' + (todoOk ? 'ok' : 'mal') + '">' + (todoOk
        ? '✔ Comprobación correcta: el método directo y el método por variaciones dan el mismo resultado.'
        : '⚠ Los métodos no coinciden. Esto ocurre cuando hay pérdidas (UAII negativa), la UAII es cero en algún período, o faltan datos del período 2. En esos casos el método directo es el válido.') +
      '</div>';
  },

  campo(id, etiqueta, valor) {
    return '<label class="campo corto" style="flex:1;min-width:170px">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + (valor ?? '') + '"></label>';
  },

  dibujar(raiz, a, b, vr) {
    if (Apalancamiento.graf) { try { Apalancamiento.graf.destroy(); } catch (x) {} Apalancamiento.graf = null; }
    const c = raiz.querySelector('#ap-grafico');
    if (!c || typeof Chart === 'undefined') return;

    const colores = v => v >= 0 ? '#0f5c4d' : '#c0392b';
    const vals = [vr.dV * 100, vr.dU * 100, vr.dP * 100];
    Apalancamiento.graf = new Chart(c, {
      type: 'bar',
      data: {
        labels: ['Δ Ventas', 'Δ UAII', 'Δ UPA'],
        datasets: [{
          label: 'Variación %',
          data: vals,
          backgroundColor: vals.map(colores)
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' ' + Fmt.num(ctx.raw, 2) + ' %' } }
        },
        scales: { y: { ticks: { callback: v => v + ' %' } } }
      }
    });
  },

  render(el) {
    const d = Apalancamiento.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">' +
        'El apalancamiento mide cuánto amplifica la estructura de costos e intereses el efecto de los cambios en ventas. ' +
        '<strong>GAO</strong> (riesgo operativo) = MC ÷ UAII · ' +
        '<strong>GAF</strong> (riesgo financiero) = UAII ÷ (UAII − I − DAP/(1−T)) · ' +
        '<strong>GAT</strong> = GAO × GAF.' +
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
        Apalancamiento.campo('ap-int',   'Intereses (C$)', d.intereses) +
        Apalancamiento.campo('ap-dap',   'Dividendos preferentes totales (C$)', d.dividendosPref) +
        Apalancamiento.campo('ap-acc',   'Acciones comunes', d.acciones) +
        Apalancamiento.campo('ap-isr',   'Tasa de impuesto T (%)', d.isr) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="ap-tor">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn" id="ap-clase">Cargar caso 20,000 / 30,000 unidades</button>' +
        '<button class="btn sec" id="ap-eq">Traer costos de Punto de equilibrio</button>' +
        '<button class="btn sec" id="ap-est">Traer intereses e ISR de Estados financieros</button>' +
        '<button class="btn sec peligro" id="ap-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="ap-msg"></div>' +
      '<div id="ap-avisos"></div>' +

      '<h2 class="titulo-seccion">Grados de apalancamiento — período 1 (fórmulas directas)</h2>' +
      '<div class="cadena" id="ap-cadena"></div>' +
      '<div id="ap-interp" style="margin-top:12px"></div>' +
      '<div id="ap-pasos" style="margin-top:10px"></div>' +

      '<h2 class="titulo-seccion">Estado de resultados por período</h2>' +
      '<div class="tarjeta" id="ap-tabla"></div>' +

      '<h2 class="titulo-seccion">Comprobación por variaciones porcentuales (P1 → P2)</h2>' +
      '<div class="cadena" id="ap-var"></div>' +
      '<div id="ap-comp" style="margin-top:10px"></div>' +

      '<h2 class="titulo-seccion">Variación % de ventas, UAII y UPA</h2>' +
      '<div class="tarjeta"><div class="grafico"><canvas id="ap-grafico"></canvas></div></div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    const num = id => Fmt.aNum(raiz.querySelector(id).value);
    const leer = () => ({
      u1: num('#ap-u1'), u2: num('#ap-u2'), precio: num('#ap-precio'), cv: num('#ap-cv'),
      cf: num('#ap-cf'), intereses: num('#ap-int'), dividendosPref: num('#ap-dap'),
      acciones: num('#ap-acc'), isr: num('#ap-isr')
    });
    const tarj = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
    const g4 = v => isFinite(v) ? Fmt.num(v, 4) : 'N/D';

    const refrescar = () => {
      const x = leer();
      Datos.guardar('apalancamiento', x);
      const a = Apalancamiento.periodo(x, x.u1);
      const b = Apalancamiento.periodo(x, x.u2);
      const vr = Apalancamiento.variaciones(a, b);

      // Avisos
      raiz.querySelector('#ap-avisos').innerHTML = Apalancamiento.htmlAvisos(Apalancamiento.validar(x, a, b));

      // Cadena de tarjetas
      raiz.querySelector('#ap-cadena').innerHTML =
        tarj('GAO · operativo', g4(a.gao), 'MC ÷ UAII · período 1') + '<span class="op">×</span>' +
        tarj('GAF · financiero', g4(a.gaf), 'UAII ÷ (UAII − I − DAP/(1−T))') + '<span class="op">=</span>' +
        tarj('GAT · total', g4(a.gat), 'GAO × GAF');

      // Interpretación detallada
      raiz.querySelector('#ap-interp').innerHTML = Apalancamiento.htmlInterpretacion(a);

      // Paso a paso
      raiz.querySelector('#ap-pasos').innerHTML = Apalancamiento.htmlPasos(x, a);

      // Tabla de resultados
      const fila = (n, f, cls) => '<tr class="' + (cls || '') + '"><td>' + n + '</td><td>' + f(a) + '</td><td>' + f(b) + '</td></tr>';
      raiz.querySelector('#ap-tabla').innerHTML =
        '<div class="tabla-scroll"><table class="tabla-datos">' +
        '<tr><th>Concepto</th><th>' + Fmt.num(x.u1, 0) + ' unidades (P1)</th><th>' + Fmt.num(x.u2, 0) + ' unidades (P2)</th></tr>' +
        fila('Ventas totales',                p => Fmt.moneda(p.ventas)) +
        fila('(−) Costos variables',          () => x.u1 ? Fmt.moneda(x.cv * x.u1) + ' / ' + Fmt.moneda(x.cv * x.u2) : '—') +
        fila('Margen de contribución total',  p => Fmt.moneda(p.mc)) +
        fila('(−) Costos fijos',              () => Fmt.moneda(x.cf)) +
        fila('UAII',                          p => Fmt.moneda(p.uaii), 'total') +
        fila('(−) Intereses',                 () => Fmt.moneda(x.intereses)) +
        fila('UAI (antes de impuestos)',       p => Fmt.moneda(p.uai)) +
        fila('(−) Impuesto (' + Fmt.num(x.isr, 0) + ' %)',  p => Fmt.moneda(p.impuesto)) +
        fila('Utilidad neta',                 p => Fmt.moneda(p.un), 'total') +
        fila('(−) Dividendos preferentes',    () => Fmt.moneda(x.dividendosPref)) +
        fila('Utilidad para accionistas',     p => Fmt.moneda(p.disp)) +
        fila('UPA (' + Fmt.num(x.acciones, 0) + ' acc.)',   p => isFinite(p.upa) ? Fmt.moneda(p.upa) : '—', 'total') +
        '</table></div>' +
        (a.uaii < 0 || b.uaii < 0
          ? '<p class="nota-pie">⚠ Uno o ambos períodos presentan UAII negativa (pérdida operativa). El GAO y GAT tienen signo negativo, lo cual significa que si las ventas suben, la pérdida se reduce; si bajan, la pérdida aumenta.</p>'
          : '');

      // Variaciones
      raiz.querySelector('#ap-var').innerHTML =
        tarj('% cambio en ventas',   isFinite(vr.dV) ? Fmt.pct(vr.dV) : 'N/D', 'Período 1 → Período 2') +
        tarj('% cambio en UAII',     isFinite(vr.dU) ? Fmt.pct(vr.dU) : 'N/D', 'GAO verificado = ' + g4(vr.gao)) +
        tarj('% cambio en UPA',      isFinite(vr.dP) ? Fmt.pct(vr.dP) : 'N/D', 'GAF verificado = ' + g4(vr.gaf)) +
        tarj('GAT por variaciones',  g4(vr.gat), '%ΔUPA ÷ %ΔVentas');

      // Comparación
      raiz.querySelector('#ap-comp').innerHTML = Apalancamiento.htmlComparacion(a, vr, x);

      // Gráfico
      Apalancamiento.dibujar(raiz, a, b, vr);
    };

    const cargar = (datos, msg) => {
      Datos.guardar('apalancamiento', datos);
      Apalancamiento.render(el); Validar.activar(el);
      if (msg) el.querySelector('#ap-msg').innerHTML = '<div class="cuadre ok">' + msg + '</div>';
    };

    raiz.addEventListener('input', refrescar);
    raiz.querySelector('#ap-tor').addEventListener('click', () => cargar(Apalancamiento.ejemplo()));
    raiz.querySelector('#ap-clase').addEventListener('click', () => cargar(Apalancamiento.casoClase(),
      'Caso: precio 25, CV 10, CF 50,000, intereses 200,000 → GAO 1.2 · GAF 5 · GAT 6.'));
    raiz.querySelector('#ap-limpiar').addEventListener('click', () => {
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
      x.isr = Number(est.isr) || 0;
      cargar(x, 'Intereses (año ' + est.anios[1] + ') e ISR tomados de los Estados financieros.');
    });
    refrescar();
  }
};

Modulos.apalancamiento = {
  titulo: 'Apalancamiento',
  subtitulo: 'Grado de apalancamiento operativo, financiero y total',
  render(el) { Apalancamiento.render(el); }
};