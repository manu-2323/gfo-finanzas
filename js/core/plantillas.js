// Plantillas de cuentas. Cada cuenta "base" tiene un ROL: es la que usan las fórmulas.
// Las cuentas que agrega el usuario no tienen rol y se clasifican por su grupo.
const ROLES = {
  ventas: { estado: 'er', grupo: 'ingreso', nombre: 'Ventas netas', requerido: true },
  costoVentas: { estado: 'er', grupo: 'costo', nombre: 'Costo de ventas', requerido: true },
  gastosVenta: { estado: 'er', grupo: 'gasto', nombre: 'Gastos de venta', requerido: true },
  gastosAdmin: { estado: 'er', grupo: 'gasto', nombre: 'Gastos de administración', requerido: true },
  depreciacion: { estado: 'er', grupo: 'depreciacion', nombre: 'Depreciación', requerido: true },
  intereses: { estado: 'er', grupo: 'interes', nombre: 'Gastos por intereses', requerido: true },
  otrosIngresos: { estado: 'er', grupo: 'otro', nombre: 'Otros ingresos (gastos) netos', requerido: true },
  efectivo: { estado: 'bg', grupo: 'ac', nombre: 'Efectivo y equivalentes', requerido: true },
  cxc: { estado: 'bg', grupo: 'ac', nombre: 'Cuentas por cobrar', requerido: true },
  inventarios: { estado: 'bg', grupo: 'ac', nombre: 'Inventarios', requerido: false },
  otrosAC: { estado: 'bg', grupo: 'ac', nombre: 'Otros activos corrientes', requerido: false },
  activosFijos: { estado: 'bg', grupo: 'anc', nombre: 'Propiedad, planta y equipo (neto)', requerido: true },
  otrosANC: { estado: 'bg', grupo: 'anc', nombre: 'Otros activos no corrientes', requerido: false },
  cxp: { estado: 'bg', grupo: 'pc', nombre: 'Cuentas por pagar', requerido: true },
  prestCP: { estado: 'bg', grupo: 'pc', nombre: 'Préstamos a corto plazo', requerido: true },
  otrosPC: { estado: 'bg', grupo: 'pc', nombre: 'Otros pasivos corrientes', requerido: false },
  prestLP: { estado: 'bg', grupo: 'pnc', nombre: 'Préstamos a largo plazo', requerido: true },
  capital: { estado: 'bg', grupo: 'pat', nombre: 'Capital social', requerido: true },
  utilidadesRetenidas: { estado: 'bg', grupo: 'pat', nombre: 'Utilidades retenidas', requerido: true }
};

// Grupos en los que se pueden clasificar las cuentas (en el orden en que se muestran)
const GRUPOS = {
  er: [['ingreso', 'Ingresos'], ['costo', 'Costo de ventas'], ['gasto', 'Gastos operativos'],
       ['depreciacion', 'Depreciación'], ['interes', 'Gastos financieros'], ['otro', 'Otros ingresos (gastos)']],
  bg: [['ac', 'Activo corriente'], ['anc', 'Activo no corriente'], ['pc', 'Pasivo corriente'],
       ['pnc', 'Pasivo no corriente'], ['pat', 'Patrimonio']]
};

const Plantillas = {
  LISTA: [
    { id: 'comercial', nombre: 'Comercial básica',
      descripcion: 'Compra y vende mercadería; incluye inventarios.',
      roles: ['ventas', 'costoVentas', 'gastosVenta', 'gastosAdmin', 'depreciacion', 'intereses', 'otrosIngresos',
        'efectivo', 'cxc', 'inventarios', 'otrosAC', 'activosFijos', 'otrosANC',
        'cxp', 'prestCP', 'otrosPC', 'prestLP', 'capital', 'utilidadesRetenidas'],
      nombres: {} },
    { id: 'servicios', nombre: 'Servicios básica',
      descripcion: 'Empresa de servicios; sin inventarios.',
      roles: ['ventas', 'costoVentas', 'gastosVenta', 'gastosAdmin', 'depreciacion', 'intereses', 'otrosIngresos',
        'efectivo', 'cxc', 'otrosAC', 'activosFijos', 'otrosANC',
        'cxp', 'prestCP', 'otrosPC', 'prestLP', 'capital', 'utilidadesRetenidas'],
      nombres: { costoVentas: 'Costo de servicios' } }
  ],

  // Devuelve las cuentas de una plantilla separadas en { er: [...], bg: [...] }
  cuentasDe(id) {
    const p = Plantillas.LISTA.find(x => x.id === id) || Plantillas.LISTA[0];
    const cuentas = { er: [], bg: [] };
    p.roles.forEach(r => {
      const R = ROLES[r];
      cuentas[R.estado].push({ id: r, nombre: p.nombres[r] || R.nombre, rol: r, grupo: R.grupo });
    });
    return cuentas;
  }
};