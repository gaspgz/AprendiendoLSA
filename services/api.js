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
  progreso: (id) => `${API_BASE}/usuarios/${id}/progreso`,
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

  return { ok: true, usuario: data.usuario, sesion_id: data.sesion_id };
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

// ─── Obtener usuario por ID ───────────────────────────────────────────
export const obtenerUsuario = async (id) => {
  const { ok, data } = await apiFetch(`${ENDPOINTS.usuarios}/${id}`);

  if (!ok) return { ok: false, error: "No se pudo obtener el usuario." };

  return { ok: true, usuario: data };
};

// ─── Actualizar usuario ───────────────────────────────────────────────
export const actualizarUsuario = async (id, datos) => {
  const { ok, data } = await apiFetch(`${ENDPOINTS.usuarios}/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });

  if (!ok) return { ok: false, error: "No se pudo actualizar el usuario." };

  return { ok: true, usuario: data };
};

// ─── Cerrar sesión remota ─────────────────────────────────────────────
// TODO: falta confirmar la ruta real de logout en la API del curso.
// La versión anterior usaba ENDPOINTS.sesiones (herencia de MockAPI), que acá
// nunca existió. Cuando se confirme: agregarla a ENDPOINTS, hacer la llamada
// con apiFetch y pasar esta constante a true. Mientras tanto no se hace ningún
// fetch y el logout es solo local (cerrarSesion en services/sesion.js).
const RUTA_LOGOUT_CONFIRMADA = false;

export const cerrarSesionRemota = async (sesion_id) => {
  // Guard temprano: sin ruta confirmada no llamamos a la API.
  if (!RUTA_LOGOUT_CONFIRMADA || !sesion_id) return;
};
