const Fmt = {
  num(n, d = 2) {
    if (n === null || n === undefined || n === '') return '—';
    let x = Number(n);
    if (!isFinite(x)) return '—';
    // Evita "-0.00": un valor tan chico que se redondea a cero se muestra como cero positivo
    if (Math.abs(x) < 0.5 * Math.pow(10, -d)) x = 0;
    return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  },
  moneda(n) { return Fmt.num(n, 2) === '—' ? '—' : 'C$ ' + Fmt.num(n, 2); },
  pct(n, d = 2) { return Fmt.num(n, 2) === '—' ? '—' : Fmt.num(n * 100, d) + ' %'; },
  veces(n, d = 2) { return Fmt.num(n, d) === '—' ? '—' : Fmt.num(n, d) + ' veces'; },
  dias(n, d = 2) { return Fmt.num(n, d) === '—' ? '—' : Fmt.num(n, d) + ' días'; },
  // Convierte el texto de un campo (puede traer comas de miles) a un número limpio.
  aNum(v) {
    const x = Number(String(v).replace(/,/g, '').trim());
    return isFinite(x) ? x : 0;
  }
};