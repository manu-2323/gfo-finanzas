// Capa de datos: los módulos leen y guardan de forma sencilla (Datos.leer / Datos.guardar);
// por debajo se guarda en Supabase (tabla datos_modulo) con una copia en memoria.
const Datos = {
  empresaId: null,
  cache: {},
  pendientes: {},
  temporizador: null,
  estado: 'listo',
  alEstado: null,
  vacios: {},   // valores iniciales vacíos por módulo (se llenan en js/core/vacios.js)

  copia(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); },
  poner(e) { Datos.estado = e; if (Datos.alEstado) Datos.alEstado(e); },

  limpiar() {
    clearTimeout(Datos.temporizador);
    Datos.cache = {}; Datos.pendientes = {}; Datos.empresaId = null;
    Datos.poner('listo');
  },

  // Descarga todos los datos de módulos de una empresa
  async cargarEmpresa(id) {
    Datos.limpiar();
    const { data, error } = await sb.from('datos_modulo').select('modulo,datos').eq('empresa_id', id);
    if (error) throw new Error('No se pudieron cargar los datos de la empresa (' + error.message + ')');
    Datos.empresaId = id;
    (data || []).forEach(f => { Datos.cache[f.modulo] = f.datos; });
  },

  leer(clave, defecto = null) {
    if (Object.prototype.hasOwnProperty.call(Datos.cache, clave)) return Datos.copia(Datos.cache[clave]);
    const vacio = Datos.vacios[clave];
    return vacio ? vacio() : defecto;
  },

  guardar(clave, valor) {
    if (!Datos.empresaId) return;
    Datos.cache[clave] = Datos.copia(valor);
    Datos.pendientes[clave] = (Datos.pendientes[clave] || 0) + 1;
    Datos.poner('pendiente');
    clearTimeout(Datos.temporizador);
    Datos.temporizador = setTimeout(Datos.sincronizar, 800);
  },

  borrar(clave) {
    delete Datos.cache[clave];
    delete Datos.pendientes[clave];
    if (sb && Datos.empresaId) sb.from('datos_modulo').delete().eq('empresa_id', Datos.empresaId).eq('modulo', clave).then(() => {});
  },

  // Envía a Supabase lo que haya cambiado
  async sincronizar() {
    clearTimeout(Datos.temporizador);
    const claves = Object.keys(Datos.pendientes);
    if (!claves.length || !Datos.empresaId || !sb) return;
    const empresa = Datos.empresaId, versiones = {};
    claves.forEach(c => { versiones[c] = Datos.pendientes[c]; });
    const filas = claves.map(c => ({ empresa_id: empresa, modulo: c, datos: Datos.cache[c], actualizado_en: new Date().toISOString() }));
    Datos.poner('guardando');
    let error = null;
    try { ({ error } = await sb.from('datos_modulo').upsert(filas, { onConflict: 'empresa_id,modulo' })); }
    catch (e) { error = e; }
    if (error) {
      console.error('Error al guardar', error);
      Datos.poner('error');
      Datos.temporizador = setTimeout(Datos.sincronizar, 5000);   // reintenta solo
      return;
    }
    if (Datos.empresaId === empresa) claves.forEach(c => { if (Datos.pendientes[c] === versiones[c]) delete Datos.pendientes[c]; });
    Datos.poner(Object.keys(Datos.pendientes).length ? 'pendiente' : 'guardado');
  },

  async vaciarPendientes() { clearTimeout(Datos.temporizador); await Datos.sincronizar(); }
};

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Datos.sincronizar(); });
window.addEventListener('pagehide', () => Datos.sincronizar());