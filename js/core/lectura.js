// Lectura financiera automática: interpreta los resultados y revisa validaciones.
// Niveles: 'ok' (verde), 'alerta' (ámbar), 'riesgo' (rojo).
const Lectura = {
  // Reglas sobre el período a analizar (el segundo del par) y su comparación con la base
  estados(raw, ids) {
    const items = [];
    const add = (nivel, texto) => items.push({ nivel, texto });
    if (!ids[0] && !ids[1]) { add('alerta', 'Esta empresa no tiene períodos. Agrégalos en el módulo Períodos.'); return items; }

    const d = Estados.compat(raw, ids), r = Estados.calcular(d);
    const b = r[0], a = r[1], A = d.anios;
    const f = v => Fmt.num(v, 2);

    // Validaciones: datos vacíos, balance que no cuadra y cuentas base faltantes
    const pers = ids[0] === ids[1] ? [1] : [0, 1];
    pers.forEach(p => {
      if (!r[p].totalActivo && !r[p].totalPP && !d.er.ventas[p]) {
        add('alerta', 'No hay montos en el período ' + A[p] + '. Escríbelos en Estados financieros.');
      } else if (Math.abs(r[p].diferencia) >= 0.5) {
        add('riesgo', 'El balance del período ' + A[p] + ' no cuadra (diferencia ' + Fmt.moneda(r[p].diferencia) + ').');
      }
    });
    if (typeof Configuracion !== 'undefined') Configuracion.avisos(raw).forEach(t => add('alerta', t));

    // Liquidez
    if (a.pc > 0) {
      const rc = a.ac / a.pc;
      if (rc < 1) add('riesgo', 'La razón corriente es ' + f(rc) + ': los pasivos corrientes superan a los activos corrientes.');
      else if (rc < 1.5) add('alerta', 'La razón corriente es ' + f(rc) + ', por debajo de 1.5: el margen para pagar deudas de corto plazo es poco.');
      else add('ok', 'La razón corriente es ' + f(rc) + ': los activos corrientes cubren bien las deudas de corto plazo.');
    }
    if (a.ac - a.pc < 0) add('alerta', 'El capital de trabajo neto es negativo (' + Fmt.moneda(a.ac - a.pc) + ').');

    // Endeudamiento
    if (a.totalActivo > 0) {
      const endeu = a.totalPasivo / a.totalActivo;
      if (endeu > 0.8) add('riesgo', 'El ' + Fmt.pct(endeu) + ' de los activos está financiado con deuda: nivel de riesgo alto.');
      else if (endeu > 0.6) add('alerta', 'El ' + Fmt.pct(endeu) + ' de los activos está financiado con deuda: vigila la carga financiera.');
      else add('ok', 'El ' + Fmt.pct(endeu) + ' de los activos está financiado con deuda: nivel controlado.');
    }

    // Rentabilidad
    const ventas = Number(d.er.ventas[1]) || 0;
    if (ventas > 0) {
      const margen = a.utilidadNeta / ventas;
      if (a.utilidadNeta < 0) add('riesgo', 'Pérdida neta de ' + Fmt.moneda(a.utilidadNeta) + ' en el período analizado.');
      else if (margen < 0.05) add('alerta', 'El margen de utilidad neta es ' + Fmt.pct(margen) + ': cada venta deja poco.');
      else add('ok', 'El margen de utilidad neta es ' + Fmt.pct(margen) + '.');
    }

    // Cobertura de intereses
    const intereses = Number(d.er.intereses[1]) || 0;
    if (intereses > 0) {
      const cob = a.uaii / intereses;
      if (a.uaii < 0) add('riesgo', 'La utilidad operativa es negativa: no cubre los intereses de ' + Fmt.moneda(intereses) + '.');
      else if (cob < 2) add('alerta', 'La utilidad operativa cubre ' + f(cob) + ' veces los intereses (se recomienda al menos 2).');
      else add('ok', 'La utilidad operativa cubre ' + f(cob) + ' veces los intereses.');
    }

    // Crecimiento de ventas entre la base y el período analizado
    const ventasBase = Number(d.er.ventas[0]) || 0;
    if (ventasBase > 0 && ids[0] !== ids[1]) {
      const g = ventas / ventasBase - 1;
      if (g < 0) add('alerta', 'Las ventas bajaron ' + Fmt.pct(-g) + ' frente al período base.');
      else add('ok', 'Las ventas crecieron ' + Fmt.pct(g) + ' frente al período base.');
    }
    return items;
  },

  // Lectura del flujo de efectivo indirecto (salida de Flujo.indirecto)
  flujo(I) {
    const items = [];
    const add = (nivel, texto) => items.push({ nivel, texto });
    if (I.flOp < 0) add('riesgo', 'El flujo de operación es negativo (' + Fmt.moneda(I.flOp) + '): la operación no genera efectivo.');
    if (I.neta < 0) add('alerta', 'La variación neta de efectivo es negativa (' + Fmt.moneda(I.neta) + ').');
    if (Math.abs(I.diferencia) >= 0.5) add('alerta', 'El efectivo calculado no coincide con el Balance General (diferencia ' + Fmt.moneda(I.diferencia) + ').');
    if (!items.length) add('ok', 'El flujo de operación es positivo (' + Fmt.moneda(I.flOp) + ') y el flujo cuadra con el balance.');
    return items;
  },

  // Bloque HTML con la lectura
  html(items, titulo) {
    if (!items || !items.length) return '';
    const clase = { ok: 'ok', alerta: 'alerta', riesgo: 'mal' };
    return '<div class="lectura"><h2 class="titulo-seccion">' + (titulo || 'Lectura financiera') + '</h2>' +
      items.map(i => '<div class="cuadre ' + clase[i.nivel] + '">' + esc(i.texto) + '</div>').join('') + '</div>';
  }
};