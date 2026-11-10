// Validación de formularios con mensajes claros al usuario
const Validar = {
  soloTexto(v) { return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(v.trim()); },
  esNumero(v)  { return v !== '' && !isNaN(Number(v)); },

  /* Mensajes de error por tipo de campo */
  _msg: {
    texto:  'Solo se permiten letras.',
    nombre: 'Solo letras, puntos y comas.',
    numero: 'Escribe un número válido (puedes usar decimales).'
  },

  /* Muestra o limpia el mensaje de error debajo del campo */
  _error(campo, msg) {
    let tip = campo._gfo_tip;
    if (!tip) {
      tip = document.createElement('span');
      tip.className = 'campo-error';
      tip.setAttribute('role', 'alert');
      tip.setAttribute('aria-live', 'polite');
      campo.parentNode.insertBefore(tip, campo.nextSibling);
      campo._gfo_tip = tip;
    }
    tip.textContent = msg || '';
    tip.style.display = msg ? 'block' : 'none';
    campo.classList.toggle('invalido', !!msg);
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  },

  /* Valida un campo individualmente; devuelve true si es válido */
  _validarCampo(campo) {
    const modo = campo.dataset.validar;
    const val  = campo.value;
    if (val === '') {
      Validar._error(campo, 'Este campo es obligatorio.');
      return false;
    }
    if (modo === 'texto' && !Validar.soloTexto(val)) {
      Validar._error(campo, Validar._msg.texto);
      return false;
    }
    if (modo === 'nombre' && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.,0-9\-]+$/.test(val.trim())) {
      Validar._error(campo, Validar._msg.nombre);
      return false;
    }
    if (modo === 'numero' && !Validar.esNumero(val.replace(/,/g, ''))) {
      Validar._error(campo, Validar._msg.numero);
      return false;
    }
    Validar._error(campo, '');
    return true;
  },

  /* Activa listeners en todos los campos con data-validar dentro de raiz */
  activar(raiz) {
    raiz.querySelectorAll('input[data-validar]').forEach(campo => {
      /* Evitar duplicar listeners */
      if (campo._gfo_validar) return;
      campo._gfo_validar = true;

      campo.addEventListener('input', () => {
        const modo = campo.dataset.validar;
        if (modo === 'texto') {
          campo.value = campo.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
        } else if (modo === 'nombre') {
          campo.value = campo.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.,0-9\-]/g, '');
        } else {
          Validar.formatearMiles(campo);
        }
        /* Solo muestra el error una vez que el usuario empezó a escribir */
        if (campo._gfo_tocado) Validar._validarCampo(campo);
      });

      campo.addEventListener('blur', () => {
        campo._gfo_tocado = true;
        Validar._validarCampo(campo);
      });

      campo.addEventListener('focus', () => {
        /* Al enfocar limpia el error visual inmediato para no molestar */
        if (campo._gfo_tip) campo._gfo_tip.style.display = 'none';
      });
    });
  },

  /* Formatea miles mientras se escribe (9000 → 9,000) manteniendo el cursor */
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