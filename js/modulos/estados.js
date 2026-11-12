// Estados financieros dinámicos: N períodos y cuentas personalizables.
// Mejoras: validación negativos · tags de grupo · advertencias de cuentas críticas
//          cuadre detallado · semáforo de completitud · duplicar período · composición de totales

const EST_FILAS_ER = [
  ['ventas', 'Ventas netas'], ['costoVentas', '(-) Costo de ventas'],
  ['@utilidadBruta', 'Utilidad bruta'],
  ['gastosVenta', '(-) Gastos de venta'], ['gastosAdmin', '(-) Gastos de administración'],
  ['depreciacion', '(-) Depreciación'], ['@uaii', 'Utilidad operativa (UAII)'],
  ['intereses', '(-) Gastos por intereses'], ['otrosIngresos', '(+) Otros ingresos (gastos) netos'],
  ['@uai', 'Utilidad antes de impuestos'], ['@impuesto', '(-) Impuesto sobre la renta'],
  ['@utilidadNeta', 'Utilidad neta']
];
const EST_FILAS_BG = [
  ['efectivo', 'Efectivo y equivalentes'], ['cxc', 'Cuentas por cobrar'],
  ['inventarios', 'Inventarios'], ['otrosAC', 'Otros activos corrientes'],
  ['@ac', 'Total activo corriente'],
  ['activosFijos', 'Propiedad, planta y equipo (neto)'], ['otrosANC', 'Otros activos no corrientes'],
  ['@totalActivo', 'TOTAL ACTIVO'],
  ['cxp', 'Cuentas por pagar'], ['prestCP', 'Préstamos a corto plazo'],
  ['otrosPC', 'Otros pasivos corrientes'], ['@pc', 'Total pasivo corriente'],
  ['prestLP', 'Préstamos a largo plazo'], ['@totalPasivo', 'TOTAL PASIVO'],
  ['capital', 'Capital social'], ['utilidadesRetenidas', 'Utilidades retenidas'],
  ['@patrimonio', 'TOTAL PATRIMONIO'], ['@totalPP', 'TOTAL PASIVO + PATRIMONIO']
];

const ER_CLAVES = ['ventas', 'costoVentas', 'gastosVenta', 'gastosAdmin', 'depreciacion', 'intereses', 'otrosIngresos'];
const BG_CLAVES = ['efectivo', 'cxc', 'inventarios', 'otrosAC', 'activosFijos', 'otrosANC',
  'cxp', 'prestCP', 'otrosPC', 'prestLP', 'capital', 'utilidadesRetenidas'];

const ER_GRUPO_CLAVE = { ingreso: 'ventas', costo: 'costoVentas', gasto: 'gastosAdmin',
  depreciacion: 'depreciacion', interes: 'intereses', otro: 'otrosIngresos' };
const BG_GRUPO_CLAVE = { ac: 'otrosAC', anc: 'otrosANC', pc: 'otrosPC', pnc: 'prestLP', pat: 'utilidadesRetenidas' };

const ER_ORDEN = ['ingreso', 'costo', '@utilidadBruta', 'gasto', 'depreciacion', '@uaii',
  'interes', 'otro', '@uai', '@impuesto', '@utilidadNeta'];
const BG_ORDEN = ['ac', '@ac', 'anc', '@totalActivo', 'pc', '@pc', 'pnc', '@totalPasivo',
  'pat', '@patrimonio', '@totalPP'];

const ETIQUETAS_TOTAL = {
  utilidadBruta: 'Utilidad bruta', uaii: 'Utilidad operativa (UAII)', uai: 'Utilidad antes de impuestos',
  impuesto: '(-) Impuesto sobre la renta', utilidadNeta: 'Utilidad neta',
  ac: 'Total activo corriente', totalActivo: 'TOTAL ACTIVO', pc: 'Total pasivo corriente',
  totalPasivo: 'TOTAL PASIVO', patrimonio: 'TOTAL PATRIMONIO', totalPP: 'TOTAL PASIVO + PATRIMONIO'
};

