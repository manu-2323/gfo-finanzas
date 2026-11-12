// Análisis financiero — 8 mejoras:
// 1. N períodos en todas las tablas    2. Origen de valores en tooltip
// 3. Recomendaciones con datos suficientes  4. Rangos de semáforo configurables
// 5. Aviso denominador cero            6. Variaciones favorable/desfavorable
// 7. Cálculo paso a paso               8. Identificación de cuentas personalizadas

const ANL_RANGOS_DEFAULT = {
  'Capital de trabajo neto':           { bien:{op:'>=',v:0},       alerta:{op:'>=',v:-1e15} },
  'Razón corriente':                   { bien:{op:'>=',v:1.5},     alerta:{op:'>=',v:1} },
  'Prueba ácida':                      { bien:{op:'>=',v:1},       alerta:{op:'>=',v:0.7} },
  'Rotación de inventarios':           { bien:{op:'>=',v:4},       alerta:{op:'>=',v:2} },
  'Edad promedio de inventario':       { bien:{op:'<=',v:60},      alerta:{op:'<=',v:90} },
  'Período promedio de cobro (PPC)':   { bien:{op:'<=',v:30},      alerta:{op:'<=',v:60} },
  'Período promedio de pago (PPP)':    { bien:{op:'>=',v:30},      alerta:{op:'>=',v:0} },
  'Ciclo de conversión del efectivo':  { bien:{op:'<=',v:60},      alerta:{op:'<=',v:90} },
  'Rotación de activos fijos':         { bien:{op:'>=',v:1},       alerta:{op:'>=',v:0} },
  'Rotación de activos totales':       { bien:{op:'>=',v:0.5},     alerta:{op:'>=',v:0} },
  'Razón de endeudamiento':            { bien:{op:'<=',v:0.5},     alerta:{op:'<=',v:0.65} },
  'Deuda sobre patrimonio':            { bien:{op:'<=',v:1},       alerta:{op:'<=',v:1.5} },
  'Cobertura de intereses':            { bien:{op:'>=',v:3},       alerta:{op:'>=',v:1.5} },
  'Margen de utilidad bruta':          { bien:{op:'>=',v:0.3},     alerta:{op:'>=',v:0.15} },
  'Margen de utilidad operativa':      { bien:{op:'>=',v:0.1},     alerta:{op:'>=',v:0.05} },
  'Margen de utilidad neta':           { bien:{op:'>=',v:0.05},    alerta:{op:'>=',v:0.02} },
  'Rendimiento sobre activos (ROA)':   { bien:{op:'>=',v:0.05},    alerta:{op:'>=',v:0.02} },
  'Rendimiento sobre patrimonio (ROE)':{ bien:{op:'>=',v:0.1},     alerta:{op:'>=',v:0.05} }
};

// Mejora 6 — qué variación es favorable según el tipo de cuenta
const ANL_FAV_SUBE = new Set([
  'ventas','otrosIngresos','utilidadBruta','uaii','uai','utilidadNeta',
  'efectivo','cxc','inventarios','otrosAC','ac','activosFijos','otrosANC','totalActivo',
  'capital','utilidadesRetenidas','patrimonio','totalPP'
]);
const ANL_FAV_BAJA = new Set([
  'costoVentas','gastosVenta','gastosAdmin','depreciacion','intereses',
  'cxp','prestCP','otrosPC','prestLP','totalPasivo','impuesto'
]);

// Indicadores que expresan sus umbrales en % (se muestran *100 en el editor)
const ANL_ES_PCT = new Set([
  'Margen de utilidad bruta','Margen de utilidad operativa','Margen de utilidad neta',
  'Rendimiento sobre activos (ROA)','Rendimiento sobre patrimonio (ROE)','Razón de endeudamiento'
]);

