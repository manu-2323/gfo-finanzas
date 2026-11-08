// FASE 4C: Dashboard del Panel principal (cuadrícula asimétrica).
// Solo lee datos: no cambia ningún cálculo. Reemplaza el contenido del panel, así que debe
// cargarse DESPUÉS de lectura-modulos.js, alertas.js (si lo usas) y graficos.js.
const Dashboard = {
  grafs: [],
  C: Tema.paleta(),
  ETQ: { ok: 'Favorable', alerta: 'Revisar', riesgo: 'Riesgo' },

  corto(v) {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    return s + (a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + ' M' : a >= 1e3 ? (a / 1e3).toFixed(0) + ' mil' : a.toFixed(0));
  },

  limpiar() {
    Dashboard.grafs.forEach(g => { try { g.destroy(); } catch (e) {} });
    Dashboard.grafs = [];
  },

  // Franja de bienvenida con ilustración decorativa (barras + línea, igual en todas las variantes)
  hero(opts) {
    const decor = '<svg class="dash-hero-decor" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect x="20" y="100" width="22" height="60" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<rect x="55" y="70" width="22" height="90" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<rect x="90" y="40" width="22" height="120" rx="4" fill="rgba(255,255,255,.2)"/>' +
      '<rect x="125" y="85" width="22" height="75" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<polyline points="20,95 55,65 90,35 125,80 160,20" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="160" cy="20" r="5" fill="#fff"/></svg>';
    return '<div class="dash-hero dash-12"><div class="dash-hero-txt">' +
      (opts.ant ? '<small>' + esc(opts.ant) + '</small>' : '') +
      '<h2>' + esc(opts.titulo) + '</h2><p>' + opts.sub + '</p>' + (opts.extra || '') +
      (opts.boton ? '<a class="btn" href="#' + opts.boton.href + '">' + esc(opts.boton.texto) + '</a>' : '') +
      '</div>' + decor + '</div>';
  },

  // Datos de TODOS los períodos de la empresa y posición del par elegido en el menú
  datos() {
    const ps = Empresas.periodos || [], ids = ps.map(p => p.id);
    if (!ids.length) return null;
    const raw = Estados.leerCrudo(), d = Estados.compat(raw, ids), r = Estados.calcular(d);
    const par = Seleccion.ids();
    const D = { raw, d, r, ids, etq: ps.map(p => p.etiqueta), par, ia: ids.indexOf(par[0]), ib: ids.indexOf(par[1]) };
    // vacio[i] = true si el período i no tiene ningún monto escrito
    D.vacio = r.map((x, i) => !x.totalActivo && !x.totalPasivo && !x.patrimonio && !x.utilidadNeta && !(Number(d.er.ventas[i]) || 0));
    D.hayDatos = D.vacio.some(v => !v);
    return D;
  },

  // Nivel del semáforo: mayor = true cuando un valor alto es bueno
  nivel(v, ok, alerta, mayor) {
    if (v === null || v === undefined || !isFinite(v)) return null;
    return mayor ? (v >= ok ? 'ok' : v >= alerta ? 'alerta' : 'riesgo')
                 : (v <= ok ? 'ok' : v <= alerta ? 'alerta' : 'riesgo');
  },
  fv(tipo, v) { return (v === null || v === undefined || !isFinite(v)) ? 'N/D' : Fmt[tipo](v); },
  // Monto para tarjetas pequeñas: millones con 2 decimales; el monto completo queda en el tooltip
  monto(v) {
    if (v === null || v === undefined || !isFinite(v)) return 'N/D';
    return Math.abs(v) >= 1e6 ? 'C$ ' + Fmt.num(v / 1e6, 2) + ' M' : Fmt.moneda(v);
  },

  // Aquí se calculan los indicadores del panel (período analizado; promedios con el período base)
  calcular(D) {
    const { d, r, ia, ib } = D, A = r[ib], B = r[ia];
    const div = (x, y) => (y ? x / y : null);
    const n = (g, k, p) => Number((d[g][k] || [])[p]) || 0;
    const ventas = n('er', 'ventas', ib), ventasB = n('er', 'ventas', ia);
    const prom = k => (ia === ib ? null : (A[k] + B[k]) / 2);
    const cam = (nuevo, base) => (ia === ib || !base ? null : (nuevo - base) / Math.abs(base));
    return {
      A, B, ventas, ventasB, un: A.utilidadNeta, unB: B.utilidadNeta,
      cVentas: cam(ventas, ventasB), cUn: cam(A.utilidadNeta, B.utilidadNeta),
      rc: div(A.ac, A.pc), prueba: div(A.ac - n('bg', 'inventarios', ib), A.pc),
      endeu: div(A.totalPasivo, A.totalActivo), dp: div(A.totalPasivo, A.patrimonio),
      cob: div(A.uaii, n('er', 'intereses', ib)),
      mb: div(A.utilidadBruta, ventas), mn: div(A.utilidadNeta, ventas),
      roa: div(A.utilidadNeta, prom('totalActivo')), roe: div(A.utilidadNeta, prom('patrimonio'))
    };
  },

  tarjetasKpi(D, v) {
    const e = D.etq[D.ia], N = Dashboard.nivel;
    const chip = c => c === null ? '' :
      '<span class="chip ' + (c >= 0 ? 'sube' : 'baja') + '">' + (c >= 0 ? '+' : '') + Fmt.num(c * 100, 2) + ' % vs ' + esc(e) + '</span>';
    const sem = nv => nv ? '<span class="chip ' + nv + '">' + Dashboard.ETQ[nv] + '</span>' : '';
    const lista = [
      { t: 'Ventas', v: Dashboard.monto(v.ventas), full: Fmt.moneda(v.ventas), nivel: v.cVentas === null ? null : (v.cVentas < 0 ? 'alerta' : 'ok'), chip: chip(v.cVentas) },
      { t: 'Utilidad neta', v: Dashboard.monto(v.un), full: Fmt.moneda(v.un), nivel: v.un < 0 ? 'riesgo' : (v.cUn === null ? null : (v.cUn < 0 ? 'alerta' : 'ok')), chip: chip(v.cUn) },
      { t: 'Razón corriente', v: Dashboard.fv('veces', v.rc), nivel: N(v.rc, 1.5, 1, true) },
      { t: 'Endeudamiento', v: Dashboard.fv('pct', v.endeu), nivel: N(v.endeu, 0.6, 0.8, false) },
      { t: 'Margen neto', v: Dashboard.fv('pct', v.mn), nivel: N(v.mn, 0.05, 0, true) },
      { t: 'ROE', v: Dashboard.fv('pct', v.roe), nivel: N(v.roe, 0.10, 0, true) }
    ];
    return lista.map(k => '<div class="tarjeta dash-kpi dash-2 ' + (k.nivel || '') + '"><h3>' + k.t + '</h3><div class="valor"' + (k.full ? ' title="' + k.full + '"' : '') + '>' + k.v +
      '</div><div class="dash-chips">' + (k.chip || sem(k.nivel)) + '</div></div>').join('');
  },

  indicadores(v) {
    const N = Dashboard.nivel, f = Dashboard.fv;
    const grupos = [
      ['Liquidez', [['Razón corriente', f('veces', v.rc), N(v.rc, 1.5, 1, true)], ['Prueba ácida', f('veces', v.prueba), N(v.prueba, 1, 0.7, true)]]],
      ['Endeudamiento', [['Razón de endeudamiento', f('pct', v.endeu), N(v.endeu, 0.6, 0.8, false)],
        ['Deuda sobre patrimonio', f('veces', v.dp), N(v.dp, 1.5, 2.5, false)], ['Cobertura de intereses', f('veces', v.cob), N(v.cob, 3, 1.5, true)]]],
      ['Rentabilidad', [['Margen bruto', f('pct', v.mb), N(v.mb, 0.15, 0.05, true)], ['Margen neto', f('pct', v.mn), N(v.mn, 0.05, 0, true)],
        ['ROA (saldo promedio)', f('pct', v.roa), N(v.roa, 0.05, 0, true)], ['ROE (saldo promedio)', f('pct', v.roe), N(v.roe, 0.10, 0, true)]]]
    ];
    return grupos.map(g => '<div class="dash-grupo">' + g[0] + '</div>' + g[1].map(x =>
      '<div class="dash-fila"><span>' + x[0] + '</span><span><strong>' + x[1] + '</strong><i class="dot ' + (x[2] || '') + '"></i></span></div>').join('')).join('');
  },

  // Alertas: usa Alertas.items() si existe (más completas); si no, las calcula aquí
  alertas(D, v) {
    let items = [];
    try { if (typeof Alertas !== 'undefined') items = Alertas.items(); } catch (e) { items = []; }
    if (!items.length) {
      const A = v.A, U = [];
      if (A.utilidadNeta < 0) U.push({ nivel: 'riesgo', texto: 'Utilidad neta negativa (' + Fmt.moneda(A.utilidadNeta) + '): la empresa pierde dinero en el período analizado.' });
      if (Math.abs(A.diferencia) > 0.5) U.push({ nivel: 'riesgo', texto: 'El balance no cuadra: revisa las cuentas del período analizado.' });
      if (A.patrimonio < 0) U.push({ nivel: 'riesgo', texto: 'Patrimonio negativo: las deudas superan lo que tiene la empresa.' });
      if (v.rc !== null && v.rc < 1.5) U.push({ nivel: 'alerta', texto: 'Razón corriente de ' + Fmt.num(v.rc, 2) + ', por debajo de 1.5: puede costar pagar las deudas de corto plazo.' });
      if (v.endeu !== null && v.endeu > 0.6) U.push({ nivel: 'alerta', texto: 'El ' + Fmt.pct(v.endeu) + ' de los activos está financiado con deuda (más del 60 %).' });
      items = U;
    }
    const orden = { riesgo: 0, alerta: 1, ok: 2 };
    const activos = items.filter(i => i.nivel !== 'ok').sort((a, b) => orden[a.nivel] - orden[b.nivel]);
    if (!activos.length) return [{ nivel: 'ok', texto: 'Sin alertas activas: los indicadores revisados están dentro de los rangos de referencia.' }];
    if (activos.length > 5) {
      const resto = activos.length - 5;
      return activos.slice(0, 5).concat([{ nivel: 'alerta', texto: 'Y ' + resto + ' alerta(s) más. Revisa los módulos para ver el detalle.' }]);
    }
    return activos;
  },

  lectura(D) {
    let items = [];
    try { items = Lectura.estados(D.raw, D.par); } catch (e) { items = []; }
    return items.slice(0, 6);
  },

  lista(items) {
    const clase = { ok: 'ok', alerta: 'alerta', riesgo: 'riesgo' };
    return items.map(i => '<div class="dash-item ' + clase[i.nivel] + '">' + esc(i.texto) + '</div>').join('');
  },

  accesos() {
    const ocultos = (Empresas.activa && typeof ocultosPara === 'function') ? ocultosPara(Empresas.activa.sector) : [];
    return SECCIONES.map(s => s.items.filter(i => i.id !== 'panel' && !ocultos.includes(i.id)).map(i =>
      '<a class="dash-acceso" href="#' + i.id + '">' + icono(i.icono) + '<span>' + esc(i.nombre) + '</span></a>').join('')).join('');
  },

  graficos(el, D, v) {
    if (typeof Chart === 'undefined') return;
    const C = Dashboard.C, q = id => el.querySelector('#' + id);
    // Los períodos sin montos quedan como hueco (null), no como cero
    const linea = (n, datos, c) => ({ label: n, data: datos.map((x, i) => (D.vacio[i] ? null : x)), borderColor: c, backgroundColor: c, tension: .25, pointRadius: 4, spanGaps: false });
    const tip = { callbacks: { label: x => (x.dataset.label ? x.dataset.label + ': ' : '') + Fmt.moneda(x.raw) } };
    if (q('dash-tend')) Dashboard.grafs.push(new Chart(q('dash-tend'), {
      type: 'line',
      data: { labels: D.etq, datasets: [linea('Ventas', D.d.er.ventas.map(Number), C.marino), linea('Utilidad neta', D.r.map(x => x.utilidadNeta), C.ok)] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: tip },
        scales: { y: { ticks: { callback: x => Dashboard.corto(x) } } } }
    }));
    const partes = [v.A.pc, v.A.pnc, v.A.patrimonio].map(x => Math.max(0, x));
    if (q('dash-estr')) {
      if (!partes.some(x => x > 0)) {
        q('dash-estr').parentNode.innerHTML = '<p class="nota-pie">Sin datos de balance en este período. Escribe el Balance General en Estados financieros.</p>';
      } else {
        Dashboard.grafs.push(new Chart(q('dash-estr'), {
          type: 'doughnut',
          data: { labels: ['Pasivo corriente', 'Pasivo no corriente', 'Patrimonio'], datasets: [{ data: partes, backgroundColor: [C.malo, C.claro, C.marino] }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' },
            tooltip: { callbacks: { label: x => x.label + ': ' + Fmt.moneda(x.raw) } } } }
        }));
      }
    }
  },

  render(el) {
    Dashboard.limpiar();
    const emp = Empresas.activa || {}, D = Dashboard.datos();
    const accesos = '<div class="tarjeta dash-12"><h3>Accesos rápidos</h3><div class="dash-accesos">' + Dashboard.accesos() + '</div></div>';

    if (!D || D.ia < 0 || D.ib < 0) {
      el.innerHTML = '<div class="dash">' + Dashboard.hero({
        ant: emp.nombre || 'Tu empresa', titulo: 'Todavía no hay períodos',
        sub: 'Crea tus períodos para empezar a registrar los estados financieros.',
        boton: { href: 'periodos', texto: 'Ir a Períodos' }
      }) + accesos + '</div>';
      return;
    }

    const base = esc(D.etq[D.ia]), act = esc(D.etq[D.ib]);
    const sub = D.ia === D.ib ? 'Período ' + act : 'Comparando ' + base + ' (base) con ' + act + ' (analizado)';
    const chips = '<div class="dash-chips"><span class="chip">C$</span> <span class="chip">' + D.ids.length + ' período(s)</span></div>';

    if (!D.hayDatos) {
      el.innerHTML = '<div class="dash">' + Dashboard.hero({
        ant: emp.sector || '', titulo: 'Registra tus primeros datos',
        sub: 'Escribe los montos en Estados financieros y vuelve aquí para ver tus indicadores.',
        boton: { href: 'estados', texto: 'Ir a Estados financieros' }
      }) + accesos + '</div>';
      return;
    }

    // El período analizado no tiene montos: se avisa en vez de mostrar indicadores en cero
    if (D.vacio[D.ib]) {
      const conDatos = D.etq.filter((e, i) => !D.vacio[i]).map(esc).join(', ');
      el.innerHTML = '<div class="dash">' + Dashboard.hero({
        ant: emp.sector || '', titulo: 'El período analizado está vacío',
        sub: 'El período <strong>' + act + '</strong> no tiene montos todavía. Escríbelos o elige en el menú lateral uno con datos (' + conDatos + ').',
        boton: { href: 'estados', texto: 'Ir a Estados financieros' }
      }) + accesos + '</div>';
      return;
    }

    const v = Dashboard.calcular(D);
    el.innerHTML = '<div class="dash">' + Dashboard.hero({
        ant: emp.sector || 'Empresa', titulo: 'Hola, ' + (emp.nombre || 'tu empresa'), sub: sub, extra: chips
      }) +
      Dashboard.tarjetasKpi(D, v) +
      '<div class="tarjeta dash-8"><h3>Tendencia por período</h3><div class="dash-graf"><canvas id="dash-tend"></canvas></div></div>' +
      '<div class="tarjeta dash-4"><h3>Alertas</h3><div class="dash-lista">' + Dashboard.lista(Dashboard.alertas(D, v)) + '</div></div>' +
      '<div class="tarjeta dash-4"><h3>Estructura de financiamiento (' + act + ')</h3><div class="dash-graf"><canvas id="dash-estr"></canvas></div></div>' +
      '<div class="tarjeta dash-4"><h3>Indicadores clave (' + act + ')</h3>' + Dashboard.indicadores(v) +
        '<p class="nota-pie">Semáforo con rangos de referencia generales; no son reglas absolutas.</p></div>' +
      '<div class="tarjeta dash-4"><h3>Lectura financiera</h3><div class="dash-lista">' + Dashboard.lista(Dashboard.lectura(D)) + '</div></div>' +
      accesos + '</div>';
    Dashboard.graficos(el, D, v);
  }
};

// Reemplaza el contenido del Panel principal por el dashboard
Modulos.panel.subtitulo = 'Indicadores clave, alertas y accesos rápidos de la empresa';
Modulos.panel.render = function (el) {
  try { Dashboard.render(el); }
  catch (e) { console.error(e); el.innerHTML = '<div class="aviso">No se pudo dibujar el panel: ' + esc(e.message) + '</div>'; }
};