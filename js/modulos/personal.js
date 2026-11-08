// Módulo 8: Presupuesto personal
const Personal = {
  graf: null,
  CATS: ['Vivienda', 'Alimentación', 'Transporte', 'Educación', 'Salud', 'Servicios', 'Entretenimiento', 'Otros'],

  ejemplo() {
    return {
      ingresos: [{ n: 'Salario', m: 15000 }, { n: 'Trabajo extra', m: 3000 }],
      gastos: [{ n: 'Alquiler', c: 'Vivienda', m: 5000 }, { n: 'Comida', c: 'Alimentación', m: 4500 },
               { n: 'Pasajes', c: 'Transporte', m: 1500 }, { n: 'Internet y celular', c: 'Servicios', m: 1200 },
               { n: 'Salidas', c: 'Entretenimiento', m: 1000 }],
      meta: 20
    };
  },
  obtener() { return Datos.leer('personal', { ingresos: [], gastos: [], meta: 20 }); },

  // Aquí se hacen los cálculos de este módulo
  calcular(x) {
    const totalIng = x.ingresos.reduce((s, i) => s + i.m, 0);
    const totalGas = x.gastos.reduce((s, g) => s + g.m, 0);
    const saldo = totalIng - totalGas;                              // saldo disponible
    const capacidad = totalIng ? saldo / totalIng : NaN;            // capacidad de ahorro (% de ingresos)
    const metaMonto = totalIng * x.meta / 100;
    const porCat = Personal.CATS.map(c => ({ c, m: x.gastos.filter(g => g.c === c).reduce((s, g) => s + g.m, 0) })).filter(z => z.m > 0);
    return { totalIng, totalGas, saldo, capacidad, metaMonto, porCat };
  },

  filaIng(i) {
    return '<tr class="ing"><td><input type="text" data-validar="nombre" data-k="n" value="' + i.n + '"></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="' + i.m + '"></td>' +
      '<td><button class="btn sec quitar">Quitar</button></td></tr>';
  },
  filaGas(g) {
    return '<tr class="gas"><td><input type="text" data-validar="nombre" data-k="n" value="' + g.n + '"></td>' +
      '<td><select data-k="c">' + Personal.CATS.map(c => '<option' + (c === g.c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></td>' +
      '<td><input type="text" inputmode="decimal" data-validar="numero" data-k="m" value="' + g.m + '"></td>' +
      '<td><button class="btn sec quitar">Quitar</button></td></tr>';
  },

  render(el) {
    const x0 = Personal.obtener();
    const raiz = document.createElement('div');
    raiz.innerHTML =
      '<div class="aviso">Saldo disponible = Total de ingresos − Total de gastos. Capacidad de ahorro = Saldo disponible ÷ Total de ingresos.</div>' +
      '<div class="dos-col" style="margin-top:14px">' +
        '<div class="tarjeta"><h3>Ingresos del mes (C$)</h3><table class="tabla-datos" id="pe-ing"><tr><th>Concepto</th><th>Monto</th><th></th></tr>' +
          x0.ingresos.map(Personal.filaIng).join('') + '</table><div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-ing">Agregar ingreso</button></div></div>' +
        '<div class="tarjeta"><h3>Gastos del mes (C$)</h3><table class="tabla-datos" id="pe-gas"><tr><th>Concepto</th><th>Categoría</th><th>Monto</th><th></th></tr>' +
          x0.gastos.map(Personal.filaGas).join('') + '</table><div class="barra-acciones" style="margin-top:10px"><button class="btn" id="pe-add-gas">Agregar gasto</button></div></div>' +
      '</div>' +
      '<div class="barra-acciones" style="margin-top:14px">' +
        '<label class="campo corto" style="min-width:200px">Meta de ahorro (% de ingresos)<input type="text" inputmode="decimal" data-validar="numero" id="pe-meta" value="' + x0.meta + '"></label>' +
        '<button class="btn sec" id="pe-ejemplo">Cargar ejemplo</button><button class="btn sec peligro" id="pe-limpiar">Limpiar datos</button></div>' +
      '<div class="rejilla" id="pe-tarjetas"></div>' +
      '<div class="aviso" id="pe-interp" style="margin-top:14px"></div>' +
      '<div class="dos-col" style="margin-top:14px">' +
        '<div class="tarjeta"><h3>Gastos por categoría</h3><div id="pe-cats"></div></div>' +
        '<div class="tarjeta"><h3>Distribución de los gastos</h3><div class="grafico"><canvas id="pe-grafico"></canvas></div></div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(raiz);

    const q = id => raiz.querySelector(id);
    const leer = () => {
      const val = (tr, k) => tr.querySelector('[data-k="' + k + '"]').value;
      return {
        ingresos: [...raiz.querySelectorAll('tr.ing')].map(t => ({ n: val(t, 'n'), m: Fmt.aNum(val(t, 'm')) })),
        gastos: [...raiz.querySelectorAll('tr.gas')].map(t => ({ n: val(t, 'n'), c: val(t, 'c'), m: Fmt.aNum(val(t, 'm')) })),
        meta: Fmt.aNum(q('#pe-meta').value)
      };
    };
    const refrescar = () => {
      const x = leer(); Datos.guardar('personal', x);
      const c = Personal.calcular(x);
      const T = (t, v, n) => '<div class="tarjeta"><h3>' + t + '</h3><div class="valor">' + v + '</div><div class="nota">' + n + '</div></div>';
      q('#pe-tarjetas').innerHTML = T('Total de ingresos', Fmt.moneda(c.totalIng), 'Suma de ingresos') + T('Total de gastos', Fmt.moneda(c.totalGas), 'Suma de gastos') +
        T('Saldo disponible', Fmt.moneda(c.saldo), 'Ingresos − Gastos') + T('Capacidad de ahorro', Fmt.pct(c.capacidad), 'Saldo ÷ Ingresos');
      q('#pe-interp').textContent = c.saldo < 0
        ? 'Estás gastando ' + Fmt.moneda(-c.saldo) + ' más de lo que ganas; hay que recortar gastos o aumentar ingresos.'
        : (c.saldo >= c.metaMonto ? 'Cumples la meta de ahorro: la meta es ' + Fmt.moneda(c.metaMonto) + ' y te quedan ' + Fmt.moneda(c.saldo) + '.'
          : 'No llegas a la meta de ahorro de ' + Fmt.moneda(c.metaMonto) + ': te quedan ' + Fmt.moneda(c.saldo) + ' (faltan ' + Fmt.moneda(c.metaMonto - c.saldo) + ').');
      q('#pe-cats').innerHTML = '<table class="tabla-datos"><tr><th>Categoría</th><th>Monto</th><th>% de gastos</th></tr>' +
        c.porCat.map(z => '<tr><td>' + z.c + '</td><td>' + Fmt.moneda(z.m) + '</td><td>' + Fmt.pct(c.totalGas ? z.m / c.totalGas : NaN) + '</td></tr>').join('') +
        '<tr class="total"><td>Total</td><td>' + Fmt.moneda(c.totalGas) + '</td><td>' + (c.totalGas ? '100.00 %' : '—') + '</td></tr></table>';
      if (Personal.graf) { try { Personal.graf.destroy(); } catch (e) {} Personal.graf = null; }
      if (typeof Chart !== 'undefined') {
        Personal.graf = new Chart(q('#pe-grafico'), { type: 'doughnut',
          data: { labels: c.porCat.map(z => z.c), datasets: [{ data: c.porCat.map(z => z.m),
            backgroundColor: ['#1f3a5f', '#3f6fa3', '#9db4d0', '#3d8b6a', '#c08a2e', '#b25555', '#6b7788', '#c9d5e3'] }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
      }
    };
    raiz.addEventListener('input', refrescar);
    raiz.addEventListener('change', refrescar);
    raiz.addEventListener('click', e => {
      if (e.target.classList.contains('quitar')) { e.target.closest('tr').remove(); refrescar(); }
    });
    q('#pe-add-ing').addEventListener('click', () => { q('#pe-ing').insertAdjacentHTML('beforeend', Personal.filaIng({ n: 'Nuevo ingreso', m: 0 })); Validar.activar(raiz); refrescar(); });
    q('#pe-add-gas').addEventListener('click', () => { q('#pe-gas').insertAdjacentHTML('beforeend', Personal.filaGas({ n: 'Nuevo gasto', c: 'Otros', m: 0 })); Validar.activar(raiz); refrescar(); });
    q('#pe-ejemplo').addEventListener('click', () => { Datos.guardar('personal', Personal.ejemplo()); Personal.render(el); Validar.activar(el); });
    q('#pe-limpiar').addEventListener('click', () => {
      if (confirm('¿Borrar los datos del presupuesto personal?')) { Datos.guardar('personal', { ingresos: [], gastos: [], meta: 0 }); Personal.render(el); Validar.activar(el); }
    });
    refrescar();
  }
};

Modulos.personal = {
  titulo: 'Presupuesto personal',
  subtitulo: 'Ingresos, gastos por categoría, saldo disponible y capacidad de ahorro',
  render(el) { Personal.render(el); }
};