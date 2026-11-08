// FASE 3C: lectura financiera y validaciones de Punto de equilibrio, Apalancamiento y Presupuestos.
// Agrega reglas a Lectura y decora los módulos (no cambia sus cálculos).
Lectura.equilibrio = function (d) {
  const items = [];
  const add = (nivel, texto) => items.push({ nivel, texto });
  if (!d.precio) { add('alerta', 'Escribe el precio de venta unitario para calcular el punto de equilibrio.'); return items; }
  const mc = d.precio - d.cv;
  if (mc <= 0) { add('riesgo', 'El precio no cubre el costo variable: cada venta deja pérdida y no existe punto de equilibrio.'); return items; }
  if (!d.cf) add('alerta', 'No hay costos fijos registrados: revisa si faltan.');
  const peU = d.cf / mc;
  if (!d.unidades) {
    add('alerta', 'Escribe las unidades vendidas para medir el margen de seguridad (equilibrio: ' + Fmt.num(peU, 2) + ' unidades).');
  } else {
    const ms = (d.unidades - peU) / d.unidades;
    if (ms < 0) add('riesgo', 'Las ventas están por debajo del equilibrio (' + Fmt.num(peU, 2) + ' unidades): hay pérdida.');
    else if (ms < 0.10) add('alerta', 'El margen de seguridad es ' + Fmt.pct(ms) + ' (menor al 10 %): una caída pequeña de ventas llevaría a pérdida.');
    else add('ok', 'El margen de seguridad es ' + Fmt.pct(ms) + ': las ventas están por encima del equilibrio.');
  }
  return items;
};

Lectura.apalancamiento = function (d) {
  const items = [];
  const add = (nivel, texto) => items.push({ nivel, texto });
  if (!d.precio || !d.u2) { add('alerta', 'Escribe precio y unidades para calcular los grados de apalancamiento.'); return items; }
  const a = Apalancamiento.periodo(d, d.u2);
  if (!isFinite(a.gao)) { add('alerta', 'No se puede calcular el GAO: la UAII es cero.'); return items; }
  if (a.upa < 0) add('riesgo', 'La utilidad por acción es negativa en el período 2 (' + Fmt.num(a.upa, 2) + '): los accionistas comunes pierden.');
  if (a.gao >= 3) add('alerta', 'GAO de ' + Fmt.num(a.gao, 2) + ': la UAII es muy sensible a las ventas (1 % en ventas cambia la UAII ' + Fmt.num(a.gao, 2) + ' %).');
  else add('ok', 'GAO de ' + Fmt.num(a.gao, 2) + ': sensibilidad operativa moderada.');
  if (isFinite(a.gaf)) {
    if (a.gaf >= 2) add('alerta', 'GAF de ' + Fmt.num(a.gaf, 2) + ': la deuda amplifica los cambios de la UAII en la utilidad por acción.');
    else add('ok', 'GAF de ' + Fmt.num(a.gaf, 2) + ': el apalancamiento financiero es moderado.');
  }
  return items;
};

Lectura.presupuestos = function (d) {
  const items = [];
  const add = (nivel, texto) => items.push({ nivel, texto });
  if (!d.precio) { add('alerta', 'Escribe el precio de venta y el costo unitario en Planeación y presupuestos.'); return items; }
  if (d.costoU >= d.precio) add('riesgo', 'El costo unitario (' + Fmt.moneda(d.costoU) + ') es igual o mayor que el precio: cada venta deja pérdida.');
  const op = Presupuestos.operativo(d), caja = Presupuestos.caja(d, op);
  op.forEach((o, i) => {
    if (o.un < 0) add('riesgo', 'Utilidad neta negativa en ' + d.meses[i] + ' (' + Fmt.moneda(o.un) + ').');
  });
  caja.forEach((c, i) => {
    if (c.final < 0) add('riesgo', 'En ' + d.meses[i] + ' el saldo de caja queda negativo (' + Fmt.moneda(c.final) + '): hay que conseguir financiamiento.');
    else if (c.financiar > 0) add('alerta', 'En ' + d.meses[i] + ' el saldo queda por debajo del mínimo de caja: faltan ' + Fmt.moneda(c.financiar) + '.');
  });
  if (!items.length) add('ok', 'El saldo de caja se mantiene por encima del mínimo en los tres meses.');
  return items;
};

(function () {
  const agregar = (el, items, titulo) => el.insertAdjacentHTML('afterbegin', Lectura.html(items, titulo));

  const eqBase = Modulos.equilibrio.render;
  Modulos.equilibrio.render = function (el) {
    eqBase.call(this, el);
    agregar(el, Lectura.equilibrio(Equilibrio.obtener()), 'Lectura del punto de equilibrio');
  };

  const apBase = Modulos.apalancamiento.render;
  Modulos.apalancamiento.render = function (el) {
    apBase.call(this, el);
    agregar(el, Lectura.apalancamiento(Apalancamiento.obtener()), 'Lectura del apalancamiento');
  };

  const prBase = Modulos.presupuestos.render;
  Modulos.presupuestos.render = function (el) {
    prBase.call(this, el);
    agregar(el, Lectura.presupuestos(Presupuestos.obtener()), 'Lectura del presupuesto');
  };
})();