const Validar = {
  soloTexto(v) { return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(v.trim()); },
  esNumero(v) { return v !== '' && !isNaN(Number(v)); },
  // Uso: data-validar="texto" (solo letras), "nombre" (letras, punto y coma), "numero"
  activar(raiz) {
    raiz.querySelectorAll('input[data-validar]').forEach(campo => {
      campo.addEventListener('input', () => {
        const modo = campo.dataset.validar;
        if (modo === 'texto') {
          campo.value = campo.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
        } else if (modo === 'nombre') {
          campo.value = campo.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.,]/g, '');
        } else {
          Validar.formatearMiles(campo);
        }
        campo.classList.toggle('invalido', campo.value === '');
      });
    });
  },

  // Mientras se escribe un número, separa los miles con comas (9000 -> 9,000) y mantiene
  // el cursor en el mismo lugar. El punto decimal y el signo negativo no se tocan.
  formatearMiles(campo) {
    const pos = campo.selectionStart;
    const digitosAntes = (campo.value.slice(0, pos).match(/[0-9]/g) || []).length;

    let v = campo.value.replace(/[^0-9.\-]/g, '');
    const neg = (v.match(/-/g) || []).length % 2 === 1;
    v = v.replace(/-/g, '');
    let partes = v.split('.');
    if (partes.length > 2) partes = [partes[0], partes.slice(1).join('')];
    let ent = partes[0].replace(/^0+(?=\d)/, '');
    if (ent === '' && partes[0] !== '') ent = '0';
    const dec = partes.length > 1 ? '.' + partes[1] : '';
    const entConComas = ent === '' ? '' : Number(ent).toLocaleString('en-US');

    campo.value = (neg && ent === '' && dec === '') ? '-' : (neg ? '-' : '') + entConComas + dec;

    let i = 0, vistos = 0;
    while (i < campo.value.length && vistos < digitosAntes) {
      if (/[0-9]/.test(campo.value[i])) vistos++;
      i++;
    }
    campo.setSelectionRange(i, i);
  }
};