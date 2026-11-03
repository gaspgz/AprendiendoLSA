import AsyncStorage from "@react-native-async-storage/async-storage";

// Marca "tutorial pendiente", una por cuenta. Solo la pone el registro: las
// cuentas que ya existían no la tienen y nunca ven el tutorial solas.
//
// La clave es el email de la cuenta. Se guarda en minúsculas y sin espacios,
// así "Ana@Mail.com " (registro) y "ana@mail.com" (sesión) son la misma.
// Si falla AsyncStorage, el tutorial simplemente no aparece: nunca rompe la app.
const claveGuardada = (clave) => {
  const limpia = String(clave ?? "")
    .trim()
    .toLowerCase();
  return limpia ? `tutorial_pendiente_${limpia}` : null;
};

export const marcarTutorialPendiente = async (clave) => {
  const key = claveGuardada(clave);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, "1");
  } catch (e) {
    console.log("No se pudo marcar el tutorial como pendiente:", e);
  }
};

export const tutorialPendiente = async (clave) => {
  const key = claveGuardada(clave);
  if (!key) return false;
  try {
    return (await AsyncStorage.getItem(key)) === "1";
  } catch (e) {
    console.log("No se pudo leer la marca del tutorial:", e);
    return false;
  }
};

export const marcarTutorialVisto = async (clave) => {
  const key = claveGuardada(clave);
  if (!key) return;
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log("No se pudo marcar el tutorial como visto:", e);
  }
};
