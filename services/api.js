import { avisarSesionVencida, obtenerToken } from "./sesion";

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
// Siempre agrega X-API-Key, y devuelve { ok, data, status }.
// status 0 = no hubo respuesta (sin conexión, timeout, DNS...).
// Si hay un token del login guardado, agrega "Authorization: Bearer ...",
// que le dice a la API quién pide; con sinToken: true no lo manda (el login
// y el registro, donde todavía no hay token o quedó el de otra cuenta).
// Content-Type va en application/json salvo que el body sea un FormData:
// ahí lo tiene que poner fetch solo (con el "boundary" del formulario); si
// lo ponemos a mano, la subida llega rota.
// Si un pedido que llevaba token recibe un 401, el token venció (dura 30
// días): se avisa con avisarSesionVencida() y app/_layout.tsx saca al login.
// Con sinAvisoVencida: true no se avisa (lo usa cerrarSesionRemota, donde un
// 401 no importa porque ya se está cerrando la sesión).
const apiFetch = async (
  path,
  { sinToken, sinAvisoVencida, ...opciones } = {},
) => {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  try {
    const esFormulario = opciones.body instanceof FormData;
    const headers = {
      ...opciones.headers,
      ...(esFormulario ? {} : { "Content-Type": "application/json" }),
      "X-API-Key": API_KEY ?? "",
    };
    let conToken = false;
    if (!sinToken) {
      const token = await obtenerToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        conToken = true;
      }
    }
    const res = await fetch(url, { ...opciones, headers });

    // Un 403 NO cierra la sesión (por ejemplo, tocar datos de otra cuenta):
    // se maneja como cualquier otro error.
    if (res.status === 401 && conToken && !sinAvisoVencida) {
      avisarSesionVencida();
    }

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
export const mensajeError = (status, data, porDefecto) => {
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
    // Parte del login: el token nuevo todavía no se guardó, y el que pueda
    // haber es de la cuenta anterior
    sinToken: true,
  });
  return ok && data?.id ? data.id : null;
};

// ── Login ──
export const loginUsuario = async (email, password) => {
  const { data, status } = await apiFetch(ENDPOINTS.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    sinToken: true, // acá recién se consigue el token
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

  // El token dice quién pide: hace falta para lo que solo puede hacer el
  // dueño de la cuenta (hoy, cambiar su foto de perfil)
  return { ok: true, usuario, sesion_id, token: data.token ?? null };
};

// ── Registro ──
export const registrarUsuario = async ({ nombre, email, password }) => {
  const { ok, data, status } = await apiFetch(ENDPOINTS.registro, {
    method: "POST",
    body: JSON.stringify({ nombre, email, password }),
    sinToken: true, // la cuenta recién se está creando
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

// "data:image/jpeg;base64,xxxx" → Blob, para subirlo como archivo en la web
const dataUriABlob = (uri) => {
  const [cabecera, base64] = uri.split(",");
  const tipo = cabecera.match(/^data:(.*?)[;,]/)?.[1] || "image/jpeg";
  const letras = atob(base64);
  const bytes = new Uint8Array(letras.length);
  for (let i = 0; i < letras.length; i++) bytes[i] = letras.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
};

// ── Subir la foto de perfil ──
// POST /usuarios/{id}/foto, como formulario (multipart) con el campo
// "archivo": la API guarda la imagen Y se la deja puesta al usuario, en una
// sola llamada. Pide el token del login (solo el dueño cambia su foto).
// Devuelve { ok, usuario, status }: usuario viene con "foto" apuntando a la
// dirección nueva (cambia con cada subida). Si falla, { ok, error, status }.
export const subirFotoPerfil = async (id, uri) => {
  const form = new FormData();
  if (uri.startsWith("data:")) {
    // En la web la foto procesada es un data URI: se convierte en Blob
    form.append("archivo", dataUriABlob(uri), "foto.jpg");
  } else {
    // En el celular alcanza con la ruta del archivo
    form.append("archivo", { uri, name: "foto.jpg", type: "image/jpeg" });
  }

  const { ok, data, status } = await apiFetch(
    `${ENDPOINTS.usuarios}/${id}/foto`,
    { method: "POST", body: form },
  );

  if (!ok) {
    return {
      ok: false,
      status,
      error: mensajeError(status, data, "No se pudo guardar la foto."),
    };
  }
  return { ok: true, status, usuario: data?.usuario ?? data };
};

// ── Eliminar usuario ──
// DELETE /usuarios/{id}. Devuelve { ok, data, status } tal cual, así quien la
// llama decide qué hacer con un 404 (la cuenta ya no existe) o con status 0
// (sin conexión). Si la API responde sin cuerpo (204), data es null.
export const eliminarUsuario = async (id) =>
  apiFetch(`${ENDPOINTS.usuarios}/${id}`, { method: "DELETE" });

// ─── Cerrar sesión remota ─────────────────────────────────────────────
// Marca la sesión como inactiva en el servidor: PUT /sesiones/{id} con
// { activa: false }. Si falla (sin internet, etc.), no bloquea el logout
// del celular: el usuario igual sale de la app.
export const cerrarSesionRemota = async (sesion_id) => {
  if (!sesion_id) return { ok: false, error: "No hay sesión para cerrar." };

  const { ok, data } = await apiFetch(`${ENDPOINTS.sesiones}/${sesion_id}`, {
    method: "PUT",
    body: JSON.stringify({ activa: false }),
    // Un 401 acá no tiene que mandar al login: o se está cerrando la sesión
    // a propósito, o es la sesión anterior que el login deja cerrada.
    sinAvisoVencida: true,
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

// ─ Config del juego (vidas, tiempo de regeneración, etc.) ──
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
