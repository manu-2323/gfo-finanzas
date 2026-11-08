// Pantalla de inicio de sesión y registro
function esc(t) {
  return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const PantallaAuth = {
  modo: 'entrar',

  campoClave(id, etiqueta) {
    return '<label>' + etiqueta + '<span class="auth-clave">' +
      '<input type="password" id="' + id + '" autocomplete="' + (id === 'en-clave' ? 'current-password' : 'new-password') + '" required>' +
      '<button type="button" class="auth-ver" data-ver="' + id + '" aria-label="Mostrar u ocultar la contraseña">' +
        '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '</button></span></label>';
  },

  mostrar(alEntrar) {
    document.querySelector('.app').style.display = 'none';
    let cont = document.getElementById('auth');
    if (!cont) { cont = document.createElement('div'); cont.id = 'auth'; document.body.appendChild(cont); }
    cont.className = 'auth';
    const aviso = sb ? '' : '<div class="auth-error">Falta configurar Supabase: abre js/core/config.js, pega tu URL y tu clave pública, y verifica que librerias/supabase.js exista.</div>';
    const esEntrar = PantallaAuth.modo === 'entrar';
    cont.innerHTML =
      '<div class="auth-marco"><div class="auth-logo"><span class="marca-logo">GFO</span><div><strong>Análisis y Planeación Financiera</strong><small>Gestión financiera para personas y empresas</small></div></div>' +
      aviso +
      '<div class="auth-caja">' +
      (esEntrar
        ? '<form id="form-entrar"><h2>Ingresa a tu cuenta</h2><p>Escribe tu correo y tu contraseña.</p>' +
            '<label>Correo electrónico<input type="email" id="en-correo" autocomplete="email" required></label>' +
            PantallaAuth.campoClave('en-clave', 'Contraseña') +
            '<div class="auth-error" id="en-error"></div>' +
            '<button class="btn auth-ancho" type="submit">Ingresar</button>' +
            '<p class="auth-cambiar">¿Aún no tienes cuenta? <button type="button" class="auth-enlace" id="ir-registro">Crea una cuenta gratis</button></p>' +
          '</form>'
        : '<form id="form-registro"><h2>Crea tu cuenta</h2><p>Es gratis y toma un minuto.</p>' +
            '<label>Nombre<input type="text" id="rg-nombre" data-validar="nombre" autocomplete="name" required></label>' +
            '<label>Correo electrónico<input type="email" id="rg-correo" autocomplete="email" required></label>' +
            PantallaAuth.campoClave('rg-clave', 'Contraseña (mínimo 8 caracteres)') +
            PantallaAuth.campoClave('rg-clave2', 'Confirmar contraseña') +
            '<div class="auth-error" id="rg-error"></div>' +
            '<button class="btn auth-ancho" type="submit">Crear cuenta</button>' +
            '<p class="auth-cambiar">¿Ya tienes cuenta? <button type="button" class="auth-enlace" id="ir-entrar">Ingresa aquí</button></p>' +
          '</form>') +
      '</div></div>';
    Validar.activar(cont);

    const q = s => cont.querySelector(s);
    const ocupado = (form, si) => form.querySelectorAll('button,input').forEach(x => x.disabled = si);

    cont.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => {
      const campo = q('#' + b.dataset.ver);
      campo.type = campo.type === 'password' ? 'text' : 'password';
      b.classList.toggle('mostrando', campo.type === 'text');
    }));

    if (esEntrar) {
      q('#ir-registro').addEventListener('click', () => { PantallaAuth.modo = 'registro'; PantallaAuth.mostrar(alEntrar); });
      q('#form-entrar').addEventListener('submit', async ev => {
        ev.preventDefault();
        const err = q('#en-error'); err.textContent = '';
        if (!sb) { err.textContent = 'Supabase no está configurado.'; return; }
        ocupado(ev.target, true);
        try { await Auth.entrar(q('#en-correo').value.trim(), q('#en-clave').value); alEntrar(); }
        catch (e) { err.textContent = e.message; ocupado(ev.target, false); }
      });
    } else {
      q('#ir-entrar').addEventListener('click', () => { PantallaAuth.modo = 'entrar'; PantallaAuth.mostrar(alEntrar); });
      q('#form-registro').addEventListener('submit', async ev => {
        ev.preventDefault();
        const err = q('#rg-error'); err.textContent = '';
        const nombre = q('#rg-nombre').value.trim(), clave = q('#rg-clave').value;
        if (!sb) { err.textContent = 'Supabase no está configurado.'; return; }
        if (!nombre) { err.textContent = 'Escribe tu nombre.'; return; }
        if (clave.length < 8) { err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
        if (clave !== q('#rg-clave2').value) { err.textContent = 'Las contraseñas no coinciden.'; return; }
        ocupado(ev.target, true);
        try { await Auth.registrar(nombre, q('#rg-correo').value.trim(), clave); alEntrar(); }
        catch (e) { err.textContent = e.message; ocupado(ev.target, false); }
      });
    }
  },

  ocultar() {
    const cont = document.getElementById('auth');
    if (cont) cont.remove();
    document.querySelector('.app').style.display = '';
    PantallaAuth.modo = 'entrar';
  }
};