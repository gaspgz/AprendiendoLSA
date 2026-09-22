// ── URL base y endpoints de la API del profesor ──
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

const AUTH_HEADER = {
  "X-API-Key": API_KEY,
};

export const ENDPOINTS = {
  login: `${API_BASE}/login`,
  registro: `${API_BASE}/usuarios`,
  health: `${API_BASE}/health`,
  usuarios: `${API_BASE}/usuarios`,
  sesiones: `${API_BASE}/sesiones`,
  progreso: (id) => `${API_BASE}/usuarios/${id}/progreso`,
  vidas: (id) => `${API_BASE}/usuarios/${id}/vidas`,
  completar: (id) => `${API_BASE}/usuarios/${id}/progreso/completar`,
  config: `${API_BASE}/config`,
};

// ── Helper interno: interpreta la respuesta y arma errores legibles ──
const manejarRespuesta = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.ok) return { ok: true, data };

  const mensajes = {
    401: "Clave de API inválida o vencida.",
    404: "No se encontró el recurso solicitado.",
    422: data?.error || "Datos inválidos.",
    429: "Demasiadas solicitudes, esperá un momento.",
  };

  return {
    ok: false,
    error:
      mensajes[res.status] || data?.error || "Error al conectar con la API.",
  };
};

// ── Login ──
export const loginUsuario = async (email, password) => {
  try {
    const res = await fetch(ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ email, password }),
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return {
      ok: true,
      usuario: resultado.data.usuario,
      sesion_id: resultado.data.sesion_id,
    };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar. Revisá tu conexión." };
  }
};

// ── Registro ──
export const registrarUsuario = async ({ nombre, email, password }) => {
  try {
    const res = await fetch(ENDPOINTS.registro, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ nombre, email, password }),
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, usuario: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar. Revisá tu conexión." };
  }
};

// ── Obtener usuario por ID ──
export const obtenerUsuario = async (id) => {
  try {
    const res = await fetch(`${ENDPOINTS.usuarios}/${id}`, {
      headers: { ...AUTH_HEADER },
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, usuario: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudo obtener el usuario." };
  }
};

// ── Actualizar usuario ──
export const actualizarUsuario = async (id, datos) => {
  try {
    const res = await fetch(`${ENDPOINTS.usuarios}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify(datos),
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, usuario: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudo actualizar el usuario." };
  }
};

// ── Cerrar sesión remota ──
export const cerrarSesionRemota = async (sesion_id) => {
  if (!sesion_id) return;
  try {
    await fetch(`${ENDPOINTS.sesiones}/${sesion_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({
        activa: false,
        fecha_logout: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn("No se pudo cerrar la sesión remota:", e);
  }
};

// ── Progreso ──
export const obtenerProgreso = async (usuarioId) => {
  try {
    const res = await fetch(ENDPOINTS.progreso(usuarioId), {
      headers: { ...AUTH_HEADER },
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, progreso: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudo obtener el progreso." };
  }
};

export const guardarProgreso = async (usuarioId, leccionesCompletadas) => {
  try {
    const res = await fetch(ENDPOINTS.progreso(usuarioId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ leccionesCompletadas }),
    });
    return await manejarRespuesta(res);
  } catch (e) {
    return { ok: false, error: "No se pudo guardar el progreso." };
  }
};

// Marca una lección completada Y suma el XP en una sola llamada (idempotente)
export const completarLeccion = async (usuarioId, { nivel, leccion, xp }) => {
  try {
    const res = await fetch(ENDPOINTS.completar(usuarioId), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ nivel, leccion, xp }),
    });
    return await manejarRespuesta(res);
  } catch (e) {
    return { ok: false, error: "No se pudo completar la lección." };
  }
};

// ── Vidas ──
export const obtenerVidas = async (usuarioId) => {
  try {
    const res = await fetch(ENDPOINTS.vidas(usuarioId), {
      headers: { ...AUTH_HEADER },
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, vidas: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudieron obtener las vidas." };
  }
};

export const guardarVidas = async (usuarioId, { vidas, proximaRegen }) => {
  try {
    const res = await fetch(ENDPOINTS.vidas(usuarioId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ vidas, proximaRegen }),
    });
    return await manejarRespuesta(res);
  } catch (e) {
    return { ok: false, error: "No se pudieron guardar las vidas." };
  }
};

// ── Config del juego (vidas, tiempo de regeneración, etc.) ──
export const obtenerConfig = async () => {
  try {
    const res = await fetch(ENDPOINTS.config, {
      headers: { ...AUTH_HEADER },
    });
    const resultado = await manejarRespuesta(res);
    if (!resultado.ok) return resultado;
    return { ok: true, config: resultado.data };
  } catch (e) {
    return { ok: false, error: "No se pudo obtener la configuración." };
  }
};
