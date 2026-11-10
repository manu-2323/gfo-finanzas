// Módulo 5: Flujo de efectivo (operación, inversión, financiamiento)
// Mejoras: notas explicativas por ajuste · alerta flujo negativo · resumen efectivo inicial/variación/final
//          ISR referencia · compra neta AF con detalle · interpretación ampliada · diferencia vs BG
const Flujo = {
  grafs: [],

  ejemploManual() { return { inicial: 25000, op: 20000, inv: -13000, fin: 20000 }; },
  vacioManual()   { return { inicial: 0, op: 0, inv: 0, fin: 0 }; },
  obtenerManual() { return Datos.leer('flujo_manual', Flujo.ejemploManual()); },

  // Método indirecto — cada línea ahora es un objeto con nota explicativa
  indirecto(d, r) {
    const b   = (k, p) => Number(d.bg[k][p]) || 0;
    const dif = k => b(k, 1) - b(k, 0);
    const dep = Number(d.er.depreciacion[1]) || 0;
    const un  = r[1].utilidadNeta;
    const isr = r[1].impuesto || 0;

    const op = [
      { label: 'Utilidad neta', valor: un,
        nota: 'Punto de partida del metodo indirecto. Es el resultado del ejercicio ya descontado el ISR (' + Fmt.moneda(isr) + ').' },
      { label: '(+) Depreciacion', valor: dep,
        nota: 'Gasto que redujo la utilidad contable pero NO implico salida real de efectivo, por eso se suma de regreso.' },
      { label: 'Cuentas por cobrar', valor: -dif('cxc'),
        nota: dif('cxc') > 0
          ? 'Aumento de ' + Fmt.moneda(dif('cxc')) + ': se vendio mas a credito; ese efectivo todavia no llego, por eso resta.'
          : dif('cxc') < 0
            ? 'Disminucion de ' + Fmt.moneda(-dif('cxc')) + ': se cobro cartera pendiente, ese efectivo si llego.'
            : 'Sin variacion en el periodo.' },
      { label: 'Inventarios', valor: -dif('inventarios'),
        nota: dif('inventarios') > 0
          ? 'Aumento de ' + Fmt.moneda(dif('inventarios')) + ': se compro mas mercancia, salio efectivo.'
          : dif('inventarios') < 0
            ? 'Disminucion de ' + Fmt.moneda(-dif('inventarios')) + ': se vendio inventario acumulado sin reponer todo.'
            : 'Sin variacion en el periodo.' },
      { label: 'Otros activos corrientes', valor: -dif('otrosAC'),
        nota: 'Variacion neta en otros activos de corto plazo (anticipos, prepagos, etc.). Aumento resta; disminucion suma.' },
      { label: 'Cuentas por pagar', valor: dif('cxp'),
        nota: dif('cxp') > 0
          ? 'Aumento de ' + Fmt.moneda(dif('cxp')) + ': se postergaron pagos a proveedores, se conservo efectivo.'
          : dif('cxp') < 0
            ? 'Disminucion de ' + Fmt.moneda(-dif('cxp')) + ': se pagaron deudas con proveedores.'
            : 'Sin variacion en el periodo.' },
      { label: 'Otros pasivos corrientes', valor: dif('otrosPC'),
        nota: 'Incluye impuestos por pagar, gastos acumulados y otros pasivos de corto plazo. ' +
              (dif('otrosPC') > 0 ? 'Aumento: quedo mas pendiente de pagar.' : dif('otrosPC') < 0 ? 'Disminucion: se pagaron obligaciones acumuladas.' : 'Sin variacion.') }
    ];
    // Referencia de ISR si hay impuesto calculado
    if (isr > 0) {
      op.push({ label: 'Referencia ISR del periodo', valor: 0, esInfo: true,
        nota: 'El ISR calculado es ' + Fmt.moneda(isr) + '. Ya esta descontado de la utilidad neta. Si hay impuesto por pagar pendiente, su variacion queda reflejada en "Otros pasivos corrientes" arriba.' });
    }

    // Compra neta de activos fijos: AF_fin = AF_ini + Compras − Dep ⟹ Compras = ΔAF + Dep
    const compraAF = dif('activosFijos') + dep;
    const inv = [
      { label: compraAF >= 0 ? '(−) Compra neta de activos fijos' : '(+) Venta / baja neta de activos fijos',
        valor: -compraAF,
        nota: 'Formula: (AF al cierre ' + Fmt.moneda(b('activosFijos',1)) + ') − (AF al inicio ' + Fmt.moneda(b('activosFijos',0)) + ') + Depreciacion ' + Fmt.moneda(dep) + ' = ' + Fmt.moneda(compraAF) + '. ' +
              (compraAF > 0 ? 'Resultado positivo: hubo compras netas de activos.' : compraAF < 0 ? 'Resultado negativo: las ventas o bajas de activos superaron las compras.' : 'Sin movimiento neto.') },
      { label: 'Otros activos no corrientes', valor: -dif('otrosANC'),
        nota: dif('otrosANC') > 0
          ? 'Aumento de ' + Fmt.moneda(dif('otrosANC')) + ': se adquirieron mas activos de largo plazo.'
          : dif('otrosANC') < 0
            ? 'Disminucion de ' + Fmt.moneda(-dif('otrosANC')) + ': se recuperaron o vendieron activos de largo plazo.'
            : 'Sin variacion en el periodo.' }
    ];

    // Dividendos: UR_fin = UR_ini + UN − Dividendos ⟹ Dividendos = UR_ini + UN − UR_fin
    const div = b('utilidadesRetenidas', 0) + un - b('utilidadesRetenidas', 1);
    const fin = [
      { label: 'Prestamos a corto plazo', valor: dif('prestCP'),
        nota: dif('prestCP') > 0 ? 'Aumento: se obtuvieron nuevos creditos de corto plazo.' : dif('prestCP') < 0 ? 'Disminucion: se pagaron prestamos de corto plazo.' : 'Sin variacion.' },
      { label: 'Prestamos a largo plazo', valor: dif('prestLP'),
        nota: dif('prestLP') > 0 ? 'Aumento: nuevos creditos de largo plazo.' : dif('prestLP') < 0 ? 'Disminucion: se amortizo deuda de largo plazo.' : 'Sin variacion.' },
      { label: 'Variacion en capital social', valor: dif('capital'),
        nota: dif('capital') > 0 ? 'Nuevos aportes de los socios.' : dif('capital') < 0 ? 'Retiro de capital.' : 'Sin variacion.' },
      { label: '(−) Dividendos pagados', valor: -div,
        nota: 'Formula: UR inicio (' + Fmt.moneda(b('utilidadesRetenidas',0)) + ') + Utilidad neta (' + Fmt.moneda(un) + ') − UR final (' + Fmt.moneda(b('utilidadesRetenidas',1)) + ') = ' + Fmt.moneda(div) + '. ' +
              (div > 0 ? 'Se repartieron dividendos.' : div < 0 ? 'Las UR finales superan la formula; puede haber ajustes de ejercicios anteriores.' : 'No se repartieron dividendos.') }
    ];

    const suma  = l => l.reduce((s, x) => s + (x.esInfo ? 0 : x.valor), 0);
    const flOp  = suma(op), flInv = suma(inv), flFin = suma(fin);
    const neta  = flOp + flInv + flFin;
    const ini   = b('efectivo', 0), final = ini + neta, enBalance = b('efectivo', 1);
    return { op, inv, fin, flOp, flInv, flFin, neta, ini, final, enBalance, diferencia: final - enBalance };
  },

  limpiar() { Flujo.grafs.forEach(g => { try { g.destroy(); } catch (e) {} }); Flujo.grafs = []; },

  grafico(canvas, op, inv, fin, neta) {
    if (typeof Chart === 'undefined') return;
    Flujo.grafs.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Operacion', 'Inversion', 'Financiamiento', 'Variacion neta'],
        datasets: [{
          label: 'C$', data: [op, inv, fin, neta],
          backgroundColor: [op < 0 ? '#c0392b' : '#2d6a4f', '#b5835a', '#3f6fa3', neta < 0 ? '#c0392b' : '#3d8b6a']
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' ' + Fmt.moneda(ctx.raw) } }
        },
        scales: { y: { ticks: { callback: v => Fmt.moneda(v) } } }
      }
    }));
  },

  // Interpretación ampliada — devuelve array de párrafos
  interpretar(op, inv, fin, neta) {
    const lineas = [];
    if (op < 0) {
      lineas.push('La operacion consume efectivo (' + Fmt.moneda(op) + '). Señal de alerta: la actividad principal no genera caja suficiente para cubrir sus propios gastos operativos. Conviene revisar la cobranza, el control de costos y el ciclo de conversion de efectivo.');
    } else if (op === 0) {
      lineas.push('El flujo operativo es cero. No hay informacion suficiente para concluir; verifica los datos de los estados financieros.');
    } else {
      lineas.push('La operacion genera ' + Fmt.moneda(op) + ' de efectivo. La empresa cubre con su actividad principal las necesidades basicas de caja. Situacion saludable.');
    }
    if (inv < 0) {
      lineas.push('Se destinaron ' + Fmt.moneda(-inv) + ' a inversion en activos. Señal de crecimiento o mantenimiento de capacidad productiva; es normal en empresas que se expanden.');
    } else if (inv > 0) {
      lineas.push('La inversion aporto ' + Fmt.moneda(inv) + ' (ventas o recuperacion de activos). Conviene verificar si la empresa vende activos por necesidad de efectivo o como parte de una estrategia planificada.');
    }
    if (fin > 0) {
      lineas.push('El financiamiento aporto ' + Fmt.moneda(fin) + '. La empresa recurre a deuda o nuevos aportes de socios para cubrir parte de sus necesidades de caja.');
    } else if (fin < 0) {
      lineas.push('El financiamiento consumio ' + Fmt.moneda(-fin) + ' (pago de deudas y/o dividendos). Señal saludable si el flujo operativo positivo lo permite sin comprometer la liquidez.');
    }
    // Cobertura de obligaciones
    if (op > 0 && fin < 0 && op >= -fin) {
      lineas.push('La operacion genera suficiente efectivo para cubrir los pagos de financiamiento (' + Fmt.moneda(-fin) + '). La empresa no depende de deuda para pagar deuda.');
    } else if (op > 0 && fin < 0 && op < -fin) {
      lineas.push('La operacion no alcanza a cubrir todos los pagos de financiamiento. La diferencia la absorbe la inversion u otras fuentes; evalua si esto es sostenible en el largo plazo.');
    } else if (op < 0 && (inv > 0 || fin > 0)) {
      lineas.push('La empresa esta cubriendo el deficit operativo con ventas de activos o nuevas deudas. Esta situacion no es sostenible a largo plazo y requiere atencion urgente.');
    }
    lineas.push(neta >= 0
      ? 'En total el efectivo aumento ' + Fmt.moneda(neta) + ' en el periodo.'
      : 'En total el efectivo disminuyo ' + Fmt.moneda(-neta) + ' en el periodo.');
    return lineas;
  },

  // Bloque de alerta cuando el flujo operativo es negativo
  htmlAlerta(flOp) {
    if (flOp >= 0) return '';
    return '<div class="fl-alerta">' +
      '<strong>Alerta: flujo operativo negativo (' + Fmt.moneda(flOp) + ')</strong> — ' +
      'La empresa gasto mas efectivo del que genero en su actividad principal. ' +
      'Revisa cobranza, costos y eficiencia antes de tomar decisiones de inversion o reparto de dividendos.' +
      '</div>';
  },

  // Tarjeta resumen: efectivo inicial + variacion = efectivo final vs Balance General
  htmlResumen(I, d) {
    const ok  = Math.abs(I.diferencia) < 0.5;
    const col = v => v >= 0 ? 'var(--color-primario,#2d6a4f)' : '#c0392b';
    const item = (lbl, val, grande, color) =>
      '<div class="fl-ri">' +
        '<div class="fl-rl">' + lbl + '</div>' +
        '<div class="fl-rv" style="font-size:' + (grande ? '20px' : '16px') + ';color:' + (color || 'inherit') + '">' + Fmt.moneda(val) + '</div>' +
      '</div>';
    return '<div class="fl-resumen">' +
      item('Efectivo inicial<br><small>' + esc(d.anios[0]) + '</small>', I.ini, false) +
      '<div class="fl-rsep">' + (I.neta >= 0 ? '+' : '') + '</div>' +
      item('Variacion neta', I.neta, false, col(I.neta)) +
      '<div class="fl-rsep">=</div>' +
      '<div class="fl-ri fl-ri-dest">' +
        '<div class="fl-rl">Efectivo final calculado<br><small>' + esc(d.anios[1]) + '</small></div>' +
        '<div class="fl-rv" style="font-size:20px">' + Fmt.moneda(I.final) + '</div>' +
      '</div>' +
      '<div class="fl-ri fl-ri-bg">' +
        '<div class="fl-rl">En Balance General</div>' +
        '<div class="fl-rv" style="font-size:15px">' + Fmt.moneda(I.enBalance) + '</div>' +
        '<div class="fl-rl" style="margin-top:4px">' +
          (ok
            ? '<span class="fl-ok">Cuadra</span>'
            : '<span class="fl-err">Diferencia: ' + Fmt.moneda(I.diferencia) + '</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // Tabla de una actividad con notas por línea
  htmlActividad(titulo, filas, actNombre, totalValor, colorBorde) {
    const rows = filas.map(f => {
      if (f.esInfo) {
        return '<tr class="fl-info-row"><td colspan="2"><em>' + f.nota + '</em></td></tr>';
      }
      return '<tr>' +
        '<td><span class="fl-concepto">' + esc(f.label) + '</span>' +
          '<span class="fl-nota">' + f.nota + '</span></td>' +
        '<td class="fl-monto ' + (f.valor < 0 ? 'fl-neg' : f.valor > 0 ? 'fl-pos' : '') + '">' +
          Fmt.moneda(f.valor) + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="fl-actividad" style="border-left:4px solid ' + colorBorde + '">' +
      '<div class="fl-act-titulo" style="color:' + colorBorde + '">' + titulo + '</div>' +
      '<div class="tabla-scroll"><table class="tabla-datos">' +
        '<tr><th>Concepto</th><th style="width:130px;text-align:right">C$</th></tr>' +
        rows +
        '<tr class="total"><td>Flujo neto de ' + actNombre + '</td>' +
          '<td class="fl-monto ' + (totalValor < 0 ? 'fl-neg' : totalValor > 0 ? 'fl-pos' : '') + '">' +
            Fmt.moneda(totalValor) + '</td>' +
        '</tr>' +
      '</table></div>' +
    '</div>';
  },

  render(el) {
    const d = Estados.obtener(), r = Estados.calcular(d), I = Flujo.indirecto(d, r), m = Flujo.obtenerManual();
    const tabs = [['indirecto', 'Desde los Estados financieros'], ['manual', 'Por actividades (caso manual)']];
    const campo = (id, et, v) => '<label class="campo corto" style="flex:1;min-width:170px">' + et +
      '<input type="text" inputmode="decimal" data-validar="numero" id="' + id + '" value="' + v + '"></label>';

    // Estilos del módulo (una sola vez)
    if (!document.getElementById('fl-estilos')) {
      const s = document.createElement('style'); s.id = 'fl-estilos';
      s.textContent = [
        '.fl-alerta{background:#fdf0ee;border-left:4px solid #c0392b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:1.5}',
        '.fl-resumen{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;background:var(--fondo-tarjeta,#fff);border-radius:10px;padding:16px;margin-bottom:16px;box-shadow:0 1px 6px rgba(0,0,0,.07)}',
        '.fl-ri{flex:1;min-width:120px;text-align:center;padding:6px 8px}',
        '.fl-ri-dest{background:var(--fondo-secundario,#f5f5f0);border-radius:8px}',
        '.fl-ri-bg{border:1px solid var(--color-borde,#e0e0d8);border-radius:8px}',
        '.fl-rl{font-size:11px;opacity:.65;line-height:1.3;margin-bottom:4px}',
        '.fl-rv{font-weight:700;line-height:1.2}',
        '.fl-rsep{font-size:24px;font-weight:200;opacity:.4;display:flex;align-items:center;padding:0 4px}',
        '.fl-ok{color:var(--color-primario,#2d6a4f);font-weight:600}',
        '.fl-err{color:#c0392b;font-weight:600}',
        '.fl-actividad{border-radius:0 10px 10px 0;padding:16px;margin-bottom:14px;background:var(--fondo-tarjeta,#fff);box-shadow:0 1px 6px rgba(0,0,0,.07)}',
        '.fl-act-titulo{font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}',
        '.fl-concepto{font-weight:500;display:block}',
        '.fl-nota{font-size:11px;opacity:.6;display:block;margin-top:2px;line-height:1.4}',
        '.fl-monto{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums}',
        '.fl-pos{color:var(--color-primario,#2d6a4f)}',
        '.fl-neg{color:#c0392b}',
        '.fl-info-row td{font-size:11px;font-style:italic;opacity:.65;padding:4px 10px!important;background:var(--fondo-secundario,#f5f5f0)}',
        '.fl-interpretacion{background:var(--fondo-tarjeta,#fff);border-radius:10px;padding:16px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.07)}',
        '.fl-interpretacion h3{margin:0 0 10px}',
        '.fl-interpretacion p{margin:0 0 8px;font-size:13px;line-height:1.6}',
        '.fl-interpretacion p:last-child{margin:0}'
      ].join('');
      document.head.appendChild(s);
    }

    const sectInd =
      '<div id="sec-indirecto">' +
        '<div class="aviso">Metodo indirecto con los datos de <strong>' + esc(d.anios[0]) + '</strong> y <strong>' + esc(d.anios[1]) + '</strong>. Si cambias los estados financieros, vuelve a abrir este modulo.</div>' +
        Flujo.htmlAlerta(I.flOp) +
        Flujo.htmlResumen(I, d) +
        Flujo.htmlActividad('Flujo de efectivo de OPERACION', I.op, 'operacion', I.flOp, '#2d6a4f') +
        Flujo.htmlActividad('Flujo de efectivo de INVERSION',    I.inv, 'inversion',    I.flInv, '#b5835a') +
        Flujo.htmlActividad('Flujo de efectivo de FINANCIAMIENTO', I.fin, 'financiamiento', I.flFin, '#3f6fa3') +
        (Math.abs(I.diferencia) >= 0.5
          ? '<div class="cuadre mal">El efectivo calculado (' + Fmt.moneda(I.final) + ') no coincide con el Balance General (' + Fmt.moneda(I.enBalance) + '). Diferencia: ' + Fmt.moneda(I.diferencia) + '. Posibles causas: balance general que no cuadra, ajustes extraordinarios no registrados, o cuentas clasificadas en un grupo incorrecto.</div>'
          : '<div class="cuadre ok">El efectivo final calculado coincide con el efectivo del Balance General.</div>') +
        '<div class="fl-interpretacion"><h3>Interpretacion del flujo de efectivo</h3>' +
          Flujo.interpretar(I.flOp, I.flInv, I.flFin, I.neta).map(l => '<p>' + l + '</p>').join('') +
        '</div>' +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g1"></canvas></div></div>' +
      '</div>';

    const sectMan =
      '<div id="sec-manual" style="display:none">' +
        '<div class="aviso">Escribe el flujo de cada actividad (las salidas van con signo negativo, por ejemplo −13000).</div>' +
        '<div class="barra-acciones" style="margin-top:14px">' +
          campo('fl-ini','Efectivo inicial (C$)', m.inicial) + campo('fl-op','Flujo de operacion (C$)', m.op) +
          campo('fl-inv','Flujo de inversion (C$)', m.inv)   + campo('fl-fin','Flujo de financiamiento (C$)', m.fin) +
        '</div>' +
        '<div class="barra-acciones"><button class="btn" id="fl-ejemplo">Cargar caso de clase</button><button class="btn sec peligro" id="fl-limpiar">Limpiar datos</button></div>' +
        '<div class="rejilla" id="fl-tarjetas"></div>' +
        '<div id="fl-interp" style="margin-top:14px"></div>' +
        '<div class="tarjeta" style="margin-top:14px"><h3>Flujos por actividad</h3><div class="grafico"><canvas id="fl-g2"></canvas></div></div>' +
      '</div>';

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="pestanas">' + tabs.map((t, i) =>
        '<button class="pest' + (i===0 ? ' activa' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'
      ).join('') + '</div>' + sectInd + sectMan;
    el.innerHTML = '';
    el.appendChild(raiz);

    const num = id => Fmt.aNum(raiz.querySelector(id).value);
    const refrescarManual = () => {
      const x = { inicial: num('#fl-ini'), op: num('#fl-op'), inv: num('#fl-inv'), fin: num('#fl-fin') };
      Datos.guardar('flujo_manual', x);
      const neta = x.op + x.inv + x.fin, final = x.inicial + neta;
      const t = (tt, v, n) => '<div class="tarjeta"><h3>' + tt + '</h3><div class="valor">' + Fmt.moneda(v) + '</div><div class="nota">' + n + '</div></div>';
      raiz.querySelector('#fl-tarjetas').innerHTML =
        t('Variacion neta', neta, 'Operacion + Inversion + Financiamiento') +
        t('Efectivo inicial', x.inicial, 'Dato de entrada') +
        t('Efectivo final', final, 'Efectivo inicial + Variacion neta');
      raiz.querySelector('#fl-interp').innerHTML =
        Flujo.htmlAlerta(x.op) +
        '<div class="fl-interpretacion"><h3>Interpretacion</h3>' +
          Flujo.interpretar(x.op, x.inv, x.fin, neta).map(l => '<p>' + l + '</p>').join('') +
        '</div>';
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
  }
};

Modulos.flujo = {
  titulo: 'Flujo de efectivo',
  subtitulo: 'Actividades de operacion, inversion y financiamiento',
  render(el) { Flujo.render(el); }
};