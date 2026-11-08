// Selección de los dos períodos que se comparan: base y a analizar.
// Se pide al entrar a una empresa y se puede cambiar desde el menú lateral.
const Seleccion = {
  par: null,

  clave() { return 'gfo_par_' + (Empresas.activa ? Empresas.activa.id : 'ninguna'); },

  defecto() {
    const ps = Empresas.periodos || [];
    if (!ps.length) return { a: null, b: null };
    const ultimo = ps[ps.length - 1].id;
    return { a: ps.length > 1 ? ps[ps.length - 2].id : ultimo, b: ultimo };
  },

  // Lee la selección guardada en este navegador para la empresa activa
  cargar() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(Seleccion.clave())); } catch (e) {}
    Seleccion.par = p && p.a && p.b ? p : Seleccion.defecto();
  },

  // Devuelve [base, a analizar]; si el par ya no existe usa los dos últimos períodos
  ids() {
    const ps = Empresas.periodos || [];
    if (!ps.length) return [null, null];
    const existe = id => ps.some(p => p.id === id);
    if (!Seleccion.par || !existe(Seleccion.par.a) || !existe(Seleccion.par.b)) Seleccion.par = Seleccion.defecto();
    const pa = ps.find(p => p.id === Seleccion.par.a), pb = ps.find(p => p.id === Seleccion.par.b);
    return pa.orden <= pb.orden ? [pa.id, pb.id] : [pb.id, pa.id];
  },

  guardar(a, b) {
    Seleccion.par = { a, b };
    try { localStorage.setItem(Seleccion.clave(), JSON.stringify({ a, b })); } catch (e) {}
  },

  opciones(sel) {
    return (Empresas.periodos || []).map(p =>
      '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.etiqueta) + '</option>').join('');
  },

  // Selectores que aparecen en el menú lateral
  htmlMenu() {
    if (!Empresas.periodos || !Empresas.periodos.length) return '';
    const [a, b] = Seleccion.ids();
    return '<div class="sel-periodos"><small>Períodos a comparar</small>' +
      '<select class="sel-periodo" id="sel-a" aria-label="Período base">' + Seleccion.opciones(a) + '</select>' +
      '<select class="sel-periodo" id="sel-b" aria-label="Período a analizar">' + Seleccion.opciones(b) + '</select></div>';
  },

  desdeMenu() {
    const a = document.getElementById('sel-a'), b = document.getElementById('sel-b');
    if (a && b) Seleccion.confirmar(a.value, b.value);
  },

  // Guarda la selección y vuelve a dibujar la pantalla actual
    confirmar(a, b) {
    const n = (Empresas.periodos || []).length;
    if (a === b && n > 1) {
      const aviso = 'El período base y el período a analizar no pueden ser el mismo. Elige dos distintos.';
      const m = document.getElementById('modal-periodos');
      if (m) { const er = m.querySelector('#m-error'); if (er) er.textContent = aviso; }
      else {
        alert(aviso);
        if (typeof mostrar === 'function' && Empresas.activa) mostrar(rutaActual());
      }
      return;
    }
    Seleccion.guardar(a, b);
    const m = document.getElementById('modal-periodos');
    if (m) m.remove();
    if (typeof mostrar === 'function' && Empresas.activa) mostrar(rutaActual());
  },

  // Ventana "¿Qué período quieres analizar?" al entrar a una empresa
  abrirModal() {
    if (!Empresas.periodos || !Empresas.periodos.length) return;
    const viejo = document.getElementById('modal-periodos');
    if (viejo) viejo.remove();
    const [a, b] = Seleccion.ids();
    const f = document.createElement('div');
    f.className = 'modal-fondo';
    f.id = 'modal-periodos';
    f.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      '<h2 id="modal-titulo">¿Qué período quieres analizar?</h2>' +
      '<p class="nota-pie">Se compara un período base con un período a analizar. Puedes cambiarlos después desde el menú lateral.</p>' +
      '<label class="campo">Período base<select id="m-a">' + Seleccion.opciones(a) + '</select></label>' +
      '<label class="campo">Período a analizar<select id="m-b">' + Seleccion.opciones(b) + '</select></label>' +
      '<div class="auth-error" id="m-error"></div>' +
      '<div class="barra-acciones"><button class="btn" id="m-ok">Continuar</button></div></div>';
    document.body.appendChild(f);
    f.querySelector('#m-ok').addEventListener('click', () =>
      Seleccion.confirmar(f.querySelector('#m-a').value, f.querySelector('#m-b').value));
  }
};