// Mejora 7 — qué cuentas componen cada total
const EST_COMPOSICION = {
  utilidadBruta:  'Ventas netas − Costo de ventas',
  uaii:           'Utilidad bruta − Gastos de venta − Gastos de administración − Depreciación',
  uai:            'UAII − Intereses + Otros ingresos',
  impuesto:       'Utilidad antes de impuestos × ISR %',
  utilidadNeta:   'UAI − Impuesto sobre la renta',
  ac:             'Efectivo + Cuentas por cobrar + Inventarios + Otros activos corrientes',
  totalActivo:    'Total activo corriente + Propiedad planta y equipo + Otros activos no corrientes',
  pc:             'Cuentas por pagar + Préstamos a corto plazo + Otros pasivos corrientes',
  totalPasivo:    'Total pasivo corriente + Préstamos a largo plazo',
  patrimonio:     'Capital social + Utilidades retenidas',
  totalPP:        'TOTAL PASIVO + TOTAL PATRIMONIO'
};

// Mejora 1 — cuentas que normalmente no deben ser negativas
const EST_POSITIVAS = new Set([
  'ventas', 'inventarios', 'efectivo', 'cxc', 'otrosAC', 'activosFijos', 'otrosANC',
  'cxp', 'prestCP', 'otrosPC', 'prestLP', 'capital'
]);

// Mejora 3 — cuentas cuya ausencia en cero afecta otros módulos
const EST_CRITICAS = [
  { rol: 'ventas',       aviso: 'Ventas netas en cero: el análisis de rentabilidad, flujo y equilibrio no podrán calcularse.' },
  { rol: 'costoVentas',  aviso: 'Costo de ventas en cero: el margen bruto y el punto de equilibrio quedarán incompletos.' },
  { rol: 'efectivo',     aviso: 'Efectivo en cero: los indicadores de liquidez no reflejarán la situación real.' },
  { rol: 'activosFijos', aviso: 'Activos fijos en cero: los módulos de apalancamiento usarán este valor para sus cálculos.' }
];

