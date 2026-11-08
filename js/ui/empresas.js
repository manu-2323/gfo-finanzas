// Pantallas "Mis empresas" y "Períodos"
const SECTORES = ['Personal', 'Comercial', 'Servicios', 'Industrial', 'Práctica', 'Otro'];

// Tarjetas de bienvenida: solo aparecen cuando el usuario todavía no tiene empresas
const MODOS_USO = [
  { tipo: 'Personal', icono: 'cartera', titulo: 'Finanzas personales', texto: 'Lleva tus ingresos, gastos y ahorro. Verás solo el Presupuesto personal.' },
  { tipo: 'Comercial', icono: 'edificio', titulo: 'Mi negocio o empresa', texto: 'Estados financieros, análisis, equilibrio, apalancamiento, flujo y proforma.' },
  { tipo: 'Práctica', icono: 'libro', titulo: 'Practicar o estudiar', texto: 'Todos los módulos disponibles, para explorar el sistema o para una defensa académica.' }
];

const EmpresasUI = {
  async render(el) {
    el.innerHTML = '<div class="aviso">Cargando tus empresas…</div>';
    try { await Empresas.cargarLista(); }
    catch (e) { el.innerHTML = '<div class="aviso">' + esc(e.message) + '</div>'; return; }
    if (!Empresas.lista.length) { EmpresasUI.pintarBienvenida(el); return; }
    EmpresasUI.pintar(el, null);
  },

  // Primera vez sin empresas: el usuario elige para qué va a usar el sistema
  // Elección del modo de uso: aparece la primera vez y cada vez que se pulsa "Nueva empresa"
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
      '<h3>' + (crear ? 'Nueva empresa' : 'Editar empresa') + '</h3>' +
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
        : '<div class="nota-pie">Los períodos se editan en el módulo Períodos.</div>') +
      '<div class="auth-error" id="em-error"></div>' +
      '<div class="barra-acciones"><button class="btn" type="submit">' + (crear ? 'Crear y entrar' : 'Guardar cambios') + '</button>' +
        '<button class="btn sec" type="button" id="em-cancelar">Cancelar</button></div></form>';
  },

  pintar(el, form) {
    const activa = Empresas.activa ? Empresas.activa.id : null;
    const tarjetas = Empresas.lista.map(e => {
      const r = Empresas.resumen[e.id];
      const per = r ? r.n + ' períodos ' + (Periodos.NOMBRES[r.tipo] || '').toLowerCase() + 'es<br>' + Fecha.aTexto(r.inicio) + ' al ' + Fecha.aTexto(r.fin) : 'Sin períodos';
      return '<div class="tarjeta empresa-card' + (e.id === activa ? ' actual' : '') + '">' +
        '<h3>' + esc(e.sector || '') + (e.id === activa ? ' · empresa actual' : '') + '</h3>' +
        '<div class="empresa-nombre">' + esc(e.nombre) + '</div>' +
        '<div class="nota">' + per + '</div><div class="nota">Creada el ' + Fecha.aTexto(e.creada_en) + '</div>' +
        '<div class="empresa-acciones"><button class="btn" data-entrar="' + e.id + '">Entrar</button>' +
        '<button class="btn sec" data-editar="' + e.id + '">Editar</button>' +
        '<button class="btn sec" data-eliminar="' + e.id + '">Eliminar</button></div></div>';
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
    el.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () =>
      EmpresasUI.pintar(el, { modo: 'editar', empresa: Empresas.lista.find(x => x.id === b.dataset.editar) })));
    el.querySelectorAll('[data-eliminar]').forEach(b => b.addEventListener('click', async () => {
      const e = Empresas.lista.find(x => x.id === b.dataset.eliminar);
      if (!confirm('¿Eliminar "' + e.nombre + '" con todos sus datos? Esta acción no se puede deshacer.')) return;
      try { await Empresas.eliminar(e.id); await Empresas.cargarLista(); dibujarMenu(); EmpresasUI.pintar(el, null); }
      catch (x) { alert(x.message); }
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
          await Empresas.cargarLista(); dibujarMenu(); EmpresasUI.pintar(el, null);
        } else {
          // Finanzas personales: el sistema crea 2 períodos anuales por dentro y no se los pide al usuario
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

const PeriodosUI = {
  render(el) {
    const p = Empresas.periodos;
    const fila = x => '<tr data-id="' + x.id + '"><td>' + x.orden + '</td>' +
      '<td><input type="text" class="p-et" maxlength="30" value="' + esc(x.etiqueta) + '"></td>' +
      '<td><input type="text" class="p-ini" maxlength="10" placeholder="DD/MM/AAAA" value="' + Fecha.aTexto(x.fecha_inicio) + '"></td>' +
      '<td><input type="text" class="p-fin" maxlength="10" placeholder="DD/MM/AAAA" value="' + Fecha.aTexto(x.fecha_fin) + '"></td></tr>';
    el.innerHTML = '<div class="aviso">Empresa: <strong>' + esc(Empresas.activa.nombre) + '</strong> · ' + p.length + ' períodos ' +
      (p[0] ? (Periodos.NOMBRES[p[0].tipo] || '').toLowerCase() + 'es' : '') + '. Puedes cambiar los nombres y las fechas (DD/MM/AAAA).</div>' +
      '<div class="tarjeta" style="margin-top:14px"><div class="tabla-scroll"><table class="tabla-datos pt-tabla"><tr><th>N.º</th><th>Nombre del período</th><th>Inicio</th><th>Fin</th></tr>' +
      p.map(fila).join('') + '</table></div>' +
      '<div class="auth-error" id="pe-error"></div><div id="pe-ok" class="cuadre ok" style="display:none"></div>' +
      '<div class="barra-acciones" style="margin-top:12px"><button class="btn" id="pe-guardar">Guardar cambios</button>' +
      '<button class="btn sec" id="pe-agregar">Agregar período siguiente</button>' +
      '<button class="btn sec" id="pe-quitar">Quitar último período</button></div></div>';
    const q = s => el.querySelector(s);
    el.querySelectorAll('.p-ini,.p-fin').forEach(i => i.addEventListener('input', () => { i.value = i.value.replace(/[^0-9/]/g, ''); }));
    const mensaje = (t, bien) => { q('#pe-error').textContent = bien ? '' : t; const o = q('#pe-ok'); o.style.display = bien ? '' : 'none'; o.textContent = bien ? t : ''; };
    const ocupado = si => el.querySelectorAll('button').forEach(b => b.disabled = si);

    q('#pe-guardar').addEventListener('click', async () => {
      const cambios = [];
      for (const tr of el.querySelectorAll('tr[data-id]')) {
        const orig = p.find(x => x.id === tr.dataset.id);
        const et = tr.querySelector('.p-et').value.trim(), ini = Fecha.aIso(tr.querySelector('.p-ini').value), fin = Fecha.aIso(tr.querySelector('.p-fin').value);
        if (!et) return mensaje('El período ' + orig.orden + ' necesita un nombre.');
        if (!ini || !fin) return mensaje('El período ' + orig.orden + ' tiene una fecha no válida (usa DD/MM/AAAA).');
        if (fin < ini) return mensaje('En el período ' + orig.orden + ' la fecha final es anterior a la inicial.');
        if (et !== orig.etiqueta || ini !== orig.fecha_inicio || fin !== orig.fecha_fin) cambios.push({ id: orig.id, etiqueta: et, fecha_inicio: ini, fecha_fin: fin });
      }
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
        PeriodosUI.render(el); Validar.activar(el);
        const o = el.querySelector('#pe-ok'); o.style.display = ''; o.textContent = 'Cambios guardados.';
      } catch (e) { ocupado(false); mensaje(e.message); }
    });
    q('#pe-agregar').addEventListener('click', async () => {
      ocupado(true);
      try { await Empresas.agregarPeriodo(); PeriodosUI.render(el); }
      catch (e) { ocupado(false); mensaje(e.message); }
    });
    q('#pe-quitar').addEventListener('click', async () => {
      if (p.length <= 2) return mensaje('Debe quedar al menos 2 períodos.');
      const u = p[p.length - 1];
      if (!confirm('¿Quitar el período "' + u.etiqueta + '" y sus datos?')) return;
      ocupado(true);
      try { await Empresas.quitarPeriodo(u.id); PeriodosUI.render(el); }
      catch (e) { ocupado(false); mensaje(e.message); }
    });
  }
};

Modulos.periodos = {
  titulo: 'Períodos',
  subtitulo: 'Períodos de la empresa: nombres y fechas en formato DD/MM/AAAA',
  render(el) { PeriodosUI.render(el); }
};