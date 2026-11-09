function mostrar(id) {
  if (!Empresas.activa && id !== 'empresas') {
    id = 'empresas';
    history.replaceState(null, '', '#empresas');
  }
    // Si el tipo de empresa no permite este módulo (por ejemplo, Estados en una empresa Personal), vuelve al panel
  if (Empresas.activa && typeof moduloPermitido === 'function' && !moduloPermitido(id)) {
    id = 'panel';
    history.replaceState(null, '', '#panel');
  }
  // Cierra los gráficos del módulo anterior para evitar errores al cambiar de pantalla
  if (typeof Chart !== 'undefined') Object.values(Chart.instances).forEach(g => { try { g.destroy(); } catch (e) {} });
  const mod = Modulos[id] || {
    titulo: (SECCIONES.flatMap(s => s.items).find(i => i.id === id) || {}).nombre || 'Módulo',
    subtitulo: '',
    render(el) { el.innerHTML = '<div class="aviso">Este módulo se construye en una próxima etapa.</div>'; }
  };
  document.getElementById('titulo-pagina').textContent = mod.titulo;
  document.getElementById('subtitulo-pagina').textContent = mod.subtitulo || '';
  document.querySelectorAll('.enlace').forEach(a => a.classList.toggle('activo', a.dataset.id === id));
  const vista = document.getElementById('vista');
  vista.style.animation = 'none'; void vista.offsetWidth; vista.style.animation = '';
  try {
    mod.render(vista);
    Validar.activar(vista);
  } catch (e) {
    console.error(e);
    vista.innerHTML = '<div class="aviso">Error al cargar este módulo: ' + esc(e.message) +
      '<br>Revisa que el archivo del módulo exista en js/modulos y que su línea &lt;script&gt; esté en index.html.</div>';
  }
  window.scrollTo(0, 0);
  if (typeof MenuUI !== 'undefined') MenuUI.cerrarSiMovil();
  // Obliga a los gráficos recién creados a recalcular su tamaño una vez que la pantalla
  // ya terminó de acomodarse (evita que queden invisibles o a medio dibujar hasta refrescar).
  if (typeof Chart !== 'undefined') {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      Object.values(Chart.instances).forEach(g => { try { g.resize(); } catch (e) {} });
    }));
  }
}
function rutaActual() { return location.hash.replace('#', '') || 'panel'; }

const TEXTO_GUARDADO = {
  listo: '', pendiente: 'Cambios sin guardar…', guardando: 'Guardando…',
  guardado: 'Guardado en la nube', error: 'No se pudo guardar. Se reintenta solo.'
};

function pintarUsuario() {
  const u = Auth.usuario, caja = document.getElementById('usuario-caja');
  const nombre = (u.user_metadata && u.user_metadata.nombre) || u.email;
  caja.innerHTML = '<div class="usuario-nombre">' + esc(nombre) + '</div><div class="usuario-correo">' + esc(u.email) + '</div>' +
    '<div class="estado-guardado" id="estado-guardado"></div>' +
    '<button class="btn sec" id="btn-salir">Cerrar sesión</button>' +
    '<button class="btn sec peligro" id="btn-eliminar-cuenta" style="margin-top:8px">Eliminar mi cuenta</button>';
  Datos.alEstado = e => {
    const x = document.getElementById('estado-guardado');
    if (x) { x.textContent = TEXTO_GUARDADO[e] || ''; x.className = 'estado-guardado ' + e; }
  };
  document.getElementById('btn-salir').addEventListener('click', async () => {
    await Datos.vaciarPendientes();
    await Auth.salir();
    location.hash = '';
    location.reload();
  });
  document.getElementById('btn-eliminar-cuenta').addEventListener('click', abrirModalEliminarCuenta);
}

