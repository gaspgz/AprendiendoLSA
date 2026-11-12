import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

// ─── Foto de perfil ──────────────────────────────────────────────────
// Por ahora la foto se guarda SOLO en este celular (o navegador), una por
// cuenta. Guardarla en el servidor queda para después: ver los TODO (API).
//
// - En el celular, el archivo va a la carpeta de documentos de la app
//   (Paths.document), que el sistema no borra como la caché, y su ruta se
//   guarda en AsyncStorage con la key foto_perfil_<uid>.
// - En la web no hay carpeta de documentos: la imagen entera se guarda
//   como data URI en esa misma key.
//
// Ninguna función tira error: si algo falla devuelven null (o false) y la
// app sigue con las iniciales.
//
// Se usa la API nueva de expo-file-system (File y Paths). Las funciones
// viejas, como copyAsync, ahora están en "expo-file-system/legacy".

const TAMANO = 400; // la foto queda de 400×400
const COMPRESION = 0.7; // calidad del JPEG
const esWeb = Platform.OS === "web";

const claveFoto = (uid) => `foto_perfil_${String(uid).trim()}`;

// El archivo de la foto en la carpeta de documentos (solo en el celular)
const archivoFoto = (uid) => new File(Paths.document, `${claveFoto(uid)}.jpg`);

// ─── Versión de la foto ──────────────────────────────────────────────
// En el celular la foto nueva pisa al mismo archivo: la ruta no cambia
// aunque cambie la foto. Para saber si cambió sin volver a leerla, cada
// cuenta tiene un número que sube cada vez que se guarda o se quita su foto
// (también si falla: así se vuelve a leer lo que de verdad quedó). Vive en
// memoria y alcanza, porque la foto solo cambia desde esta app; al abrirla
// de nuevo arranca en 0 y la foto se lee igual.
// Lo usa el mapa (app/(tabs)/index.jsx) para refrescar AvatarUsuario.
const versiones = new Map(); // uid → número

const subirVersion = (uid) => {
  const clave = String(uid).trim();
  versiones.set(clave, (versiones.get(clave) ?? 0) + 1);
};

// La versión de la foto de la cuenta: 0 si no cambió desde que se abrió la app
export const versionFotoPerfil = (uid) =>
  versiones.get(String(uid).trim()) ?? 0;

// Recorta el cuadrado del centro (en la web el picker no recorta) y lo
// achica a 400×400 en JPEG. Devuelve la uri nueva (en la web, un data URI),
// o null si no se pudo.
export const procesarFoto = async (uri) => {
  try {
    // Primero se carga tal cual, para saber cuánto mide
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    const lado = Math.min(original.width, original.height);
    const chica = await ImageManipulator.manipulate(original)
      .crop({
        originX: Math.floor((original.width - lado) / 2),
        originY: Math.floor((original.height - lado) / 2),
        width: lado,
        height: lado,
      })
      .resize({ width: TAMANO, height: TAMANO })
      .renderAsync();
    const resultado = await chica.saveAsync({
      format: SaveFormat.JPEG,
      compress: COMPRESION,
      base64: esWeb, // en la web se guarda la imagen misma
    });
    return esWeb ? `data:image/jpeg;base64,${resultado.base64}` : resultado.uri;
  } catch (e) {
    console.log("No se pudo procesar la foto:", e);
    return null;
  }
};

// Guarda la foto de la cuenta en el celular. Devuelve la uri para mostrarla,
// o null si no se pudo.
export const guardarFotoLocal = async (uid, uri) => {
  try {
    if (esWeb) {
      if (!uri.startsWith("data:")) {
        throw new Error("En la web la foto tiene que ser un data URI");
      }
      await AsyncStorage.setItem(claveFoto(uid), uri);
      return uri;
    }
    // Se copia porque la caché (donde la dejan el picker y procesarFoto) la
    // puede borrar el sistema. Siempre el mismo archivo: pisa al anterior.
    const destino = archivoFoto(uid);
    await new File(uri).copy(destino, { overwrite: true });
    await AsyncStorage.setItem(claveFoto(uid), destino.uri);
    return destino.uri;
  } catch (e) {
    console.log("No se pudo guardar la foto en el celular:", e);
    return null;
  } finally {
    subirVersion(uid); // ver versionFotoPerfil
  }
};

