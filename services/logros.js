import AsyncStorage from "@react-native-async-storage/async-storage";

// Logros que se ganan jugando y no salen del progreso (por ahora, solo
// "leccion_perfecta"). Se guardan en el celular, uno por cuenta:
// "logros_<uid>" → ["leccion_perfecta", ...]
// TODO: sincronizar con la API (POST /usuarios/{id}/logros/{logro_id}).
//
// Si falla AsyncStorage no se rompe nada: el logro simplemente no aparece.
const claveGuardada = (uid) => {
  const id = String(uid ?? "").trim();
  return id ? `logros_${id}` : null;
};

// Lo guardado como lista; cualquier otra cosa (vacío, roto) es una lista vacía
const comoLista = (raw) => {
  try {
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

export const obtenerLogrosGuardados = async (uid) => {
  const key = claveGuardada(uid);
  if (!key) return [];
  try {
    return comoLista(await AsyncStorage.getItem(key));
  } catch (e) {
    console.log("No se pudieron leer los logros:", e);
    return [];
  }
};

// Si ya lo tenía no escribe nada. Si la lectura falla tampoco escribe, así
// no se pisan los logros que ya estaban guardados.
export const guardarLogro = async (uid, idLogro) => {
  const key = claveGuardada(uid);
  if (!key || !idLogro) return;
  try {
    const logros = comoLista(await AsyncStorage.getItem(key));
    if (logros.includes(idLogro)) return;
    await AsyncStorage.setItem(key, JSON.stringify([...logros, idLogro]));
  } catch (e) {
    console.log("No se pudo guardar el logro:", e);
  }
};
