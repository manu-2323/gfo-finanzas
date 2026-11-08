const Modulos = {};

const ICONOS = {
  panel: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
  barras: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  meta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  palanca: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  flujo: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  reporte: '<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  cartera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7a2 2 0 0 1 2-2h14v2M16 14h2"/>',
  caja: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  edificio: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2"/>',
  ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.7 2.7 0 0 1 5.2.9c0 1.9-2.3 2.1-2.4 3.7"/><circle cx="12" cy="17.2" r=".6"/>'
};

const SECCIONES = [
  { titulo: 'Inicio', items: [
    { id: 'panel', nombre: 'Panel principal', icono: 'panel' }] },
  { titulo: 'Empresa', items: [
    { id: 'empresas', nombre: 'Mis empresas', icono: 'edificio' },
    { id: 'periodos', nombre: 'Períodos', icono: 'calendario' },
    { id: 'configuracion', nombre: 'Configurar cuentas', icono: 'reporte' }] },
  { titulo: 'Análisis financiero', items: [
    { id: 'estados', nombre: 'Estados financieros', icono: 'doc' },
    { id: 'analisis', nombre: 'Análisis financiero', icono: 'barras' },
    { id: 'equilibrio', nombre: 'Punto de equilibrio', icono: 'meta' },
    { id: 'apalancamiento', nombre: 'Apalancamiento', icono: 'palanca' }] },
  { titulo: 'Planeación financiera', items: [
    { id: 'flujo', nombre: 'Flujo de efectivo', icono: 'flujo' },
    { id: 'presupuestos', nombre: 'Planeación y presupuestos', icono: 'calendario' },
    { id: 'proforma', nombre: 'Proforma y reporte', icono: 'reporte' }] },
  { titulo: 'Aplicaciones prácticas', items: [
    { id: 'personal', nombre: 'Presupuesto personal', icono: 'cartera' },
    { id: 'inventario', nombre: 'Control de inventario', icono: 'caja' }] },
  { titulo: 'Referencia', items: [
    { id: 'formulas', nombre: 'Fórmulas utilizadas', icono: 'libro' }] }
];

// Módulos ocultos según el tipo de empresa (campo "sector").
// Personal: solo Panel, Mis empresas y Presupuesto personal.
// Práctica: todo el sistema.
// Comercial, Servicios, Industrial, Otro: todo menos el presupuesto personal.
const MENU_POR_TIPO = {
  Personal: ['periodos', 'configuracion', 'estados', 'analisis', 'equilibrio', 'apalancamiento', 'flujo',
    'presupuestos', 'proforma', 'inventario', 'formulas', 'graficos', 'exportar', 'importar'],
  Práctica: [],
  Empresa: ['personal']
};

function ocultosPara(sector) {
  if (sector === 'Personal') return MENU_POR_TIPO.Personal;
  if (sector === 'Práctica') return MENU_POR_TIPO['Práctica'];
  return MENU_POR_TIPO.Empresa;
}

// ¿Puede la empresa activa abrir este módulo? También bloquea direcciones escritas a mano
function moduloPermitido(id) {
  if (id === 'panel' || id === 'empresas') return true;
  const activa = typeof Empresas !== 'undefined' ? Empresas.activa : null;
  return !activa || !ocultosPara(activa.sector).includes(id);
}

function icono(nombre) {
  return '<svg viewBox="0 0 24 24">' + (ICONOS[nombre] || '') + '</svg>';
}

function dibujarMenu() {
  const nav = document.getElementById('navegacion');
  const activa = typeof Empresas !== 'undefined' ? Empresas.activa : null;
  const enlace = i => '<a class="enlace" href="#' + i.id + '" data-id="' + i.id + '">' + icono(i.icono) + i.nombre + '</a>';
  const botonAyuda = '<button type="button" class="enlace" id="btn-ayuda">' + icono('ayuda') + 'Ayuda: ver el recorrido</button>';
  if (!activa) {
    const primero = SECCIONES.find(s => s.titulo === 'Empresa').items[0];
    nav.innerHTML = '<div class="grupo">Empresa</div>' + enlace(primero);
    return;
  }
  const ocultos = ocultosPara(activa.sector);
  const personal = activa.sector === 'Personal';
  nav.innerHTML = '<div class="empresa-caja"><small>' + (personal ? 'Finanzas personales' : 'Empresa actual') + '</small><strong>' + esc(activa.nombre) + '</strong>' +
    (personal ? '' : Seleccion.htmlMenu()) + '</div>' +
    SECCIONES.map(s => {
      const items = s.items.filter(i => !ocultos.includes(i.id));
      return items.length ? '<div class="grupo">' + s.titulo + '</div>' + items.map(enlace).join('') : '';
    }).join('') + botonAyuda;
  nav.querySelectorAll('.sel-periodo').forEach(s => s.addEventListener('change', () => Seleccion.desdeMenu()));
  const btnAyuda = nav.querySelector('#btn-ayuda');
  if (btnAyuda) btnAyuda.addEventListener('click', () => { if (typeof Tutorial !== 'undefined') Tutorial.mostrar(); });
}

// Botón para ocultar/mostrar el menú lateral. En escritorio recuerda lo elegido;
// en celular/tableta siempre arranca oculto y se cierra solo al elegir un módulo.
const MenuUI = {
  clave: 'gfo_menu_cerrado',
  limite: 980,

  cerrado() {
    const app = document.getElementById('app');
    return app ? app.classList.contains('menu-cerrado') : false;
  },

  aplicar(cerrado) {
    const app = document.getElementById('app'), btn = document.getElementById('btn-menu');
    if (!app) return;
    app.classList.toggle('menu-cerrado', cerrado);
    if (btn) btn.setAttribute('aria-expanded', cerrado ? 'false' : 'true');
  },

  alternar() {
    const cerrado = !MenuUI.cerrado();
    MenuUI.aplicar(cerrado);
    if (window.innerWidth > MenuUI.limite) {
      try { localStorage.setItem(MenuUI.clave, cerrado ? '1' : '0'); } catch (e) {}
    }
  },

  // Se llama al elegir un módulo: en pantallas angostas cierra el menú solo
  cerrarSiMovil() {
    if (window.innerWidth <= MenuUI.limite) MenuUI.aplicar(true);
  },

  inicial() {
    let cerrado = window.innerWidth <= MenuUI.limite;
    if (window.innerWidth > MenuUI.limite) {
      try { cerrado = localStorage.getItem(MenuUI.clave) === '1'; } catch (e) {}
    }
    MenuUI.aplicar(cerrado);
    const btn = document.getElementById('btn-menu'), fondo = document.getElementById('menu-fondo');
    if (btn) btn.addEventListener('click', MenuUI.alternar);
    if (fondo) fondo.addEventListener('click', () => MenuUI.aplicar(true));
  }
};