// Módulo 9: Control de inventario — versión con ID único, historial por producto, edición y exportación
const Inventario = {
  graf: null,
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
    edit:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    ver:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
  },

  ejemplo() {
    return {
      productos: [
        { id:1, n:'Arroz',       cat:'Alimentos',  ini:100, costo:25,  min:40 },
        { id:2, n:'Frijoles',    cat:'Alimentos',  ini:80,  costo:30,  min:40 },
        { id:3, n:'Aceite',      cat:'Alimentos',  ini:60,  costo:55,  min:30 },
        { id:4, n:'Azúcar',      cat:'Alimentos',  ini:90,  costo:20,  min:35 },
        { id:5, n:'Resma carta', cat:'Papelería',  ini:30,  costo:120, min:15 }
      ],
      movimientos: [
        { id:1, fecha:'2026-11-01', prodId:1, tipo:'Entrada', cant:50,  costo:25,  nota:'Compra mensual' },
        { id:2, fecha:'2026-11-03', prodId:1, tipo:'Salida',  cant:20,  costo:25,  nota:'Despacho bodega' },
        { id:3, fecha:'2026-11-05', prodId:2, tipo:'Salida',  cant:30,  costo:30,  nota:'Venta' },
        { id:4, fecha:'2026-11-07', prodId:3, tipo:'Salida',  cant:35,  costo:55,  nota:'Consumo interno' },
        { id:5, fecha:'2026-11-10', prodId:4, tipo:'Entrada', cant:40,  costo:20,  nota:'Compra mensual' }
      ]
    };
  },

  obtener() { return Datos.leer('inventario_v2', Inventario.ejemplo()); },
  _nextId(lista) { return lista.length ? Math.max(...lista.map(x=>x.id||0))+1 : 1; },

  // ── Calcula existencia final sumando movimientos por producto (ID) ────────
  // Esto garantiza que renombrar un producto no rompa sus movimientos.
  calcularDesdeMovimientos(prod, movimientos) {
    const mvProd = movimientos.filter(m => m.prodId === prod.id);
    const ent = mvProd.filter(m=>m.tipo==='Entrada').reduce((s,m)=>s+m.cant, 0);
    const sal = mvProd.filter(m=>m.tipo==='Salida').reduce((s,m)=>s+m.cant, 0);
    const final  = prod.ini + ent - sal;
    const valor  = final > 0 ? final * prod.costo : 0;
    // Valor ponderado: usa el costo de cada movimiento de entrada si existe
    const entradas = mvProd.filter(m=>m.tipo==='Entrada');
    const costosProm = entradas.length
      ? entradas.reduce((s,m)=>s+(m.costo||prod.costo)*m.cant, 0) / entradas.reduce((s,m)=>s+m.cant,0)
      : prod.costo;
    const estado = sal > prod.ini + ent ? 'Error'
                 : final === 0           ? 'Agotado'
                 : final <= prod.min     ? 'Reponer'
                 :                        'Normal';
    const falta  = estado==='Reponer'||estado==='Agotado' ? Math.max(prod.min-final,0) : 0;
    return { ent, sal, final, valor, estado, falta, costosProm };
  },

  chipEstado(estado) {
    const cfg = {
      Normal:  { cls:'ok',     ico:'normal',  txt:'Normal'  },
      Reponer: { cls:'alerta', ico:'reponer', txt:'Reponer' },
      Agotado: { cls:'riesgo', ico:'agotado', txt:'Agotado' },
      Error:   { cls:'riesgo', ico:'error',   txt:'Error'   }
    };
    const c = cfg[estado] || cfg.Error;
    return '<span class="chip '+c.cls+'" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;font-size:12px;font-weight:600">'+
      Inventario.ico[c.ico]+c.txt+'</span>';
  },

  filaProducto(p) {
    return '<tr class="prod" data-id="'+(p.id||0)+'">' +
      '<td><input type="text" data-validar="nombre" data-k="n" value="'+(p.n||'')+'" style="min-width:120px"></td>' +
      '<td><input type="text" data-k="cat" value="'+(p.cat||'')+'" style="min-width:90px"></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="ini" value="'+(p.ini||0)+'"></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="costo" value="'+(p.costo||0)+'"></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="min" value="'+(p.min||0)+'"></td>' +
      '<td class="r-ent"  style="text-align:right;font-weight:600;color:var(--ok)"></td>' +
      '<td class="r-sal"  style="text-align:right;font-weight:600;color:var(--malo)"></td>' +
      '<td class="r-final" style="text-align:right;font-weight:700"></td>' +
      '<td class="r-valor" style="text-align:right"></td>' +
      '<td class="r-estado"></td>' +
      '<td style="text-align:center;white-space:nowrap">' +
        '<button class="btn sec ver-hist-prod" data-id="'+(p.id||0)+'" title="Ver historial de este producto" style="padding:5px 8px;margin-right:3px">'+Inventario.ico.ver+'</button>' +
        '<button class="btn sec quitar-prod" title="Quitar producto" style="padding:5px 8px">'+Inventario.ico.quitar+'</button>' +
      '</td>' +
    '</tr>';
  },

  render(el) {
    const datos = Inventario.obtener();
    // Asegurar que todos los movimientos tengan ID único
    datos.movimientos = datos.movimientos.map((m, i) => ({ id: m.id || (i+1), ...m }));
    // Migración: si movimientos usan 'prod' (nombre) en vez de 'prodId', migramos
    datos.movimientos = datos.movimientos.map(m => {
      if (m.prodId) return m;
      const p = datos.productos.find(x => x.n === m.prod);
      return { ...m, prodId: p ? p.id : 0 };
    });

    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso" style="margin-bottom:16px">'+
        'Existencia final = Inicial + Entradas − Salidas (calculado desde los movimientos registrados). '+
        'Los movimientos se vinculan por ID de producto: renombrar un producto no afecta su historial. '+
        'Cada movimiento puede llevar su propio costo unitario para valoración precisa.'+
      '</div>'+

      /* ── Búsqueda y filtros ── */
      '<div class="barra-acciones" style="margin-bottom:12px;align-items:center;flex-wrap:wrap;gap:8px">'+
        '<button class="btn" id="in-add" style="display:flex;align-items:center;gap:6px">'+Inventario.ico.agregar+'Agregar producto</button>'+
        '<button class="btn sec" id="in-ejemplo">Cargar ejemplo</button>'+
        '<button class="btn sec peligro" id="in-limpiar">Limpiar datos</button>'+
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
          '<select id="in-filtro-cat" style="font-size:13px;padding:7px 10px;border:1px solid #dde3ec;border-radius:7px"><option value="">— Todas las categorías —</option></select>'+
          '<select id="in-filtro-estado" style="font-size:13px;padding:7px 10px;border:1px solid #dde3ec;border-radius:7px">'+
            '<option value="">— Todos los estados —</option>'+
            '<option value="Normal">Normal</option>'+
            '<option value="Reponer">Reponer</option>'+
            '<option value="Agotado">Agotado</option>'+
            '<option value="Error">Error</option>'+
          '</select>'+
          '<div style="position:relative;display:flex;align-items:center">'+
            '<span style="position:absolute;left:10px;color:var(--suave);pointer-events:none">'+Inventario.ico.buscar+'</span>'+
            '<input type="text" id="in-buscar" placeholder="Buscar…" style="padding-left:34px;min-width:180px;font-size:13px">'+
          '</div>'+
        '</div>'+
      '</div>'+

      /* ── Tabla de productos ── */
      '<div class="tarjeta" style="margin-bottom:14px">'+
        '<div class="tabla-scroll">'+
          '<table class="tabla-datos" id="in-tabla">'+
            '<thead><tr>'+
              '<th>Producto</th><th>Categoría</th>'+
              '<th style="text-align:right">Ini.</th>'+
              '<th style="text-align:right">Costo (C$)</th>'+
              '<th style="text-align:right">Mín.</th>'+
              '<th style="text-align:right;color:var(--ok)">Entradas</th>'+
              '<th style="text-align:right;color:var(--malo)">Salidas</th>'+
              '<th style="text-align:right">Final</th>'+
              '<th style="text-align:right">Valor (C$)</th>'+
              '<th>Estado</th><th></th>'+
            '</tr></thead>'+
            '<tbody id="in-tbody">'+
              datos.productos.map(Inventario.filaProducto).join('')+
            '</tbody>'+
            '<tfoot><tr class="total">'+
              '<td colspan="8">Total del inventario</td>'+
              '<td class="r-total-valor" style="text-align:right"></td>'+
              '<td colspan="2"></td>'+
            '</tr></tfoot>'+
          '</table>'+
        '</div>'+
      '</div>'+

      /* ── KPIs ── */
      '<div class="rejilla" id="in-tarjetas" style="margin-bottom:14px"></div>'+
      '<div id="in-alerta" style="margin-bottom:14px"></div>'+

      /* ── Tabla de reposición ── */
      '<div class="tarjeta" id="in-bloque-repos" style="margin-bottom:14px">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'+
          '<span style="color:var(--alerta)">'+Inventario.ico.alerta+'</span> Necesidades de reposición y compra'+
        '</h3>'+
        '<div id="in-repos-contenido"></div>'+
      '</div>'+

      /* ── Gráfica ── */
      '<div class="tarjeta" style="margin-bottom:14px">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+Inventario.ico.conteo+' Existencia final vs stock mínimo</h3>'+
        '<div class="grafico"><canvas id="in-grafico"></canvas></div>'+
      '</div>'+

      /* ── Historial de producto (modal inline) ── */
      '<div id="in-hist-modal" style="display:none;margin-bottom:14px"></div>'+

      /* ── Panel de movimientos ── */
      '<div class="tarjeta">'+
        '<h3 style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'+Inventario.ico.historia+' Registrar movimiento</h3>'+
        '<div class="barra-acciones" style="margin-bottom:12px;align-items:flex-end;flex-wrap:wrap;gap:8px">'+
          '<label class="campo" style="min-width:140px">Fecha<input type="date" id="in-mov-fecha" value="'+new Date().toISOString().slice(0,10)+'"></label>'+
          '<label class="campo" style="min-width:160px">Producto<select id="in-mov-prod"></select></label>'+
          '<label class="campo" style="min-width:110px">Tipo<select id="in-mov-tipo"><option>Entrada</option><option>Salida</option></select></label>'+
          '<label class="campo corto" style="min-width:90px">Cantidad<input type="text" inputmode="decimal" id="in-mov-cant" placeholder="0"></label>'+
          '<label class="campo corto" style="min-width:90px">Costo unit. (C$)<input type="text" inputmode="decimal" id="in-mov-costo" placeholder="Autom."></label>'+
          '<label class="campo" style="min-width:150px">Nota<input type="text" id="in-mov-nota" placeholder="Opcional"></label>'+
          '<button class="btn" id="in-mov-agregar" style="display:flex;align-items:center;gap:6px">'+Inventario.ico.mover+'Registrar</button>'+
        '</div>'+
        '<div id="in-mov-error" style="margin-bottom:8px"></div>'+

        '<h3 style="margin-top:14px;margin-bottom:10px;font-size:.95rem">Historial de todos los movimientos</h3>'+
        '<div class="barra-acciones" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">'+
          '<label class="campo" style="max-width:200px">Producto<select id="in-mov-filtro-prod"><option value="">— Todos —</option></select></label>'+
          '<label class="campo" style="max-width:160px">Tipo<select id="in-mov-filtro-tipo"><option value="">— Todos —</option><option>Entrada</option><option>Salida</option></select></label>'+
          '<label class="campo" style="max-width:150px">Desde<input type="date" id="in-mov-filtro-desde"></label>'+
          '<label class="campo" style="max-width:150px">Hasta<input type="date" id="in-mov-filtro-hasta"></label>'+
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
          ini:   Fmt.aNum(v('ini')),
          costo: Fmt.aNum(v('costo')),
          min:   Fmt.aNum(v('min'))
        };
      }),
      movimientos: datos.movimientos
    });

    // ── Actualizar selects de movimientos ──────────────────────────────────
    const actualizarSelects = (productos) => {
      const opts      = productos.map(p=>'<option value="'+p.id+'">'+p.n+'</option>').join('');
      const selProd   = q('#in-mov-prod');
      const selFiltro = q('#in-mov-filtro-prod');
      const antProd   = selProd.value, antFiltro = selFiltro.value;
      selProd.innerHTML   = opts;
      selFiltro.innerHTML = '<option value="">— Todos —</option>'+opts;
      if (antProd   && [...selProd.options].some(o=>o.value===antProd))   selProd.value   = antProd;
      if (antFiltro && [...selFiltro.options].some(o=>o.value===antFiltro)) selFiltro.value = antFiltro;
    };

    // ── Actualizar filtro de categorías ───────────────────────────────────
    const actualizarFiltroCat = (productos) => {
      const cats = [...new Set(productos.map(p=>p.cat).filter(Boolean))].sort();
      const sel  = q('#in-filtro-cat');
      const ant  = sel.value;
      sel.innerHTML = '<option value="">— Todas las categorías —</option>' +
        cats.map(c=>'<option value="'+c+'">'+c+'</option>').join('');
      if (ant && [...sel.options].some(o=>o.value===ant)) sel.value = ant;
    };

    // ── Render historial completo con edición inline ───────────────────────
    const renderHist = (movimientos, productos, filtroProd, filtroTipo, desde, hasta) => {
      let lista = movimientos.filter(m => {
        if (filtroProd && m.prodId !== +filtroProd) return false;
        if (filtroTipo && m.tipo !== filtroTipo) return false;
        if (desde && m.fecha < desde) return false;
        if (hasta && m.fecha > hasta) return false;
        return true;
      });
      const histEl = q('#in-hist-tabla');
      if (!lista.length) {
        histEl.innerHTML = '<p style="color:var(--suave);font-size:13px;padding:10px 0">Sin movimientos con los filtros actuales.</p>';
        return;
      }
      const listaOrden = [...lista].sort((a,b)=>b.fecha.localeCompare(a.fecha));
      histEl.innerHTML =
        '<div class="tabla-scroll"><table class="tabla-datos">'+
        '<thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th>'+
          '<th style="text-align:right">Cant.</th>'+
          '<th style="text-align:right">Costo unit.</th>'+
          '<th>Nota</th><th></th></tr></thead><tbody>'+
        listaOrden.map(m => {
          const prod = productos.find(p=>p.id===m.prodId);
          const nomProd = prod ? prod.n : ('ID: '+m.prodId);
          const color   = m.tipo==='Entrada' ? 'var(--ok)' : 'var(--malo)';
          // Si el movimiento está en modo edición
          if (m._editando) {
            return '<tr data-movid="'+m.id+'" class="in-fila-edit">'+
              '<td><input type="date" class="in-ed-fecha" value="'+m.fecha+'" style="min-width:120px"></td>'+
              '<td><strong>'+nomProd+'</strong></td>'+
              '<td><select class="in-ed-tipo"><option'+(m.tipo==='Entrada'?' selected':'')+'>Entrada</option><option'+(m.tipo==='Salida'?' selected':'')+'>Salida</option></select></td>'+
              '<td><input type="text" inputmode="decimal" class="in-ed-cant" value="'+m.cant+'" style="width:70px;text-align:right"></td>'+
              '<td><input type="text" inputmode="decimal" class="in-ed-costo" value="'+(m.costo||'')+'" placeholder="—" style="width:80px;text-align:right"></td>'+
              '<td><input type="text" class="in-ed-nota" value="'+(m.nota||'')+'" style="min-width:120px"></td>'+
              '<td style="white-space:nowrap">'+
                '<button class="btn in-ed-guardar" data-movid="'+m.id+'" style="padding:4px 8px;font-size:12px;margin-right:3px">Guardar</button>'+
                '<button class="btn sec in-ed-cancelar" data-movid="'+m.id+'" style="padding:4px 8px;font-size:12px">✕</button>'+
              '</td></tr>';
          }
          return '<tr data-movid="'+m.id+'">'+
            '<td style="font-size:12px;color:var(--suave)">'+m.fecha+'</td>'+
            '<td><strong>'+nomProd+'</strong></td>'+
            '<td><span class="chip '+(m.tipo==='Entrada'?'ok':'riesgo')+'" style="font-size:11px;font-weight:600;padding:2px 9px">'+m.tipo+'</span></td>'+
            '<td style="text-align:right;font-weight:600;color:'+color+'">'+(m.tipo==='Entrada'?'+':'-')+Fmt.num(m.cant,0)+'</td>'+
            '<td style="text-align:right;font-size:12px;color:var(--suave)">'+(m.costo ? Fmt.moneda(m.costo) : '—')+'</td>'+
            '<td style="font-size:12px;color:var(--suave)">'+(m.nota||'—')+'</td>'+
            '<td style="text-align:center;white-space:nowrap">'+
              '<button class="btn sec in-edit-mov" data-movid="'+m.id+'" title="Editar" style="padding:4px 7px;margin-right:3px">'+Inventario.ico.edit+'</button>'+
              '<button class="btn sec quitar-mov" data-movid="'+m.id+'" title="Eliminar" style="padding:4px 7px">'+Inventario.ico.quitar+'</button>'+
            '</td></tr>';
        }).join('')+
        '</tbody></table></div>'+
        '<p class="nota-pie" style="margin-top:8px">'+lista.length+' movimiento(s) mostrado(s) · '+
          'Total entradas: '+Fmt.num(lista.filter(m=>m.tipo==='Entrada').reduce((s,m)=>s+m.cant,0),0)+' u · '+
          'Total salidas: '+Fmt.num(lista.filter(m=>m.tipo==='Salida').reduce((s,m)=>s+m.cant,0),0)+' u</p>';
    };

    // ── Historial de un producto específico (panel inline) ─────────────────
    const renderHistProd = (prodId, productos, movimientos) => {
      const prod  = productos.find(p=>p.id===prodId);
      const modal = q('#in-hist-modal');
      if (!prod) { modal.style.display='none'; return; }
      const mvs   = [...movimientos.filter(m=>m.prodId===prodId)]
        .sort((a,b)=>a.fecha.localeCompare(b.fecha));
      const c     = Inventario.calcularDesdeMovimientos(prod, movimientos);
      let acum    = prod.ini, filas = '';
      mvs.forEach(m => {
        const ant = acum;
        acum += m.tipo==='Entrada' ? m.cant : -m.cant;
        filas += '<tr>'+
          '<td style="font-size:12px">'+m.fecha+'</td>'+
          '<td><span class="chip '+(m.tipo==='Entrada'?'ok':'riesgo')+'" style="font-size:11px;padding:2px 8px">'+m.tipo+'</span></td>'+
          '<td style="text-align:right;color:'+(m.tipo==='Entrada'?'var(--ok)':'var(--malo)');'+font-weight:600">'+(m.tipo==='Entrada'?'+':'-')+Fmt.num(m.cant,0)+'</td>'+
          '<td style="text-align:right">'+(m.costo?Fmt.moneda(m.costo):'—')+'</td>'+
          '<td style="text-align:right;font-weight:700">'+Fmt.num(acum,0)+'</td>'+
          '<td style="font-size:12px;color:var(--suave)">'+(m.nota||'—')+'</td>'+
        '</tr>';
      });
      modal.style.display = '';
      modal.innerHTML =
        '<div class="tarjeta" style="border:2px solid var(--primario-bg)">'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'+
            '<h3 style="margin:0;flex:1">Historial de <strong>'+prod.n+'</strong></h3>'+
            '<button class="btn sec" id="in-cerrar-hist-prod" style="padding:4px 10px;font-size:12px">Cerrar</button>'+
          '</div>'+
          '<div class="dos-col" style="margin-bottom:12px">'+
            '<div style="padding:10px;background:var(--arena-2);border-radius:8px"><strong>Inicial:</strong> '+Fmt.num(prod.ini,0)+' u</div>'+
            '<div style="padding:10px;background:var(--ok-bg);border-radius:8px"><strong>Entradas:</strong> '+Fmt.num(c.ent,0)+' u</div>'+
            '<div style="padding:10px;background:var(--malo-bg);border-radius:8px"><strong>Salidas:</strong> '+Fmt.num(c.sal,0)+' u</div>'+
            '<div style="padding:10px;background:var(--arena-2);border-radius:8px;font-weight:700"><strong>Final:</strong> '+Fmt.num(c.final,0)+' u · '+Inventario.chipEstado(c.estado)+'</div>'+
          '</div>'+
          (filas
            ? '<div class="tabla-scroll"><table class="tabla-datos">'+
              '<thead><tr><th>Fecha</th><th>Tipo</th><th style="text-align:right">Cant.</th>'+
              '<th style="text-align:right">Costo unit.</th>'+
              '<th style="text-align:right">Existencia acum.</th><th>Nota</th></tr></thead>'+
              '<tbody>'+
                '<tr><td colspan="2" style="font-size:12px;color:var(--suave)">Existencia inicial</td>'+
                '<td></td><td></td><td style="text-align:right;font-weight:700">'+Fmt.num(prod.ini,0)+'</td><td></td></tr>'+
                filas+
              '</tbody></table></div>'
            : '<p style="color:var(--suave);font-size:13px">Sin movimientos registrados para este producto.</p>')+
        '</div>';
      modal.scrollIntoView({ behavior:'smooth', block:'nearest' });
      q('#in-cerrar-hist-prod').addEventListener('click', ()=>{ modal.style.display='none'; });
    };

    // ── Render de reposición ───────────────────────────────────────────────
    const renderRepos = (productos, movimientos) => {
      const repos = productos.map(p=>({ ...p, ...Inventario.calcularDesdeMovimientos(p, movimientos) }))
        .filter(p=>p.estado==='Reponer'||p.estado==='Agotado'||p.estado==='Error');
      if (!repos.length) {
        q('#in-repos-contenido').innerHTML =
          '<div class="cuadre ok" style="font-size:13px;display:flex;align-items:center;gap:8px">'+
            Inventario.ico.normal+' Todos los productos están sobre su stock mínimo.'+
          '</div>';
        return;
      }
      q('#in-repos-contenido').innerHTML =
        '<div class="tabla-scroll"><table class="tabla-datos">'+
        '<thead><tr>'+
          '<th>Producto</th><th>Categoría</th>'+
          '<th style="text-align:right">Existencia</th>'+
          '<th style="text-align:right">Stock mínimo</th>'+
          '<th style="text-align:right">A reponer</th>'+
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
          '<td colspan="4">Total estimado reposición</td>'+
          '<td style="text-align:right">'+Fmt.num(repos.reduce((s,p)=>s+p.falta,0),0)+'</td>'+
          '<td style="text-align:right">'+Fmt.moneda(repos.reduce((s,p)=>s+p.falta*p.costo,0))+'</td>'+
          '<td></td>'+
        '</tr>'+
        '</tbody></table></div>';
    };

    // ── Función de refresco principal ─────────────────────────────────────
    const refrescar = () => {
      const x = leer();
      Datos.guardar('inventario_v2', x);

      let totalValor = 0, reponer = [], agotados = [], errores = [];

      raiz.querySelectorAll('tr.prod').forEach(t => {
        const id = +t.dataset.id;
        const p  = x.productos.find(pr=>pr.id===id);
        if (!p) return;
        const c = Inventario.calcularDesdeMovimientos(p, x.movimientos);
        totalValor += c.valor;
        t.querySelector('.r-ent').textContent   = '+' + Fmt.num(c.ent, 0);
        t.querySelector('.r-sal').textContent   = '-' + Fmt.num(c.sal, 0);
        t.querySelector('.r-final').textContent = Fmt.num(c.final, 0);
        t.querySelector('.r-valor').textContent  = Fmt.moneda(c.valor);
        t.querySelector('.r-estado').innerHTML  = Inventario.chipEstado(c.estado);
        if (c.estado==='Reponer') reponer.push(p.n);
        if (c.estado==='Agotado') agotados.push(p.n);
        if (c.estado==='Error')   errores.push(p.n);
      });

      // Total en tfoot
      const rfv = raiz.querySelector('.r-total-valor');
      if (rfv) rfv.textContent = Fmt.moneda(totalValor);

      // KPIs
      const kpi = (ico, t, v, n, cls) =>
        '<div class="tarjeta'+(cls?' dash-kpi '+cls:'')+'">'+
          '<h3 style="display:flex;align-items:center;gap:6px"><span style="opacity:.7">'+ico+'</span>'+t+'</h3>'+
          '<div class="valor">'+v+'</div><div class="nota">'+n+'</div></div>';
      const alertaCls = errores.length||agotados.length ? 'riesgo' : reponer.length ? 'alerta' : '';
      q('#in-tarjetas').innerHTML =
        kpi(Inventario.ico.valor,   'Valor total del inventario', Fmt.moneda(totalValor), 'Suma existencia × costo por producto')+
        kpi(Inventario.ico.caja,    'Productos',               x.productos.length,  'En el control')+
        kpi(Inventario.ico.alerta,  'Por reponer / agotados',  reponer.length+agotados.length, 'Existencia ≤ stock mínimo', alertaCls)+
        kpi(Inventario.ico.historia,'Movimientos',             x.movimientos.length,'Registrados en el historial');

      // Alerta principal
      const alertaEl = q('#in-alerta');
      if (errores.length)
        alertaEl.innerHTML = '<div style="background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;color:var(--malo);display:flex;align-items:center;gap:10px;font-weight:600">'+Inventario.ico.error+' Salidas superan la existencia disponible en: '+errores.join(', ')+'</div>';
      else if (agotados.length)
        alertaEl.innerHTML = '<div style="background:var(--malo-bg);border-left:4px solid var(--malo);padding:12px 16px;border-radius:6px;color:var(--malo);display:flex;align-items:center;gap:10px;font-weight:600">'+Inventario.ico.agotado+' Productos agotados: '+agotados.join(', ')+'</div>';
      else if (reponer.length)
        alertaEl.innerHTML = '<div style="background:var(--alerta-bg);border-left:4px solid var(--alerta);padding:12px 16px;border-radius:6px;color:var(--alerta);display:flex;align-items:center;gap:10px;font-weight:600">'+Inventario.ico.reponer+' Alerta de reposición: '+reponer.join(', ')+'</div>';
      else
        alertaEl.innerHTML = '<div class="cuadre ok" style="display:flex;align-items:center;gap:8px">'+Inventario.ico.normal+' Todos los productos están sobre su stock mínimo.</div>';

      // Tabla reposición
      renderRepos(x.productos, x.movimientos);

      // Filtros de búsqueda en tabla de productos
      const termino      = (q('#in-buscar').value||'').toLowerCase().trim();
      const filtroCat    = q('#in-filtro-cat').value;
      const filtroEstado = q('#in-filtro-estado').value;
      raiz.querySelectorAll('tr.prod').forEach(t => {
        const id  = +t.dataset.id;
        const p   = x.productos.find(pr=>pr.id===id);
        if (!p) { t.style.display='none'; return; }
        const c   = Inventario.calcularDesdeMovimientos(p, x.movimientos);
        const nom = p.n.toLowerCase(), cat = (p.cat||'').toLowerCase();
        const ok  = (!termino      || nom.includes(termino) || cat.includes(termino))
                 && (!filtroCat    || p.cat === filtroCat)
                 && (!filtroEstado || c.estado === filtroEstado);
        t.style.display = ok ? '' : 'none';
      });

      // Actualizar selects
      actualizarSelects(x.productos);
      actualizarFiltroCat(x.productos);

      // Gráfica
      if (Inventario.graf) { try{Inventario.graf.destroy();}catch(e){} Inventario.graf=null; }
      const grafEl = q('#in-grafico');
      if (typeof Chart !== 'undefined' && x.productos.length) {
        grafEl.style.display = '';
        const colores = x.productos.map(p => {
          const c = Inventario.calcularDesdeMovimientos(p, x.movimientos);
          return c.estado==='Normal' ? 'var(--ok)' : c.estado==='Reponer' ? 'var(--alerta)' : 'var(--malo)';
        });
        Inventario.graf = new Chart(grafEl, {
          type:'bar',
          data:{
            labels: x.productos.map(p=>p.n),
            datasets:[
              { label:'Existencia final', data:x.productos.map(p=>Math.max(0,Inventario.calcularDesdeMovimientos(p,x.movimientos).final)),
                backgroundColor:colores, borderRadius:4 },
              { label:'Stock mínimo',     data:x.productos.map(p=>p.min),
                backgroundColor:'rgba(140,59,94,.22)', borderColor:'var(--acento)', borderWidth:2, borderRadius:4 }
            ]
          },
          options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ position:'bottom' },
              tooltip:{ callbacks:{ label: t=>' '+t.dataset.label+': '+Fmt.num(t.raw,0)+' unid.' } } },
            scales:{ y:{ beginAtZero:true } }
          }
        });
      }

      // Historial global con filtros actuales
      renderHist(x.movimientos, x.productos,
        q('#in-mov-filtro-prod').value,
        q('#in-mov-filtro-tipo').value,
        q('#in-mov-filtro-desde').value,
        q('#in-mov-filtro-hasta').value
      );
    };

    // ── Eventos ───────────────────────────────────────────────────────────
    raiz.addEventListener('input', e => {
      const id = e.target.id;
      if (['in-buscar','in-mov-fecha','in-mov-cant','in-mov-nota','in-mov-costo'].includes(id)) {
        if (id === 'in-buscar' || id === 'in-filtro-cat' || id === 'in-filtro-estado') refrescar();
        return; // los otros no disparan recalculo
      }
      if (!e.target.closest('#in-hist-tabla') && !e.target.closest('#in-hist-modal')) refrescar();
    });
    raiz.addEventListener('change', e => {
      const id = e.target.id;
      if (['in-mov-filtro-prod','in-mov-filtro-tipo','in-mov-filtro-desde','in-mov-filtro-hasta'].includes(id)) {
        const x = leer();
        renderHist(x.movimientos, x.productos,
          q('#in-mov-filtro-prod').value, q('#in-mov-filtro-tipo').value,
          q('#in-mov-filtro-desde').value, q('#in-mov-filtro-hasta').value);
        return;
      }
      if (['in-mov-prod','in-mov-tipo'].includes(id)) {
        // Auto-rellenar costo del producto seleccionado
        if (id==='in-mov-prod') {
          const x = leer();
          const prod = x.productos.find(p=>p.id===+q('#in-mov-prod').value);
          if (prod && !q('#in-mov-costo').value) q('#in-mov-costo').value = prod.costo || '';
        }
        return;
      }
      if (id==='in-filtro-cat' || id==='in-filtro-estado') { refrescar(); return; }
      if (!e.target.closest('#in-hist-tabla')) refrescar();
    });

    raiz.addEventListener('click', e => {
      // Quitar producto
      if (e.target.closest('.quitar-prod')) {
        const fila = e.target.closest('tr.prod');
        const id   = +fila.dataset.id;
        if (!confirm('¿Quitar este producto? Sus movimientos quedarán sin producto asociado.')) return;
        fila.remove();
        refrescar(); return;
      }
      // Eliminar movimiento (recalcula existencias automáticamente)
      if (e.target.closest('.quitar-mov') && !e.target.closest('.in-ed-guardar')) {
        const movId = +e.target.closest('[data-movid]').dataset.movid;
        const x = leer();
        const idx = x.movimientos.findIndex(m=>m.id===movId);
        if (idx>=0) x.movimientos.splice(idx,1);
        datos.movimientos = x.movimientos;
        Datos.guardar('inventario_v2', x);
        refrescar(); return;
      }
      // Ver historial de producto
      if (e.target.closest('.ver-hist-prod')) {
        const prodId = +e.target.closest('.ver-hist-prod').dataset.id;
        const x = leer();
        renderHistProd(prodId, x.productos, x.movimientos); return;
      }
      // Editar movimiento
      if (e.target.closest('.in-edit-mov')) {
        const movId = +e.target.closest('[data-movid]').dataset.movid;
        datos.movimientos = datos.movimientos.map(m=>m.id===movId ? {...m,_editando:true} : m);
        const x = leer();
        renderHist(x.movimientos, x.productos,
          q('#in-mov-filtro-prod').value, q('#in-mov-filtro-tipo').value,
          q('#in-mov-filtro-desde').value, q('#in-mov-filtro-hasta').value);
        return;
      }
      // Guardar edición de movimiento
      if (e.target.closest('.in-ed-guardar')) {
        const movId = +e.target.closest('[data-movid]').dataset.movid;
        const fila  = raiz.querySelector('tr[data-movid="'+movId+'"]');
        const cant  = Fmt.aNum(fila.querySelector('.in-ed-cant').value);
        const tipo  = fila.querySelector('.in-ed-tipo').value;
        const fecha = fila.querySelector('.in-ed-fecha').value;
        const costo = Fmt.aNum(fila.querySelector('.in-ed-costo').value) || undefined;
        const nota  = fila.querySelector('.in-ed-nota').value.trim();

        // Validar que salida no supere existencia
        if (tipo==='Salida' && cant>0) {
          const mv    = datos.movimientos.find(m=>m.id===movId);
          const x     = leer();
          const prod  = x.productos.find(p=>p.id===mv.prodId);
          if (prod) {
            const sinEste = datos.movimientos.filter(m=>m.id!==movId);
            const c = Inventario.calcularDesdeMovimientos(prod, sinEste);
            if (cant > c.final) {
              q('#in-mov-error').innerHTML = '<div class="cuadre mal">⛔ La salida de '+Fmt.num(cant,0)+' supera la existencia disponible ('+Fmt.num(c.final,0)+').</div>';
              return;
            }
          }
        }
        datos.movimientos = datos.movimientos.map(m=>m.id===movId
          ? { id:m.id, fecha, prodId:m.prodId, tipo, cant, costo, nota, _editando:false }
          : m);
        Datos.guardar('inventario_v2', leer());
        refrescar(); return;
      }
      // Cancelar edición
      if (e.target.closest('.in-ed-cancelar')) {
        const movId = +e.target.closest('[data-movid]').dataset.movid;
        datos.movimientos = datos.movimientos.map(m=>m.id===movId ? {...m,_editando:false} : m);
        const x = leer();
        renderHist(x.movimientos, x.productos,
          q('#in-mov-filtro-prod').value, q('#in-mov-filtro-tipo').value,
          q('#in-mov-filtro-desde').value, q('#in-mov-filtro-hasta').value);
        return;
      }
    });

    // Agregar producto
    q('#in-add').addEventListener('click', () => {
      const x  = leer();
      const id = Inventario._nextId(x.productos);
      q('#in-tbody').insertAdjacentHTML('beforeend',
        Inventario.filaProducto({ id, n:'Nuevo producto', cat:'General', ini:0, costo:0, min:0 }));
      Validar.activar(raiz); refrescar();
    });

    q('#in-ejemplo').addEventListener('click', () => {
      Datos.guardar('inventario_v2', Inventario.ejemplo()); Inventario.render(el); Validar.activar(el);
    });
    q('#in-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar todos los productos y movimientos?')) {
        Datos.guardar('inventario_v2', { productos:[], movimientos:[] });
        Inventario.render(el); Validar.activar(el);
      }
    });

    // Registrar movimiento
    q('#in-mov-agregar').addEventListener('click', () => {
      const prodId = +q('#in-mov-prod').value;
      const tipo   = q('#in-mov-tipo').value;
      const cant   = Fmt.aNum(q('#in-mov-cant').value);
      const fecha  = q('#in-mov-fecha').value;
      const nota   = q('#in-mov-nota').value.trim();
      const costo  = Fmt.aNum(q('#in-mov-costo').value) || undefined;
      const errEl  = q('#in-mov-error');
      errEl.innerHTML = '';
      if (!prodId || cant<=0) {
        errEl.innerHTML = '<div class="cuadre mal">Selecciona un producto e ingresa una cantidad mayor a 0.</div>'; return;
      }
      const x    = leer();
      const prod = x.productos.find(p=>p.id===prodId);
      if (!prod) return;

      // Validación: salida no puede superar existencia disponible
      if (tipo==='Salida') {
        const c = Inventario.calcularDesdeMovimientos(prod, x.movimientos);
        if (cant > c.final) {
          errEl.innerHTML = '<div class="cuadre mal">⛔ La salida de <strong>'+Fmt.num(cant,0)+'</strong> unidades supera la existencia disponible de <strong>'+prod.n+'</strong> ('+Fmt.num(c.final,0)+' u). No se registró el movimiento.</div>';
          return;
        }
      }

      const nuevoMov = {
        id: Inventario._nextId(datos.movimientos),
        fecha, prodId, tipo, cant, nota
      };
      if (costo) nuevoMov.costo = costo;
      datos.movimientos.push(nuevoMov);
      Datos.guardar('inventario_v2', { ...x, movimientos: datos.movimientos });
      q('#in-mov-cant').value  = '';
      q('#in-mov-nota').value  = '';
      q('#in-mov-costo').value = '';
      errEl.innerHTML = '<div class="cuadre ok">✔ Movimiento registrado correctamente.</div>';
      setTimeout(() => { if (errEl) errEl.innerHTML = ''; }, 3000);
      refrescar();
    });

    refrescar();
    Validar.activar(raiz);
  }
};

Modulos.inventario = {
  titulo:    'Control de inventario',
  subtitulo: 'Existencias, movimientos por producto, alertas de reposición y valoración',
  render(el) { Inventario.render(el); }
};