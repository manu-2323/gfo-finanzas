// Módulo 10: Dashboard / Panel principal — versión mejorada
// Solo lee datos de los otros módulos; nunca los modifica.
const Dashboard = {
  grafs: [],
  C: null,
  ETQ: { ok: 'Favorable', alerta: 'Revisar', riesgo: 'Riesgo' },

  /* ── Iconos SVG inline 24×24, stroke, Feather-style ── */
  ico: {
    ventas:    '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    utilidad:  '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    liquidez:  '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
    deuda:     '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7a2 2 0 0 1 2-2h14v2M16 14h2"/>',
    caja:      '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    equilibrio:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    inventario:'<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    presupuesto:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    alerta:    '<path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    ok:        '<path d="M20 6L9 17l-5-5"/>',
    personal:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    tendencia: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    refresh:   '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  },
  _svg(key, w, h) {
    w = w || 20; h = h || 20;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" width="' + w + '" height="' + h + '">' +
      (Dashboard.ico[key] || '') + '</svg>';
  },

  /* ── Utilitarios ── */
  corto(v) {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    return s + (a >= 1e6 ? (a/1e6).toFixed(a>=1e7?0:1)+' M' : a >= 1e3 ? (a/1e3).toFixed(0)+' mil' : a.toFixed(0));
  },
  limpiar() {
    Dashboard.grafs.forEach(g => { try { g.destroy(); } catch(e){} });
    Dashboard.grafs = [];
  },
  nivel(v, ok, alerta, mayor) {
    if (v === null || v === undefined || !isFinite(v)) return null;
    return mayor ? (v>=ok?'ok':v>=alerta?'alerta':'riesgo') : (v<=ok?'ok':v<=alerta?'alerta':'riesgo');
  },
  fv(tipo, v) { return (v===null||v===undefined||!isFinite(v)) ? 'N/D' : Fmt[tipo](v); },
  monto(v) {
    if (v===null||v===undefined||!isFinite(v)) return 'N/D';
    return Math.abs(v)>=1e6 ? 'C$ '+Fmt.num(v/1e6,2)+' M' : Fmt.moneda(v);
  },

  /* ── Hero banner ── */
  hero(opts) {
    const decor =
      '<svg class="dash-hero-decor" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect x="20" y="100" width="22" height="60" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<rect x="55" y="70"  width="22" height="90" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<rect x="90" y="40"  width="22" height="120" rx="4" fill="rgba(255,255,255,.2)"/>' +
      '<rect x="125" y="85" width="22" height="75" rx="4" fill="rgba(255,255,255,.14)"/>' +
      '<polyline points="20,95 55,65 90,35 125,80 160,20" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="160" cy="20" r="5" fill="#fff"/></svg>';
    return '<div class="dash-hero dash-12"><div class="dash-hero-txt">' +
      (opts.ant ? '<small>' + esc(opts.ant) + '</small>' : '') +
      '<h2>' + esc(opts.titulo) + '</h2><p>' + opts.sub + '</p>' + (opts.extra||'') +
      (opts.boton ? '<a class="btn" href="#'+opts.boton.href+'">'+esc(opts.boton.texto)+'</a>' : '') +
      '</div>' + decor + '</div>';
  },

  /* ── Lectura de datos financieros ── */
  datos() {
    const ps = Empresas.periodos || [], ids = ps.map(p=>p.id);
    if (!ids.length) return null;
    const raw = Estados.leerCrudo(), d = Estados.compat(raw, ids), r = Estados.calcular(d);
    const par = Seleccion.ids();
    const D = { raw, d, r, ids, etq: ps.map(p=>p.etiqueta), par, ia: ids.indexOf(par[0]), ib: ids.indexOf(par[1]) };
    D.vacio  = r.map((x,i) => !x.totalActivo && !x.totalPasivo && !x.patrimonio && !x.utilidadNeta && !(Number(d.er.ventas[i])||0));
    D.hayDatos = D.vacio.some(v=>!v);
    return D;
  },

  calcular(D) {
    const {d, r, ia, ib} = D, A = r[ib], B = r[ia];
    const div = (x,y) => (y ? x/y : null);
    const n   = (g,k,p) => Number((d[g][k]||[])[p]) || 0;
    const ventas = n('er','ventas',ib), ventasB = n('er','ventas',ia);
    const prom = k => (ia===ib ? null : (A[k]+B[k])/2);
    const cam  = (nv,bv) => (ia===ib||!bv ? null : (nv-bv)/Math.abs(bv));
    return {
      A, B, ventas, ventasB, un: A.utilidadNeta, unB: B.utilidadNeta,
      cVentas: cam(ventas,ventasB), cUn: cam(A.utilidadNeta,B.utilidadNeta),
      rc: div(A.ac,A.pc), prueba: div(A.ac - n('bg','inventarios',ib), A.pc),
      endeu: div(A.totalPasivo,A.totalActivo), dp: div(A.totalPasivo,A.patrimonio),
      cob: div(A.uaii, n('er','intereses',ib)),
      mb: div(A.utilidadBruta,ventas), mn: div(A.utilidadNeta,ventas),
      roa: div(A.utilidadNeta,prom('totalActivo')), roe: div(A.utilidadNeta,prom('patrimonio'))
    };
  },

  /* ── Leer resumen del presupuesto maestro ── */
  datosPresupuesto() {
    try {
      const d  = Datos.leer('presupuestos', null);
      if (!d) return null;
      const op = Presupuestos.operativo(d);
      const ca = Presupuestos.caja(d, op);
      const totalVentas  = op.reduce((s,o)=>s+o.ventas, 0);
      const totalUn      = op.reduce((s,o)=>s+o.un, 0);
      const saldoFinal   = ca[ca.length-1].final;
      const saldoMin     = d.saldoMin || 0;
      const necesitaFin  = ca.some(c=>c.financiar>0);
      const totalFinanciar = ca.reduce((s,c)=>s+c.financiar, 0);
      return { meses: d.meses, totalVentas, totalUn, saldoFinal, saldoMin,
               necesitaFin, totalFinanciar, op, ca, escenario: d.escenario||'base' };
    } catch(e) { return null; }
  },

  /* ── Leer resumen del punto de equilibrio ── */
  datosEquilibrio() {
    try {
      const d = Datos.leer('equilibrio', null);
      if (!d || !d.precio) return null;
      const c = Equilibrio.calcular(d, d.meta||0);
      return { peU: c.peU, peC: c.peC, ms: c.ms, mcPct: c.mcPct,
               actual: d.unidades, precio: d.precio };
    } catch(e) { return null; }
  },

  /* ── Leer alertas de inventario ── */
  datosInventario() {
    try {
      const d = Datos.leer('inventario_v2', null);
      if (!d || !d.productos || !d.productos.length) return null;
      const productos = d.productos;
      const reponer = productos.filter(p => {
        const final = p.ini + p.ent - p.sal;
        return final <= p.min;
      });
      const agotados = productos.filter(p => (p.ini + p.ent - p.sal) <= 0);
      const totalValor = productos.reduce((s,p) => {
        const f = Math.max(0, p.ini + p.ent - p.sal);
        return s + f * p.costo;
      }, 0);
      return { total: productos.length, reponer: reponer.length,
               agotados: agotados.length, totalValor,
               listaPorReponer: reponer.slice(0,4) };
    } catch(e) { return null; }
  },

  /* ── KPIs financieros principales ── */
  tarjetasKpi(D, v) {
    const e   = D.etq[D.ia], N = Dashboard.nivel;
    const chip = c => c===null ? '' :
      '<span class="chip '+(c>=0?'sube':'baja')+'">'+(c>=0?'+':'')+Fmt.num(c*100,2)+' % vs '+esc(e)+'</span>';
    const sem  = nv => nv ? '<span class="chip '+nv+'">'+Dashboard.ETQ[nv]+'</span>' : '';
    const lista = [
      { ico:'ventas',     t:'Ventas',         v:Dashboard.monto(v.ventas), full:Fmt.moneda(v.ventas), nivel:v.cVentas===null?null:(v.cVentas<0?'alerta':'ok'), chip:chip(v.cVentas) },
      { ico:'utilidad',   t:'Utilidad neta',  v:Dashboard.monto(v.un),    full:Fmt.moneda(v.un),    nivel:v.un<0?'riesgo':(v.cUn===null?null:(v.cUn<0?'alerta':'ok')), chip:chip(v.cUn) },
      { ico:'liquidez',   t:'Razón corriente',v:Dashboard.fv('veces',v.rc),  nivel:N(v.rc,1.5,1,true)  },
      { ico:'deuda',      t:'Endeudamiento',  v:Dashboard.fv('pct',v.endeu), nivel:N(v.endeu,0.6,0.8,false) },
      { ico:'tendencia',  t:'Margen neto',    v:Dashboard.fv('pct',v.mn),    nivel:N(v.mn,0.05,0,true)  },
      { ico:'personal',   t:'ROE',            v:Dashboard.fv('pct',v.roe),   nivel:N(v.roe,0.10,0,true) }
    ];
    return lista.map(k =>
      '<div class="tarjeta dash-kpi dash-2 '+(k.nivel||'')+'">'+
        '<h3 style="display:flex;align-items:center;gap:5px">'+
          '<span style="opacity:.6">'+Dashboard._svg(k.ico,15,15)+'</span>'+k.t+
        '</h3>'+
        '<div class="valor"'+(k.full?' title="'+k.full+'"':'')+'>'+k.v+'</div>'+
        '<div class="dash-chips">'+(k.chip||sem(k.nivel))+'</div>'+
      '</div>'
    ).join('');
  },

  /* ── Bloque: Resumen presupuesto maestro ── */
  bloquePresupuesto(pb) {
    if (!pb) return (
      '<div class="tarjeta dash-6">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Dashboard._svg('presupuesto')+'Presupuesto maestro</h3>' +
        '<p class="nota-pie" style="margin-top:8px">Sin datos de presupuesto. Ve al módulo de Planeación para ingresarlos.</p>' +
        '<a href="#presupuestos" class="btn sec" style="margin-top:12px;display:inline-block;font-size:13px">Ir a Planeación</a>' +
      '</div>'
    );
    const fila = (n, v, cls) =>
      '<div class="dash-fila"><span>'+n+'</span><span><strong class="'+(cls||'')+'">'+v+'</strong></span></div>';
    const saldoOk = pb.saldoFinal >= pb.saldoMin;
    const escBadge = '<span class="chip" style="font-size:11px;text-transform:capitalize">'+pb.escenario+'</span>';
    return (
      '<div class="tarjeta dash-6">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+Dashboard._svg('presupuesto')+'Presupuesto maestro '+escBadge+'</h3>' +
        '<p class="nota-pie" style="margin-bottom:12px">'+esc(pb.meses.join(' · '))+'</p>' +
        fila('Ventas totales proyectadas', Fmt.moneda(pb.totalVentas)) +
        fila('Utilidad neta proyectada', Fmt.moneda(pb.totalUn), pb.totalUn<0?'' :'') +
        fila('Saldo final de caja', Fmt.moneda(pb.saldoFinal), saldoOk?'':'' ) +
        fila('Saldo mínimo requerido', Fmt.moneda(pb.saldoMin)) +
        (pb.necesitaFin ?
          '<div class="dash-item alerta" style="margin-top:10px;font-size:12px">'+
            Dashboard._svg('alerta',14,14)+' Necesita financiamiento externo: '+Fmt.moneda(pb.totalFinanciar)+
          '</div>'
         : '<div class="dash-item ok" style="margin-top:10px;font-size:12px">'+
            Dashboard._svg('ok',14,14)+' Caja proyectada sin necesidad de financiamiento externo'+
          '</div>') +
        '<a href="#presupuestos" class="btn sec" style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;font-size:12px">'+
          Dashboard._svg('refresh',14,14)+'Ver detalle</a>' +
      '</div>'
    );
  },

  /* ── Bloque: Punto de equilibrio ── */
  bloqueEquilibrio(eq) {
    if (!eq || !isFinite(eq.peU)) return (
      '<div class="tarjeta dash-3">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Dashboard._svg('equilibrio')+'Punto de equilibrio</h3>' +
        '<p class="nota-pie">Sin datos. Ve al módulo de Punto de equilibrio.</p>' +
        '<a href="#equilibrio" class="btn sec" style="margin-top:12px;display:inline-block;font-size:13px">Ir al módulo</a>' +
      '</div>'
    );
    const margenCls = eq.ms < 0 ? 'riesgo' : eq.ms < 0.15 ? 'alerta' : 'ok';
    const pctActual = isFinite(eq.peU) && eq.peU > 0 ? Math.min(eq.actual / eq.peU, 1.5) : 0;
    const barW      = Math.min(100, (pctActual / 1.5) * 100).toFixed(1);
    const barColor  = eq.actual >= eq.peU ? 'var(--ok)' : eq.actual >= eq.peU*0.8 ? 'var(--alerta)' : 'var(--malo)';
    return (
      '<div class="tarjeta dash-3">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Dashboard._svg('equilibrio')+'Punto de equilibrio</h3>' +
        '<div class="dash-fila"><span>PE en unidades</span><span><strong>'+Fmt.num(eq.peU,0)+' u.</strong></span></div>' +
        '<div class="dash-fila"><span>PE en córdobas</span><span><strong>'+Fmt.moneda(eq.peC)+'</strong></span></div>' +
        '<div class="dash-fila"><span>Margen de seguridad</span>'+
          '<span><strong><span class="chip '+margenCls+'">'+Fmt.pct(eq.ms)+'</span></strong></span></div>' +
        '<div class="dash-fila"><span>Margen de contribución</span><span><strong>'+Fmt.pct(eq.mcPct)+'</strong></span></div>' +
        '<div style="margin-top:12px">' +
          '<div style="font-size:11px;color:var(--suave);margin-bottom:4px">'+
            'Unidades actuales vs PE ('+Fmt.num(eq.actual,0)+' / '+Fmt.num(eq.peU,0)+')</div>' +
          '<div style="background:var(--arena-2);border-radius:6px;height:8px;overflow:hidden">' +
            '<div style="background:'+barColor+';height:100%;width:'+barW+'%;transition:width .5s ease;border-radius:6px"></div>' +
          '</div>' +
        '</div>' +
        '<a href="#equilibrio" class="btn sec" style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;font-size:12px">'+
          Dashboard._svg('equilibrio',14,14)+'Ver detalle</a>' +
      '</div>'
    );
  },

  /* ── Bloque: Inventario ── */
  bloqueInventario(inv) {
    if (!inv) return (
      '<div class="tarjeta dash-3">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Dashboard._svg('inventario')+'Inventario</h3>' +
        '<p class="nota-pie">Sin datos de inventario.</p>' +
        '<a href="#inventario" class="btn sec" style="margin-top:12px;display:inline-block;font-size:13px">Ir al módulo</a>' +
      '</div>'
    );
    const nivelCls = inv.agotados ? 'riesgo' : inv.reponer ? 'alerta' : 'ok';
    return (
      '<div class="tarjeta dash-3 dash-kpi '+nivelCls+'">' +
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Dashboard._svg('inventario')+'Inventario</h3>' +
        '<div class="dash-fila"><span>Valor total</span><span><strong>'+Dashboard.monto(inv.totalValor)+'</strong></span></div>' +
        '<div class="dash-fila"><span>Productos</span><span><strong>'+inv.total+'</strong></span></div>' +
        (inv.agotados ? '<div class="dash-item riesgo" style="margin-top:8px;font-size:12px;display:flex;align-items:center;gap:6px">'+
            Dashboard._svg('alerta',13,13)+' '+inv.agotados+' producto(s) agotado(s)</div>' : '') +
        (inv.reponer  ? '<div class="dash-item alerta" style="margin-top:8px;font-size:12px;display:flex;align-items:center;gap:6px">'+
            Dashboard._svg('alerta',13,13)+' '+inv.reponer+' producto(s) por reponer</div>' : '') +
        (!inv.agotados && !inv.reponer ? '<div class="dash-item ok" style="margin-top:8px;font-size:12px;display:flex;align-items:center;gap:6px">'+
            Dashboard._svg('ok',13,13)+' Todos los productos sobre stock mínimo</div>' : '') +
        (inv.listaPorReponer.length ?
          '<p style="font-size:11px;color:var(--suave);margin-top:8px">'+
            inv.listaPorReponer.map(p=>esc(p.n)).join(', ')+(inv.reponer>4?'…':'')+
          '</p>' : '') +
        '<a href="#inventario" class="btn sec" style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;font-size:12px">'+
          Dashboard._svg('caja',14,14)+'Ver inventario</a>' +
      '</div>'
    );
  },

  /* ── Bloque: Alertas ── */
  alertas(D, v, pb, eq, inv) {
    let items = [];
    try { if (typeof Alertas !== 'undefined') items = Alertas.items(); } catch(e) { items = []; }
    if (!items.length) {
      const A = v.A, U = [];
      if (A.utilidadNeta < 0)         U.push({ nivel:'riesgo', texto:'Utilidad neta negativa ('+Fmt.moneda(A.utilidadNeta)+'): la empresa pierde dinero en el período analizado.' });
      if (Math.abs(A.diferencia)>0.5) U.push({ nivel:'riesgo', texto:'El balance no cuadra: revisa las cuentas del período analizado.' });
      if (A.patrimonio < 0)           U.push({ nivel:'riesgo', texto:'Patrimonio negativo: las deudas superan lo que tiene la empresa.' });
      if (v.rc!==null && v.rc<1.5)    U.push({ nivel:'alerta', texto:'Razón corriente de '+Fmt.num(v.rc,2)+', por debajo de 1.5: puede costar pagar las deudas de corto plazo.' });
      if (v.endeu!==null && v.endeu>0.6) U.push({ nivel:'alerta', texto:'El '+Fmt.pct(v.endeu)+' de los activos está financiado con deuda (más del 60 %).' });
      items = U;
    }
    /* Alertas de caja */
    if (pb) {
      if (pb.necesitaFin) items.push({ nivel:'alerta', texto:'El presupuesto de caja proyecta necesidad de financiamiento: '+Fmt.moneda(pb.totalFinanciar)+'.' });
      if (pb.saldoFinal < pb.saldoMin) items.push({ nivel:'alerta', texto:'El saldo final de caja ('+Fmt.moneda(pb.saldoFinal)+') cae por debajo del mínimo requerido ('+Fmt.moneda(pb.saldoMin)+').' });
    }
    /* Alertas de inventario */
    if (inv) {
      if (inv.agotados) items.push({ nivel:'riesgo', texto:inv.agotados+' producto(s) agotado(s) en inventario.' });
      else if (inv.reponer) items.push({ nivel:'alerta', texto:inv.reponer+' producto(s) de inventario por debajo del stock mínimo.' });
    }
    /* Alertas de equilibrio */
    if (eq && isFinite(eq.ms) && eq.ms < 0) items.push({ nivel:'riesgo', texto:'Margen de seguridad negativo: las ventas actuales están por debajo del punto de equilibrio.' });

    const orden = { riesgo:0, alerta:1, ok:2 };
    const activos = items.filter(i=>i.nivel!=='ok').sort((a,b)=>orden[a.nivel]-orden[b.nivel]);
    if (!activos.length) return [{ nivel:'ok', texto:'Sin alertas activas: los indicadores revisados están dentro de los rangos de referencia.' }];
    return activos.length > 6
      ? activos.slice(0,5).concat([{ nivel:'alerta', texto:'Y '+(activos.length-5)+' alerta(s) más. Revisa los módulos para ver el detalle.' }])
      : activos;
  },

  /* ── Tabla de indicadores ── */
  indicadores(v) {
    const N = Dashboard.nivel, f = Dashboard.fv;
    const grupos = [
      ['Liquidez', [
        ['Razón corriente',   f('veces',v.rc),    N(v.rc,1.5,1,true)],
        ['Prueba ácida',      f('veces',v.prueba), N(v.prueba,1,0.7,true)]
      ]],
      ['Endeudamiento', [
        ['Razón de endeudamiento',  f('pct',v.endeu), N(v.endeu,0.6,0.8,false)],
        ['Deuda sobre patrimonio',  f('veces',v.dp),  N(v.dp,1.5,2.5,false)],
        ['Cobertura de intereses',  f('veces',v.cob), N(v.cob,3,1.5,true)]
      ]],
      ['Rentabilidad', [
        ['Margen bruto',  f('pct',v.mb),  N(v.mb,0.15,0.05,true)],
        ['Margen neto',   f('pct',v.mn),  N(v.mn,0.05,0,true)],
        ['ROA',           f('pct',v.roa), N(v.roa,0.05,0,true)],
        ['ROE',           f('pct',v.roe), N(v.roe,0.10,0,true)]
      ]]
    ];
    return grupos.map(g =>
      '<div class="dash-grupo">'+g[0]+'</div>' +
      g[1].map(x =>
        '<div class="dash-fila"><span>'+x[0]+'</span>'+
        '<span><strong>'+x[1]+'</strong><i class="dot '+(x[2]||'')+'"></i></span></div>'
      ).join('')
    ).join('');
  },

  lectura(D) {
    let items = [];
    try { items = Lectura.estados(D.raw, D.par); } catch(e) { items=[]; }
    return items.slice(0,5);
  },
  lista(items) {
    return items.map(i =>
      '<div class="dash-item '+(i.nivel||'ok')+'" style="display:flex;align-items:flex-start;gap:8px">'+
        '<span style="flex:none;margin-top:1px">'+Dashboard._svg(i.nivel==='ok'?'ok':'alerta',14,14)+'</span>'+
        '<span>'+esc(i.texto)+'</span>'+
      '</div>'
    ).join('');
  },

  accesos() {
    const ocultos = (Empresas.activa && typeof ocultosPara==='function') ? ocultosPara(Empresas.activa.sector) : [];
    return SECCIONES.map(s =>
      s.items.filter(i=>i.id!=='panel'&&!ocultos.includes(i.id)).map(i =>
        '<a class="dash-acceso" href="#'+i.id+'">'+icono(i.icono)+'<span>'+esc(i.nombre)+'</span></a>'
      ).join('')
    ).join('');
  },

  /* ── Gráficas ── */
  graficos(el, D, v, pb) {
    if (typeof Chart === 'undefined') return;
    const C = Dashboard.C || (Dashboard.C = Tema.paleta());
    const q = id => el.querySelector('#'+id);

    /* Gráfica de tendencia ventas + utilidad */
    if (q('dash-tend')) {
      const linea = (n, datos, c) => ({
        label:n, data: datos.map((x,i)=>D.vacio[i]?null:x),
        borderColor:c, backgroundColor:c, tension:.28,
        pointRadius:5, pointHoverRadius:7, spanGaps:false,
        fill:false
      });
      const tip = { callbacks:{ label: x=>(x.dataset.label?x.dataset.label+': ':'')+Fmt.moneda(x.raw) } };
      Dashboard.grafs.push(new Chart(q('dash-tend'), {
        type:'line',
        data:{ labels:D.etq, datasets:[
          linea('Ventas', D.d.er.ventas.map(Number), C.marino),
          linea('Utilidad neta', D.r.map(x=>x.utilidadNeta), C.ok)
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom' }, tooltip:tip },
          scales:{ y:{ ticks:{ callback: x=>Dashboard.corto(x) } } }
        }
      }));
    }

    /* Gráfica estructura de financiamiento */
    if (q('dash-estr')) {
      const partes = [v.A.pc, v.A.pnc, v.A.patrimonio].map(x=>Math.max(0,x));
      if (!partes.some(x=>x>0)) {
        q('dash-estr').parentNode.innerHTML = '<p class="nota-pie">Sin datos de balance en este período.</p>';
      } else {
        Dashboard.grafs.push(new Chart(q('dash-estr'), {
          type:'doughnut',
          data:{ labels:['Pasivo corriente','Pasivo no corriente','Patrimonio'],
            datasets:[{ data:partes, backgroundColor:[C.malo, C.claro, C.marino], borderWidth:2 }] },
          options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
            plugins:{ legend:{ position:'bottom' },
              tooltip:{ callbacks:{ label: x=>{
                const tot=x.dataset.data.reduce((s,v)=>s+v,0);
                return x.label+': '+Fmt.moneda(x.raw)+(tot?' ('+Fmt.pct(x.raw/tot)+')':'');
              }}}
            }
          }
        }));
      }
    }

    /* Gráfica caja por mes */
    if (q('dash-caja') && pb && pb.ca) {
      Dashboard.grafs.push(new Chart(q('dash-caja'), {
        type:'bar',
        data:{
          labels: pb.meses,
          datasets:[
            { label:'Cobros',  data:pb.ca.map(c=>c.cobros), backgroundColor:'rgba(15,92,77,.7)',  borderRadius:4 },
            { label:'Pagos',   data:pb.ca.map(c=>c.pagos),  backgroundColor:'rgba(179,38,30,.5)', borderRadius:4 },
            { label:'Saldo final', data:pb.ca.map(c=>c.final),
              type:'line', borderColor:C.marino, backgroundColor:'transparent',
              tension:.3, pointRadius:5, fill:false }
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom' },
            tooltip:{ callbacks:{ label: x=>' '+x.dataset.label+': '+Fmt.moneda(x.raw) } } },
          scales:{ y:{ ticks:{ callback: x=>Dashboard.corto(x) } } }
        }
      }));
    }
  },

  /* ── RENDER PRINCIPAL ── */
  render(el) {
    Dashboard.limpiar();
    Dashboard.C = Tema.paleta();
    const emp = Empresas.activa || {}, D = Dashboard.datos();
    const pb  = Dashboard.datosPresupuesto();
    const eq  = Dashboard.datosEquilibrio();
    const inv = Dashboard.datosInventario();
    const accesos = '<div class="tarjeta dash-12"><h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
      Dashboard._svg('refresh')+'Accesos rápidos</h3>'+
      '<div class="dash-accesos">'+Dashboard.accesos()+'</div></div>';

    /* Sin períodos */
    if (!D || D.ia<0 || D.ib<0) {
      el.innerHTML = '<div class="dash dash-entrada">'+
        Dashboard.hero({ ant: emp.nombre||'Tu empresa', titulo:'Todavía no hay períodos',
          sub:'Crea tus períodos para empezar a registrar los estados financieros.',
          boton:{ href:'periodos', texto:'Ir a Períodos' } }) +
        accesos + '</div>';
      return;
    }

    const base = esc(D.etq[D.ia]), act = esc(D.etq[D.ib]);
    const sub  = D.ia===D.ib ? 'Período '+act : 'Comparando '+base+' (base) con '+act+' (analizado)';
    const chips = '<div class="dash-chips"><span class="chip">C$</span> <span class="chip">'+D.ids.length+' período(s)</span></div>';

    /* Sin datos */
    if (!D.hayDatos) {
      el.innerHTML = '<div class="dash dash-entrada">'+
        Dashboard.hero({ ant:emp.sector||'', titulo:'Registra tus primeros datos',
          sub:'Escribe los montos en Estados financieros y vuelve aquí para ver tus indicadores.',
          boton:{ href:'estados', texto:'Ir a Estados financieros' } }) +
        /* Muestra igual los bloques de presupuesto, equilibrio e inventario si hay datos */
        '<div class="dash dash-entrada" style="grid-column:span 12;padding:0;border:none;background:none;gap:16px">'+
          Dashboard.bloquePresupuesto(pb) +
          Dashboard.bloqueEquilibrio(eq) +
          Dashboard.bloqueInventario(inv) +
        '</div>' +
        accesos + '</div>';
      return;
    }

    /* Período analizado vacío */
    if (D.vacio[D.ib]) {
      const conDatos = D.etq.filter((e,i)=>!D.vacio[i]).map(esc).join(', ');
      el.innerHTML = '<div class="dash dash-entrada">'+
        Dashboard.hero({ ant:emp.sector||'', titulo:'El período analizado está vacío',
          sub:'El período <strong>'+act+'</strong> no tiene montos todavía. Escríbelos o elige uno con datos ('+conDatos+').',
          boton:{ href:'estados', texto:'Ir a Estados financieros' } }) +
        accesos + '</div>';
      return;
    }

    const v = Dashboard.calcular(D);

    el.innerHTML =
      '<div class="dash dash-entrada">' +

      /* Hero */
      Dashboard.hero({ ant:emp.sector||'Empresa', titulo:'Hola, '+(emp.nombre||'tu empresa'),
        sub:sub, extra:chips }) +

      /* KPIs financieros (6 × dash-2) */
      Dashboard.tarjetasKpi(D, v) +

      /* Fila: tendencia (8) + alertas combinadas (4) */
      '<div class="tarjeta dash-8">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+Dashboard._svg('tendencia')+'Tendencia por período</h3>'+
        '<p class="nota-pie">Ventas y utilidad neta de cada período en córdobas.</p>'+
        '<div class="dash-graf"><canvas id="dash-tend"></canvas></div>'+
      '</div>'+
      '<div class="tarjeta dash-4">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+Dashboard._svg('alerta')+'Alertas del sistema</h3>'+
        '<div class="dash-lista">'+Dashboard.lista(Dashboard.alertas(D,v,pb,eq,inv))+'</div>'+
      '</div>'+

      /* Fila: estructura (4) + indicadores (4) + lectura financiera (4) */
      '<div class="tarjeta dash-4">'+
        '<h3 style="margin-bottom:4px">Estructura de financiamiento ('+act+')</h3>'+
        '<p class="nota-pie">Pasivo corriente, no corriente y patrimonio.</p>'+
        '<div class="dash-graf"><canvas id="dash-estr"></canvas></div>'+
      '</div>'+
      '<div class="tarjeta dash-4">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+Dashboard._svg('liquidez')+'Indicadores clave ('+act+')</h3>'+
        Dashboard.indicadores(v)+
        '<p class="nota-pie" style="margin-top:8px">Semáforo con rangos de referencia generales.</p>'+
      '</div>'+
      '<div class="tarjeta dash-4">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+Dashboard._svg('tendencia')+'Lectura financiera</h3>'+
        '<div class="dash-lista">'+Dashboard.lista(Dashboard.lectura(D))+'</div>'+
      '</div>'+

      /* Fila: Presupuesto (6) + caja graf (6) */
      Dashboard.bloquePresupuesto(pb) +
      '<div class="tarjeta dash-6">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+Dashboard._svg('caja')+'Flujo de caja proyectado</h3>'+
        (pb ?
          '<p class="nota-pie" style="margin-bottom:6px">Cobros, pagos y saldo final por mes.</p>'+
          '<div class="dash-graf"><canvas id="dash-caja"></canvas></div>'
        : '<p class="nota-pie" style="margin-top:8px">Sin datos de presupuesto de caja.</p>') +
      '</div>'+

      /* Fila: Equilibrio (3) + Inventario (3) + espacio (6) */
      Dashboard.bloqueEquilibrio(eq) +
      Dashboard.bloqueInventario(inv) +

      /* Accesos rápidos */
      accesos +
      '</div>';

    Dashboard.graficos(el, D, v, pb);
  }
};

/* Registrar en el sistema */
Modulos.panel.subtitulo = 'Indicadores clave, presupuesto, equilibrio, inventario y alertas';
Modulos.panel.render = function(el) {
  try { Dashboard.render(el); }
  catch(e) { console.error(e); el.innerHTML = '<div class="aviso">No se pudo dibujar el panel: '+esc(e.message)+'</div>'; }
};