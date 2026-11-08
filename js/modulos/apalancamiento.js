// Módulo 4: Apalancamiento operativo (GAO), financiero (GAF) y total (GAT)
const Apalancamiento = {
  graf: null,

  ejemplo() {
    // Caso TOR (Gitman): 100,000 u y 120,000 u
    return { u1: 100000, u2: 120000, precio: 7.5, cv: 3, cf: 250000, intereses: 80000,
             dividendosPref: 40000, acciones: 20000, isr: 40 };
  },
  casoClase() {
    // Parámetros elegidos para reproducir GAO 1.2, GAF 5 y GAT 6 con 20,000 y 30,000 unidades
    return { u1: 20000, u2: 30000, precio: 25, cv: 10, cf: 50000, intereses: 200000,
             dividendosPref: 0, acciones: 10000, isr: 40 };
  },
  vacio() {
    return { u1: 0, u2: 0, precio: 0, cv: 0, cf: 0, intereses: 0, dividendosPref: 0, acciones: 0, isr: 0 };
  },
  obtener() { return Datos.leer('apalancamiento', Apalancamiento.ejemplo()); },

  // Aquí se hacen los cálculos de este módulo para UN período con u unidades
  periodo(d, u) {
    const t = d.isr / 100;
    const ventas = d.precio * u;
    const mc = (d.precio - d.cv) * u;                       // margen de contribución total
    const uaii = mc - d.cf;                                 // utilidad antes de intereses e impuestos
    const uai = uaii - d.intereses;
    const impuesto = uai > 0 ? uai * t : 0;
    const un = uai - impuesto;
    const disp = un - d.dividendosPref;                     // utilidad para accionistas comunes
    const upa = d.acciones ? disp / d.acciones : NaN;       // utilidad por acción
    // Fórmulas directas (un solo período)
    const gao = uaii ? mc / uaii : NaN;                     // GAO = MC / UAII
    const baseF = uaii - d.intereses - (t < 1 ? d.dividendosPref / (1 - t) : NaN);
    const gaf = baseF ? uaii / baseF : NaN;                 // GAF = UAII / (UAII - I - DAP/(1-T))
    const gat = gao * gaf;                                  // GAT = GAO x GAF
    return { ventas, mc, uaii, uai, impuesto, un, disp, upa, gao, gaf, gat };
  },

  // Fórmulas por variaciones (dos períodos)
  variaciones(a, b) {
    const v = (x, y) => x ? (y - x) / Math.abs(x) : NaN;
    const dV = v(a.ventas, b.ventas), dU = v(a.uaii, b.uaii), dP = v(a.upa, b.upa);
    return { dV, dU, dP, gao: dU / dV, gaf: dP / dU, gat: dP / dV };
  },

  interpretar(nombre, g, base, resto) {
    if (!isFinite(g)) return 'No se puede calcular (revisa los datos).';
    return 'Si ' + base + ' cambia 1 %, ' + resto + ' cambia ' + Fmt.num(Math.abs(g), 4) + ' %' + (g < 0 ? ' (en sentido contrario)' : '') + '.';
  },

  campo(id, etiqueta, valor) {
    return '<label class="campo corto" style="flex:1;min-width:170px">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + valor + '"></label>';
  },

  dibujar(raiz, vr) {
    if (Apalancamiento.graf) { try { Apalancamiento.graf.destroy(); } catch (x) {} Apalancamiento.graf = null; }
    const c = raiz.querySelector('#ap-grafico');
    if (!c || typeof Chart === 'undefined') return;
    Apalancamiento.graf = new Chart(c, {
      type: 'bar',
      data: { labels: ['Ventas', 'UAII', 'UPA'],
        datasets: [{ label: 'Variación porcentual (%)', data: [vr.dV * 100, vr.dU * 100, vr.dP * 100],
          backgroundColor: ['#9db4d0', '#3f6fa3', '#1f3a5f'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => v + ' %' } } } }
    });
  },

  render(el) {
    const d = Apalancamiento.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">GAO = Margen de contribución ÷ UAII · GAF = UAII ÷ (UAII − Intereses − Dividendos preferentes ÷ (1 − T)) · GAT = GAO × GAF. ' +
      'Con un período se usan las fórmulas directas; con dos períodos se comprueban con las variaciones porcentuales.</div>' +
      '<h2 class="titulo-seccion">Datos de entrada</h2>' +
      '<div class="barra-acciones">' +
        Apalancamiento.campo('ap-u1', 'Unidades vendidas (período 1)', d.u1) +
        Apalancamiento.campo('ap-u2', 'Unidades vendidas (período 2)', d.u2) +
        Apalancamiento.campo('ap-precio', 'Precio unitario (C$)', d.precio) +
        Apalancamiento.campo('ap-cv', 'Costo variable unitario (C$)', d.cv) +
        Apalancamiento.campo('ap-cf', 'Costos fijos (C$)', d.cf) +
      '</div><div class="barra-acciones">' +
        Apalancamiento.campo('ap-int', 'Intereses (C$)', d.intereses) +
        Apalancamiento.campo('ap-dap', 'Dividendos preferentes totales (C$)', d.dividendosPref) +
        Apalancamiento.campo('ap-acc', 'Acciones comunes', d.acciones) +
        Apalancamiento.campo('ap-isr', 'Tasa de impuesto T (%)', d.isr) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="ap-tor">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn" id="ap-clase">Cargar caso 20,000 y 30,000 unidades</button>' +
        '<button class="btn sec" id="ap-eq">Traer costos de Punto de equilibrio</button>' +
        '<button class="btn sec" id="ap-est">Traer intereses e ISR de Estados financieros</button>' +
        '<button class="btn sec peligro" id="ap-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="ap-msg"></div>' +
      '<h2 class="titulo-seccion">Grados de apalancamiento (fórmulas directas, período 1)</h2>' +
      '<div class="cadena" id="ap-cadena"></div>' +
      '<div class="aviso" id="ap-interp"></div>' +
      '<h2 class="titulo-seccion">Estado de resultados por período</h2>' +
      '<div class="tarjeta" id="ap-tabla"></div>' +
      '<h2 class="titulo-seccion">Comprobación por variaciones porcentuales (período 1 → período 2)</h2>' +
      '<div class="cadena" id="ap-var"></div>' +
      '<div id="ap-comp"></div>' +
      '<div class="tarjeta" style="margin-top:14px"><h3>Variación porcentual de ventas, UAII y UPA</h3><div class="grafico"><canvas id="ap-grafico"></canvas></div></div>';
    el.innerHTML = '';
    el.appendChild(raiz);
       const num = id => Fmt.aNum(raiz.querySelector(id).value);

    const leer = () => ({ u1: num('#ap-u1'), u2: num('#ap-u2'), precio: num('#ap-precio'), cv: num('#ap-cv'),
      cf: num('#ap-cf'), intereses: num('#ap-int'), dividendosPref: num('#ap-dap'), acciones: num('#ap-acc'), isr: num('#ap-isr') });
    const tarj = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';

    const refrescar = () => {
      const x = leer();
      Datos.guardar('apalancamiento', x);
      const a = Apalancamiento.periodo(x, x.u1), b = Apalancamiento.periodo(x, x.u2);
      const g = v => Fmt.num(v, 4);
      raiz.querySelector('#ap-cadena').innerHTML =
        tarj('GAO · apalancamiento operativo', g(a.gao), 'Margen de contribución ÷ UAII') + '<span class="op">×</span>' +
        tarj('GAF · apalancamiento financiero', g(a.gaf), 'UAII ÷ (UAII − I − DAP ÷ (1 − T))') + '<span class="op">=</span>' +
        tarj('GAT · apalancamiento total', g(a.gat), 'GAO × GAF');
      raiz.querySelector('#ap-interp').innerHTML =
        '<strong>GAO:</strong> ' + Apalancamiento.interpretar('GAO', a.gao, 'las ventas', 'la UAII') + '<br>' +
        '<strong>GAF:</strong> ' + Apalancamiento.interpretar('GAF', a.gaf, 'la UAII', 'la utilidad por acción (UPA)') + '<br>' +
        '<strong>GAT:</strong> ' + Apalancamiento.interpretar('GAT', a.gat, 'las ventas', 'la UPA') +
        (a.uaii <= 0 ? '<br>La UAII del período 1 es cero o negativa: los grados de apalancamiento pierden sentido.' : '');
      const fila = (n, f, cls) => '<tr class="' + (cls || '') + '"><td>' + n + '</td><td>' + f(a) + '</td><td>' + f(b) + '</td></tr>';
      raiz.querySelector('#ap-tabla').innerHTML = '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>' +
        Fmt.num(x.u1, 0) + ' unid.</th><th>' + Fmt.num(x.u2, 0) + ' unid.</th></tr>' +
        fila('Ventas', p => Fmt.moneda(p.ventas)) +
        fila('Margen de contribución total', p => Fmt.moneda(p.mc)) +
        fila('(−) Costos fijos', () => Fmt.moneda(x.cf)) +
        fila('UAII', p => Fmt.moneda(p.uaii), 'total') +
        fila('(−) Intereses', () => Fmt.moneda(x.intereses)) +
        fila('Utilidad antes de impuestos', p => Fmt.moneda(p.uai)) +
        fila('(−) Impuesto', p => Fmt.moneda(p.impuesto)) +
        fila('Utilidad neta', p => Fmt.moneda(p.un), 'total') +
        fila('(−) Dividendos preferentes', () => Fmt.moneda(x.dividendosPref)) +
        fila('Utilidad para accionistas comunes', p => Fmt.moneda(p.disp)) +
        fila('Utilidad por acción (UPA)', p => Fmt.moneda(p.upa), 'total') +
        '</table></div>';
      const vr = Apalancamiento.variaciones(a, b);
      raiz.querySelector('#ap-var').innerHTML =
        tarj('% cambio en ventas', Fmt.pct(vr.dV), '(Ventas 2 − Ventas 1) ÷ Ventas 1') +
        tarj('% cambio en UAII', Fmt.pct(vr.dU), 'GAO = ' + g(vr.gao) + ' (%ΔUAII ÷ %ΔVentas)') +
        tarj('% cambio en UPA', Fmt.pct(vr.dP), 'GAF = ' + g(vr.gaf) + ' (%ΔUPA ÷ %ΔUAII)') +
        tarj('GAT por variaciones', g(vr.gat), '%ΔUPA ÷ %ΔVentas');
      const igual = (p, q) => isFinite(p) && isFinite(q) && Math.abs(p - q) < 1e-6;
      const ok = igual(a.gao, vr.gao) && igual(a.gaf, vr.gaf) && igual(a.gat, vr.gat);
      raiz.querySelector('#ap-comp').innerHTML = '<div class="cuadre ' + (ok ? 'ok' : 'mal') + '">' + (ok
        ? 'Comprobación: el método directo y el método por variaciones dan el mismo GAO, GAF y GAT.'
        : 'Los dos métodos no coinciden. Pasa cuando hay pérdidas, UAII en cero o faltan datos (por ejemplo, unidades del período 2).') + '</div>';
      Apalancamiento.dibujar(raiz, vr);
    };

    const cargar = (datos, msg) => {
      Datos.guardar('apalancamiento', datos);
      Apalancamiento.render(el); Validar.activar(el);
      if (msg) el.querySelector('#ap-msg').innerHTML = '<div class="cuadre ok">' + msg + '</div>';
    };
    raiz.addEventListener('input', refrescar);
    raiz.querySelector('#ap-tor').addEventListener('click', () => cargar(Apalancamiento.ejemplo()));
    raiz.querySelector('#ap-clase').addEventListener('click', () => cargar(Apalancamiento.casoClase(),
      'Caso con precio 25, costo variable 10, costos fijos 50,000 e intereses 200,000 (datos elegidos para reproducir GAO 1.2, GAF 5 y GAT 6).'));
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