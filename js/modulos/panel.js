Modulos.panel = {
  titulo: 'Panel principal',
  subtitulo: 'Resumen de indicadores y acceso a los módulos',
  render(el) {
      const d = Estados.obtener(), r = Estados.calcular(d), a = d.anios[1];
    const indicadores = [
      ['Utilidad neta ' + a, Fmt.moneda(r[1].utilidadNeta), 'Estado de Resultados'],
      ['Razón corriente ' + a, Fmt.veces(r[1].pc ? r[1].ac / r[1].pc : NaN), 'Activo corriente / Pasivo corriente'],
      ['Total activo ' + a, Fmt.moneda(r[1].totalActivo), 'Balance General'],
      ['Patrimonio ' + a, Fmt.moneda(r[1].patrimonio), 'Balance General']
    ];
    let html = '<div class="rejilla">' + indicadores.map(i =>
      '<div class="tarjeta"><h3>' + i[0] + '</h3><div class="valor">' + i[1] + '</div><div class="nota">' + i[2] + '</div></div>'
    ).join('') + '</div>';
    html += '<h2 class="titulo-seccion">Módulos del sistema</h2><div class="rejilla">';
    SECCIONES.forEach(s => s.items.filter(i => i.id !== 'panel').forEach(i => {
      html += '<a class="tarjeta" href="#' + i.id + '">' + icono(i.icono) + '<strong>' + i.nombre + '</strong><span class="nota">' + s.titulo + '</span></a>';
    }));
    el.innerHTML = html + '</div>';
  }
};