// analisis-pares.js — Mejoras al análisis horizontal y vertical.
// Extiende Analisis (definido en analisis.js) sin sobreescribir sus tablas.
// Agrega: resumen de variaciones importantes, explicación automática,
// gráfica comparativa horizontal, y mejoras de presentación vertical.

/* ─────────────────────────────────────────────
   1.  HELPER: calcula todas las variaciones del
       par de períodos más reciente y las ordena
   ───────────────────────────────────────────── */
Analisis.variacionesOrdenadas = function(d, r) {
  const n   = d.anios.length;
  if (n < 2) return [];
  const p0  = n - 2, p1 = n - 1;
  const A0  = d.anios[p0], A1 = d.anios[p1];
  const filas = [];

  // Recorre EST_FILAS_ER y EST_FILAS_BG (definidos en analisis.js)
  const procesar = (grupo, lista) => lista.forEach(f => {
    const k = f[0];
    if (k[0] === '@') return;              // saltar totales
    const a = Analisis.valor(d, r, grupo, f, p0);
    const b = Analisis.valor(d, r, grupo, f, p1);
    const abs = b - a;
    const rel = a !== 0 ? abs / Math.abs(a) : null;
    if (abs === 0) return;
    const esFav = (ANL_FAV_SUBE.has(k) && abs > 0) || (ANL_FAV_BAJA.has(k) && abs < 0);
    const esDesf= (ANL_FAV_SUBE.has(k) && abs < 0) || (ANL_FAV_BAJA.has(k) && abs > 0);
    filas.push({ nombre: f[1], k, grupo, abs, rel, esFav, esDesf, a, b, A0, A1 });
  });

  if (typeof EST_FILAS_ER !== 'undefined') procesar('er', EST_FILAS_ER);
  if (typeof EST_FILAS_BG !== 'undefined') procesar('bg', EST_FILAS_BG);

  // Ordena por valor absoluto de la variación (mayor primero)
  return filas.sort((x, y) => Math.abs(y.abs) - Math.abs(x.abs));
};

/* ─────────────────────────────────────────────
   2.  RESUMEN: top-5 variaciones con chip visual
   ───────────────────────────────────────────── */
Analisis.htmlResumenVariaciones = function(d, r) {
  const filas = Analisis.variacionesOrdenadas(d, r);
  if (!filas.length) return '';

  const top = filas.slice(0, 5);
  const A = d.anios, n = A.length;
  if (n < 2) return '';

  const ico = {
    sube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    baja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
  };

  const filas_html = top.map(f => {
    const dir    = f.abs > 0 ? 'sube' : 'baja';
    const cls    = f.esFav ? 'var-fav' : f.esDesf ? 'var-desf' : '';
    const pctTxt = f.rel !== null
      ? Fmt.pct(f.rel)
      : '<span class="nd-cero">N/D <span class="tip" title="El período base es cero">?</span></span>';
    const etiqueta = f.esFav  ? 'Favorable'
                   : f.esDesf ? 'Desfavorable'
                   : 'Neutro';
    const etaCls   = f.esFav  ? 'ok' : f.esDesf ? 'riesgo' : '';
    return '<tr class="' + cls + '">' +
      '<td><strong>' + esc(f.nombre) + '</strong><br>' +
        '<span style="font-size:11px;color:var(--suave)">' +
          esc(String(f.A0)) + ': ' + Fmt.moneda(f.a) + ' → ' +
          esc(String(f.A1)) + ': ' + Fmt.moneda(f.b) +
        '</span></td>' +
      '<td style="text-align:right;font-weight:600">' +
        '<span style="display:inline-flex;align-items:center;gap:4px">' +
          ico[dir] + Fmt.moneda(f.abs) +
        '</span></td>' +
      '<td style="text-align:right">' + pctTxt + '</td>' +
      '<td><span class="chip ' + etaCls + '" style="font-size:11px">' + etiqueta + '</span></td>' +
    '</tr>';
  }).join('');

  return '<div class="tarjeta" style="margin-bottom:4px">' +
    '<h3 style="margin-bottom:4px">Variaciones más importantes (' + esc(String(A[n-2])) + ' → ' + esc(String(A[n-1])) + ')</h3>' +
    '<p class="nota-pie" style="margin-bottom:10px">Las 5 cuentas con mayor variación absoluta entre los dos últimos períodos.</p>' +
    '<div class="tabla-scroll"><table class="tabla-datos">' +
      '<thead><tr>' +
        '<th>Cuenta</th>' +
        '<th style="text-align:right">Variación C$</th>' +
        '<th style="text-align:right">Variación %</th>' +
        '<th>Calificación</th>' +
      '</tr></thead><tbody>' + filas_html +
    '</tbody></table></div>' +
  '</div>';
};

