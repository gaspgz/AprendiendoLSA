// ── URL base y endpoints de la API del profesor ──
export const API_BASE = "https://ort.nilosolutions.com/api/lsa";
export const API_KEY = "ort5-2026-0fbfd48baf88"; // luego lo movemos a .env

const AUTH_HEADER = {
  "X-API-Key": API_KEY,
};

export const ENDPOINTS = {
  login: `${API_BASE}/login`,
  registro: `${API_BASE}/usuarios`,
  health: `${API_BASE}/health`,
  progreso: (id) => `${API_BASE}/usuarios/${id}/progreso`,
};

// ── Login ──
export const loginUsuario = async (email, password) => {
  try {
    const res = await fetch(ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADER,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.ok) {
      return { ok: false, error: data.error || "No se pudo iniciar sesión." };
    }

    return { ok: true, usuario: data.usuario, sesion_id: data.sesion_id };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar. Revisá tu conexión." };
  }
};

// ── Registro ──
export const registrarUsuario = async ({ nombre, email, password }) => {
  try {
    const res = await fetch(ENDPOINTS.registro, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADER,
      },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data.detail?.error || "No se pudo registrar.",
      };
    }

    return { ok: true, usuario: data };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar. Revisá tu conexión." };
  }
};

// ─── Obtener usuario por ID ───────────────────────────────────────────
export const obtenerUsuario = async (id) => {
  try {
    const res = await fetch(`${ENDPOINTS.usuarios}/${id}`);
    const data = await res.json();
    return { ok: true, usuario: data };
  } catch (e) {
    return { ok: false, error: "No se pudo obtener el usuario." };
  }
};

// ─── Actualizar usuario ───────────────────────────────────────────────
export const actualizarUsuario = async (id, datos) => {
  try {
    const res = await fetch(`${ENDPOINTS.usuarios}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    return { ok: true, usuario: data };
  } catch (e) {
    return { ok: false, error: "No se pudo actualizar el usuario." };
  }
};

// ─── Cerrar sesión en MockAPI ─────────────────────────────────────────
// Marca la sesión como inactiva (PUT sobre el registro creado al hacer login)
export const cerrarSesionRemota = async (sesion_id) => {
  if (!sesion_id) return;
  try {
    await fetch(`${ENDPOINTS.sesiones}/${sesion_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activa: false,
        fecha_logout: new Date().toISOString(),
      }),
    });
  } catch (e) {
    // Si falla, no bloqueamos el logout local
    console.warn("No se pudo cerrar la sesión remota:", e);
  }
};
