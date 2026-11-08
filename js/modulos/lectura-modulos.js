// Muestra la lectura financiera encima del Panel principal y de Flujo de efectivo.
// (Decora los módulos existentes: no cambia sus cálculos.)
(function () {
  const panelBase = Modulos.panel.render;
  Modulos.panel.render = function (el) {
    panelBase.call(this, el);
    const html = Lectura.html(Lectura.estados(Estados.leerCrudo(), Seleccion.ids()), 'Lectura financiera');
    el.insertAdjacentHTML('afterbegin', html);
  };

  const flujoBase = Modulos.flujo.render;
  Modulos.flujo.render = function (el) {
    flujoBase.call(this, el);
    const d = Estados.obtener(), r = Estados.calcular(d);
    const html = Lectura.html(Lectura.flujo(Flujo.indirecto(d, r)), 'Lectura del flujo de efectivo');
    el.insertAdjacentHTML('afterbegin', html);
  };
})();