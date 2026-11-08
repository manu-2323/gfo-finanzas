// Estados financieros dinámicos: N períodos y cuentas personalizables.
// Datos guardados ('estados'): { version: 2, isr, cuentas: { er: [...], bg: [...] },
//   valores: { [idPeriodo]: { [idCuenta]: monto } } }
// Estados.obtener() entrega la misma forma de siempre (arreglos por período) para el par
// de períodos elegido, así los demás módulos siguen funcionando.

// Filas fijas: las usa el análisis horizontal y vertical
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

// Claves de cálculo (una por rol)
const ER_CLAVES = ['ventas', 'costoVentas', 'gastosVenta', 'gastosAdmin', 'depreciacion', 'intereses', 'otrosIngresos'];
const BG_CLAVES = ['efectivo', 'cxc', 'inventarios', 'otrosAC', 'activosFijos', 'otrosANC',
  'cxp', 'prestCP', 'otrosPC', 'prestLP', 'capital', 'utilidadesRetenidas'];

// Cuentas sin rol: se suman a la clave de cálculo que corresponde a su grupo
const ER_GRUPO_CLAVE = { ingreso: 'ventas', costo: 'costoVentas', gasto: 'gastosAdmin',
  depreciacion: 'depreciacion', interes: 'intereses', otro: 'otrosIngresos' };
const BG_GRUPO_CLAVE = { ac: 'otrosAC', anc: 'otrosANC', pc: 'otrosPC', pnc: 'prestLP', pat: 'utilidadesRetenidas' };

// Orden de presentación: grupos de cuentas y totales calculados (los que empiezan con @)
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

const Estados = {
  vacio() {
    return { version: 2, isr: 30, cuentas: Plantillas.cuentasDe('comercial'), valores: {} };
  },

  // Lee los datos guardados; si vienen del formato de la Fase 2, los convierte
  leerCrudo() {
    const x = Datos.leer('estados');
    if (x && x.cuentas) return x;
    if (x && x.er) return Estados.migrar(x);
    return Estados.vacio();
  },

  guardarCrudo(x) { Datos.guardar('estados', x); },

  // Formato de la Fase 2 (arreglos [año 1, año 2]) -> formato nuevo (valores por período).
  // El año 1 pasa al período anterior y el año 2 al último período de la empresa.
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

  // Capa de compatibilidad: suma las cuentas por rol (o por grupo, si son libres)
  // para los períodos "ids" y entrega la forma que usan los demás módulos.
  compat(raw, ids) {
    const d = { isr: Number(raw.isr) || 0, ids: ids, anios: ids.map(id => Estados.etiqueta(id)), anioFin: 0, er: {}, bg: {} };
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

  // Datos para los módulos: el par de períodos elegido
  obtener() { return Estados.compat(Estados.leerCrudo(), Seleccion.ids()); },

  // Aquí se hacen los cálculos financieros de los estados (una vez por período)
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

  filaCuenta(a, raw, ids) {
    const celdas = ids.map(pid => {
      const v = (raw.valores[pid] || {})[a.id];
      return '<td><input type="text" inputmode="decimal" data-validar="numero" data-acc="' + a.id +
        '" data-per="' + pid + '" value="' + (v === undefined ? 0 : v) + '"></td>';
    }).join('');
    return '<tr><td>' + esc(a.nombre) + '</td>' + celdas + '</tr>';
  },

  tabla(raw, ids, estado, orden) {
    const cab = '<tr><th>Cuenta</th>' + ids.map(pid => '<th>' + esc(Estados.etiqueta(pid)) + '</th>').join('') + '</tr>';
    const cuerpo = orden.map(item => {
      if (item[0] === '@') {
        const k = item.slice(1);
        return '<tr class="total"><td>' + ETIQUETAS_TOTAL[k] + '</td>' +
          ids.map((_, p) => '<td id="c-' + k + '-' + p + '">—</td>').join('') + '</tr>';
      }
      return Estados.porGrupo(raw.cuentas[estado], item).map(a => Estados.filaCuenta(a, raw, ids)).join('');
    }).join('');
    return '<table class="tabla">' + cab + cuerpo + '</table>';
  },

  render(el) {
    const ps = Empresas.periodos || [];
    if (!ps.length) {
      el.innerHTML = '<div class="aviso">Esta empresa todavía no tiene períodos. Agrégalos en el módulo Períodos.</div>';
      return;
    }
    const raw = Estados.leerCrudo(), ids = ps.map(p => p.id);
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="barra-acciones">' +
        '<label class="campo corto">ISR (%)<input type="text" id="est-isr" data-validar="numero" value="' + raw.isr + '"></label>' +
        '<button class="btn sec peligro" id="est-limpiar">Borrar montos</button>' +
      '</div>' +
      '<div class="aviso">Escribe los montos de cada período. Para cambiar nombres, agregar o quitar cuentas usa ' +
        '<strong>Configurar cuentas</strong>. El par de períodos que se compara se elige en el menú lateral.</div>' +
      '<div class="tarjeta" style="margin-top:16px"><h3>Estado de Resultados</h3><div class="tabla-scroll">' +
        Estados.tabla(raw, ids, 'er', ER_ORDEN) + '</div></div>' +
      '<div class="tarjeta" style="margin-top:16px"><h3>Balance General</h3><div class="tabla-scroll">' +
        Estados.tabla(raw, ids, 'bg', BG_ORDEN) + '</div><div id="est-cuadre" class="cuadre"></div></div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const refrescar = () => {
      const r = Estados.calcular(Estados.compat(Estados.leerCrudo(), ids));
      r.forEach((rp, p) => Object.keys(rp).forEach(k => {
        const c = raiz.querySelector('#c-' + k + '-' + p);
        if (c) c.textContent = Fmt.moneda(rp[k]);
      }));
      const hay = r.some(rp => rp.totalActivo || rp.totalPP);
      const malos = r.map((rp, p) => Math.abs(rp.diferencia) >= 0.5
        ? Estados.etiqueta(ids[p]) + ': ' + Fmt.moneda(rp.diferencia) : null).filter(Boolean);
      const caja = raiz.querySelector('#est-cuadre');
      caja.className = 'cuadre ' + (!hay ? 'neutro' : malos.length ? 'mal' : 'ok');
      caja.textContent = !hay
        ? 'Todavía no hay montos en el Balance General. La comprobación aparecerá cuando los escribas.'
        : malos.length
          ? 'El balance no cuadra en: ' + malos.join('; ') + '.'
          : 'Comprobación: Activo = Pasivo + Patrimonio en los períodos con montos.';
    };

    raiz.addEventListener('input', e => {
      const t = e.target, x = Estados.leerCrudo();
      if (t.id === 'est-isr') {
          x.isr = Fmt.aNum(t.value);
      } else if (t.dataset.acc) {
        const pid = t.dataset.per;
        x.valores[pid] = x.valores[pid] || {};
        x.valores[pid][t.dataset.acc] = Fmt.aNum(t.value);
      } else {
        return;
      }
      Estados.guardarCrudo(x);
      refrescar();
    });

    raiz.querySelector('#est-limpiar').addEventListener('click', () => {
      if (!confirm('¿Borrar todos los montos de los estados financieros? Las cuentas se conservan.')) return;
      const x = Estados.leerCrudo();
      x.valores = {};
      Estados.guardarCrudo(x);
      Estados.render(el);
      Validar.activar(el);
    });

    refrescar();
  }
};

Modulos.estados = {
  titulo: 'Estados financieros',
  subtitulo: 'Balance General y Estado de Resultados por período',
  render(el) { Estados.render(el); }
};