// Módulo 6: Planeación y presupuestos — versión completa
// Incluye: gastos por categorías, validación cobros y pagos suman 100%,
// presupuesto maestro integrado, comparación real vs presupuestado,
// escenarios, alerta de financiamiento, explicación del financiamiento.

// Escapa HTML para inserción segura (si no está definida globalmente)
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const Presupuestos = {
  grafs: [],

  ejemplo() {
    return {
      meses: ['Julio', 'Agosto', 'Septiembre'],
      precio: 12, costoU: 7,
      unidades: [6000, 7500, 9000], unidadesSig: 10000,
      polInv: 20, invIni: 1500, isr: 30,
      cats: [
        { nombre: 'Sueldos y salarios',  montos: [10000,10000,10000], depre:[0,0,0] },
        { nombre: 'Alquiler',            montos: [3000, 3000, 3000],  depre:[0,0,0] },
        { nombre: 'Servicios públicos',  montos: [2000, 2500, 3000],  depre:[0,0,0] },
        { nombre: 'Depreciación',        montos: [1000, 1000, 1000],  depre:[1000,1000,1000] },
        { nombre: 'Otros gastos',        montos: [4000, 4000, 4000],  depre:[0,0,0] }
      ],
      intereses: [0,0,0],
      cobroContado: 50, cobro1: 30, cobro2: 20,
      ventasPrev: [60000, 60000],
      pagoContado: 50, pago1: 50,
      comprasPrev: 40000,
      otros: [0,0,0], saldoIni: 10000, saldoMin: 8000,
      escenario: 'base',
      escenarios: {
        base:      { factorUnidades: 1.00, factorPrecio: 1.00 },
        optimista: { factorUnidades: 1.15, factorPrecio: 1.05 },
        pesimista: { factorUnidades: 0.85, factorPrecio: 0.95 }
      },
      reales: { ventas:[0,0,0], costoVentas:[0,0,0], gastosTotales:[0,0,0], utilidadNeta:[0,0,0] }
    };
  },

  vacio() {
    return {
      meses: ['Mes 1','Mes 2','Mes 3'],
      precio:0, costoU:0, unidades:[0,0,0], unidadesSig:0,
      polInv:0, invIni:0, isr:0,
      cats:[
        { nombre:'Sueldos y salarios',  montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Alquiler',            montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Servicios públicos',  montos:[0,0,0], depre:[0,0,0] },
        { nombre:'Depreciación',        montos:[0,0,0], depre:[1,1,1].map(()=>0) },
        { nombre:'Otros gastos',        montos:[0,0,0], depre:[0,0,0] }
      ],
      intereses:[0,0,0],
      cobroContado:0, cobro1:0, cobro2:0,
      ventasPrev:[0,0], pagoContado:0, pago1:0,
      comprasPrev:0, otros:[0,0,0], saldoIni:0, saldoMin:0,
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
    (cats||[]).forEach(c => { g += (c.montos[mes]||0); dep += (c.depre[mes]||0); });
    return { gastos:g, depre:dep };
  },

  operativo(d) {
    const da = Presupuestos.aplicarEscenario(d);
    const res = []; let invIni = da.invIni;
    for (let i=0;i<3;i++) {
      const u        = da.unidades[i];
      const sig      = i<2 ? da.unidades[i+1] : da.unidadesSig;
      const invFin   = sig * da.polInv / 100;
      const comprasU = u + invFin - invIni;
      const ventas   = u * da.precio;
      const compras  = comprasU * da.costoU;
      const costoVentas = invIni*da.costoU + compras - invFin*da.costoU;
      const utilidadBruta = ventas - costoVentas;
      const { gastos, depre } = Presupuestos.sumarCats(da.cats, i);
      const int      = (da.intereses||[])[i]||0;
      const uaii     = utilidadBruta - gastos;
      const uai      = uaii - int;
      const impuesto = uai>0 ? uai*da.isr/100 : 0;
      res.push({ u, invIni, comprasU, invFin, ventas, compras, costoVentas,
        utilidadBruta, gastos, depre, intereses:int, uaii, uai, impuesto, un:uai-impuesto });
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
    for (let i=0;i<3;i++) {
      const cobros      = V[i+2]*da.cobroContado/100 + V[i+1]*da.cobro1/100 + V[i]*da.cobro2/100;
      const pagoCompras = C[i+1]*da.pagoContado/100  + C[i]*p1/100;
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

  // ── Tabla: Presupuesto operativo ──────────────────────────────────────────
  tablaOperativo(d, op) {
    const M=d.meses, U=Presupuestos.U;
    const filaM = (n, f, esU, conTotal, cls) => {
      const fmt = esU ? U : Fmt.moneda;
      const tot = conTotal ? fmt(op.reduce((s,o)=>s+f(o),0)) : '';
      return '<tr class="'+(cls||'')+'"><td>'+n+'</td>'+op.map(o=>'<td>'+fmt(f(o))+'</td>').join('')+'<td>'+tot+'</td></tr>';
    };
    let filasCats = '';
    (d.cats||[]).forEach((c,ci)=>{
      filasCats += filaM(c.nombre, (o,i)=>(c.montos[op.indexOf(o)]||0), false, true);
    });
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th><th>'+M[0]+'</th><th>'+M[1]+'</th><th>'+M[2]+'</th><th>Total</th></tr>'+
      '<tr class="sub"><td colspan="5">Presupuesto de ventas</td></tr>'+
      filaM('Ventas (unidades)', o=>o.u, true, true)+
      filaM('Precio de venta unitario (C$)', ()=>d.precio, false, false)+
      filaM('Total ventas (C$)', o=>o.ventas, false, true, 'total')+
      '<tr class="sub"><td colspan="5">Presupuesto de compras e inventario</td></tr>'+
      filaM('(+) Inventario final deseado (unidades)', o=>o.invFin, true, false)+
      filaM('(−) Inventario inicial (unidades)', o=>o.invIni, true, false)+
      filaM('Compras necesarias (unidades)', o=>o.comprasU, true, true, 'total')+
      filaM('Costo unitario (C$)', ()=>d.costoU, false, false)+
      filaM('Total compras (C$)', o=>o.compras, false, true, 'total')+
      '<tr class="sub"><td colspan="5">Presupuesto de costo de ventas</td></tr>'+
      filaM('(+) Inventario inicial valorado', o=>o.invIni*d.costoU, false, false)+
      filaM('(+) Compras (C$)', o=>o.compras, false, true)+
      filaM('(−) Inventario final valorado', o=>o.invFin*d.costoU, false, false)+
      filaM('Costo de ventas', o=>o.costoVentas, false, true, 'total')+
      '<tr class="sub"><td colspan="5">Presupuesto de gastos de operación</td></tr>'+
      filasCats+
      filaM('Total gastos de operación', o=>o.gastos, false, true, 'total')+
      '<tr class="sub"><td colspan="5">Estado de resultados presupuestado</td></tr>'+
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

  // ── Tabla: Presupuesto de caja ────────────────────────────────────────────
  tablaCaja(d, ca) {
    const M=d.meses;
    const f=(n,g,cls)=>'<tr class="'+(cls||'')+'"><td>'+n+'</td>'+ca.map(c=>'<td>'+Fmt.moneda(g(c))+'</td>').join('')+'</tr>';
    const sep=t=>'<tr class="sub"><td colspan="4">'+t+'</td></tr>';
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th><th>'+M[0]+'</th><th>'+M[1]+'</th><th>'+M[2]+'</th></tr>'+
      sep('Saldo inicial')+
      f('Saldo inicial de caja', c=>c.ini)+
      sep('Cobros (entradas de efectivo)')+
      f('(+) Cobros de ventas', c=>c.cobros, 'total')+
      sep('Pagos (salidas de efectivo)')+
      f('(−) Pago de compras a proveedores', c=>c.pagoCompras)+
      f('(−) Gastos de operación en efectivo (sin depreciación)', c=>c.gastosEf)+
      f('(−) Intereses', c=>c.intereses)+
      f('(−) Impuesto sobre la renta', c=>c.impuesto)+
      f('(−) Otros desembolsos', c=>c.otros)+
      f('Total de pagos', c=>c.pagos, 'total')+
      sep('Resultado del período')+
      f('Saldo final de caja', c=>c.final, 'total')+
      sep('Control del mínimo de caja')+
      f('Saldo mínimo deseado', ()=>Presupuestos._min)+
      f('Excedente (+) o faltante (−) frente al mínimo', c=>c.excedente, 'total')+
      sep('Financiamiento')+
      f('Financiamiento requerido', c=>c.financiar)+
      '</table></div>';
  },

  // ── Tabla: Resumen del Presupuesto Maestro ────────────────────────────────
  // Este es el resumen ejecutivo que el docente necesita ver: todos los
  // sub-presupuestos integrados con sus totales del período completo.
  tablaPresupuestoMaestro(d, op, ca) {
    const M   = d.meses;
    const sep = (t, nota) =>
      '<tr class="sub"><td colspan="'+(M.length+2)+'">'+t+(nota?'<span style="font-weight:normal;font-size:0.88em;margin-left:8px;opacity:.75">'+nota+'</span>':'')+'</td></tr>';

    // Totales acumulados del período
    const totVentas   = op.reduce((s,o)=>s+o.ventas,0);
    const totCompras  = op.reduce((s,o)=>s+o.compras,0);
    const totCosto    = op.reduce((s,o)=>s+o.costoVentas,0);
    const totGastos   = op.reduce((s,o)=>s+o.gastos,0);
    const totUB       = op.reduce((s,o)=>s+o.utilidadBruta,0);
    const totUAII     = op.reduce((s,o)=>s+o.uaii,0);
    const totInt      = op.reduce((s,o)=>s+o.intereses,0);
    const totUAI      = op.reduce((s,o)=>s+o.uai,0);
    const totImp      = op.reduce((s,o)=>s+o.impuesto,0);
    const totUN       = op.reduce((s,o)=>s+o.un,0);
    const totCobros   = ca.reduce((s,c)=>s+c.cobros,0);
    const totPagos    = ca.reduce((s,c)=>s+c.pagos,0);
    const totFinan    = ca.reduce((s,c)=>s+c.financiar,0);

    // Gastos por categoría — totales
    const catTotales  = (d.cats||[]).map(c=>({ nombre:c.nombre, total:c.montos.reduce((s,v)=>s+v,0) }));

    const fila = (nombre, vals, total, cls, indent) => {
      const prefix = indent ? '<span style="padding-left:16px;display:inline-block">'+nombre+'</span>' : nombre;
      return '<tr class="'+(cls||'')+'"><td>'+prefix+'</td>'+
        vals.map(v=>'<td>'+Fmt.moneda(v)+'</td>').join('')+
        '<td><strong>'+Fmt.moneda(total)+'</strong></td></tr>';
    };

    let filaCats = '';
    catTotales.forEach(c => {
      filaCats += '<tr><td><span style="padding-left:16px;display:inline-block">'+esc(c.nombre)+'</span></td>'+
        (d.cats[catTotales.indexOf(c)].montos.map(v=>'<td>'+Fmt.moneda(v)+'</td>').join(''))+
        '<td>'+Fmt.moneda(c.total)+'</td></tr>';
    });

    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Componente del Presupuesto Maestro</th>'+
        M.map(m=>'<th>'+m+'</th>').join('')+
        '<th>Total período</th></tr>'+

      // 1. Presupuesto de ventas
      sep('1. Presupuesto de ventas')+
      fila('Unidades vendidas', op.map(o=>o.u*d.precio*0).map((_,i)=>op[i].u),
        op.reduce((s,o)=>s+o.u,0), '', false)+
      fila('Ingresos por ventas (C$)', op.map(o=>o.ventas), totVentas, 'total')+

      // 2. Presupuesto de compras
      sep('2. Presupuesto de compras')+
      fila('Total compras (C$)', op.map(o=>o.compras), totCompras)+
      fila('Inventario final valorado (C$)', op.map(o=>o.invFin*d.costoU),
        op[2].invFin*d.costoU)+

      // 3. Presupuesto de costo de ventas
      sep('3. Presupuesto de costo de ventas')+
      fila('Costo de ventas (C$)', op.map(o=>o.costoVentas), totCosto, 'total')+

      // 4. Presupuesto de gastos de operación
      sep('4. Presupuesto de gastos de operación')+
      filaCats+
      fila('Total gastos de operación (C$)', op.map(o=>o.gastos), totGastos, 'total')+

      // 5. Estado de resultados presupuestado
      sep('5. Estado de resultados presupuestado')+
      fila('Ventas', op.map(o=>o.ventas), totVentas)+
      fila('(−) Costo de ventas', op.map(o=>o.costoVentas), totCosto)+
      fila('Utilidad bruta', op.map(o=>o.utilidadBruta), totUB, 'total')+
      fila('(−) Gastos de operación', op.map(o=>o.gastos), totGastos)+
      fila('Utilidad operativa (UAII)', op.map(o=>o.uaii), totUAII, 'total')+
      fila('(−) Intereses', op.map(o=>o.intereses), totInt)+
      fila('(−) Impuesto sobre la renta', op.map(o=>o.impuesto), totImp)+
      fila('Utilidad neta', op.map(o=>o.un), totUN, 'total')+

      // 6. Presupuesto de caja
      sep('6. Presupuesto de caja')+
      fila('Saldo inicial de caja', ca.map(c=>c.ini), ca[0].ini)+
      fila('(+) Cobros de ventas', ca.map(c=>c.cobros), totCobros)+
      fila('(−) Total pagos', ca.map(c=>c.pagos), totPagos)+
      fila('Saldo final de caja', ca.map(c=>c.final), ca[2].final, 'total')+

      // 7. Financiamiento requerido
      sep('7. Financiamiento requerido', '(solo meses con saldo bajo el mínimo deseado)')+
      fila('Saldo mínimo deseado (C$)', ca.map(()=>d.saldoMin), d.saldoMin)+
      fila('Excedente (+) / Faltante (−)', ca.map(c=>c.excedente), ca[2].excedente, 'total')+
      fila('Financiamiento a gestionar (C$)', ca.map(c=>c.financiar), totFinan,
        totFinan>0 ? 'mal' : '')+

      // 8. Saldo final proyectado (cierre)
      sep('8. Saldo final proyectado')+
      fila('Saldo de caja al cierre del período (C$)', ca.map(c=>c.final), ca[2].final, 'total')+
      fila('Utilidad neta acumulada (C$)', op.map(o=>o.un), totUN, 'total')+

      '</table></div>';
  },

  // ── Tabla: Comparación real vs presupuestado ──────────────────────────────
  tablaComparacion(d, op) {
    const r  = d.reales||{};
    const rv = r.ventas||[0,0,0], rc=r.costoVentas||[0,0,0],
          rg = r.gastosTotales||[0,0,0], ru=r.utilidadNeta||[0,0,0];
    if (!rv.some(v=>v!==0)&&!rc.some(v=>v!==0))
      return '<div class="aviso">Cuando tengas los datos reales del período, ingrésalos aquí para ver qué tanto se cumplió el presupuesto.</div>';
    const M=d.meses;
    const fila=(n,pArr,rArr)=>{
      let cells='';
      pArr.forEach((p,i)=>{
        const dif=rArr[i]-p, cls=dif>=0?'bien':'mal';
        cells+='<td>'+Fmt.moneda(p)+'</td><td>'+Fmt.moneda(rArr[i])+'</td><td class="cuadre '+cls+'">'+Fmt.moneda(dif)+'</td>';
      });
      return '<tr><td>'+n+'</td>'+cells+'</tr>';
    };
    return '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Concepto</th>'+M.map(m=>'<th>'+m+' Pres.</th><th>'+m+' Real</th><th>'+m+' Dif.</th>').join('')+'</tr>'+
      fila('Ventas', op.map(o=>o.ventas), rv)+
      fila('Costo de ventas', op.map(o=>o.costoVentas), rc)+
      fila('Gastos de operación', op.map(o=>o.gastos), rg)+
      fila('Utilidad neta', op.map(o=>o.un), ru)+
      '</table></div>';
  },

  limpiar() { Presupuestos.grafs.forEach(g=>{ try{g.destroy();}catch(e){} }); Presupuestos.grafs=[]; },

  graficos(raiz, d, op, ca) {
    Presupuestos.limpiar();
    if (typeof Chart==='undefined') return;
    const g1=raiz.querySelector('#pr-g1'), g2=raiz.querySelector('#pr-g2'), g3=raiz.querySelector('#pr-g3');
    if (g1) Presupuestos.grafs.push(new Chart(g1,{
      type:'bar', data:{ labels:d.meses, datasets:[
        { label:'Cobros', data:ca.map(c=>c.cobros), backgroundColor:'#2d6a4f' },
        { label:'Pagos',  data:ca.map(c=>c.pagos),  backgroundColor:'#b5d5c5' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
    }));
    if (g2) Presupuestos.grafs.push(new Chart(g2,{
      type:'line', data:{ labels:d.meses, datasets:[
        { label:'Saldo final', data:ca.map(c=>c.final), borderColor:'#2d6a4f', backgroundColor:'rgba(45,106,79,0.1)', borderWidth:2, fill:true },
        { label:'Saldo mínimo', data:ca.map(()=>d.saldoMin), borderColor:'#b25555', borderDash:[6,4], borderWidth:2, pointRadius:0, fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
    }));
    if (g3) Presupuestos.grafs.push(new Chart(g3,{
      type:'bar', data:{ labels:d.meses, datasets:[
        { label:'Ventas',          data:op.map(o=>o.ventas),       backgroundColor:'#1b4332' },
        { label:'Compras',         data:op.map(o=>o.compras),      backgroundColor:'#40916c' },
        { label:'Costo de ventas', data:op.map(o=>o.costoVentas),  backgroundColor:'#74c69d' },
        { label:'Gastos operación',data:op.map(o=>o.gastos),       backgroundColor:'#d8f3dc' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
    }));
  },

  inp(id, v, tipo) {
    return '<input type="text" inputmode="decimal" data-validar="'+(tipo||'numero')+'" id="'+id+'" value="'+(v||0)+
      '" style="text-align:right;padding:6px 8px;min-width:90px">';
  },
  campo(id, et, v) {
    return '<label class="campo corto" style="flex:1;min-width:150px">'+et+
      '<input type="text" inputmode="decimal" data-validar="numero" id="'+id+'" value="'+(v||0)+'"></label>';
  },
  filaIn(et, base, arr) {
    return '<tr><td>'+et+'</td>'+[0,1,2].map(i=>'<td>'+Presupuestos.inp(base+'-'+i,arr[i])+'</td>').join('')+'</tr>';
  },

  renderCats(d) {
    const P=Presupuestos;
    let html='<div class="tarjeta"><h3 class="titulo-seccion" style="margin-top:0">Gastos de operación por categoría</h3>'+
      '<div class="aviso" style="margin-bottom:10px">Incluye en cada categoría el total (efectivo + depreciación). En la fila "depreciación" indica la parte que NO es salida de caja.</div>'+
      '<div class="tabla-scroll"><table class="tabla-datos">'+
      '<tr><th>Categoría</th><th class="mes-0">'+d.meses[0]+'</th><th class="mes-1">'+d.meses[1]+'</th><th class="mes-2">'+d.meses[2]+'</th></tr>';
    (d.cats||[]).forEach((c,ci)=>{
      html+='<tr><td><input type="text" data-validar="nombre" id="pr-cat-nom-'+ci+'" value="'+esc(c.nombre)+'" style="min-width:140px"></td>'+
        [0,1,2].map(i=>'<td>'+P.inp('pr-cat-'+ci+'-'+i,c.montos[i])+'</td>').join('')+'</tr>'+
        '<tr style="font-size:0.9em;color:#555"><td style="padding-left:16px">— de los cuales depreciación</td>'+
        [0,1,2].map(i=>'<td>'+P.inp('pr-catd-'+ci+'-'+i,c.depre[i])+'</td>').join('')+'</tr>';
    });
    html+='</table></div></div>';
    return html;
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
        '<button class="btn sec" id="pr-desde-ef">Usar datos de estados financieros</button>'+
        '<button class="btn sec peligro" id="pr-limpiar">Limpiar datos</button>'+
      '</div>'+
      '<div class="pestanas">'+tabs.map((t,i)=>'<button class="pest'+(i===0?' activa':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+

      // ── Tab: operativo ──────────────────────────────────────────────────────
      '<div id="sec-oper">'+
        '<div class="aviso">Compras = Ventas + Inventario final deseado − Inventario inicial. '+
        'Inventario final deseado = % de las ventas del mes siguiente. '+
        'Costo de ventas = Inventario inicial + Compras − Inventario final.</div>'+
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
        '<h2 class="titulo-seccion">Resultados del presupuesto operativo</h2>'+
        '<div class="tarjeta" id="pr-tabla-op"></div>'+
        '<div class="dos-col" style="margin-top:14px">'+
          '<div class="tarjeta"><h3>Relación ventas, compras, costos y gastos</h3><div class="grafico"><canvas id="pr-g3"></canvas></div></div>'+
        '</div>'+
      '</div>'+

      // ── Tab: caja ───────────────────────────────────────────────────────────
      '<div id="sec-caja" style="display:none">'+
        '<div class="aviso">Saldo final = Saldo inicial + Cobros − Pagos. '+
        'La depreciación no es salida de caja y el costo de ventas no se paga dos veces: se pagan las <em>compras</em>, no el costo de ventas.</div>'+
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
        '<div class="aviso" style="margin-top:8px"><strong>¿Qué es el financiamiento requerido?</strong> '+
        'Si el saldo final de caja queda por debajo del mínimo deseado, la diferencia es lo que habría que conseguir '+
        '(préstamo, aporte de socios, cobros anticipados) para mantener ese colchón de efectivo. '+
        'Aparece en la fila "Financiamiento requerido" solo cuando el valor es mayor que cero.</div>'+
        '<div class="aviso" id="pr-alerta" style="margin-top:14px"></div>'+
        '<div class="dos-col" style="margin-top:14px">'+
          '<div class="tarjeta"><h3>Cobros vs pagos</h3><div class="grafico"><canvas id="pr-g1"></canvas></div></div>'+
          '<div class="tarjeta"><h3>Saldo de efectivo proyectado</h3><div class="grafico"><canvas id="pr-g2"></canvas></div></div>'+
        '</div>'+
      '</div>'+

      // ── Tab: Presupuesto maestro ────────────────────────────────────────────
      '<div id="sec-maestro" style="display:none">'+
        '<div class="aviso">'+
          'El <strong>presupuesto maestro</strong> integra todos los sub-presupuestos en un solo documento. '+
          'Muestra cómo las ventas planeadas determinan las compras necesarias, el costo de ventas, '+
          'los gastos de operación y la utilidad, y cómo todo eso se traduce en entradas y salidas de efectivo.'+
        '</div>'+
        '<div class="tarjeta" id="pr-tabla-maestro"></div>'+
      '</div>'+

      // ── Tab: Real vs presupuestado ──────────────────────────────────────────
      '<div id="sec-comp" style="display:none">'+
        '<div class="aviso">Ingresa los datos reales del período para ver qué tanto se cumplió el presupuesto. Verde = superó lo planeado; rojo = quedó por debajo.</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Dato real</th><th class="mes-0"></th><th class="mes-1"></th><th class="mes-2"></th></tr>'+
          P.filaIn('Ventas reales (C$)',              'pr-rv', (d.reales||{}).ventas       ||[0,0,0])+
          P.filaIn('Costo de ventas real (C$)',       'pr-rc', (d.reales||{}).costoVentas  ||[0,0,0])+
          P.filaIn('Gastos de operación reales (C$)', 'pr-rg', (d.reales||{}).gastosTotales||[0,0,0])+
          P.filaIn('Utilidad neta real (C$)',         'pr-ru', (d.reales||{}).utilidadNeta ||[0,0,0])+
        '</table></div></div>'+
        '<h2 class="titulo-seccion">Comparación</h2>'+
        '<div class="tarjeta" id="pr-tabla-comp"></div>'+
      '</div>'+

      // ── Tab: Escenarios ─────────────────────────────────────────────────────
      '<div id="sec-esc" style="display:none">'+
        '<div class="aviso">Ajusta los factores de cada escenario y elige cuál ver en las demás pestañas. El escenario solo afecta las <strong>unidades vendidas</strong> y el <strong>precio de venta</strong>; los gastos, cobros y pagos se mantienen iguales.</div>'+
        '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Escenario</th><th>Factor de unidades</th><th>Factor de precio</th><th>Activo</th></tr>'+
          ['base','optimista','pesimista'].map(esc=>{
            const e=((d.escenarios||{})[esc])||{ factorUnidades:1, factorPrecio:1 };
            return '<tr>'+
              '<td>'+esc.charAt(0).toUpperCase()+esc.slice(1)+'</td>'+
              '<td>'+P.inp('pr-esc-u-'+esc,e.factorUnidades)+'</td>'+
              '<td>'+P.inp('pr-esc-p-'+esc,e.factorPrecio)+'</td>'+
              '<td style="text-align:center"><input type="radio" name="pr-esc-sel" value="'+esc+'"'+(d.escenario===esc?' checked':'')+'></td>'+
              '</tr>';
          }).join('')+
        '</table></div></div>'+
        '<h2 class="titulo-seccion">Comparación de utilidad neta por escenario</h2>'+
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
        base:      { factorUnidades:n('#pr-esc-u-base'),      factorPrecio:n('#pr-esc-p-base') },
        optimista: { factorUnidades:n('#pr-esc-u-optimista'),  factorPrecio:n('#pr-esc-p-optimista') },
        pesimista: { factorUnidades:n('#pr-esc-u-pesimista'),  factorPrecio:n('#pr-esc-p-pesimista') }
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

      if (q('#pr-tabla-op'))      q('#pr-tabla-op').innerHTML      = P.tablaOperativo(x,op);
      if (q('#pr-tabla-caja'))    q('#pr-tabla-caja').innerHTML    = P.tablaCaja(x,ca);
      if (q('#pr-tabla-maestro')) q('#pr-tabla-maestro').innerHTML = P.tablaPresupuestoMaestro(x,op,ca);
      if (q('#pr-tabla-comp'))    q('#pr-tabla-comp').innerHTML    = P.tablaComparacion(x,op);

      // Validaciones cobros y pagos
      const sumaC=x.cobroContado+x.cobro1+x.cobro2;
      const sumaP=x.pagoContado +x.pago1;
      if (q('#pr-avisoc')) q('#pr-avisoc').innerHTML=Math.abs(sumaC-100)>1e-9
        ?'<div class="cuadre mal">Los porcentajes de cobro suman '+Fmt.num(sumaC,2)+' %; deben sumar exactamente 100 %.</div>':'';
      if (q('#pr-avisop')) q('#pr-avisop').innerHTML=Math.abs(sumaP-100)>1e-9
        ?'<div class="cuadre mal">Los porcentajes de pago suman '+Fmt.num(sumaP,2)+' %; deben sumar exactamente 100 %.</div>':'';

      // Alerta financiamiento
      const falta=ca.map((c,i)=>c.financiar>0?x.meses[i]+' ('+Fmt.moneda(c.financiar)+')':null).filter(Boolean);
      if (q('#pr-alerta')) q('#pr-alerta').innerHTML=falta.length
        ?'<strong>Alerta de financiamiento:</strong> el saldo queda por debajo del mínimo en '+falta.join(', ')+'. Se recomienda revisar cobros, ajustar pagos o gestionar financiamiento externo.'
        :'Sin alerta: el saldo de caja se mantiene en o sobre el mínimo deseado en los tres meses. Saldo final del último mes: '+Fmt.moneda(ca[2].final)+'.';

      // Tabla de escenarios
      if (q('#pr-tabla-esc')) {
        const escN=['base','optimista','pesimista'];
        q('#pr-tabla-esc').innerHTML='<div class="tabla-scroll"><table class="tabla-datos">'+
          '<tr><th>Mes</th><th>Base</th><th>Optimista</th><th>Pesimista</th></tr>'+
          x.meses.map((m,i)=>{
            const uns=escN.map(esc=>P.operativo(Object.assign({},x,{escenario:esc}))[i].un);
            return '<tr><td>'+m+'</td>'+uns.map(u=>'<td>'+Fmt.moneda(u)+'</td>').join('')+'</tr>';
          }).join('')+
          '</table></div>';
      }

      // Gráficos
      if (tabActivo==='caja') { P.graficos(raiz,x,op,ca); }
      else if (tabActivo==='oper') {
        const g3=q('#pr-g3');
        if (g3) {
          if (g3._chart) { try{ g3._chart.destroy(); }catch(e){} }
          if (typeof Chart!=='undefined') g3._chart=new Chart(g3,{
            type:'bar', data:{ labels:x.meses, datasets:[
              { label:'Ventas',          data:op.map(o=>o.ventas),       backgroundColor:'#1b4332' },
              { label:'Compras',         data:op.map(o=>o.compras),      backgroundColor:'#40916c' },
              { label:'Costo de ventas', data:op.map(o=>o.costoVentas),  backgroundColor:'#74c69d' },
              { label:'Gastos operación',data:op.map(o=>o.gastos),       backgroundColor:'#d8f3dc' }
            ]},
            options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
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

    // Botón: usar saldo de estados financieros como saldo inicial de caja
    q('#pr-desde-ef').addEventListener('click',()=>{
      try {
        const ef=Datos.leer('estados',null);
        if (!ef||!ef.cuentas){ alert('No hay datos de estados financieros guardados. Ve a ese módulo y guarda los datos primero.'); return; }
        const cajaCuenta=(ef.cuentas||[]).find(c=>/caja|banco|efectivo/i.test(c.nombre||''));
        if (cajaCuenta){
          const vals=cajaCuenta.saldos||cajaCuenta.valores||[];
          const ultimo=vals[vals.length-1]||0;
          if (q('#pr-si')) q('#pr-si').value=Fmt.num(ultimo,2);
        }
        alert('Se tomó el saldo de caja/bancos del último período de los estados financieros como saldo inicial. Revisa y ajusta los demás datos.');
        refrescar();
      } catch(e){ alert('No fue posible leer los estados financieros.'); }
    });

    q('#pr-ejemplo').addEventListener('click',()=>{ Datos.guardar('presupuestos',P.ejemplo()); P.render(el); Validar.activar(el); });
    q('#pr-limpiar').addEventListener('click',()=>{
      if (confirm('¿Borrar los datos de presupuestos?')){ Datos.guardar('presupuestos',P.vacio()); P.render(el); Validar.activar(el); }
    });

    refrescar();
    Validar.activar(el);
  }
};

Modulos.presupuestos = {
  titulo: 'Planeación y presupuestos',
  subtitulo: 'Presupuesto maestro: ventas, compras, costo de ventas, gastos, estado de resultados y presupuesto de caja',
  render(el) { Presupuestos.render(el); }
};