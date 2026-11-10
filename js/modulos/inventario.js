// Módulo 9: Control de inventario — versión mejorada
const Inventario = {
  graf: null,
  movimientos: [],

  /* ── SVG icons (24×24, stroke, Feather-style) ── */
  ico: {
    buscar:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    reponer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/></svg>',
    agotado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    normal:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/></svg>',
    mover:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    historia:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>',
    caja:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    valor:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7a2 2 0 0 1 2-2h14v2M16 14h2"/></svg>',
    alerta:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10.3 3.5L2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    conteo:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    quitar:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" width="13" height="13"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    agregar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>',
    compra:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  },

  ejemplo() {
    return {
      productos: [
        { id:1, n:'Arroz',    cat:'Alimentos',  ini:100, ent:50,  sal:120, costo:25, min:40 },
        { id:2, n:'Frijoles', cat:'Alimentos',  ini:80,  ent:20,  sal:30,  costo:30, min:40 },
        { id:3, n:'Aceite',   cat:'Alimentos',  ini:60,  ent:0,   sal:35,  costo:55, min:30 },
        { id:4, n:'Azúcar',   cat:'Alimentos',  ini:90,  ent:40,  sal:50,  costo:20, min:35 },
        { id:5, n:'Resma carta', cat:'Papelería', ini:30, ent:10, sal:28,  costo:120, min:15 }
      ],
      movimientos: [
        { fecha:'2026-11-01', prod:'Arroz',    tipo:'Entrada', cant:50, nota:'Compra mensual' },
        { fecha:'2026-11-03', prod:'Arroz',    tipo:'Salida',  cant:20, nota:'Despacho bodega' },
        { fecha:'2026-11-05', prod:'Frijoles', tipo:'Salida',  cant:30, nota:'Venta' },
        { fecha:'2026-11-07', prod:'Aceite',   tipo:'Salida',  cant:35, nota:'Consumo interno' }
      ]
    };
  },

  obtener() { return Datos.leer('inventario_v2', Inventario.ejemplo()); },
  _nextId(productos) { return productos.length ? Math.max(...productos.map(p=>p.id||0))+1 : 1; },

  calcular(p) {
    const final  = p.ini + p.ent - p.sal;
    const valor  = final > 0 ? final * p.costo : 0;
    const estado = p.sal > p.ini + p.ent ? 'Error'
                 : final === 0            ? 'Agotado'
                 : final <= p.min         ? 'Reponer'
                 :                         'Normal';
    const falta  = estado === 'Reponer' || estado === 'Agotado' ? Math.max(p.min - final, 0) : 0;
    return { final, valor, estado, falta };
  },

  /* ── Chip de estado visual ── */
  chipEstado(estado) {
    const cfg = {
      Normal:  { cls:'ok',    ico:'normal',  txt:'Normal'  },
      Reponer: { cls:'alerta',ico:'reponer', txt:'Reponer' },
      Agotado: { cls:'riesgo',ico:'agotado', txt:'Agotado' },
      Error:   { cls:'riesgo',ico:'error',   txt:'Error'   }
    };
    const c = cfg[estado] || cfg.Error;
    return '<span class="chip '+c.cls+'" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;font-size:12px;font-weight:600">'+
      Inventario.ico[c.ico]+c.txt+'</span>';
  },

  /* ── Fila de producto en tabla ── */
  fila(p) {
    const inp = (k,v,tipo) =>
      '<td><input type="text" '+(tipo==='n'?'data-validar="nombre"':'inputmode="decimal" data-validar="numero"')+
      ' data-k="'+k+'" value="'+v+'"></td>';
    return '<tr class="prod" data-id="'+(p.id||0)+'">' +
      inp('n', p.n, 'n') +
      '<td><input type="text" data-k="cat" value="'+(p.cat||'')+'"></td>' +
      inp('ini', p.ini) + inp('ent', p.ent) + inp('sal', p.sal) +
      inp('costo', p.costo) + inp('min', p.min) +
      '<td class="r-final" style="text-align:right;font-weight:600"></td>' +
      '<td class="r-valor" style="text-align:right"></td>' +
      '<td class="r-estado"></td>' +
      '<td style="text-align:center"><button class="btn sec quitar" title="Quitar producto" style="padding:6px 9px">'+Inventario.ico.quitar+'</button></td>' +
      '</tr>';
  },

  render(el) {
    const datos = Inventario.obtener();
    const raiz  = document.createElement('div');

    raiz.innerHTML =
      /* ── Banner info ── */
      '<div class="aviso" style="margin-bottom:16px">'+
        'Existencia final = Inicial + Entradas − Salidas &nbsp;·&nbsp; Valor = Existencia final × Costo unitario. '+
        'El sistema marca <strong>Reponer</strong> cuando la existencia final es igual o menor al stock mínimo.'+
      '</div>'+

      /* ── Barra de acciones y búsqueda ── */
      '<div class="barra-acciones" style="margin-bottom:14px;align-items:center">'+
        '<button class="btn" id="in-add" style="display:flex;align-items:center;gap:6px">'+
          Inventario.ico.agregar+'Agregar producto</button>'+
        '<button class="btn sec" id="in-ejemplo">Cargar ejemplo</button>'+
        '<button class="btn sec peligro" id="in-limpiar">Limpiar datos</button>'+
        '<div style="margin-left:auto;position:relative;display:flex;align-items:center">'+
          '<span style="position:absolute;left:10px;color:var(--suave);pointer-events:none">'+Inventario.ico.buscar+'</span>'+
          '<input type="text" id="in-buscar" placeholder="Buscar producto o categoría…" '+
            'style="padding-left:34px;min-width:220px;font-size:13px">'+
        '</div>'+
      '</div>'+

      /* ── Tabla de productos ── */
      '<div class="tarjeta" style="margin-bottom:14px">'+
        '<div class="tabla-scroll">'+
          '<table class="tabla-datos" id="in-tabla">'+
            '<thead><tr>'+
              '<th>Producto</th><th>Categoría</th>'+
              '<th style="text-align:right">Ini.</th>'+
              '<th style="text-align:right">Entradas</th>'+
              '<th style="text-align:right">Salidas</th>'+
              '<th style="text-align:right">Costo (C$)</th>'+
              '<th style="text-align:right">Mín.</th>'+
              '<th style="text-align:right">Final</th>'+
              '<th style="text-align:right">Valor (C$)</th>'+
              '<th>Estado</th><th></th>'+
            '</tr></thead>'+
            '<tbody id="in-tbody">'+
              datos.productos.map(Inventario.fila).join('')+
            '</tbody>'+
          '</table>'+
        '</div>'+
      '</div>'+

      /* ── KPIs ── */
      '<div class="rejilla" id="in-tarjetas" style="margin-bottom:14px"></div>'+

      /* ── Alerta roja / verde ── */
      '<div id="in-alerta" style="margin-bottom:14px"></div>'+

      /* ── Tabla de necesidades de reposición ── */
      '<div class="tarjeta" id="in-bloque-repos" style="margin-bottom:14px">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'+
          '<span style="color:var(--alerta)">'+Inventario.ico.alerta+'</span> Necesidades de reposición y compra'+
        '</h3>'+
        '<div id="in-repos-contenido"></div>'+
      '</div>'+

      /* ── Gráfica ── */
      '<div class="tarjeta" style="margin-bottom:14px">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
          Inventario.ico.conteo+' Existencia final vs stock mínimo'+
        '</h3>'+
        '<div class="grafico"><canvas id="in-grafico"></canvas></div>'+
      '</div>'+

      /* ── Panel de movimientos ── */
      '<div class="tarjeta">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'+
          Inventario.ico.historia+' Historial de movimientos'+
        '</h3>'+
        '<div class="barra-acciones" style="margin-bottom:12px;align-items:flex-end">'+
          '<label class="campo" style="min-width:160px">Fecha<input type="date" id="in-mov-fecha" value="'+new Date().toISOString().slice(0,10)+'"></label>'+
          '<label class="campo" style="min-width:160px">Producto<select id="in-mov-prod"></select></label>'+
          '<label class="campo" style="min-width:120px">Tipo<select id="in-mov-tipo"><option>Entrada</option><option>Salida</option></select></label>'+
          '<label class="campo corto" style="min-width:100px">Cantidad<input type="text" inputmode="decimal" id="in-mov-cant" placeholder="0"></label>'+
          '<label class="campo" style="min-width:160px">Nota<input type="text" id="in-mov-nota" placeholder="Opcional"></label>'+
          '<button class="btn" id="in-mov-agregar" style="display:flex;align-items:center;gap:6px">'+Inventario.ico.mover+'Registrar</button>'+
        '</div>'+
        '<div id="in-mov-filtro" style="margin-bottom:10px">'+
          '<label class="campo" style="max-width:200px">Filtrar por producto'+
            '<select id="in-mov-filtro-prod"><option value="">— Todos —</option></select>'+
          '</label>'+
        '</div>'+
        '<div id="in-hist-tabla"></div>'+
      '</div>';

    el.innerHTML = '';
    el.appendChild(raiz);

    const q   = id => raiz.querySelector(id);
    const leer = () => ({
      productos: [...raiz.querySelectorAll('tr.prod')].map(t => {
        const v = k => t.querySelector('[data-k="'+k+'"]').value;
        return {
          id:    +t.dataset.id || 0,
          n:     v('n'), cat: v('cat'),
          ini:   Fmt.aNum(v('ini')), ent: Fmt.aNum(v('ent')), sal: Fmt.aNum(v('sal')),
          costo: Fmt.aNum(v('costo')), min: Fmt.aNum(v('min'))
        };
      }),
      movimientos: datos.movimientos || []
    });

    /* ── Poblar selects de movimientos ── */
    const actualizarSelects = (productos) => {
      const opts = productos.map(p=>'<option value="'+p.n+'">'+p.n+'</option>').join('');
      q('#in-mov-prod').innerHTML = opts;
      q('#in-mov-filtro-prod').innerHTML = '<option value="">— Todos —</option>'+opts;
    };

    /* ── Render tabla de historial ── */
    const renderHist = (movimientos, filtro) => {
      const lista = filtro ? movimientos.filter(m=>m.prod===filtro) : movimientos;
      if (!lista.length) {
        q('#in-hist-tabla').innerHTML =
          '<p style="color:var(--suave);font-size:13px;padding:10px 0">Sin movimientos registrados aún.</p>';
        return;
      }
      q('#in-hist-tabla').innerHTML =
        '<div class="tabla-scroll"><table class="tabla-datos">'+
          '<thead><tr>'+
            '<th>Fecha</th><th>Producto</th>'+
            '<th>Tipo</th><th style="text-align:right">Cantidad</th><th>Nota</th>'+
            '<th></th>'+
          '</tr></thead><tbody>'+
          [...lista].reverse().map((m,i,arr)=>{
            const realIdx = movimientos.length - 1 - (lista.length - 1 - i); // índice real
            const color   = m.tipo==='Entrada'?'var(--ok)':'var(--malo)';
            return '<tr>'+
              '<td style="font-size:12px;color:var(--suave)">'+m.fecha+'</td>'+
              '<td><strong>'+m.prod+'</strong></td>'+
              '<td><span class="chip '+(m.tipo==='Entrada'?'ok':'riesgo')+'" style="font-size:11px;font-weight:600;padding:2px 9px">'+
                m.tipo+'</span></td>'+
              '<td style="text-align:right;font-weight:600;color:'+color+'">'+
                (m.tipo==='Entrada'?'+':'-')+Fmt.num(m.cant,0)+'</td>'+
              '<td style="font-size:12px;color:var(--suave)">'+( m.nota||'—')+'</td>'+
              '<td style="text-align:center">'+
                '<button class="btn sec quitar-mov" data-idx="'+realIdx+'" title="Eliminar movimiento" style="padding:5px 8px">'+
                  Inventario.ico.quitar+'</button>'+
              '</td></tr>';
          }).join('')+
        '</tbody></table></div>';
    };

    /* ── Render tabla de reposición ── */
    const renderRepos = (productos) => {
      const repos = productos.map(p=>({ ...p, ...Inventario.calcular(p) }))
        .filter(p=>p.estado==='Reponer'||p.estado==='Agotado'||p.estado==='Error');
      if (!repos.length) {
        q('#in-repos-contenido').innerHTML =
          '<div class="cuadre ok" style="font-size:13px;display:flex;align-items:center;gap:8px">'+
            Inventario.ico.normal+' Todos los productos están sobre su stock mínimo. No hay necesidades de compra urgentes.'+
          '</div>';
        return;
      }
      q('#in-repos-contenido').innerHTML =
        '<div class="tabla-scroll"><table class="tabla-datos">'+
          '<thead><tr>'+
            '<th>Producto</th><th>Categoría</th>'+
            '<th style="text-align:right">Existencia</th>'+
            '<th style="text-align:right">Stock mínimo</th>'+
            '<th style="text-align:right">Unidades a reponer</th>'+
            '<th style="text-align:right">Costo est. reposición (C$)</th>'+
            '<th>Estado</th>'+
          '</tr></thead><tbody>'+
          repos.map(p=>{
            const costoRep = p.falta * p.costo;
            return '<tr>'+
              '<td><strong>'+p.n+'</strong></td>'+
              '<td style="font-size:12px;color:var(--suave)">'+p.cat+'</td>'+
              '<td style="text-align:right;font-weight:600;color:var(--malo)">'+Fmt.num(p.final,0)+'</td>'+
              '<td style="text-align:right">'+Fmt.num(p.min,0)+'</td>'+
              '<td style="text-align:right;font-weight:700;color:var(--alerta)">'+Fmt.num(p.falta,0)+'</td>'+
              '<td style="text-align:right">'+Fmt.moneda(costoRep)+'</td>'+
              '<td>'+Inventario.chipEstado(p.estado)+'</td>'+
            '</tr>';
          }).join('')+
          '<tr class="total">'+
            '<td colspan="4">Total estimado de reposición</td>'+
            '<td style="text-align:right">'+Fmt.num(repos.reduce((s,p)=>s+p.falta,0),0)+'</td>'+
            '<td style="text-align:right">'+Fmt.moneda(repos.reduce((s,p)=>s+p.falta*p.costo,0))+'</td>'+
            '<td></td>'+
          '</tr>'+
        '</tbody></table></div>'+
        '<p class="nota-pie" style="margin-top:10px">'+
          Inventario.ico.compra.replace('width="20" height="20"','width="13" height="13"')+
          ' El costo estimado de reposición puede usarse como referencia en el módulo de Planeación Financiera → presupuesto de compras.'+
        '</p>';
    };

    /* ── Función principal de refresco ── */
    const refrescar = () => {
      const x  = leer();
      Datos.guardar('inventario_v2', x);
      datos.movimientos = x.movimientos;

      let totalValor = 0, reponer = [], agotados = [], errores = [];

      raiz.querySelectorAll('tr.prod').forEach((t, i) => {
        const p = x.productos[i];
        if (!p) return;
        const c = Inventario.calcular(p);
        totalValor += c.valor;
        t.querySelector('.r-final').textContent = Fmt.num(c.final, 0);
        t.querySelector('.r-valor').textContent  = Fmt.moneda(c.valor);
        t.querySelector('.r-estado').innerHTML   = Inventario.chipEstado(c.estado);
        if (c.estado === 'Reponer')  reponer.push(p.n);
        if (c.estado === 'Agotado')  agotados.push(p.n);
        if (c.estado === 'Error')    errores.push(p.n);
      });

      /* KPIs */
      const kpi = (ico, t, v, n, cls) =>
        '<div class="tarjeta'+(cls?' dash-kpi '+cls:'')+'">'+
          '<h3 style="display:flex;align-items:center;gap:6px"><span style="opacity:.7">'+ico+'</span>'+t+'</h3>'+
          '<div class="valor">'+v+'</div>'+
          '<div class="nota">'+n+'</div>'+
        '</div>';
      const alertaCls = errores.length||agotados.length ? 'riesgo' : reponer.length ? 'alerta' : '';
      q('#in-tarjetas').innerHTML =
        kpi(Inventario.ico.valor,  'Valor del inventario', Fmt.moneda(totalValor), 'Suma de existencia × costo') +
        kpi(Inventario.ico.caja,   'Productos', x.productos.length, 'En el control') +
        kpi(Inventario.ico.alerta, 'Por reponer / agotados',
            (reponer.length + agotados.length),
            'Existencia ≤ stock mínimo', alertaCls) +
        kpi(Inventario.ico.historia,'Movimientos', x.movimientos.length, 'Registrados en el historial');

      /* Alerta principal */
      const alertaEl = q('#in-alerta');
      if (errores.length) {
        alertaEl.innerHTML =
          '<div style="background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;'+
          'color:var(--malo);display:flex;align-items:center;gap:10px;font-weight:600">'+
          Inventario.ico.error+' Las salidas superan la existencia disponible en: '+errores.join(', ')+'</div>';
      } else if (agotados.length) {
        alertaEl.innerHTML =
          '<div style="background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;'+
          'color:var(--malo);display:flex;align-items:center;gap:10px;font-weight:600">'+
          Inventario.ico.agotado+' Productos agotados: '+agotados.join(', ')+'</div>';
      } else if (reponer.length) {
        alertaEl.innerHTML =
          '<div style="background:var(--alerta-bg);border-left:4px solid var(--alerta);padding:12px 16px;border-radius:6px;'+
          'color:var(--alerta);display:flex;align-items:center;gap:10px;font-weight:600">'+
          Inventario.ico.reponer+' Alerta de reposición: '+reponer.join(', ')+'</div>';
      } else {
        alertaEl.innerHTML =
          '<div class="cuadre ok" style="display:flex;align-items:center;gap:8px">'+
          Inventario.ico.normal+' Todos los productos están sobre su stock mínimo.</div>';
      }

      /* Tabla de reposición */
      renderRepos(x.productos);

      /* Búsqueda */
      const termino = (q('#in-buscar').value||'').toLowerCase().trim();
      raiz.querySelectorAll('tr.prod').forEach(t => {
        const n   = (t.querySelector('[data-k="n"]').value||'').toLowerCase();
        const cat = (t.querySelector('[data-k="cat"]').value||'').toLowerCase();
        t.style.display = (!termino || n.includes(termino) || cat.includes(termino)) ? '' : 'none';
      });

      /* Selects de movimiento */
      actualizarSelects(x.productos);

      /* Gráfica */
      if (Inventario.graf) { try{ Inventario.graf.destroy(); }catch(e){} Inventario.graf=null; }
      const grafEl = q('#in-grafico');
      grafEl.style.display = x.productos.length ? '' : 'none';
      if (typeof Chart !== 'undefined' && x.productos.length) {
        const colores = x.productos.map(p => {
          const c = Inventario.calcular(p);
          return c.estado==='Normal' ? 'var(--ok)' : c.estado==='Reponer' ? 'var(--alerta)' : 'var(--malo)';
        });
        Inventario.graf = new Chart(grafEl, {
          type:'bar',
          data:{
            labels: x.productos.map(p=>p.n),
            datasets:[
              { label:'Existencia final', data: x.productos.map(p=>Math.max(0,p.ini+p.ent-p.sal)),
                backgroundColor: colores, borderRadius:4 },
              { label:'Stock mínimo',     data: x.productos.map(p=>p.min),
                backgroundColor:'rgba(140,59,94,.22)', borderColor:'var(--acento)',
                borderWidth:2, borderRadius:4, type:'bar' }
            ]
          },
          options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ position:'bottom' },
              tooltip:{ callbacks:{ label: t=>' '+t.dataset.label+': '+Fmt.num(t.raw,0)+' unid.' } } },
            scales:{ y:{ beginAtZero:true, ticks:{ callback:v=>Fmt.num(v,0) } } }
          }
        });
      }

      /* Historial */
      const filtroActual = q('#in-mov-filtro-prod').value;
      renderHist(x.movimientos, filtroActual);
    };

    /* ── Eventos ── */
    raiz.addEventListener('input', e => {
      if (!e.target.matches('#in-buscar,#in-mov-fecha,#in-mov-cant,#in-mov-nota')) refrescar();
      else if (e.target.id==='in-buscar') refrescar();
    });
    raiz.addEventListener('change', e => {
      if (!e.target.matches('#in-mov-prod,#in-mov-tipo,#in-mov-filtro-prod')) refrescar();
      if (e.target.id==='in-mov-filtro-prod') {
        const x = leer();
        renderHist(x.movimientos, e.target.value);
      }
    });
    raiz.addEventListener('click', e => {
      /* Quitar producto */
      if (e.target.closest('.quitar') && !e.target.closest('.quitar-mov')) {
        e.target.closest('tr').remove(); refrescar(); return;
      }
      /* Quitar movimiento */
      const btnMov = e.target.closest('.quitar-mov');
      if (btnMov) {
        const idx = +btnMov.dataset.idx;
        const x   = leer();
        x.movimientos.splice(idx, 1);
        datos.movimientos = x.movimientos;
        Datos.guardar('inventario_v2', x);
        renderHist(x.movimientos, q('#in-mov-filtro-prod').value);
        return;
      }
    });

    q('#in-add').addEventListener('click', () => {
      const x  = leer();
      const id = Inventario._nextId(x.productos);
      q('#in-tbody').insertAdjacentHTML('beforeend',
        Inventario.fila({ id, n:'Nuevo producto', cat:'General', ini:0, ent:0, sal:0, costo:0, min:0 }));
      Validar.activar(raiz); refrescar();
    });

    q('#in-ejemplo').addEventListener('click', () => {
      Datos.guardar('inventario_v2', Inventario.ejemplo());
      Inventario.render(el); Validar.activar(el);
    });

    q('#in-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar todos los productos y movimientos?')) {
        Datos.guardar('inventario_v2', { productos:[], movimientos:[] });
        Inventario.render(el); Validar.activar(el);
      }
    });

    /* Registrar movimiento */
    q('#in-mov-agregar').addEventListener('click', () => {
      const prod  = q('#in-mov-prod').value;
      const tipo  = q('#in-mov-tipo').value;
      const cant  = Fmt.aNum(q('#in-mov-cant').value);
      const fecha = q('#in-mov-fecha').value;
      const nota  = q('#in-mov-nota').value.trim();
      if (!prod || cant <= 0) return;

      /* Validar que salida no supere existencia */
      const x = leer();
      if (tipo === 'Salida') {
        const p = x.productos.find(pr=>pr.n===prod);
        if (p) {
          const existencia = p.ini + p.ent - p.sal;
          if (cant > existencia) {
            const alertaEl = q('#in-alerta');
            alertaEl.innerHTML =
              '<div style="background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;'+
              'color:var(--malo);display:flex;align-items:center;gap:10px;font-weight:600">'+
              Inventario.ico.error+' La salida de '+Fmt.num(cant,0)+' unidades supera la existencia disponible ('+Fmt.num(existencia,0)+') de '+prod+'.</div>';
            return;
          }
          /* Aplicar automáticamente al campo sal */
          const fila = [...raiz.querySelectorAll('tr.prod')].find(t=>t.querySelector('[data-k="n"]').value===prod);
          if (fila) {
            const inpSal = fila.querySelector('[data-k="sal"]');
            inpSal.value = p.sal + cant;
          }
        }
      } else {
        /* Entrada: aumentar ent */
        const fila = [...raiz.querySelectorAll('tr.prod')].find(t=>t.querySelector('[data-k="n"]').value===prod);
        if (fila) {
          const p     = x.productos.find(pr=>pr.n===prod);
          const inpEnt = fila.querySelector('[data-k="ent"]');
          inpEnt.value = (p?p.ent:0) + cant;
        }
      }

      /* Guardar movimiento */
      const xActual = leer();
      xActual.movimientos.push({ fecha, prod, tipo, cant, nota });
      datos.movimientos = xActual.movimientos;
      Datos.guardar('inventario_v2', xActual);
      q('#in-mov-cant').value  = '';
      q('#in-mov-nota').value  = '';
      refrescar();
    });

    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.inventario = {
  titulo:    'Control de inventario',
  subtitulo: 'Existencias, movimientos, alertas de reposición y necesidades de compra',
  render(el) { Inventario.render(el); }
};