// La foto guardada de la cuenta, o null si no tiene (o si el archivo ya no
// está).
export const obtenerFotoLocal = async (uid) => {
  try {
    const guardada = await AsyncStorage.getItem(claveFoto(uid));
    if (!guardada) return null;
    if (esWeb) return guardada; // la imagen misma (data URI)
    // La ruta guardada y, si ahí no está, el mismo archivo en la carpeta de
    // documentos de ahora: en iOS la ruta de esa carpeta cambia cuando se
    // actualiza la app.
    for (const archivo of [new File(guardada), archivoFoto(uid)]) {
      if (archivo.exists) return archivo.uri;
    }
    return null;
  } catch (e) {
    console.log("No se pudo leer la foto guardada:", e);
    return null;
  }
};

// Borra la foto de la cuenta del celular: el archivo y la key. Devuelve true
// si se pudo.
export const borrarFotoLocal = async (uid) => {
  try {
    if (!esWeb) {
      const archivo = archivoFoto(uid);
      if (archivo.exists) archivo.delete();
    }
    await AsyncStorage.removeItem(claveFoto(uid));
    return true;
  } catch (e) {
    console.log("No se pudo borrar la foto guardada:", e);
    return false;
  } finally {
    subirVersion(uid); // ver versionFotoPerfil
  }
};

// ─── Lo que usa la pantalla ──────────────────────────────────────────

// Guarda la foto nueva de la cuenta. Devuelve la uri para mostrarla, o null
// si no se pudo (entonces queda la foto que había).
export const guardarFotoPerfil = async (uid, uri) => {
  const guardada = await guardarFotoLocal(uid, uri);

  // ──────────────────────────────────────────────────────────────────
  // TODO (API): guardar la foto también en el servidor, para que se vea
  // en cualquier celular. Hoy queda solo en este. Si `guardada` es null,
  // no subir nada. Hay dos caminos:
  //
  // (a) Subir la imagen a la API (por ejemplo con FormData, como
  //     scripts/subir-senas.mjs sube los GIFs) y guardar el link:
  //       await actualizarUsuario(uid, { foto: link });
  //     OJO: los archivos subidos se pueden ver SIN la clave de la API.
  //     La foto de un alumno quedaría pública para cualquiera que tenga
  //     el link.
  //
  // (b) Guardar la imagen chica (400×400) en base64 directamente en el
  //     campo foto:
  //       const foto = esWeb
  //         ? guardada // en la web ya es el data URI
  //         : `data:image/jpeg;base64,${await new File(guardada).base64()}`;
  //       await actualizarUsuario(uid, { foto });
  //     Antes, verificar que la API acepte textos tan largos (la foto
  //     ocupa decenas de KB).
  //
  // En los dos casos, después actualizar la sesión local (el usuario con
  // la foto nueva y el mismo sesion_id), para que el resto de la app la
  // tenga. `fotoNueva` es el link de (a) o el texto de (b):
  //       const sesion = await obtenerSesion();
  //       const sesionId = await obtenerSesionId();
  //       await guardarSesion({ ...sesion, foto: fotoNueva }, sesionId);
  //
  // actualizarUsuario está en services/api.js; obtenerSesion,
  // obtenerSesionId y guardarSesion, en services/sesion.js.
  // ──────────────────────────────────────────────────────────────────

  return guardada;
};

// Quita la foto de la cuenta. Devuelve true si se pudo.
export const quitarFotoPerfil = async (uid) => {
  const borrada = await borrarFotoLocal(uid);

  // TODO (API): poner la foto en null también en el servidor,
  //   await actualizarUsuario(uid, { foto: null });
  // y actualizar la sesión local igual que en guardarFotoPerfil (con
  // foto: null).

  return borrada;
};
