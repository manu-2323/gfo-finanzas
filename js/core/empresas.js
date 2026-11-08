// Empresas (entidades) y sus períodos, guardados en Supabase
const Empresas = {
  lista: [],
  resumen: {},     // por empresa: cantidad de períodos, tipo y fechas
  activa: null,
  periodos: [],    // períodos de la empresa activa

  claveRecuerdo() { return 'gfo_activa_' + (Auth.usuario ? Auth.usuario.id : ''); },
  fallo(error, texto) { return new Error(texto + (error && error.message ? ' (' + error.message + ')' : '')); },

  async cargarLista() {
    const { data, error } = await sb.from('empresas').select('*').order('creada_en', { ascending: true });
    if (error) throw Empresas.fallo(error, 'No se pudieron cargar las empresas');
    Empresas.lista = data || [];
    const r = await sb.from('periodos').select('empresa_id,tipo,etiqueta,fecha_inicio,fecha_fin,orden').order('orden', { ascending: true });
    Empresas.resumen = {};
    (r.data || []).forEach(p => {
      const x = Empresas.resumen[p.empresa_id] || (Empresas.resumen[p.empresa_id] = { n: 0, tipo: p.tipo, inicio: p.fecha_inicio, fin: p.fecha_fin });
      x.n++;
      if (p.fecha_inicio < x.inicio) x.inicio = p.fecha_inicio;
      if (p.fecha_fin > x.fin) x.fin = p.fecha_fin;
    });
    return Empresas.lista;
  },

  async crear(nombre, sector, tipo, cantidad, inicioIso) {
    const { data, error } = await sb.from('empresas').insert({ nombre, sector, usuario_id: Auth.usuario.id }).select().single();
    if (error) throw Empresas.fallo(error, 'No se pudo crear la empresa');
    const filas = Periodos.generar(tipo, cantidad, inicioIso).map(p => Object.assign({ empresa_id: data.id }, p));
    const r = await sb.from('periodos').insert(filas);
    if (r.error) {
      await sb.from('empresas').delete().eq('id', data.id);
      throw Empresas.fallo(r.error, 'No se pudieron crear los períodos');
    }
    return data;
  },

  async editar(id, nombre, sector) {
    const { error } = await sb.from('empresas').update({ nombre, sector }).eq('id', id);
    if (error) throw Empresas.fallo(error, 'No se pudo guardar el cambio');
    if (Empresas.activa && Empresas.activa.id === id) { Empresas.activa.nombre = nombre; Empresas.activa.sector = sector; }
  },

  async eliminar(id) {
    const cu = await sb.from('cuentas').select('id').eq('empresa_id', id);
    const ids = (cu.data || []).map(c => c.id);
    if (ids.length) await sb.from('valores').delete().in('cuenta_id', ids);
    await sb.from('datos_modulo').delete().eq('empresa_id', id);
    await sb.from('cuentas').delete().eq('empresa_id', id);
    await sb.from('periodos').delete().eq('empresa_id', id);
    const { error } = await sb.from('empresas').delete().eq('id', id);
    if (error) throw Empresas.fallo(error, 'No se pudo eliminar la empresa');
    if (Empresas.activa && Empresas.activa.id === id) {
      Empresas.activa = null; Empresas.periodos = []; Datos.limpiar();
      try { localStorage.removeItem(Empresas.claveRecuerdo()); } catch (e) {}
    }
  },

  async cargarPeriodos(id) {
    const { data, error } = await sb.from('periodos').select('*').eq('empresa_id', id).order('orden', { ascending: true });
    if (error) throw Empresas.fallo(error, 'No se pudieron cargar los períodos');
    return data || [];
  },

  // Entra a trabajar con una empresa: descarga sus datos y sus períodos
  async entrar(id) {
    await Datos.vaciarPendientes();
    const e = Empresas.lista.find(x => x.id === id);
    if (!e) throw new Error('La empresa ya no existe.');
    await Datos.cargarEmpresa(id);
    Empresas.periodos = await Empresas.cargarPeriodos(id);
    Empresas.activa = e;
    try { localStorage.setItem(Empresas.claveRecuerdo(), id); } catch (x) {}
  },

  async guardarPeriodo(p) {
    const { error } = await sb.from('periodos').update({ etiqueta: p.etiqueta, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin }).eq('id', p.id);
    if (error) throw Empresas.fallo(error, 'No se pudo guardar el período');
  },

  async agregarPeriodo() {
    const u = Empresas.periodos[Empresas.periodos.length - 1];
    if (!u) throw new Error('Esta empresa no tiene períodos. Crea una empresa nueva para definirlos.');
    const nuevo = Periodos.generar(u.tipo, 1, Fecha.sumarDias(u.fecha_fin, 1), u.orden + 1)[0];
    const { error } = await sb.from('periodos').insert(Object.assign({ empresa_id: Empresas.activa.id }, nuevo));
    if (error) throw Empresas.fallo(error, 'No se pudo agregar el período');
    Empresas.periodos = await Empresas.cargarPeriodos(Empresas.activa.id);
  },

  async quitarPeriodo(id) {
    await sb.from('valores').delete().eq('periodo_id', id);
    const { error } = await sb.from('periodos').delete().eq('id', id);
    if (error) throw Empresas.fallo(error, 'No se pudo quitar el período');
    Empresas.periodos = await Empresas.cargarPeriodos(Empresas.activa.id);
  },

  // Año en que termina el último período (sirve de año por defecto en Estados financieros)
  anioFinal() {
    const u = Empresas.periodos[Empresas.periodos.length - 1];
    return u ? Number(String(u.fecha_fin).slice(0, 4)) : new Date().getFullYear();
  }
};