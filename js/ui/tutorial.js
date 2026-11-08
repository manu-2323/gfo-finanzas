// Recorrido guiado: 4 pasos para finanzas personales y 5 para negocio. Se muestra solo la primera vez
// que el usuario entra a una empresa de cada tipo, y se puede volver a ver desde "Ayuda" en el menú.
const Tutorial = {
  i: 0,
  pasos: [],

  PASOS_NEGOCIO: [
    { t: 'Crea o elige tu empresa', d: 'Cada empresa guarda sus datos por separado. Puedes tener una empresa de tipo "Personal" para tus finanzas y otra de negocio.' },
    { t: 'Configura las cuentas', d: 'En "Configurar cuentas" eliges una plantilla o ajustas los nombres, el grupo y el orden de tus cuentas del Estado de Resultados y el Balance General.' },
    { t: 'Escribe los montos', d: 'En "Estados financieros" escribes las cifras de cada período. Los números se van separando con comas mientras escribes.' },
    { t: 'Revisa el análisis', d: 'El Panel principal y los módulos de Análisis, Equilibrio, Apalancamiento, Flujo y Proforma interpretan tus números automáticamente y te avisan de riesgos o alertas.' },
    { t: 'Exporta tu trabajo', d: 'Desde "Reportes" puedes exportar todo a Excel con fórmulas, listo para entregar o imprimir.' }
  ],

  PASOS_PERSONAL: [
    { t: 'Registra tus ingresos', d: 'En "Presupuesto personal" escribes lo que ganas en el mes: salario, trabajos extra y cualquier otro ingreso.' },
    { t: 'Anota tus gastos', d: 'Agrega tus gastos y elige su categoría (vivienda, alimentación, transporte...). El sistema suma y te muestra en qué se va tu dinero.' },
    { t: 'Define tu meta de ahorro', d: 'Escribe qué porcentaje de tus ingresos quieres ahorrar. El panel te dirá si llegas a tu meta y cuánto te falta.' },
    { t: 'Separa tus finanzas del negocio', d: 'Si además llevas un negocio, crea otra empresa desde "Mis empresas" y elige "Mi negocio o empresa". Cada una guarda sus datos aparte.' }
  ],

  esPersonal() { return !!(typeof Empresas !== 'undefined' && Empresas.activa && Empresas.activa.sector === 'Personal'); },

  clave() {
    const u = typeof Auth !== 'undefined' && Auth.usuario ? Auth.usuario.id : 'anon';
    return 'gfo_tutorial_' + u + (Tutorial.esPersonal() ? '_personal' : '');
  },

  visto() {
    try { return localStorage.getItem(Tutorial.clave()) === '1'; }
    catch (e) { return true; }
  },

  marcarVisto() {
    try { localStorage.setItem(Tutorial.clave(), '1'); } catch (e) {}
  },

  mostrar(alCerrar) {
    Tutorial.pasos = Tutorial.esPersonal() ? Tutorial.PASOS_PERSONAL : Tutorial.PASOS_NEGOCIO;
    Tutorial.i = 0;
    Tutorial.pintar(alCerrar);
  },

  pintar(alCerrar) {
    const viejo = document.getElementById('modal-tutorial');
    if (viejo) viejo.remove();
    const p = Tutorial.pasos[Tutorial.i];
    const ultimo = Tutorial.i === Tutorial.pasos.length - 1;
    const f = document.createElement('div');
    f.className = 'modal-fondo';
    f.id = 'modal-tutorial';
    f.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="tut-titulo">' +
      '<p class="nota-pie">Paso ' + (Tutorial.i + 1) + ' de ' + Tutorial.pasos.length + '</p>' +
      '<h2 id="tut-titulo">' + esc(p.t) + '</h2>' +
      '<p>' + esc(p.d) + '</p>' +
      '<div class="barra-acciones" style="justify-content:space-between">' +
        '<button class="btn sec" type="button" id="tut-saltar">Saltar</button>' +
        '<button class="btn" type="button" id="tut-sig">' + (ultimo ? 'Entendido' : 'Siguiente') + '</button>' +
      '</div></div>';
    document.body.appendChild(f);
    const cerrar = () => { f.remove(); Tutorial.marcarVisto(); if (alCerrar) alCerrar(); };
    f.querySelector('#tut-saltar').addEventListener('click', cerrar);
    f.querySelector('#tut-sig').addEventListener('click', () => {
      if (!ultimo) { Tutorial.i++; Tutorial.pintar(alCerrar); }
      else cerrar();
    });
  }
};