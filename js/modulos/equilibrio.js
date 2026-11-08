// Módulo 3: Punto de equilibrio y Costo-Volumen-Utilidad (C-V-U)
const Equilibrio = {
  graf: null,
  temporizador: null,

  ejemplo() {
    // Caso TOR (Gitman): 100,000 u a 7.50, CV 3.00, CF 250,000
    return { unidades: 100000, precio: 7.5, cv: 3, cf: 250000, meta: 100000,
             esc: { precio: 0, cv: 0, cf: 0, volumen: 20 } };
  },
  vacio() {
    return { unidades: 0, precio: 0, cv: 0, cf: 0, meta: 0, esc: { precio: 0, cv: 0, cf: 0, volumen: 0 } };
  },
  obtener() { return Datos.leer('equilibrio', Equilibrio.ejemplo()); },

  // Aquí se hacen los cálculos de este módulo. p = {precio, cv, cf, unidades}
  calcular(p, meta) {
    const mc = p.precio - p.cv;                                   // margen de contribución unitario
    const mcPct = p.precio ? mc / p.precio : NaN;                 // margen de contribución en %
    const peU = mc > 0 ? p.cf / mc : NaN;                         // PE en unidades = CF / (P - CV)
    const peC = mcPct > 0 ? p.cf / mcPct : NaN;                   // PE en C$ = CF / MC%
    const ventas = p.precio * p.unidades;
    const costoVar = p.cv * p.unidades;
    const mcTotal = ventas - costoVar;
    const uaii = mcTotal - p.cf;                                  // utilidad operativa
    const ms = p.unidades ? (p.unidades - peU) / p.unidades : NaN; // margen de seguridad
    const uMeta = mc > 0 ? (p.cf + (meta || 0)) / mc : NaN;       // unidades para una utilidad deseada
    return { mc, mcPct, peU, peC, ventas, costoVar, mcTotal, uaii, ms, uMeta };
  },

  escenario(d) {
    const f = x => 1 + (Number(x) || 0) / 100;
    return { precio: d.precio * f(d.esc.precio), cv: d.cv * f(d.esc.cv),
             cf: d.cf * f(d.esc.cf), unidades: d.unidades * f(d.esc.volumen) };
  },

  tablaResultados(b, e, pb, pe) {
    const filas = [
      ['Precio de venta unitario', Fmt.moneda(pb.precio), Fmt.moneda(pe.precio)],
      ['Costo variable unitario', Fmt.moneda(pb.cv), Fmt.moneda(pe.cv)],
      ['Costos fijos totales', Fmt.moneda(pb.cf), Fmt.moneda(pe.cf)],
      ['Unidades vendidas', Fmt.num(pb.unidades, 0), Fmt.num(pe.unidades, 0)],
      ['Margen de contribución unitario', Fmt.moneda(b.mc), Fmt.moneda(e.mc)],
      ['Margen de contribución (%)', Fmt.pct(b.mcPct), Fmt.pct(e.mcPct)],
      ['Ventas totales', Fmt.moneda(b.ventas), Fmt.moneda(e.ventas)],
      ['Margen de contribución total', Fmt.moneda(b.mcTotal), Fmt.moneda(e.mcTotal)],
      ['Utilidad operativa (UAII)', Fmt.moneda(b.uaii), Fmt.moneda(e.uaii)],
      ['PUNTO DE EQUILIBRIO (unidades)', Fmt.num(b.peU, 2), Fmt.num(e.peU, 2)],
      ['PUNTO DE EQUILIBRIO (C$)', Fmt.moneda(b.peC), Fmt.moneda(e.peC)],
      ['Margen de seguridad', Fmt.pct(b.ms), Fmt.pct(e.ms)]
    ];
    return '<div class="tabla-scroll"><table class="tabla-datos"><tr><th>Concepto</th><th>Caso base</th><th>Escenario</th></tr>' +
      filas.map(f => '<tr class="' + (f[0].indexOf('PUNTO') === 0 ? 'total' : '') + '"><td>' + f[0] + '</td><td>' + f[1] + '</td><td>' + f[2] + '</td></tr>').join('') +
      '</table></div>';
  },

  interpretacion(b, e, p) {
    if (!(b.mc > 0)) return 'El precio debe ser mayor que el costo variable unitario; si no, cada venta pierde dinero y no existe punto de equilibrio.';
    let t = 'La empresa necesita vender ' + Fmt.num(b.peU, 2) + ' unidades (' + Fmt.moneda(b.peC) + ') para no ganar ni perder. ';
    if (b.uaii >= 0) {
      t += 'Con ' + Fmt.num(p.unidades, 0) + ' unidades vendidas queda por encima del equilibrio: gana ' + Fmt.moneda(b.uaii) +
           ' antes de intereses e impuestos y las ventas pueden caer ' + Fmt.pct(b.ms) + ' antes de entrar en pérdida.';
    } else {
      t += 'Con ' + Fmt.num(p.unidades, 0) + ' unidades vendidas está por debajo del equilibrio: pierde ' + Fmt.moneda(-b.uaii) + '.';
    }
    if (e.peU === e.peU && Math.abs(e.peU - b.peU) > 1e-9) {
      t += ' En el escenario el equilibrio pasa a ' + Fmt.num(e.peU, 2) + ' unidades y la utilidad operativa a ' + Fmt.moneda(e.uaii) + '.';
    }
    return t;
  },

  dibujarGrafico(raiz, pb, pe, b, e) {
    if (Equilibrio.graf) { try { Equilibrio.graf.destroy(); } catch (x) {} Equilibrio.graf = null; }
    const caja = raiz.querySelector('#eq-grafico');
    if (typeof Chart === 'undefined') { caja.parentNode.innerHTML = '<div class="aviso">No se encontró librerias/chart.umd.js.</div>'; return; }
    const tope = Math.max(pb.unidades, pe.unidades, isFinite(b.peU) ? b.peU * 1.6 : 0, isFinite(e.peU) ? e.peU * 1.6 : 0, 10);
    const pasos = 12, xs = [];
    for (let i = 0; i <= pasos; i++) xs.push(Math.round(tope * i / pasos));
    const lin = (p, f) => xs.map(q => f(p, q));
    const ing = (p, q) => p.precio * q, tot = (p, q) => p.cf + p.cv * q, fijo = (p) => p.cf;
    const hay = Math.abs(pe.precio - pb.precio) + Math.abs(pe.cv - pb.cv) + Math.abs(pe.cf - pb.cf) > 1e-9;
    const ds = [
      { label: 'Ingresos (base)', data: lin(pb, ing), borderColor: '#1f3a5f', backgroundColor: '#1f3a5f' },
      { label: 'Costos totales (base)', data: lin(pb, tot), borderColor: '#b25555', backgroundColor: '#b25555' },
      { label: 'Costos fijos', data: lin(pb, fijo), borderColor: '#9db4d0', backgroundColor: '#9db4d0', borderDash: [4, 4] }
    ];
    if (hay) {
      ds.push({ label: 'Ingresos (escenario)', data: lin(pe, ing), borderColor: '#3f6fa3', backgroundColor: '#3f6fa3', borderDash: [8, 4] });
      ds.push({ label: 'Costos totales (escenario)', data: lin(pe, tot), borderColor: '#c08a2e', backgroundColor: '#c08a2e', borderDash: [8, 4] });
    }
    ds.forEach(x => { x.pointRadius = 0; x.borderWidth = 2; x.tension = 0; });
    Equilibrio.graf = new Chart(caja, {
      type: 'line',
      data: { labels: xs.map(x => Fmt.num(x, 0)), datasets: ds },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { title: { display: true, text: 'Unidades vendidas' } },
                  y: { title: { display: true, text: 'C$' }, ticks: { callback: v => (v / 1e6).toFixed(2) + ' M' } } } }
    });
  },

  campo(id, etiqueta, valor, corto) {
    return '<label class="campo' + (corto ? ' corto' : '') + '">' + etiqueta +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + valor + '"></label>';
  },

  render(el) {
    const d = Equilibrio.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">Punto de equilibrio: Q = Costos fijos ÷ (Precio − Costo variable unitario). En C$: Costos fijos ÷ Margen de contribución %. ' +
      'Los datos se ingresan aquí; también puedes traer los costos desde los Estados financieros.</div>' +
      '<h2 class="titulo-seccion">Datos de entrada</h2>' +
      '<div class="barra-acciones">' +
        Equilibrio.campo('eq-precio', 'Precio de venta unitario (C$)', d.precio) +
        Equilibrio.campo('eq-cv', 'Costo variable unitario (C$)', d.cv) +
        Equilibrio.campo('eq-cf', 'Costos fijos totales (C$)', d.cf) +
        Equilibrio.campo('eq-unidades', 'Unidades vendidas', d.unidades) +
        Equilibrio.campo('eq-meta', 'Utilidad deseada (C$)', d.meta) +
      '</div>' +
      '<div class="barra-acciones">' +
        '<button class="btn" id="eq-ejemplo">Cargar caso TOR (Gitman)</button>' +
        '<button class="btn sec" id="eq-estados">Tomar costos de Estados financieros</button>' +
        '<button class="btn sec peligro" id="eq-limpiar">Limpiar datos</button>' +
      '</div>' +
      '<div id="eq-aviso-estados"></div>' +
      '<h2 class="titulo-seccion">Escenario: ¿qué pasa si cambia...? (variación en %)</h2>' +
      '<div class="barra-acciones">' +
        Equilibrio.campo('eq-e-precio', 'Precio (%)', d.esc.precio, true) +
        Equilibrio.campo('eq-e-cv', 'Costo variable (%)', d.esc.cv, true) +
        Equilibrio.campo('eq-e-cf', 'Costos fijos (%)', d.esc.cf, true) +
        Equilibrio.campo('eq-e-vol', 'Volumen (%)', d.esc.volumen, true) +
      '</div>' +
      '<div class="rejilla" id="eq-tarjetas"></div>' +
      '<h2 class="titulo-seccion">Resultados</h2>' +
      '<div class="tarjeta" id="eq-tabla"></div>' +
      '<div class="aviso" id="eq-interp" style="margin-top:14px"></div>' +
      '<h2 class="titulo-seccion">Gráfica del punto de equilibrio</h2>' +
      '<div class="tarjeta"><div class="grafico"><canvas id="eq-grafico"></canvas></div></div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const num = id => Fmt.aNum(raiz.querySelector(id).value);
    const leer = () => ({
      precio: num('#eq-precio'), cv: num('#eq-cv'), cf: num('#eq-cf'),
      unidades: num('#eq-unidades'), meta: num('#eq-meta'),
      esc: { precio: num('#eq-e-precio'), cv: num('#eq-e-cv'), cf: num('#eq-e-cf'), volumen: num('#eq-e-vol') }
    });

    const refrescar = () => {
      const x = leer();
      Datos.guardar('equilibrio', x);
      const pb = { precio: x.precio, cv: x.cv, cf: x.cf, unidades: x.unidades };
      const pe = Equilibrio.escenario(x);
      const b = Equilibrio.calcular(pb, x.meta), e = Equilibrio.calcular(pe, x.meta);
      const t = (tt, v, n) => '<div class="tarjeta"><h3>' + tt + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
      raiz.querySelector('#eq-tarjetas').innerHTML =
        t('Punto de equilibrio (unidades)', Fmt.num(b.peU, 2), 'Costos fijos ÷ margen de contribución unitario') +
        t('Punto de equilibrio (C$)', Fmt.moneda(b.peC), 'Costos fijos ÷ margen de contribución %') +
        t('Margen de contribución', Fmt.pct(b.mcPct), Fmt.moneda(b.mc) + ' por unidad') +
        t('Unidades para la utilidad deseada', Fmt.num(b.uMeta, 2), '(Costos fijos + utilidad deseada) ÷ margen unitario');
      raiz.querySelector('#eq-tabla').innerHTML = Equilibrio.tablaResultados(b, e, pb, pe);
      raiz.querySelector('#eq-interp').textContent = Equilibrio.interpretacion(b, e, pb);
      // El gráfico espera una pequeña pausa después de la última tecla, para no destruir
      // y crear el gráfico en cada pulsación (eso era lo que a veces lo dejaba sin dibujar).
      clearTimeout(Equilibrio.temporizador);
      Equilibrio.temporizador = setTimeout(() => Equilibrio.dibujarGrafico(raiz, pb, pe, b, e), 200);
    };

    raiz.addEventListener('input', refrescar);
    raiz.querySelector('#eq-ejemplo').addEventListener('click', () => {
      Datos.guardar('equilibrio', Equilibrio.ejemplo()); Equilibrio.render(el); Validar.activar(el);
    });
    raiz.querySelector('#eq-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos del punto de equilibrio?')) {
        Datos.guardar('equilibrio', Equilibrio.vacio()); Equilibrio.render(el); Validar.activar(el);
      }
    });
    raiz.querySelector('#eq-estados').addEventListener('click', () => {
      const x = leer(), est = Estados.obtener();
      const aviso = raiz.querySelector('#eq-aviso-estados');
      if (!(x.unidades > 0)) { aviso.innerHTML = '<div class="cuadre mal">Primero escribe las unidades vendidas (los estados financieros están en C$, no en unidades).</div>'; return; }
      const n = k => Number(est.er[k][1]) || 0;
      x.precio = n('ventas') / x.unidades;
      x.cv = n('costoVentas') / x.unidades;
      x.cf = n('gastosVenta') + n('gastosAdmin') + n('depreciacion');
      Datos.guardar('equilibrio', x);
      Equilibrio.render(el); Validar.activar(el);
      const nuevo = el.querySelector('#eq-aviso-estados');
      if (nuevo) nuevo.innerHTML = '<div class="cuadre ok">Datos tomados del año ' + est.anios[1] + ': precio = Ventas ÷ unidades; costo variable = Costo de ventas ÷ unidades; costos fijos = gastos de venta + administración + depreciación.</div>';
    });
    refrescar();
  }
};

Modulos.equilibrio = {
  titulo: 'Punto de equilibrio',
  subtitulo: 'Margen de contribución, punto de equilibrio, escenarios y gráfica C-V-U',
  render(el) { Equilibrio.render(el); }
};