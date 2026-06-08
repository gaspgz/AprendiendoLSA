// ─── URL base de MockAPI ─────────────────────────────────────────────
export const MOCKAPI_BASE = "https://6a04b2c8aa826ca75c09150d.mockapi.io/Users";

// ─── Endpoints ───────────────────────────────────────────────────────
export const ENDPOINTS = {
  usuarios: `${MOCKAPI_BASE}/usuarios`,
  sesiones: `${MOCKAPI_BASE}/sesiones`, // ← NUEVO: recurso de sesiones en MockAPI
};

// ─── Login ────────────────────────────────────────────────────────────
export const loginUsuario = async (email, password) => {
  try {
    // 1. Buscar usuario por email (GET con filtro)
    const res = await fetch(
      `${ENDPOINTS.usuarios}?email=${encodeURIComponent(email)}`,
    );
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return { ok: false, error: "No existe una cuenta con ese email." };
    }

    const usuario = data[0];

    if (usuario.password !== password) {
      return { ok: false, error: "Contraseña incorrecta." };
    }

    // 2. Registrar el evento de login en MockAPI (POST /sesiones)
    //    Esto es lo que faltaba: persistir que el usuario inició sesión.
    const sesionRes = await fetch(ENDPOINTS.sesiones, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: usuario.id,
        email: usuario.email,
        fecha_login: new Date().toISOString(),
        activa: true,
      }),
    });
    const sesion = await sesionRes.json();

    // Devolvemos tanto el usuario como el id de sesión generado por MockAPI
    return { ok: true, usuario, sesion_id: sesion.id };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar. Revisá tu conexión." };
  }
};

// ─── Registro ────────────────────────────────────────────────────────
export const registrarUsuario = async ({ nombre, email, password }) => {
  try {
    const checkRes = await fetch(
      `${ENDPOINTS.usuarios}?email=${encodeURIComponent(email)}`,
    );
    const checkData = await checkRes.json();

    if (Array.isArray(checkData) && checkData.length > 0) {
      return { ok: false, error: "Ya existe una cuenta con ese email." };
    }

    const res = await fetch(ENDPOINTS.usuarios, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password, racha: 0, xpTotal: 0 }),
    });
    const usuario = await res.json();

    return { ok: true, usuario };
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