const Analisis = {
  grafs: [],

  // Mejora 4 — rangos desde localStorage con fallback a defaults
  rangos() {
    return Object.assign({}, ANL_RANGOS_DEFAULT, Datos.leer('analisis-rangos') || {});
  },

valor(d, r, grupo, f, p) {
    const k = f[0];
    if (k[0] === '@') return r?.[p]?.[k.slice(1)] || 0;
    return Number(d?.[grupo]?.[k]?.[p]) || 0;
  },

  // Mejora 1 — ctx generalizado para N períodos; pPrev se calcula automáticamente
  ctx(d, r, p) {
    const pA = p > 0 ? p - 1 : null;
    return {
      R: r[p], p,
      n:     (g, k) => Number(d?.[g]?.[k]?.[p]) || 0,
      prom:  (g, k) => pA === null ? null : ((Number(d?.[g]?.[k]?.[pA]) || 0) + (Number(d?.[g]?.[k]?.[p]) || 0)) / 2,
      promR: k      => pA === null ? null : ((r?.[pA]?.[k] || 0) + (r?.[p]?.[k] || 0)) / 2
    };
  },

  fmtV(tipo, v) {
    return (v === null || v === undefined || !isFinite(v)) ? 'N/D' : Fmt[tipo](v);
  },

  semaforo(nombre, v) {
    if (v === null || !isFinite(v)) return '';
    const cfg = Analisis.rangos()[nombre];
    if (!cfg) return '';
    const test = (c, val) => c.op === '>=' ? val >= c.v : val <= c.v;
    if (test(cfg.bien,   v)) return 'bien';
    if (test(cfg.alerta, v)) return 'alerta';
    return 'riesgo';
  },

  // Mejora 3 — recomendación solo si hay datos suficientes para que sea relevante
  recomendacion(nombre, v, c) {
    if (v === null || !isFinite(v)) return null;
    const sem = Analisis.semaforo(nombre, v);
    if (sem !== 'alerta' && sem !== 'riesgo') return null;
    if (c) {
      const ventas = c.n('er', 'ventas'), activo = c.R.totalActivo;
      const needVentas = ['Margen de utilidad bruta','Margen de utilidad operativa','Margen de utilidad neta',
        'Rotación de activos fijos','Rotación de activos totales','Período promedio de cobro (PPC)',
        'Cobertura de intereses','Rendimiento sobre activos (ROA)','Rendimiento sobre patrimonio (ROE)'];
      if (needVentas.includes(nombre) && !ventas) return null;
      if (!activo && ['Razón de endeudamiento','Rotación de activos totales',
          'Rendimiento sobre activos (ROA)'].includes(nombre)) return null;
    }
    const rec = {
      'Capital de trabajo neto':         'Considera financiar activos corrientes con deuda a largo plazo o incrementar el capital.',
      'Razón corriente':                 'Evalúa convertir deuda a corto en deuda a largo plazo para mejorar la cobertura.',
      'Prueba ácida':                    'El efectivo disponible sin inventarios es bajo; revisa la gestión de cobros.',
      'Rotación de inventarios':         'El inventario rota lento; analiza si hay productos de baja salida que ocupan capital.',
      'Edad promedio de inventario':     'El inventario tarda más de lo ideal en venderse; considera reducir niveles de stock.',
      'Período promedio de cobro (PPC)': 'El plazo de cobro es elevado; considera políticas de crédito más cortas o descuentos por pronto pago.',
      'Ciclo de conversión del efectivo':'El ciclo de caja es largo; negocia mejores plazos con proveedores o cobra más rápido.',
      'Razón de endeudamiento':          'El nivel de deuda es alto; evalúa refinanciamiento o capitalización para reducir el apalancamiento.',
      'Deuda sobre patrimonio':          'La deuda supera al patrimonio; refuerza la capitalización antes de solicitar nuevos créditos.',
      'Cobertura de intereses':          'La utilidad operativa cubre los intereses con poco margen; reduce gastos financieros o mejora la UAII.',
      'Margen de utilidad bruta':        'El margen bruto es bajo; revisa costos de producción o política de precios.',
      'Margen de utilidad operativa':    'Los gastos operativos consumen gran parte de las ventas; identifica rubros a optimizar.',
      'Margen de utilidad neta':         'La utilidad neta final es baja; combina mejora de precios con control de gastos e impuestos.',
      'Rendimiento sobre activos (ROA)': 'Los activos no están generando suficiente rendimiento; evalúa activos improductivos.',
      'Rendimiento sobre patrimonio (ROE)':'El retorno al accionista es bajo; revisa estructura de financiamiento y eficiencia operativa.'
    };
    return rec[nombre] || null;
  },

  razones() {
    const divR = (a, b) => (b ? a / b : null);
    const x2   = v => Fmt.num(v, 2);
    // Mejoras 5+7 — helper que genera tooltip del cálculo real, con aviso si denom=0
    const detDiv = (nL, nV, dL, dV) =>
      !dV ? dL + ' = C$ 0, esta razón no puede calcularse.' :
      nL + ' (' + Fmt.moneda(nV) + ') ÷ ' + dL + ' (' + Fmt.moneda(dV) + ')';

    return [
      { grupo: 'Liquidez', desc: 'Miden la capacidad de la empresa para cubrir sus obligaciones de corto plazo.', items: [
        { nombre: 'Capital de trabajo neto',
          formula: 'Activo corriente − Pasivo corriente',
          queEs: 'Los recursos que quedan disponibles después de cubrir todas las deudas a corto plazo.',
          tipo: 'moneda',
          f: c => c.R.ac - c.R.pc,
          detalle: c => 'AC (' + Fmt.moneda(c.R.ac) + ') − PC (' + Fmt.moneda(c.R.pc) + ')',
          txt: v => v >= 0 ? 'Positivo: los activos corrientes cubren los pasivos corrientes.' : 'Negativo: los pasivos corrientes superan a los activos corrientes.' },
        { nombre: 'Razón corriente',
          formula: 'Activo corriente ÷ Pasivo corriente',
          queEs: 'Cuántos córdobas de activo corriente respaldan cada córdoba de deuda a corto plazo.',
          tipo: 'veces',
          f: c => divR(c.R.ac, c.R.pc),
          detalle: c => detDiv('Activo corriente', c.R.ac, 'Pasivo corriente', c.R.pc),
          txt: v => 'Por cada C$ 1 de pasivo corriente hay C$ ' + x2(v) + ' de activo corriente.' },
        { nombre: 'Prueba ácida',
          formula: '(Activo corriente − Inventarios) ÷ Pasivo corriente',
          queEs: 'Igual que la razón corriente pero excluyendo inventarios, que son los activos menos líquidos.',
          tipo: 'veces',
          f: c => divR(c.R.ac - c.n('bg','inventarios'), c.R.pc),
          detalle: c => detDiv('AC − Inventarios', c.R.ac - c.n('bg','inventarios'), 'Pasivo corriente', c.R.pc),
          txt: v => 'Sin contar inventarios, hay C$ ' + x2(v) + ' por cada C$ 1 de deuda a corto plazo.' }
      ]},
      { grupo: 'Actividad (saldos promedio, 365 días)', desc: 'Miden la eficiencia con la que la empresa gestiona sus activos operativos.', items: [
        { nombre: 'Rotación de inventarios',
          formula: 'Costo de ventas ÷ Inventario promedio',
          queEs: 'Cuántas veces se renueva el inventario durante el año. Mayor rotación = mejor gestión de stock.',
          tipo: 'veces',
          f: c => divR(c.n('er','costoVentas'), c.prom('bg','inventarios')),
          detalle: c => {
            const prom = c.prom('bg','inventarios');
            if (prom === null) return 'Requiere al menos dos períodos para calcular el promedio.';
            return detDiv('Costo de ventas', c.n('er','costoVentas'), 'Inv. promedio', prom);
          },
          txt: v => 'El inventario se renueva ' + x2(v) + ' veces al año.' },
        { nombre: 'Edad promedio de inventario',
          formula: '365 × Inventario promedio ÷ Costo de ventas',
          queEs: 'Cuántos días tarda en promedio el inventario en convertirse en venta.',
          tipo: 'dias',
          f: c => { const p = c.prom('bg','inventarios'); return p === null ? null : divR(365*p, c.n('er','costoVentas')); },
          detalle: c => {
            const prom = c.prom('bg','inventarios');
            if (prom === null) return 'Requiere al menos dos períodos.';
            const cv = c.n('er','costoVentas');
            if (!cv) return 'Costo de ventas = C$ 0, no se puede calcular.';
            return '365 × Inv.prom (' + Fmt.moneda(prom) + ') ÷ CV (' + Fmt.moneda(cv) + ')';
          },
          txt: v => 'El inventario tarda unos ' + Math.round(v) + ' días en venderse.' },
        { nombre: 'Período promedio de cobro (PPC)',
          formula: 'CxC promedio × 365 ÷ Ventas',
          queEs: 'Cuántos días se tarda en cobrar a los clientes después de realizadas las ventas.',
          tipo: 'dias',
          f: c => { const p = c.prom('bg','cxc'); return p === null ? null : divR(p*365, c.n('er','ventas')); },
          detalle: c => {
            const prom = c.prom('bg','cxc');
            if (prom === null) return 'Requiere al menos dos períodos.';
            const v = c.n('er','ventas');
            if (!v) return 'Ventas = C$ 0, no se puede calcular.';
            return 'CxC prom (' + Fmt.moneda(prom) + ') × 365 ÷ Ventas (' + Fmt.moneda(v) + ')';
          },
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en cobrar a los clientes.' },
        { nombre: 'Período promedio de pago (PPP)',
          formula: 'CxP promedio × 365 ÷ Costo de ventas',
          queEs: 'Cuántos días se tarda en pagar a los proveedores. Un PPP mayor que el PPC es favorable.',
          tipo: 'dias',
          f: c => { const p = c.prom('bg','cxp'); return p === null ? null : divR(p*365, c.n('er','costoVentas')); },
          detalle: c => {
            const prom = c.prom('bg','cxp');
            if (prom === null) return 'Requiere al menos dos períodos.';
            const cv = c.n('er','costoVentas');
            if (!cv) return 'Costo de ventas = C$ 0, no se puede calcular.';
            return 'CxP prom (' + Fmt.moneda(prom) + ') × 365 ÷ CV (' + Fmt.moneda(cv) + ')';
          },
          txt: v => 'Se tardan unos ' + Math.round(v) + ' días en pagar a los proveedores.' },
        { nombre: 'Ciclo de conversión del efectivo',
          formula: 'Edad inventario + PPC − PPP',
          queEs: 'Cuántos días el dinero queda "atrapado" en el ciclo operativo antes de regresar como efectivo.',
          tipo: 'dias',
          f: c => {
            const inv = c.prom('bg','inventarios'), cxc = c.prom('bg','cxc'), cxp = c.prom('bg','cxp');
            if (inv === null) return null;
            const cv = c.n('er','costoVentas'), v = c.n('er','ventas');
            const edad = divR(365*inv, cv), ppc = divR(cxc*365, v), ppp = divR(cxp*365, cv);
            return (edad===null||ppc===null||ppp===null) ? null : edad + ppc - ppp;
          },
          detalle: c => c.prom('bg','inventarios')===null ? 'Requiere al menos dos períodos.' : 'Edad inv. + PPC − PPP (saldos promedio)',
          txt: v => 'El efectivo queda comprometido unos ' + Math.round(v) + ' días entre pagar y cobrar.' },
        { nombre: 'Rotación de activos fijos',
          formula: 'Ventas ÷ Activos fijos promedio',
          queEs: 'Cuántos córdobas de venta genera cada córdoba invertido en propiedad, planta y equipo.',
          tipo: 'veces',
          f: c => divR(c.n('er','ventas'), c.prom('bg','activosFijos')),
          detalle: c => {
            const prom = c.prom('bg','activosFijos');
            return prom === null ? 'Requiere al menos dos períodos.' : detDiv('Ventas', c.n('er','ventas'), 'AF promedio', prom);
          },
          txt: v => 'Cada C$ 1 en activos fijos genera C$ ' + x2(v) + ' en ventas.' },
        { nombre: 'Rotación de activos totales',
          formula: 'Ventas ÷ Activo total promedio',
          queEs: 'Cuántos córdobas de venta genera cada córdoba de activo total.',
          tipo: 'veces',
          f: c => divR(c.n('er','ventas'), c.promR('totalActivo')),
          detalle: c => {
            const prom = c.promR('totalActivo');
            return prom === null ? 'Requiere al menos dos períodos.' : detDiv('Ventas', c.n('er','ventas'), 'Activo total prom.', prom);
          },
          txt: v => 'Cada C$ 1 en activos genera C$ ' + x2(v) + ' en ventas.' }
      ]},
      { grupo: 'Endeudamiento', desc: 'Miden qué porción de los activos está financiada con deuda y qué capacidad tiene la empresa para cubrirla.', items: [
        { nombre: 'Razón de endeudamiento',
          formula: 'Pasivo total ÷ Activo total',
          queEs: 'Qué fracción de los activos pertenece a los acreedores (no al dueño).',
          tipo: 'pct',
          f: c => divR(c.R.totalPasivo, c.R.totalActivo),
          detalle: c => detDiv('Pasivo total', c.R.totalPasivo, 'Activo total', c.R.totalActivo),
          txt: v => 'El ' + Fmt.pct(v) + ' de los activos está financiado con deuda.' },
        { nombre: 'Deuda sobre patrimonio',
          formula: 'Pasivo total ÷ Patrimonio',
          queEs: 'Cuántos córdobas se deben por cada córdoba que pertenece a los propietarios.',
          tipo: 'veces',
          f: c => divR(c.R.totalPasivo, c.R.patrimonio),
          detalle: c => detDiv('Pasivo total', c.R.totalPasivo, 'Patrimonio', c.R.patrimonio),
          txt: v => 'Por cada C$ 1 de patrimonio hay C$ ' + x2(v) + ' de deuda.' },
        { nombre: 'Cobertura de intereses',
          formula: 'UAII ÷ Gastos por intereses',
          queEs: 'Cuántas veces la utilidad operativa puede pagar los intereses de la deuda.',
          tipo: 'veces',
          f: c => divR(c.R.uaii, c.n('er','intereses')),
          detalle: c => detDiv('UAII', c.R.uaii, 'Intereses', c.n('er','intereses')),
          txt: v => 'La utilidad operativa cubre ' + x2(v) + ' veces los intereses.' }
      ]},
      { grupo: 'Rentabilidad', desc: 'Miden qué tan eficientemente la empresa convierte sus ventas y activos en utilidad.', items: [
        { nombre: 'Margen de utilidad bruta',
          formula: 'Utilidad bruta ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda después de descontar el costo de los bienes vendidos.',
          tipo: 'pct',
          f: c => divR(c.R.utilidadBruta, c.n('er','ventas')),
          detalle: c => detDiv('Utilidad bruta', c.R.utilidadBruta, 'Ventas', c.n('er','ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v*100) + ' quedan después del costo de ventas.' },
        { nombre: 'Margen de utilidad operativa',
          formula: 'UAII ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda después de todos los gastos operativos.',
          tipo: 'pct',
          f: c => divR(c.R.uaii, c.n('er','ventas')),
          detalle: c => detDiv('UAII', c.R.uaii, 'Ventas', c.n('er','ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v*100) + ' quedan después de los gastos operativos.' },
        { nombre: 'Margen de utilidad neta',
          formula: 'Utilidad neta ÷ Ventas',
          queEs: 'Porcentaje de cada venta que queda como ganancia real después de impuestos e intereses.',
          tipo: 'pct',
          f: c => divR(c.R.utilidadNeta, c.n('er','ventas')),
          detalle: c => detDiv('Utilidad neta', c.R.utilidadNeta, 'Ventas', c.n('er','ventas')),
          txt: v => 'De cada C$ 100 de ventas, C$ ' + x2(v*100) + ' son utilidad neta.' },
        { nombre: 'Rendimiento sobre activos (ROA)',
          formula: 'Utilidad neta ÷ Activo total promedio',
          queEs: 'Cuánto rinde cada córdoba invertido en activos, independientemente de cómo se financia.',
          tipo: 'pct',
          f: c => divR(c.R.utilidadNeta, c.promR('totalActivo')),
          detalle: c => {
            const prom = c.promR('totalActivo');
            return prom === null ? 'Requiere al menos dos períodos.' : detDiv('Utilidad neta', c.R.utilidadNeta, 'Activo total prom.', prom);
          },
          txt: v => 'Cada C$ 100 invertidos en activos generan C$ ' + x2(v*100) + ' de utilidad neta.' },
        { nombre: 'Rendimiento sobre patrimonio (ROE)',
          formula: 'Utilidad neta ÷ Patrimonio promedio',
          queEs: 'Cuánto rinde el dinero invertido por los propietarios.',
          tipo: 'pct',
          f: c => divR(c.R.utilidadNeta, c.promR('patrimonio')),
          detalle: c => {
            const prom = c.promR('patrimonio');
            return prom === null ? 'Requiere al menos dos períodos.' : detDiv('Utilidad neta', c.R.utilidadNeta, 'Patrimonio prom.', prom);
          },
          txt: v => 'Cada C$ 100 del patrimonio generan C$ ' + x2(v*100) + ' de utilidad neta.' }
      ]}
      ,
      { grupo: 'Mercado (opcionales)', desc: 'Se calculan solo cuando se dispone del precio de mercado por acción y el número de acciones en circulación. Si no hay datos, aparecen como N/D.', items: [
        { nombre: 'Utilidad por acción (UPA)',
          formula: 'Utilidad neta ÷ Número de acciones en circulación',
          queEs: 'Cuánto de la utilidad neta corresponde a cada acción emitida por la empresa.',
          tipo: 'moneda',
          f: c => { const acc = c.n('er','accionesCirculacion'); return acc ? c.R.utilidadNeta / acc : null; },
          detalle: c => { const acc = c.n('er','accionesCirculacion'); return acc ? 'Utilidad neta (' + Fmt.moneda(c.R.utilidadNeta) + ') ÷ Acciones (' + Fmt.num(acc,0) + ')' : 'Requiere el campo "Acciones en circulación" en el ER.'; },
          txt: v => 'Cada acción genera una utilidad de ' + Fmt.moneda(v) + '.' },
        { nombre: 'Razón precio / utilidad (P/U)',
          formula: 'Precio de mercado por acción ÷ UPA',
          queEs: 'Cuántas veces la utilidad por acción están dispuestos a pagar los inversionistas. Se interpreta como los años que tardarían en recuperar la inversión a la utilidad actual.',
          tipo: 'veces',
          f: c => { const acc = c.n('er','accionesCirculacion'), pm = c.n('er','precioMercadoAccion'); if (!acc||!pm) return null; const upa = c.R.utilidadNeta/acc; return upa ? pm/upa : null; },
          detalle: c => { const acc = c.n('er','accionesCirculacion'), pm = c.n('er','precioMercadoAccion'); return (!acc||!pm) ? 'Requiere "Precio de mercado por acción" y "Acciones en circulación" en el ER.' : 'Precio por acción (' + Fmt.moneda(pm) + ') ÷ UPA'; },
          txt: v => 'Los inversionistas pagan ' + Fmt.num(v,1) + ' veces la utilidad por acción.' },
        { nombre: 'Valor en libros por acción',
          formula: 'Patrimonio ÷ Número de acciones en circulación',
          queEs: 'El valor contable de cada acción, según los libros de la empresa (no el precio de mercado).',
          tipo: 'moneda',
          f: c => { const acc = c.n('er','accionesCirculacion'); return acc ? c.R.patrimonio / acc : null; },
          detalle: c => { const acc = c.n('er','accionesCirculacion'); return acc ? 'Patrimonio (' + Fmt.moneda(c.R.patrimonio) + ') ÷ Acciones (' + Fmt.num(acc,0) + ')' : 'Requiere "Acciones en circulación" en el ER.'; },
          txt: v => 'El valor contable de cada acción es ' + Fmt.moneda(v) + '.' }
      ]}
    ];
  },

  dupont(d, r) {
    const n = r.length, p0 = n >= 2 ? n-2 : 0, p1 = n-1;
    const R = r[p1], ventas = Number(d.er.ventas[p1]) || 0;
    const actProm = n >= 2 ? (r[p0].totalActivo + r[p1].totalActivo) / 2 : r[p1].totalActivo;
    const patProm = n >= 2 ? (r[p0].patrimonio  + r[p1].patrimonio)  / 2 : r[p1].patrimonio;
    const margen        = ventas  ? R.utilidadNeta / ventas  : null;
    const rotacion      = actProm ? ventas / actProm          : null;
    const multiplicador = patProm ? actProm / patProm         : null;
    const roe           = (margen===null||rotacion===null||multiplicador===null) ? null : margen*rotacion*multiplicador;
    const roeDirecto    = patProm ? R.utilidadNeta / patProm : null;
    return { margen, rotacion, multiplicador, roe, roeDirecto, A0: d.anios[p0], A1: d.anios[p1] };
  },

  // Mejoras 1+6 — tabla horizontal con N períodos y colores favorable/desfavorable
  tablaHorizontal(d, r) {
    const A = d.anios, n = A.length;
    const filas = (grupo, lista) => lista.map(f => {
      const vals = A.map((_, p) => Analisis.valor(d, r, grupo, f, p));
      const k = f[0];
      let varHTML = '';
      if (n >= 2) {
        const a = vals[n-2], b = vals[n-1], abs = b - a;
        const rel = a !== 0 ? abs / Math.abs(a) : null;
        const pctTxt = rel === null
          ? '<span class="nd-cero">N/D <span class="tip" title="El año base es cero, no se puede calcular variación porcentual.">?</span></span>'
          : Fmt.pct(rel);
        // Mejora 6 — detectar si la variación es favorable
        let cls = '';
        if (abs !== 0) {
          const esFav = (ANL_FAV_SUBE.has(k) && abs > 0) || (ANL_FAV_BAJA.has(k) && abs < 0);
          const esDes = (ANL_FAV_SUBE.has(k) && abs < 0) || (ANL_FAV_BAJA.has(k) && abs > 0);
          cls = esFav ? 'var-fav' : esDes ? 'var-desf' : '';
        }
        varHTML = '<td class="' + cls + '">' + Fmt.moneda(abs) + '</td><td class="' + cls + '">' + pctTxt + '</td>';
      }
      const celdas = vals.map(v => '<td>' + Fmt.moneda(v) + '</td>').join('');
      return '<tr class="' + (k[0]==='@'?'total':'') + '"><td>' + esc(f[1]) + '</td>' + celdas + varHTML + '</tr>';
    }).join('');
    const cabA = A.map(a => '<th>' + esc(String(a)) + '</th>').join('');
    const cabVar = n >= 2
      ? '<th>Variación C$ (' + esc(String(A[n-2])) + '→' + esc(String(A[n-1])) + ')</th><th>Variación %</th>'
      : '';
    const colSpan = n + (n >= 2 ? 3 : 1);
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Cuenta</th>' + cabA + cabVar + '</tr>' +
      '<tr class="sub"><td colspan="' + colSpan + '">Estado de Resultados</td></tr>' + filas('er', EST_FILAS_ER) +
      '<tr class="sub"><td colspan="' + colSpan + '">Balance General</td></tr>' + filas('bg', EST_FILAS_BG) +
      '</table></div>' +
      '<p class="nota-pie">La variación se calcula entre los dos últimos períodos. ' +
      '<span style="color:#1a7a4a;font-weight:600">Verde = variación favorable</span> · ' +
      '<span style="color:#c0392b;font-weight:600">Rojo = variación desfavorable</span> según el tipo de cuenta. ' +
      'N/D en variación % = el año base es cero, no se puede dividir entre cero.</p>' +
      '<div class="aviso" style="margin-top:10px"><strong>Cómo leer el análisis horizontal:</strong> ' +
      'Muestra cuánto cambiaron los montos en términos absolutos (C$) y porcentuales (%) entre los dos últimos períodos. ' +
      'Una variación positiva en ventas o utilidad es favorable (verde). ' +
      'Una variación positiva en costos o deudas es desfavorable (rojo). ' +
      'Busca tendencias: ¿están los ingresos creciendo más rápido que los costos? ¿Está la deuda aumentando o disminuyendo?</div>';
  },

  // Mejora 1 — tabla vertical con N períodos
  tablaVertical(d, r) {
    const A = d.anios, n = A.length;
    const filas = (grupo, lista, claveBase) => lista.map(f => {
      const celdas = A.map((_, p) => {
        const base = claveBase === 'ventas' ? Number(d.er.ventas[p]) || 0 : r[p].totalActivo;
        const v = Analisis.valor(d, r, grupo, f, p);
        return '<td>' + (base ? Fmt.pct(v/base) : '<span class="nd-cero">N/D</span>') + '</td>';
      }).join('');
      const k = f[0];
      return '<tr class="' + (k[0]==='@'?'total':'') + '"><td>' + esc(f[1]) + '</td>' + celdas + '</tr>';
    }).join('');
    const cabA = A.map(a => '<th>' + esc(String(a)) + '</th>').join('');
    const colSpan = n + 1;
    return '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<tr><th>Cuenta</th>' + cabA + '</tr>' +
      '<tr class="sub"><td colspan="' + colSpan + '">Estado de Resultados (% de las ventas)</td></tr>' + filas('er', EST_FILAS_ER, 'ventas') +
      '<tr class="sub"><td colspan="' + colSpan + '">Balance General (% del activo total)</td></tr>' + filas('bg', EST_FILAS_BG, 'activo') +
      '</table></div>' +
      '<p class="nota-pie">Los porcentajes del ER se calculan sobre las ventas netas; los del Balance General sobre el total del activo.</p>';
  },

  // Mejoras 1,2,3,4,5,7,8 — tabla de razones con N períodos
  tablaRazones(d, r) {
    const A = d.anios, n = A.length;
    const ctxs = A.map((_, p) => Analisis.ctx(d, r, p));
    const iconoSem = s =>
      s==='bien'   ? '<span class="sem-bien" title="Dentro del rango saludable">●</span>' :
      s==='alerta' ? '<span class="sem-alerta" title="Requiere atención">●</span>' :
      s==='riesgo' ? '<span class="sem-riesgo" title="Indicador de riesgo">●</span>' : '';

    // Mejora 8 — cuentas personalizadas (sin rol explícito)
    let avCustom = '';
    try {
      const raw = Estados.leerCrudo();
      const custom = [];
      ['er','bg'].forEach(est => {
        ((raw.cuentas||{})[est]||[]).forEach(a => {
          if (!a.rol && a.grupo) custom.push(esc(a.nombre) + ' → grupo "' + esc(a.grupo) + '"');
        });
      });
      if (custom.length)
        avCustom = '<div class="aviso" style="font-size:12px;margin-bottom:8px"><strong>Cuentas personalizadas incluidas en los cálculos:</strong> ' +
          custom.join(' · ') + '. Sus montos se acumulan dentro de la clave estándar de su grupo.</div>';
    } catch(e){}

    let totalAlerta = 0, totalRiesgo = 0;
    const filasTmp = [];
    Analisis.razones().forEach(g => {
      let bloque = '<tr class="sub"><td colspan="' + (n+4) + '">' + esc(g.grupo);
      if (g.desc) bloque += ' <span class="grup-desc">— ' + esc(g.desc) + '</span>';
      bloque += '</td></tr>';
      g.items.forEach(it => {
        const vals = ctxs.map(c => it.f(c));
        const vUlt = vals[n-1];
        const okUlt = vUlt !== null && isFinite(vUlt);
        const semUlt = okUlt ? Analisis.semaforo(it.nombre, vUlt) : '';
        if (semUlt==='alerta') totalAlerta++;
        if (semUlt==='riesgo') totalRiesgo++;
        const rec = okUlt ? Analisis.recomendacion(it.nombre, vUlt, ctxs[n-1]) : null;

        // Celdas por período con tooltip del cálculo real (mejoras 2+5+7)
        const celdas = vals.map((v, p) => {
          const c = ctxs[p];
          const detTxt = it.detalle ? it.detalle(c) : '';
          if (v === null || !isFinite(v)) {
            return '<td><span class="nd-cero" title="' + esc(detTxt) + '">N/D</span></td>';
          }
          const semP = Analisis.semaforo(it.nombre, v);
          return '<td><span title="' + esc(detTxt) + '">' + Analisis.fmtV(it.tipo, v) + '</span>' +
            (semP ? ' ' +
                          iconoSem(semP) : '') + '</td>';
        }).join('');

        bloque += '<tr>' +
          '<td><span class="raz-nombre">' + esc(it.nombre) + '</span>' +
          (it.queEs ? ' <span class="tip" title="' + esc(it.queEs) + '">?</span>' : '') +
          '</td>' +
          '<td class="formula">' + esc(it.formula) + '</td>' +
          celdas +
          '<td class="interp">' + esc(okUlt ? it.txt(vUlt) : '') + '</td>' +
          '<td class="rec">' + (rec ? '<span class="rec-txt">⚑ ' + esc(rec) + '</span>' : '') + '</td>' +
          '</tr>';
      });
      filasTmp.push(bloque);
    });

    const resumen = (totalRiesgo > 0 || totalAlerta > 0)
      ? '<div class="sem-resumen ' + (totalRiesgo > 0 ? 'riesgo' : 'alerta') + '">' +
        (totalRiesgo > 0 ? '⚠ ' + totalRiesgo + ' indicador(es) en riesgo' : '') +
        (totalRiesgo > 0 && totalAlerta > 0 ? ' · ' : '') +
        (totalAlerta > 0 ? totalAlerta + ' indicador(es) requieren atención' : '') +
        '. Revisa las recomendaciones en la última columna.</div>'
      : '<div class="sem-resumen bien">✔ Todos los indicadores calculados se encuentran dentro de rangos saludables.</div>';

    const cabA = A.map(a => '<th>' + esc(String(a)) + '</th>').join('');
    return resumen + avCustom +
      '<div class="tabla-scroll"><table class="tabla-datos tabla-razones">' +
      '<tr><th>Razón</th><th>Fórmula</th>' + cabA +
      '<th>Interpretación (' + esc(String(A[n-1])) + ')</th><th>Recomendación</th></tr>' +
      filasTmp.join('') + '</table></div>' +
      '<p class="nota-pie">● Verde = saludable · ● Naranja = requiere atención · ● Rojo = indicador de riesgo. ' +
      'En pantalla grande, pasa el cursor sobre cualquier valor para ver el cálculo con los montos reales. ' +
      '<strong>N/D (sin datos suficientes)</strong> aparece cuando faltan dos períodos para calcular un promedio, ' +
      'o cuando el denominador es cero (por ejemplo, no hay ventas registradas). ' +
      'Esto es diferente de un resultado de <strong>C$ 0.00</strong>, que sí tiene datos pero el valor calculado es cero.</p>';
  },

  htmlDupont(d, r) {
    const u = Analisis.dupont(d, r);
    const tarj = (t, v, n) =>
      '<div class="tarjeta dp-tarj"><h3>' + t + '</h3>' +
      '<div class="valor dp-val">' + v + '</div>' +
      '<div class="nota dp-nota">' + n + '</div></div>';
    const ok = u.roe !== null && u.roeDirecto !== null && Math.abs(u.roe - u.roeDirecto) < 1e-9;
    return '<p class="aviso">ROE = Margen × Rotación × Multiplicador. Año analizado: ' + esc(String(u.A1)) +
      '. Usa saldos promedio entre ' + esc(String(u.A0)) + ' y ' + esc(String(u.A1)) + '.</p>' +
      '<div class="cadena">' +
        tarj('Margen de utilidad neta',       Analisis.fmtV('pct',   u.margen),        'Utilidad neta ÷ Ventas') +
        '<span class="op">×</span>' +
        tarj('Rotación de activos totales',   Analisis.fmtV('veces', u.rotacion),      'Ventas ÷ Activo promedio') +
        '<span class="op">×</span>' +
        tarj('Multiplicador de capital',      Analisis.fmtV('veces', u.multiplicador), 'Activo promedio ÷ Patrimonio promedio') +
        '<span class="op">=</span>' +
        tarj('ROE',                           Analisis.fmtV('pct',   u.roe),           'Rendimiento sobre el patrimonio') +
      '</div>' +
      '<div class="cuadre ' + (ok ? 'ok' : 'mal') + '">' + (ok
        ? 'Comprobación OK: el ROE por DuPont (' + Fmt.pct(u.roe) + ') coincide con Utilidad neta ÷ Patrimonio promedio (' + Fmt.pct(u.roeDirecto) + ').'
        : 'No se puede comprobar el ROE (faltan datos).') + '</div>' +
      '<p class="nota-pie">El margen mide cuánta utilidad deja cada venta; la rotación mide qué tan bien se usan los activos para vender; el multiplicador mide cuánto se apoya la empresa en deuda (apalancamiento financiero). Un ROE alto con multiplicador alto puede esconder riesgo financiero.</p>';
  },

  // Mejora 4 — modal para editar los rangos de semáforo
  modalRangos(onDone) {
    const rangos = Analisis.rangos();
    const filas = Object.keys(ANL_RANGOS_DEFAULT).map(nombre => {
      const r = rangos[nombre] || ANL_RANGOS_DEFAULT[nombre];
      const esPct = ANL_ES_PCT.has(nombre);
      const fmt = v => esPct ? Fmt.num(v * 100, 1) : Fmt.num(v, 2);
      const optsB = ['>=','<='].map(op =>
        '<option value="' + op + '"' + (r.bien.op   === op ? ' selected' : '') + '>' + (op==='>='?'≥':'≤') + '</option>'
      ).join('');
      const optsA = ['>=','<='].map(op =>
        '<option value="' + op + '"' + (r.alerta.op === op ? ' selected' : '') + '>' + (op==='>='?'≥':'≤') + '</option>'
      ).join('');
      const suf = esPct ? ' %' : '';
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + esc(nombre) + '</td>' +
        '<td><select data-nom="' + esc(nombre) + '" data-part="bien-op" style="font-size:12px">' + optsB + '</select>' +
        ' <input type="text" data-nom="' + esc(nombre) + '" data-part="bien-v" value="' + fmt(r.bien.v) +
        '" style="width:52px;font-size:12px">' + suf + '</td>' +
        '<td><select data-nom="' + esc(nombre) + '" data-part="alerta-op" style="font-size:12px">' + optsA + '</select>' +
        ' <input type="text" data-nom="' + esc(nombre) + '" data-part="alerta-v" value="' + fmt(r.alerta.v) +
        '" style="width:52px;font-size:12px">' + suf + '</td>' +
        '</tr>';
    }).join('');
    const fondo = document.createElement('div');
    fondo.className = 'est-modal-fondo';
    fondo.innerHTML =
      '<div class="est-modal" style="max-width:740px;max-height:88vh;overflow-y:auto">' +
        '<h3>Configurar rangos de semáforo</h3>' +
        '<p style="font-size:12px;opacity:.7;margin:0 0 12px">Verde = el indicador cumple la condición "Bien". ' +
        'Naranja = cumple "Alerta" pero no "Bien". Rojo = no cumple ninguna. ' +
        'Los porcentajes se escriben como número (ej. 30 = 30%).</p>' +
        '<table class="tabla" style="font-size:12px">' +
          '<tr><th>Indicador</th><th>Verde (bien)</th><th>Naranja (alerta)</th></tr>' +
          filas +
        '</table>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">' +
          '<button class="btn sec" id="anl-rangos-reset">Restaurar predeterminados</button>' +
          '<button class="btn sec" id="anl-rangos-cancel">Cancelar</button>' +
          '<button class="btn" id="anl-rangos-save">Guardar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(fondo);
    fondo.querySelector('#anl-rangos-cancel').onclick = () => fondo.remove();
    fondo.addEventListener('click', e => { if (e.target === fondo) fondo.remove(); });
    fondo.querySelector('#anl-rangos-reset').onclick = () => {
      if (!confirm('¿Restaurar todos los rangos a sus valores predeterminados?')) return;
      Datos.guardar('analisis-rangos', {});
      fondo.remove();
      if (onDone) onDone();
    };
    fondo.querySelector('#anl-rangos-save').onclick = () => {
      const sel = (nom, part) => fondo.querySelector('[data-nom="' + nom + '"][data-part="' + part + '"]');
      const guardados = {};
      Object.keys(ANL_RANGOS_DEFAULT).forEach(nombre => {
        const mult = ANL_ES_PCT.has(nombre) ? 0.01 : 1;
        const vB = Fmt.aNum(sel(nombre, 'bien-v').value);
        const vA = Fmt.aNum(sel(nombre, 'alerta-v').value);
        guardados[nombre] = {
          bien:   { op: sel(nombre, 'bien-op').value,   v: isFinite(vB) ? vB * mult : ANL_RANGOS_DEFAULT[nombre].bien.v },
          alerta: { op: sel(nombre, 'alerta-op').value, v: isFinite(vA) ? vA * mult : ANL_RANGOS_DEFAULT[nombre].alerta.v }
        };
      });
      Datos.guardar('analisis-rangos', guardados);
      fondo.remove();
      if (onDone) onDone();
    };
  },

  limpiarGraficos() {
    Analisis.grafs.forEach(g => { try { g.destroy(); } catch(e){} });
    Analisis.grafs = [];
  },

  dibujarGraficos(raiz, d, r) {
    Analisis.limpiarGraficos();
    if (typeof Chart === 'undefined') {
      raiz.querySelector('#sec-graficos').innerHTML = '<div class="aviso">No se encontró librerias/chart.umd.js.</div>';
      return;
    }
    const A = d.anios, n = A.length, p0 = n >= 2 ? n-2 : 0, p1 = n-1;
    const divG = (a, b) => (b ? a / b : null);
    const dat = p => [Number(d.er.ventas[p])||0, r[p].utilidadBruta, r[p].uaii, r[p].utilidadNeta];
    const millones = v => {
      if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(1) + ' M';
      if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(0) + ' k';
      return v;
    };
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-resultados'), {
      type: 'bar',
      data: {
        labels: ['Ventas', 'Util. bruta', 'UAII', 'Util. neta'],
        datasets: [
          { label: String(A[p0]), data: dat(p0), backgroundColor: '#9db4d0' },
          { label: String(A[p1]), data: dat(p1), backgroundColor: '#0f5c4d' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' C$ ' + Fmt.num(ctx.raw, 2) } } },
        scales: { y: { ticks: { callback: millones } } } }
    }));
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-estructura'), {
      type: 'doughnut',
      data: {
        labels: ['Pasivo corriente', 'Pasivo L/P', 'Patrimonio'],
        datasets: [{ data: [r[p1].pc, r[p1].pnc, r[p1].patrimonio], backgroundColor: ['#e06c5a', '#f0a500', '#0f5c4d'] }]
      },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' C$ ' + Fmt.num(ctx.raw, 2) } } } }
    }));
    const razLiq = [
      { label: 'Razón corriente',
        v0: divG(r[p0].ac, r[p0].pc),
        v1: divG(r[p1].ac, r[p1].pc) },
      { label: 'Prueba ácida',
        v0: divG(r[p0].ac - (Number(d.bg.inventarios[p0])||0), r[p0].pc),
        v1: divG(r[p1].ac - (Number(d.bg.inventarios[p1])||0), r[p1].pc) }
    ];
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-liquidez'), {
      type: 'bar',
      data: {
        labels: razLiq.map(x => x.label),
        datasets: [
          { label: String(A[p0]), data: razLiq.map(x => x.v0 || 0), backgroundColor: '#9db4d0' },
          { label: String(A[p1]), data: razLiq.map(x => x.v1 || 0), backgroundColor: '#0f5c4d' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' ' + Fmt.num(ctx.raw, 2) + ' veces' } } },
        scales: { y: { beginAtZero: true } } }
    }));
    const marg = p => [
      r[p].utilidadBruta  / (Number(d.er.ventas[p]) || 1),
      r[p].uaii           / (Number(d.er.ventas[p]) || 1),
      r[p].utilidadNeta   / (Number(d.er.ventas[p]) || 1)
    ];
    Analisis.grafs.push(new Chart(raiz.querySelector('#g-margenes'), {
      type: 'bar',
      data: {
        labels: ['Margen bruto', 'Margen operativo', 'Margen neto'],
        datasets: [
          { label: String(A[p0]), data: marg(p0), backgroundColor: '#9db4d0' },
          { label: String(A[p1]), data: marg(p1), backgroundColor: '#0f5c4d' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ' ' + Fmt.pct(ctx.raw) } } },
        scales: { y: { ticks: { callback: v => Fmt.pct(v) } } } }
    }));
  },

 render(el) {
    const d = Estados.obtener();

    if (!d || !Array.isArray(d.anios) || d.anios.length === 0 || !d.er || !d.bg) {
      el.innerHTML =
        '<div class="tarjeta">' +
          '<div class="aviso">No hay períodos o estados financieros cargados para esta empresa. Registra o importa al menos un período primero.</div>' +
        '</div>';
      return;
    }

    const r = Estados.calcular(d);
    if (!Array.isArray(r) || r.length === 0) {
      el.innerHTML =
        '<div class="tarjeta">' +
          '<div class="aviso">No se pudieron procesar los cálculos financieros. Verifica los datos ingresados.</div>' +
        '</div>';
      return;
    }

    const tabs = [
      ['horizontal', 'Análisis horizontal'], ['vertical', 'Análisis vertical'],
      ['razones',    'Razones financieras'],  ['dupont',   'Sistema DuPont'],
      ['graficos',   'Gráficos']
    ];
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="barra-acciones">' +
        '<button class="btn sec" id="anl-btn-rangos">Configurar semáforos</button>' +
      '</div>' +
      '<div class="pestanas">' +
        tabs.map((t, i) =>
          '<button class="pest' + (i===0?' activa':'') + '" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>'
        ).join('') +
      '</div>' +
      '<div class="tarjeta" id="sec-horizontal">'  + Analisis.tablaHorizontal(d, r) + '</div>' +
      '<div class="tarjeta" id="sec-vertical"  style="display:none">' + Analisis.tablaVertical(d, r)  + '</div>' +
      '<div class="tarjeta" id="sec-razones"   style="display:none">' + Analisis.tablaRazones(d, r)   + '</div>' +
      '<div         id="sec-dupont"   style="display:none">' + Analisis.htmlDupont(d, r) + '</div>' +
      '<div         id="sec-graficos" style="display:none">' +
        '<div class="dos-col">' +
          '<div class="tarjeta"><h3>Resultados por año</h3><div class="grafico"><canvas id="g-resultados"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Estructura de financiamiento ' + esc(String(d.anios[d.anios.length-1])) + '</h3><div class="grafico"><canvas id="g-estructura"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Liquidez comparada</h3><div class="grafico"><canvas id="g-liquidez"></canvas></div></div>' +
          '<div class="tarjeta"><h3>Márgenes comparados</h3><div class="grafico"><canvas id="g-margenes"></canvas></div></div>' +
        '</div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    raiz.querySelector('#anl-btn-rangos').addEventListener('click', () => {
      Analisis.modalRangos(() => Analisis.render(el));
    });

    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => {
        const s = raiz.querySelector('#sec-' + t[0]);
        if (s) s.style.display = t[0] === b.dataset.tab ? '' : 'none';
      });
      if (b.dataset.tab === 'graficos') Analisis.dibujarGraficos(raiz, d, r);
    }));
  }
};

Modulos.analisis = {
  titulo: 'Análisis financiero',
  subtitulo: 'Análisis horizontal, vertical, razones financieras, DuPont y gráficos',
  render(el) { Analisis.render(el); }
};