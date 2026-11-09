// FASE C: Exportar a PDF — reporte de SOLO LECTURA (no editable), separado de "Exportar a
// Excel" (que sí tiene fórmulas vivas, pensadas para seguir trabajando dentro del archivo).
// Usa jsPDF + jspdf-autotable (copias locales en librerias/). Reutiliza Exportar.razones(d, r)
// y Exportar.nd(v), que ya existen en exportar.js, para no duplicar las fórmulas.
const ExportarPDF = {
  MODULOS: (typeof Exportar !== 'undefined' ? Exportar.MODULOS : []).filter(m => m.id !== 'panel' && m.id !== 'formulas'),

  pal() {
    return (typeof Tema !== 'undefined') ? Tema.paleta() : { marino: '#1f3a5f', acento: '#3f6fa3', ok: '#3d8b6a', malo: '#b25555' };
  },
  rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  },
  empresa() { return (Empresas.activa && Empresas.activa.nombre) || 'Empresa'; },

  // Encabezado que se repite en cada página de cada tabla (lo llama jspdf-autotable solo)
  encabezadoPara(titulo) {
    const emp = ExportarPDF.empresa();
    return () => {
      const doc = ExportarPDF.doc;
      const pag = doc.internal.getCurrentPageInfo().pageNumber;
      if (ExportarPDF.paginasConEncabezado.has(pag)) return; // ya se dibujo en esta pagina: evita letras montadas
      ExportarPDF.paginasConEncabezado.add(pag);
      doc.setFontSize(9); doc.setTextColor(110, 120, 135);
      doc.text(emp, 40, 28);
      doc.text('Generado el ' + new Date().toLocaleDateString('es-NI'), 572, 28, { align: 'right' });
      doc.setDrawColor(221, 227, 234); doc.line(40, 34, 572, 34);
      doc.setFontSize(16); doc.setTextColor(31, 42, 58);
      doc.text(titulo, 40, 56);
    };
  },

  // Columnas numéricas alineadas a la derecha (todas menos la primera)
  colsNum(nCols) {
    const o = {};
    for (let i = 1; i < nCols; i++) o[i] = { halign: 'right' };
    return o;
  },

  // Dibuja una tabla; si "primera" es true, abre página nueva. Devuelve la posición para la siguiente tabla.
  tabla(titulo, head, body, y, primera) {
    const doc = ExportarPDF.doc, P = ExportarPDF.pal();
    if (primera) doc.addPage();
    doc.autoTable({
      startY: y || 72,
      head: [head], body,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [31, 42, 58], overflow: 'linebreak' },
      headStyles: { fillColor: ExportarPDF.rgb(P.marino), textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [243, 245, 248] },
      columnStyles: ExportarPDF.colsNum(head.length),
      margin: { left: 40, right: 40, top: 70 },
      didDrawPage: ExportarPDF.encabezadoPara(titulo)
    });
    return doc.lastAutoTable.finalY + 18;
  },

  // Subtítulo pequeño antes de una tabla (por ejemplo "Balance General" dentro de Estados)
  subtitulo(texto, y) {
    const doc = ExportarPDF.doc;
    doc.setFontSize(11); doc.setTextColor(31, 42, 58); doc.text(texto, 40, y);
    return y + 10;
  },

  // Párrafos de lectura financiera (en lenguaje sencillo) debajo de una tabla
  parrafos(items, y) {
    if (!items || !items.length) return y;
    const doc = ExportarPDF.doc;
    let yy = y + 4;
    doc.setFontSize(9); doc.setTextColor(60, 70, 85);
    items.forEach(it => {
      const texto = '•  ' + (it.texto || it);
      const lineas = doc.splitTextToSize(texto, 532);
      if (yy + lineas.length * 12 > 760) { doc.addPage(); ExportarPDF.encabezadoPara(' ')(); yy = 72; }
      doc.text(lineas, 40, yy);
      yy += lineas.length * 12 + 4;
    });
    return yy + 6;
  },

  lectura(fn, args) {
    try { return (typeof Lectura !== 'undefined' && typeof Lectura[fn] === 'function') ? Lectura[fn].apply(Lectura, args) : []; }
    catch (e) { return []; }
  },

  // ---------- Portada ----------
  portada(sel) {
    const doc = ExportarPDF.doc, P = ExportarPDF.pal(), emp = Empresas.activa || {};
    const lineasTitulo = doc.splitTextToSize('Sistema de Análisis y Planeación Financiera', 532);
    const altoFranja = 92 + lineasTitulo.length * 24;
    doc.setFillColor.apply(doc, ExportarPDF.rgb(P.marino));
    doc.rect(0, 0, 612, altoFranja, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.text(lineasTitulo, 40, 50);
    let y = 50 + lineasTitulo.length * 24 + 12;
    doc.setFontSize(12); doc.text('Reporte en PDF · Gestión Financiera Operativa', 40, y);
    y += 18;
    doc.setFontSize(10);
    doc.text('Generado el ' + new Date().toLocaleDateString('es-NI') + ' a las ' +
      new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }), 40, y);
    doc.setTextColor(31, 42, 58);
    y = altoFranja + 36;
    doc.setFontSize(13); doc.text('Empresa: ' + (emp.nombre || '—'), 40, y);
    y += 18;
    doc.setFontSize(10); doc.setTextColor(107, 119, 136);
    doc.text('Tipo: ' + (emp.sector || '—') + '    ·    Moneda: C$', 40, y);
    const filas = ExportarPDF.MODULOS.filter(m => sel.includes(m.id)).map(m => [m.nombre]);
    doc.autoTable({
      startY: y + 26, head: [['Contenido de este reporte']], body: filas,
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: ExportarPDF.rgb(P.marino), textColor: [255, 255, 255] },
      margin: { left: 40, right: 40 }
    });
    doc.setFontSize(9); doc.setTextColor(107, 119, 136);
    doc.text('Este PDF es solo para leer e imprimir: los montos no se pueden editar aquí. ' +
      'Para seguir trabajando con los números, usa "Exportar a Excel".', 40, 760, { maxWidth: 532 });
  },

  // ---------- Estados financieros ----------
  estados() {
    const d = Estados.obtener(), r = Estados.calcular(d), A = d.ids.map(id => Estados.etiqueta(id));
    const valor = (k, grupo, p) => k[0] === '@' ? r[p][k.slice(1)] : (Number((d[grupo][k] || [])[p]) || 0);
    const filas = (lista, grupo) => lista.map(([k, etq]) => {
      const a = valor(k, grupo, 0), b = valor(k, grupo, 1);
      return [etq, Fmt.moneda(a), Fmt.moneda(b), Fmt.moneda(b - a)];
    });
    const t = 'Estados financieros';
    let y = ExportarPDF.tabla(t, ['Estado de Resultados', A[0], A[1], 'Variación'], filas(EST_FILAS_ER, 'er'), true);
    y = ExportarPDF.subtitulo('Balance General', y);
    ExportarPDF.tabla(t, ['Cuenta', A[0], A[1], 'Variación'], filas(EST_FILAS_BG, 'bg'), y, false);
  },

  // ---------- Análisis financiero ----------
  analisis() {
    const d = Estados.obtener(), r = Estados.calcular(d), A = d.ids.map(id => Estados.etiqueta(id));
    const t = 'Análisis financiero';
    const filasRaz = [];
    Exportar.razones(d, r).forEach(x => {
      if (x.g) { filasRaz.push([{ content: x.g, colSpan: 3, styles: { fillColor: [238, 243, 249], textColor: [31, 58, 95], fontStyle: 'bold', halign: 'left' } }]); return; }
      filasRaz.push([x.nombre, Exportar.nd(x.f(0)), Exportar.nd(x.f(1))]);
    });
    let y = ExportarPDF.tabla(t, ['Razón financiera', A[0], A[1]], filasRaz, true);
    const ventas = Number(d.er.ventas[1]) || 0, actProm = (r[0].totalActivo + r[1].totalActivo) / 2, patProm = (r[0].patrimonio + r[1].patrimonio) / 2;
    const margen = ventas ? r[1].utilidadNeta / ventas : null, rot = actProm ? ventas / actProm : null, mult = patProm ? actProm / patProm : null;
    const roe = (margen !== null && rot !== null && mult !== null) ? margen * rot * mult : null;
    y = ExportarPDF.subtitulo('Sistema DuPont (' + A[1] + ')', y);
    y = ExportarPDF.tabla(t, ['Componente', 'Valor'], [
      ['Margen de utilidad neta', margen === null ? 'N/D' : Fmt.pct(margen)],
      ['Rotación de activos', rot === null ? 'N/D' : Fmt.veces(rot)],
      ['Multiplicador del capital', mult === null ? 'N/D' : Fmt.veces(mult)],
      ['ROE', roe === null ? 'N/D' : Fmt.pct(roe)]
    ], y, false);
    const par = (typeof Seleccion !== 'undefined') ? Seleccion.ids() : d.ids;
    ExportarPDF.parrafos(ExportarPDF.lectura('estados', [Estados.leerCrudo(), par]), y);
  },

  // ---------- Punto de equilibrio ----------
  equilibrio() {
    const p = Equilibrio.obtener(), c = Equilibrio.calcular(p, p.meta), t = 'Punto de equilibrio y C-V-U';
    let y = ExportarPDF.tabla(t, ['Concepto', 'Valor'], [
      ['Precio de venta por unidad (C$)', Fmt.moneda(p.precio)],
      ['Costo variable por unidad (C$)', Fmt.moneda(p.cv)],
      ['Costos fijos (C$)', Fmt.moneda(p.cf)],
      ['Unidades vendidas', Fmt.num(p.unidades, 2)],
      ['Margen de contribución unitario (C$)', Exportar.nd(c.mc)],
      ['Punto de equilibrio (unidades)', Exportar.nd(c.peU)],
      ['Punto de equilibrio (C$)', Exportar.nd(c.peC)],
      ['Utilidad operativa (UAII) (C$)', Exportar.nd(c.uaii)],
      ['Margen de seguridad', Exportar.nd(c.ms)]
    ], true);
    ExportarPDF.parrafos(ExportarPDF.lectura('equilibrio', [p]), y);
  },

  // ---------- Apalancamiento ----------
  apalancamiento() {
    const d = Apalancamiento.obtener(), a = Apalancamiento.periodo(d, d.u1), b = Apalancamiento.periodo(d, d.u2);
    const t = 'Apalancamiento';
    const fila = (n, k, fm) => [n, fm(a[k]), fm(b[k])];
    const mo = v => Exportar.nd(v) === 'N/D' ? 'N/D' : Fmt.moneda(v), ve = v => Exportar.nd(v) === 'N/D' ? 'N/D' : Fmt.veces(v);
    let y = ExportarPDF.tabla(t, ['Concepto', 'Período 1', 'Período 2'], [
      fila('Ventas (C$)', 'ventas', mo), fila('Margen de contribución (C$)', 'mc', mo), fila('UAII (C$)', 'uaii', mo),
      fila('Utilidad neta (C$)', 'un', mo), fila('GAO', 'gao', ve), fila('GAF', 'gaf', ve), fila('GAT', 'gat', ve)
    ], true);
    ExportarPDF.parrafos(ExportarPDF.lectura('apalancamiento', [d]), y);
  },

  // ---------- Flujo de efectivo ----------
  flujo() {
    const f = Flujo.obtenerManual(), M = { d: Estados.obtener() };
    M.r = Estados.calcular(M.d);
    const t = 'Flujo de efectivo', neta = f.op + f.inv + f.fin;
    let y = ExportarPDF.tabla(t, ['Flujo manual', 'C$'], [
      ['Efectivo inicial', Fmt.moneda(f.inicial)], ['Flujo de operación', Fmt.moneda(f.op)],
      ['Flujo de inversión', Fmt.moneda(f.inv)], ['Flujo de financiamiento', Fmt.moneda(f.fin)],
      ['Variación neta', Fmt.moneda(neta)], ['Efectivo final', Fmt.moneda(f.inicial + neta)]
    ], true);
    try {
      const ind = Flujo.indirecto(M.d, M.r);
      y = ExportarPDF.subtitulo('Método indirecto (calculado desde los Estados financieros)', y);
      ExportarPDF.tabla(t, ['Concepto', 'C$'], [
        ['Flujo neto de operación', Fmt.moneda(ind.flOp)], ['Flujo neto de inversión', Fmt.moneda(ind.flInv)],
        ['Flujo neto de financiamiento', Fmt.moneda(ind.flFin)], ['Variación neta', Fmt.moneda(ind.neta)],
        ['Efectivo final calculado', Fmt.moneda(ind.final)], ['Efectivo en el balance', Fmt.moneda(ind.enBalance)]
      ], y, false);
    } catch (e) {}
  },

  // ---------- Planeación y presupuestos ----------
  presupuestos() {
    const d = Presupuestos.obtener(), op = Presupuestos.operativo(d), ca = Presupuestos.caja(d, op), t = 'Planeación y presupuestos';
    const filas = (k, etq) => [etq].concat(op.map(o => Fmt.moneda(o[k])));
    let y = ExportarPDF.tabla(t, ['Concepto'].concat(d.meses), [
      filas('ventas', 'Ventas'), filas('costoVentas', 'Costo de ventas'), filas('utilidadBruta', 'Utilidad bruta'),
      filas('gastos', 'Gastos de operación'), filas('uaii', 'UAII'), filas('un', 'Utilidad neta')
    ], true);
    y = ExportarPDF.subtitulo('Presupuesto de caja', y);
    y = ExportarPDF.tabla(t, ['Concepto'].concat(d.meses), [
      ['Saldo final'].concat(ca.map(c => Fmt.moneda(c.final))),
      ['Financiamiento requerido'].concat(ca.map(c => Fmt.moneda(c.financiar)))
    ], y, false);
    ExportarPDF.parrafos(ExportarPDF.lectura('presupuestos', [d]), y);
  },

  // ---------- Proforma ----------
  proforma() {
    const d = Estados.obtener(), r = Estados.calcular(d), s = Proforma.obtener(), p = Proforma.calcular(d, r, s), a = r[1];
    const t = 'Estados proforma';
    let y = ExportarPDF.tabla(t, ['Concepto', 'Año base', 'Proforma'], [
      ['Ventas', Fmt.moneda(a.ac ? Number(d.er.ventas[1]) || 0 : Number(d.er.ventas[1]) || 0), Fmt.moneda(p.ventas)],
      ['Utilidad bruta', Fmt.moneda(a.utilidadBruta), Fmt.moneda(p.utilidadBruta)],
      ['UAII', Fmt.moneda(a.uaii), Fmt.moneda(p.uaii)],
      ['Utilidad neta', Fmt.moneda(a.utilidadNeta), Fmt.moneda(p.un)]
    ], true);
    ExportarPDF.subtitulo('Supuestos de la proyección', y);
    ExportarPDF.tabla(t, ['Supuesto', 'Valor'], [
      ['Crecimiento de ventas (%)', Fmt.num(s.crecimiento, 2)], ['Costo de ventas (% de ventas)', Fmt.num(s.costoPct, 2)],
      ['Tasa de impuesto (%)', Fmt.num(s.isr, 2)]
    ], y + 10, false);
  },

  // ---------- Presupuesto personal ----------
  personal() {
    const x = Personal.obtener(), c = Personal.calcular(x), t = 'Presupuesto personal';
    let y = ExportarPDF.tabla(t, ['Concepto', 'Valor'], [
      ['Total de ingresos (C$)', Fmt.moneda(c.totalIng)], ['Total de gastos (C$)', Fmt.moneda(c.totalGas)],
      ['Saldo disponible (C$)', Fmt.moneda(c.saldo)], ['Capacidad de ahorro', Exportar.nd(c.capacidad)],
      ['Meta de ahorro (C$)', Fmt.moneda(c.metaMonto)], ['¿Cumple la meta?', c.saldo >= c.metaMonto ? 'Sí' : 'No']
    ], true);
    y = ExportarPDF.subtitulo('Gastos por categoría', y);
    const filasCat = (Personal.CATS || []).map(cat => {
      const m = x.gastos.filter(g => g.c === cat).reduce((s, g) => s + g.m, 0);
      return [cat, Fmt.moneda(m), c.totalGas ? Fmt.pct(m / c.totalGas) : 'N/D'];
    });
    ExportarPDF.tabla(t, ['Categoría', 'Monto (C$)', '% de los gastos'], filasCat, y, false);
  },

  // ---------- Inventario ----------
  inventario() {
    const lista = Inventario.obtener(), t = 'Control de inventario';
    let total = 0;
    const filas = lista.map(p => {
      const c = Inventario.calcular(p); total += c.valor;
      return [p.n, Fmt.num(c.final, 2), Fmt.moneda(p.costo), Fmt.moneda(c.valor), c.estado];
    });
    filas.push(['TOTAL', '', '', Fmt.moneda(total), '']);
    ExportarPDF.tabla(t, ['Producto', 'Existencia final', 'Costo unit.', 'Valor', 'Estado'], filas, true);
  },

  construir(sel) {
    const { jsPDF } = window.jspdf;
    ExportarPDF.doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const doc = ExportarPDF.doc;
    doc.setFont('helvetica', 'normal');
    ExportarPDF.paginasConEncabezado = new Set();
    const errores = [];
    ExportarPDF.portada(sel);
    const mapa = {
      estados: ExportarPDF.estados, analisis: ExportarPDF.analisis, equilibrio: ExportarPDF.equilibrio,
      apalancamiento: ExportarPDF.apalancamiento, flujo: ExportarPDF.flujo, presupuestos: ExportarPDF.presupuestos,
      proforma: ExportarPDF.proforma, personal: ExportarPDF.personal, inventario: ExportarPDF.inventario
    };
    ExportarPDF.MODULOS.forEach(m => {
      if (!sel.includes(m.id) || !mapa[m.id]) return;
      try { mapa[m.id].call(ExportarPDF); }
      catch (e) {
        doc.addPage(); ExportarPDF.encabezadoPara(m.nombre)();
        doc.setFontSize(10); doc.setTextColor(178, 85, 85);
        doc.text('No se pudo generar esta sección: ' + e.message, 40, 90, { maxWidth: 532 });
        errores.push(m.nombre + ': ' + e.message);
      }
    });
    return { doc, errores };
  },

  nombreArchivo() {
    const f = new Date(), dd = String(f.getDate()).padStart(2, '0'), mm = String(f.getMonth() + 1).padStart(2, '0');
    const emp = ExportarPDF.empresa().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return 'GFO_' + emp + '_' + dd + '-' + mm + '-' + f.getFullYear() + '.pdf';
  },

  render(el) {
    const tipoEmpresa = (Empresas.activa && Empresas.activa.sector) || '';
    const visibles = ExportarPDF.MODULOS.filter(m => tipoEmpresa === 'Personal' || m.id !== 'personal');
    const checks = visibles.map(m =>
      '<label class="chk"><input type="checkbox" value="' + m.id + '" checked> ' + m.nombre + '</label>').join('');
    el.innerHTML =
      '<div class="tarjeta"><h3>Módulos a incluir en el PDF</h3>' +
      '<p class="nota-pie">El PDF es solo para leer e imprimir: nadie puede editar los montos ahí. ' +
      'Si quieres que alguien siga trabajando con los números, usa "Exportar a Excel".</p>' +
      '<div class="exp-lista">' + checks + '</div>' +
      '<div class="barra-acciones"><button class="btn" id="pdf-generar">Generar PDF</button></div>' +
      '<div id="pdf-estado" class="cuadre"></div></div>';
    el.querySelector('#pdf-generar').addEventListener('click', () => {
      const est = el.querySelector('#pdf-estado');
      const aviso = (clase, texto) => { est.className = 'cuadre ' + clase; est.textContent = texto; };
      const sel = [...el.querySelectorAll('.exp-lista input:checked')].map(i => i.value);
      if (!Empresas.activa) return aviso('mal', 'Entra primero a una empresa.');
      if (!sel.length) return aviso('mal', 'Selecciona al menos un módulo.');
      if (typeof window.jspdf === 'undefined') return aviso('mal', 'No se encontró librerias/jspdf.umd.min.js.');
      try {
        const { doc, errores } = ExportarPDF.construir(sel);
        doc.save(ExportarPDF.nombreArchivo());
        aviso('ok', 'PDF generado.' + (errores.length ? ' Avisos: ' + errores.join(' | ') : ''));
      } catch (e) { aviso('mal', 'No se pudo generar el PDF: ' + e.message); }
    });
  }
};

(function () {
  const item = { id: 'exportarpdf', nombre: 'Exportar a PDF', icono: 'doc' };
  const sec = SECCIONES.find(s => s.titulo === 'Reportes');
  if (sec) sec.items.push(item); else SECCIONES.push({ titulo: 'Reportes', items: [item] });
})();
Modulos.exportarpdf = {
  titulo: 'Exportar a PDF',
  subtitulo: 'Genera un reporte de solo lectura, listo para ver o imprimir',
  render(el) { ExportarPDF.render(el); }
};