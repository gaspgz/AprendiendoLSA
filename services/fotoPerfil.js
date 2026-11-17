import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

import { subirFotoPerfil } from "./api";
import { guardarSesion, obtenerSesion, obtenerSesionId } from "./sesion";

// ─── Foto de perfil ──────────────────────────────────────────────────
// La foto se guarda en la API (POST /usuarios/{id}/foto) y además queda una
// copia en este celular (o navegador) para mostrarla al instante, junto con
// la dirección que la API le dio ("servidor"). Si "servidor" es null, la
// copia es solo local: de antes de que la app subiera fotos.
//
// - En el celular, el archivo va a la carpeta de documentos de la app
//   (Paths.document), que el sistema no borra como la caché, y en
//   AsyncStorage (key foto_perfil_<uid>) va { uri, servidor }.
// - En la web no hay carpeta de documentos: en esa key va la imagen entera
//   (un data URI) con su "servidor".
//
// Las funciones de guardar, leer y borrar no tiran error: si algo falla
// devuelven null (o false) y la app sigue con las iniciales.
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

// Guarda la copia de la foto en el celular, anotando la dirección que esa
// misma foto tiene en la API (servidor; null si no está subida). Devuelve la
// uri para mostrarla, o null si no se pudo.
export const guardarFotoLocal = async (uid, uri, servidor = null) => {
  try {
    if (esWeb) {
      if (!uri.startsWith("data:")) {
        throw new Error("En la web la foto tiene que ser un data URI");
      }
      await AsyncStorage.setItem(
        claveFoto(uid),
        JSON.stringify({ uri, servidor }),
      );
      return uri;
    }
    // Se copia porque la caché (donde la dejan el picker y procesarFoto) la
    // puede borrar el sistema. Siempre el mismo archivo: pisa al anterior.
    const destino = archivoFoto(uid);
    await new File(uri).copy(destino, { overwrite: true });
    await AsyncStorage.setItem(
      claveFoto(uid),
      JSON.stringify({ uri: destino.uri, servidor }),
    );
    return destino.uri;
  } catch (e) {
    console.log("No se pudo guardar la foto en el celular:", e);
    return null;
  } finally {
    subirVersion(uid); // ver versionFotoPerfil
  }
};

// La copia guardada de la foto de la cuenta: { uri, servidor }, o null si no
// tiene (o si el archivo ya no está). servidor es la dirección de esa misma
// foto en la API, o null si la copia es solo local. Antes de este cambio se
// guardaba la uri sola: ese formato se sigue entendiendo, como copia solo
// local.
export const obtenerFotoLocal = async (uid) => {
  try {
    const crudo = await AsyncStorage.getItem(claveFoto(uid));
    if (!crudo) return null;
    let guardada;
    try {
      guardada = JSON.parse(crudo);
    } catch {
      guardada = null; // formato viejo: el texto es la uri
    }
    if (!guardada || typeof guardada !== "object" || !guardada.uri) {
      guardada = { uri: crudo, servidor: null };
    }
    const servidor = guardada.servidor ?? null;
    if (esWeb) return { uri: guardada.uri, servidor }; // la imagen misma
    // La ruta guardada y, si ahí no está, el mismo archivo en la carpeta de
    // documentos de ahora: en iOS la ruta de esa carpeta cambia cuando se
    // actualiza la app.
    for (const archivo of [new File(guardada.uri), archivoFoto(uid)]) {
      if (archivo.exists) return { uri: archivo.uri, servidor };
    }
    return null;
  } catch (e) {
    console.log("No se pudo leer la foto guardada:", e);
    return null;
  }
};

// Qué foto mostrar para una cuenta, entre la del servidor (fotoServidor, el
// campo foto del usuario en la API) y la copia del celular (guardada, lo de
// obtenerFotoLocal):
//   - si el servidor tiene foto y la copia es de esa misma (la dirección
//     anotada coincide), la copia, que carga al instante;
//   - si el servidor tiene una foto distinta (se cambió desde otro celular),
//     la del servidor;
//   - si el servidor no tiene, la copia del celular (aunque sea solo local);
//   - sin ninguna, null (se muestran las iniciales).
// Devuelve { uri, local } o null; local dice si uri es la copia del celular.
export const fotoAMostrar = (guardada, fotoServidor) => {
  if (fotoServidor) {
    return guardada?.uri && guardada.servidor === fotoServidor
      ? { uri: guardada.uri, local: true }
      : { uri: fotoServidor, local: false };
  }
  return guardada?.uri ? { uri: guardada.uri, local: true } : null;
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

const ERROR_SESION =
  "Tu sesión venció. Volvé a iniciar sesión para cambiar la foto.";

// Guarda la foto nueva de la cuenta: la sube a la API y deja la copia en el
// celular. Devuelve:
//   { ok: true, uri, servidor, usuario } — uri es la foto para mostrar,
//     servidor su dirección en la API y usuario el que devolvió la API, con
//     "foto" ya cambiada (la sesión local también queda actualizada);
//   { ok: false, error } — falló y no se cambió nada.
export const guardarFotoPerfil = async (uid, uri) => {
  const res = await subirFotoPerfil(uid, uri);
  if (!res.ok) {
    if (res.status === 0) {
      return { ok: false, error: "No hay conexión. La foto no se guardó." };
    }
    // Del 401 se encarga apiFetch: avisa que la sesión venció y
    // app/_layout.tsx saca al login. Acá solo se dice por qué (se ve un
    // momento, hasta que la app navega sola).
    if (res.status === 401) {
      return { ok: false, error: ERROR_SESION };
    }
    return {
      ok: false,
      error: res.error || "No se pudo guardar la foto. Probá de nuevo.",
    };
  }

  const usuario = res.usuario;
  const servidor =
    typeof usuario?.foto === "string" && usuario.foto ? usuario.foto : null;

  // La copia local, anotada con la dirección que la API le dio. Si copiar
  // falla no pasa nada: se muestra la del servidor.
  const copia = await guardarFotoLocal(uid, uri, servidor);

  // La sesión queda con el usuario nuevo (foto incluida), sin perder el
  // sesion_id ni el token (guardarSesion no los toca si no se los pasan)
  try {
    const sesion = await obtenerSesion();
    if (sesion && String(sesion.id) === String(uid)) {
      await guardarSesion({ ...sesion, ...usuario }, await obtenerSesionId());
    }
  } catch (e) {
    console.log("No se pudo actualizar la sesión con la foto nueva:", e);
  }

  return { ok: true, uri: copia || servidor || uri, servidor, usuario };
};

// Quita la foto del celular. Devuelve true si se pudo. Solo se usa cuando la
// foto que se ve es una copia local que no está en el servidor: borrar una
// foto allá todavía no se puede (el profesor está armando esa parte).
// TODO (API): cuando exista cómo borrar la foto del servidor, llamarla acá,
// actualizar la sesión con el usuario sin foto, y en la pantalla ofrecer
// "Quitar foto" también para las fotos del servidor.
export const quitarFotoPerfil = async (uid) => {
  return await borrarFotoLocal(uid);
};
