// Valores iniciales VACÍOS de cada módulo (el sistema arranca sin datos de ejemplo)
Datos.vacios = {
  estados: () => Estados.vacio(),
  equilibrio: () => Equilibrio.vacio(),
  apalancamiento: () => Apalancamiento.vacio(),
  flujo_manual: () => Flujo.vacioManual(),
  presupuestos: () => Presupuestos.vacio(),
  proforma: () => Proforma.porDefecto(),
  personal: () => ({ ingresos: [], gastos: [], meta: 0 }),
  inventario: () => []
};