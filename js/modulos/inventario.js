// Módulo 9: Control de inventario básico
const Inventario = {
  graf: null,

  ejemplo() {
    return [
      { n: 'Arroz', ini: 100, ent: 50, sal: 120, costo: 25, min: 40 },
      { n: 'Frijoles', ini: 80, ent: 20, sal: 30, costo: 30, min: 40 },
      { n: 'Aceite', ini: 60, ent: 0, sal: 35, costo: 55, min: 30 },
      { n: 'Azúcar', ini: 90, ent: 40, sal: 50, costo: 20, min: 35 }
    ];
  },
  obtener() { return Datos.leer('inventario', Inventario.ejemplo()); },

  // Aquí se hacen los cálculos: Existencia final = inicial + entradas - salidas; Valor = existencia final x costo unitario
  calcular(p) {
    const final = p.ini + p.ent - p.sal;
    const valor = final * p.costo;
    const estado = final < 0 ? 'Error' : final <= p.min ? 'Reponer' : 'Normal';
    return { final, valor, estado };
  },

  fila(p) {
    const inp = (k, v, t) => '<td><input type="text" ' + (t === 'n' ? 'data-validar="nombre"' : 'inputmode="decimal" data-validar="numero"') + ' data-k="' + k + '" value="' + v + '"></td>';
    return '<tr class="prod">' + inp('n', p.n, 'n') + inp('ini', p.ini) + inp('ent', p.ent) + inp('sal', p.sal) + inp('costo', p.costo) + inp('min', p.min) +
      '<td class="r-final"></td><td class="r-valor"></td><td class="r-estado"></td><td><button class="btn sec quitar">Quitar</button></td></tr>';
  },

  render(el) {
    const lista = Inventario.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">Existencia final = Existencia inicial + Entradas − Salidas. Valor del inventario = Existencia final × Costo unitario. Alerta "Reponer" cuando la existencia final es igual o menor al stock mínimo.</div>' +
      '<div class="barra-acciones" style="margin-top:14px"><button class="btn" id="in-add">Agregar producto</button>' +
        '<button class="btn sec" id="in-ejemplo">Cargar ejemplo</button><button class="btn sec peligro" id="in-limpiar">Limpiar datos</button></div>' +
      '<div class="tarjeta"><div class="tabla-scroll"><table class="tabla-datos" id="in-tabla"><tr><th>Producto</th><th>Existencia inicial</th><th>Entradas</th><th>Salidas</th>' +
        '<th>Costo unitario (C$)</th><th>Stock mínimo</th><th>Existencia final</th><th>Valor (C$)</th><th>Estado</th><th></th></tr>' +
        lista.map(Inventario.fila).join('') + '</table></div></div>' +
      '<div class="rejilla" id="in-tarjetas" style="margin-top:14px"></div>' +
      '<div class="aviso" id="in-alerta" style="margin-top:14px"></div>' +
      '<div class="tarjeta" style="margin-top:14px"><h3>Existencia final contra stock mínimo</h3><div class="grafico"><canvas id="in-grafico"></canvas></div></div>';
    el.innerHTML = '';
    el.appendChild(raiz);
    const q = id => raiz.querySelector(id);
    const leer = () => [...raiz.querySelectorAll('tr.prod')].map(t => {
      const v = k => t.querySelector('[data-k="' + k + '"]').value;
      return { n: v('n'), ini: Fmt.aNum(v('ini')), ent: Fmt.aNum(v('ent')), sal: Fmt.aNum(v('sal')), costo: Fmt.aNum(v('costo')), min: Fmt.aNum(v('min')) };
    });
    const refrescar = () => {
      const x = leer(); Datos.guardar('inventario', x);
      let total = 0, reponer = [], errores = [];
      raiz.querySelectorAll('tr.prod').forEach((t, i) => {
        const c = Inventario.calcular(x[i]); total += c.valor;
        t.querySelector('.r-final').textContent = Fmt.num(c.final, 0);
        t.querySelector('.r-valor').textContent = Fmt.moneda(c.valor);
        const e = t.querySelector('.r-estado');
        e.textContent = c.estado === 'Error' ? 'Salidas mayores a lo disponible' : c.estado === 'Reponer' ? 'Reponer' : 'Normal';
        e.style.color = c.estado === 'Normal' ? 'var(--ok)' : c.estado === 'Reponer' ? 'var(--alerta)' : 'var(--malo)';
        e.style.fontWeight = '600';
        if (c.estado === 'Reponer') reponer.push(x[i].n);
        if (c.estado === 'Error') errores.push(x[i].n);
      });
      const T = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
      q('#in-tarjetas').innerHTML = T('Valor total del inventario', Fmt.moneda(total), 'Suma de existencia final × costo') +
        T('Productos', x.length, 'En el control') + T('Por reponer', reponer.length, 'Existencia ≤ stock mínimo');
      q('#in-alerta').textContent = errores.length ? 'Revisa los datos de: ' + errores.join(', ') + ' (las salidas son mayores que la existencia disponible).'
        : reponer.length ? 'Alerta de reposición: ' + reponer.join(', ') + '.' : 'Todos los productos están por encima de su stock mínimo.';
      if (Inventario.graf) { try { Inventario.graf.destroy(); } catch (e) {} Inventario.graf = null; }
      q('#in-grafico').style.display = x.length ? '' : 'none';
      if (!x.length) q('#in-alerta').textContent = 'Todavía no hay productos. Agrega uno o carga el ejemplo.';
      if (typeof Chart !== 'undefined' && x.length) {
        Inventario.graf = new Chart(q('#in-grafico'), { type: 'bar',
          data: { labels: x.map(p => p.n), datasets: [
            { label: 'Existencia final', data: x.map(p => p.ini + p.ent - p.sal), backgroundColor: '#1f3a5f' },
            { label: 'Stock mínimo', data: x.map(p => p.min), backgroundColor: '#c08a2e' }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
      }
    };
    raiz.addEventListener('input', refrescar);
    raiz.addEventListener('click', e => { if (e.target.classList.contains('quitar')) { e.target.closest('tr').remove(); refrescar(); } });
    q('#in-add').addEventListener('click', () => {
      q('#in-tabla').insertAdjacentHTML('beforeend', Inventario.fila({ n: 'Nuevo producto', ini: 0, ent: 0, sal: 0, costo: 0, min: 0 }));
      Validar.activar(raiz); refrescar();
    });
    q('#in-ejemplo').addEventListener('click', () => { Datos.guardar('inventario', Inventario.ejemplo()); Inventario.render(el); Validar.activar(el); });
    q('#in-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar todos los productos?')) { Datos.guardar('inventario', []); Inventario.render(el); Validar.activar(el); }
    });
    refrescar();
  }
};

Modulos.inventario = {
  titulo: 'Control de inventario',
  subtitulo: 'Existencias, valor del inventario, stock mínimo y alertas de reposición',
  render(el) { Inventario.render(el); }
};