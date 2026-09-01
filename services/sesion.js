import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_USUARIO = "usuario_sesion";
const KEY_SESION_ID = "sesion_id"; // ← NUEVO: guardamos el id del POST /sesiones

// Guarda el usuario Y el id de sesión remoto
export const guardarSesion = async (usuario, sesion_id) => {
  await AsyncStorage.setItem(KEY_USUARIO, JSON.stringify(usuario));
  if (sesion_id) {
    await AsyncStorage.setItem(KEY_SESION_ID, sesion_id.toString());
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

export const cerrarSesion = async () => {
  await AsyncStorage.removeItem(KEY_USUARIO);
  await AsyncStorage.removeItem(KEY_SESION_ID);
};
