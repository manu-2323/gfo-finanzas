// Pantallas "Mis empresas" y "Períodos"
const SECTORES = ['Personal', 'Comercial', 'Servicios', 'Industrial', 'Práctica', 'Otro'];

// Tarjetas de bienvenida: solo aparecen cuando el usuario todavía no tiene empresas
const MODOS_USO = [
  { tipo: 'Personal', icono: 'cartera', titulo: 'Finanzas personales', texto: 'Lleva tus ingresos, gastos y ahorro. Verás solo el Presupuesto personal.' },
  { tipo: 'Comercial', icono: 'edificio', titulo: 'Mi negocio o empresa', texto: 'Estados financieros, análisis, equilibrio, apalancamiento, flujo y proforma.' },
  { tipo: 'Práctica', icono: 'libro', titulo: 'Practicar o estudiar', texto: 'Todos los módulos disponibles, para explorar el sistema o para una defensa académica.' }
];

// Módulos que guardan datos financieros (para advertir al eliminar un período con datos)
const MODULOS_CON_DATOS = [
  { clave: 'estados',      nombre: 'Estados financieros' },
  { clave: 'presupuestos', nombre: 'Presupuestos' },
  { clave: 'flujo',        nombre: 'Flujo de efectivo' },
  { clave: 'proforma',     nombre: 'Estados proforma' },
  { clave: 'personal',     nombre: 'Presupuesto personal' },
  { clave: 'equilibrio',   nombre: 'Punto de equilibrio' },
  { clave: 'apalancamiento', nombre: 'Apalancamiento' },
];

// Detecta si un período tiene datos guardados en algún módulo
async function periodoTieneDatos(empresaId, periodoId) {
  const encontrados = [];
  for (const m of MODULOS_CON_DATOS) {
    const clave = empresaId + '_' + periodoId + '_' + m.clave;
    try {
      const val = await Datos.leer(clave);
      if (val !== null && val !== undefined) encontrados.push(m.nombre);
    } catch (_) { /* ignorar errores de lectura */ }
  }
  return encontrados;
}

