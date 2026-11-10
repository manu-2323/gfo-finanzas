// Módulo 8: Presupuesto personal — versión con iconografía SVG estética
const Personal = {
  graf: null,
  grafEvo: null,
  CATS: ['Vivienda','Alimentación','Transporte','Educación','Salud','Servicios','Entretenimiento','Otros'],
  TIPOS: ['Fijo','Variable'],

  // Iconos SVG limpios, minimalistas y profesionales para cada categoría
  ICONS: {
    Vivienda: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    Alimentación: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    Transporte: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 10h22"/></svg>',
    Educación: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    Salud: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z"/></svg>',
    Servicios: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    Entretenimiento: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
    Otros: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  },

  ejemplo() {
    return {
      ingresos: [{ n: 'Salario', m: 15000 }, { n: 'Trabajo extra', m: 3000 }],
      gastos:    [{ n: 'Alquiler',         c: 'Vivienda',        t: 'Fijo',      m: 5000 },
                  { n: 'Comida',            c: 'Alimentación',    t: 'Variable', m: 4500 },
                  { n: 'Pasajes',           c: 'Transporte',      t: 'Variable', m: 1500 },
                  { n: 'Internet y celular',c: 'Servicios',       t: 'Fijo',      m: 1200 },
                  { n: 'Salidas',           c: 'Entretenimiento', t: 'Variable', m: 1000 }],
      meta: 20
    };
  },

  /* ---- PERSISTENCIA ---- */
  obtener()          { return Datos.leer('personal',  { ingresos:[], gastos:[], meta:20 }); },
  obtenerHistorial() { return Datos.leer('personal_hist', []); },
  guardarHistorial(h){ Datos.guardar('personal_hist', h); },

  /* ---- CÁLCULOS ---- */
  calcular(x) {
    const totalIng = x.ingresos.reduce((s,i)=>s+i.m, 0);
    const totalGas = x.gastos.reduce((s,g)=>s+g.m, 0);
    const saldo      = totalIng - totalGas;
    const capacidad  = totalIng ? saldo / totalIng : NaN;
    const metaMonto  = totalIng * x.meta / 100;
    const porCat     = Personal.CATS
      .map(c=>({ c, m: x.gastos.filter(g=>g.c===c).reduce((s,g)=>s+g.m,0) }))
      .filter(z=>z.m>0)
      .sort((a,b)=>b.m-a.m);
    const mayorCat   = porCat.length ? porCat[0] : null;
    const totalFijo  = x.gastos.filter(g=>g.t==='Fijo').reduce((s,g)=>s+g.m,0);
    const totalVar   = x.gastos.filter(g=>g.t==='Variable').reduce((s,g)=>s+g.m,0);
    return { totalIng, totalGas, saldo, capacidad, metaMonto, porCat, mayorCat, totalFijo, totalVar };
  },

  /* ---- FILAS HTML ---- */
  filaIng(i) {
    return '<tr class="ing">' +
      '<td><input type="text" data-validar="nombre" data-k="n" value="'+i.n+'"></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="'+i.m+'"></td>' +
      '<td><button class="btn sec quitar" title="Quitar">✕</button></td></tr>';
  },
  filaGas(g) {
    const sel = k => Personal.CATS.map(c=>'<option'+(c===k?' selected':'')+'>'+c+'</option>').join('');
    const selT= k => Personal.TIPOS.map(t=>'<option'+(t===k?' selected':'')+'>'+t+'</option>').join('');
    return '<tr class="gas">' +
      '<td><input type="text" data-validar="nombre" data-k="n" value="'+g.n+'"></td>' +
      '<td><select data-k="c">'+sel(g.c)+'</select></td>' +
      '<td><select data-k="t" class="pe-tipo-sel">'+selT(g.t||'Variable')+'</select></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="'+g.m+'"></td>' +
      '<td><button class="btn sec quitar" title="Quitar">✕</button></td></tr>';
  },

  /* ---- RENDER ---- */
  render(el) {
    const x0  = Personal.obtener();
    const hist = Personal.obtenerHistorial();
    const raiz = document.createElement('div');

    // Iconos SVG reutilizables para la estructura visual
    const svgInfo = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    const svgDisk = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
    const svgAlerta = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    raiz.innerHTML =
      /* ── Banner de aviso ── */
      '<div class="aviso" style="margin-bottom:16px;display:flex;align-items:center;gap:10px">'+
        svgInfo +
        '<div><strong>Presupuesto personal independiente.</strong> Registra ingresos y gastos del mes, fija tu meta de ahorro y guarda el historial mensual para comparar tu evolución.</div>'+
      '</div>'+

      /* ── Tabs historial ── */
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">'+
        '<div class="pestanas" id="pe-tabs"></div>'+
        '<button class="btn" id="pe-guardar-mes" title="Guardar como nuevo mes en el historial" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">' + svgDisk + ' Guardar mes</button>'+
      '</div>'+

      /* ── Alerta gastos > ingresos ── */
      '<div id="pe-alerta" style="display:none;background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;color:var(--malo);margin-bottom:14px;font-weight:600;display:flex;align-items:center;gap:10px">'+
        svgAlerta + '<span id="pe-alerta-txt"></span>'+
      '</div>'+

      /* ── Tablas de entrada ── */
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta">'+
          '<h3 style="margin-bottom:10px">Ingresos del mes (C$)</h3>'+
          '<table class="tabla-datos" id="pe-ing">'+
            '<tr><th>Concepto</th><th style="text-align:right">Monto</th><th></th></tr>'+
            x0.ingresos.map(Personal.filaIng).join('')+
          '</table>'+
          '<div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-ing">+ Agregar ingreso</button></div>'+
        '</div>'+
        '<div class="tarjeta">'+
          '<h3 style="margin-bottom:10px">Gastos del mes (C$)</h3>'+
          '<table class="tabla-datos" id="pe-gas">'+
            '<tr><th>Concepto</th><th>Categoría</th><th>Tipo</th><th style="text-align:right">Monto</th><th></th></tr>'+
            x0.gastos.map(Personal.filaGas).join('')+
          '</table>'+
          '<div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-gas">+ Agregar gasto</button></div>'+
        '</div>'+
      '</div>'+

      /* ── Controles meta ── */
      '<div class="barra-acciones" style="margin-bottom:14px">'+
        '<label class="campo corto" style="min-width:200px">Meta de ahorro (% de ingresos)'+
          '<input type="text" inputmode="decimal" data-validar="numero" id="pe-meta" value="'+x0.meta+'">'+
        '</label>'+
        '<button class="btn sec" id="pe-ejemplo">Cargar ejemplo</button>'+
        '<button class="btn sec peligro" id="pe-limpiar">Limpiar datos</button>'+
      '</div>'+

      /* ── KPIs ── */
      '<div class="rejilla" id="pe-tarjetas" style="margin-bottom:14px"></div>'+

      /* ── Resumen fijos / variables ── */
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta" id="pe-bloque-tipos"></div>'+
        '<div class="tarjeta" id="pe-bloque-mayor"></div>'+
      '</div>'+

      /* ── Tabla categorías + Doughnut ── */
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta"><h3 style="margin-bottom:10px">Gastos por categoría</h3><div id="pe-cats"></div></div>'+
        '<div class="tarjeta"><h3 style="margin-bottom:10px">Distribución de los gastos</h3><div class="grafico"><canvas id="pe-grafico"></canvas></div></div>'+
      '</div>'+

      /* ── Comparación historial ── */
      '<div class="tarjeta" id="pe-bloque-evo" style="margin-bottom:14px">'+
        '<h3 style="margin-bottom:14px">Evolución del ahorro</h3>'+
        '<div class="grafico"><canvas id="pe-grafico-evo"></canvas></div>'+
        '<p id="pe-evo-vacio" style="color:var(--suave);font-size:13px;margin-top:10px;display:none">'+
          'Guarda al menos dos meses para ver la evolución.'+
        '</p>'+
      '</div>'+

      /* ── Comparación de meses ── */
      '<div class="tarjeta" id="pe-bloque-comp">'+
        '<h3 style="margin-bottom:14px">Comparar meses</h3>'+
        '<div id="pe-comp-contenido"></div>'+
      '</div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    const q = id => raiz.querySelector(id);
    const leer = () => {
      const val = (tr,k) => tr.querySelector('[data-k="'+k+'"]').value;
      return {
        ingresos: [...raiz.querySelectorAll('tr.ing')].map(t=>({ n:val(t,'n'), m:Fmt.aNum(val(t,'m')) })),
        gastos:   [...raiz.querySelectorAll('tr.gas')].map(t=>({ n:val(t,'n'), c:val(t,'c'), t:val(t,'t')||'Variable', m:Fmt.aNum(val(t,'m')) })),
        meta: Fmt.aNum(q('#pe-meta').value)
      };
    };

    /* ── Render del historial en tabs ── */
    const renderTabs = () => {
      const h = Personal.obtenerHistorial();
      const tabsEl = q('#pe-tabs');
      if (!h.length) { tabsEl.innerHTML = '<span style="color:var(--suave);font-size:13px">Sin meses guardados aún</span>'; return; }
      tabsEl.innerHTML = h.map((m,i)=>
        '<button class="pest" data-idx="'+i+'">'+m.etiqueta+'</button>'
      ).join('');
    };

    /* ── Render de comparación de meses ── */
    const renderComp = () => {
      const h = Personal.obtenerHistorial();
      const cont = q('#pe-comp-contenido');
      if (h.length < 2) {
        cont.innerHTML = '<p style="color:var(--suave);font-size:13px">Guarda al menos dos meses para comparar.</p>';
        return;
      }
      cont.innerHTML =
        '<table class="tabla-datos"><thead>'+
        '<tr><th>Mes</th><th style="text-align:right">Ingresos</th><th style="text-align:right">Gastos</th>'+
        '<th style="text-align:right">Saldo</th><th style="text-align:right">Ahorro real</th><th style="text-align:right">Meta ahorro</th></tr>'+
        '</thead><tbody>'+
        h.map(m => {
          const c = Personal.calcular(m);
          const cumple = c.saldo >= c.metaMonto;
          return '<tr>'+
            '<td><strong>'+m.etiqueta+'</strong></td>'+
            '<td style="text-align:right">'+Fmt.moneda(c.totalIng)+'</td>'+
            '<td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td>'+
            '<td style="text-align:right;color:'+(c.saldo>=0?'var(--ok)':'var(--malo)')+'">'+Fmt.moneda(c.saldo)+'</td>'+
            '<td style="text-align:right">'+Fmt.pct(c.capacidad)+'</td>'+
            '<td style="text-align:right;color:'+(cumple?'var(--ok)':'var(--malo)')+'">'+Fmt.pct(m.meta/100)+' ('+Fmt.moneda(c.metaMonto)+')</td>'+
            '</tr>';
        }).join('')+
        '</tbody></table>';
    };

    /* ── Gráfica evolución ahorro ── */
    const renderEvoGraf = () => {
      const h = Personal.obtenerHistorial();
      if (Personal.grafEvo) { try{ Personal.grafEvo.destroy(); }catch(e){} Personal.grafEvo=null; }
      if (h.length < 2) {
        q('#pe-evo-vacio').style.display = 'block';
        q('#pe-grafico-evo').style.display = 'none';
        return;
      }
      q('#pe-evo-vacio').style.display = 'none';
      q('#pe-grafico-evo').style.display = 'block';
      if (typeof Chart === 'undefined') return;
      const labels   = h.map(m=>m.etiqueta);
      const ahorros  = h.map(m=>{ const c=Personal.calcular(m); return c.saldo; });
      const metas    = h.map(m=>{ const c=Personal.calcular(m); return c.metaMonto; });
      const ingresos = h.map(m=>{ const c=Personal.calcular(m); return c.totalIng; });
      const gastos   = h.map(m=>{ const c=Personal.calcular(m); return c.totalGas; });
      Personal.grafEvo = new Chart(q('#pe-grafico-evo'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label:'Ahorro real',   data:ahorros,  borderColor:'#0f5c4d', backgroundColor:'rgba(15,92,77,.1)',  tension:.35, fill:true, pointRadius:5 },
            { label:'Meta ahorro',   data:metas,    borderColor:'#8c3b5e', borderDash:[6,4],                     tension:.35, fill:false, pointRadius:4 },
            { label:'Ingresos',      data:ingresos, borderColor:'#1f7a4d', backgroundColor:'rgba(31,122,77,.05)', tension:.35, fill:false, pointRadius:4 },
            { label:'Gastos',        data:gastos,   borderColor:'#b3261e', backgroundColor:'rgba(179,38,30,.05)', tension:.35, fill:false, pointRadius:4 }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom' }, tooltip:{ callbacks:{ label: t=>' '+t.dataset.label+': '+Fmt.moneda(t.raw) } } },
          scales:{ y:{ ticks:{ callback: v=>Fmt.moneda(v) } } }
        }
      });
    };

    /* ── Función principal de refresco ── */
    const refrescar = () => {
      const x = leer();
      Datos.guardar('personal', x);
      const c = Personal.calcular(x);

      /* Alerta gastos > ingresos */
      if (c.saldo < 0) {
        q('#pe-alerta').style.display = 'flex';
        q('#pe-alerta-txt').textContent = 'Tus gastos superan tus ingresos en '+Fmt.moneda(-c.saldo)+'. Revisa tus gastos variables.';
      } else {
        q('#pe-alerta').style.display = 'none';
      }

      /* KPIs con diseño estético SVG */
      const badge = (ok, txt) => '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:'+(ok?'var(--ok-bg)':'var(--malo-bg)')+';color:'+(ok?'var(--ok)':'var(--malo)')+'">'+txt+'</span>';
      
      const T = (icoSVG, t, v, n, extra) =>
        '<div class="tarjeta">'+
          '<h3 style="display:flex;align-items:center;gap:8px"><span style="color:var(--primario);display:inline-flex">'+icoSVG+'</span>'+t+'</h3>'+
          '<div class="valor">'+v+'</div>'+
          '<div class="nota">'+n+'</div>'+
          (extra||'')+
        '</div>';

      const sIng = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
      const sGas = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
      const sSal = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>';
      const sMet = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>';

      q('#pe-tarjetas').innerHTML =
        T(sIng, 'Total de ingresos',   Fmt.moneda(c.totalIng), 'Suma de ingresos del mes') +
        T(sGas,   'Total de gastos',     Fmt.moneda(c.totalGas), 'Suma de gastos del mes') +
        T(sSal,   'Saldo disponible',    Fmt.moneda(c.saldo),    'Ingresos − Gastos',
            '<div style="margin-top:8px">'+badge(c.saldo>=0,'Positivo')+'</div>') +
        T(sMet,   'Capacidad de ahorro', Fmt.pct(c.capacidad),   'Saldo ÷ Ingresos',
            '<div style="margin-top:8px">'+badge(!isNaN(c.capacidad)&&c.saldo>=c.metaMonto,'Meta: '+x.meta+'%')+'</div>');

      /* Bloque fijos / variables */
      q('#pe-bloque-tipos').innerHTML =
        '<h3 style="margin-bottom:10px">Gastos fijos vs variables</h3>'+
        '<table class="tabla-datos">'+
          '<tr><th>Tipo</th><th style="text-align:right">Monto</th><th style="text-align:right">% del total</th></tr>'+
          '<tr><td>Fijos</td><td style="text-align:right">'+Fmt.moneda(c.totalFijo)+'</td>'+
            '<td style="text-align:right">'+Fmt.pct(c.totalGas?c.totalFijo/c.totalGas:NaN)+'</td></tr>'+
          '<tr><td>Variables</td><td style="text-align:right">'+Fmt.moneda(c.totalVar)+'</td>'+
            '<td style="text-align:right">'+Fmt.pct(c.totalGas?c.totalVar/c.totalGas:NaN)+'</td></tr>'+
          '<tr class="total"><td>Total</td><td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td><td style="text-align:right">'+
            (c.totalGas?'100.00 %':'—')+'</td></tr>'+
        '</table>';

      /* Bloque categoría mayor */
      if (c.mayorCat) {
        const pct = c.totalGas ? c.mayorCat.m/c.totalGas : 0;
        q('#pe-bloque-mayor').innerHTML =
          '<h3 style="margin-bottom:10px">Categoría con mayor gasto</h3>'+
          '<div style="display:flex;align-items:center;gap:14px;margin-top:12px">'+
            '<div style="width:42px;height:42px;border-radius:8px;background:var(--arena-2);display:flex;align-items:center;justify-content:center;color:var(--primario)">'+(Personal.ICONS[c.mayorCat.c]||'')+'</div>'+
            '<div>'+
              '<div style="font-family:var(--f-titulo);font-size:20px;font-weight:700;color:var(--primario-2)">'+c.mayorCat.c+'</div>'+
              '<div style="font-size:17px;font-weight:600;margin-top:2px">'+Fmt.moneda(c.mayorCat.m)+'</div>'+
              '<div style="font-size:12px;color:var(--suave);margin-top:1px">'+Fmt.pct(pct)+' del total de gastos</div>'+
            '</div>'+
          '</div>'+
          '<div style="margin-top:14px;background:var(--arena-2);border-radius:6px;height:8px;overflow:hidden">'+
            '<div style="background:var(--primario);height:100%;width:'+(pct*100).toFixed(1)+'%;transition:width .4s ease;border-radius:6px"></div>'+
          '</div>';
      } else {
        q('#pe-bloque-mayor').innerHTML =
          '<h3>Categoría con mayor gasto</h3>'+
          '<p style="color:var(--suave);font-size:13px;margin-top:10px">Sin gastos registrados aún.</p>';
      }

      /* Tabla categorías con iconos SVG estilizados */
      q('#pe-cats').innerHTML =
        '<table class="tabla-datos">'+
          '<tr><th>Categoría</th><th style="text-align:right">Monto</th><th style="text-align:right">% gastos</th></tr>'+
          c.porCat.map(z=>{
            const p = c.totalGas?z.m/c.totalGas:0;
            const iconSvg = Personal.ICONS[z.c] || '';
            return '<tr>'+
              '<td style="display:flex;align-items:center;gap:10px"><span style="color:var(--primario);display:inline-flex">'+iconSvg+'</span><span>'+z.c+'</span></td>'+
              '<td style="text-align:right">'+Fmt.moneda(z.m)+'</td>'+
              '<td style="text-align:right;min-width:120px">'+
                '<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">'+
                  Fmt.pct(p)+
                  '<div style="width:60px;background:var(--arena-2);border-radius:4px;height:6px;overflow:hidden">'+
                    '<div style="background:var(--primario);height:100%;width:'+(p*100).toFixed(1)+'%;border-radius:4px"></div>'+
                  '</div>'+
                '</div>'+
              '</td></tr>';
          }).join('')+
          '<tr class="total"><td>Total</td><td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td>'+
            '<td style="text-align:right">'+(c.totalGas?'100.00 %':'—')+'</td></tr>'+
        '</table>';

      /* Gráfica doughnut con porcentajes en tooltip */
      if (Personal.graf) { try{ Personal.graf.destroy(); }catch(e){} Personal.graf=null; }
      if (typeof Chart !== 'undefined' && c.porCat.length) {
        Personal.graf = new Chart(q('#pe-grafico'), {
          type:'doughnut',
          data:{
            labels: c.porCat.map(z=>z.c),
            datasets:[{ data:c.porCat.map(z=>z.m),
              backgroundColor:['#0f5c4d','#3f8a6f','#8cbfac','#c08a2e','#8c3b5e','#b25555','#5e78a0','#c9d5e3'],
              borderWidth:2, borderColor:'var(--tarjeta)' }]
          },
          options:{
            responsive:true, maintainAspectRatio:false,
            cutout:'62%',
            plugins:{
              legend:{ position:'bottom', labels:{ padding:12, font:{ size:12 } } },
              tooltip:{ callbacks:{ label: t=>{
                const tot = t.dataset.data.reduce((s,v)=>s+v,0);
                return ' '+t.label+': '+Fmt.moneda(t.raw)+(tot?' ('+Fmt.pct(t.raw/tot)+')':'');
              }}}
            }
          }
        });
      }

      renderEvoGraf();
      renderComp();
    };

    /* ── Eventos ── */
    raiz.addEventListener('input',  refrescar);
    raiz.addEventListener('change', refrescar);
    raiz.addEventListener('click', e => {
      if (e.target.classList.contains('quitar')) {
        e.target.closest('tr').remove(); refrescar();
      }
      const tab = e.target.closest('[data-idx]');
      if (tab && tab.closest('#pe-tabs')) {
        const h = Personal.obtenerHistorial();
        const m = h[+tab.dataset.idx];
        if (m) {
          Datos.guardar('personal', { ingresos:m.ingresos, gastos:m.gastos, meta:m.meta });
          Personal.render(el); Validar.activar(el);
        }
      }
    });

    q('#pe-add-ing').addEventListener('click', ()=>{
      q('#pe-ing').insertAdjacentHTML('beforeend', Personal.filaIng({ n:'Nuevo ingreso', m:0 }));
      Validar.activar(raiz); refrescar();
    });
    q('#pe-add-gas').addEventListener('click', ()=>{
      q('#pe-gas').insertAdjacentHTML('beforeend', Personal.filaGas({ n:'Nuevo gasto', c:'Otros', t:'Variable', m:0 }));
      Validar.activar(raiz); refrescar();
    });
    q('#pe-ejemplo').addEventListener('click', ()=>{
      Datos.guardar('personal', Personal.ejemplo()); Personal.render(el); Validar.activar(el);
    });
    q('#pe-limpiar').addEventListener('click', ()=>{
      if (confirm('¿Borrar los datos del presupuesto personal?')) {
        Datos.guardar('personal', { ingresos:[], gastos:[], meta:0 });
        Personal.render(el); Validar.activar(el);
      }
    });

    /* Guardar mes al historial */
    q('#pe-guardar-mes').addEventListener('click', ()=>{
      const mes = prompt('Etiqueta para este mes (ej: Nov 2026):', (() => {
        const d = new Date(); return d.toLocaleString('es',{month:'short',year:'numeric'});
      })());
      if (!mes) return;
      const x = leer();
      const h = Personal.obtenerHistorial();
      const idx = h.findIndex(m=>m.etiqueta===mes);
      const entrada = { etiqueta:mes, ...x };
      if (idx>=0) h[idx]=entrada; else h.push(entrada);
      Personal.guardarHistorial(h);
      renderTabs();
      renderEvoGraf();
      renderComp();
      
      const btn = q('#pe-guardar-mes');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Guardado';
      setTimeout(()=>{ btn.innerHTML = originalHTML; }, 2000);
    });

    renderTabs();
    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.personal = {
  titulo:    'Presupuesto personal',
  subtitulo: 'Control de ingresos, gastos, ahorro y evolución mensual',
  render(el) { Personal.render(el); }
};