// Fechas en formato DD/MM/AAAA y generación de períodos
const Fecha = {
  pad(n) { return String(n).padStart(2, '0'); },
  // '2026-01-31' -> '31/01/2026'
  aTexto(iso) {
    if (!iso) return '';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '';
  },
  // '31/01/2026' -> '2026-01-31' (devuelve null si la fecha no es válida)
  aIso(texto) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(texto).trim());
    if (!m) return null;
    const d = +m[1], mo = +m[2], y = +m[3];
    const f = new Date(Date.UTC(y, mo - 1, d));
    if (f.getUTCFullYear() !== y || f.getUTCMonth() !== mo - 1 || f.getUTCDate() !== d || y < 1990 || y > 2100) return null;
    return y + '-' + Fecha.pad(mo) + '-' + Fecha.pad(d);
  },
  hoyIso() {
    const f = new Date();
    return f.getFullYear() + '-' + Fecha.pad(f.getMonth() + 1) + '-' + Fecha.pad(f.getDate());
  },
  sumarMeses(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const ultimo = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
    const f = new Date(Date.UTC(y, m - 1 + n, Math.min(d, ultimo)));
    return f.getUTCFullYear() + '-' + Fecha.pad(f.getUTCMonth() + 1) + '-' + Fecha.pad(f.getUTCDate());
  },
  sumarDias(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const f = new Date(Date.UTC(y, m - 1, d + n));
    return f.getUTCFullYear() + '-' + Fecha.pad(f.getUTCMonth() + 1) + '-' + Fecha.pad(f.getUTCDate());
  }
};

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Periodos = {
  PASOS: { anual: 12, semestral: 6, trimestral: 3, mensual: 1 },
  NOMBRES: { anual: 'Anual', semestral: 'Semestral', trimestral: 'Trimestral', mensual: 'Mensual' },

  etiqueta(tipo, ini, fin) {
    const [y, m] = ini.split('-').map(Number);
      if (tipo === 'anual') {
      const yf = Number(fin.slice(0, 4));
      return yf === y ? String(y) : y + '/' + String(yf).slice(2);
    }
    if (tipo === 'semestral') return 'S' + (Math.floor((m - 1) / 6) + 1) + ' ' + y;
    if (tipo === 'trimestral') return 'T' + (Math.floor((m - 1) / 3) + 1) + ' ' + y;
    return MESES_CORTOS[m - 1] + ' ' + y;
  },

  // Genera "cantidad" períodos seguidos desde la fecha de inicio (ISO)
  generar(tipo, cantidad, inicioIso, ordenInicial = 1) {
    const paso = Periodos.PASOS[tipo], lista = [];
    for (let i = 0; i < cantidad; i++) {
      const ini = Fecha.sumarMeses(inicioIso, i * paso);
      const fin = Fecha.sumarDias(Fecha.sumarMeses(inicioIso, (i + 1) * paso), -1);
      lista.push({ orden: ordenInicial + i, tipo, etiqueta: Periodos.etiqueta(tipo, ini, fin), fecha_inicio: ini, fecha_fin: fin });
    }
    return lista;
  }
};