// alertas.js — Centraliza las alertas financieras del sistema.
// dashboard.js lo llama con Alertas.items(); si no hay datos devuelve [].
const Alertas = {

  /* Genera la lista completa de alertas leyendo todos los módulos disponibles */
  items() {
    const lista = [];

    /* ── Alertas financieras (estados + análisis) ── */
    try {
      const ps  = Empresas.periodos || [];
      const ids = ps.map(p => p.id);
      if (ids.length) {
        const raw  = Estados.leerCrudo();
        const d    = Estados.compat(raw, ids);
        const r    = Estados.calcular(d);
        const par  = Seleccion.ids();
        const ib   = ids.indexOf(par[1]);
        const ia   = ids.indexOf(par[0]);
        if (ib >= 0) {
          const A      = r[ib];
          const ventas = Number((d.er.ventas || [])[ib]) || 0;
          const div    = (x, y) => (y ? x / y : null);

          if (A.utilidadNeta < 0)
            lista.push({ nivel: 'riesgo', texto: 'Utilidad neta negativa (' + Fmt.moneda(A.utilidadNeta) + '): la empresa pierde dinero en el período analizado.' });
          if (Math.abs(A.diferencia) > 0.5)
            lista.push({ nivel: 'riesgo', texto: 'El balance no cuadra (diferencia de ' + Fmt.moneda(A.diferencia) + '). Revisa las cuentas del período analizado.' });
          if (A.patrimonio < 0)
            lista.push({ nivel: 'riesgo', texto: 'Patrimonio negativo: las deudas superan el valor total de los activos.' });

          const rc = div(A.ac, A.pc);
          if (rc !== null && rc < 1)
            lista.push({ nivel: 'riesgo', texto: 'Razón corriente de ' + Fmt.num(rc, 2) + ': hay riesgo real de no poder pagar las deudas de corto plazo.' });
          else if (rc !== null && rc < 1.5)
            lista.push({ nivel: 'alerta', texto: 'Razón corriente de ' + Fmt.num(rc, 2) + ', por debajo de 1.5. Puede costar cubrir obligaciones corrientes.' });

          const endeu = div(A.totalPasivo, A.totalActivo);
          if (endeu !== null && endeu > 0.8)
            lista.push({ nivel: 'riesgo', texto: 'Endeudamiento del ' + Fmt.pct(endeu) + ': más del 80 % de los activos está financiado con deuda.' });
          else if (endeu !== null && endeu > 0.6)
            lista.push({ nivel: 'alerta', texto: 'Endeudamiento del ' + Fmt.pct(endeu) + ': supera el umbral de referencia del 60 %.' });

          const mn = div(A.utilidadNeta, ventas);
          if (mn !== null && mn < 0)
            lista.push({ nivel: 'riesgo', texto: 'Margen neto negativo (' + Fmt.pct(mn) + '): cada córdoba de ventas genera una pérdida.' });
        }
      }
    } catch(e) { /* Sin datos financieros disponibles */ }

    /* ── Alertas de presupuesto de caja ── */
    try {
      const d = Datos.leer('presupuestos', null);
      if (d) {
        const op = Presupuestos.operativo(d);
        const ca = Presupuestos.caja(d, op);
        if (ca.some(c => c.financiar > 0)) {
          const total = ca.reduce((s, c) => s + c.financiar, 0);
          lista.push({ nivel: 'alerta', texto: 'El presupuesto de caja proyecta necesidad de financiamiento externo: ' + Fmt.moneda(total) + '.' });
        }
        const ultimo = ca[ca.length - 1];
        if (ultimo && ultimo.final < (d.saldoMin || 0))
          lista.push({ nivel: 'alerta', texto: 'El saldo final de caja proyectado (' + Fmt.moneda(ultimo.final) + ') cae por debajo del mínimo requerido (' + Fmt.moneda(d.saldoMin) + ').' });
      }
    } catch(e) {}

    /* ── Alertas de punto de equilibrio ── */
    try {
      const d = Datos.leer('equilibrio', null);
      if (d && d.precio) {
        const c  = Equilibrio.calcular(d, d.meta || 0);
        if (isFinite(c.ms) && c.ms < 0)
          lista.push({ nivel: 'riesgo', texto: 'Las ventas actuales están por debajo del punto de equilibrio (margen de seguridad: ' + Fmt.pct(c.ms) + ').' });
        else if (isFinite(c.ms) && c.ms < 0.1)
          lista.push({ nivel: 'alerta', texto: 'Margen de seguridad muy estrecho (' + Fmt.pct(c.ms) + '): cualquier baja en ventas genera pérdida.' });
      }
    } catch(e) {}

    /* ── Alertas de inventario ── */
    try {
      const d = Datos.leer('inventario_v2', null);
      if (d && d.productos && d.productos.length) {
        const agotados = d.productos.filter(p => (p.ini + p.ent - p.sal) <= 0);
        const reponer  = d.productos.filter(p => { const f = p.ini + p.ent - p.sal; return f > 0 && f <= p.min; });
        if (agotados.length)
          lista.push({ nivel: 'riesgo', texto: agotados.length + ' producto(s) agotado(s): ' + agotados.map(p => p.n).join(', ') + '.' });
        else if (reponer.length)
          lista.push({ nivel: 'alerta', texto: reponer.length + ' producto(s) por debajo del stock mínimo: ' + reponer.map(p => p.n).join(', ') + '.' });
      }
    } catch(e) {}

    /* ── Sin alertas activas ── */
    if (!lista.length)
      lista.push({ nivel: 'ok', texto: 'Sin alertas activas. Los indicadores revisados están dentro de los rangos de referencia.' });

    return lista;
  }
};