// Reglas generales para TODOS los gráficos del sistema (Chart.js).
// Objetivo: que cualquier persona, sepa o no de cuentas, entienda el gráfico con solo
// pasar el mouse cerca, sin tener que acertar justo sobre la barra o el punto.
(function () {
  if (typeof Chart === 'undefined') return;

  // Basta con acercar el mouse a la zona del dato; no hay que acertar exacto
  Chart.defaults.interaction = Object.assign({}, Chart.defaults.interaction, {
    mode: 'nearest', axis: 'x', intersect: false
  });

  // Ventanita de información más grande, legible y con esquinas redondeadas
  Chart.defaults.plugins = Chart.defaults.plugins || {};
  Chart.defaults.plugins.tooltip = Object.assign({}, Chart.defaults.plugins.tooltip, {
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    titleFont: { weight: '600', size: 13 },
    bodyFont: { size: 13 },
    displayColors: true
  });

  // Leyenda con un puntito del color, en vez de un cuadrito, para relacionar mejor
  Chart.defaults.plugins.legend = Object.assign({}, Chart.defaults.plugins.legend, {
    labels: Object.assign({}, Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels, {
      usePointStyle: true, boxWidth: 8, padding: 14
    })
  });

  // Puntos de las líneas más fáciles de "tocar" con el mouse
  Chart.defaults.elements = Chart.defaults.elements || {};
  Chart.defaults.elements.point = Object.assign({}, Chart.defaults.elements.point, { hoverRadius: 6, hitRadius: 12 });

  // Misma tipografía del sistema en los gráficos
  Chart.defaults.font = Object.assign({}, Chart.defaults.font, {
    family: "'DM Sans','Segoe UI',system-ui,-apple-system,Arial,sans-serif", size: 12
  });
})();