// Ventana de confirmación para borrar la cuenta por completo (empresas, datos y el usuario)
function abrirModalEliminarCuenta() {
  const viejo = document.getElementById('modal-eliminar-cuenta');
  if (viejo) viejo.remove();
  const f = document.createElement('div');
  f.className = 'modal-fondo';
  f.id = 'modal-eliminar-cuenta';
  f.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mec-titulo">' +
    '<h2 id="mec-titulo">Eliminar tu cuenta</h2>' +
    '<p class="nota-pie">Esto borra tu cuenta, todas tus empresas y todos sus datos. No se puede deshacer.</p>' +
    '<label class="campo" style="margin-top:12px">Escribe <strong>ELIMINAR</strong> para confirmar<input type="text" id="mec-confirmar" autocomplete="off"></label>' +
    '<div class="auth-error" id="mec-error"></div>' +
    '<div class="barra-acciones">' +
      '<button class="btn sec" id="mec-cancelar">Cancelar</button>' +
      '<button class="btn peligro" id="mec-ok">Eliminar mi cuenta</button>' +
    '</div></div>';
  document.body.appendChild(f);
  f.querySelector('#mec-cancelar').addEventListener('click', () => f.remove());
  f.querySelector('#mec-ok').addEventListener('click', async () => {
    const txt = f.querySelector('#mec-confirmar').value.trim();
    const err = f.querySelector('#mec-error');
    if (txt !== 'ELIMINAR') { err.textContent = 'Escribe ELIMINAR, en mayúsculas, para confirmar.'; return; }
    const btn = f.querySelector('#mec-ok');
    btn.disabled = true; btn.textContent = 'Eliminando…';
    err.textContent = '';
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.');
      const resp = await fetch(CONFIG.SUPABASE_URL + '/functions/v1/eliminar-cuenta', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session.access_token,
          'apikey': CONFIG.SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      });
      const texto = await resp.text();
      let cuerpo = {};
      try { cuerpo = texto ? JSON.parse(texto) : {}; } catch (e) {}
      if (!resp.ok) throw new Error(cuerpo.error || ('El servidor respondió con error ' + resp.status + '.'));
      try { await Datos.vaciarPendientes(); } catch (e) {}
      alert('Tu cuenta fue eliminada.');
      location.hash = '';
      location.reload();
    } catch (e) {
      console.error(e);
      err.textContent = 'No se pudo eliminar la cuenta: ' + (e.message || e) + ' (revisa la consola con F12 para más detalle).';
      btn.disabled = false; btn.textContent = 'Eliminar mi cuenta';
    }
  });
}

// Entra a una empresa y abre su panel; la primera vez muestra el tutorial antes de elegir períodos
async function entrarEmpresa(id) {
  await Empresas.entrar(id);
  Seleccion.cargar();
  dibujarMenu();
  if (location.hash === '#panel') mostrar('panel'); else location.hash = 'panel';
  // Las finanzas personales no comparan períodos: no se pide elegirlos
  const pedirPeriodos = () => { if (!(Empresas.activa && Empresas.activa.sector === 'Personal')) Seleccion.abrirModal(); };
  if (typeof Tutorial !== 'undefined' && !Tutorial.visto()) Tutorial.mostrar(pedirPeriodos);
  else pedirPeriodos();
}

async function entrarApp() {
  PantallaAuth.ocultar();
  pintarUsuario();
  const vista = document.getElementById('vista');
  vista.innerHTML = '<div class="aviso">Cargando tus datos…</div>';
  try {
    await Empresas.cargarLista();
    const recuerdo = localStorage.getItem(Empresas.claveRecuerdo());
      if (recuerdo && Empresas.lista.some(e => e.id === recuerdo)) { await Empresas.entrar(recuerdo); Seleccion.cargar(); };
  } catch (e) { console.error(e); }
  dibujarMenu();
  mostrar(rutaActual());
}

async function arrancar() {
  dibujarMenu();
  if (typeof MenuUI !== 'undefined') MenuUI.inicial();
  const usuario = await Auth.iniciar();
  if (usuario) entrarApp(); else PantallaAuth.mostrar(entrarApp);
}

window.addEventListener('hashchange', () => { if (Auth.usuario) mostrar(rutaActual()); });
window.addEventListener('load', arrancar);

// Cuando cambias el zoom del navegador o achicas la ventana, los gráficos ya dibujados
// se quedan con el tamaño viejo hasta que algo los obliga a recalcular. Esto los mantiene
// ajustados todo el tiempo, no solo al cambiar de módulo.
let _redimTemporizador = null;
window.addEventListener('resize', () => {
  clearTimeout(_redimTemporizador);
  _redimTemporizador = setTimeout(() => {
    if (typeof Chart === 'undefined') return;
    Object.values(Chart.instances).forEach(g => { try { g.resize(); } catch (e) {} });
  }, 120);
});

// Red de seguridad para los gráficos que aparecen en blanco hasta refrescar la página.
// Un ResizeObserver avisa cada vez que el tamaño del área de contenido (#vista) cambia por
// cualquier motivo (entrar, cambiar de módulo, abrir/cerrar el menú, rotar el celular...), y
// ahí se le pide a todos los gráficos visibles que recalculen su tamaño.
if (window.ResizeObserver) {
  let _obsTemporizador = null;
  const _vistaObservador = new ResizeObserver(() => {
    clearTimeout(_obsTemporizador);
    _obsTemporizador = setTimeout(() => {
      if (typeof Chart === 'undefined') return;
      Object.values(Chart.instances).forEach(g => { try { g.resize(); } catch (e) {} });
    }, 60);
  });
  window.addEventListener('load', () => {
    const vista = document.getElementById('vista');
    if (vista) _vistaObservador.observe(vista);
  });
}