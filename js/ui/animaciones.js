// Animaciones sobrias: destello en celdas calculadas, conteo y entrada de los indicadores del panel
// y mini-gráficas (sparklines). Respetan prefers-reduced-motion.
const Animar = {
  reducido: Tema.reducido,
  ultimoRender: 0,

  // Parpadeo suave de una celda cuya cifra cambió
  destello(td) {
    td.classList.remove('destello');
    void td.offsetWidth;
    td.classList.add('destello');
    setTimeout(() => td.classList.remove('destello'), 700);
  },

  // Cuenta de 0 al valor, conservando prefijo y sufijo ("C$ 21.50 M", "46.76 %")
  contar(el) {
    const original = el.textContent, m = original.match(/-?\d[\d,]*(\.\d+)?/);
    if (!m) return;
    const meta = parseFloat(m[0].replace(/,/g, '')), dec = m[1] ? m[1].length - 1 : 0;
    const pre = original.slice(0, m.index), pos = original.slice(m.index + m[0].length);
    const t0 = performance.now(), dur = 600;
    const paso = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = k >= 1 ? original
        : pre + (meta * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + pos;
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  },

  // Series por período de cada tarjeta del panel (mismo orden que las tarjetas)
  series(D) {
    const vac = D.vacio || D.r.map(() => false), ventas = i => Number(D.d.er.ventas[i]) || 0;
    const per = f => D.ids.map((_, i) => (vac[i] ? null : f(i)));
    const prom = (k, i) => (i === 0 ? null : (D.r[i - 1][k] + D.r[i][k]) / 2);
    return [
      per(ventas),
      per(i => D.r[i].utilidadNeta),
      per(i => (D.r[i].pc ? D.r[i].ac / D.r[i].pc : null)),
      per(i => (D.r[i].totalActivo ? D.r[i].totalPasivo / D.r[i].totalActivo : null)),
      per(i => (ventas(i) ? D.r[i].utilidadNeta / ventas(i) : null)),
      per(i => (prom('patrimonio', i) ? D.r[i].utilidadNeta / prom('patrimonio', i) : null))
    ];
  },

  spark(serie) {
    const v = serie.filter(x => x !== null && isFinite(x));
    if (v.length < 2) return '';
    const min = Math.min.apply(null, v), max = Math.max.apply(null, v), rango = max - min || 1;
    const n = serie.length, W = 100, H = 24;
    let d = '', lapiz = false;
    serie.forEach((x, i) => {
      if (x === null || !isFinite(x)) { lapiz = false; return; }
      const px = n === 1 ? 0 : (i / (n - 1)) * W, py = H - 2 - ((x - min) / rango) * (H - 4);
      d += (lapiz ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
      lapiz = true;
    });
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  },

  // Efectos del panel principal (se llama una vez por cada dibujo del dashboard)
  panel(dash) {
    const kpis = dash.querySelectorAll('.dash-kpi');
    try {
      const D = Dashboard.datos();
      if (D) {
        const s = Animar.series(D);
        kpis.forEach((k, i) => { if (s[i]) k.insertAdjacentHTML('beforeend', Animar.spark(s[i])); });
      }
    } catch (e) { /* si falla, el panel se ve igual sin mini-gráficas */ }
    if (Animar.reducido) return;
    const clave = 'gfo_anim_' + ((Empresas.activa && Empresas.activa.id) || 'x');
    let primera = false;
    try { primera = !sessionStorage.getItem(clave); sessionStorage.setItem(clave, '1'); } catch (e) {}
    if (primera) dash.classList.add('dash-entrada');
    kpis.forEach(k => { const v = k.querySelector('.valor'); if (v) Animar.contar(v); });
  }
};

// Observa el área de trabajo: detecta el panel recién dibujado y las celdas que cambian de valor
(function () {
  const vista = document.getElementById('vista');
  if (!vista || typeof MutationObserver === 'undefined') return;
  new MutationObserver(registros => {
    let nuevoRender = false;
    registros.forEach(r => { if (r.target === vista) nuevoRender = true; });
    if (nuevoRender) {
      Animar.ultimoRender = Date.now();
      const dash = vista.querySelector('.dash');
      if (dash && !dash.dataset.anim) { dash.dataset.anim = '1'; Animar.panel(dash); }
      return;
    }
    // Para no destellar todo al abrir un módulo, se ignora el medio segundo posterior al dibujo
    if (Animar.reducido || Date.now() - Animar.ultimoRender < 500) return;
    registros.forEach(r => {
      const t = r.target;
      if (t.nodeType !== 1 || !/^(TD|TH)$/.test(t.tagName) || !r.removedNodes.length) return;
      if (r.removedNodes[0].textContent !== t.textContent) Animar.destello(t);
    });
  }).observe(vista, { childList: true, subtree: true });
})();