/* ─────────────────────────────────────────────
   3.  EXPLICACIÓN AUTOMÁTICA en texto natural
   ───────────────────────────────────────────── */
Analisis.htmlExplicacion = function(d, r) {
  const filas  = Analisis.variacionesOrdenadas(d, r);
  const n      = d.anios.length;
  if (n < 2 || !filas.length) return '';

  const A0 = d.anios[n-2], A1 = d.anios[n-1];
  const fav  = filas.filter(f => f.esFav);
  const desf = filas.filter(f => f.esDesf);
  const partes = [];

  // Párrafo de ventas (siempre primero si existe)
  const ventas = filas.find(f => f.k === 'ventas');
  if (ventas) {
    const dir = ventas.abs > 0 ? 'creció' : 'disminuyó';
    const pct = ventas.rel !== null ? ' (' + Fmt.pct(Math.abs(ventas.rel)) + ')' : '';
    partes.push(
      'Las ventas <strong>' + dir + pct + '</strong> de ' +
      Fmt.moneda(ventas.a) + ' (' + esc(String(A0)) + ') a ' +
      Fmt.moneda(ventas.b) + ' (' + esc(String(A1)) + ').'
    );
  }

  // Párrafo de utilidad neta
  const utilidad = filas.find(f => f.k === 'utilidadNeta' || f.nombre.toLowerCase().includes('utilidad neta'));
  const utilR = r[n-1];
  if (utilR && typeof utilR.utilidadNeta !== 'undefined') {
    if (utilR.utilidadNeta < 0) {
      partes.push('La empresa <strong>registró pérdida neta</strong> de ' + Fmt.moneda(Math.abs(utilR.utilidadNeta)) + ' en ' + esc(String(A1)) + '.');
    } else if (utilidad) {
      const dir2 = utilidad.abs >= 0 ? 'mejoró' : 'se redujo';
      partes.push('La utilidad neta <strong>' + dir2 + '</strong>: pasó de ' + Fmt.moneda(utilidad.a) + ' a ' + Fmt.moneda(utilidad.b) + '.');
    }
  }

  // Top 2 movimientos favorables
  if (fav.length) {
    const nombres = fav.slice(0, 2).map(f =>
      '<strong>' + esc(f.nombre) + '</strong> (' +
        (f.rel !== null ? Fmt.pct(f.rel) : 'N/D') + ')'
    ).join(' y ');
    partes.push('Entre los movimientos favorables destacan: ' + nombres + '.');
  }

  // Top 2 movimientos desfavorables
  if (desf.length) {
    const nombres = desf.slice(0, 2).map(f =>
      '<strong>' + esc(f.nombre) + '</strong> (' +
        (f.rel !== null ? Fmt.pct(Math.abs(f.rel)) : 'N/D') + ')'
    ).join(' y ');
    partes.push('Los cambios más desfavorables se observan en: ' + nombres + '.');
  }

  // Alerta de base cero
  const baseCero = filas.filter(f => f.rel === null);
  if (baseCero.length) {
    partes.push(
      baseCero.length === 1
        ? 'La cuenta <strong>' + esc(baseCero[0].nombre) + '</strong> no tiene valor en el período base, por lo que no se puede calcular su variación porcentual (se muestra N/D).'
        : baseCero.length + ' cuentas tienen valor cero en el período base (' +
          baseCero.map(f => esc(f.nombre)).join(', ') +
          '), por lo que su variación porcentual se muestra como N/D.'
    );
  }

  if (!partes.length) return '';

  const ico_info = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>';

  return '<div class="tarjeta" style="margin-bottom:4px">' +
    '<h3 style="display:flex;align-items:center;gap:7px;margin-bottom:10px">' +
      '<span style="color:var(--primario-2)">' + ico_info + '</span>' +
      'Explicación automática de las principales variaciones' +
    '</h3>' +
    '<div style="display:flex;flex-direction:column;gap:9px">' +
      partes.map(p =>
        '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;background:var(--arena-1);border-radius:7px;font-size:14px;line-height:1.55">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:var(--primario);flex:none;margin-top:7px"></span>' +
          '<span>' + p + '</span>' +
        '</div>'
      ).join('') +
    '</div>' +
    '<p class="nota-pie" style="margin-top:10px">' +
      'La calificación favorable/desfavorable considera la naturaleza de cada cuenta: '+
      'para ingresos y activos, subir es favorable; para costos y pasivos, bajar es favorable.' +
    '</p>' +
  '</div>';
};

