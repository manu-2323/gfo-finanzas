// Módulo: Fórmulas utilizadas (referencia para la defensa).
// Cada fila: [concepto, fórmula, unidad, módulo donde se calcula]
const Formulas = {
  grupos: [
    { titulo: 'Análisis horizontal y vertical', filas: [
      ['Variación en C$', 'Año 2 − Año 1', 'C$', 'Análisis financiero'],
      ['Variación en %', '(Año 2 − Año 1) ÷ |Año 1|', '%', 'Análisis financiero'],
      ['Análisis vertical del Estado de Resultados', 'Cuenta ÷ Ventas', '%', 'Análisis financiero'],
      ['Análisis vertical del Balance General', 'Cuenta ÷ Activo total', '%', 'Análisis financiero']
    ]},
    { titulo: 'Razones de liquidez (saldos de cierre)', filas: [
      ['Capital de trabajo neto (CTN)', 'Activo corriente − Pasivo corriente', 'C$', 'Análisis financiero'],
      ['Razón corriente', 'Activo corriente ÷ Pasivo corriente', 'veces', 'Análisis financiero'],
      ['Prueba ácida', '(Activo corriente − Inventarios) ÷ Pasivo corriente', 'veces', 'Análisis financiero']
    ]},
    { titulo: 'Razones de actividad (saldos promedio, 365 días)', filas: [
      ['Saldo promedio', '(Saldo inicial + Saldo final) ÷ 2', 'C$', 'Análisis financiero'],
      ['Rotación de inventarios', 'Costo de ventas ÷ Inventario promedio', 'veces', 'Análisis financiero'],
      ['Edad promedio del inventario', '365 ÷ Rotación de inventarios', 'días', 'Análisis financiero'],
      ['Período promedio de cobro (PPC)', 'CxC promedio × 365 ÷ Ventas a crédito', 'días', 'Análisis financiero'],
      ['Período promedio de pago (PPP)', 'CxP promedio × 365 ÷ Costo de ventas', 'días', 'Análisis financiero'],
      ['Ciclo de conversión del efectivo', 'Edad de inventario + PPC − PPP', 'días', 'Análisis financiero'],
      ['Rotación de activos fijos', 'Ventas ÷ Activos fijos promedio', 'veces', 'Análisis financiero'],
      ['Rotación de activos totales', 'Ventas ÷ Activo total promedio', 'veces', 'Análisis financiero']
    ]},
    { titulo: 'Razones de endeudamiento', filas: [
      ['Razón de endeudamiento', 'Pasivo total ÷ Activo total', '%', 'Análisis financiero'],
      ['Deuda sobre patrimonio', 'Pasivo total ÷ Patrimonio', 'veces', 'Análisis financiero'],
      ['Cobertura de intereses', 'UAII ÷ Gastos por intereses', 'veces', 'Análisis financiero']
    ]},
    { titulo: 'Razones de rentabilidad', filas: [
      ['Margen de utilidad bruta', 'Utilidad bruta ÷ Ventas', '%', 'Análisis financiero'],
      ['Margen de utilidad operativa', 'UAII ÷ Ventas', '%', 'Análisis financiero'],
      ['Margen de utilidad neta', 'Utilidad neta ÷ Ventas', '%', 'Análisis financiero'],
      ['ROA (rendimiento sobre activos)', 'Utilidad neta ÷ Activo total promedio', '%', 'Análisis financiero'],
      ['ROE (rendimiento sobre patrimonio)', 'Utilidad neta ÷ Patrimonio promedio', '%', 'Análisis financiero']
    ]},
    { titulo: 'Sistema DuPont', filas: [
      ['ROE por DuPont', 'ROE = (Utilidad neta ÷ Ventas) × (Ventas ÷ Activo prom.) × (Activo prom. ÷ Patrimonio prom.)', '%', 'Análisis financiero'],
      ['Multiplicador de capital', 'Activo promedio ÷ Patrimonio promedio', 'veces', 'Análisis financiero']
    ]},
    { titulo: 'Punto de equilibrio y C-V-U', filas: [
      ['Margen de contribución unitario', 'Precio − Costo variable unitario', 'C$', 'Punto de equilibrio'],
      ['Margen de contribución %', 'Margen de contribución unitario ÷ Precio', '%', 'Punto de equilibrio'],
      ['Punto de equilibrio en unidades', 'Costos fijos ÷ (Precio − Costo variable)', 'unidades', 'Punto de equilibrio'],
      ['Punto de equilibrio en C$', 'Costos fijos ÷ Margen de contribución %', 'C$', 'Punto de equilibrio'],
      ['Margen de seguridad', '(Unidades vendidas − PE en unidades) ÷ Unidades vendidas', '%', 'Punto de equilibrio'],
      ['Unidades para una utilidad deseada', '(Costos fijos + Utilidad deseada) ÷ (Precio − Costo variable)', 'unidades', 'Punto de equilibrio']
    ]},
    { titulo: 'Apalancamiento', filas: [
      ['Grado de apalancamiento operativo (GAO)', 'Margen de contribución ÷ UAII (o %Δ UAII ÷ %Δ Ventas)', 'veces', 'Apalancamiento'],
      ['Grado de apalancamiento financiero (GAF)', 'UAII ÷ (UAII − Intereses − DAP ÷ (1 − T)) (o %Δ UPA ÷ %Δ UAII)', 'veces', 'Apalancamiento'],
      ['Grado de apalancamiento total (GAT)', 'GAO × GAF (o %Δ UPA ÷ %Δ Ventas)', 'veces', 'Apalancamiento'],
      ['Utilidad por acción (UPA)', '(Utilidad neta − Dividendos preferentes) ÷ Acciones comunes', 'C$', 'Apalancamiento']
    ]},
    { titulo: 'Flujo de efectivo (método indirecto)', filas: [
      ['Flujo de operación', 'Utilidad neta + Depreciación ± Cambios en el capital de trabajo', 'C$', 'Flujo de efectivo'],
      ['Flujo de inversión', '−(Variación de activos fijos netos + Depreciación)', 'C$', 'Flujo de efectivo'],
      ['Flujo de financiamiento', 'Nueva deuda + Aportes − Pagos de deuda − Dividendos', 'C$', 'Flujo de efectivo'],
      ['Variación neta de efectivo', 'Operación + Inversión + Financiamiento', 'C$', 'Flujo de efectivo'],
      ['Saldo final de efectivo', 'Efectivo inicial + Variación neta', 'C$', 'Flujo de efectivo']
    ]},
    { titulo: 'Presupuestos operativos', filas: [
      ['Compras en unidades', 'Ventas + Inventario final deseado − Inventario inicial', 'unidades', 'Planeación y presupuestos'],
      ['Compras en C$', 'Compras en unidades × Costo unitario', 'C$', 'Planeación y presupuestos'],
      ['Costo de ventas', 'Inventario inicial + Compras − Inventario final', 'C$', 'Planeación y presupuestos'],
      ['Utilidad antes de intereses (UAII) presupuestada', 'Utilidad bruta − Gastos de operación', 'C$', 'Planeación y presupuestos']
    ]},
    { titulo: 'Presupuesto de caja', filas: [
      ['Cobros del mes', 'Ventas de contado + 1 mes de crédito + 2 meses de crédito', 'C$', 'Planeación y presupuestos'],
      ['Pagos del mes', 'Compras pagadas + Gastos en efectivo + Intereses + Impuestos + Otros pagos', 'C$', 'Planeación y presupuestos'],
      ['Gastos en efectivo', 'Gastos de operación − Depreciación (la depreciación no es salida de caja)', 'C$', 'Planeación y presupuestos'],
      ['Saldo final de caja', 'Saldo inicial + Cobros − Pagos', 'C$', 'Planeación y presupuestos'],
      ['Excedente o faltante', 'Saldo final − Saldo mínimo de caja', 'C$', 'Planeación y presupuestos']
    ]},
    { titulo: 'Proforma (método crítico)', filas: [
      ['Ventas proyectadas', 'Ventas del año base × (1 + Crecimiento %)', 'C$', 'Proforma y reporte'],
      ['Costo de ventas proyectado', 'Ventas proyectadas × Costo de ventas %', 'C$', 'Proforma y reporte'],
      ['UAII proyectada', 'Utilidad bruta − Gastos de venta − Gastos de administración − Depreciación', 'C$', 'Proforma y reporte'],
      ['Utilidad neta proyectada', 'UAI − ISR (ISR = UAI × tasa, si UAI > 0)', 'C$', 'Proforma y reporte'],
      ['Financiamiento externo requerido', 'Total activo − (Total pasivo + Patrimonio)', 'C$', 'Proforma y reporte']
    ]},
    { titulo: 'Presupuesto personal', filas: [
      ['Saldo disponible', 'Total de ingresos − Total de gastos', 'C$', 'Presupuesto personal'],
      ['Capacidad de ahorro', 'Saldo disponible ÷ Total de ingresos', '%', 'Presupuesto personal'],
      ['Meta de ahorro', 'Total de ingresos × Meta %', 'C$', 'Presupuesto personal']
    ]},
    { titulo: 'Control de inventario', filas: [
      ['Existencia final', 'Existencia inicial + Entradas − Salidas', 'unidades', 'Control de inventario'],
      ['Valor del inventario', 'Existencia final × Costo unitario', 'C$', 'Control de inventario'],
      ['Alerta de reposición', 'Si existencia final ≤ Stock mínimo, se marca "Reponer"', '—', 'Control de inventario']
    ]}
  ],

  tabla() {
    let html = '<div class="tabla-scroll"><table class="tabla-datos" id="fo-tabla">' +
      '<tr><th>Concepto</th><th>Fórmula</th><th>Unidad</th><th>Módulo donde se calcula</th></tr>';
    Formulas.grupos.forEach(g => {
      html += '<tr class="sub"><td colspan="4">' + g.titulo + '</td></tr>';
      g.filas.forEach(f => {
        html += '<tr class="fila-f"><td>' + f[0] + '</td><td class="formula" style="text-align:left">' + f[1] +
          '</td><td>' + f[2] + '</td><td class="formula" style="text-align:left">' + f[3] + '</td></tr>';
      });
    });
    return html + '</table></div>';
  },

  render(el) {
    el.innerHTML =
      '<div class="aviso">Lista de todas las fórmulas que usa el sistema, con el módulo donde se calculan. ' +
      'Úsala como guía para la defensa: explica datos de entrada, fórmula, resultado e interpretación.</div>' +
      '<div class="tarjeta" style="margin-top:16px">' +
        '<label class="campo" style="display:block;margin-bottom:12px">Buscar fórmula' +
        '<input type="text" id="fo-buscar" placeholder="Ej.: ROE, punto de equilibrio, inventario"></label>' +
        Formulas.tabla() +
        '<p class="nota-pie">Criterios generales: razones de actividad con saldos promedio y 365 días; razones de liquidez con saldos de cierre; ' +
        'se conservan todos los decimales y solo se redondea el resultado final.</p>' +
      '</div>';
    el.querySelector('#fo-buscar').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      el.querySelectorAll('.fila-f').forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
};

Modulos.formulas = {
  titulo: 'Fórmulas utilizadas',
  subtitulo: 'Referencia de todas las fórmulas del sistema y el módulo donde se calculan',
  render(el) { Formulas.render(el); }
};