// Reglas generales para TODOS los gráficos del sistema (Chart.js).
// Objetivo: que cualquier persona, sepa o no de cuentas, entienda el gráfico SIN tener que
// pasar el mouse o tocar con el dedo (en el celular no hay mouse, y tocar para ver un dato
// interrumpe el scroll). Por eso los montos se muestran siempre pegados al dato, con el
// plugin chartjs-plugin-datalabels. Si esa librería no está cargada, el gráfico igual
// funciona, solo que sin los números pegados.
(function () {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.interaction = Object.assign({}, Chart.defaults.interaction, {
    mode: 'nearest', axis: 'x', intersect: false
  });

  Chart.defaults.plugins = Chart.defaults.plugins || {};
  Chart.defaults.plugins.tooltip = Object.assign({}, Chart.defaults.plugins.tooltip, {
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    titleFont: { weight: '600', size: 13 },
    bodyFont: { size: 13 },
    displayColors: true
  });

  Chart.defaults.plugins.legend = Object.assign({}, Chart.defaults.plugins.legend, {
    labels: Object.assign({}, Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels, {
      usePointStyle: true, boxWidth: 8, padding: 14
    })
  });

  Chart.defaults.elements = Chart.defaults.elements || {};
  Chart.defaults.elements.point = Object.assign({}, Chart.defaults.elements.point, { hoverRadius: 6, hitRadius: 12 });

  Chart.defaults.font = Object.assign({}, Chart.defaults.font, {
    family: "'DM Sans','Segoe UI',system-ui,-apple-system,Arial,sans-serif", size: 12
  });

  // Etiquetas con el monto pegadas a cada barra, punto o porción: no dependen del mouse ni
  // del dedo, así que también se ven en el celular. Solo se activan si la librería
  // chartjs-plugin-datalabels está cargada.
  if (typeof ChartDataLabels === 'undefined') return;
  Chart.register(ChartDataLabels);

  const colorTexto = (ctx) => {
    const tipo = ctx.chart.config.type;
    if (tipo === 'line') {
      const c = ctx.dataset.borderColor;
      return typeof c === 'string' ? c : '#2a2a2a';
    }
    return '#fff';
  };

  Chart.defaults.plugins.datalabels = {
    // Con muchas barras, puntos o porciones, la etiqueta estorba más de lo que ayuda:
    // se oculta sola si hay más de 8 datos en esa serie.
    display: (ctx) => (ctx.dataset.data || []).filter(v => v !== null && v !== undefined).length <= 8,
    color: colorTexto,
    font: { size: 11, weight: '600' },
    textStrokeColor: (ctx) => ctx.chart.config.type === 'line' ? '#fff' : undefined,
    textStrokeWidth: (ctx) => ctx.chart.config.type === 'line' ? 3 : 0,
    anchor: (ctx) => ctx.chart.config.type === 'line' ? 'end' : 'center',
    align: (ctx) => ctx.chart.config.type === 'line' ? 'top' : 'center',
    formatter: (value, ctx) => {
      if (value === null || value === undefined || value === '') return '';
      const tipo = ctx.chart.config.type;
      if (tipo === 'doughnut' || tipo === 'pie') {
        const total = (ctx.dataset.data || []).reduce((s, v) => s + (Number(v) || 0), 0);
        return total ? (typeof Fmt !== 'undefined' ? Fmt.pct(Number(value) / total) : '') : '';
      }
      return typeof Fmt !== 'undefined' ? Fmt.corto(value) : value;
    }
  };
})();