const EmpresasUI = {
  async render(el) {
    el.innerHTML = '<div class="aviso">Cargando tus empresas…</div>';
    try { await Empresas.cargarLista(); }
    catch (e) { el.innerHTML = '<div class="aviso">' + esc(e.message) + '</div>'; return; }
    if (!Empresas.lista.length) { EmpresasUI.pintarBienvenida(el); return; }
    EmpresasUI.pintar(el, null);
  },

  pintarBienvenida(el, hayEmpresas) {
    const tarjetas = MODOS_USO.map(m =>
      '<button type="button" class="tarjeta modo-card" data-tipo="' + m.tipo + '">' + icono(m.icono) +
        '<strong>' + esc(m.titulo) + '</strong><p>' + esc(m.texto) + '</p></button>').join('');
    el.innerHTML = '<div class="aviso">' + (hayEmpresas
        ? '¿Qué quieres hacer con esta nueva empresa? Elige una opción: ajusta el menú a lo que necesitas.'
        : 'Bienvenido. Antes de empezar, dinos para qué vas a usar el sistema: esto ajusta el menú a lo que necesitas. Luego puedes crear otras empresas de otro tipo cuando quieras.') + '</div>' +
      '<div class="rejilla" style="margin-top:16px">' + tarjetas + '</div>' +
      (hayEmpresas ? '<div class="barra-acciones" style="margin-top:16px"><button class="btn sec" type="button" id="modo-cancelar">Cancelar</button></div>' : '');
    el.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () =>
      EmpresasUI.pintar(el, { modo: 'crear', tipoSugerido: b.dataset.tipo })));
    const cancelar = el.querySelector('#modo-cancelar');
    if (cancelar) cancelar.addEventListener('click', () => EmpresasUI.pintar(el, null));
  },

  formulario(modo, e, tipoSugerido) {
    const hoy = new Date().getFullYear();
    const opciones = (lista, sel) => lista.map(x => '<option' + (x === sel ? ' selected' : '') + '>' + x + '</option>').join('');
    const crear = modo === 'crear';
    return '<form class="tarjeta em-form" id="em-form" data-modo="' + modo + '" data-id="' + (e ? e.id : '') + '">' +
      '<h3>' + (crear ? 'Nueva empresa' : 'Editar empresa: ' + esc(e ? e.nombre : '')) + '</h3>' +
      '<div class="barra-acciones">' +
        '<label class="campo">Nombre<input type="text" id="em-nombre" data-validar="nombre" maxlength="80" value="' + (e ? esc(e.nombre) : '') + '"></label>' +
        '<label class="campo corto" style="flex:0 0 190px">Tipo<select id="em-sector">' + opciones(SECTORES, e ? e.sector : (tipoSugerido || 'Comercial')) + '</select></label>' +
      '</div>' +
      (crear
        ? '<div id="em-periodos" style="' + (((e ? e.sector : tipoSugerido) === 'Personal') ? 'display:none' : '') + '"><div class="barra-acciones">' +
            '<label class="campo corto" style="flex:0 0 190px">Tipo de período<select id="em-tipo">' +
              Object.keys(Periodos.NOMBRES).map(k => '<option value="' + k + '"' + (k === 'anual' ? ' selected' : '') + '>' + Periodos.NOMBRES[k] + '</option>').join('') + '</select></label>' +
            '<label class="campo corto" style="flex:0 0 150px">Cantidad de períodos<input type="text" id="em-cant" data-validar="numero" value="2"></label>' +
            '<label class="campo corto" style="flex:0 0 190px">Inicio del primer período<input type="text" id="em-inicio" placeholder="DD/MM/AAAA" maxlength="10" value="' + Fecha.aTexto((hoy - 1) + '-01-01') + '"></label>' +
          '</div><div class="nota-pie">Se crearán estos períodos (luego puedes cambiar sus nombres y fechas en el módulo Períodos):</div><div class="chips" id="em-chips"></div></div>'
        : '<div class="nota-pie">Los períodos se editan desde el botón "Períodos" en la tarjeta de la empresa, o desde el menú lateral.</div>') +
      '<div class="auth-error" id="em-error"></div>' +
      '<div class="barra-acciones"><button class="btn" type="submit">' + (crear ? 'Crear y entrar' : 'Guardar cambios') + '</button>' +
        '<button class="btn sec" type="button" id="em-cancelar">Cancelar</button></div></form>';
  },

  pintar(el, form) {
    const activa = Empresas.activa ? Empresas.activa.id : null;
    const tarjetas = Empresas.lista.map(e => {
      const r = Empresas.resumen[e.id];
      const per = r ? r.n + ' períodos ' + (Periodos.NOMBRES[r.tipo] || '').toLowerCase() + 'es<br>' + Fecha.aTexto(r.inicio) + ' al ' + Fecha.aTexto(r.fin) : 'Sin períodos';
      const esActiva = e.id === activa;
      return '<div class="tarjeta empresa-card' + (esActiva ? ' actual' : '') + '">' +
        '<h3>' + esc(e.sector || '') + (esActiva ? ' <span style="font-weight:400;font-size:0.85em;color:var(--verde)">· empresa actual</span>' : '') + '</h3>' +
        '<div class="empresa-nombre">' + esc(e.nombre) + '</div>' +
        '<div class="nota">' + per + '</div>' +
        '<div class="nota">Creada el ' + Fecha.aTexto(e.creada_en) + '</div>' +
        '<div class="empresa-acciones">' +
          '<button class="btn" data-entrar="' + e.id + '">Entrar</button>' +
          '<button class="btn sec" data-ver-periodos="' + e.id + '" title="Ver y editar los períodos de esta empresa">Períodos</button>' +
          '<button class="btn sec" data-editar="' + e.id + '">Editar</button>' +
          '<button class="btn sec peligro" data-eliminar="' + e.id + '">Eliminar</button>' +
        '</div></div>';
    }).join('');
    el.innerHTML = '<div class="aviso">Cada empresa guarda sus datos por separado. Para tus finanzas personales crea una empresa de tipo "Personal".</div>' +
      '<div class="rejilla" style="margin-top:14px">' + tarjetas +
      '<button class="tarjeta empresa-nueva" id="em-nueva" type="button"><span>+</span>Nueva empresa</button></div>' +
      '<div id="em-zona" style="margin-top:16px">' + (form ? EmpresasUI.formulario(form.modo, form.empresa, form.tipoSugerido) : '') + '</div>';
    Validar.activar(el);
    EmpresasUI.eventos(el);
    if (form && form.modo === 'crear') EmpresasUI.vistaPrevia(el);
  },

  vistaPrevia(el) {
    const q = s => el.querySelector(s);
    const tipo = q('#em-tipo').value, cant = parseInt(q('#em-cant').value, 10), ini = Fecha.aIso(q('#em-inicio').value);
    const cont = q('#em-chips');
    if (!ini || !(cant >= 2 && cant <= 60)) { cont.innerHTML = '<span class="nota">Escribe una fecha válida (DD/MM/AAAA) y entre 2 y 60 períodos.</span>'; return; }
    const lista = Periodos.generar(tipo, cant, ini);
    cont.innerHTML = lista.slice(0, 12).map(p => '<span class="chip">' + esc(p.etiqueta) + '</span>').join('') + (lista.length > 12 ? '<span class="chip">… ' + lista.length + ' en total</span>' : '');
  },

  eventos(el) {
    const q = s => el.querySelector(s);
    q('#em-nueva').addEventListener('click', () => EmpresasUI.pintarBienvenida(el, true));

    el.querySelectorAll('[data-entrar]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { await entrarEmpresa(b.dataset.entrar); }
      catch (e) { alert(e.message); b.disabled = false; }
    }));

    // Botón "Períodos": navega directamente al módulo de períodos de esa empresa
    el.querySelectorAll('[data-ver-periodos]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.verPeriodos;
      const emp = Empresas.lista.find(x => x.id === id);
      if (!emp) return;
      b.disabled = true;
      try {
        // Si no es la empresa activa, entramos primero
        if (!Empresas.activa || Empresas.activa.id !== id) {
          await entrarEmpresa(id);
        }
        // Navegar al módulo períodos
        if (typeof navegarA === 'function') {
          navegarA('periodos');
        } else {
          // Fallback: simular clic en el ítem del menú
          const menuItem = document.querySelector('[data-modulo="periodos"]');
          if (menuItem) menuItem.click();
        }
      } catch (e) { alert(e.message); b.disabled = false; }
    }));

    el.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () =>
      EmpresasUI.pintar(el, { modo: 'editar', empresa: Empresas.lista.find(x => x.id === b.dataset.editar) })));

    el.querySelectorAll('[data-eliminar]').forEach(b => b.addEventListener('click', async () => {
      const e = Empresas.lista.find(x => x.id === b.dataset.eliminar);
      if (!e) return;

      // Verificar si tiene períodos con datos antes de confirmar
      let advertencia = '';
      try {
        const periodos = await Empresas.cargarPeriodos(e.id);
        const modulosConDatos = new Set();
        for (const per of periodos) {
          const encontrados = await periodoTieneDatos(e.id, per.id);
          encontrados.forEach(m => modulosConDatos.add(m));
        }
        if (modulosConDatos.size > 0) {
          advertencia = '\n\nATENCIÓN: Esta empresa tiene datos en los siguientes módulos que se perderán:\n· ' +
            [...modulosConDatos].join('\n· ');
        }
      } catch (_) { /* si no se puede verificar, continuar de todas formas */ }

      const msg = '¿Eliminar la empresa "' + e.nombre + '" con todos sus períodos y datos?' +
        advertencia +
        '\n\nEsta acción no se puede deshacer.';
      if (!confirm(msg)) return;

      b.disabled = true;
      try {
        await Empresas.eliminar(e.id);
        await Empresas.cargarLista();
        dibujarMenu();
        EmpresasUI.pintar(el, null);
      } catch (x) { alert(x.message); b.disabled = false; }
    }));

    const form = q('#em-form');
    if (!form) return;
    q('#em-cancelar').addEventListener('click', () => EmpresasUI.pintar(el, null));
    if (form.dataset.modo === 'crear') {
      q('#em-inicio').addEventListener('input', ev => { ev.target.value = ev.target.value.replace(/[^0-9/]/g, ''); });
      q('#em-sector').addEventListener('change', ev => { q('#em-periodos').style.display = ev.target.value === 'Personal' ? 'none' : ''; });
      ['#em-tipo', '#em-cant', '#em-inicio'].forEach(s => q(s).addEventListener('input', () => EmpresasUI.vistaPrevia(el)));
    }
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const err = q('#em-error'); err.textContent = '';
      const nombre = q('#em-nombre').value.trim().replace(/\s+/g, ' '), sector = q('#em-sector').value;
      if (nombre.length < 2) { err.textContent = 'Escribe el nombre de la empresa (mínimo 2 letras).'; return; }
      const repetida = Empresas.lista.some(x => x.id !== form.dataset.id && x.nombre.toLowerCase() === nombre.toLowerCase());
      if (repetida) { err.textContent = 'Ya tienes una empresa con ese nombre.'; return; }
      const botones = form.querySelectorAll('button'); botones.forEach(b => b.disabled = true);
      try {
        if (form.dataset.modo === 'editar') {
          await Empresas.editar(form.dataset.id, nombre, sector);
          await Empresas.cargarLista();
          dibujarMenu();
          EmpresasUI.pintar(el, null);
        } else {
          const personal = sector === 'Personal';
          const cant = personal ? 2 : parseInt(q('#em-cant').value, 10);
          const ini = personal ? ((new Date().getFullYear() - 1) + '-01-01') : Fecha.aIso(q('#em-inicio').value);
          if (!ini) throw new Error('La fecha de inicio no es válida. Usa el formato DD/MM/AAAA, por ejemplo 01/01/2026.');
          if (!(cant >= 2 && cant <= 60)) throw new Error('La cantidad de períodos debe estar entre 2 y 60.');
          const nueva = await Empresas.crear(nombre, sector, personal ? 'anual' : q('#em-tipo').value, cant, ini);
          await Empresas.cargarLista();
          await entrarEmpresa(nueva.id);
        }
      } catch (e) { err.textContent = e.message; botones.forEach(b => b.disabled = false); }
    });
  }
};

