import AsyncStorage from "@react-native-async-storage/async-storage";

// Avance de las lecciones empezadas y sin terminar, para seguir donde se
// dejaron. Se guarda solo en el celular, uno por cuenta:
// "leccion_en_curso_<uid>" → { "<nivelId>_<leccionId>": datos }
// datos = { indice, total, errores, firma, actualizado }
//   - indice: el próximo ítem a mostrar (cuenta todos los ítems: enseñanza,
//     ejercicios y motivación, igual que la barra de progreso)
//   - total: cantidad de ítems de la lección
//   - errores: vidas perdidas en este intento (las que usa "Lección perfecta")
//   - firma: versión de la lección (la arma index.jsx); si no coincide con la
//     lección actual, lo guardado ya no sirve
//   - actualizado: cuándo se guardó (timestamp en ms)
// Al cerrar sesión no se borra, igual que progreso_<uid> y vidas_<uid>.
//
// Si falla AsyncStorage no se rompe nada: la lección arranca de cero, como
// antes.
const claveGuardada = (uid) => {
  const id = String(uid ?? "").trim();
  return id ? `leccion_en_curso_${id}` : null;
};

// Clave de una lección dentro de lo guardado
export const claveLeccionEnCurso = (nivelId, leccionId) =>
  `${nivelId}_${leccionId}`;

// Lo guardado como objeto; cualquier otra cosa (vacío, roto, una lista) es {}
const comoObjeto = (raw) => {
  try {
    const datos = JSON.parse(raw);
    return datos && typeof datos === "object" && !Array.isArray(datos)
      ? datos
      : {};
  } catch {
    return {};
  }
};

// Las lecturas y escrituras van en fila, una después de la otra: cada una ve
// lo que dejó la anterior. Así un guardado y un borrado que se cruzan (por
// ejemplo, el último "Siguiente" y el final de la lección) no se pisan.
let fila = Promise.resolve();
const enFila = (tarea) => {
  const resultado = fila.then(tarea);
  fila = resultado.catch(() => {});
  return resultado;
};

const leerTodas = async (key) => comoObjeto(await AsyncStorage.getItem(key));

export const obtenerTodasEnCurso = (uid) => {
  const key = claveGuardada(uid);
  if (!key) return Promise.resolve({});
  return enFila(async () => {
    try {
      return await leerTodas(key);
    } catch (e) {
      console.log("No se pudo leer el avance de las lecciones:", e);
      return {};
    }
  });
};

// El avance de una lección, o null si no hay
export const obtenerLeccionEnCurso = async (uid, nivelId, leccionId) => {
  const todas = await obtenerTodasEnCurso(uid);
  return todas[claveLeccionEnCurso(nivelId, leccionId)] ?? null;
};

// Si la lectura falla no escribe, así no se pisa lo de las otras lecciones
export const guardarLeccionEnCurso = (uid, nivelId, leccionId, datos) => {
  const key = claveGuardada(uid);
  if (!key || !datos) return Promise.resolve();
  const { indice, total, errores, firma } = datos;
  return enFila(async () => {
    try {
      const todas = await leerTodas(key);
      todas[claveLeccionEnCurso(nivelId, leccionId)] = {
        indice,
        total,
        errores,
        firma,
        actualizado: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(todas));
    } catch (e) {
      console.log("No se pudo guardar el avance de la lección:", e);
    }
  });
};

// Si era la única lección guardada, se borra la clave entera
export const borrarLeccionEnCurso = (uid, nivelId, leccionId) => {
  const key = claveGuardada(uid);
  if (!key) return Promise.resolve();
  return enFila(async () => {
    try {
      const todas = await leerTodas(key);
      const clave = claveLeccionEnCurso(nivelId, leccionId);
      if (todas[clave] === undefined) return;
      delete todas[clave];
      if (Object.keys(todas).length > 0) {
        await AsyncStorage.setItem(key, JSON.stringify(todas));
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.log("No se pudo borrar el avance de la lección:", e);
    }
  });
};
