// Módulo 8: Presupuesto personal — historial completo con edición, duplicar, exportar
const Personal = {
  graf: null, grafEvo: null, grafComp: null,
  CATS:  ['Vivienda','Alimentación','Transporte','Educación','Salud','Servicios','Entretenimiento','Otros'],
  TIPOS: ['Fijo','Variable'],
  ICONS: {
    Vivienda:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    Alimentación:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    Transporte:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 10h22"/></svg>',
    Educación:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    Salud:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z"/></svg>',
    Servicios:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    Entretenimiento:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
    Otros:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  },

  ejemplo() {
    return { ingresos:[{n:'Salario',m:15000},{n:'Trabajo extra',m:3000}],
      gastos:[{n:'Alquiler',c:'Vivienda',t:'Fijo',m:5000},{n:'Comida',c:'Alimentación',t:'Variable',m:4500},
              {n:'Pasajes',c:'Transporte',t:'Fijo',m:1500},{n:'Internet y celular',c:'Servicios',t:'Fijo',m:1200},
              {n:'Salidas',c:'Entretenimiento',t:'Variable',m:1000}],
      meta:20 };
  },

  obtener()          { return Datos.leer('personal',       { ingresos:[], gastos:[], meta:20 }); },
  obtenerHistorial() { return Datos.leer('personal_hist',  []); },
  guardarHistorial(h){ Datos.guardar('personal_hist', h); },

  // Ordena el historial cronológicamente
  ordenarHist(h) {
    const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return [...h].sort((a, b) => {
      const parse = e => {
        if (!e) return 0;
        const p = e.toLowerCase().split(/[\s\/\-]+/);
        const mi = MESES.findIndex(m => p[0].startsWith(m));
        const y = parseInt(p[1]) || 0;
        return y * 100 + (mi >= 0 ? mi : 0);
      };
      return parse(a.etiqueta) - parse(b.etiqueta);
    });
  },

  calcular(x) {
    const totalIng  = x.ingresos.reduce((s,i)=>s+i.m, 0);
    const totalGas  = x.gastos.reduce((s,g)=>s+g.m, 0);
    const saldo     = totalIng - totalGas;
    const capacidad = totalIng ? saldo / totalIng : NaN;
    const metaMonto = totalIng * x.meta / 100;
    const porCat    = Personal.CATS
      .map(c=>({ c, m: x.gastos.filter(g=>g.c===c).reduce((s,g)=>s+g.m,0) }))
      .filter(z=>z.m>0).sort((a,b)=>b.m-a.m);
    const mayorCat  = porCat.length ? porCat[0] : null;
    const totalFijo = x.gastos.filter(g=>g.t==='Fijo').reduce((s,g)=>s+g.m,0);
    const totalVar  = x.gastos.filter(g=>g.t==='Variable').reduce((s,g)=>s+g.m,0);
    return { totalIng, totalGas, saldo, capacidad, metaMonto, porCat, mayorCat, totalFijo, totalVar };
  },

  filaIng(i, solo) {
    const dis = solo ? 'disabled style="opacity:.7"' : '';
    return '<tr class="ing">' +
      '<td><input type="text" data-validar="nombre" data-k="n" value="'+i.n+'" '+dis+'></td>'+
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="'+i.m+'" '+dis+'></td>'+
      (solo ? '<td></td>' : '<td><button class="btn sec quitar" title="Quitar">✕</button></td>')+
      '</tr>';
  },
  filaGas(g, solo) {
    const sel  = k => Personal.CATS.map(c=>'<option'+(c===k?' selected':'')+'>'+c+'</option>').join('');
    const selT = k => Personal.TIPOS.map(t=>'<option'+(t===k?' selected':'')+'>'+t+'</option>').join('');
    const dis  = solo ? 'disabled style="opacity:.7"' : '';
    return '<tr class="gas">' +
      '<td><input type="text" data-validar="nombre" data-k="n" value="'+g.n+'" '+dis+'></td>'+
      '<td><select data-k="c" '+dis+'>'+sel(g.c)+'</select></td>'+
      '<td><select data-k="t" class="pe-tipo-sel" '+dis+'>'+selT(g.t||'Variable')+'</select></td>'+
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="'+g.m+'" '+dis+'></td>'+
      (solo ? '<td></td>' : '<td><button class="btn sec quitar" title="Quitar">✕</button></td>')+
      '</tr>';
  },

  // ── Exportar un mes a PDF ────────────────────────────────────────────────
  exportarPDF(entrada) {
    if (typeof window.jspdf === 'undefined') { alert('No se encontró librerias/jspdf.umd.min.js.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });
    const c = Personal.calcular(entrada);
    const ml = 18, mr = 192, lh = 7;
    let y = 20;
    const titulo  = (t, sz) => { doc.setFontSize(sz||13); doc.setFont('helvetica','bold');   doc.text(t, ml, y); y += lh; };
    const normal  = (t, sz) => { doc.setFontSize(sz||10); doc.setFont('helvetica','normal'); doc.text(t, ml, y); y += lh; };
    const sep     = ()      => { doc.setDrawColor(200); doc.line(ml, y, mr, y); y += 3; };
    const filaT   = (l, v, negrita) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', negrita?'bold':'normal');
      doc.text(l, ml, y); doc.text(v, mr, y, { align:'right' }); y += lh;
    };
    titulo('PRESUPUESTO PERSONAL — ' + entrada.etiqueta.toUpperCase(), 14); sep();
    titulo('Ingresos');
    entrada.ingresos.forEach(i => filaT(i.n, Fmt.moneda(i.m)));
    sep(); filaT('TOTAL INGRESOS', Fmt.moneda(c.totalIng), true); y += 3;
    titulo('Gastos');
    entrada.gastos.forEach(g => filaT(g.n + ' (' + g.c + ' · ' + g.t + ')', Fmt.moneda(g.m)));
    sep(); filaT('TOTAL GASTOS', Fmt.moneda(c.totalGas), true); y += 3;
    titulo('Resumen');
    filaT('Saldo disponible',    Fmt.moneda(c.saldo));
    filaT('Meta de ahorro',      entrada.meta + ' %  =  ' + Fmt.moneda(c.metaMonto));
    filaT('Capacidad de ahorro', Fmt.pct(c.capacidad));
    if (c.mayorCat) filaT('Mayor gasto: ' + c.mayorCat.c, Fmt.moneda(c.mayorCat.m));
    doc.save('Presupuesto-Personal-' + entrada.etiqueta.replace(/\s/g,'-') + '.pdf');
  },

  render(el, modoVista) {
    // modoVista: null = mes actual · número = ver historial en modo lectura · 'editar-N' = editar histórico
    const x0   = Personal.obtener();
    const hist  = Personal.ordenarHist(Personal.obtenerHistorial());
    const esMesActual   = modoVista == null;
    const esModoLectura = typeof modoVista === 'number';
    const esModoEditar  = typeof modoVista === 'string' && modoVista.startsWith('editar-');
    const idxHist       = esModoLectura ? modoVista : esModoEditar ? parseInt(modoVista.split('-')[1]) : -1;
    const entradaVista  = (esModoLectura || esModoEditar) && hist[idxHist] ? hist[idxHist] : null;
    const datosFormulario = entradaVista || x0;
    const soloLectura   = esModoLectura && !esModoEditar;

    const svgDisk  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
    const svgBack  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const svgEdit  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const svgCopy  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const svgDel   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
    const svgPDF   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    const svgInfo  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    const svgAlerta= '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    // ── Banner de modo ──────────────────────────────────────────────────────
    let bannerModo = '';
    if (esModoLectura && entradaVista) {
      bannerModo = '<div class="pe-banner-hist">'+
        svgInfo+
        '<span>Consultando: <strong>'+entradaVista.etiqueta+'</strong> (solo lectura). Los cambios en el mes actual se mantienen intactos.</span>'+
        '<button class="btn sec" id="pe-btn-volver" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">'+svgBack+' Volver al mes actual</button>'+
        '<button class="btn sec" id="pe-btn-editar-hist" style="display:inline-flex;align-items:center;gap:6px">'+svgEdit+' Editar</button>'+
      '</div>';
    } else if (esModoEditar && entradaVista) {
      bannerModo = '<div class="pe-banner-edit">'+
        svgEdit+
        '<span>Editando: <strong>'+entradaVista.etiqueta+'</strong></span>'+
        '<button class="btn" id="pe-btn-guardar-edit" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">'+svgDisk+' Guardar cambios</button>'+
        '<button class="btn sec" id="pe-btn-volver" style="display:inline-flex;align-items:center;gap:6px">'+svgBack+' Cancelar</button>'+
      '</div>';
    }

    const raiz = document.createElement('div');
    raiz.innerHTML =
      /* Banner modo historial */
      bannerModo +

      /* Banner informativo + guardar mes actual */
      '<div class="aviso" style="margin-bottom:16px;display:flex;align-items:center;gap:10px">'+
        svgInfo+
        '<div><strong>Presupuesto personal independiente.</strong> Registra ingresos y gastos del mes, fija tu meta de ahorro y guarda el historial mensual.</div>'+
        (esMesActual ? '<button class="btn" id="pe-guardar-mes" title="Guardar como nuevo mes en el historial" style="margin-left:auto;white-space:nowrap;display:inline-flex;align-items:center;gap:6px">'+svgDisk+' Guardar mes</button>' : '')+
      '</div>'+

      /* Tabs historial */
      '<div class="pe-hist-barra" id="pe-hist-barra"></div>'+

      /* Alerta gastos > ingresos */
      '<div id="pe-alerta" style="display:none;background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;color:var(--malo);margin-bottom:14px;font-weight:600;display:flex;align-items:center;gap:10px">'+
        svgAlerta+'<span id="pe-alerta-txt"></span>'+
      '</div>'+

      /* Tablas de entrada */
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta">'+
          '<h3 style="margin-bottom:10px">Ingresos del mes (C$)</h3>'+
          '<table class="tabla-datos" id="pe-ing">'+
            '<tr><th>Concepto</th><th style="text-align:right">Monto</th><th></th></tr>'+
            datosFormulario.ingresos.map(i=>Personal.filaIng(i, soloLectura)).join('')+
          '</table>'+
          (!soloLectura ? '<div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-ing">+ Agregar ingreso</button></div>' : '')+
        '</div>'+
        '<div class="tarjeta">'+
          '<h3 style="margin-bottom:10px">Gastos del mes (C$)</h3>'+
          '<table class="tabla-datos" id="pe-gas">'+
            '<tr><th>Concepto</th><th>Categoría</th><th>Tipo</th><th style="text-align:right">Monto</th><th></th></tr>'+
            datosFormulario.gastos.map(g=>Personal.filaGas(g, soloLectura)).join('')+
          '</table>'+
          (!soloLectura ? '<div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-gas">+ Agregar gasto</button></div>' : '')+
        '</div>'+
      '</div>'+

      /* Controles meta y botones */
      '<div class="barra-acciones" style="margin-bottom:14px">'+
        '<label class="campo corto" style="min-width:200px">Meta de ahorro (% de ingresos)'+
          '<input type="text" inputmode="decimal" data-validar="numero" id="pe-meta" value="'+datosFormulario.meta+'"'+(soloLectura?' disabled style="opacity:.7"':'')+'>'+
        '</label>'+
        (esMesActual ?
          '<button class="btn sec" id="pe-ejemplo">Cargar ejemplo</button>'+
          '<button class="btn sec peligro" id="pe-limpiar">Limpiar datos</button>' : '')+
      '</div>'+

      /* KPIs */
      '<div class="rejilla" id="pe-tarjetas" style="margin-bottom:14px"></div>'+
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta" id="pe-bloque-tipos"></div>'+
        '<div class="tarjeta" id="pe-bloque-mayor"></div>'+
      '</div>'+
      '<div class="dos-col" style="margin-bottom:14px">'+
        '<div class="tarjeta"><h3 style="margin-bottom:10px">Gastos por categoría</h3><div id="pe-cats"></div></div>'+
        '<div class="tarjeta"><h3 style="margin-bottom:10px">Distribución de los gastos</h3><div class="grafico"><canvas id="pe-grafico"></canvas></div></div>'+
      '</div>'+

      /* Evolución histórica — solo en modo mes actual */
      (esMesActual ?
        '<div class="tarjeta" style="margin-bottom:14px">'+
          '<h3 style="margin-bottom:14px">Evolución mensual (historial)</h3>'+
          '<div class="grafico"><canvas id="pe-grafico-evo"></canvas></div>'+
          '<p id="pe-evo-vacio" style="color:var(--suave);font-size:13px;margin-top:10px;display:none">Guarda al menos dos meses para ver la evolución.</p>'+
        '</div>'+
        '<div class="tarjeta" id="pe-bloque-comp">'+
          '<h3 style="margin-bottom:14px">Comparar meses del historial</h3>'+
          '<div id="pe-comp-contenido"></div>'+
        '</div>' : '');

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

    // ── Render de la barra de historial ──────────────────────────────────
    const renderHistBarra = () => {
      const h = Personal.ordenarHist(Personal.obtenerHistorial());
      const barra = q('#pe-hist-barra');
      if (!h.length) {
        barra.innerHTML = '<span style="color:var(--suave);font-size:13px">Sin meses guardados aún.</span>';
        return;
      }
      barra.innerHTML =
        h.map((m,i)=>
          '<div class="pe-hist-item" data-idx="'+i+'">' +
            '<button class="pe-hist-btn'+(esModoLectura && idxHist===i?' pe-hist-activo':'')+(esModoEditar && idxHist===i?' pe-hist-edit-activo':'')+'" data-accion="ver" data-idx="'+i+'">'+m.etiqueta+'</button>'+
            '<span class="pe-hist-acciones">'+
              '<button class="pe-hist-ico" data-accion="pdf"   data-idx="'+i+'" title="Exportar PDF">'+svgPDF+'</button>'+
              '<button class="pe-hist-ico" data-accion="dupl"  data-idx="'+i+'" title="Duplicar como base del mes siguiente">'+svgCopy+'</button>'+
              '<button class="pe-hist-ico pe-hist-ico-del" data-accion="del" data-idx="'+i+'" title="Eliminar mes">'+svgDel+'</button>'+
            '</span>'+
          '</div>'
        ).join('') +
        (esMesActual ? '' : '');
    };

    // ── Render evolución ──────────────────────────────────────────────────
    const renderEvoGraf = () => {
      if (!esMesActual) return;
      const h = Personal.ordenarHist(Personal.obtenerHistorial());
      if (Personal.grafEvo) { try{Personal.grafEvo.destroy();}catch(e){} Personal.grafEvo=null; }
      if (h.length < 2) {
        if (q('#pe-evo-vacio')) q('#pe-evo-vacio').style.display = 'block';
        if (q('#pe-grafico-evo')) q('#pe-grafico-evo').style.display = 'none';
        return;
      }
      if (q('#pe-evo-vacio')) q('#pe-evo-vacio').style.display = 'none';
      if (q('#pe-grafico-evo')) q('#pe-grafico-evo').style.display = 'block';
      if (typeof Chart === 'undefined' || !q('#pe-grafico-evo')) return;
      const labels   = h.map(m=>m.etiqueta);
      const ahorros  = h.map(m=>{ const c=Personal.calcular(m); return c.saldo; });
      const metas    = h.map(m=>{ const c=Personal.calcular(m); return c.metaMonto; });
      const ingresos = h.map(m=>{ const c=Personal.calcular(m); return c.totalIng; });
      const gastos   = h.map(m=>{ const c=Personal.calcular(m); return c.totalGas; });
      // Colorear puntos de ahorro: verde si cumple meta, naranja si no
      const puntosColor = h.map((m,i)=>{
        const c = Personal.calcular(m);
        return ahorros[i] >= c.metaMonto ? '#0f5c4d' : '#d97706';
      });
      Personal.grafEvo = new Chart(q('#pe-grafico-evo'), {
        type:'line',
        data:{ labels, datasets:[
          { label:'Ahorro real', data:ahorros, borderColor:'#0f5c4d', backgroundColor:'rgba(15,92,77,.1)',
            tension:.35, fill:true, pointRadius:6, pointBackgroundColor:puntosColor, pointBorderColor:puntosColor },
          { label:'Meta ahorro', data:metas, borderColor:'#8c3b5e', borderDash:[6,4], tension:.35, fill:false, pointRadius:4 },
          { label:'Ingresos',    data:ingresos, borderColor:'#1f7a4d', tension:.35, fill:false, pointRadius:4 },
          { label:'Gastos',      data:gastos,   borderColor:'#b3261e', tension:.35, fill:false, pointRadius:4 }
        ]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom' },
            tooltip:{ callbacks:{ label: t=>' '+t.dataset.label+': '+Fmt.moneda(t.raw) } } },
          scales:{ y:{ ticks:{ callback: v=>{ const a=Math.abs(v); return a>=1e6?(v/1e6).toFixed(1)+'M':a>=1e3?(v/1e3).toFixed(0)+'k':v; } } } }
        }
      });
    };

    // ── Render comparación ────────────────────────────────────────────────
    const renderComp = () => {
      if (!esMesActual) return;
      const h = Personal.ordenarHist(Personal.obtenerHistorial());
      const cont = q('#pe-comp-contenido');
      if (!cont) return;
      if (h.length < 2) {
        cont.innerHTML = '<p style="color:var(--suave);font-size:13px">Guarda al menos dos meses para comparar.</p>'; return;
      }
      const masMeses = h[h.length-1]; const menos = h.reduce((a,b)=>Personal.calcular(b).saldo>Personal.calcular(a).saldo?b:a);
      cont.innerHTML =
        '<table class="tabla-datos"><thead>'+
          '<tr><th>Mes</th><th style="text-align:right">Ingresos</th><th style="text-align:right">Gastos</th>'+
          '<th style="text-align:right">Saldo</th><th style="text-align:right">Ahorro real</th>'+
          '<th style="text-align:right">Meta</th><th style="text-align:right">¿Cumple?</th></tr>'+
        '</thead><tbody>'+
        h.map((m,i)=>{
          const c=Personal.calcular(m);
          const cumple=c.saldo>=c.metaMonto;
          const esMejor = m===menos;
          return '<tr'+(esMejor?' style="background:rgba(15,92,77,.06)"':'')+'>'+
            '<td><strong>'+m.etiqueta+'</strong>'+(esMejor?' <span style="font-size:11px;color:#0f5c4d">★ Mayor ahorro</span>':'')+
            '</td>'+
            '<td style="text-align:right">'+Fmt.moneda(c.totalIng)+'</td>'+
            '<td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td>'+
            '<td style="text-align:right;color:'+(c.saldo>=0?'var(--ok)':'var(--malo)')+'">'+Fmt.moneda(c.saldo)+'</td>'+
            '<td style="text-align:right">'+Fmt.pct(c.capacidad)+'</td>'+
            '<td style="text-align:right">'+Fmt.pct(m.meta/100)+'</td>'+
            '<td style="text-align:center;color:'+(cumple?'var(--ok)':'var(--malo)')+'">'+
              (cumple ? '✔ Sí' : '✘ No')+'</td>'+
            '</tr>';
        }).join('')+
        '</tbody></table>';
    };

    // ── Función de refresco principal ─────────────────────────────────────
    const refrescar = () => {
      const x = soloLectura ? datosFormulario : leer();
      if (!soloLectura && esMesActual) Datos.guardar('personal', x);
      const c = Personal.calcular(x);

      if (c.saldo < 0) {
        q('#pe-alerta').style.display = 'flex';
        q('#pe-alerta-txt').textContent = 'Tus gastos superan tus ingresos en '+Fmt.moneda(-c.saldo)+'. Revisa tus gastos variables.';
      } else { q('#pe-alerta').style.display = 'none'; }

      const badge = (ok,txt) => '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:'+(ok?'var(--ok-bg)':'var(--malo-bg)')+';color:'+(ok?'var(--ok)':'var(--malo)')+'">'+txt+'</span>';
      const sIng='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
      const sGas='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
      const sSal='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>';
      const sMet='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>';
      const T=(ico,t,v,n,extra)=>'<div class="tarjeta"><h3 style="display:flex;align-items:center;gap:8px"><span style="color:var(--primario);display:inline-flex">'+ico+'</span>'+t+'</h3><div class="valor">'+v+'</div><div class="nota">'+n+'</div>'+(extra||'')+'</div>';
      q('#pe-tarjetas').innerHTML =
        T(sIng,'Total de ingresos',   Fmt.moneda(c.totalIng),'Suma de ingresos del mes')+
        T(sGas,'Total de gastos',     Fmt.moneda(c.totalGas),'Suma de gastos del mes')+
        T(sSal,'Saldo disponible',    Fmt.moneda(c.saldo),'Ingresos − Gastos',
          '<div style="margin-top:8px">'+badge(c.saldo>=0,'Positivo')+'</div>')+
        T(sMet,'Capacidad de ahorro', Fmt.pct(c.capacidad),'Saldo ÷ Ingresos',
          '<div style="margin-top:8px">'+badge(!isNaN(c.capacidad)&&c.saldo>=c.metaMonto,'Meta: '+x.meta+'%')+'</div>');

      q('#pe-bloque-tipos').innerHTML =
        '<h3 style="margin-bottom:10px">Gastos fijos vs variables</h3>'+
        '<table class="tabla-datos">'+
          '<tr><th>Tipo</th><th style="text-align:right">Monto</th><th style="text-align:right">%</th></tr>'+
          '<tr><td>Fijos</td><td style="text-align:right">'+Fmt.moneda(c.totalFijo)+'</td><td style="text-align:right">'+Fmt.pct(c.totalGas?c.totalFijo/c.totalGas:NaN)+'</td></tr>'+
          '<tr><td>Variables</td><td style="text-align:right">'+Fmt.moneda(c.totalVar)+'</td><td style="text-align:right">'+Fmt.pct(c.totalGas?c.totalVar/c.totalGas:NaN)+'</td></tr>'+
          '<tr class="total"><td>Total</td><td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td><td style="text-align:right">'+(c.totalGas?'100.00 %':'—')+'</td></tr>'+
        '</table>';

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
            '<div style="background:var(--primario);height:100%;width:'+(pct*100).toFixed(1)+'%;border-radius:6px"></div>'+
          '</div>';
      } else {
        q('#pe-bloque-mayor').innerHTML='<h3>Categoría con mayor gasto</h3><p style="color:var(--suave);font-size:13px;margin-top:10px">Sin gastos aún.</p>';
      }

      q('#pe-cats').innerHTML =
        '<table class="tabla-datos">'+
          '<tr><th>Categoría</th><th style="text-align:right">Monto</th><th style="text-align:right">% gastos</th></tr>'+
          c.porCat.map(z=>{
            const p=c.totalGas?z.m/c.totalGas:0;
            return '<tr><td style="display:flex;align-items:center;gap:10px"><span style="color:var(--primario);display:inline-flex">'+(Personal.ICONS[z.c]||'')+'</span><span>'+z.c+'</span></td>'+
              '<td style="text-align:right">'+Fmt.moneda(z.m)+'</td>'+
              '<td style="text-align:right;min-width:120px"><div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">'+
                Fmt.pct(p)+
                '<div style="width:60px;background:var(--arena-2);border-radius:4px;height:6px;overflow:hidden">'+
                  '<div style="background:var(--primario);height:100%;width:'+(p*100).toFixed(1)+'%;border-radius:4px"></div>'+
                '</div></div></td></tr>';
          }).join('')+
          '<tr class="total"><td>Total</td><td style="text-align:right">'+Fmt.moneda(c.totalGas)+'</td><td style="text-align:right">'+(c.totalGas?'100.00 %':'—')+'</td></tr>'+
        '</table>';

      if (Personal.graf) { try{Personal.graf.destroy();}catch(e){} Personal.graf=null; }
      if (typeof Chart !== 'undefined' && c.porCat.length) {
        Personal.graf = new Chart(q('#pe-grafico'), {
          type:'doughnut',
          data:{ labels:c.porCat.map(z=>z.c), datasets:[{ data:c.porCat.map(z=>z.m),
            backgroundColor:['#0f5c4d','#3f8a6f','#8cbfac','#c08a2e','#8c3b5e','#b25555','#5e78a0','#c9d5e3'],
            borderWidth:2, borderColor:'var(--tarjeta)' }] },
          options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
            plugins:{ legend:{ position:'bottom', labels:{ padding:12, font:{ size:12 } } },
              tooltip:{ callbacks:{ label: t=>{ const tot=t.dataset.data.reduce((s,v)=>s+v,0); return ' '+t.label+': '+Fmt.moneda(t.raw)+(tot?' ('+Fmt.pct(t.raw/tot)+')':''); } } } } }
        });
      }
      renderEvoGraf();
      renderComp();
    };

    // ── Eventos ──────────────────────────────────────────────────────────
    if (!soloLectura) {
      raiz.addEventListener('input',  refrescar);
      raiz.addEventListener('change', refrescar);
    }
    raiz.addEventListener('click', e => {
      if (e.target.classList.contains('quitar')) { e.target.closest('tr').remove(); refrescar(); return; }
      const btn = e.target.closest('[data-accion]');
      if (!btn) return;
      const accion = btn.dataset.accion;
      const idx    = parseInt(btn.dataset.idx);
      const h      = Personal.ordenarHist(Personal.obtenerHistorial());

      if (accion === 'ver') {
        Personal.render(el, idx); Validar.activar(el); return;
      }
      if (accion === 'pdf') {
        if (h[idx]) Personal.exportarPDF(h[idx]); return;
      }
      if (accion === 'dupl') {
        if (!h[idx]) return;
        const etiquetaBase = h[idx].etiqueta;
        const nueva = prompt('Nombre del nuevo mes (duplicado de '+etiquetaBase+'):', (() => {
          const d = new Date(); return d.toLocaleString('es',{month:'short',year:'numeric'});
        })());
        if (!nueva) return;
        const hNuevo = Personal.obtenerHistorial();
        if (hNuevo.find(m=>m.etiqueta===nueva)) {
          if (!confirm('Ya existe un mes con ese nombre. ¿Sobreescribir?')) return;
          const idx2 = hNuevo.findIndex(m=>m.etiqueta===nueva);
          hNuevo[idx2] = { ...h[idx], etiqueta:nueva };
        } else {
          hNuevo.push({ ...h[idx], etiqueta:nueva });
        }
        Personal.guardarHistorial(hNuevo);
        Personal.render(el); Validar.activar(el); return;
      }
      if (accion === 'del') {
        if (!h[idx]) return;
        if (!confirm('¿Eliminar el mes "'+h[idx].etiqueta+'" del historial? Esta acción no se puede deshacer.')) return;
        const hEdit = Personal.obtenerHistorial();
        // Encuentra el índice real (antes del sort)
        const realIdx = hEdit.findIndex(m=>m.etiqueta===h[idx].etiqueta);
        if (realIdx>=0) hEdit.splice(realIdx,1);
        Personal.guardarHistorial(hEdit);
        Personal.render(el); Validar.activar(el); return;
      }
    });

    // Volver al mes actual
    if (q('#pe-btn-volver')) q('#pe-btn-volver').addEventListener('click', ()=>{ Personal.render(el); Validar.activar(el); });

    // Cambiar a modo editar desde modo lectura
    if (q('#pe-btn-editar-hist')) q('#pe-btn-editar-hist').addEventListener('click', ()=>{ Personal.render(el, 'editar-'+idxHist); Validar.activar(el); });

    // Guardar cambios en el historial (modo editar)
    if (q('#pe-btn-guardar-edit')) q('#pe-btn-guardar-edit').addEventListener('click', ()=>{
      const hEdit = Personal.obtenerHistorial();
      const etiquetaActual = hist[idxHist].etiqueta;
      const realIdx = hEdit.findIndex(m=>m.etiqueta===etiquetaActual);
      if (realIdx < 0) { alert('No se encontró el mes. Puede que ya haya sido eliminado.'); return; }
      hEdit[realIdx] = { etiqueta:etiquetaActual, ...leer() };
      Personal.guardarHistorial(hEdit);
      Personal.render(el, idxHist); Validar.activar(el);
    });

    // Agregar fila
    if (q('#pe-add-ing')) q('#pe-add-ing').addEventListener('click', ()=>{
      q('#pe-ing').insertAdjacentHTML('beforeend', Personal.filaIng({ n:'Nuevo ingreso', m:0 }, false));
      Validar.activar(raiz); refrescar();
    });
    if (q('#pe-add-gas')) q('#pe-add-gas').addEventListener('click', ()=>{
      q('#pe-gas').insertAdjacentHTML('beforeend', Personal.filaGas({ n:'Nuevo gasto', c:'Otros', t:'Variable', m:0 }, false));
      Validar.activar(raiz); refrescar();
    });

    if (q('#pe-ejemplo')) q('#pe-ejemplo').addEventListener('click', ()=>{
      Datos.guardar('personal', Personal.ejemplo()); Personal.render(el); Validar.activar(el);
    });
    if (q('#pe-limpiar')) q('#pe-limpiar').addEventListener('click', ()=>{
      if (confirm('¿Borrar los datos del presupuesto personal del mes actual?')) {
        Datos.guardar('personal', { ingresos:[], gastos:[], meta:0 });
        Personal.render(el); Validar.activar(el);
      }
    });

    // Guardar mes al historial
    if (q('#pe-guardar-mes')) q('#pe-guardar-mes').addEventListener('click', ()=>{
      const mes = prompt('Etiqueta para este mes (ej: nov. 2026):', (() => {
        const d = new Date(); return d.toLocaleString('es',{month:'short',year:'numeric'});
      })());
      if (!mes) return;
      const x = leer();
      const h = Personal.obtenerHistorial();
      const idx2 = h.findIndex(m=>m.etiqueta===mes);
      const entrada = { etiqueta:mes, ...x };
      if (idx2>=0) {
        if (!confirm('Ya existe un registro para "'+mes+'". ¿Sobreescribir?')) return;
        h[idx2] = entrada;
      } else {
        h.push(entrada);
      }
      Personal.guardarHistorial(h);
      Personal.render(el); Validar.activar(el);
    });

    renderHistBarra();
    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.personal = {
  titulo:    'Presupuesto personal',
  subtitulo: 'Control de ingresos, gastos, ahorro y evolución mensual',
  render(el) { Personal.render(el); }
};