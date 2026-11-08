// Aviso emergente y guarda contra nombres de período repetidos al guardar
const Aviso = {
  mostrar(texto, tipo) {
    let c = document.getElementById('avisos');
    if (!c) {
      c = document.createElement('div');
      c.id = 'avisos';
      c.setAttribute('role', 'status');
      c.setAttribute('aria-live', 'polite');
      document.body.appendChild(c);
    }
    const a = document.createElement('div');
    a.className = 'aviso-flotante ' + (tipo === 'error' ? 'mal' : 'ok');
    a.textContent = texto;
    c.appendChild(a);
    setTimeout(() => { a.classList.add('sale'); setTimeout(() => a.remove(), 300); }, tipo === 'error' ? 4500 : 2500);
  }
};

// Se ejecuta en la fase de captura: corta el guardado antes de que lo reciba el botón
document.addEventListener('click', ev => {
  const b = ev.target.closest ? ev.target.closest('#pe-guardar') : null;
  if (!b) return;
  const vistos = new Set();
  const campos = document.querySelectorAll('.p-et');
  for (const inp of campos) {
    const k = inp.value.trim().toLowerCase();
    if (vistos.has(k)) {
      ev.stopPropagation();
      ev.preventDefault();
      Aviso.mostrar('Hay dos períodos con el nombre "' + inp.value.trim() + '". Cada período debe tener un nombre distinto.', 'error');
      return;
    }
    vistos.add(k);
  }
}, true);