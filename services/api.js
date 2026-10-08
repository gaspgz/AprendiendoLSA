// ── URL base y endpoints de la API del profesor ──
export const API_BASE = "https://ort.nilosolutions.com/api/lsa";

// La clave NO va en el código (el repo es público): se lee del archivo .env.
// Copiá .env.example a .env, completá la clave y reiniciá con `npx expo start -c`.
// Ojo: Expo solo inyecta la variable si se lee así, literal (sin destructurar).
const API_KEY = process.env.EXPO_PUBLIC_LSA_API_KEY;

if (!API_KEY) {
  console.warn(
    "[api] Falta EXPO_PUBLIC_LSA_API_KEY: las llamadas a la API van a fallar " +
      "con 401. Copiá .env.example a .env, completá la clave y reiniciá Expo " +
      "con `npx expo start -c`.",
  );
}

export const ENDPOINTS = {
  login: `${API_BASE}/login`,
  registro: `${API_BASE}/usuarios`,
  usuarios: `${API_BASE}/usuarios`,
  health: `${API_BASE}/health`,
  sesiones: `${API_BASE}/sesiones`,
  progreso: (id) => `${API_BASE}/usuarios/${id}/progreso`,
  vidas: (id) => `${API_BASE}/usuarios/${id}/vidas`,
  completar: (id) => `${API_BASE}/usuarios/${id}/progreso/completar`,
  config: `${API_BASE}/config`,
};

// ── Helper interno: toda llamada a la API pasa por acá ──
// Siempre agrega Content-Type y X-API-Key, y devuelve { ok, data, status }.
// status 0 = no hubo respuesta (sin conexión, timeout, DNS...).
const apiFetch = async (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        "X-API-Key": API_KEY ?? "",
      },
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // respuesta vacía o que no es JSON
    }

    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0 };
  }
};

const ERROR_CONEXION = "No se pudo conectar. Revisá tu conexión.";

// Traduce el código de estado a un mensaje legible para el usuario.
const mensajeError = (status, data, porDefecto) => {
  if (status === 0) return ERROR_CONEXION;
  const mensajes = {
    401: "Clave de API inválida o vencida.",
    404: "No se encontró el recurso solicitado.",
    422: data?.error || "Datos inválidos.",
    429: "Demasiadas solicitudes, esperá un momento.",
  };
  return mensajes[status] || data?.error || porDefecto;
};

// ── Crear sesión en el servidor ──
// Devuelve el id de la sesión creada, o null si falla. Si falla, el login
// sigue igual: solo que esa sesión no se va a poder cerrar en la API.
const crearSesion = async (usuarioId, email) => {
  const { ok, data } = await apiFetch(ENDPOINTS.sesiones, {
    method: "POST",
    body: JSON.stringify({ usuario_id: String(usuarioId), email }),
  });
  return ok && data?.id ? data.id : null;
};

// ── Login ──
export const loginUsuario = async (email, password) => {
  const { data, status } = await apiFetch(ENDPOINTS.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (status === 0) return { ok: false, error: ERROR_CONEXION };

  if (!data?.ok) {
    return { ok: false, error: data?.error || "No se pudo iniciar sesión." };
  }

  const usuario = data.usuario;
  let sesion_id = data.sesion_id ?? null;

  // Si el login no creó una sesión en el servidor, la creamos acá.
  // Hace falta para poder cerrarla después.
  if (!sesion_id && usuario?.id != null) {
    sesion_id = await crearSesion(usuario.id, usuario.email ?? email);
  }

  return { ok: true, usuario, sesion_id };
};

// ── Registro ──
export const registrarUsuario = async ({ nombre, email, password }) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.registro, {
    method: "POST",
    body: JSON.stringify({ nombre, email, password }),
  });

  if (status === 0) return { ok: false, error: ERROR_CONEXION };

  if (!ok) {
    return {
      ok: false,
      error: data?.detail?.error || "No se pudo registrar.",
    };
  }

  return { ok: true, usuario: data };
};

// ── Obtener usuario por ID ──
export const obtenerUsuario = async (id) => {
  const { ok, data, status } = await apiFetch(`${ENDPOINTS.usuarios}/${id}`);

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo obtener el usuario."),
    };
  }

  return { ok: true, usuario: data };
};

// ── Actualizar usuario ──
export const actualizarUsuario = async (id, datos) => {
  const { ok, data, status } = await apiFetch(`${ENDPOINTS.usuarios}/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo actualizar el usuario."),
    };
  }

  return { ok: true, usuario: data };
};

// ─── Cerrar sesión remota ─────────────────────────────────────────────
// Marca la sesión como inactiva en el servidor: PUT /sesiones/{id} con
// { activa: false }. Si falla (sin internet, etc.), no bloquea el logout
// del celular: el usuario igual sale de la app.
export const cerrarSesionRemota = async (sesion_id) => {
  if (!sesion_id) return { ok: false, error: "No hay sesión para cerrar." };

  const { ok, data } = await apiFetch(`${ENDPOINTS.sesiones}/${sesion_id}`, {
    method: "PUT",
    body: JSON.stringify({ activa: false }),
  });

  if (!ok) {
    console.log("No se pudo cerrar la sesión en el servidor:", data?.error);
    return {
      ok: false,
      error: data?.error || "No se pudo cerrar la sesión en el servidor.",
    };
  }

  return { ok: true, sesion: data };
};

// ── Progreso ──
export const obtenerProgreso = async (usuarioId) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.progreso(usuarioId));

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo obtener el progreso."),
    };
  }

  return { ok: true, progreso: data };
};

export const guardarProgreso = async (usuarioId, leccionesCompletadas) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.progreso(usuarioId), {
    method: "PUT",
    body: JSON.stringify({ leccionesCompletadas }),
  });

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo guardar el progreso."),
    };
  }

  return { ok: true, data };
};

// Marca una lección completada Y suma el XP en una sola llamada (idempotente)
export const completarLeccion = async (usuarioId, { nivel, leccion, xp }) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.completar(usuarioId), {
    method: "POST",
    body: JSON.stringify({ nivel, leccion, xp }),
  });

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo completar la lección."),
    };
  }

  return { ok: true, data };
};

// ── Vidas ──
export const obtenerVidas = async (usuarioId) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.vidas(usuarioId));

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudieron obtener las vidas."),
    };
  }

  return { ok: true, vidas: data };
};

export const guardarVidas = async (usuarioId, { vidas, proximaRegen }) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.vidas(usuarioId), {
    method: "PUT",
    body: JSON.stringify({ vidas, proximaRegen }),
  });

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudieron guardar las vidas."),
    };
  }
  return { ok: true, data };
};

// ── Config del juego (vidas, tiempo de regeneración, etc.) ──
export const obtenerConfig = async () => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.config);

  if (!ok) {
    return {
      ok: false,
      error: mensajeError(status, data, "No se pudo obtener la configuración."),
    };
  }

  return { ok: true, config: data };
};
