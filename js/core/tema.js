// Tema: toma los colores del CSS para los gráficos y configura la animación de Chart.js
const Tema = {
  reducido: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),

  leer(variable, defecto) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : defecto;
  },

  // Mezcla un color con otro: t = 0 deja el primero, t = 1 deja el segundo
  mezclar(hex, con, t) {
    const rgb = h => {
      h = h.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    };
    const a = rgb(hex), b = rgb(con);
    return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * t).toString(16).padStart(2, '0')).join('');
  },

  paleta() {
    const p = Tema.leer('--primario', '#1f3a5f');
    return {
      marino: Tema.leer('--primario-2', p),
      acento: p,
      claro: Tema.mezclar(p, '#ffffff', 0.6),
      ok: Tema.leer('--ok', '#3d8b6a'),
      malo: Tema.leer('--malo', '#b25555')
    };
  },

  chart() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = Tema.leer('--suave', '#6b7788');
    Chart.defaults.animation = Tema.reducido ? false : {
      duration: 700,
      easing: 'easeOutQuart',
      delay: c => (c.type === 'data' && c.mode === 'default') ? c.dataIndex * 45 : 0
    };
  }
};
Tema.chart();