const Estados = {
  vacio() {
    return { version: 2, isr: 30, cuentas: Plantillas.cuentasDe('comercial'), valores: {}, historial: {} };
  },

  leerCrudo() {
    const x = Datos.leer('estados');
    if (x && x.cuentas) { if (!x.historial) x.historial = {}; return x; }
    if (x && x.er) return Estados.migrar(x);
    return Estados.vacio();
  },

  guardarCrudo(x, pid) {
    if (pid) {
      if (!x.historial) x.historial = {};
      const ahora = new Date();
      const fecha = [
        String(ahora.getDate()).padStart(2,'0'),
        String(ahora.getMonth()+1).padStart(2,'0'),
        ahora.getFullYear()
      ].join('/') + ' ' + String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
      x.historial[pid] = { ts: ahora.getTime(), fecha };
    }
    Datos.guardar('estados', x);
  },

  migrar(old) {
    const x = Estados.vacio();
    x.isr = Number(old.isr) || 30;
    const ps = Empresas.periodos || [];
    const ids = [ps.length > 1 ? ps[ps.length - 2].id : null, ps.length ? ps[ps.length - 1].id : null];
    ids.forEach((pid, p) => {
      if (!pid) return;
      x.valores[pid] = {};
      ER_CLAVES.forEach(k => { x.valores[pid][k] = Number(((old.er && old.er[k]) || [])[p]) || 0; });
      BG_CLAVES.forEach(k => { x.valores[pid][k] = Number(((old.bg && old.bg[k]) || [])[p]) || 0; });
    });
    return x;
  },

  periodo(id) { return (Empresas.periodos || []).find(p => p.id === id) || null; },
  etiqueta(id) { const p = Estados.periodo(id); return p ? p.etiqueta : '—'; },

  compat(raw, ids) {
    const d = { isr: Number(raw.isr) || 0, ids, anios: ids.map(id => Estados.etiqueta(id)), anioFin: 0, er: {}, bg: {} };
    const u = Estados.periodo(ids[ids.length - 1]);
    d.anioFin = u ? Number(String(u.fecha_fin).slice(0, 4)) : new Date().getFullYear();
    ER_CLAVES.forEach(k => { d.er[k] = ids.map(() => 0); });
    BG_CLAVES.forEach(k => { d.bg[k] = ids.map(() => 0); });
    const valores = raw.valores || {};
    const sumar = (lista, destino, mapa) => lista.forEach(a => {
      const clave = a.rol || mapa[a.grupo];
      if (!clave || !destino[clave]) return;
      ids.forEach((pid, p) => { destino[clave][p] += Number((valores[pid] || {})[a.id]) || 0; });
    });
    sumar((raw.cuentas && raw.cuentas.er) || [], d.er, ER_GRUPO_CLAVE);
    sumar((raw.cuentas && raw.cuentas.bg) || [], d.bg, BG_GRUPO_CLAVE);
    return d;
  },

  obtener() { return Estados.compat(Estados.leerCrudo(), Seleccion.ids()); },

  calcular(d) {
    return d.ids.map((_, p) => {
      const n = obj => Number(obj[p]) || 0;
      const e = d.er, b = d.bg;
      const utilidadBruta = n(e.ventas) - n(e.costoVentas);
      const uaii = utilidadBruta - n(e.gastosVenta) - n(e.gastosAdmin) - n(e.depreciacion);
      const uai = uaii - n(e.intereses) + n(e.otrosIngresos);
      const impuesto = uai > 0 ? uai * d.isr / 100 : 0;
      const utilidadNeta = uai - impuesto;
      const ac = n(b.efectivo) + n(b.cxc) + n(b.inventarios) + n(b.otrosAC);
      const anc = n(b.activosFijos) + n(b.otrosANC);
      const pc = n(b.cxp) + n(b.prestCP) + n(b.otrosPC);
      const pnc = n(b.prestLP);
      const patrimonio = n(b.capital) + n(b.utilidadesRetenidas);
      return {
        utilidadBruta, uaii, uai, impuesto, utilidadNeta, ac, anc,
        totalActivo: ac + anc, pc, pnc, totalPasivo: pc + pnc, patrimonio,
        totalPP: pc + pnc + patrimonio, diferencia: ac + anc - (pc + pnc + patrimonio)
      };
    });
  },

  porGrupo(lista, grupo) { return lista.filter(a => a.grupo === grupo); },

  // Mejora 2 — tag visible que indica en qué clave de cálculo acumula cada cuenta personalizada
  filaCuenta(a, raw, ids) {
    const mapaGrupo = { ...ER_GRUPO_CLAVE, ...BG_GRUPO_CLAVE };
    const sinRol = !a.rol && a.grupo && mapaGrupo[a.grupo];
    const tagInfo = sinRol
      ? ' <span class="est-tag-rol" title="Esta cuenta se acumula en la clave: ' + esc(mapaGrupo[a.grupo]) + '">grupo: ' + esc(a.grupo) + '</span>'
      : '';
    const esPosi = EST_POSITIVAS.has(a.rol) || EST_POSITIVAS.has(a.id);
    const celdas = ids.map(pid => {
      const v = (raw.valores[pid] || {})[a.id];
      const num = Number(v) || 0;
      const cls = esPosi && num < 0 ? ' est-negativo' : num === 0 ? ' est-cero' : '';
      const title = esPosi && num < 0
        ? ' title="Este valor normalmente no debería ser negativo"'
        : num === 0 ? ' title="Sin valor registrado aún"' : '';
      return '<td><input type="text" inputmode="decimal" data-validar="numero" data-acc="' + a.id +
        '" data-per="' + pid + '" data-posi="' + (esPosi ? '1' : '0') +
        '" class="est-inp' + cls + '"' + title + ' value="' + (v === undefined ? 0 : v) + '"></td>';
    }).join('');
    return '<tr><td>' + esc(a.nombre) + tagInfo + '</td>' + celdas + '</tr>';
  },

  // Mejora 7 — fila de total con composición visible al pasar el cursor
  filaTotal(k, ids, colores) {
    const comp = EST_COMPOSICION[k] || '';
    const info = comp
      ? ' <span class="est-info-total" title="' + comp + '">?</span>'
      : '';
    return '<tr class="total"><td>' + ETIQUETAS_TOTAL[k] + info + '</td>' +
      ids.map((_, p) => '<td id="c-' + k + '-' + p + '" class="' + (colores[p] || '') + '">—</td>').join('') + '</tr>';
  },

  tabla(raw, ids, estado, orden) {
    const colores = ['est-col-a', 'est-col-b', 'est-col-c'];
    const cab = '<tr><th>Cuenta</th>' + ids.map((pid, i) =>
      '<th class="' + (colores[i] || '') + '">' + esc(Estados.etiqueta(pid)) + '</th>'
    ).join('') + '</tr>';
    const cuerpo = orden.map(item => {
      if (item[0] === '@') return Estados.filaTotal(item.slice(1), ids, colores);
      return Estados.porGrupo(raw.cuentas[estado], item).map(a => Estados.filaCuenta(a, raw, ids)).join('');
    }).join('');
    return '<table class="tabla">' + cab + cuerpo + '</table>';
  },

  // Mejora 3 — panel de advertencias sobre cuentas críticas y negativos
  panelAdvertencias(raw, ids, d) {
    if (!d) d = Estados.compat(raw, ids);
    const valores = raw.valores || {};
    const hayDatos = ids.some(pid => Object.values(valores[pid] || {}).some(v => Number(v)));
    if (!hayDatos) return '';
    const avisos = [];
    EST_CRITICAS.forEach(c => {
      const arr = (d.er || {})[c.rol] || (d.bg || {})[c.rol];
      if (!arr) return;
      if (ids.every((_, p) => !Number(arr[p]))) avisos.push(c.aviso);
    });
    const negativos = [];
    ids.forEach(pid => {
      const v = valores[pid] || {};
      EST_POSITIVAS.forEach(k => {
        if (v[k] !== undefined && Number(v[k]) < 0)
          negativos.push(esc(Estados.etiqueta(pid)) + ' → ' + k);
      });
    });
    if (negativos.length)
      avisos.push('Valores negativos en cuentas que normalmente son positivas: ' + negativos.join(', ') + '.');
    if (!avisos.length) return '';
    return '<div class="est-advertencias"><strong>Advertencias del módulo</strong><ul>' +
      avisos.map(a => '<li>' + a + '</li>').join('') + '</ul></div>';
  },

  // Mejora 4 — cuadre detallado con indicación del sentido de la diferencia
  textoCuadre(r, ids) {
    const hay = r.some(rp => rp.totalActivo || rp.totalPP);
    if (!hay) return { clase: 'neutro', html: 'Todavía no hay montos en el Balance General. La comprobación aparecerá cuando los escribas.' };
    const malos = [];
    r.forEach((rp, p) => {
      if (Math.abs(rp.diferencia) < 0.5) return;
      const signo = rp.diferencia > 0 ? 'el Activo supera' : 'el Pasivo + Patrimonio supera';
      malos.push('<strong>' + esc(Estados.etiqueta(ids[p])) + '</strong>: ' + signo + ' por ' + Fmt.moneda(Math.abs(rp.diferencia)));
    });
    if (malos.length)
      return { clase: 'mal', html: 'El balance no cuadra. ' + malos.join(' | ') + '. Revisa activo corriente, activo no corriente, pasivos y patrimonio.' };
    return { clase: 'ok', html: 'Activo = Pasivo + Patrimonio en los períodos con montos.' };
  },

  // Mejora 5 — semáforo de completitud por período: detecta campos críticos vacíos o balance sin cuadrar
  semaforoCompletitud(raw, ids, r) {
    const valores = raw.valores || {};
    // Claves que deben tener valor para que el período no sea considerado incompleto
    const clavesObligadas = ['ventas', 'costoVentas', 'efectivo', 'activosFijos', 'capital'];
    return ids.map((pid, p) => {
      const v = valores[pid] || {};
      const faltantes = clavesObligadas.filter(k => !Number(v[k]));
      const sinCuadrar = r && r[p] && Math.abs(r[p].diferencia) >= 0.5;
      if (!Object.values(v).some(x => Number(x))) return null; // sin datos: no muestra nada
      if (faltantes.length === 0 && !sinCuadrar) return 'ok';
      return 'incompleto';
    });
  },

  // Mejora 6 — duplicar los valores de un período en otro (para usarlo como base)
  modalDuplicar(raw, ids, onDone) {
    if (ids.length < 2) { alert('Necesitas al menos dos períodos para usar esta función.'); return; }
    const opts = ids.map((pid, i) =>
      '<option value="' + pid + '">' + esc(Estados.etiqueta(pid)) + '</option>'
    ).join('');
    const fondo = document.createElement('div');
    fondo.className = 'est-modal-fondo';
    fondo.innerHTML =
      '<div class="est-modal">' +
        '<h3>Duplicar período</h3>' +
        '<p style="font-size:13px;opacity:.7;margin:0 0 16px">Copia todos los montos de un período a otro. Los montos existentes en el destino se reemplazarán.</p>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">' +
          '<label style="flex:1;min-width:140px">Origen<select id="dup-origen" style="display:block;width:100%;margin-top:4px">' + opts + '</select></label>' +
          '<label style="flex:1;min-width:140px">Destino<select id="dup-dest" style="display:block;width:100%;margin-top:4px">' + opts + '</select></label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          '<button class="btn sec est-cerrar-dup">Cancelar</button>' +
          '<button class="btn est-confirmar-dup">Copiar montos</button>' +
        '</div>' +
      '</div>';
    // Pre-seleccionar: origen = primer período, destino = último
    document.body.appendChild(fondo);
    fondo.querySelector('#dup-dest').value = ids[ids.length - 1];
    fondo.querySelector('.est-cerrar-dup').onclick = () => fondo.remove();
    fondo.addEventListener('click', e => { if (e.target === fondo) fondo.remove(); });
    fondo.querySelector('.est-confirmar-dup').onclick = () => {
      const origen = fondo.querySelector('#dup-origen').value;
      const dest   = fondo.querySelector('#dup-dest').value;
      if (origen === dest) { alert('El período de origen y el destino son el mismo. Elige uno diferente.'); return; }
      const x = Estados.leerCrudo();
      const valOrigen = x.valores[origen] || {};
      x.valores[dest] = Object.assign({}, valOrigen);
      Estados.guardarCrudo(x, dest);
      fondo.remove();
      if (onDone) onDone();
    };
  },

  mostrarHistorial(raw, ids) {
    const hist = raw.historial || {};
    const filas = ids.map(pid =>
      '<tr><td>' + esc(Estados.etiqueta(pid)) + '</td><td>' +
      (hist[pid] ? hist[pid].fecha : '<em style="opacity:.6">Sin cambios registrados</em>') + '</td></tr>'
    ).join('');
    const fondo = document.createElement('div');
    fondo.className = 'est-modal-fondo';
    fondo.innerHTML =
      '<div class="est-modal">' +
        '<h3>Historial de modificaciones</h3>' +
        '<p style="font-size:13px;opacity:.7;margin:0 0 14px">Se registra la última vez que se guardaron cambios en cada período.</p>' +
        '<table class="tabla"><tr><th>Período</th><th>Última modificación</th></tr>' + filas + '</table>' +
        '<button class="btn sec est-cerrar-hist" style="margin-top:16px">Cerrar</button>' +
      '</div>';
    document.body.appendChild(fondo);
    fondo.querySelector('.est-cerrar-hist').onclick = () => fondo.remove();
    fondo.addEventListener('click', e => { if (e.target === fondo) fondo.remove(); });
  },

  render(el) {
    const ps = Empresas.periodos || [];
    if (!ps.length) {
      el.innerHTML = '<div class="aviso">Esta empresa todavía no tiene períodos. Agrégalos en el módulo Períodos.</div>';
      return;
    }
    const raw = Estados.leerCrudo(), ids = ps.map(p => p.id);

    if (!document.getElementById('est-estilos')) {
      const s = document.createElement('style'); s.id = 'est-estilos';
      s.textContent = [
        '.est-col-a { border-top: 3px solid var(--color-primario,#2d6a4f) !important }',
        '.est-col-b { border-top: 3px solid #b5835a !important }',
        '.est-col-c { border-top: 3px solid #4a7c99 !important }',
        '.est-inp { width:100%;background:transparent;border:none;text-align:right;font-family:inherit;font-size:inherit;padding:0 }',
        '.est-inp.est-cero { color:var(--texto-suave,#aaa);font-style:italic }',
        '.est-inp.est-negativo { color:#c0392b!important;background:#fff0ee!important;border-radius:4px;padding:0 3px }',
        '.est-tag-rol { font-size:10px;background:#eef4ff;color:#3a5a8a;border-radius:4px;padding:1px 5px;margin-left:6px;vertical-align:middle;white-space:nowrap;cursor:default }',
        '.est-advertencias { background:#fffbea;border-left:4px solid #f0a500;border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:12px;font-size:13px }',
        '.est-advertencias ul { margin:5px 0 0;padding-left:18px }',
        '.est-advertencias li { margin-bottom:3px }',
        // Mejora 7 — botón de composición de totales
        '.est-info-total { display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#e0e8f0;color:#3a5a8a;font-size:10px;font-weight:700;margin-left:6px;cursor:default;vertical-align:middle;user-select:none }',
        // Mejora 5 — semáforo de completitud en el encabezado
        '.est-semaforo { display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:6px;vertical-align:middle }',
        '.est-semaforo.ok { background:#2d6a4f }',
        '.est-semaforo.incompleto { background:#e07b39 }',
        '.est-modal-fondo { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center }',
        '.est-modal { background:var(--fondo-tarjeta,#fff);border-radius:12px;padding:24px;max-width:520px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,.2) }',
        '.est-modal h3 { margin:0 0 4px }',
        '.est-btn-vacio { font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid var(--color-borde,#ddd);background:transparent;cursor:pointer;color:var(--texto-suave,#888);transition:all .2s }',
        '.est-btn-vacio.activo { background:var(--color-primario,#2d6a4f);color:#fff;border-color:transparent }',
        'tr.est-vacia-dim td { opacity:.3 }'
      ].join('');
      document.head.appendChild(s);
    }

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="barra-acciones">' +
        '<label class="campo corto">ISR (%)<input type="text" id="est-isr" data-validar="numero" value="' + raw.isr + '"></label>' +
        '<button class="btn sec" id="est-btn-dup">Duplicar período</button>' +
        '<button class="btn sec" id="est-btn-hist">Historial</button>' +
        '<button class="btn sec peligro" id="est-limpiar">Borrar montos</button>' +
      '</div>' +
      '<div id="est-avisos"></div>' +
      '<div class="aviso">Escribe los montos de cada período. Para cambiar nombres, agregar o quitar cuentas usa ' +
        '<strong>Configurar cuentas</strong>. El par de períodos que se compara se elige en el menú lateral. ' +
        'Los círculos de colores en los encabezados muestran si el período está completo (<span class="est-semaforo ok" style="display:inline-block"></span>) o le faltan datos clave (<span class="est-semaforo incompleto" style="display:inline-block"></span>).</div>' +
      '<div class="tarjeta" id="est-card-er" style="margin-top:16px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<h3 style="margin:0;flex:1">Estado de Resultados</h3>' +
          '<button class="est-btn-vacio" id="est-vacio-er">Resaltar vacíos</button>' +
        '</div>' +
        '<div class="tabla-scroll" id="est-wrap-er">' + Estados.tabla(raw, ids, 'er', ER_ORDEN) + '</div>' +
      '</div>' +
      '<div class="tarjeta" id="est-card-bg" style="margin-top:16px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<h3 style="margin:0;flex:1">Balance General</h3>' +
          '<button class="est-btn-vacio" id="est-vacio-bg">Resaltar vacíos</button>' +
        '</div>' +
        '<div class="tabla-scroll" id="est-wrap-bg">' + Estados.tabla(raw, ids, 'bg', BG_ORDEN) + '</div>' +
        '<div id="est-cuadre" class="cuadre"></div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    // Mejora 5 — actualizar semáforos en los encabezados de columna
    const actualizarSemaforosTh = (semaforoArr) => {
      ['est-wrap-er', 'est-wrap-bg'].forEach(wrapId => {
        const wrap = raiz.querySelector('#' + wrapId);
        if (!wrap) return;
        const ths = wrap.querySelectorAll('table > thead th, table tr:first-child th');
        ids.forEach((_, p) => {
          // El primer th es "Cuenta", los demás son los períodos
          const th = ths[p + 1];
          if (!th) return;
          // Eliminar semáforo anterior si existe
          const viejo = th.querySelector('.est-semaforo');
          if (viejo) viejo.remove();
          if (semaforoArr[p] === null) return;
          const dot = document.createElement('span');
          dot.className = 'est-semaforo ' + (semaforoArr[p] === 'ok' ? 'ok' : 'incompleto');
          const estado = semaforoArr[p] === 'ok' ? 'Período completo' : 'Faltan datos clave o el balance no cuadra';
          dot.title = estado;
          th.appendChild(dot);
        });
      });
    };

    const refrescar = () => {
      const rawFresh = Estados.leerCrudo();
      const d = Estados.compat(rawFresh, ids);
      const r = Estados.calcular(d);
      r.forEach((rp, p) => Object.keys(rp).forEach(k => {
        const c = raiz.querySelector('#c-' + k + '-' + p);
        if (c) c.textContent = Fmt.moneda(rp[k]);
      }));
      const cuadre = Estados.textoCuadre(r, ids);
      const caja = raiz.querySelector('#est-cuadre');
      caja.className = 'cuadre ' + cuadre.clase;
      caja.innerHTML = cuadre.html;
      raiz.querySelector('#est-avisos').innerHTML = Estados.panelAdvertencias(rawFresh, ids, d);
      // Mejora 5 — recalcular semáforos
      actualizarSemaforosTh(Estados.semaforoCompletitud(rawFresh, ids, r));
    };

    ['er', 'bg'].forEach(est => {
      const btn = raiz.querySelector('#est-vacio-' + est);
      const card = raiz.querySelector('#est-card-' + est);
      let activo = false;
      btn.addEventListener('click', () => {
        activo = !activo;
        btn.classList.toggle('activo', activo);
        btn.textContent = activo ? 'Ocultar vacíos' : 'Resaltar vacíos';
        card.querySelectorAll('tr').forEach(tr => {
          const inps = tr.querySelectorAll('input');
          if (!inps.length) return;
          const todosCero = Array.from(inps).every(inp => !Number(Fmt.aNum(inp.value)));
          tr.classList.toggle('est-vacia-dim', activo && todosCero);
        });
      });
    });

    raiz.addEventListener('input', e => {
      const t = e.target, x = Estados.leerCrudo();
      let pid = null;
      if (t.id === 'est-isr') {
        x.isr = Fmt.aNum(t.value);
      } else if (t.dataset.acc) {
        pid = t.dataset.per;
        x.valores[pid] = x.valores[pid] || {};
        x.valores[pid][t.dataset.acc] = Fmt.aNum(t.value);
        if (t.dataset.posi === '1') {
          const v = Fmt.aNum(t.value);
          t.classList.toggle('est-negativo', v < 0);
          t.classList.toggle('est-cero', v === 0);
        }
      } else { return; }
      Estados.guardarCrudo(x, pid);
      refrescar();
    });

    raiz.querySelector('#est-limpiar').addEventListener('click', () => {
      if (!confirm('¿Borrar todos los montos de los estados financieros? Las cuentas se conservan.')) return;
      const x = Estados.leerCrudo();
      x.valores = {};
      x.historial = {};
      Estados.guardarCrudo(x);
      Estados.render(el);
      Validar.activar(el);
    });

    raiz.querySelector('#est-btn-hist').addEventListener('click', () => {
      Estados.mostrarHistorial(Estados.leerCrudo(), ids);
    });

    // Mejora 6 — botón duplicar período
    raiz.querySelector('#est-btn-dup').addEventListener('click', () => {
      Estados.modalDuplicar(Estados.leerCrudo(), ids, () => {
        Estados.render(el);
        Validar.activar(el);
      });
    });

    refrescar();
  }
};

Modulos.estados = {
  titulo: 'Estados financieros',
  subtitulo: 'Balance General y Estado de Resultados por período',
  render(el) { Estados.render(el); }
};