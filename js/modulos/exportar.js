// FASE 4A (versión 2): Exportar a Excel con el formato de la Plantilla GFO.
// Requiere librerias/xlsx.bundle.js (xlsx-js-style). Celdas amarillas = datos; resto = fórmulas vivas.
const Exportar = {
  MODULOS: [
    { id: 'panel', nombre: 'Panel ejecutivo', hoja: '01_Panel', desc: 'Indicadores clave de los dos períodos y lectura financiera automática.' },
    { id: 'estados', nombre: 'Estados financieros', hoja: '02_Estados', desc: 'Estado de Resultados y Balance con tus cuentas, variaciones y comprobación de cuadre.' },
    { id: 'analisis', nombre: 'Análisis financiero', hoja: '03_Análisis', desc: 'Análisis vertical, razones financieras y sistema DuPont.' },
    { id: 'equilibrio', nombre: 'Punto de equilibrio', hoja: '04_Equilibrio', desc: 'Datos, resultados C-V-U y tabla de sensibilidad por volumen.' },
    { id: 'apalancamiento', nombre: 'Apalancamiento', hoja: '05_Apalancamiento', desc: 'GAO, GAF y GAT por método directo y por variaciones.' },
    { id: 'flujo', nombre: 'Flujo de efectivo', hoja: '06_Flujo', desc: 'Flujo manual y método indirecto con cuadre contra el balance.' },
    { id: 'presupuestos', nombre: 'Planeación y presupuestos', hoja: '07_Presupuestos', desc: 'Presupuesto operativo de 3 meses y presupuesto de caja.' },
    { id: 'proforma', nombre: 'Proforma', hoja: '08_Proforma', desc: 'Supuestos, estados proforma y financiamiento externo requerido.' },
    { id: 'personal', nombre: 'Presupuesto personal', hoja: '09_Personal', desc: 'Ingresos, gastos por categoría, saldo y capacidad de ahorro.' },
    { id: 'inventario', nombre: 'Control de inventario', hoja: '10_Inventario', desc: 'Existencias, valor del inventario y alertas de reposición.' },
    { id: 'formulas', nombre: 'Fórmulas utilizadas', hoja: '11_Fórmulas', desc: 'Referencia de todas las fórmulas del sistema, por módulo.' }
  ],
  vivas: true,   // true = las celdas calculadas llevan fórmulas de Excel
  M: null,       // modelo de Estados (filas y posiciones) del libro que se está construyendo

  FMT: { m: '#,##0.00;[Red]-#,##0.00', p: '0.00%;[Red]-0.00%', v: '0.00;[Red]-0.00', u: '#,##0.00;[Red]-#,##0.00', n: '0.00' },

  // ---------- Estilos ----------
  estilos() {
    const rel = rgb => ({ patternType: 'solid', fgColor: { rgb } });
    const f = (sz, bold, rgb, extra) => Object.assign({ name: 'Calibri', sz, bold: !!bold, color: { rgb } }, extra || {});
    const lin = (rgb, estilo) => ({ style: estilo || 'thin', color: { rgb } });
    const base = { font: f(11, false, '1F2A3A'), fill: rel('FFFFFF'), border: { bottom: lin('DDE3EA') }, alignment: { vertical: 'center' } };
    return {
      blanco: { fill: rel('FFFFFF') },
      titulo: { font: f(16, true, 'FFFFFF'), fill: rel('1F3A5F'), alignment: { vertical: 'center' } },
      sub: { font: f(10, false, '6B7788'), fill: rel('F3F5F8'), alignment: { vertical: 'center' } },
      seccion: { font: f(12, true, 'FFFFFF'), fill: rel('3F6FA3'), alignment: { vertical: 'center' } },
      cab: { font: f(10, true, 'FFFFFF'), fill: rel('1F3A5F'), alignment: { horizontal: 'center', vertical: 'center', wrapText: true } },
      normal: base,
      texto: Object.assign({}, base, { alignment: { vertical: 'top', wrapText: true } }),
      entrada: { font: f(11, false, '0000AA'), fill: rel('FFF9E6'), border: { top: lin('DDE3EA'), bottom: lin('DDE3EA'), left: lin('DDE3EA'), right: lin('DDE3EA') }, alignment: { vertical: 'center' } },
      total: { font: f(11, true, '1F2A3A'), fill: rel('E8EEF5'), border: { top: lin('1F3A5F'), bottom: lin('DDE3EA') }, alignment: { vertical: 'center' } },
      nota: { font: f(10, false, '1F3A5F'), fill: rel('EEF3F9'), alignment: { vertical: 'center', wrapText: true } },
      suave: { font: f(10, false, '6B7788'), fill: rel('FFFFFF'), border: { bottom: lin('DDE3EA') }, alignment: { vertical: 'center', wrapText: true } },
      enlace: { font: f(11, false, '3F6FA3', { underline: true }), fill: rel('FFFFFF'), border: { bottom: lin('DDE3EA') } },
      ok: Object.assign({}, base, { font: f(11, true, '3D8B6A') }),
      alerta: Object.assign({}, base, { font: f(11, true, 'C08A2E') }),
      riesgo: Object.assign({}, base, { font: f(11, true, 'B25555') }),
      etiquetaKpi: { font: f(10, true, 'FFFFFF'), fill: rel('2B4C78'), alignment: { horizontal: 'center', vertical: 'center' } }
    };
  },
  get S() { if (!Exportar._S) Exportar._S = Exportar.estilos(); return Exportar._S; },

  // Celdas especiales: dato de entrada y celda con fórmula (con valor guardado por si no se recalcula)
  ent(v, z) { return { v, z, s: Exportar.S.entrada }; },
  fx(f, v, z, s) { return { f, v, z, s }; },
  nd(v) { return (typeof v === 'number' && isFinite(v)) ? v : 'N/D'; },
  L(c) { return String.fromCharCode(65 + c); },

  celda(x, estilo, formato) {
    let v = x, f = null, s = estilo, z = formato, l = null;
    if (x && typeof x === 'object') { v = x.v; f = x.f; s = x.s || estilo; z = x.z || formato; l = x.l; }
    let c;
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) c = { v: (f ? 'N/D' : ''), t: 's' };
    else if (typeof v === 'number') c = { v, t: 'n', z: z || Exportar.FMT.m };
    else c = { v: String(v), t: 's' };
    c.s = s;
    if (f && Exportar.vivas) c.f = f;
    if (l) c.l = l;
    return c;
  },

  // Constructor de hojas: columna A de margen; el contenido empieza en la columna B (como la plantilla)
  Hoja(anchos) {
    const filas = [[]], altos = {}, merges = [], n = anchos.length, S = Exportar.S;
    const h = {
      get sig() { return filas.length + 1; },
      banda(texto, estilo, alto) {
        const r = filas.length;
        const fila = Array.from({ length: n }, () => ({ v: '', t: 's', s: estilo }));
        fila[0] = { v: texto, t: 's', s: estilo };
        filas.push(fila);
        merges.push({ s: { r, c: 1 }, e: { r, c: n } });
        altos[r] = alto || (estilo === S.titulo ? 32 : estilo === S.seccion ? 22 : 18);
        return filas.length;
      },
      nota(texto, estilo) {
        const r = filas.length, ancho = anchos.reduce((a, b) => a + b, 0);
        const fila = Array.from({ length: n }, () => ({ v: '', t: 's', s: estilo || S.nota }));
        fila[0] = { v: texto, t: 's', s: estilo || S.nota };
        filas.push(fila);
        merges.push({ s: { r, c: 1 }, e: { r, c: n } });
        altos[r] = Math.max(20, Math.ceil(String(texto).length * 1.05 / ancho) * 15 + 6);
        return filas.length;
      },
      vacia() { filas.push([]); return filas.length; },
      fila(valores, estilo, formatos, alto) {
        const arr = valores.map((x, k) => Exportar.celda(x, estilo, formatos && formatos[k]));
        valores.forEach((x, k) => {
          const span = x && typeof x === 'object' && x.span;
          if (!span || span < 2) return;
          merges.push({ s: { r: filas.length, c: k + 1 }, e: { r: filas.length, c: k + span } });
          for (let j = 1; j < span; j++) arr[k + j] = { v: '', t: 's', s: arr[k].s };
        });
        filas.push(arr);
        if (alto) altos[filas.length - 1] = alto;
        return filas.length;
      },
      construir() {
        const ws = {}, ultima = filas.length + 1;
        for (let r = 0; r <= ultima; r++) {
          for (let c = 0; c <= n + 2; c++) {
            const celda = (filas[r] || [])[c - 1];
            ws[XLSX.utils.encode_cell({ r, c })] = (c >= 1 && celda) ? celda : { v: '', t: 's', s: S.blanco };
          }
        }
        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ultima, c: n + 2 } });
        ws['!merges'] = merges;
        ws['!cols'] = [{ wch: 2 }].concat(anchos.map(w => ({ wch: w })), [{ wch: 2 }, { wch: 2 }]);
        ws['!rows'] = [];
        Object.keys(altos).forEach(r => { ws['!rows'][r] = { hpt: altos[r] }; });
        return ws;
      }
    };
    return h;
  },

  encabezado(h, titulo, sub) {
    const S = Exportar.S;
    h.banda(titulo, S.titulo); h.banda(sub, S.sub); h.vacia();
  },

  nombreArchivo() {
    const f = new Date();
    const dd = String(f.getDate()).padStart(2, '0'), mm = String(f.getMonth() + 1).padStart(2, '0');
    const empresa = (Empresas.activa && Empresas.activa.nombre ? Empresas.activa.nombre : 'empresa')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return 'GFO_' + empresa + '_' + dd + '-' + mm + '-' + f.getFullYear() + '.xlsx';
  },
  fechaHoy() {
    const f = new Date();
    return String(f.getDate()).padStart(2, '0') + '/' + String(f.getMonth() + 1).padStart(2, '0') + '/' + f.getFullYear();
  },
  lecturaTexto(pct) {
    return typeof pct !== 'number' ? 'Sin base de comparación' : pct > 0.1 ? 'Aumento significativo' : pct < -0.1 ? 'Disminución significativa' : 'Estable';
  },
  hojaDe(id) { return Exportar.MODULOS.find(m => m.id === id).hoja; },

  // ---------- Modelo de Estados (cuentas personalizadas del par de períodos elegido) ----------
  modelo() {
    const raw = Estados.leerCrudo(), ids = Seleccion.ids();
    const d = Estados.compat(raw, ids), r = Estados.calcular(d);
    const valor = (a, p) => Number((raw.valores[ids[p]] || {})[a.id]) || 0;
    const M = { raw, ids, d, r, A: d.anios, filas: { er: [], bg: [] }, grp: {}, tot: {}, rol: {}, ok: true };
    // Las fórmulas por grupo solo coinciden con el cálculo del sistema si cada cuenta base sigue en su grupo
    ['er', 'bg'].forEach(e => raw.cuentas[e].forEach(a => { if (a.rol && ROLES[a.rol] && ROLES[a.rol].grupo !== a.grupo) M.ok = false; }));
    const armar = (estado, orden) => orden.forEach(item => {
      if (item[0] === '@') {
        const k = item.slice(1);
        M.tot[k] = { total: true, k, nombre: ETIQUETAS_TOTAL[k], vals: [r[0][k], r[1][k]], row: null };
        M.filas[estado].push(M.tot[k]);
      } else {
        const lista = raw.cuentas[estado].filter(a => a.grupo === item).map(a => {
          const x = { total: false, nombre: a.nombre, vals: [valor(a, 0), valor(a, 1)], row: null };
          if (a.rol) M.rol[a.rol] = x;
          return x;
        });
        lista.forEach(x => M.filas[estado].push(x));
        if (lista.length) M.grp[estado + ':' + item] = { a: lista[0], b: lista[lista.length - 1] };
      }
    });
    armar('er', ER_ORDEN);
    armar('bg', BG_ORDEN);
    return M;
  },

  // Referencias a la hoja de Estados (lanzan error si la hoja no está en el libro: entonces se usan valores)
  Q: "'02_Estados'!",
  col(p) { return p === 0 ? 'C' : 'D'; },
  refT(k, p) {
    const M = Exportar.M, x = M && M.tot[k];
    if (!Exportar.vivas || !M.ok || !x || !x.row) throw new Error('sin ref');
    return Exportar.Q + Exportar.col(p) + x.row;
  },
  refG(est, g, p) {
    const M = Exportar.M;
    if (!Exportar.vivas || !M.ok) throw new Error('sin ref');
    const x = M.grp[est + ':' + g];
    if (!x) return '0';
    if (!x.a.row) throw new Error('sin ref');
    const c = Exportar.col(p);
    return 'SUM(' + Exportar.Q + c + x.a.row + ':' + c + x.b.row + ')';
  },
  refR(rol, p) {
    const M = Exportar.M, x = M.rol[rol];
    if (!Exportar.vivas || !M.ok) throw new Error('sin ref');
    if (!x) return '0';
    if (!x.row) throw new Error('sin ref');
    return Exportar.Q + Exportar.col(p) + x.row;
  },
  intentar(fn) { try { return fn(); } catch (e) { return null; } },

  // ---------- HOJAS ----------
  portada(sel) {
    const h = Exportar.Hoja([30, 62]), S = Exportar.S, M = Exportar.M, u = Auth.usuario || {}, emp = Empresas.activa || {};
    h.banda('SISTEMA DE ANÁLISIS Y PLANEACIÓN FINANCIERA', S.titulo);
    h.banda('Gestión Financiera Operativa · Reporte exportado desde la aplicación', S.sub);
    h.vacia();
    h.banda('IDENTIFICACIÓN DEL REPORTE', S.seccion);
    h.fila(['Empresa:', emp.nombre || '—'], S.normal);
    h.fila(['Sector:', emp.sector || '—'], S.normal);
    h.fila(['Período base:', M.A[0]], S.normal);
    h.fila(['Período analizado:', M.A[1]], S.normal);
    h.fila(['Moneda:', 'Córdobas (C$)'], S.normal);
    h.fila(['Fecha de generación:', Exportar.fechaHoy()], S.normal);
    h.fila(['Generado por:', u.email || '—'], S.normal);
    h.vacia();
    h.banda('CONTENIDO DEL LIBRO (clic en el nombre para ir a la hoja)', S.seccion);
    h.fila(['Hoja', 'Descripción'], S.cab);
    Exportar.MODULOS.filter(m => sel.includes(m.id)).forEach(m => {
      h.fila([{ v: m.hoja, s: S.enlace, l: { Target: "#'" + m.hoja + "'!A1", Tooltip: 'Ir a ' + m.hoja } }, m.desc], S.suave);
    });
    h.vacia();
    h.banda('CÓMO LEER ESTE LIBRO', S.seccion);
    h.nota('Las celdas con fondo amarillo y letra azul son datos tomados del sistema: puedes cambiarlas y el libro se recalcula. ' +
      'Las demás celdas son fórmulas de Excel. Los montos están en córdobas (C$).', S.nota);
    return h.construir();
  },

  hojaPanel() {
    const h = Exportar.Hoja([40, 20, 20, 20, 16]), S = Exportar.S, FM = Exportar.FMT, M = Exportar.M, r = M.r, d = M.d, A = M.A;
    Exportar.encabezado(h, 'PANEL FINANCIERO EJECUTIVO', 'Indicadores clave y lectura automática · ' + A[0] + ' (base) vs ' + A[1] + ' (analizado)');
    h.banda('INDICADORES CLAVE', S.seccion);
    h.fila(['Indicador', A[0], A[1], 'Variación', 'Variación %'], S.cab);
    const div = (a, b) => (b ? a / b : null);
    const ind = [
      ['Ventas netas', p => Number(d.er.ventas[p]) || 0, FM.m],
      ['Utilidad bruta', p => r[p].utilidadBruta, FM.m],
      ['Utilidad operativa (UAII)', p => r[p].uaii, FM.m],
      ['Utilidad neta', p => r[p].utilidadNeta, FM.m],
      ['Margen de utilidad neta', p => div(r[p].utilidadNeta, Number(d.er.ventas[p]) || 0), FM.p],
      ['Activo total', p => r[p].totalActivo, FM.m],
      ['Pasivo total', p => r[p].totalPasivo, FM.m],
      ['Patrimonio', p => r[p].patrimonio, FM.m],
      ['Razón corriente (veces)', p => div(r[p].ac, r[p].pc), FM.v],
      ['Razón de endeudamiento', p => div(r[p].totalPasivo, r[p].totalActivo), FM.p]
    ];
    ind.forEach(([nombre, fn, fm]) => {
      const row = h.sig, a = Exportar.nd(fn(0)), b = Exportar.nd(fn(1));
      const dif = typeof a === 'number' && typeof b === 'number' ? b - a : 'N/D';
      const pct = typeof dif === 'number' && a ? dif / Math.abs(a) : 'N/D';
      h.fila([nombre, a, b, Exportar.fx('IFERROR(D' + row + '-C' + row + ',"N/D")', dif, fm),
        Exportar.fx('IFERROR(IF(C' + row + '=0,"N/D",E' + row + '/ABS(C' + row + ')),"N/D")', pct, FM.p)],
        S.normal, [null, fm, fm, fm, FM.p]);
    });
    h.vacia();
    const bloques = [['LECTURA FINANCIERA DE LOS ESTADOS', () => Lectura.estados(M.raw, M.ids)]];
    if (typeof Lectura.equilibrio === 'function') bloques.push(['LECTURA DEL PUNTO DE EQUILIBRIO', () => Lectura.equilibrio(Equilibrio.obtener())]);
    if (typeof Lectura.apalancamiento === 'function') bloques.push(['LECTURA DEL APALANCAMIENTO', () => Lectura.apalancamiento(Apalancamiento.obtener())]);
    if (typeof Lectura.presupuestos === 'function') bloques.push(['LECTURA DEL PRESUPUESTO', () => Lectura.presupuestos(Presupuestos.obtener())]);
    const etq = { ok: ['Favorable', S.ok], alerta: ['Atención', S.alerta], riesgo: ['Riesgo', S.riesgo] };
    bloques.forEach(([titulo, fn]) => {
      let items = [];
      try { items = fn() || []; } catch (e) { items = []; }
      if (!items.length) return;
      h.banda(titulo, S.seccion);
      items.forEach(it => {
        const e = etq[it.nivel] || etq.alerta;
        h.fila([{ v: e[0], s: e[1] }, { v: it.texto, s: S.texto, span: 4 }], S.texto, null, Math.max(20, Math.ceil(it.texto.length / 85) * 15 + 5));
      });
      h.vacia();
    });
    return h.construir();
  },

  hojaEstados() {
    const h = Exportar.Hoja([46, 18, 18, 18, 14, 26]), S = Exportar.S, FM = Exportar.FMT, M = Exportar.M, X = Exportar.fx;
    Exportar.encabezado(h, 'ESTADOS FINANCIEROS', 'Comparación: ' + M.A[0] + ' (base) vs ' + M.A[1] + ' (analizado) · cuentas personalizadas de la empresa');
    const isrRow = h.fila(['Tasa de impuesto (ISR %):', Exportar.ent(M.d.isr, FM.n)], S.normal);
    h.nota('Las celdas amarillas son los montos de cada cuenta. Los totales, variaciones y la lectura se calculan con fórmulas.', S.nota);
    h.vacia();
    const gs = (est, g, c) => { const x = M.grp[est + ':' + g]; return x ? 'SUM(' + c + x.a.row + ':' + c + x.b.row + ')' : '0'; };
    const T = (k, c) => c + M.tot[k].row;
    const fT = {
      utilidadBruta: c => gs('er', 'ingreso', c) + '-' + gs('er', 'costo', c),
      uaii: c => T('utilidadBruta', c) + '-' + gs('er', 'gasto', c) + '-' + gs('er', 'depreciacion', c),
      uai: c => T('uaii', c) + '-' + gs('er', 'interes', c) + '+' + gs('er', 'otro', c),
      impuesto: c => 'IF(' + T('uai', c) + '>0,' + T('uai', c) + '*$C$' + isrRow + '/100,0)',
      utilidadNeta: c => T('uai', c) + '-' + T('impuesto', c),
      ac: c => gs('bg', 'ac', c),
      totalActivo: c => T('ac', c) + '+' + gs('bg', 'anc', c),
      pc: c => gs('bg', 'pc', c),
      totalPasivo: c => T('pc', c) + '+' + gs('bg', 'pnc', c),
      patrimonio: c => gs('bg', 'pat', c),
      totalPP: c => T('totalPasivo', c) + '+' + T('patrimonio', c)
    };
    const bloque = (estado, titulo) => {
      h.banda(titulo, S.seccion);
      h.fila(['Cuenta', M.A[0], M.A[1], 'Variación C$', 'Variación %', 'Lectura'], S.cab, null, 24);
      M.filas[estado].forEach(x => {
        const row = h.sig; x.row = row;
        const dif = x.vals[1] - x.vals[0], pct = x.vals[0] ? dif / Math.abs(x.vals[0]) : 'N/D';
        const celdas = x.total
          ? (M.ok ? [X(fT[x.k]('C'), x.vals[0], FM.m), X(fT[x.k]('D'), x.vals[1], FM.m)] : [x.vals[0], x.vals[1]])
          : [Exportar.ent(x.vals[0], FM.m), Exportar.ent(x.vals[1], FM.m)];
        h.fila([x.nombre].concat(celdas, [
          X('D' + row + '-C' + row, dif, FM.m),
          X('IF(C' + row + '=0,"N/D",E' + row + '/ABS(C' + row + '))', pct, FM.p),
          X('IF(ISNUMBER(F' + row + '),IF(F' + row + '>0.1,"Aumento significativo",IF(F' + row + '<-0.1,"Disminución significativa","Estable")),"Sin base de comparación")', Exportar.lecturaTexto(pct))
        ]), x.total ? S.total : S.normal, [null, FM.m, FM.m, FM.m, FM.p, null]);
      });
    };
    // Los totales dependen de filas ya escritas: primero se numeran todas las filas del bloque
    const numerar = (estado, desdeFila) => { let r = desdeFila; M.filas[estado].forEach(x => { x.row = r++; }); };
    // ER
    numerar('er', h.sig + 2);
    bloque('er', 'ESTADO DE RESULTADOS');
    h.vacia();
    numerar('bg', h.sig + 2);
    bloque('bg', 'BALANCE GENERAL');
    const cuadra = c => 'IF(ABS(' + T('totalActivo', c) + '-' + T('totalPP', c) + ')<0.5,"Cuadra","No cuadra")';
    const ok = p => Math.abs(M.r[p].diferencia) < 0.5 ? 'Cuadra' : 'No cuadra';
    h.fila(['Comprobación: Activo = Pasivo + Patrimonio', M.ok ? X(cuadra('C'), ok(0)) : ok(0), M.ok ? X(cuadra('D'), ok(1)) : ok(1), '', '', ''], S.suave);
    return h.construir();
  },

  razones(M) {
    const d = M.d, r = M.r, R = Exportar;
    const n = (g, k, p) => Number((d[g][k] || [])[p]) || 0;
    const div = (a, b) => (b ? a / b : null);
    const avg = k => (r[0][k] + r[1][k]) / 2;
    const T = (k, p) => R.refT(k, p), G = (e, g, p) => R.refG(e, g, p), Rr = (k, p) => R.refR(k, p);
    const prom = k => 'AVERAGE(' + T(k, 0) + ',' + T(k, 1) + ')';
    const w = e => 'IFERROR(' + e + ',"N/D")';
    return [
      { g: 'LIQUIDEZ' },
      { nombre: 'Razón corriente', t: 'v', ref: '1.5 o más (saludable)', f: p => div(r[p].ac, r[p].pc), fx: p => w(T('ac', p) + '/' + T('pc', p)) },
      { nombre: 'Prueba ácida', t: 'v', ref: '1.0 o más', f: p => div(r[p].ac - n('bg', 'inventarios', p), r[p].pc), fx: p => w('(' + T('ac', p) + '-' + Rr('inventarios', p) + ')/' + T('pc', p)) },
      { nombre: 'Capital de trabajo neto (C$)', t: 'm', ref: 'Positivo', f: p => r[p].ac - r[p].pc, fx: p => T('ac', p) + '-' + T('pc', p) },
      { g: 'ENDEUDAMIENTO' },
      { nombre: 'Razón de endeudamiento', t: 'p', ref: 'Menor a 60 %', f: p => div(r[p].totalPasivo, r[p].totalActivo), fx: p => w(T('totalPasivo', p) + '/' + T('totalActivo', p)) },
      { nombre: 'Deuda / Patrimonio', t: 'v', ref: 'Menor a 1.5', f: p => div(r[p].totalPasivo, r[p].patrimonio), fx: p => w(T('totalPasivo', p) + '/' + T('patrimonio', p)) },
      { nombre: 'Cobertura de intereses', t: 'v', ref: '3.0 o más', f: p => div(r[p].uaii, n('er', 'intereses', p)), fx: p => w(T('uaii', p) + '/' + G('er', 'interes', p)) },
      { g: 'RENTABILIDAD Y ACTIVIDAD (con saldo promedio; el período base es N/D)' },
      { nombre: 'Margen de utilidad bruta', t: 'p', ref: '15 % o más', f: p => div(r[p].utilidadBruta, n('er', 'ventas', p)), fx: p => w(T('utilidadBruta', p) + '/' + G('er', 'ingreso', p)) },
      { nombre: 'Margen de utilidad operativa', t: 'p', ref: '10 % o más', f: p => div(r[p].uaii, n('er', 'ventas', p)), fx: p => w(T('uaii', p) + '/' + G('er', 'ingreso', p)) },
      { nombre: 'Margen de utilidad neta', t: 'p', ref: '5 % o más', f: p => div(r[p].utilidadNeta, n('er', 'ventas', p)), fx: p => w(T('utilidadNeta', p) + '/' + G('er', 'ingreso', p)) },
      { nombre: 'ROA (utilidad neta / activo total promedio)', t: 'p', ref: '5 % o más', f: p => p === 0 ? null : div(r[p].utilidadNeta, avg('totalActivo')), fx: p => p === 0 ? null : w(T('utilidadNeta', 1) + '/' + prom('totalActivo')) },
      { nombre: 'ROE (utilidad neta / patrimonio promedio)', t: 'p', ref: '10 % o más', f: p => p === 0 ? null : div(r[p].utilidadNeta, avg('patrimonio')), fx: p => p === 0 ? null : w(T('utilidadNeta', 1) + '/' + prom('patrimonio')) },
      { nombre: 'Rotación de activos totales (activo promedio)', t: 'v', ref: 'Ventas / activo promedio', f: p => p === 0 ? null : div(n('er', 'ventas', p), avg('totalActivo')), fx: p => p === 0 ? null : w(G('er', 'ingreso', 1) + '/' + prom('totalActivo')) }
    ];
  },

  hojaAnalisis() {
    const h = Exportar.Hoja([46, 20, 20, 40]), S = Exportar.S, FM = Exportar.FMT, M = Exportar.M, X = Exportar.fx, A = M.A, d = M.d, r = M.r;
    Exportar.encabezado(h, 'ANÁLISIS FINANCIERO', 'Vertical, razones financieras y DuPont · ' + A[0] + ' (base) vs ' + A[1] + ' (analizado) · el análisis horizontal está en 02_Estados');
    // 1. Vertical
    h.banda('1. ANÁLISIS VERTICAL', S.seccion);
    h.fila(['Cuenta', A[0] + ' %', A[1] + ' %', 'Base de comparación'], S.cab, null, 24);
    const vertical = (estado, baseTxt, baseRef) => {
      M.filas[estado].forEach(x => {
        const cel = [0, 1].map(p => {
          const baseV = estado === 'er' ? Number(d.er.ventas[p]) || 0 : r[p].totalActivo;
          const v = baseV ? x.vals[p] / baseV : 'N/D';
          const f = Exportar.intentar(() => x.row ? 'IFERROR(' + Exportar.Q + Exportar.col(p) + x.row + '/' + baseRef(p) + ',"N/D")' : null);
          return f ? X(f, v, FM.p) : v;
        });
        h.fila([x.nombre, cel[0], cel[1], baseTxt], x.total ? S.total : S.normal, [null, FM.p, FM.p, null]);
      });
    };
    vertical('er', 'Ventas netas', p => Exportar.refG('er', 'ingreso', p));
    h.vacia();
    vertical('bg', 'Activo total', p => Exportar.refT('totalActivo', p));
    h.vacia();
    // 2. Razones
    h.banda('2. RAZONES FINANCIERAS', S.seccion);
    h.fila(['Indicador', A[0], A[1], 'Referencia'], S.cab, null, 24);
    Exportar.razones(M).forEach(x => {
      if (x.g) { h.fila([x.g, '', '', ''], S.nota); return; }
      const fm = x.t === 'p' ? FM.p : (x.t === 'm' ? FM.m : FM.v);
      const cel = [0, 1].map(p => {
        const v = Exportar.nd(x.f(p)), f = Exportar.intentar(() => x.fx(p));
        return f ? X(f, v, fm) : v;
      });
      h.fila([x.nombre, cel[0], cel[1], x.ref], S.normal, [null, fm, fm, null]);
    });
    h.vacia();
    // 3. DuPont
    h.banda('3. SISTEMA DUPONT (ROE = Margen × Rotación × Multiplicador; usa saldos promedio)', S.seccion);
    h.fila(['Componente', A[0], A[1], 'Fórmula'], S.cab, null, 24);
    const ventas = p => Number(d.er.ventas[p]) || 0;
    const dup = p => {
      if (p === 0) return { margen: null, rot: null, mult: null, roe: null, directo: null };
      const act = (r[0].totalActivo + r[1].totalActivo) / 2, pat = (r[0].patrimonio + r[1].patrimonio) / 2, v = ventas(p);
      const margen = v ? r[p].utilidadNeta / v : null, rot = act ? v / act : null, mult = pat ? act / pat : null;
      return { margen, rot, mult, roe: margen !== null && rot !== null && mult !== null ? margen * rot * mult : null, directo: pat ? r[p].utilidadNeta / pat : null };
    };
    const D = [dup(0), dup(1)], w = e => 'IFERROR(' + e + ',"N/D")';
    const prom = k => 'AVERAGE(' + Exportar.refT(k, 0) + ',' + Exportar.refT(k, 1) + ')';
    const r1 = h.sig;
    const f = {
      margen: Exportar.intentar(() => w(Exportar.refT('utilidadNeta', 1) + '/' + Exportar.refG('er', 'ingreso', 1))),
      rot: Exportar.intentar(() => w(Exportar.refG('er', 'ingreso', 1) + '/' + prom('totalActivo'))),
      mult: Exportar.intentar(() => w(prom('totalActivo') + '/' + prom('patrimonio'))),
      directo: Exportar.intentar(() => w(Exportar.refT('utilidadNeta', 1) + '/' + prom('patrimonio')))
    };
    const par = (k, fm) => [Exportar.nd(D[0][k]), f[k] ? X(f[k], Exportar.nd(D[1][k]), fm) : Exportar.nd(D[1][k])];
    h.fila(['Margen de utilidad neta'].concat(par('margen', FM.p), ['Utilidad neta ÷ Ventas']), S.normal, [null, FM.p, FM.p, null]);
    h.fila(['Rotación de activos'].concat(par('rot', FM.v), ['Ventas ÷ Activo total promedio']), S.normal, [null, FM.v, FM.v, null]);
    h.fila(['Multiplicador del capital'].concat(par('mult', FM.v), ['Activo promedio ÷ Patrimonio promedio']), S.normal, [null, FM.v, FM.v, null]);
    h.fila(['ROE (DuPont)', 'N/D', X('IFERROR(D' + r1 + '*D' + (r1 + 1) + '*D' + (r1 + 2) + ',"N/D")', Exportar.nd(D[1].roe), FM.p), 'Margen × Rotación × Multiplicador'], S.total, [null, FM.p, FM.p, null]);
    h.fila(['ROE directo (control)'].concat(par('directo', FM.p), ['Utilidad neta ÷ Patrimonio promedio']), S.normal, [null, FM.p, FM.p, null]);
    return h.construir();
  },

  hojaEquilibrio() {
    const h = Exportar.Hoja([44, 20, 20, 20, 20]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx, nd = Exportar.nd;
    const p = Equilibrio.obtener(), c = Equilibrio.calcular(p, p.meta);
    Exportar.encabezado(h, 'PUNTO DE EQUILIBRIO Y C-V-U', 'Costo-volumen-utilidad · datos del módulo Punto de equilibrio');
    h.banda('DATOS DE ENTRADA', S.seccion);
    h.fila(['Concepto', 'Valor'], S.cab, null, 22);
    const rP = h.fila(['Precio de venta por unidad (C$)', Exportar.ent(p.precio, FM.m)], S.normal);
    const rV = h.fila(['Costo variable por unidad (C$)', Exportar.ent(p.cv, FM.m)], S.normal);
    const rF = h.fila(['Costos fijos (C$)', Exportar.ent(p.cf, FM.m)], S.normal);
    const rU = h.fila(['Unidades vendidas', Exportar.ent(p.unidades, FM.u)], S.normal);
    const rM = h.fila(['Utilidad deseada (C$)', Exportar.ent(p.meta, FM.m)], S.normal);
    h.vacia();
    h.banda('RESULTADOS', S.seccion);
    h.fila(['Concepto', 'Valor', { v: 'Fórmula', span: 3 }], S.cab, null, 22);
    const P = 'C' + rP, V = 'C' + rV, F = 'C' + rF, U = 'C' + rU, Mt = 'C' + rM;
    const r0 = h.sig, mc = 'C' + r0, mcp = 'C' + (r0 + 1), peu = 'C' + (r0 + 2), vt = 'C' + (r0 + 4), cvt = 'C' + (r0 + 5), mct = 'C' + (r0 + 6);
    const fila = (n, f, v, fm, nota, tot) => h.fila([n, X(f, nd(v), fm), { v: nota, span: 3 }], tot ? S.total : S.normal, [null, fm, null]);
    fila('Margen de contribución unitario (C$)', P + '-' + V, c.mc, FM.m, 'Precio − Costo variable');
    fila('Margen de contribución %', 'IFERROR(' + mc + '/' + P + ',"N/D")', c.mcPct, FM.p, 'Margen unitario ÷ Precio');
    fila('Punto de equilibrio (unidades)', 'IF(N(' + mc + ')>0,' + F + '/' + mc + ',"N/D")', c.peU, FM.u, 'Costos fijos ÷ Margen unitario', true);
    fila('Punto de equilibrio (C$)', 'IF(N(' + mcp + ')>0,' + F + '/' + mcp + ',"N/D")', c.peC, FM.m, 'Costos fijos ÷ Margen %', true);
    fila('Ventas (C$)', P + '*' + U, c.ventas, FM.m, 'Precio × Unidades');
    fila('Costo variable total (C$)', V + '*' + U, c.costoVar, FM.m, 'Costo variable × Unidades');
    fila('Margen de contribución total (C$)', vt + '-' + cvt, c.mcTotal, FM.m, 'Ventas − Costo variable');
    fila('Utilidad operativa UAII (C$)', mct + '-' + F, c.uaii, FM.m, 'Margen total − Costos fijos', true);
    fila('Margen de seguridad', 'IFERROR((' + U + '-' + peu + ')/' + U + ',"N/D")', c.ms, FM.p, '(Unidades − PE) ÷ Unidades');
    fila('Unidades para la utilidad deseada', 'IF(N(' + mc + ')>0,(' + F + '+' + Mt + ')/' + mc + ',"N/D")', c.uMeta, FM.u, '(Costos fijos + Utilidad deseada) ÷ Margen unitario');
    h.vacia();
    h.banda('SENSIBILIDAD: UTILIDAD SEGÚN EL VOLUMEN (de 0 a 2 veces las unidades vendidas)', S.seccion);
    h.fila(['Punto', 'Unidades', 'Ingresos (C$)', 'Costos totales (C$)', 'Utilidad (C$)'], S.cab, null, 22);
    for (let i = 0; i <= 8; i++) {
      const row = h.sig, u = p.unidades * 2 * i / 8, ing = u * p.precio, cos = p.cf + u * p.cv;
      h.fila(['Escenario ' + (i + 1),
        X('IF(' + U + '=0,0,' + U + '*2*' + i + '/8)', u, FM.u), X('C' + row + '*' + P, ing, FM.m),
        X(F + '+C' + row + '*' + V, cos, FM.m), X('D' + row + '-E' + row, ing - cos, FM.m)], S.normal, [null, FM.u, FM.m, FM.m, FM.m]);
    }
    return h.construir();
  },

  hojaApalancamiento() {
    const h = Exportar.Hoja([46, 22, 22, 40]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx, nd = Exportar.nd;
    const d = Apalancamiento.obtener(), a = Apalancamiento.periodo(d, d.u1), b = Apalancamiento.periodo(d, d.u2), v = Apalancamiento.variaciones(a, b);
    Exportar.encabezado(h, 'APALANCAMIENTO OPERATIVO, FINANCIERO Y TOTAL', 'GAO, GAF y GAT por método directo y por variaciones');
    h.banda('DATOS DE ENTRADA', S.seccion);
    h.fila(['Concepto', 'Valor'], S.cab, null, 22);
    const e = (n, val, fm) => 'C' + h.fila([n, Exportar.ent(val, fm)], S.normal);
    const U1 = e('Unidades período 1', d.u1, FM.u), U2 = e('Unidades período 2', d.u2, FM.u), PR = e('Precio de venta (C$)', d.precio, FM.m),
      CV = e('Costo variable por unidad (C$)', d.cv, FM.m), CF = e('Costos fijos (C$)', d.cf, FM.m), IN = e('Intereses (C$)', d.intereses, FM.m),
      DP = e('Dividendos preferentes (C$)', d.dividendosPref, FM.m), AC = e('Acciones comunes', d.acciones, FM.u), IS = e('Tasa de impuesto (%)', d.isr, FM.n);
    h.vacia();
    h.banda('RESULTADOS POR PERÍODO', S.seccion);
    h.fila(['Concepto', 'Período 1', 'Período 2', 'Fórmula'], S.cab, null, 22);
    const r0 = h.sig, R = {}; ['uni', 'ventas', 'mc', 'uaii', 'uai', 'imp', 'un', 'disp', 'upa', 'gao', 'gaf', 'gat'].forEach((k, i) => { R[k] = r0 + i; });
    const col = (k, c) => c + R[k];
    const lin = (nombre, k, ff, fm, nota, tot) => h.fila([nombre, X(ff('C', U1), nd(a[k]), fm), X(ff('D', U2), nd(b[k]), fm), nota], tot ? S.total : S.normal, [null, fm, fm, null]);
    h.fila(['Unidades vendidas', X(U1, d.u1, FM.u), X(U2, d.u2, FM.u), 'Dato de entrada'], S.normal, [null, FM.u, FM.u, null]);
    lin('Ventas (C$)', 'ventas', (c, u) => PR + '*' + c + R.uni, FM.m, 'Precio × Unidades');
    lin('Margen de contribución (C$)', 'mc', c => '(' + PR + '-' + CV + ')*' + c + R.uni, FM.m, '(Precio − CV) × Unidades');
    lin('UAII (C$)', 'uaii', c => col('mc', c) + '-' + CF, FM.m, 'Margen de contribución − Costos fijos', true);
    lin('Utilidad antes de impuestos (C$)', 'uai', c => col('uaii', c) + '-' + IN, FM.m, 'UAII − Intereses');
    lin('Impuesto (C$)', 'impuesto', c => 'IF(' + col('uai', c) + '>0,' + col('uai', c) + '*' + IS + '/100,0)', FM.m, 'Solo si hay utilidad');
    lin('Utilidad neta (C$)', 'un', c => col('uai', c) + '-' + col('imp', c), FM.m, 'UAI − Impuesto', true);
    lin('Utilidad disponible comunes (C$)', 'disp', c => col('un', c) + '-' + DP, FM.m, 'Utilidad neta − Dividendos preferentes');
    lin('UPA (C$ por acción)', 'upa', c => 'IFERROR(' + col('disp', c) + '/' + AC + ',"N/D")', FM.m, 'Disponible comunes ÷ Acciones');
    lin('GAO', 'gao', c => 'IFERROR(' + col('mc', c) + '/' + col('uaii', c) + ',"N/D")', FM.v, 'Margen de contribución ÷ UAII', true);
    lin('GAF', 'gaf', c => 'IFERROR(' + col('uaii', c) + '/(' + col('uaii', c) + '-' + IN + '-' + DP + '/(1-' + IS + '/100)),"N/D")', FM.v, 'UAII ÷ (UAII − I − DP ÷ (1 − T))', true);
    lin('GAT', 'gat', c => 'IFERROR(' + col('gao', c) + '*' + col('gaf', c) + ',"N/D")', FM.v, 'GAO × GAF', true);
    h.vacia();
    h.banda('MÉTODO POR VARIACIONES (período 1 a período 2)', S.seccion);
    h.fila(['Concepto', 'Valor', '', 'Fórmula'], S.cab, null, 22);
    const s0 = h.sig;
    const vr = (n, ff, val, fm, nota, tot) => h.fila([n, X(ff, nd(val), fm), '', nota], tot ? S.total : S.normal, [null, fm, null, null]);
    vr('Variación % de ventas', 'IFERROR((D' + R.ventas + '-C' + R.ventas + ')/ABS(C' + R.ventas + '),"N/D")', v.dV, FM.p, '(Ventas 2 − Ventas 1) ÷ |Ventas 1|');
    vr('Variación % de UAII', 'IFERROR((D' + R.uaii + '-C' + R.uaii + ')/ABS(C' + R.uaii + '),"N/D")', v.dU, FM.p, '(UAII 2 − UAII 1) ÷ |UAII 1|');
    vr('Variación % de UPA', 'IFERROR((D' + R.upa + '-C' + R.upa + ')/ABS(C' + R.upa + '),"N/D")', v.dP, FM.p, '(UPA 2 − UPA 1) ÷ |UPA 1|');
    vr('GAO (variaciones)', 'IFERROR(C' + (s0 + 1) + '/C' + s0 + ',"N/D")', v.gao, FM.v, '%ΔUAII ÷ %ΔVentas', true);
    vr('GAF (variaciones)', 'IFERROR(C' + (s0 + 2) + '/C' + (s0 + 1) + ',"N/D")', v.gaf, FM.v, '%ΔUPA ÷ %ΔUAII', true);
    vr('GAT (variaciones)', 'IFERROR(C' + (s0 + 2) + '/C' + s0 + ',"N/D")', v.gat, FM.v, '%ΔUPA ÷ %ΔVentas', true);
    return h.construir();
  },

  hojaFlujo() {
    const h = Exportar.Hoja([62, 20]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx, M = Exportar.M;
    const f = Flujo.obtenerManual(), ind = Flujo.indirecto(M.d, M.r);
    Exportar.encabezado(h, 'FLUJO DE EFECTIVO', 'Flujo manual y método indirecto (con los estados de ' + M.A[0] + ' y ' + M.A[1] + ')');
    h.banda('A. FLUJO POR ACTIVIDADES (datos del módulo Flujo de efectivo)', S.seccion);
    h.fila(['Concepto', 'C$'], S.cab, null, 22);
    const a1 = h.fila(['Efectivo inicial', Exportar.ent(f.inicial, FM.m)], S.normal);
    const a2 = h.fila(['Flujo de operación', Exportar.ent(f.op, FM.m)], S.normal);
    const a3 = h.fila(['Flujo de inversión (salidas en negativo)', Exportar.ent(f.inv, FM.m)], S.normal);
    const a4 = h.fila(['Flujo de financiamiento', Exportar.ent(f.fin, FM.m)], S.normal);
    const neta = f.op + f.inv + f.fin;
    const a5 = h.fila(['Variación neta de efectivo', X('C' + a2 + '+C' + a3 + '+C' + a4, neta, FM.m)], S.total, [null, FM.m]);
    h.fila(['Efectivo final', X('C' + a1 + '+C' + a5, f.inicial + neta, FM.m)], S.total, [null, FM.m]);
    h.vacia();
    h.banda('B. MÉTODO INDIRECTO (calculado desde los Estados financieros)', S.seccion);
    h.fila(['Concepto', 'C$'], S.cab, null, 22);
    const bloque = (titulo, lista, total, nombreTotal) => {
      h.fila([titulo, ''], S.nota);
      const i0 = h.sig;
      lista.forEach(x => h.fila([x[0], x[1]], S.normal, [null, FM.m]));
      return h.fila([nombreTotal, X('SUM(C' + i0 + ':C' + (h.sig - 1) + ')', total, FM.m)], S.total, [null, FM.m]);
    };
    const fo = bloque('Actividades de operación', ind.op, ind.flOp, 'Flujo neto de operación');
    const fi = bloque('Actividades de inversión', ind.inv, ind.flInv, 'Flujo neto de inversión');
    const ff = bloque('Actividades de financiamiento', ind.fin, ind.flFin, 'Flujo neto de financiamiento');
    const nn = h.fila(['Variación neta de efectivo', X('C' + fo + '+C' + fi + '+C' + ff, ind.neta, FM.m)], S.total, [null, FM.m]);
    const ei = h.fila(['Efectivo al inicio (' + M.A[0] + ')', ind.ini], S.normal, [null, FM.m]);
    const ef = h.fila(['Efectivo final calculado', X('C' + ei + '+C' + nn, ind.final, FM.m)], S.total, [null, FM.m]);
    const eb = h.fila(['Efectivo en el balance (' + M.A[1] + ')', ind.enBalance], S.normal, [null, FM.m]);
    h.fila(['Diferencia (debe ser cero)', X('C' + ef + '-C' + eb, ind.diferencia, FM.m)], S.suave, [null, FM.m]);
    return h.construir();
  },

  hojaPresupuestos() {
    const h = Exportar.Hoja([46, 16, 16, 16, 16]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx;
    const d = Presupuestos.obtener(), op = Presupuestos.operativo(d), ca = Presupuestos.caja(d, op);
    const suma = arr => arr.reduce((s, x) => s + (Number(x) || 0), 0);
    Exportar.encabezado(h, 'PLANEACIÓN Y PRESUPUESTOS', 'Presupuesto operativo (3 meses) y presupuesto de caja');
    h.banda('SUPUESTOS DE CAJA', S.seccion);
    const sI = h.fila(['Saldo inicial de caja (C$)', Exportar.ent(d.saldoIni, FM.m)], S.normal);
    const sM = h.fila(['Saldo mínimo deseado (C$)', Exportar.ent(d.saldoMin, FM.m)], S.normal);
    h.vacia();
    h.banda('PRESUPUESTO OPERATIVO', S.seccion);
    h.fila(['Concepto'].concat(d.meses, ['Total']), S.cab, null, 22);
    [['Unidades vendidas', 'u', FM.u], ['Ventas (C$)', 'ventas', FM.m], ['Compras (C$)', 'compras', FM.m], ['Costo de ventas (C$)', 'costoVentas', FM.m],
      ['Utilidad bruta (C$)', 'utilidadBruta', FM.m], ['Gastos de operación (C$)', 'gastos', FM.m], ['UAII (C$)', 'uaii', FM.m],
      ['Intereses (C$)', 'intereses', FM.m], ['Utilidad antes de impuestos (C$)', 'uai', FM.m], ['Impuesto (C$)', 'impuesto', FM.m],
      ['Utilidad neta (C$)', 'un', FM.m]].forEach(([etq, k, fm]) => {
      const vals = op.map(o => o[k]), row = h.sig, tot = ['utilidadBruta', 'uaii', 'un'].includes(k);
      h.fila([etq].concat(vals, [X('SUM(C' + row + ':E' + row + ')', suma(vals), fm)]), tot ? S.total : S.normal, [null, fm, fm, fm, fm]);
    });
    h.vacia();
    h.banda('PRESUPUESTO DE CAJA', S.seccion);
    h.fila(['Concepto'].concat(d.meses, ['']), S.cab, null, 22);
    const cI = h.sig, cC = cI + 1, cP = cI + 2, cF = cI + 3, cE = cI + 4;
    h.fila(['Saldo inicial (C$)', X('C' + sI, ca[0].ini, FM.m), X('C' + cF, ca[1].ini, FM.m), X('D' + cF, ca[2].ini, FM.m), ''], S.normal, [null, FM.m, FM.m, FM.m]);
    h.fila(['(+) Cobros (C$)'].concat(ca.map(c => c.cobros), ['']), S.normal, [null, FM.m, FM.m, FM.m]);
    h.fila(['(−) Pagos (C$)'].concat(ca.map(c => c.pagos), ['']), S.normal, [null, FM.m, FM.m, FM.m]);
    h.fila(['Saldo final de caja (C$)'].concat(['C', 'D', 'E'].map((c, i) => X(c + cI + '+' + c + cC + '-' + c + cP, ca[i].final, FM.m)), ['']), S.total, [null, FM.m, FM.m, FM.m]);
    h.fila(['Excedente / (faltante) vs saldo mínimo (C$)'].concat(['C', 'D', 'E'].map((c, i) => X(c + cF + '-$C$' + sM, ca[i].excedente, FM.m)), ['']), S.normal, [null, FM.m, FM.m, FM.m]);
    h.fila(['Financiamiento requerido (C$)'].concat(['C', 'D', 'E'].map((c, i) => X('MAX(0,-' + c + cE + ')', ca[i].financiar, FM.m)), ['']), S.total, [null, FM.m, FM.m, FM.m]);
    return h.construir();
  },

  hojaProforma() {
    const h = Exportar.Hoja([46, 20, 20]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx, M = Exportar.M, d = M.d, r = M.r;
    const s = Proforma.obtener(), p = Proforma.calcular(d, r, s), a = r[1];
    const e = k => Number(d.er[k][1]) || 0, b = k => Number(d.bg[k][1]) || 0;
    Exportar.encabezado(h, 'ESTADOS PROFORMA', 'Proyección del período siguiente a ' + M.A[1] + ' y financiamiento externo requerido');
    h.banda('SUPUESTOS DE PROYECCIÓN', S.seccion);
    [['Crecimiento de ventas (%)', s.crecimiento], ['Costo de ventas (% de ventas)', s.costoPct], ['Gastos de venta (% de ventas)', s.gVentaPct],
      ['Gastos de administración (% de ventas)', s.gAdminPct], ['Depreciación (C$)', s.depreciacion], ['Intereses (C$)', s.intereses],
      ['Tasa de impuesto (%)', s.isr], ['Cuentas por cobrar (% de ventas)', s.cxcPct], ['Inventarios (% del costo de ventas)', s.invPct],
      ['Cuentas por pagar (% del costo de ventas)', s.cxpPct], ['Compra de activos fijos (C$)', s.compraAF], ['Dividendos (% de la utilidad neta)', s.dividendosPct]
    ].forEach(([n, v]) => h.fila([n, Exportar.ent(v, FM.m)], S.normal));
    h.vacia();
    const sub = t => h.banda(t, S.seccion);
    const cab = () => h.fila(['Concepto', 'Año base ' + M.A[1], 'Proforma'], S.cab, null, 22);
    const lin = (n, x, y, tot) => h.fila([n, x, y], tot ? S.total : S.normal, [null, FM.m, FM.m]);
    sub('ESTADO DE RESULTADOS PROFORMA'); cab();
    lin('Ventas', e('ventas'), p.ventas); lin('(−) Costo de ventas', e('costoVentas'), p.costoVentas);
    lin('Utilidad bruta', a.utilidadBruta, p.utilidadBruta, true);
    lin('(−) Gastos de venta', e('gastosVenta'), p.gVenta); lin('(−) Gastos de administración', e('gastosAdmin'), p.gAdmin);
    lin('(−) Depreciación', e('depreciacion'), p.dep); lin('Utilidad operativa (UAII)', a.uaii, p.uaii, true);
    lin('(−) Intereses', e('intereses'), p.intereses); lin('(+) Otros ingresos netos', e('otrosIngresos'), p.otros);
    lin('Utilidad antes de impuestos', a.uai, p.uai); lin('(−) Impuesto', a.impuesto, p.impuesto);
    lin('Utilidad neta', a.utilidadNeta, p.un, true);
    h.vacia(); sub('BALANCE GENERAL PROFORMA'); cab();
    lin('Efectivo (se mantiene)', b('efectivo'), p.efectivo); lin('Cuentas por cobrar', b('cxc'), p.cxc);
    lin('Inventarios', b('inventarios'), p.inv); lin('Otros activos corrientes', b('otrosAC'), p.otrosAC);
    lin('Total activo corriente', a.ac, p.ac, true); lin('Activos fijos netos', b('activosFijos'), p.af);
    lin('Otros activos no corrientes', b('otrosANC'), p.otrosANC);
    const rA = lin('TOTAL ACTIVO', a.totalActivo, p.totalActivo, true);
    lin('Cuentas por pagar', b('cxp'), p.cxp); lin('Préstamos a corto plazo', b('prestCP'), p.prestCP);
    lin('Otros pasivos corrientes', b('otrosPC'), p.otrosPC); lin('Total pasivo corriente', a.pc, p.pc, true);
    lin('Préstamos a largo plazo', b('prestLP'), p.prestLP); lin('TOTAL PASIVO', a.totalPasivo, p.totalPasivo, true);
    lin('Capital social', b('capital'), p.capital); lin('Utilidades retenidas', b('utilidadesRetenidas'), p.ur);
    lin('TOTAL PATRIMONIO', a.patrimonio, p.patrimonio, true);
    const rP = lin('TOTAL PASIVO + PATRIMONIO', a.totalPP, p.totalPP, true);
    h.fila(['Financiamiento externo requerido (+) / excedente (−)', '', X('D' + rA + '-D' + rP, p.fer, FM.m)], S.total, [null, FM.m, FM.m]);
    h.vacia();
    h.nota('Método crítico: el efectivo se mantiene y la diferencia entre activos y pasivo + patrimonio es el financiamiento externo requerido.', S.nota);
    return h.construir();
  },

  hojaPersonal() {
    const h = Exportar.Hoja([38, 24, 20]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx;
    const x = Personal.obtener(), c = Personal.calcular(x);
    const ing = x.ingresos.length ? x.ingresos : [{ n: '(sin registros)', m: 0 }], gas = x.gastos.length ? x.gastos : [{ n: '(sin registros)', c: '', m: 0 }];
    Exportar.encabezado(h, 'PRESUPUESTO PERSONAL', 'Ingresos, gastos por categoría, saldo disponible y capacidad de ahorro');
    h.banda('INGRESOS', S.seccion);
    h.fila(['Concepto', 'Monto (C$)', ''], S.cab, null, 22);
    const i0 = h.sig;
    ing.forEach(i => h.fila([i.n, Exportar.ent(i.m, FM.m)], S.normal));
    const tI = h.fila(['Total ingresos', X('SUM(C' + i0 + ':C' + (h.sig - 1) + ')', c.totalIng, FM.m)], S.total, [null, FM.m]);
    h.vacia();
    h.banda('GASTOS', S.seccion);
    h.fila(['Concepto', 'Categoría', 'Monto (C$)'], S.cab, null, 22);
    const g0 = h.sig;
    gas.forEach(g => h.fila([g.n, { v: g.c, s: Exportar.S.entrada }, Exportar.ent(g.m, FM.m)], S.normal));
    const g1 = h.sig - 1;
    const tG = h.fila(['Total gastos', '', X('SUM(D' + g0 + ':D' + g1 + ')', c.totalGas, FM.m)], S.total, [null, null, FM.m]);
    h.vacia();
    h.banda('RESULTADOS', S.seccion);
    h.fila(['Concepto', 'Valor', ''], S.cab, null, 22);
    const rS = h.fila(['Saldo disponible (C$)', X('C' + tI + '-D' + tG, c.saldo, FM.m)], S.total, [null, FM.m]);
    h.fila(['Capacidad de ahorro', X('IFERROR(C' + rS + '/C' + tI + ',"N/D")', Exportar.nd(c.capacidad), FM.p)], S.normal, [null, FM.p]);
    const rM = h.fila(['Meta de ahorro (%)', Exportar.ent(x.meta / 100, FM.p)], S.normal);
    const rMM = h.fila(['Meta de ahorro (C$)', X('C' + tI + '*C' + rM, c.metaMonto, FM.m)], S.normal, [null, FM.m]);
    h.fila(['¿Cumple la meta?', X('IF(C' + rS + '>=C' + rMM + ',"Sí","No")', c.saldo >= c.metaMonto ? 'Sí' : 'No')], S.normal);
    h.vacia();
    h.banda('GASTOS POR CATEGORÍA', S.seccion);
    h.fila(['Categoría', 'Monto (C$)', '% de los gastos'], S.cab, null, 22);
    Personal.CATS.forEach(cat => {
      const row = h.sig, m = x.gastos.filter(g => g.c === cat).reduce((s, g) => s + g.m, 0);
      h.fila([cat, X('SUMIF(C' + g0 + ':C' + g1 + ',B' + row + ',D' + g0 + ':D' + g1 + ')', m, FM.m),
        X('IFERROR(C' + row + '/D' + tG + ',"N/D")', c.totalGas ? m / c.totalGas : 'N/D', FM.p)], S.normal, [null, FM.m, FM.p]);
    });
    return h.construir();
  },

  hojaInventario() {
    const h = Exportar.Hoja([24, 12, 12, 12, 14, 12, 16, 18, 14]), S = Exportar.S, FM = Exportar.FMT, X = Exportar.fx, En = Exportar.ent;
    const lista = Inventario.obtener();
    Exportar.encabezado(h, 'CONTROL DE INVENTARIO', 'Existencia = inicial + entradas − salidas · Valor = existencia × costo unitario');
    h.banda('PRODUCTOS Y MOVIMIENTOS', S.seccion);
    h.fila(['Producto', 'Inicial', 'Entradas', 'Salidas', 'Costo unit. (C$)', 'Stock mín.', 'Existencia', 'Valor (C$)', 'Estado'], S.cab, null, 28);
    const r0 = h.sig;
    let total = 0;
    lista.forEach(p => {
      const c = Inventario.calcular(p), row = h.sig; total += c.valor;
      h.fila([{ v: p.n, s: S.entrada }, En(p.ini, FM.u), En(p.ent, FM.u), En(p.sal, FM.u), En(p.costo, FM.m), En(p.min, FM.u),
        X('C' + row + '+D' + row + '-E' + row, c.final, FM.u), X('H' + row + '*F' + row, c.valor, FM.m),
        X('IF(H' + row + '<0,"Error",IF(H' + row + '<=G' + row + ',"Reponer","Normal"))', c.estado)],
        S.normal, [null, FM.u, FM.u, FM.u, FM.m, FM.u, FM.u, FM.m, null]);
    });
    h.fila(['TOTAL VALOR DEL INVENTARIO', '', '', '', '', '', '', lista.length ? X('SUM(I' + r0 + ':I' + (h.sig - 1) + ')', total, FM.m) : 0, ''],
      S.total, [null, null, null, null, null, null, null, FM.m, null]);
    return h.construir();
  },

  hojaFormulas() {
    const h = Exportar.Hoja([44, 54, 12, 26]), S = Exportar.S;
    Exportar.encabezado(h, 'FÓRMULAS UTILIZADAS', 'Referencia de fórmulas por módulo');
    (typeof Formulas !== 'undefined' && Formulas.grupos ? Formulas.grupos : []).forEach(g => {
      h.banda(String(g.titulo).toUpperCase(), S.seccion);
      h.fila(['Concepto', 'Fórmula', 'Unidad', 'Módulo'], S.cab, null, 22);
      g.filas.forEach(f => h.fila([f[0], f[1], f[2], f[3]], S.normal));
      h.vacia();
    });
    return h.construir();
  },

  // ---------- LIBRO ----------
  construirLibro(sel, opciones) {
    Exportar.vivas = !opciones || opciones.vivas !== false;
    Exportar.M = Exportar.modelo();
    const wb = XLSX.utils.book_new(), errores = [], hojas = [];
    const agregar = (nombre, fn) => {
      try { XLSX.utils.book_append_sheet(wb, fn(), nombre); hojas.push(nombre); }
      catch (e) { errores.push(nombre + ': ' + e.message); }
    };
    agregar('00_Portada', () => Exportar.portada(sel));
    const mapa = { panel: 'hojaPanel', estados: 'hojaEstados', analisis: 'hojaAnalisis', equilibrio: 'hojaEquilibrio', apalancamiento: 'hojaApalancamiento',
      flujo: 'hojaFlujo', presupuestos: 'hojaPresupuestos', proforma: 'hojaProforma', personal: 'hojaPersonal', inventario: 'hojaInventario', formulas: 'hojaFormulas' };
    // Estados se arma primero (aunque no se exporte) para conocer las filas que usan las fórmulas de Análisis
    let hojaEst = null;
    try { hojaEst = Exportar.hojaEstados(); } catch (e) { errores.push('02_Estados: ' + e.message); }
    if (!sel.includes('estados')) Exportar.M.ok = false;   // sin la hoja, Análisis usa valores
    Exportar.MODULOS.forEach(m => {
      if (!sel.includes(m.id)) return;
      if (m.id === 'estados') { if (hojaEst) { XLSX.utils.book_append_sheet(wb, hojaEst, m.hoja); hojas.push(m.hoja); } }
      else agregar(m.hoja, () => Exportar[mapa[m.id]]());
    });
    return { wb, errores, hojas };
  },

  // ---------- Pantalla ----------
  render(el) {
    const emp = Empresas.activa;
    const ids = (typeof Seleccion !== 'undefined' && emp) ? Seleccion.ids() : [null, null];
    const A = ids.map(id => (typeof Estados !== 'undefined' ? Estados.etiqueta(id) : '—'));
    const tarjetas = Exportar.MODULOS.map((m, i) =>
      '<label class="exp-card"><input type="checkbox" value="' + m.id + '" checked>' +
      '<span class="exp-num">' + m.hoja.slice(0, 2) + '</span>' +
      '<span class="exp-txt"><strong>' + esc(m.nombre) + '</strong><small>' + esc(m.desc) + '</small><em>' + esc(m.hoja) + '</em></span>' +
      '<span class="exp-marca"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span></label>').join('');
    el.innerHTML =
      '<div class="tarjeta exp-cab">' +
        '<div><h3>' + esc(emp ? emp.nombre : 'Sin empresa activa') + '</h3>' +
        '<p class="nota-pie">Los estados y el análisis usan el par de períodos elegido en el menú lateral.</p></div>' +
        '<div class="exp-chips"><span class="exp-chip">Base: <strong>' + esc(A[0]) + '</strong></span>' +
        '<span class="exp-chip">Analizado: <strong>' + esc(A[1]) + '</strong></span><span class="exp-chip">Moneda: <strong>C$</strong></span></div>' +
      '</div>' +
      '<div class="exp-barra"><div class="exp-contador" id="exp-cuenta"></div>' +
        '<div><button class="btn sec" id="exp-todo">Seleccionar todo</button> <button class="btn sec" id="exp-nada">Quitar todo</button></div></div>' +
      '<div class="exp-grid">' + tarjetas + '</div>' +
      '<div class="tarjeta exp-opc"><label class="chk"><input type="checkbox" id="exp-vivas" checked> ' +
        '<span><strong>Fórmulas vivas de Excel</strong><small>Si está activo, el libro se recalcula al cambiar una celda amarilla. Si no, solo se guardan los valores.</small></span></label></div>' +
      '<div class="exp-pie"><div class="exp-archivo" id="exp-archivo"></div>' +
        '<button class="btn" id="exp-generar">Generar Excel</button></div>' +
      '<div id="exp-estado" class="cuadre"></div>';

    const cajas = () => [...el.querySelectorAll('.exp-grid input')];
    const refrescar = () => {
      const n = cajas().filter(c => c.checked).length;
      el.querySelector('#exp-cuenta').textContent = n + ' de ' + cajas().length + ' hojas seleccionadas (más la portada)';
      el.querySelector('#exp-archivo').textContent = Exportar.nombreArchivo();
      cajas().forEach(c => c.closest('.exp-card').classList.toggle('on', c.checked));
    };
    el.querySelector('.exp-grid').addEventListener('change', refrescar);
    el.querySelector('#exp-todo').addEventListener('click', () => { cajas().forEach(c => { c.checked = true; }); refrescar(); });
    el.querySelector('#exp-nada').addEventListener('click', () => { cajas().forEach(c => { c.checked = false; }); refrescar(); });
    refrescar();

    el.querySelector('#exp-generar').addEventListener('click', () => {
      const est = el.querySelector('#exp-estado'), btn = el.querySelector('#exp-generar');
      const aviso = (clase, html) => { est.className = 'cuadre ' + clase; est.innerHTML = html; };
      const sel = cajas().filter(c => c.checked).map(c => c.value);
      if (!Empresas.activa) return aviso('mal', 'Entra primero a una empresa desde "Mis empresas".');
      if (!sel.length) return aviso('mal', 'Selecciona al menos una hoja.');
      if (typeof XLSX === 'undefined') return aviso('mal', 'No se encontró librerias/xlsx.bundle.js. Revisa la carpeta librerias.');
      btn.disabled = true; btn.textContent = 'Generando...';
      setTimeout(() => {
        try {
          const { wb, errores, hojas } = Exportar.construirLibro(sel, { vivas: el.querySelector('#exp-vivas').checked });
          const nombre = Exportar.nombreArchivo();
          XLSX.writeFile(wb, nombre);
          aviso(errores.length ? 'mal' : 'ok', '<strong>Archivo generado:</strong> ' + esc(nombre) + '<br>Hojas incluidas (' + hojas.length + '): ' + esc(hojas.join(', ')) +
            (errores.length ? '<br><strong>Advertencias:</strong> ' + esc(errores.join(' | ')) : ''));
        } catch (e) { aviso('mal', 'No se pudo generar el Excel: ' + esc(e.message)); }
        btn.disabled = false; btn.textContent = 'Generar Excel';
      }, 30);
    });
  }
};

// Agrega la opción al menú y registra el módulo
SECCIONES.push({ titulo: 'Reportes', items: [{ id: 'exportar', nombre: 'Exportar a Excel', icono: 'doc' }] });
Modulos.exportar = {
  titulo: 'Exportar a Excel',
  subtitulo: 'Libro con una hoja por módulo, tus cuentas y fórmulas vivas, con el formato de la Plantilla GFO',
  render(el) { Exportar.render(el); }
};