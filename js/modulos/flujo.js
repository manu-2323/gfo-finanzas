// Módulo 5: Flujo de efectivo
// · Método indirecto con notas explicativas por ajuste
// · Alerta visual cuando el flujo operativo es negativo
// · Resumen efectivo inicial → variación → final con comprobación vs Balance
// · Tabla comparativa de flujos entre los dos períodos elegidos
// · Interpretación automática de cada actividad
const Flujo = {
  grafs: [],

  ejemploManual() { return { inicial: 25000, op: 20000, inv: -13000, fin: 20000 }; },
  vacioManual()   { return { inicial: 0, op: 0, inv: 0, fin: 0 }; },
  obtenerManual() { return Datos.leer('flujo_manual', Flujo.ejemploManual()); },

  // Método indirecto — cada línea tiene una nota que explica qué es y por qué suma o resta
  indirecto(d, r) {
    const b   = (k, p) => Number(d.bg[k][p]) || 0;
    const dif = k => b(k, 1) - b(k, 0);
    const dep = Number(d.er.depreciacion[1]) || 0;
    const un  = r[1].utilidadNeta;
    const isr = r[1].impuesto || 0;

    const op = [
      { label: 'Utilidad neta', valor: un,
        nota: 'Punto de partida: resultado del ejercicio ya descontado el ISR (' + Fmt.moneda(isr) + '). Es el ingreso real de la empresa antes de ajustar por movimientos que no son efectivo.' },
      { label: '(+) Depreciación', valor: dep,
        nota: 'Se suma porque redujo la utilidad contable, pero NO significó salida real de efectivo. Es solo un registro contable del desgaste de los activos fijos.' },
      { label: 'Cuentas por cobrar', valor: -dif('cxc'),
        nota: dif('cxc') > 0
          ? 'Aumentó C$ ' + Fmt.num(dif('cxc'),2) + ': se vendió más a crédito. Ese efectivo todavía no llegó → resta del flujo.'
          : dif('cxc') < 0
            ? 'Disminuyó C$ ' + Fmt.num(-dif('cxc'),2) + ': se cobró cartera pendiente. Ese efectivo sí llegó → suma al flujo.'
            : 'Sin variación en el período.' },
      { label: 'Inventarios', valor: -dif('inventarios'),
        nota: dif('inventarios') > 0
          ? 'Aumentó C$ ' + Fmt.num(dif('inventarios'),2) + ': se compró más mercancía. Salida de efectivo → resta.'
          : dif('inventarios') < 0
            ? 'Disminuyó C$ ' + Fmt.num(-dif('inventarios'),2) + ': se vendió inventario sin reponer todo. Ahorro de caja → suma.'
            : 'Sin variación en el período.' },
      { label: 'Otros activos corrientes', valor: -dif('otrosAC'),
        nota: 'Variación neta en anticipos, prepagos y otros activos de corto plazo. Si aumentan, salió efectivo (resta); si bajan, se recuperó efectivo (suma).' },
      { label: 'Cuentas por pagar', valor: dif('cxp'),
        nota: dif('cxp') > 0
          ? 'Aumentó C$ ' + Fmt.num(dif('cxp'),2) + ': se postergaron pagos a proveedores. Se conservó efectivo → suma.'
          : dif('cxp') < 0
            ? 'Disminuyó C$ ' + Fmt.num(-dif('cxp'),2) + ': se pagaron deudas con proveedores. Salida de efectivo → resta.'
            : 'Sin variación en el período.' },
      { label: 'Otros pasivos corrientes', valor: dif('otrosPC'),
        nota: 'Impuestos por pagar, gastos acumulados y otros pasivos de corto plazo. ' +
              (dif('otrosPC') > 0 ? 'Aumento: queda más por pagar → se conservó efectivo.' : dif('otrosPC') < 0 ? 'Disminución: se pagaron obligaciones acumuladas.' : 'Sin variación.') }
    ];
    if (isr > 0) {
      op.push({ label: 'Referencia ISR del período', valor: 0, esInfo: true,
        nota: 'El ISR calculado fue ' + Fmt.moneda(isr) + '. Ya está incluido en la utilidad neta. Si hay impuesto pendiente de pago, su variación queda en "Otros pasivos corrientes".' });
    }

    // Compra neta de activos fijos: AF_fin = AF_ini + Compras − Dep ⟹ Compras = ΔAF + Dep
    const compraAF = dif('activosFijos') + dep;
    const inv = [
      { label: compraAF >= 0 ? '(−) Compra neta de activos fijos' : '(+) Venta neta de activos fijos',
        valor: -compraAF,
        nota: 'Fórmula: (AF cierre ' + Fmt.moneda(b('activosFijos',1)) + ') − (AF inicio ' + Fmt.moneda(b('activosFijos',0)) + ') + Depreciación ' + Fmt.moneda(dep) + ' = ' + Fmt.moneda(compraAF) + '. ' +
              (compraAF > 0 ? 'Positivo → se compraron activos fijos (salida de efectivo).'
               : compraAF < 0 ? 'Negativo → las ventas o bajas de activos superaron las compras (entrada de efectivo).'
               : 'Sin movimiento neto en activos fijos.') },
      { label: 'Otros activos no corrientes', valor: -dif('otrosANC'),
        nota: dif('otrosANC') > 0
          ? 'Aumentaron C$ ' + Fmt.num(dif('otrosANC'),2) + ': se adquirieron activos de largo plazo. Salida de efectivo.'
          : dif('otrosANC') < 0
            ? 'Disminuyeron C$ ' + Fmt.num(-dif('otrosANC'),2) + ': se recuperaron o vendieron activos de largo plazo.'
            : 'Sin variación en el período.' }
    ];

    // Dividendos estimados: UR_fin = UR_ini + UN − Dividendos
    const div = b('utilidadesRetenidas', 0) + un - b('utilidadesRetenidas', 1);
    const fin = [
      { label: 'Préstamos a corto plazo', valor: dif('prestCP'),
        nota: dif('prestCP') > 0 ? 'Se obtuvieron nuevos créditos de corto plazo. Entrada de efectivo.' : dif('prestCP') < 0 ? 'Se pagaron préstamos de corto plazo. Salida de efectivo.' : 'Sin variación.' },
      { label: 'Préstamos a largo plazo', valor: dif('prestLP'),
        nota: dif('prestLP') > 0 ? 'Nuevos créditos de largo plazo. Entrada de efectivo.' : dif('prestLP') < 0 ? 'Se amortizó deuda de largo plazo. Salida de efectivo.' : 'Sin variación.' },
      { label: 'Variación en capital social', valor: dif('capital'),
        nota: dif('capital') > 0 ? 'Nuevos aportes de los socios.' : dif('capital') < 0 ? 'Retiro de capital.' : 'Sin variación en capital.' },
      { label: '(−) Dividendos pagados (estimado)', valor: -div,
        nota: 'Fórmula: UR inicio (' + Fmt.moneda(b('utilidadesRetenidas',0)) + ') + Utilidad neta (' + Fmt.moneda(un) + ') − UR final (' + Fmt.moneda(b('utilidadesRetenidas',1)) + ') = ' + Fmt.moneda(div) + '. ' +
              (div > 0 ? 'Se repartieron dividendos a los socios.' : div < 0 ? 'Las UR finales superan la fórmula; puede haber ajustes de períodos anteriores.' : 'No se repartieron dividendos.') }
    ];

    const suma  = l => l.reduce((s, x) => s + (x.esInfo ? 0 : x.valor), 0);
    const flOp  = suma(op), flInv = suma(inv), flFin = suma(fin);
    const neta  = flOp + flInv + flFin;
    const ini   = b('efectivo', 0), final = ini + neta, enBalance = b('efectivo', 1);
    return { op, inv, fin, flOp, flInv, flFin, neta, ini, final, enBalance, diferencia: final - enBalance };
  },

  limpiar() { Flujo.grafs.forEach(g => { try { g.destroy(); } catch (e) {} }); Flujo.grafs = []; },

  grafico(canvas, op, inv, fin, neta) {
    if (typeof Chart === 'undefined' || !canvas) return;
    const P = (typeof Tema !== 'undefined') ? Tema.paleta() : { ok: '#2d6a4f', malo: '#b25555', acento: '#3f6fa3', claro: '#9db4d0' };
    Flujo.grafs.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Operación', 'Inversión', 'Financiamiento', 'Variación neta'],
        datasets: [{
          label: 'C$',
          data: [op, inv, fin, neta],
          backgroundColor: [
            op < 0 ? P.malo : P.ok,
            '#b5835a',
            P.acento,
            neta < 0 ? P.malo : P.ok
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: ctx => ' ' + Fmt.moneda(ctx.raw),
            afterLabel: ctx => {
              const notas = ['Actividad principal del negocio', 'Compra/venta de activos fijos', 'Préstamos y capital', 'Resultado total del período'];
              return notas[ctx.dataIndex] || '';
            }
          }}
        },
        scales: { y: { ticks: { callback: v => {
          const a = Math.abs(v);
          return (v < 0 ? '-' : '') + (a >= 1e6 ? (a/1e6).toFixed(1)+'M' : a >= 1e3 ? (a/1e3).toFixed(0)+'k' : a.toFixed(0));
        }}}}
      }
    }));
  },

  interpretar(op, inv, fin, neta) {
    const lineas = [];
    if (op < 0) {
      lineas.push({ nivel: 'riesgo', t: 'Alerta: operación consume efectivo',
        d: 'El flujo operativo es ' + Fmt.moneda(op) + '. La actividad principal del negocio no genera caja suficiente para cubrir sus propios gastos operativos. Conviene revisar la cobranza, el control de costos y el ciclo de conversión de efectivo.' });
    } else if (op === 0) {
      lineas.push({ nivel: 'alerta', t: 'Flujo operativo es cero',
        d: 'No hay información suficiente para concluir. Verifica los datos de los estados financieros.' });
    } else {
      lineas.push({ nivel: 'ok', t: 'Operación genera efectivo',
        d: 'La empresa genera ' + Fmt.moneda(op) + ' de efectivo con su actividad principal. Cubre sus necesidades básicas de caja sin depender de deuda o venta de activos. Situación saludable.' });
    }
    if (inv < 0) {
      lineas.push({ nivel: 'alerta', t: 'Inversión en activos',
        d: 'Se destinaron ' + Fmt.moneda(-inv) + ' a comprar o mejorar activos. Es normal cuando la empresa crece o mantiene su capacidad productiva. Evalúa si estos fondos provienen del flujo operativo.' });
    } else if (inv > 0) {
      lineas.push({ nivel: 'alerta', t: 'Recuperación de inversiones',
        d: 'La inversión aportó ' + Fmt.moneda(inv) + ' (ventas o recuperación de activos). Verifica si esto es parte de una estrategia planificada o si la empresa vende activos por necesidad de efectivo.' });
    }
    if (fin > 0) {
      lineas.push({ nivel: 'alerta', t: 'Empresa se financia con deuda o aportes',
        d: 'El financiamiento aportó ' + Fmt.moneda(fin) + '. La empresa recurre a créditos o nuevos aportes de socios para cubrir parte de sus necesidades de caja.' });
    } else if (fin < 0) {
      lineas.push({ nivel: op > 0 ? 'ok' : 'alerta', t: 'Pago de deudas y/o dividendos',
        d: 'El financiamiento consumió ' + Fmt.moneda(-fin) + ' (pago de préstamos y/o dividendos). ' + (op > 0 && op >= -fin ? 'El flujo operativo positivo lo cubre sin problemas.' : 'Evalúa si esto es sostenible.') });
    }
    if (op < 0 && (inv > 0 || fin > 0)) {
      lineas.push({ nivel: 'riesgo', t: 'Situación crítica de liquidez',
        d: 'La empresa cubre el déficit operativo vendiendo activos o tomando más deuda. Esta situación no es sostenible a largo plazo y requiere atención urgente.' });
    }
    lineas.push({ nivel: neta >= 0 ? 'ok' : 'alerta', t: 'Resultado del período',
      d: neta >= 0
        ? 'El efectivo aumentó ' + Fmt.moneda(neta) + ' en el período. La empresa tiene más caja que al inicio.'
        : 'El efectivo disminuyó ' + Fmt.moneda(-neta) + ' en el período. La empresa tiene menos caja que al inicio.' });
    return lineas;
  },

  htmlAlerta(flOp) {
    if (flOp >= 0) return '';
    return '<div class="fl-alerta">⚠ <strong>Flujo operativo negativo (' + Fmt.moneda(flOp) + ')</strong> — ' +
      'La empresa gastó más efectivo del que generó en su actividad principal. ' +
      'Revisa cobranza, costos y eficiencia antes de invertir o repartir dividendos.</div>';
  },

  htmlResumen(I, d) {
    const ok  = Math.abs(I.diferencia) < 0.5;
    const col = v => v >= 0 ? 'var(--primario,#2d6a4f)' : 'var(--malo,#b25555)';
    const bloque = (lbl, val, grande, color, fondo) =>
      '<div class="fl-ri' + (fondo ? ' ' + fondo : '') + '">' +
        '<div class="fl-rl">' + lbl + '</div>' +
        '<div class="fl-rv" style="font-size:' + (grande ? '22px' : '17px') + ';color:' + (color || 'inherit') + '">' + Fmt.moneda(val) + '</div>' +
      '</div>';
    return '<div class="fl-resumen">' +
      bloque('Efectivo inicial<br><small>' + esc(d.anios[0]) + '</small>', I.ini, false) +
      '<div class="fl-rsep">' + (I.neta >= 0 ? '+' : '') + '</div>' +
      bloque('Variación neta', I.neta, false, col(I.neta)) +
      '<div class="fl-rsep">=</div>' +
      bloque('Efectivo final calculado<br><small>' + esc(d.anios[1]) + '</small>', I.final, true, col(I.final), 'fl-ri-dest') +
      '<div class="fl-rsep">|</div>' +
      '<div class="fl-ri fl-ri-bg">' +
        '<div class="fl-rl">En Balance General<br><small>' + esc(d.anios[1]) + '</small></div>' +
        '<div class="fl-rv" style="font-size:17px">' + Fmt.moneda(I.enBalance) + '</div>' +
        '<div style="margin-top:6px">' + (ok
          ? '<span class="fl-ok">✓ Coincide</span>'
          : '<span class="fl-err">Diferencia: ' + Fmt.moneda(I.diferencia) + '</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  },

  htmlActividad(titulo, filas, actNombre, totalValor, colorBorde) {
    const rows = filas.map(f => {
      if (f.esInfo) return '<tr class="fl-info-row"><td colspan="2"><em>' + esc(f.nota) + '</em></td></tr>';
      const clase = f.valor < 0 ? 'fl-neg' : f.valor > 0 ? 'fl-pos' : '';
      return '<tr>' +
        '<td>' +
          '<span class="fl-concepto">' + esc(f.label) + '</span>' +
          '<span class="fl-nota">' + esc(f.nota) + '</span>' +
        '</td>' +
        '<td class="fl-monto ' + clase + '">' + Fmt.moneda(f.valor) + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="fl-actividad" style="border-left:4px solid ' + colorBorde + '">' +
      '<div class="fl-act-titulo" style="color:' + colorBorde + '">' + titulo + '</div>' +
      '<div class="tabla-scroll"><table class="tabla-datos">' +
        '<tr><th>Concepto</th><th style="width:140px;text-align:right">Monto (C$)</th></tr>' +
        rows +
        '<tr class="total"><td><strong>Flujo neto de ' + actNombre + '</strong></td>' +
          '<td class="fl-monto ' + (totalValor < 0 ? 'fl-neg' : totalValor > 0 ? 'fl-pos' : '') + '">' +
            '<strong>' + Fmt.moneda(totalValor) + '</strong></td></tr>' +
      '</table></div>' +
    '</div>';
  },

  // Tabla comparativa de los 3 flujos más el efectivo inicial/final
  htmlComparativo(I, d) {
    const F = (v) => '<span class="' + (v < 0 ? 'fl-neg' : v > 0 ? 'fl-pos' : '') + '">' + Fmt.moneda(v) + '</span>';
    return '<div class="fl-comparativo">' +
      '<h3 style="margin:0 0 10px">Comparativo: flujos del período</h3>' +
      '<div class="tabla-scroll"><table class="tabla-datos">' +
        '<tr><th>Actividad</th><th style="text-align:right">Monto</th><th>Qué representa</th></tr>' +
        '<tr><td>Efectivo inicial (' + esc(d.anios[0]) + ')</td><td class="fl-monto">' + Fmt.moneda(I.ini) + '</td><td class="formula">Efectivo disponible al inicio del período</td></tr>' +
        '<tr><td>Flujo de operación</td><td class="fl-monto">' + F(I.flOp) + '</td><td class="formula">Generado (o consumido) por la actividad principal del negocio</td></tr>' +
        '<tr><td>Flujo de inversión</td><td class="fl-monto">' + F(I.flInv) + '</td><td class="formula">Compra o venta de activos fijos y otros activos de largo plazo</td></tr>' +
        '<tr><td>Flujo de financiamiento</td><td class="fl-monto">' + F(I.flFin) + '</td><td class="formula">Nuevas deudas, pago de préstamos, aportes o retiros de socios</td></tr>' +
        '<tr class="total"><td>Variación neta del efectivo</td><td class="fl-monto">' + F(I.neta) + '</td><td class="formula">Suma de los 3 flujos</td></tr>' +
        '<tr class="total"><td>Efectivo final (' + esc(d.anios[1]) + ')</td><td class="fl-monto">' + F(I.final) + '</td><td class="formula">Efectivo inicial + Variación neta</td></tr>' +
      '</table></div>' +
    '</div>';
  },

  htmlInterpretacion(op, inv, fin, neta) {
    const items = Flujo.interpretar(op, inv, fin, neta);
    return '<div class="fl-interpretacion"><h3>¿Qué nos dice este flujo de efectivo?</h3>' +
      items.map(it => '<div class="fl-int-item ' + it.nivel + '"><strong>' + esc(it.t) + ':</strong> ' + esc(it.d) + '</div>').join('') +
    '</div>';
  },

  estilos() {
    if (document.getElementById('fl-estilos')) return;
    const s = document.createElement('style'); s.id = 'fl-estilos';
    s.textContent = [
      '.fl-alerta{background:#fdf0ee;border-left:4px solid var(--malo,#b25555);border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:1.5}',
      '.fl-resumen{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.07)}',
      '.fl-ri{flex:1;min-width:110px;text-align:center;padding:8px 10px}',
      '.fl-ri-dest{background:#f3f7f4;border-radius:10px;border:2px solid var(--ok,#3d8b6a)}',
      '.fl-ri-bg{border:1px solid var(--borde,#dde3ea);border-radius:10px}',
      '.fl-rl{font-size:11px;color:var(--suave,#6b7788);line-height:1.3;margin-bottom:4px}',
      '.fl-rv{font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums}',
      '.fl-rsep{font-size:22px;font-weight:200;color:var(--suave,#6b7788);display:flex;align-items:center;padding:0 4px}',
      '.fl-ok{color:var(--ok,#3d8b6a);font-weight:600}',
      '.fl-err{color:var(--malo,#b25555);font-weight:600}',
      '.fl-actividad{border-radius:0 10px 10px 0;padding:16px;margin-bottom:14px;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.07)}',
      '.fl-act-titulo{font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}',
      '.fl-concepto{font-weight:500;display:block;font-size:13px}',
      '.fl-nota{font-size:11px;color:var(--suave,#6b7788);display:block;margin-top:3px;line-height:1.45}',
      '.fl-monto{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums;font-size:13px}',
      '.fl-pos{color:var(--ok,#3d8b6a)}',
      '.fl-neg{color:var(--malo,#b25555)}',
      '.fl-info-row td{font-size:11px;font-style:italic;color:var(--suave,#6b7788);padding:4px 10px!important;background:#f8f9fb}',
      '.fl-comparativo{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.07)}',
      '.fl-interpretacion{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.07)}',
      '.fl-interpretacion h3{margin:0 0 12px;font-size:15px}',
      '.fl-int-item{padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.5;margin-bottom:8px;background:#f8f9fb}',
      '.fl-int-item.ok{background:#f0f9f4;border-left:3px solid var(--ok,#3d8b6a)}',
      '.fl-int-item.alerta{background:#fdf8f0;border-left:3px solid var(--alerta,#c08a2e)}',
      '.fl-int-item.riesgo{background:#fdf0ee;border-left:3px solid var(--malo,#b25555)}'
    ].join('');
    document.head.appendChild(s);
  },

  render(el) {
    Flujo.estilos();
    const d = Estados.obtener(), r = Estados.calcular(d), I = Flujo.indirecto(d, r), m = Flujo.obtenerManual();
    const tabs = [['indirecto', 'Desde los Estados financieros'], ['manual', 'Por actividades (caso manual)']];

    const sectInd =
      '<div id="sec-indirecto">' +
        '<div class="aviso">Calculado automáticamente con los datos de <strong>' + esc(d.anios[0]) + '</strong> y <strong>' + esc(d.anios[1]) + '</strong>. Actualiza los estados financieros para ver cambios aquí.</div>' +
        Flujo.htmlAlerta(I.flOp) +
        Flujo.htmlResumen(I, d) +
        Flujo.htmlComparativo(I, d) +
        Flujo.htmlActividad('Actividad de OPERACIÓN — lo que genera (o consume) la operación normal del negocio',
          I.op, 'operación', I.flOp, 'var(--ok,#2d6a4f)') +
        Flujo.htmlActividad('Actividad de INVERSIÓN — compra o venta de activos de largo plazo',
          I.inv, 'inversión', I.flInv, '#b5835a') +
        Flujo.htmlActividad('Actividad de FINANCIAMIENTO — deudas, aportes de socios y dividendos',
          I.fin, 'financiamiento', I.flFin, 'var(--acento,#3f6fa3)') +
        (Math.abs(I.diferencia) >= 0.5
          ? '<div class="cuadre mal">El efectivo calculado (' + Fmt.moneda(I.final) + ') no coincide con el Balance General (' + Fmt.moneda(I.enBalance) + '). Diferencia: ' + Fmt.moneda(I.diferencia) + '. Posibles causas: balance que no cuadra, ajustes extraordinarios no registrados, o cuentas clasificadas en un grupo incorrecto.</div>'
          : '<div class="cuadre ok">El efectivo final calculado coincide con el efectivo del Balance General. El flujo es consistente.</div>') +
        Flujo.htmlInterpretacion(I.flOp, I.flInv, I.flFin, I.neta) +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g1"></canvas></div></div>' +
      '</div>';

    const campo = (id, et, v) => '<label class="campo corto" style="flex:1;min-width:170px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + v + '"></label>';

    const sectMan =
      '<div id="sec-manual" style="display:none">' +
        '<div class="aviso">Escribe el flujo neto de cada actividad. Los valores negativos representan salidas de efectivo (escríbelos con signo menos, por ejemplo −13000).</div>' +
        '<div class="barra-acciones" style="margin-top:14px">' +
          campo('fl-ini', 'Efectivo inicial (C$)', m.inicial) +
          campo('fl-op',  'Flujo de operación (C$)', m.op) +
          campo('fl-inv', 'Flujo de inversión (C$)', m.inv) +
          campo('fl-fin', 'Flujo de financiamiento (C$)', m.fin) +
        '</div>' +
        '<div class="barra-acciones"><button class="btn" id="fl-ejemplo">Cargar caso de clase</button>' +
          '<button class="btn sec peligro" id="fl-limpiar">Limpiar datos</button></div>' +
        '<div class="rejilla" id="fl-tarjetas"></div>' +
        '<div id="fl-interp" style="margin-top:14px"></div>' +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g2"></canvas></div></div>' +
      '</div>';

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' + tabs.map((t, i) =>
        '<button class="pest' + (i === 0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      sectInd + sectMan;
    el.innerHTML = '';
    el.appendChild(raiz);

    const num = id => Fmt.aNum(raiz.querySelector(id).value);
    const refrescarManual = () => {
      const x = { inicial: num('#fl-ini'), op: num('#fl-op'), inv: num('#fl-inv'), fin: num('#fl-fin') };
      Datos.guardar('flujo_manual', x);
      const neta = x.op + x.inv + x.fin, final = x.inicial + neta;
      const t = (tt, v, nota) => '<div class="tarjeta"><h3>' + tt + '</h3><div class="valor ' + (v < 0 ? 'fl-neg' : v > 0 ? 'fl-pos' : '') + '">' + Fmt.moneda(v) + '</div><div class="nota">' + nota + '</div></div>';
      raiz.querySelector('#fl-tarjetas').innerHTML =
        t('Variación neta', neta, 'Operación + Inversión + Financiamiento') +
        t('Efectivo inicial', x.inicial, 'Dato de entrada') +
        t('Efectivo final', final, 'Efectivo inicial + Variación neta');
      raiz.querySelector('#fl-interp').innerHTML =
        Flujo.htmlAlerta(x.op) + Flujo.htmlInterpretacion(x.op, x.inv, x.fin, neta);
      Flujo.limpiar();
      Flujo.grafico(raiz.querySelector('#fl-g2'), x.op, x.inv, x.fin, neta);
    };

    raiz.querySelectorAll('.pest').forEach(b => b.addEventListener('click', () => {
      raiz.querySelectorAll('.pest').forEach(x => x.classList.toggle('activa', x === b));
      tabs.forEach(t => { raiz.querySelector('#sec-' + t[0]).style.display = t[0] === b.dataset.tab ? '' : 'none'; });
      Flujo.limpiar();
      if (b.dataset.tab === 'indirecto') Flujo.grafico(raiz.querySelector('#fl-g1'), I.flOp, I.flInv, I.flFin, I.neta);
      else refrescarManual();
    }));

    raiz.querySelector('#sec-manual').addEventListener('input', refrescarManual);
    raiz.querySelector('#fl-ejemplo').addEventListener('click', () => {
      Datos.guardar('flujo_manual', Flujo.ejemploManual()); Flujo.render(el); Validar.activar(el);
      el.querySelector('[data-tab="manual"]').click();
    });
    raiz.querySelector('#fl-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos del flujo manual?')) {
        Datos.guardar('flujo_manual', Flujo.vacioManual()); Flujo.render(el); Validar.activar(el);
        el.querySelector('[data-tab="manual"]').click();
      }
    });
    Flujo.grafico(raiz.querySelector('#fl-g1'), I.flOp, I.flInv, I.flFin, I.neta);
    Validar.activar(raiz);
  }
};

Modulos.flujo = {
  titulo: 'Flujo de efectivo',
  subtitulo: 'Actividades de operación, inversión y financiamiento',
  render(el) { Flujo.render(el); }
};