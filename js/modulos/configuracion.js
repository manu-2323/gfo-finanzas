// Configurar cuentas: plantillas, agregar, renombrar, cambiar grupo, subir/bajar y quitar cuentas.
const Configuracion = {
  // Busca una cuenta por id en el Estado de Resultados o en el Balance
  buscar(raw, id) {
    for (const estado of ['er', 'bg']) {
      const a = raw.cuentas[estado].find(x => x.id === id);
      if (a) return { a, estado };
    }
    return null;
  },

  // Sube (-1) o baja (1) una cuenta dentro de su grupo
  mover(raw, estado, id, dir) {
    const lista = raw.cuentas[estado];
    const actual = lista.find(x => x.id === id);
    if (!actual) return;
    const mismos = lista.map((x, i) => i).filter(i => lista[i].grupo === actual.grupo);
    const pos = mismos.findIndex(i => lista[i].id === id);
    const otro = mismos[pos + dir];
    if (pos < 0 || otro === undefined) return;
    const i = mismos[pos];
    [lista[i], lista[otro]] = [lista[otro], lista[i]];
  },

  quitar(raw, estado, id) {
    raw.cuentas[estado] = raw.cuentas[estado].filter(a => a.id !== id);
    Object.keys(raw.valores).forEach(pid => { delete raw.valores[pid][id]; });
  },

  agregar(raw, estado) {
    raw.cuentas[estado].push({
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: 'Nueva cuenta', rol: null, grupo: estado === 'er' ? 'gasto' : 'ac'
    });
  },

  // Reemplaza todas las cuentas por una plantilla; conserva los montos de las cuentas base
  aplicarPlantilla(raw, plantillaId) {
    const nuevo = Plantillas.cuentasDe(plantillaId);
    const vigentes = new Set([...nuevo.er, ...nuevo.bg].map(a => a.id));
    raw.cuentas = nuevo;
    Object.keys(raw.valores).forEach(pid => {
      Object.keys(raw.valores[pid]).forEach(id => { if (!vigentes.has(id)) delete raw.valores[pid][id]; });
    });
  },

  // Validaciones: cuentas base faltantes, nombres vacíos o repetidos
  avisos(raw) {
    const out = [];
    Object.keys(ROLES).forEach(r => {
      const R = ROLES[r];
      if (R.requerido && !raw.cuentas[R.estado].some(a => a.rol === r)) {
        out.push('Falta la cuenta base "' + R.nombre + '". El cálculo la toma como cero.');
      }
    });
    const nombres = [...raw.cuentas.er, ...raw.cuentas.bg].map(a => String(a.nombre).trim().toLowerCase());
    const vacias = nombres.filter(n => !n).length;
    if (vacias) out.push('Hay ' + vacias + ' cuenta(s) sin nombre.');
    const repetidos = [...new Set(nombres.filter((n, i) => n && nombres.indexOf(n) !== i))];
    if (repetidos.length) out.push('Hay cuentas con nombre repetido: ' + repetidos.join(', ') + '.');
    return out;
  },

  avisosHtml(raw) {
    const lista = Configuracion.avisos(raw);
    return lista.length
      ? '<div class="cuadre mal">' + lista.map(t => '<div>' + esc(t) + '</div>').join('') + '</div>'
      : '<div class="cuadre ok">Cuentas revisadas: están todas las cuentas base y no hay nombres repetidos. (Esto no revisa los montos.)</div>';
  },

  fila(a, estado, esPrimero, esUltimo) {
    const grupo = a.rol
      ? '<span class="chip">Cuenta base</span>'
      : '<select data-grupo-de="' + a.id + '">' + GRUPOS[estado].map(([g, e]) =>
          '<option value="' + g + '"' + (g === a.grupo ? ' selected' : '') + '>' + e + '</option>').join('') + '</select>';
    const quitar = a.rol
      ? '<span class="nota-pie" title="Las cuentas base son obligatorias: las usan las fórmulas. Puedes cambiar su nombre y su orden, pero no quitarla.">No se puede quitar</span>'
      : '<button class="btn mini peligro" data-quitar="' + a.id + '">Quitar</button>';
    return '<tr><td><input type="text" data-nombre-de="' + a.id + '" value="' + esc(a.nombre) + '"></td>' +
      '<td>' + grupo + '</td>' +
      '<td class="acciones">' +
        '<button class="btn mini sec" data-mover="' + a.id + '" data-dir="-1"' + (esPrimero ? ' disabled' : '') + '>Subir</button> ' +
        '<button class="btn mini sec" data-mover="' + a.id + '" data-dir="1"' + (esUltimo ? ' disabled' : '') + '>Bajar</button> ' +
        quitar +
      '</td></tr>';
  },

  bloque(estado, titulo, raw) {
    const lista = raw.cuentas[estado];
    const cuerpo = GRUPOS[estado].map(([g, etiqueta]) => {
      const filas = lista.filter(a => a.grupo === g).map((a, i, arr) => Configuracion.fila(a, estado, i === 0, i === arr.length - 1)).join('');
      return '<tr class="sub"><td colspan="3">' + etiqueta + '</td></tr>' +
        (filas || '<tr><td colspan="3" class="nota-pie">Sin cuentas en este grupo.</td></tr>');
    }).join('');
    return '<div class="tarjeta" style="margin-top:16px"><h3>' + titulo + '</h3><div class="tabla-scroll">' +
      '<table class="tabla-datos"><tr><th>Nombre de la cuenta</th><th>Grupo</th><th>Acciones</th></tr>' + cuerpo +
      '</table></div><div class="barra-acciones"><button class="btn sec" data-agregar="' + estado + '">Agregar cuenta</button></div></div>';
  },

  html(raw) {
    const opciones = Plantillas.LISTA.map(p => '<option value="' + p.id + '">' + esc(p.nombre) + ' (' + esc(p.descripcion) + ')</option>').join('');
    return '<div class="barra-acciones">' +
        '<label class="campo">Plantilla de cuentas<select id="cf-plantilla">' + opciones + '</select></label>' +
        '<button class="btn peligro" id="cf-aplicar">Aplicar plantilla</button>' +
      '</div>' +
      '<div class="aviso">Las cuentas base son las que usan las fórmulas: puedes cambiar su nombre y su orden. ' +
        'Las cuentas que agregues se clasifican por el grupo que elijas. Los montos se escriben en Estados financieros.</div>' +
      '<div id="cf-avisos" style="margin-top:14px">' + Configuracion.avisosHtml(raw) + '</div>' +
      Configuracion.bloque('er', 'Estado de Resultados', raw) +
      Configuracion.bloque('bg', 'Balance General', raw);
  },

  render(el) {
    const raiz = document.createElement('div');
    const pintar = () => { raiz.innerHTML = Configuracion.html(Estados.leerCrudo()); };

    // Renombrar: se guarda al escribir, sin volver a dibujar (para no perder el cursor)
    raiz.addEventListener('input', e => {
      const t = e.target;
      if (!t.dataset.nombreDe) return;
      const raw = Estados.leerCrudo(), f = Configuracion.buscar(raw, t.dataset.nombreDe);
      if (!f) return;
      f.a.nombre = t.value;
      Estados.guardarCrudo(raw);
      raiz.querySelector('#cf-avisos').innerHTML = Configuracion.avisosHtml(raw);
    });

    // Cambiar el grupo de una cuenta libre
    raiz.addEventListener('change', e => {
      const t = e.target;
      if (!t.dataset.grupoDe) return;
      const raw = Estados.leerCrudo(), f = Configuracion.buscar(raw, t.dataset.grupoDe);
      if (!f) return;
      f.a.grupo = t.value;
      Estados.guardarCrudo(raw);
      pintar();
    });

    raiz.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const raw = Estados.leerCrudo();
      if (b.id === 'cf-aplicar') {
        const sel = raiz.querySelector('#cf-plantilla');
        if (!confirm('Se reemplazarán TODAS las cuentas por la plantilla "' + sel.selectedOptions[0].textContent.split(' (')[0] +
          '" (también las que agregaste). Los montos de las cuentas base se conservan. ¿Continuar?')) return;
        Configuracion.aplicarPlantilla(raw, sel.value);
      } else if (b.dataset.agregar) {
        Configuracion.agregar(raw, b.dataset.agregar);
      } else if (b.dataset.mover) {
        const f = Configuracion.buscar(raw, b.dataset.mover);
        if (!f) return;
        Configuracion.mover(raw, f.estado, b.dataset.mover, Number(b.dataset.dir));
      } else if (b.dataset.quitar) {
        const f = Configuracion.buscar(raw, b.dataset.quitar);
        if (!f || !confirm('¿Quitar la cuenta "' + f.a.nombre + '"? Se borran sus montos en todos los períodos.')) return;
        Configuracion.quitar(raw, f.estado, b.dataset.quitar);
      } else {
        return;
      }
      Estados.guardarCrudo(raw);
      pintar();
    });

    el.innerHTML = '';
    el.appendChild(raiz);
    pintar();
  }
};

Modulos.configuracion = {
  titulo: 'Configurar cuentas',
  subtitulo: 'Plantillas, cuentas personalizadas y orden de los Estados financieros',
  render(el) { Configuracion.render(el); }
};