// Módulo 6: Planeación y presupuestos maestro — versión mejorada
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const Presupuestos = {
  grafs: [],
  _min: 0,

  ejemplo() {
    return {
      meses: ['Julio','Agosto','Septiembre'],
      precio: 12, costoU: 7,
      unidades: [6000,7500,9000], unidadesSig: 10000,
      polInv: 20, invIni: 1500, isr: 30,
      cats: [
        { nombre:'Sueldos y salarios', montos:[10000,10000,10000], depre:[0,0,0] },
        { nombre:'Alquiler',           montos:[3000,3000,3000],    depre:[0,0,0] },
        { nombre:'Servicios públicos', montos:[2000,2500,3000],    depre:[0,0,0] },
        { nombre:'Depreciación',       montos:[1000,1000,1000],    depre:[1000,1000,1000] },
        { nombre:'Otros gastos',       montos:[4000,4000,4000],    depre:[0,0,0] }
      ],
      intereses: [0,0,0],
      cobroContado:50, cobro1:30, cobro2:20,
      ventasPrev:[60000,60000],
      pagoContado:50, pago1:50,
      comprasPrev:40000,
      otros:[0,0,0], saldoIni:10000, saldoMin:8000,
      escenario:'base',
      escenarios:{
        base:      { factorUnidades:1.00, factorPrecio:1.00 },
        optimista: { factorUnidades:1.15, factorPrecio:1.05 },
        pesimista: { factorUnidades:0.85, factorPrecio:0.95 }
      },
      reales:{ ventas:[0,0,0], costoVentas:[0,0,0], gastosTotales:[0,0,0], utilidadNeta:[0,0,0] }
    };
  },

  vacio() {
    return {
      meses:['Mes 1','Mes 2','Mes 3'], precio:0, costoU:0,
      unidades:[0,0,0], unidadesSig:0, polInv:0, invIni:0, isr:0,
      cats:[
        { nombre:'Sueldos y salarios', montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Alquiler',           montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Servicios públicos', montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Depreciación',       montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Otros gastos',       montos:[0,0,0], depre:[0,0,0] }
      ],
      intereses:[0,0,0],
      cobroContado:0, cobro1:0, cobro2:0, ventasPrev:[0,0],
      pagoContado:0, pago1:0, comprasPrev:0,
      otros:[0,0,0], saldoIni:0, saldoMin:0,
      escenario:'base',
      escenarios:{
        base:      { factorUnidades:1.00, factorPrecio:1.00 },
        optimista: { factorUnidades:1.15, factorPrecio:1.05 },
        pesimista: { factorUnidades:0.85, factorPrecio:0.95 }
      },
      reales:{ ventas:[0,0,0], costoVentas:[0,0,0], gastosTotales:[0,0,0], utilidadNeta:[0,0,0] }
    };
  },

  obtener() { return Datos.leer('presupuestos', Presupuestos.ejemplo()); },

  aplicarEscenario(d) {
    const e = ((d.escenarios||{})[d.escenario]) || { factorUnidades:1, factorPrecio:1 };
    return Object.assign({}, d, {
      precio:      d.precio * e.factorPrecio,
      unidades:    d.unidades.map(u => Math.round(u * e.factorUnidades)),
      unidadesSig: Math.round(d.unidadesSig * e.factorUnidades)
    });
  },

  sumarCats(cats, mes) {
    let g=0, dep=0;
    (cats||[]).forEach(c=>{ g += (c.montos[mes]||0); dep += (c.depre[mes]||0); });
    return { gastos:g, depre:dep };
  },

  operativo(d) {
    const da = Presupuestos.aplicarEscenario(d);
    const res = []; let invIni = da.invIni;
    for (let i=0; i<3; i++) {
      const u        = da.unidades[i];
      const sig      = i<2 ? da.unidades[i+1] : da.unidadesSig;
      const invFin   = sig * da.polInv / 100;
      const comprasU = u + invFin - invIni;
      // ── Mejora: advertencia si compras negativas ──────────────────────────
      const comprasUAdj = Math.max(comprasU, 0);
      const ventas   = u * da.precio;
      const compras  = comprasUAdj * da.costoU;
      const costoVentas = invIni*da.costoU + compras - invFin*da.costoU;
      const utilidadBruta = ventas - costoVentas;
      const { gastos, depre } = Presupuestos.sumarCats(da.cats, i);
      const int      = (da.intereses||[])[i]||0;
      const uaii     = utilidadBruta - gastos;
      const uai      = uaii - int;
      const impuesto = uai>0 ? uai*da.isr/100 : 0;
      res.push({ u, invIni, comprasU, comprasUAdj, invFin, ventas, compras,
        costoVentas, utilidadBruta, gastos, depre, intereses:int,
        uaii, uai, impuesto, un:uai-impuesto, comprasNeg: comprasU<0 });
      invIni = invFin;
    }
    return res;
  },

  caja(d, op) {
    const da  = Presupuestos.aplicarEscenario(d);
    const V   = [da.ventasPrev[0], da.ventasPrev[1]].concat(op.map(o=>o.ventas));
    const C   = [da.comprasPrev].concat(op.map(o=>o.compras));
    const p1  = typeof da.pago1==='number' ? da.pago1 : (100-da.pagoContado);
    const res = []; let saldo = da.saldoIni;
    for (let i=0; i<3; i++) {
      // Cobros: de contado + rezago 1 mes + rezago 2 meses
      const cobros      = V[i+2]*da.cobroContado/100 + V[i+1]*da.cobro1/100 + V[i]*da.cobro2/100;
      const pagoCompras = C[i+1]*da.pagoContado/100 + C[i]*p1/100;
      const { gastos, depre } = Presupuestos.sumarCats(da.cats, i);
      const gastosEf    = gastos - depre;
      const int         = (da.intereses||[])[i]||0;
      const pagos       = pagoCompras + gastosEf + int + op[i].impuesto + ((da.otros||[])[i]||0);
      const final       = saldo + cobros - pagos;
      const excedente   = final - da.saldoMin;
      res.push({ ini:saldo, cobros, pagoCompras, gastosEf, intereses:int,
        impuesto:op[i].impuesto, otros:(da.otros||[])[i]||0,
        pagos, final, excedente, financiar: excedente<0 ? -excedente : 0 });
      saldo = final;
    }
    return res;
  },

  U(v) { return Fmt.num(v, Math.abs(v-Math.round(v))<1e-9?0:2); },

  // ── Validación cobros y pagos ──────────────────────────────────────────────
  htmlAvisoSumas(x) {
    const sumaC = x.cobroContado + x.cobro1 + x.cobro2;
    const sumaP = x.pagoContado  + x.pago1;
    let html = '';
    if (Math.abs(sumaC-100)>1e-9)
      html += '<div class="cuadre mal">⚠ Los porcentajes de cobro suman <strong>' + Fmt.num(sumaC,2) + ' %</strong>; deben sumar exactamente 100 %. Los cobros en la tabla de caja serán incorrectos hasta corregir esto.</div>';
    else
      html += '<div class="cuadre ok">✔ Cobros: ' + Fmt.num(x.cobroContado,0) + ' % contado + ' + Fmt.num(x.cobro1,0) + ' % un mes + ' + Fmt.num(x.cobro2,0) + ' % dos meses = 100 %.</div>';
    if (Math.abs(sumaP-100)>1e-9)
      html += '<div class="cuadre mal">⚠ Los porcentajes de pago suman <strong>' + Fmt.num(sumaP,2) + ' %</strong>; deben sumar exactamente 100 %. Los pagos a proveedores serán incorrectos hasta corregir esto.</div>';
    else
      html += '<div class="cuadre ok">✔ Pagos: ' + Fmt.num(x.pagoContado,0) + ' % contado + ' + Fmt.num(x.pago1,0) + ' % un mes = 100 %.</div>';
    return html;
  },

  // ── Advertencias de compras negativas ─────────────────────────────────────
  htmlAvisoCompras(op, meses) {
    const casos = op.map((o,i) => o.comprasNeg ? meses[i] + ' (' + Presupuestos.U(o.comprasU) + ' u)' : null).filter(Boolean);
    if (!casos.length) return '';
    return '<div class="cuadre mal">⚠ <strong>Compras negativas detectadas en ' + casos.join(', ') + '.</strong> Esto ocurre cuando el inventario existente supera las necesidades (ventas + inventario final deseado). Se usó 0 compras ese mes. Para corregirlo: reduce el inventario inicial, el porcentaje de inventario final deseado, o aumenta las unidades vendidas.</div>';
  },

  // ── Tabla presupuesto operativo ────────────────────────────────────────────
  tablaOperativo(d, op) {
    const M=d.meses, U=Presupuestos.U;
    const filaM=(n,f,esU,conTotal,cls)=>{
      const fmt=esU?U:Fmt.moneda;
      const tot=conTotal?fmt(op.reduce((s,o)=>s+f(o),0)):'';
      return '<tr class="'+(cls||'')+'"><td>'+n+'</td>'+op.map(o=>'<td>'+fmt(f(o))+'</td>').join('')+'<td>'+tot+'</td></tr>';
    };
    // Usando datos base (sin escenario) para filas de supuesto fijo
    const precioBase = d.precio, costoBase = d.costoU;
    let filasCats='';
    (d.cats||[]).forEach(c=>{
      filasCats += '<tr><td>' + esc(c.nombre) + '</td>' +
        [0,1,2].map(i=>'<td>'+Fmt.moneda(c.montos[i]||0)+'</td>').join('') +
        '<td>'+Fmt.moneda(c.montos.reduce((s,v)=>s+v,0))+'</td></tr>';
    });
    // Notas de origen de cada sección
    const nota = t => '<tr class="sub-nota"><td colspan="5">' + t + '</td></tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th><th>'+M[0]+'</th><th>'+M[1]+'</th><th>'+M[2]+'</th><th>Total</th></tr>'+
      '<tr class="sub"><td colspan="5">1. Presupuesto de ventas</td></tr>'+
      nota('Origen: unidades vendidas ingresadas × precio de venta unitario.')+
      filaM('Ventas (unidades)', o=>o.u, true, true)+
      filaM('Precio de venta unitario (C$)', ()=>precioBase, false, false)+
      filaM('Total ventas (C$)', o=>o.ventas, false, true, 'total')+
      '<tr class="sub"><td colspan="5">2. Presupuesto de compras e inventario</td></tr>'+
      nota('Fórmula: Compras (u) = Ventas + Inv. final deseado − Inv. inicial. Inv. final = % de ventas del mes siguiente.')+
      filaM('(+) Inventario final deseado (u)', o=>o.invFin, true, false)+
      filaM('(−) Inventario inicial (u)', o=>o.invIni, true, false)+
      filaM('Compras necesarias (u)', o=>o.comprasUAdj, true, true, 'total')+
      filaM('Costo unitario (C$)', ()=>costoBase, false, false)+
      filaM('Total compras (C$)', o=>o.compras, false, true, 'total')+
      '<tr class="sub"><td colspan="5">3. Presupuesto de costo de ventas</td></tr>'+
      nota('Fórmula: Costo de ventas = Inv. inicial valorado + Compras − Inv. final valorado.')+
      filaM('(+) Inventario inicial valorado', o=>o.invIni*costoBase, false, false)+
      filaM('(+) Compras (C$)', o=>o.compras, false, true)+
      filaM('(−) Inventario final valorado', o=>o.invFin*costoBase, false, false)+
      filaM('Costo de ventas', o=>o.costoVentas, false, true, 'total')+
      '<tr class="sub"><td colspan="5">4. Presupuesto de gastos de operación</td></tr>'+
      nota('Categorías ingresadas en el formulario superior.')+
      filasCats+
      filaM('Total gastos de operación', o=>o.gastos, false, true, 'total')+
      '<tr class="sub"><td colspan="5">5. Estado de resultados presupuestado</td></tr>'+
      filaM('Ventas', o=>o.ventas, false, true)+
      filaM('(−) Costo de ventas', o=>o.costoVentas, false, true)+
      filaM('Utilidad bruta', o=>o.utilidadBruta, false, true, 'total')+
      filaM('(−) Gastos de operación', o=>o.gastos, false, true)+
      filaM('Utilidad operativa (UAII)', o=>o.uaii, false, true, 'total')+
      filaM('(−) Intereses', o=>o.intereses, false, true)+
      filaM('Utilidad antes de impuestos (UAI)', o=>o.uai, false, true)+
      filaM('(−) Impuesto sobre la renta ('+d.isr+' %)', o=>o.impuesto, false, true)+
      filaM('Utilidad neta', o=>o.un, false, true, 'total')+
      '</table></div>';
  },

  // ── Tabla presupuesto de caja mejorada ────────────────────────────────────
  tablaCaja(d, ca) {
    const M=d.meses;
    const f=(n,g,cls,nota)=>'<tr class="'+(cls||'')+'"><td>'+n+(nota?'<br><small class="nota-caja">'+nota+'</small>':'')+'</td>'+ca.map(c=>{
      const v=g(c);
      const style = (cls==='total' && v<0) ? ' style="color:#c0392b;font-weight:700"' : '';
      return '<td'+style+'>'+Fmt.moneda(v)+'</td>';
    }).join('')+'</tr>';
    const sep=t=>'<tr class="sub"><td colspan="4">'+t+'</td></tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th><th>'+M[0]+'</th><th>'+M[1]+'</th><th>'+M[2]+'</th></tr>'+
      sep('Saldo inicial')+
      f('Saldo inicial de caja (C$)', c=>c.ini, '',
        'Saldo al inicio del mes. El primer mes usa el saldo inicial ingresado; los siguientes toman el saldo final del mes anterior.')+
      sep('Cobros (entradas de efectivo)')+
      f('(+) Cobros de ventas (C$)', c=>c.cobros, 'total',
        'Incluye cobros de contado del mes actual + rezago de meses anteriores según la política de cobros.')+
      sep('Pagos (salidas de efectivo)')+
      f('(−) Pagos a proveedores (C$)', c=>c.pagoCompras, '',
        'Pago de las compras de este mes (contado) + pago de las compras del mes anterior (crédito).')+
      f('(−) Gastos de operación en efectivo (C$)', c=>c.gastosEf, '',
        'Gastos totales menos depreciación, ya que la depreciación no es salida de caja.')+
      f('(−) Intereses (C$)', c=>c.intereses)+
      f('(−) Impuesto sobre la renta (C$)', c=>c.impuesto)+
      f('(−) Otros desembolsos (C$)', c=>c.otros)+
      f('Total de pagos (C$)', c=>c.pagos, 'total')+
      sep('Resultado del período')+
      f('Saldo final de caja (C$)', c=>c.final, 'total')+
      sep('Control del saldo mínimo')+
      f('Saldo mínimo deseado (C$)', ()=>Presupuestos._min)+
      f('Excedente (+) o faltante (−) frente al mínimo (C$)', c=>c.excedente, 'total')+
      sep('Financiamiento')+
      f('Financiamiento requerido (C$)', c=>c.financiar)+
      '</table></div>';
  },

  // ── Alerta de caja mejorada ────────────────────────────────────────────────
  htmlAlertaCaja(d, ca) {
    const neg    = ca.filter(c=>c.final<0);
    const falta  = ca.map((c,i)=>c.financiar>0?d.meses[i]+' ('+Fmt.moneda(c.financiar)+')':null).filter(Boolean);
    let html = '';
    if (neg.length)
      html += '<div class="cuadre mal">⛔ <strong>Saldo de caja negativo</strong> en: ' +
        neg.map((_,i)=>ca.indexOf(neg[0])===i?d.meses[ca.indexOf(neg[0])]:d.meses[i]).join(', ') +
        '. El saldo de caja no puede ser negativo; implica que la empresa no puede cubrir sus pagos con los fondos disponibles. Revisa cobros, reduce pagos o consigue financiamiento urgente.</div>';
    if (falta.length)
      html += '<div class="cuadre mal">⚠ <strong>Financiamiento requerido en ' + falta.join(', ') + '.</strong> ' +
        'El saldo queda por debajo del mínimo deseado (' + Fmt.moneda(Presupuestos._min) + '). ' +
        'Opciones: adelantar cobros, posponer pagos o gestionar una línea de crédito para ese mes.</div>';
    if (!neg.length && !falta.length)
      html += '<div class="cuadre ok">✔ El saldo de caja se mantiene sobre el mínimo deseado en los tres meses. Saldo final: ' +
        ca.map((c,i)=>d.meses[i]+' '+Fmt.moneda(c.final)).join(' · ') + '.</div>';
    return html;
  },

  // ── Tabla presupuesto maestro ──────────────────────────────────────────────
  tablaPresupuestoMaestro(d, op, ca) {
    const M=d.meses;
    const totVentas  = op.reduce((s,o)=>s+o.ventas,0);
    const totCompras = op.reduce((s,o)=>s+o.compras,0);
    const totCosto   = op.reduce((s,o)=>s+o.costoVentas,0);
    const totGastos  = op.reduce((s,o)=>s+o.gastos,0);
    const totUB      = op.reduce((s,o)=>s+o.utilidadBruta,0);
    const totUAII    = op.reduce((s,o)=>s+o.uaii,0);
    const totInt     = op.reduce((s,o)=>s+o.intereses,0);
    const totUAI     = op.reduce((s,o)=>s+o.uai,0);
    const totImp     = op.reduce((s,o)=>s+o.impuesto,0);
    const totUN      = op.reduce((s,o)=>s+o.un,0);
    const totCobros  = ca.reduce((s,c)=>s+c.cobros,0);
    const totPagos   = ca.reduce((s,c)=>s+c.pagos,0);
    const totFinan   = ca.reduce((s,c)=>s+c.financiar,0);
    const sep=(t,nota)=>'<tr class="sub"><td colspan="'+(M.length+2)+'">'+t+(nota?'<span style="font-weight:normal;font-size:.85em;margin-left:8px;opacity:.7">'+nota+'</span>':'')+'</td></tr>';
    const fila=(n,vals,tot,cls)=>'<tr class="'+(cls||'')+'"><td>'+n+'</td>'+vals.map(v=>'<td>'+Fmt.moneda(v)+'</td>').join('')+'<td><strong>'+Fmt.moneda(tot)+'</strong></td></tr>';
    let filaCats='';
    (d.cats||[]).forEach(c=>{
      filaCats += '<tr><td style="padding-left:16px">'+esc(c.nombre)+'</td>'+
        [0,1,2].map(i=>'<td>'+Fmt.moneda(c.montos[i]||0)+'</td>').join('')+
        '<td>'+Fmt.moneda(c.montos.reduce((s,v)=>s+v,0))+'</td></tr>';
    });
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Componente</th>'+M.map(m=>'<th>'+m+'</th>').join('')+'<th>Total período</th></tr>'+
      sep('1. Presupuesto de ventas','Ventas (u) × precio unitario')+
      fila('Unidades vendidas', op.map(o=>o.u*d.precio*0).map((_,i)=>op[i].u), op.reduce((s,o)=>s+o.u,0))+
      fila('Ingresos por ventas (C$)', op.map(o=>o.ventas), totVentas, 'total')+
      sep('2. Presupuesto de compras','Compras (u) = Ventas + Inv. final − Inv. inicial')+
      fila('Total compras (C$)', op.map(o=>o.compras), totCompras)+
      fila('Inventario final valorado (C$)', op.map(o=>o.invFin*d.costoU), op[2].invFin*d.costoU)+
      sep('3. Presupuesto de costo de ventas','Inv. inicial + Compras − Inv. final')+
      fila('Costo de ventas (C$)', op.map(o=>o.costoVentas), totCosto, 'total')+
      sep('4. Presupuesto de gastos de operación','Suma de categorías ingresadas')+
      filaCats+
      fila('Total gastos de operación (C$)', op.map(o=>o.gastos), totGastos, 'total')+
      sep('5. Estado de resultados presupuestado')+
      fila('Ventas', op.map(o=>o.ventas), totVentas)+
      fila('(−) Costo de ventas', op.map(o=>o.costoVentas), totCosto)+
      fila('Utilidad bruta', op.map(o=>o.utilidadBruta), totUB, 'total')+
      fila('(−) Gastos de operación', op.map(o=>o.gastos), totGastos)+
      fila('Utilidad operativa (UAII)', op.map(o=>o.uaii), totUAII, 'total')+
      fila('(−) Intereses', op.map(o=>o.intereses), totInt)+
      fila('(−) Impuesto sobre la renta', op.map(o=>o.impuesto), totImp)+
      fila('Utilidad neta', op.map(o=>o.un), totUN, 'total')+
      sep('6. Presupuesto de caja')+
      fila('Saldo inicial', ca.map(c=>c.ini), ca[0].ini)+
      fila('(+) Cobros de ventas', ca.map(c=>c.cobros), totCobros)+
      fila('(−) Total pagos', ca.map(c=>c.pagos), totPagos)+
      fila('Saldo final de caja', ca.map(c=>c.final), ca[2].final, 'total')+
      sep('7. Financiamiento requerido','Solo cuando el saldo queda bajo el mínimo deseado')+
      fila('Saldo mínimo deseado (C$)', ca.map(()=>d.saldoMin), d.saldoMin)+
      fila('Excedente (+) / Faltante (−)', ca.map(c=>c.excedente), ca[2].excedente, 'total')+
      fila('Financiamiento a gestionar (C$)', ca.map(c=>c.financiar), totFinan, totFinan>0?'mal':'')+
      '</table></div>';
  },

  // ── Comparación real vs presupuestado — CORREGIDA ──────────────────────────
  // Regla de favorabilidad:
  //   Ventas:        real > presupuesto → FAVORABLE (ingresos más altos de lo planeado)
  //   Costo ventas:  real < presupuesto → FAVORABLE (costo menor de lo esperado)
  //   Gastos:        real < presupuesto → FAVORABLE (gasto menor de lo esperado)
  //   Utilidad neta: real > presupuesto → FAVORABLE
  tablaComparacion(d, op) {
    const r  = d.reales||{};
    const rv = r.ventas||[0,0,0], rc=r.costoVentas||[0,0,0],
          rg = r.gastosTotales||[0,0,0], ru=r.utilidadNeta||[0,0,0];
    if (!rv.some(v=>v!==0)&&!rc.some(v=>v!==0)&&!ru.some(v=>v!==0))
      return '<div class="aviso">Cuando tengas los datos reales del período, ingrésalos en la sección de arriba para ver el cumplimiento del presupuesto.</div>';
    const M=d.meses;
    // favor=true → mayor real es favorable; favor=false → menor real es favorable
    const fila=(n,pArr,rArr,favor)=>{
      let cells='';
      pArr.forEach((p,i)=>{
        const dif=rArr[i]-p;
        const esFav = favor ? dif>=0 : dif<=0;
        const pct = p !== 0 ? ' (' + Fmt.pct(Math.abs(dif/p)) + ')' : '';
        const cls = 'cuadre ' + (esFav?'ok':'mal');
        const etiq = esFav ? '▲ Fav.' : '▼ Desf.';
        cells += '<td>'+Fmt.moneda(p)+'</td>' +
                 '<td>'+Fmt.moneda(rArr[i])+'</td>' +
                 '<td class="'+cls+'">'+Fmt.moneda(dif)+pct+'<br><small>'+etiq+'</small></td>';
      });
      return '<tr><td><strong>'+n+'</strong></td>'+cells+'</tr>';
    };
    return '<p class="nota-pie">Favorable (▲) = el resultado real supera la meta en términos positivos para la empresa. '+
      'Para ventas y utilidad, favorable = real mayor. Para costos y gastos, favorable = real menor.</p>'+
      '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th>'+M.map(m=>'<th>'+m+' Pres.</th><th>'+m+' Real</th><th>'+m+' Variación</th>').join('')+'</tr>'+
      fila('Ventas (C$)',           op.map(o=>o.ventas),       rv,  true)+
      fila('Costo de ventas (C$)',  op.map(o=>o.costoVentas),  rc,  false)+
      fila('Gastos de operación (C$)', op.map(o=>o.gastos),   rg,  false)+
      fila('Utilidad neta (C$)',    op.map(o=>o.un),           ru,  true)+
      '</table></div>';
  },

  // ── Comparación de los 3 escenarios expandida ──────────────────────────────
  tablaEscenarios(d) {
    const escN=['base','optimista','pesimista'];
    const ops = escN.map(e=>Presupuestos.operativo(Object.assign({},d,{escenario:e})));
    const caj = ops.map(op=>Presupuestos.caja(d,op));
    const f=(n,fn,cls)=>'<tr class="'+(cls||'')+'"><td>'+n+'</td>'+
      ops.map((op,i)=>'<td>'+fn(op,caj[i])+'</td>').join('')+'</tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th>'+
        '<th>Base<br><small>u×'+Fmt.num(d.escenarios.base.factorUnidades,2)+' p×'+Fmt.num(d.escenarios.base.factorPrecio,2)+'</small></th>'+
        '<th>Optimista<br><small>u×'+Fmt.num(d.escenarios.optimista.factorUnidades,2)+' p×'+Fmt.num(d.escenarios.optimista.factorPrecio,2)+'</small></th>'+
        '<th>Pesimista<br><small>u×'+Fmt.num(d.escenarios.pesimista.factorUnidades,2)+' p×'+Fmt.num(d.escenarios.pesimista.factorPrecio,2)+'</small></th>'+
      '</tr>'+
      '<tr class="sub"><td colspan="4">Por mes</td></tr>'+
      [0,1,2].map(i=>
        '<tr><td colspan="4" style="font-weight:600;padding-top:6px">'+d.meses[i]+'</td></tr>'+
        f('  Ventas',         (op)=>Fmt.moneda(op[i].ventas))+
        f('  Utilidad bruta', (op)=>Fmt.moneda(op[i].utilidadBruta))+
        f('  UAII',           (op)=>Fmt.moneda(op[i].uaii))+
        f('  Utilidad neta',  (op)=>Fmt.moneda(op[i].un), 'total')
      ).join('')+
      '<tr class="sub"><td colspan="4">Totales del período</td></tr>'+
      f('Ventas totales',         (op)=>Fmt.moneda(op.reduce((s,o)=>s+o.ventas,0)), 'total')+
      f('Utilidad bruta total',   (op)=>Fmt.moneda(op.reduce((s,o)=>s+o.utilidadBruta,0)))+
      f('UAII total',             (op)=>Fmt.moneda(op.reduce((s,o)=>s+o.uaii,0)), 'total')+
      f('Utilidad neta total',    (op)=>Fmt.moneda(op.reduce((s,o)=>s+o.un,0)), 'total')+
      f('Saldo final de caja',   (op,ca)=>Fmt.moneda(ca[2].final), 'total')+
      f('Financiamiento requerido',(op,ca)=>Fmt.moneda(ca.reduce((s,c)=>s+c.financiar,0)))+
      '</table></div>'+
      '<p class="nota-pie">Los factores de escenario se pueden modificar en las celdas de la tabla de supuestos al final de esta pestaña.</p>';
  },

  limpiar() { Presupuestos.grafs.forEach(g=>{ try{g.destroy();}catch(e){} }); Presupuestos.grafs=[]; },

  graficos(raiz, d, op, ca) {
    Presupuestos.limpiar();
    if (typeof Chart==='undefined') return;
    const g1=raiz.querySelector('#pr-g1'), g2=raiz.querySelector('#pr-g2'), g3=raiz.querySelector('#pr-g3');
    const mill=v=>(Math.abs(v)>=1e6?(v/1e6).toFixed(1)+' M':(Math.abs(v)>=1e3?(v/1e3).toFixed(0)+' k':v));
    if (g1) Presupuestos.grafs.push(new Chart(g1,{
      type:'bar', data:{ labels:d.meses, datasets:[
        { label:'Cobros', data:ca.map(c=>c.cobros), backgroundColor:'#2d6a4f' },
        { label:'Pagos',  data:ca.map(c=>c.pagos),  backgroundColor:'#b5d5c5' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom' }, tooltip:{ callbacks:{ label:ctx=>' C$ '+Fmt.num(ctx.raw,2) } } },
        scales:{ y:{ ticks:{ callback:mill } } } }
    }));
    if (g2) Presupuestos.grafs.push(new Chart(g2,{
      type:'line', data:{ labels:d.meses, datasets:[
        { label:'Saldo final',   data:ca.map(c=>c.final),    borderColor:'#2d6a4f', backgroundColor:'rgba(45,106,79,.1)', borderWidth:2, fill:true },
        { label:'Saldo mínimo',  data:ca.map(()=>d.saldoMin),borderColor:'#b25555', borderDash:[6,4], borderWidth:2, pointRadius:0, fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom' }, tooltip:{ callbacks:{ label:ctx=>' C$ '+Fmt.num(ctx.raw,2) } } },
        scales:{ y:{ ticks:{ callback:mill } } } }
    }));
    if (g3) Presupuestos.grafs.push(new Chart(g3,{
      type:'bar', data:{ labels:d.meses, datasets:[
        { label:'Ventas',           data:op.map(o=>o.ventas),      backgroundColor:'#1b4332' },
        { label:'Compras',          data:op.map(o=>o.compras),     backgroundColor:'#40916c' },
        { label:'Costo de ventas',  data:op.map(o=>o.costoVentas), backgroundColor:'#74c69d' },
        { label:'Gastos operación', data:op.map(o=>o.gastos),      backgroundColor:'#b7e4c7' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom' }, tooltip:{ callbacks:{ label:ctx=>' C$ '+Fmt.num(ctx.raw,2) } } },
        scales:{ y:{ ticks:{ callback:mill } } } }
    }));
  },

  inp(id,v,tipo) {
    return '<input type="text" inputmode="decimal" data-validar="'+(tipo||'numero')+'" id="'+id+'" value="'+(v||0)+
      '" style="text-align:right;padding:6px 8px;min-width:90px">';
  },
  campo(id,et,v) {
    return '<label class="campo corto" style="flex:1;min-width:150px">'+et+
      '<input type="text" inputmode="decimal" data-validar="numero" id="'+id+'" value="'+(v||0)+'"></label>';
  },
  filaIn(et,base,arr) {
    return '<tr><td>'+et+'</td>'+[0,1,2].map(i=>'<td>'+Presupuestos.inp(base+'-'+i,arr[i])+'</td>').join('')+'</tr>';
  },

  renderCats(d) {
    const P=Presupuestos;
    let html='<div class="tarjeta"><h3 class="titulo-seccion" style="margin-top:0">Gastos de operación por categoría</h3>'+
      '<div class="aviso" style="margin-bottom:10px">Ingresa el total del gasto (efectivo + depreciación). En la fila "depreciación" indica la parte que NO es salida de caja (para excluirla del presupuesto de caja).</div>'+
      '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Categoría</th><th class="mes-0">'+d.meses[0]+'</th><th class="mes-1">'+d.meses[1]+'</th><th class="mes-2">'+d.meses[2]+'</th></tr>';
    (d.cats||[]).forEach((c,ci)=>{
      html+='<tr><td><input type="text" data-validar="nombre" id="pr-cat-nom-'+ci+'" value="'+esc(c.nombre)+'" style="min-width:140px"></td>'+
        [0,1,2].map(i=>'<td>'+P.inp('pr-cat-'+ci+'-'+i,c.montos[i])+'</td>').join('')+'</tr>'+
        '<tr style="font-size:.9em;color:#555"><td style="padding-left:16px">— de los cuales depreciación</td>'+
        [0,1,2].map(i=>'<td>'+P.inp('pr-catd-'+ci+'-'+i,c.depre[i])+'</td>').join('')+'</tr>';
    });
    html+='</table></div></div>';
    return html;
  },

  // ── Importar desde estados financieros ───────────────────────────────────
  importarDesdeEF(d) {
    try {
      const ef = typeof Estados !== 'undefined' ? Estados.obtener() : null;
      if (!ef) { alert('No hay datos de estados financieros. Ve a ese módulo primero.'); return d; }
      const e = k => Number(ef.er[k][1]) || 0, b = k => Number(ef.bg[k][1]) || 0;
      const unidades = d.unidades.some(u=>u>0) ? d.unidades : [0,0,0];
      const totalVentas = e('ventas'), totalCosto = e('costoVentas');
      // Si hay unidades, calcular precio y costo unitario
      const totU = unidades.reduce((s,v)=>s+v,0);
      const precio  = totU && totalVentas ? Math.round(totalVentas / totU * 100) / 100 : d.precio;
      const costoU  = totU && totalCosto  ? Math.round(totalCosto  / totU * 100) / 100 : d.costoU;
      // Prorratear gastos operativos por mes según proporción de ventas (iguales si no hay guía)
      const dist  = [1/3, 1/3, 1/3];
      const gVenta = e('gastosVenta'), gAdmin = e('gastosAdmin'), dep = e('depreciacion');
      const cats = d.cats.map((c,i)=>{
        const totales = [
          gVenta + gAdmin, // simplificado: todo en primera categoría útil
          0, dep, 0, 0
        ];
        return { ...c,
          montos: [0,1,2].map(mes=>Math.round((totales[i]||0)*dist[mes])),
          depre:  i===2 ? [0,1,2].map(mes=>Math.round(dep*dist[mes])) : c.depre
        };
      });
      const nuevo = { ...d, precio, costoU, isr: Number(ef.isr)||d.isr,
        cats: d.cats.map((c,i)=>({
          ...c,
          montos: i===0 ? [0,1,2].map(m=>Math.round((gVenta+gAdmin)/3))
                : i===2 ? [0,1,2].map(m=>Math.round(dep/3))
                : c.montos,
          depre: i===2 ? [0,1,2].map(m=>Math.round(dep/3)) : c.depre
        }))
      };
      return nuevo;
    } catch(err) { alert('Error al importar: ' + err.message); return d; }
  },

  render(el) {
    const d=Presupuestos.obtener(), P=Presupuestos, C=P.campo;
    const tabs=[
      ['oper',    'Presupuesto operativo'],
      ['caja',    'Presupuesto de caja'],
      ['maestro', 'Presupuesto maestro'],
      ['comp',    'Real vs presupuestado'],
      ['esc',     'Escenarios']
    ];
    const raiz=document.createElement('div');
    raiz.innerHTML=
      '<div class="barra-acciones">'+
        '<button class="btn" id="pr-ejemplo">Cargar caso El Progreso (jul-sep)</button>'+
        '<button class="btn sec" id="pr-desde-ef">Importar desde Estados financieros</button>'+
        '<button class="btn sec peligro" id="pr-limpiar">Limpiar datos</button>'+
      '</div>'+
      '<div class="pestanas">'+tabs.map((t,i)=>'<button class="pest'+(i===0?' activa':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+

      // ── Tab: operativo ──────────────────────────────────────────────────────
      '<div id="sec-oper">'+
        '<div class="aviso">Presupuesto operativo: ventas → compras → costo de ventas → gastos → utilidad. '+
          'Fórmula clave: <strong>Compras (u) = Ventas + Inv. final deseado − Inv. inicial</strong>.</div>'+
        '<h2 class="titulo-seccion">Datos generales</h2>'+
        '<div class="barra-acciones">'+
          C('pr-precio','Precio de venta unitario (C$)',d.precio)+
          C('pr-costou','Costo unitario (C$)',d.costoU)+
          C('pr-inv','Inventario inicial (unidades)',d.invIni)+
          C('pr-pol','Inventario final deseado (% ventas del mes siguiente)',d.polInv)+
          C('pr-sig','Ventas (unidades) del mes siguiente al último',d.unidadesSig)+
          C('pr-isr','Impuesto sobre la renta (%)',d.isr)+
        '</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Dato por mes</th>'+[0,1,2].map(i=>'<th>'+P.inp('pr-mes-'+i,d.meses[i],'nombre')+'</th>').join('')+'</tr>'+
          P.filaIn('Ventas (unidades)','pr-u',d.unidades)+
          P.filaIn('Intereses (C$)','pr-int',d.intereses)+
        '</table></div></div>'+
        '<div id="pr-cats-cont">'+P.renderCats(d)+'</div>'+
        '<div id="pr-aviso-compras" style="margin-top:8px"></div>'+
        '<h2 class="titulo-seccion">Resultados del presupuesto operativo</h2>'+
        '<div class="tarjeta" id="pr-tabla-op"></div>'+
        '<div class="dos-col" style="margin-top:14px">'+
          '<div class="tarjeta"><h3>Relación ventas, compras, costos y gastos</h3><div class="grafico"><canvas id="pr-g3"></canvas></div></div>'+
        '</div>'+
      '</div>'+

      // ── Tab: caja ───────────────────────────────────────────────────────────
      '<div id="sec-caja" style="display:none">'+
        '<div class="aviso">Saldo final = Saldo inicial + Cobros − Pagos. '+
          'Los cobros siguen la política de crédito (contado + rezagos). '+
          'La depreciación se excluye de los pagos porque no es salida de efectivo.</div>'+
        '<h2 class="titulo-seccion">Política de cobros</h2>'+
        '<div class="barra-acciones">'+
          C('pr-c0','Cobrado de contado (%)',d.cobroContado)+
          C('pr-c1','Cobrado al mes siguiente (%)',d.cobro1)+
          C('pr-c2','Cobrado a los 2 meses (%)',d.cobro2)+
        '</div>'+
        '<div id="pr-avisoc"></div>'+
        '<h2 class="titulo-seccion">Política de pagos a proveedores</h2>'+
        '<div class="barra-acciones">'+
          C('pr-pc','Pagado de contado (%)',d.pagoContado)+
          C('pr-p1','Pagado al mes siguiente (%)',typeof d.pago1==='number'?d.pago1:(100-d.pagoContado))+
        '</div>'+
        '<div id="pr-avisop"></div>'+
        '<h2 class="titulo-seccion">Otros datos de caja</h2>'+
        '<div class="barra-acciones">'+
          C('pr-vp0','Ventas de hace 2 meses (C$)',d.ventasPrev[0])+
          C('pr-vp1','Ventas del mes anterior (C$)',d.ventasPrev[1])+
          C('pr-cp','Compras del mes anterior (C$)',d.comprasPrev)+
          C('pr-si','Saldo inicial de caja (C$)',d.saldoIni)+
          C('pr-sm','Saldo mínimo deseado (C$)',d.saldoMin)+
        '</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Dato por mes</th><th class="mes-0"></th><th class="mes-1"></th><th class="mes-2"></th></tr>'+
          P.filaIn('Otros desembolsos (activos, dividendos…) (C$)','pr-ot',d.otros)+
        '</table></div></div>'+
        '<h2 class="titulo-seccion">Presupuesto de caja</h2>'+
        '<div class="tarjeta" id="pr-tabla-caja"></div>'+
        '<div id="pr-alerta" style="margin-top:10px"></div>'+
        '<div class="dos-col" style="margin-top:14px">'+
          '<div class="tarjeta"><h3>Cobros vs pagos</h3><div class="grafico"><canvas id="pr-g1"></canvas></div></div>'+
          '<div class="tarjeta"><h3>Saldo de caja proyectado</h3><div class="grafico"><canvas id="pr-g2"></canvas></div></div>'+
        '</div>'+
      '</div>'+

      // ── Tab: Presupuesto maestro ────────────────────────────────────────────
      '<div id="sec-maestro" style="display:none">'+
        '<div class="aviso">El <strong>presupuesto maestro</strong> integra todos los sub-presupuestos en un solo documento. Muestra cómo las ventas planeadas determinan compras, costo de ventas, gastos, utilidad y el flujo de caja.</div>'+
        '<div class="tarjeta" id="pr-tabla-maestro"></div>'+
      '</div>'+

      // ── Tab: Real vs presupuestado ──────────────────────────────────────────
      '<div id="sec-comp" style="display:none">'+
        '<div class="aviso">Ingresa los datos reales para ver el cumplimiento. <strong>Favorable (▲)</strong> = el resultado beneficia a la empresa. Para ventas y utilidad: real > presupuesto. Para costos y gastos: real < presupuesto.</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Dato real</th><th class="mes-0"></th><th class="mes-1"></th><th class="mes-2"></th></tr>'+
          P.filaIn('Ventas reales (C$)',              'pr-rv',(d.reales||{}).ventas       ||[0,0,0])+
          P.filaIn('Costo de ventas real (C$)',       'pr-rc',(d.reales||{}).costoVentas  ||[0,0,0])+
          P.filaIn('Gastos de operación reales (C$)','pr-rg',(d.reales||{}).gastosTotales||[0,0,0])+
          P.filaIn('Utilidad neta real (C$)',         'pr-ru',(d.reales||{}).utilidadNeta ||[0,0,0])+
        '</table></div></div>'+
        '<h2 class="titulo-seccion">Comparación</h2>'+
        '<div class="tarjeta" id="pr-tabla-comp"></div>'+
      '</div>'+

      // ── Tab: Escenarios ─────────────────────────────────────────────────────
      '<div id="sec-esc" style="display:none">'+
        '<div class="aviso">Ajusta los factores de cada escenario y elige cuál ver en las demás pestañas. El escenario solo afecta las <strong>unidades vendidas</strong> y el <strong>precio de venta</strong>.</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Escenario</th><th>Factor de unidades</th><th>Factor de precio</th><th>Activo</th></tr>'+
          ['base','optimista','pesimista'].map(e=>{
            const ev=((d.escenarios||{})[e])||{ factorUnidades:1, factorPrecio:1 };
            return '<tr><td>'+e.charAt(0).toUpperCase()+e.slice(1)+'</td>'+
              '<td>'+P.inp('pr-esc-u-'+e,ev.factorUnidades)+'</td>'+
              '<td>'+P.inp('pr-esc-p-'+e,ev.factorPrecio)+'</td>'+
              '<td style="text-align:center"><input type="radio" name="pr-esc-sel" value="'+e+'"'+(d.escenario===e?' checked':'')+'></td></tr>';
          }).join('')+
        '</table></div></div>'+
        '<h2 class="titulo-seccion">Comparación de escenarios</h2>'+
        '<div class="tarjeta" id="pr-tabla-esc"></div>'+
      '</div>';

    el.innerHTML=''; el.appendChild(raiz);
    const q=id=>raiz.querySelector(id);
    const n=id=>Fmt.aNum(q(id)?q(id).value:'0');
    const tri=b=>[0,1,2].map(i=>n(b+'-'+i));
    const leerCats=()=>(d.cats||[]).map((_,ci)=>({
      nombre: q('#pr-cat-nom-'+ci)?q('#pr-cat-nom-'+ci).value:d.cats[ci].nombre,
      montos: [0,1,2].map(i=>n('#pr-cat-'+ci+'-'+i)),
      depre:  [0,1,2].map(i=>n('#pr-catd-'+ci+'-'+i))
    }));
    const leer=()=>({
      meses:       [0,1,2].map(i=>q('#pr-mes-'+i)?q('#pr-mes-'+i).value||('Mes '+(i+1)):d.meses[i]),
      precio:      n('#pr-precio'), costoU:n('#pr-costou'),
      unidades:    tri('#pr-u'), unidadesSig:n('#pr-sig'),
      polInv:      n('#pr-pol'), invIni:n('#pr-inv'), isr:n('#pr-isr'),
      cats:        leerCats(),
      intereses:   tri('#pr-int'),
      cobroContado:n('#pr-c0'), cobro1:n('#pr-c1'), cobro2:n('#pr-c2'),
      ventasPrev:  [n('#pr-vp0'),n('#pr-vp1')],
      pagoContado: n('#pr-pc'), pago1:n('#pr-p1'),
      comprasPrev: n('#pr-cp'), otros:tri('#pr-ot'),
      saldoIni:    n('#pr-si'), saldoMin:n('#pr-sm'),
      escenario:   (raiz.querySelector('input[name="pr-esc-sel"]:checked')||{}).value||d.escenario,
      escenarios:{
        base:      { factorUnidades:n('#pr-esc-u-base'),     factorPrecio:n('#pr-esc-p-base') },
        optimista: { factorUnidades:n('#pr-esc-u-optimista'), factorPrecio:n('#pr-esc-p-optimista') },
        pesimista: { factorUnidades:n('#pr-esc-u-pesimista'), factorPrecio:n('#pr-esc-p-pesimista') }
      },
      reales:{
        ventas:        tri('#pr-rv'), costoVentas:tri('#pr-rc'),
        gastosTotales: tri('#pr-rg'), utilidadNeta:tri('#pr-ru')
      }
    });

    let tabActivo='oper';
    const refrescar=()=>{
      const x=leer();
      Datos.guardar('presupuestos',x);
      const op=P.operativo(x), ca=P.caja(x,op);
      P._min=x.saldoMin;
      [0,1,2].forEach(i=>{ raiz.querySelectorAll('.mes-'+i).forEach(h=>{ h.textContent=x.meses[i]; }); });

      // Avisos de validación cobros/pagos
      if (q('#pr-avisoc') || q('#pr-avisop')) {
        const html = P.htmlAvisoSumas(x);
        const temp = document.createElement('div'); temp.innerHTML = html;
        const divs = temp.querySelectorAll('div');
        if (q('#pr-avisoc') && divs[0]) q('#pr-avisoc').innerHTML = divs[0].outerHTML;
        if (q('#pr-avisop') && divs[1]) q('#pr-avisop').innerHTML = divs[1].outerHTML;
      }

      // Aviso compras negativas
      if (q('#pr-aviso-compras')) q('#pr-aviso-compras').innerHTML = P.htmlAvisoCompras(op, x.meses);

      if (q('#pr-tabla-op'))      q('#pr-tabla-op').innerHTML      = P.tablaOperativo(x,op);
      if (q('#pr-tabla-caja'))    q('#pr-tabla-caja').innerHTML    = P.tablaCaja(x,ca);
      if (q('#pr-tabla-maestro')) q('#pr-tabla-maestro').innerHTML = P.tablaPresupuestoMaestro(x,op,ca);
      if (q('#pr-tabla-comp'))    q('#pr-tabla-comp').innerHTML    = P.tablaComparacion(x,op);
      if (q('#pr-alerta'))        q('#pr-alerta').innerHTML        = P.htmlAlertaCaja(x,ca);
      if (q('#pr-tabla-esc'))     q('#pr-tabla-esc').innerHTML     = P.tablaEscenarios(x);

      if (tabActivo==='caja')      { P.graficos(raiz,x,op,ca); }
      else if (tabActivo==='oper') {
        const g3=q('#pr-g3');
        if (g3) {
          if (g3._chart) { try{ g3._chart.destroy(); }catch(e){} }
          if (typeof Chart!=='undefined') g3._chart=new Chart(g3,{
            type:'bar', data:{ labels:x.meses, datasets:[
              { label:'Ventas',           data:op.map(o=>o.ventas),      backgroundColor:'#1b4332' },
              { label:'Compras',          data:op.map(o=>o.compras),     backgroundColor:'#40916c' },
              { label:'Costo de ventas',  data:op.map(o=>o.costoVentas), backgroundColor:'#74c69d' },
              { label:'Gastos operación', data:op.map(o=>o.gastos),      backgroundColor:'#b7e4c7' }
            ]},
            options:{ responsive:true, maintainAspectRatio:false,
              plugins:{ legend:{ position:'bottom' } } }
          });
        }
      } else { P.limpiar(); }
    };

    raiz.addEventListener('input', refrescar);
    raiz.querySelectorAll('input[name="pr-esc-sel"]').forEach(r=>r.addEventListener('change',refrescar));
    raiz.querySelectorAll('.pest').forEach(b=>b.addEventListener('click',()=>{
      raiz.querySelectorAll('.pest').forEach(z=>z.classList.toggle('activa',z===b));
      tabs.forEach(t=>{ q('#sec-'+t[0]).style.display=t[0]===b.dataset.tab?'':'none'; });
      tabActivo=b.dataset.tab;
      refrescar();
    }));

    // Importar desde estados financieros
    q('#pr-desde-ef').addEventListener('click',()=>{
      const actual = leer();
      const nuevo  = P.importarDesdeEF(actual);
      Datos.guardar('presupuestos', nuevo);
      P.render(el); Validar.activar(el);
      el.querySelector('#pr-aviso-compras').innerHTML =
        '<div class="cuadre ok">Datos importados desde los estados financieros. Ajusta precio, costo unitario y unidades si es necesario.</div>';
    });

    q('#pr-ejemplo').addEventListener('click',()=>{ Datos.guardar('presupuestos',P.ejemplo()); P.render(el); Validar.activar(el); });
    q('#pr-limpiar').addEventListener('click',()=>{
      if (confirm('¿Borrar todos los datos de presupuestos?')){ Datos.guardar('presupuestos',P.vacio()); P.render(el); Validar.activar(el); }
    });

    refrescar();
    Validar.activar(el);
  }
};

Modulos.presupuestos = {
  titulo: 'Planeación y presupuestos',
  subtitulo: 'Presupuesto maestro: ventas, compras, costo de ventas, gastos, caja y comparación real vs presupuestado',
  render(el) { Presupuestos.render(el); }
};