Modulos.empresas = {
  titulo: 'Mis empresas',
  subtitulo: 'Crea una empresa o elige con cuál quieres trabajar',
  render(el) { EmpresasUI.render(el); }
};

// ─── MÓDULO PERÍODOS ──────────────────────────────────────────────────────────

const PeriodosUI = {
  render(el) {
    if (!Empresas.activa) {
      el.innerHTML = '<div class="aviso">Primero entra a una empresa desde "Mis empresas".</div>';
      return;
    }
    const p = Empresas.periodos;
    const emp = Empresas.activa;

    const fila = x => '<tr data-id="' + x.id + '">' +
      '<td style="text-align:center;color:var(--texto-2)">' + x.orden + '</td>' +
      '<td><input type="text" class="p-et" maxlength="30" value="' + esc(x.etiqueta) + '"></td>' +
      '<td><input type="text" class="p-ini" maxlength="10" placeholder="DD/MM/AAAA" value="' + Fecha.aTexto(x.fecha_inicio) + '"></td>' +
      '<td><input type="text" class="p-fin" maxlength="10" placeholder="DD/MM/AAAA" value="' + Fecha.aTexto(x.fecha_fin) + '"></td>' +
      '<td style="text-align:center"><button class="btn sec pequeno" data-duplicar="' + x.id + '" title="Crear un nuevo período copiando los datos de este">Duplicar</button></td>' +
      '</tr>';

    el.innerHTML =
      // Encabezado con empresa claramente identificada
      '<div class="tarjeta" style="margin-bottom:14px;background:var(--fondo-2)">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          icono('edificio') +
          '<div>' +
            '<div style="font-size:0.8em;color:var(--texto-2);text-transform:uppercase;letter-spacing:0.05em">Empresa</div>' +
            '<div style="font-weight:600;font-size:1.05em">' + esc(emp.nombre) + '</div>' +
            '<div style="font-size:0.85em;color:var(--texto-2)">' + esc(emp.sector || '') + '</div>' +
          '</div>' +
          '<div style="margin-left:auto;text-align:right">' +
            '<div style="font-size:0.8em;color:var(--texto-2);text-transform:uppercase;letter-spacing:0.05em">Períodos</div>' +
            '<div style="font-weight:600">' + p.length + ' ' + (p[0] ? (Periodos.NOMBRES[p[0].tipo] || '').toLowerCase() + 'es' : '') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="aviso">Puedes cambiar los nombres y fechas de cada período (formato DD/MM/AAAA). Usa "Duplicar" para crear un nuevo período con los datos de uno anterior.</div>' +
      '<div class="tarjeta" style="margin-top:14px">' +
        '<div class="tabla-scroll">' +
          '<table class="tabla-datos pt-tabla">' +
            '<tr><th>N.º</th><th>Nombre del período</th><th>Inicio</th><th>Fin</th><th>Acción</th></tr>' +
            p.map(fila).join('') +
          '</table>' +
        '</div>' +
        '<div class="auth-error" id="pe-error"></div>' +
        '<div id="pe-ok" class="cuadre ok" style="display:none"></div>' +
        '<div class="barra-acciones" style="margin-top:12px">' +
          '<button class="btn" id="pe-guardar">Guardar cambios</button>' +
          '<button class="btn sec" id="pe-agregar">Agregar período siguiente</button>' +
          '<button class="btn sec peligro" id="pe-quitar">Quitar último período</button>' +
        '</div>' +
      '</div>';

    const q = s => el.querySelector(s);
    el.querySelectorAll('.p-ini,.p-fin').forEach(i => i.addEventListener('input', () => { i.value = i.value.replace(/[^0-9/]/g, ''); }));

    const mensaje = (t, bien) => {
      q('#pe-error').textContent = bien ? '' : t;
      const o = q('#pe-ok'); o.style.display = bien ? '' : 'none'; o.textContent = bien ? t : '';
    };
    const ocupado = si => el.querySelectorAll('button').forEach(b => b.disabled = si);

    // Guardar cambios de nombres/fechas
    q('#pe-guardar').addEventListener('click', async () => {
      const cambios = [];
      for (const tr of el.querySelectorAll('tr[data-id]')) {
        const orig = p.find(x => x.id === tr.dataset.id);
        const et = tr.querySelector('.p-et').value.trim();
        const ini = Fecha.aIso(tr.querySelector('.p-ini').value);
        const fin = Fecha.aIso(tr.querySelector('.p-fin').value);
        if (!et) return mensaje('El período ' + orig.orden + ' necesita un nombre.');
        if (!ini || !fin) return mensaje('El período ' + orig.orden + ' tiene una fecha no válida (usa DD/MM/AAAA).');
        if (fin < ini) return mensaje('En el período ' + orig.orden + ' la fecha final es anterior a la inicial.');
        if (et !== orig.etiqueta || ini !== orig.fecha_inicio || fin !== orig.fecha_fin)
          cambios.push({ id: orig.id, etiqueta: et, fecha_inicio: ini, fecha_fin: fin });
      }
      // Verificar nombres duplicados
      const vistos = new Set();
      for (const inp of el.querySelectorAll('.p-et')) {
        const k = inp.value.trim().toLowerCase();
        if (vistos.has(k)) return mensaje('Hay dos períodos con el mismo nombre ("' + inp.value.trim() + '"). Cada período debe tener un nombre distinto.');
        vistos.add(k);
      }
      if (!cambios.length) return mensaje('No hay cambios por guardar.', true);
      ocupado(true);
      try {
        for (const c of cambios) await Empresas.guardarPeriodo(c);
        Empresas.periodos = await Empresas.cargarPeriodos(Empresas.activa.id);
        PeriodosUI.render(el);
        Validar.activar(el);
        const o = el.querySelector('#pe-ok'); o.style.display = ''; o.textContent = 'Cambios guardados.';
      } catch (e) { ocupado(false); mensaje(e.message); }
    });

    // Agregar período siguiente con validación de duplicado
    q('#pe-agregar').addEventListener('click', async () => {
      // Calcular la etiqueta del nuevo período para verificar duplicado
      let nuevaEtiqueta = '';
      try {
        const ultimo = p[p.length - 1];
        if (ultimo && ultimo.tipo) {
          const siguientes = Periodos.generar(ultimo.tipo, 1, ultimo.fecha_fin
            ? new Date(ultimo.fecha_fin + 'T00:00:00').toISOString().slice(0, 10)
            : ultimo.fecha_inicio);
          if (siguientes[0]) nuevaEtiqueta = siguientes[0].etiqueta;
        }
      } catch (_) { /* no bloquear si falla */ }

      // Verificar si ya existe un período con ese nombre
      if (nuevaEtiqueta) {
        const duplicado = p.some(x => x.etiqueta.toLowerCase() === nuevaEtiqueta.toLowerCase());
        if (duplicado) {
          return mensaje('Ya existe un período con ese nombre ("' + nuevaEtiqueta + '"). Revisa si el período ya fue creado.');
        }
      }

      ocupado(true);
      try {
        await Empresas.agregarPeriodo();
        PeriodosUI.render(el);
      } catch (e) { ocupado(false); mensaje(e.message); }
    });

    // Quitar último período con advertencia si tiene datos
    q('#pe-quitar').addEventListener('click', async () => {
      if (p.length <= 2) return mensaje('Debe quedar al menos 2 períodos.');
      const u = p[p.length - 1];

      // Verificar si tiene datos en otros módulos
      let advertencia = '';
      ocupado(true);
      try {
        const conDatos = await periodoTieneDatos(Empresas.activa.id, u.id);
        if (conDatos.length > 0) {
          advertencia = '\n\nEste período tiene datos en:\n· ' + conDatos.join('\n· ') +
            '\n\nSi lo eliminas, esos datos se perderán.';
        }
      } catch (_) { /* continuar aunque falle la verificación */ }
      ocupado(false);

      const msg = '¿Quitar el período "' + u.etiqueta + '"?' +
        advertencia +
        '\n\nEsta acción no se puede deshacer.';
      if (!confirm(msg)) return;

      ocupado(true);
      try {
        await Empresas.quitarPeriodo(u.id);
        PeriodosUI.render(el);
      } catch (e) { ocupado(false); mensaje(e.message); }
    });

    // Duplicar período: crea uno nuevo copiando los datos del seleccionado
    el.querySelectorAll('[data-duplicar]').forEach(b => b.addEventListener('click', async () => {
      const idOrigen = b.dataset.duplicar;
      const origen = p.find(x => x.id === idOrigen);
      if (!origen) return;

      // Calcular siguiente período después del último
      const ultimo = p[p.length - 1];
      let nuevaEtiqueta = '', nuevoInicio = '', nuevoFin = '';
      try {
        if (ultimo && ultimo.tipo && ultimo.fecha_fin) {
          const finDate = new Date(ultimo.fecha_fin + 'T00:00:00');
          finDate.setDate(finDate.getDate() + 1);
          const nextIso = finDate.toISOString().slice(0, 10);
          const siguientes = Periodos.generar(ultimo.tipo, 1, nextIso);
          if (siguientes[0]) {
            nuevaEtiqueta = siguientes[0].etiqueta;
            nuevoInicio = siguientes[0].fecha_inicio;
            nuevoFin = siguientes[0].fecha_fin;
          }
        }
      } catch (_) { /* usar vacíos */ }

      // Verificar duplicado
      if (nuevaEtiqueta && p.some(x => x.etiqueta.toLowerCase() === nuevaEtiqueta.toLowerCase())) {
        return mensaje('Ya existe un período con el nombre "' + nuevaEtiqueta + '". No se puede duplicar hasta que el período siguiente sea diferente.');
      }

      const confirmar = confirm(
        '¿Duplicar los datos de "' + origen.etiqueta + '" en un nuevo período' +
        (nuevaEtiqueta ? ' llamado "' + nuevaEtiqueta + '"' : '') + '?\n\n' +
        'Se creará el período nuevo y se copiarán los estados financieros de "' + origen.etiqueta + '" como punto de partida. ' +
        'Podrás modificarlos después.'
      );
      if (!confirmar) return;

      b.disabled = true;
      try {
        // 1. Agregar el período nuevo
        await Empresas.agregarPeriodo();
        Empresas.periodos = await Empresas.cargarPeriodos(Empresas.activa.id);
        const nuevo = Empresas.periodos[Empresas.periodos.length - 1];

        // 2. Copiar datos del período origen al nuevo
        const empId = Empresas.activa.id;
        for (const m of MODULOS_CON_DATOS) {
          try {
            const claveOrigen = empId + '_' + idOrigen + '_' + m.clave;
            const claveDestino = empId + '_' + nuevo.id + '_' + m.clave;
            const datos = await Datos.leer(claveOrigen);
            if (datos !== null && datos !== undefined) {
              await Datos.guardar(claveDestino, datos);
            }
          } catch (_) { /* si falla la copia de un módulo, continuar con los demás */ }
        }

        PeriodosUI.render(el);
        const o = el.querySelector('#pe-ok');
        if (o) { o.style.display = ''; o.textContent = 'Período duplicado. Revisa y ajusta los datos según corresponda.'; }
      } catch (e) { mensaje(e.message); b.disabled = false; }
    }));
  }
};

Modulos.periodos = {
  titulo: 'Períodos',
  subtitulo: 'Períodos de la empresa activa: nombres, fechas y duplicación',
  render(el) { PeriodosUI.render(el); }
};