/* ─────────────────────────────────────────────
   4.  GRÁFICA HORIZONTAL: variaciones absolutas
       (barras horizontales, top 8 cuentas)
   ───────────────────────────────────────────── */
Analisis.htmlGraficaHorizontal = function() {
  return '<div class="tarjeta" id="par-grafica-bloque" style="margin-bottom:4px">' +
    '<h3 style="margin-bottom:4px">Gráfica de variaciones absolutas</h3>' +
    '<p class="nota-pie" style="margin-bottom:10px">Las 8 cuentas con mayor variación absoluta entre los dos últimos períodos. Verde = favorable · Rojo = desfavorable.</p>' +
    '<div class="grafico" style="min-height:280px"><canvas id="par-grafica-horiz"></canvas></div>' +
  '</div>';
};

Analisis.dibujarGraficaHorizontal = function(raiz, d, r) {
  if (typeof Chart === 'undefined') return;
  const canvas = raiz.querySelector('#par-grafica-horiz');
  if (!canvas) return;
  if (canvas._chart) { try { canvas._chart.destroy(); } catch(e){} }

  const filas = Analisis.variacionesOrdenadas(d, r).slice(0, 8);
  if (!filas.length) {
    canvas.parentNode.innerHTML = '<p class="nota-pie">Sin variaciones disponibles (revisa que haya al menos dos períodos con datos).</p>';
    return;
  }

  // Barras horizontales: positivo a la derecha, negativo a la izquierda
  const labels = filas.map(f => f.nombre);
  const datos  = filas.map(f => f.abs);
  const colores = filas.map(f =>
    f.esFav  ? 'rgba(15,92,77,.82)' :
    f.esDesf ? 'rgba(179,38,30,.78)' :
               'rgba(100,120,150,.65)'
  );

  canvas._chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Variación C$',
        data: datos,
        backgroundColor: colores,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',           // barras horizontales
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const f = filas[ctx.dataIndex];
              const pct = f.rel !== null ? ' · ' + Fmt.pct(f.rel) : '';
              const cal = f.esFav ? ' (Favorable)' : f.esDesf ? ' (Desfavorable)' : '';
              return ' ' + Fmt.moneda(ctx.raw) + pct + cal;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { callback: v => { const a=Math.abs(v); return a>=1e6?(v/1e6).toFixed(1)+'M':a>=1e3?(v/1e3).toFixed(0)+'k':v; } },
          grid: { color: 'rgba(128,128,128,.12)' }
        },
        y: { ticks: { font: { size: 12 } } }
      }
    }
  });
  canvas._chart; // referencia guardada en el canvas mismo para destruir luego
};

/* ─────────────────────────────────────────────
   5.  GRÁFICA VERTICAL: estructura por período
       (apiladas en % para ER y BG)
   ───────────────────────────────────────────── */
Analisis.htmlGraficaVertical = function() {
  return '<div class="dos-col" id="par-graf-vert-bloque" style="margin-bottom:4px">' +
    '<div class="tarjeta">' +
      '<h3 style="margin-bottom:4px">Estructura del ER (% ventas)</h3>' +
      '<p class="nota-pie" style="margin-bottom:8px">Comparación visual de cada período.</p>' +
      '<div class="grafico"><canvas id="par-vert-er"></canvas></div>' +
    '</div>' +
    '<div class="tarjeta">' +
      '<h3 style="margin-bottom:4px">Estructura del Balance (% activo)</h3>' +
      '<p class="nota-pie" style="margin-bottom:8px">Comparación visual de cada período.</p>' +
      '<div class="grafico"><canvas id="par-vert-bg"></canvas></div>' +
    '</div>' +
  '</div>';
};

