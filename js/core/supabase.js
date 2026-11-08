// Conexión con Supabase y funciones de autenticación
const configurado = typeof supabase !== 'undefined' &&
  /^https:\/\//.test(CONFIG.SUPABASE_URL) && CONFIG.SUPABASE_KEY.indexOf('PEGA_AQUI') === -1;
const sb = configurado ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY) : null;

const Auth = {
  usuario: null,

  // Revisa si ya hay una sesión abierta (se conserva al recargar la página)
  async iniciar() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    Auth.usuario = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange(evento => { if (evento === 'SIGNED_OUT' && Auth.usuario) location.reload(); });
    return Auth.usuario;
  },

  async registrar(nombre, correo, clave) {
    const { data, error } = await sb.auth.signUp({ email: correo, password: clave, options: { data: { nombre } } });
    if (error) throw new Error(Auth.traducir(error.message));
    if (!data.session) throw new Error('Cuenta creada. Este proyecto exige confirmar el correo: revisa tu bandeja y luego inicia sesión.');
    Auth.usuario = data.user;
    return data.user;
  },

  async entrar(correo, clave) {
    const { data, error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
    if (error) throw new Error(Auth.traducir(error.message));
    Auth.usuario = data.user;
    return data.user;
  },

  async salir() {
    const u = Auth.usuario;
    Auth.usuario = null;
    if (sb && u) await sb.auth.signOut();
  },

  traducir(msg) {
    const m = String(msg || '').toLowerCase();
    if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
    if (m.includes('already registered')) return 'Ese correo ya está registrado. Inicia sesión.';
    if (m.includes('at least')) return 'La contraseña es demasiado corta.';
    if (m.includes('rate limit')) return 'Se alcanzó el límite de correos de Supabase. Desactiva "Confirm email" o espera una hora.';
    if (m.includes('invalid format') || m.includes('valid email')) return 'El correo no es válido.';
    if (m.includes('failed to fetch') || m.includes('network')) return 'No hay conexión con el servidor. Revisa tu internet y la URL en config.js.';
    return 'No se pudo completar la acción: ' + msg;
  }
};