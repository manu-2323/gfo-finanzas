// OPCIONAL 1: Importar cuentas y montos desde Excel.
// Flujo: descargar plantilla -> llenarla -> subirla -> revisar la vista previa -> importar.
// Usa librerias/xlsx.bundle.js (la misma que Exportar).
const Importar = {
  pendiente: null,

  norm(t) {
    return String(t === null || t === undefined ? '' : t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().toLowerCase().replace(/\s+/g, ' ');
  },

  // Convierte una celda a número: acepta 1,200.50, C$ 1200 y (500) como negativo
  numero(v) {
    if (v === null || v === undefined || v === '') return { vacio: true };
    if (typeof v === 'number') return isFinite(v) ? { n: v } : { malo: true };
    let s = String(v).replace(/C\$|\s/g, ''), neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    s = s.replace(/,/g, '');
    if (s === '') return { vacio: true };
    const x = Number(s);
    return isFinite(x) ? { n: neg ? -x : x } : { malo: true };
  },

  grupoDe(estado, texto) {
    const t = Importar.norm(texto);
    const g = GRUPOS[estado].find(x => Importar.norm(x[0]) === t || Importar.norm(x[1]) === t);
    return g ? g[0] : null;
  },

  estado(texto, clase) {
    const e = document.getElementById('imp-estado');
    if (e) { e.className = 'cuadre ' + clase; e.textContent = texto; }
  },

  // ---------- Paso 1: plantilla ----------
  plantilla() {
    if (typeof XLSX === 'undefined') return Importar.estado('No se encontró librerias/xlsx.bundle.js.', 'mal');
    const raw = Estados.leerCrudo(), ps = Empresas.periodos || [];
    if (!Empresas.activa || !ps.length) return Importar.estado('Entra a una empresa que tenga períodos.', 'mal');
    const etiquetaGrupo = (estado, g) => { const x = GRUPOS[estado].find(y => y[0] === g); return x ? x[1] : g; };
    const filas = [['Estado', 'Cuenta', 'Grupo'].concat(ps.map(p => p.etiqueta))];
    [['er', 'ER'], ['bg', 'BG']].forEach(par => (raw.cuentas[par[0]] || []).forEach(a => {
      filas.push([par[1], a.nombre, etiquetaGrupo(par[0], a.grupo)].concat(ps.map(p => {
        const v = (raw.valores[p.id] || {})[a.id];
        return v === undefined ? '' : v;
      })));
    }));
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws['!cols'] = [{ wch: 8 }, { wch: 42 }, { wch: 26 }].concat(ps.map(() => ({ wch: 16 })));
    filas[0].forEach((_, c) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[ref]) ws[ref].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '1F3A5F' } } };
    });
    const ayuda = [
      ['Cómo usar esta plantilla'], [''],
      ['1. Escribe los montos en la columna de cada período (solo números; se aceptan comas de miles).'],
      ['2. Para agregar una cuenta nueva escribe una fila más: Estado (ER o BG), nombre de la cuenta y su Grupo.'],
      ['3. No cambies los nombres de las columnas de período: deben coincidir con los de tu empresa.'],
      ['4. Las cuentas existentes se reconocen por su nombre; los montos vacíos no cambian nada.'],
      [''], ['Grupos del Estado de Resultados (ER)']
    ].concat(GRUPOS.er.map(g => ['   ' + g[1]]), [[''], ['Grupos del Balance General (BG)']], GRUPOS.bg.map(g => ['   ' + g[1]]));
    const wsA = XLSX.utils.aoa_to_sheet(ayuda);
    wsA['!cols'] = [{ wch: 100 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estados');
    XLSX.utils.book_append_sheet(wb, wsA, 'Instrucciones');
    const emp = String(Empresas.activa.nombre || 'empresa').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    XLSX.writeFile(wb, 'Plantilla_importacion_' + emp + '.xlsx');
    Importar.estado('Plantilla descargada. Llénala en Excel y súbela en el paso 2.', 'ok');
  },

  // ---------- Paso 2: leer el archivo ----------
  leer(archivo) {
    if (typeof XLSX === 'undefined') return Importar.estado('No se encontró librerias/xlsx.bundle.js.', 'mal');
    if (!Empresas.activa || !(Empresas.periodos || []).length) return Importar.estado('Entra a una empresa que tenga períodos antes de importar.', 'mal');
    if (archivo.size > 2 * 1024 * 1024) return Importar.estado('El archivo pesa más de 2 MB.', 'mal');
    document.getElementById('imp-vista').innerHTML = '';
    const fr = new FileReader();
    fr.onload = () => {
      try { Importar.analizar(XLSX.read(fr.result, { type: 'array' })); }
      catch (e) { Importar.estado('No se pudo leer el archivo: ' + e.message, 'mal'); }
    };
    fr.onerror = () => Importar.estado('No se pudo abrir el archivo.', 'mal');
    fr.readAsArrayBuffer(archivo);
  },

  analizar(wb) {
    const N = Importar.norm;
    const hoja = wb.Sheets.Estados || wb.Sheets[wb.SheetNames[0]];
    const m = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: true });
    const h = m.findIndex(f => f.some(c => N(c) === 'cuenta'));
    if (h < 0) return Importar.estado('No encontré la columna "Cuenta". Usa la plantilla del paso 1.', 'mal');
    const enc = m[h];
    const iCuenta = enc.findIndex(c => N(c) === 'cuenta'), iEstado = enc.findIndex(c => N(c) === 'estado'), iGrupo = enc.findIndex(c => N(c) === 'grupo');
    if (iEstado < 0) return Importar.estado('Falta la columna "Estado" (ER o BG). Usa la plantilla del paso 1.', 'mal');

    const ps = Empresas.periodos || [], cols = [], ignoradas = [];
    enc.forEach((c, i) => {
      if (i === iCuenta || i === iEstado || i === iGrupo || String(c).trim() === '') return;
      const p = ps.find(x => N(x.etiqueta) === N(c));
      if (p) cols.push({ i, p }); else ignoradas.push(String(c).trim());
    });
    if (!cols.length) return Importar.estado('Ninguna columna coincide con los períodos de esta empresa (' + ps.map(p => p.etiqueta).join(', ') + ').', 'mal');

    const raw = Estados.leerCrudo(), filas = [], avisos = [], vistos = {};
    for (let r = h + 1; r < m.length; r++) {
      if (filas.length >= 500) { avisos.push('Se leyeron solo las primeras 500 cuentas.'); break; }
      const f = m[r], nombre = String(f[iCuenta] === undefined ? '' : f[iCuenta]).trim(), est = N(f[iEstado]);
      if (!nombre && !est) continue;
      const donde = 'Fila ' + (r + 1) + (nombre ? ' (' + nombre + ')' : '');
      const estado = (est === 'er' || est.indexOf('resultado') >= 0) ? 'er' : ((est === 'bg' || est.indexOf('balance') >= 0) ? 'bg' : null);
      if (!estado) { avisos.push(donde + ': el Estado debe ser ER o BG. Se ignoró.'); continue; }
      if (!nombre) { avisos.push(donde + ': falta el nombre de la cuenta. Se ignoró.'); continue; }
      if (nombre.length > 120) { avisos.push(donde + ': el nombre es demasiado largo. Se ignoró.'); continue; }
      if (/^total\b/i.test(nombre)) { avisos.push(donde + ': los totales se calculan solos. Se ignoró.'); continue; }
      const clave = estado + '|' + N(nombre);
      if (vistos[clave]) { avisos.push(donde + ': nombre repetido en el archivo. Se usó la primera fila.'); continue; }
      vistos[clave] = true;

      const ex = (raw.cuentas[estado] || []).find(a => N(a.nombre) === N(nombre)) || null;
      let grupo = ex ? ex.grupo : null;
      if (!ex) {
        grupo = iGrupo >= 0 ? Importar.grupoDe(estado, f[iGrupo]) : null;
        if (!grupo) {
          grupo = estado === 'er' ? 'gasto' : 'ac';
          avisos.push(donde + ': grupo no reconocido; se creará en "' + (estado === 'er' ? 'Gastos operativos' : 'Activo corriente') + '". Puedes cambiarlo en Configurar cuentas.');
        }
      }
      const valores = {};
      cols.forEach(c => {
        const x = Importar.numero(f[c.i]);
        if (x.malo) avisos.push(donde + ': el valor de ' + c.p.etiqueta + ' no es un número. Se ignoró.');
        else if (!x.vacio) valores[c.p.id] = x.n;
      });
      filas.push({ estado, nombre, existente: ex ? ex.id : null, grupo, valores });
    }
    if (!filas.length) return Importar.estado('No encontré cuentas para importar en el archivo.', 'mal');
    Importar.pendiente = { filas, avisos, ignoradas, periodos: cols.map(c => c.p) };
    Importar.estado('Archivo leído. Revisa la vista previa y confirma.', 'ok');
    Importar.vistaPrevia();
  },

  // ---------- Paso 3: vista previa ----------
  vistaPrevia() {
    const P = Importar.pendiente, nuevas = P.filas.filter(f => !f.existente).length;
    const montos = P.filas.reduce((s, f) => s + Object.keys(f.valores).length, 0);
    const cab = '<tr><th>Estado</th><th>Cuenta</th><th>Acción</th>' + P.periodos.map(p => '<th>' + esc(p.etiqueta) + '</th>').join('') + '</tr>';
    const cuerpo = P.filas.slice(0, 200).map(f => '<tr><td>' + f.estado.toUpperCase() + '</td><td>' + esc(f.nombre) + '</td><td>' +
      (f.existente ? 'Actualiza' : 'Crea cuenta nueva') + '</td>' +
      P.periodos.map(p => '<td>' + (f.valores[p.id] === undefined ? '—' : Fmt.num(f.valores[p.id], 2)) + '</td>').join('') + '</tr>').join('');
    const avisos = P.avisos.slice(0, 12).map(a => '<div class="cuadre alerta">' + esc(a) + '</div>').join('') +
      (P.avisos.length > 12 ? '<div class="cuadre alerta">Y ' + (P.avisos.length - 12) + ' aviso(s) más.</div>' : '') +
      (P.ignoradas.length ? '<div class="cuadre alerta">Columnas ignoradas (no coinciden con ningún período): ' + esc(P.ignoradas.join(', ')) + '.</div>' : '');
    document.getElementById('imp-vista').innerHTML =
      '<div class="tarjeta" style="margin-top:16px"><h3>3. Revisa y confirma</h3>' +
      '<p class="nota-pie">' + (P.filas.length - nuevas) + ' cuenta(s) existente(s) se actualizan, ' + nuevas + ' cuenta(s) nueva(s) se crean y se guardan ' + montos +
      ' monto(s). Los montos vacíos no cambian nada.</p>' + avisos +
      '<div class="tabla-scroll" style="margin-top:12px"><table class="tabla-datos">' + cab + cuerpo + '</table></div>' +
      (P.filas.length > 200 ? '<p class="nota-pie">La vista previa muestra las primeras 200 cuentas; se importarán todas.</p>' : '') +
      '<div class="barra-acciones" style="margin-top:14px"><button class="btn" id="imp-aplicar">Importar ahora</button>' +
      '<button class="btn sec" id="imp-cancelar">Cancelar</button></div></div>';
    document.getElementById('imp-aplicar').addEventListener('click', Importar.aplicar);
    document.getElementById('imp-cancelar').addEventListener('click', () => {
      Importar.pendiente = null;
      document.getElementById('imp-vista').innerHTML = '';
      Importar.estado('Importación cancelada. No se cambió nada.', 'neutro');
    });
  },

  // ---------- Aplicar ----------
  aplicar() {
    const P = Importar.pendiente;
    if (!P) return;
    const N = Importar.norm, raw = Estados.leerCrudo(), usados = new Set();
    raw.cuentas = raw.cuentas || { er: [], bg: [] };
    raw.valores = raw.valores || {};
    let nuevas = 0, montos = 0;
    P.filas.forEach(f => {
      const lista = raw.cuentas[f.estado] = raw.cuentas[f.estado] || [];
      let a = lista.find(x => x.id === f.existente) || lista.find(x => N(x.nombre) === N(f.nombre));
      if (!a) {
        let id;
        do { id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); } while (usados.has(id));
        usados.add(id);
        a = { id, nombre: f.nombre, rol: null, grupo: f.grupo };
        lista.push(a);
        nuevas++;
      }
      Object.keys(f.valores).forEach(pid => { (raw.valores[pid] = raw.valores[pid] || {})[a.id] = f.valores[pid]; montos++; });
    });
    Estados.guardarCrudo(raw);
    Importar.pendiente = null;
    document.getElementById('imp-vista').innerHTML = '';
    Importar.estado('Listo: se guardaron ' + montos + ' monto(s) y se crearon ' + nuevas + ' cuenta(s) nueva(s). Revisa el resultado en Estados financieros.', 'ok');
  },

  render(el) {
    Importar.pendiente = null;
    el.innerHTML =
      '<div class="tarjeta"><h3>1. Descarga la plantilla</h3>' +
      '<p class="nota-pie">Trae las cuentas y los períodos de tu empresa, con los montos actuales. Llénala en Excel y vuelve aquí.</p>' +
      '<div class="barra-acciones"><button class="btn sec" id="imp-plantilla">Descargar plantilla</button></div></div>' +
      '<div class="tarjeta" style="margin-top:16px"><h3>2. Sube tu Excel</h3>' +
      '<p class="nota-pie">Formato .xlsx, máximo 2 MB. Las cuentas se reconocen por su nombre; si el nombre no existe, se crea una cuenta nueva con el grupo que indiques. ' +
      'Usa números con punto decimal (se aceptan comas de miles).</p>' +
      '<div class="barra-acciones"><input type="file" id="imp-archivo" accept=".xlsx,.xls"></div>' +
      '<div id="imp-estado"></div></div><div id="imp-vista"></div>';
    el.querySelector('#imp-plantilla').addEventListener('click', Importar.plantilla);
    el.querySelector('#imp-archivo').addEventListener('change', ev => {
      const f = ev.target.files[0];
      if (f) Importar.leer(f);
      ev.target.value = '';
    });
  }
};

// Se agrega al menú, en el grupo Reportes (este archivo va DESPUÉS de exportar.js y graficos.js)
(function () {
  const item = { id: 'importar', nombre: 'Importar desde Excel', icono: 'doc' };
  const sec = SECCIONES.find(s => s.titulo === 'Reportes');
  if (sec) sec.items.push(item); else SECCIONES.push({ titulo: 'Reportes', items: [item] });
})();
Modulos.importar = {
  titulo: 'Importar desde Excel',
  subtitulo: 'Carga cuentas y montos de Estados financieros desde un archivo de Excel',
  render(el) { Importar.render(el); }
};