Analisis.dibujarGraficasVerticales = function(raiz, d, r) {
  if (typeof Chart === 'undefined') return;
  const A = d.anios, n = A.length;

  const palColores = [
    'rgba(15,92,77,.82)', 'rgba(31,122,77,.75)', 'rgba(140,191,172,.8)',
    'rgba(63,138,111,.7)', 'rgba(197,217,208,.9)',
    'rgba(140,59,94,.7)',  'rgba(179,38,30,.65)', 'rgba(220,180,120,.8)'
  ];

  const hacer = (canvasId, grupo, cuentasLista, fnBase) => {
    const canvas = raiz.querySelector('#' + canvasId);
    if (!canvas) return;
    if (canvas._chart) { try { canvas._chart.destroy(); } catch(e){} }

    const labels  = A.map(String);
    const cuentas = typeof EST_FILAS_ER !== 'undefined'
      ? (grupo === 'er' ? EST_FILAS_ER : EST_FILAS_BG).filter(f => f[0][0] !== '@')
      : [];

    const datasets = cuentas.map((f, i) => ({
      label: f[1],
      data: A.map((_, p) => {
        const base = fnBase(p);
        const v    = Analisis.valor(d, r, grupo, f, p);
        return base ? parseFloat((v / base * 100).toFixed(2)) : 0;
      }),
      backgroundColor: palColores[i % palColores.length],
      borderWidth: 1,
      borderColor: 'transparent'
    }));

    canvas._chart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } },
          tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.raw + ' %' } }
        },
        scales: {
          x: { stacked: false },
          y: {
            ticks: { callback: v => v + ' %' },
            grid: { color: 'rgba(128,128,128,.12)' }
          }
        }
      }
    });
  };

  hacer('par-vert-er', 'er', EST_FILAS_ER,
    p => Number(d.er.ventas[p]) || 0
  );
  hacer('par-vert-bg', 'bg', EST_FILAS_BG,
    p => r[p].totalActivo || 0
  );
};

/* ─────────────────────────────────────────────
   6.  REEMPLAZA Analisis.render para añadir
       los nuevos bloques al tab horizontal y
       al tab vertical, sin tocar los demás tabs
   ───────────────────────────────────────────── */
(function() {
  // Guardamos el render original de analisis.js
  const _renderOriginal = Analisis.render;

  Analisis.render = function(el) {
    // Ejecuta el render original (tabs, tablas, razones, DuPont, gráficas)
    _renderOriginal.call(Analisis, el);

    const raiz = el.querySelector('div');  // primer div que crea el render original
    if (!raiz) return;

    const raw  = Estados.leerCrudo();
    const ids  = Seleccion.ids();
    const d    = Estados.compat(raw, ids);
    const r    = Estados.calcular(d);
    const n    = d.anios.length;

    /* ── Inyectar bloques EXTRA en el tab horizontal ── */
    const secH = el.querySelector('#sec-horizontal');
    if (secH && n >= 2) {
      const resumen    = Analisis.htmlResumenVariaciones(d, r);
      const explicacion = Analisis.htmlExplicacion(d, r);
      const graficaH   = Analisis.htmlGraficaHorizontal();

      // Inserta al inicio del panel (antes de la tabla existente)
      secH.insertAdjacentHTML('afterbegin', resumen + explicacion + graficaH);

      // Dibuja la gráfica inmediatamente (el tab horizontal está visible al abrir)
      Analisis.dibujarGraficaHorizontal(secH, d, r);
    }

    /* ── Inyectar gráficas EXTRA en el tab vertical ── */
    const secV = el.querySelector('#sec-vertical');
    if (secV) {
      secV.insertAdjacentHTML('beforeend', Analisis.htmlGraficaVertical());
    }

    /* ── Re-escuchar tabs para dibujar gráficas verticales al activar ese tab ── */
    const tabVertBtn = el.querySelector('.pest[data-tab="vertical"]');
    if (tabVertBtn) {
      tabVertBtn.addEventListener('click', () => {
        // Pequeño delay para que el display:none haya cambiado a '' antes de dibujar
        setTimeout(() => Analisis.dibujarGraficasVerticales(secV, d, r), 50);
      });
    }
  };
})();