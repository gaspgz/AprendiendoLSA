import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_USUARIO = "usuario_sesion";
const KEY_SESION_ID = "sesion_id"; // ← NUEVO: guardamos el id del POST /sesiones
const KEY_TOKEN = "sesion_token"; // el token del login: dice quién pide

// Guarda el usuario, el id de sesión remoto y el token del login.
// token: con un texto se guarda; con null se borra (un login que no trajo
// token no puede dejar el de la cuenta anterior); sin pasarlo (undefined) se
// deja el que está, así los llamados que solo actualizan el usuario (cambiar
// el nombre, la foto) no lo pierden.
export const guardarSesion = async (usuario, sesion_id, token) => {
  await AsyncStorage.setItem(KEY_USUARIO, JSON.stringify(usuario));
  if (sesion_id) {
    await AsyncStorage.setItem(KEY_SESION_ID, sesion_id.toString());
  } else {
    // Sin número de sesión nuevo, borramos el viejo para no cerrarlo de nuevo
    // ni confundirlo con el del usuario que acaba de entrar.
    await AsyncStorage.removeItem(KEY_SESION_ID);
  }
  if (typeof token === "string" && token) {
    await AsyncStorage.setItem(KEY_TOKEN, token);
  } else if (token !== undefined) {
    await AsyncStorage.removeItem(KEY_TOKEN);
  }
};

export const obtenerSesion = async () => {
  const raw = await AsyncStorage.getItem(KEY_USUARIO);
  return raw ? JSON.parse(raw) : null;
};

// Devuelve el id del registro en MockAPI /sesiones
export const obtenerSesionId = async () => {
  return await AsyncStorage.getItem(KEY_SESION_ID);
};

// El token del login, para el "Authorization" de la API. null si no hay
// (por ejemplo, una sesión de antes de que la app guardara el token).
export const obtenerToken = async () => {
  return await AsyncStorage.getItem(KEY_TOKEN);
};

export const cerrarSesion = async () => {
  await AsyncStorage.removeItem(KEY_USUARIO);
  await AsyncStorage.removeItem(KEY_SESION_ID);
  await AsyncStorage.removeItem(KEY_TOKEN);
};

// ─── Aviso de "sesión vencida" ───────────────────────────────────────
// El token vence a los 30 días: cuando pasa, la API contesta 401. El aviso
// lo da services/api.js (apiFetch) y lo escucha app/_layout.tsx, que está
// por encima de todas las pantallas: así se sale al login desde cualquier
// lado, sin que cada pantalla tenga que ocuparse.
const suscriptores = new Set();

// Se suscribe al aviso. Devuelve la función para desuscribirse (para el
// return del useEffect).
export const alVencerSesion = (callback) => {
  suscriptores.add(callback);
  return () => {
    suscriptores.delete(callback);
  };
};

// Avisa que la sesión venció. Si un suscriptor falla, los demás se enteran
// igual.
export const avisarSesionVencida = () => {
  for (const callback of [...suscriptores]) {
    try {
      callback();
    } catch (e) {
      console.log("Falló un aviso de sesión vencida:", e);
    }
  }
};
