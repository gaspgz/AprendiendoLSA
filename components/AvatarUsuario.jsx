import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fotoAMostrar, obtenerFotoLocal } from "../services/fotoPerfil";

// ─── Avatar de una cuenta ────────────────────────────────────────────
// Foto redonda de una cuenta: el botón del mapa y, más adelante, el ranking.
// Qué se muestra lo decide fotoAMostrar (services/fotoPerfil.js) entre:
//   1. la copia guardada en el celular para ese uid, si es de la misma foto
//      que tiene el servidor (carga al instante) o si el servidor no tiene;
//   2. fotoApi (el campo foto del usuario), si es un link o un data URI:
//      manda cuando es una foto distinta de la copiada;
//   3. si no hay ninguna, o si la imagen no carga, las iniciales del nombre,
//      como el avatar del Perfil.
// Props:
//   - uid y nombre: de quién es.
//   - fotoApi: opcional, el campo foto del usuario.
//   - tamano: el diámetro, en px.
//   - version: un valor que cambia cuando se guarda o se quita la foto (el de
//     versionFotoPerfil, en services/fotoPerfil.js). Si cambia, la copia del
//     celular se vuelve a leer; si no, no se toca nada.

// Lo último que se leyó del celular de cada cuenta: { version, guardada }.
// Si el avatar se vuelve a montar con la misma versión (el mapa, al volver
// de un nivel), arranca con esto y no espera la lectura: así no parpadea.
const leidas = new Map();

// Un link (http o https) o el data URI de una imagen
const esFotoValida = (foto) =>
  typeof foto === "string" && /^(https?:\/\/|data:image\/)/i.test(foto.trim());

// "Ana María" → "AM", igual que en el Perfil
const inicialesDe = (nombre) =>
  String(nombre ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function AvatarUsuario({
  uid,
  nombre,
  fotoApi = null,
  tamano = 40,
  version = 0,
}) {
  const cuenta = uid == null ? null : String(uid).trim();

  // La copia del celular ({ uri, servidor } o null si no tiene), con la
  // cuenta y la versión para las que se leyó. Solo se usa si es de esta
  // cuenta: así nunca se ve la de otra, aunque el uid cambie mientras se lee.
  const [local, setLocal] = useState(() => {
    const leida = cuenta == null ? undefined : leidas.get(cuenta);
    return leida?.version === version
      ? { cuenta, version, guardada: leida.guardada }
      : { cuenta: null, version: null, guardada: null };
  });
  // La imagen que no se pudo mostrar ({ clave, uri }): ahí van las iniciales
  const [rota, setRota] = useState(null);

  useEffect(() => {
    if (cuenta == null) return;
    let cancelado = false;
    obtenerFotoLocal(cuenta).then((guardada) => {
      if (cancelado) return; // ya cambió la cuenta o la versión
      leidas.set(cuenta, { version, guardada });
      // Si es lo mismo que ya se ve, no se vuelve a dibujar
      setLocal((prev) =>
        prev.cuenta === cuenta &&
        prev.version === version &&
        prev.guardada?.uri === guardada?.uri &&
        prev.guardada?.servidor === guardada?.servidor
          ? prev
          : { cuenta, version, guardada },
      );
    });
    return () => {
      cancelado = true;
    };
  }, [cuenta, version]);

  // Hasta la primera lectura no se sabe si hay copia en el celular: se ve
  // solo el círculo (ni fotoApi ni las iniciales, que enseguida cambiarían)
  const deEstaCuenta = local.cuenta === cuenta;
  const sabida = cuenta == null || deEstaCuenta;
  const fotoServidor = esFotoValida(fotoApi) ? fotoApi.trim() : null;
  const mostrada = sabida
    ? fotoAMostrar(deEstaCuenta ? local.guardada : null, fotoServidor)
    : null;

  // Otra cuenta, otra versión u otra dirección → otro Image, que se monta de
  // cero. La copia del celular está siempre en el mismo archivo: sin caché y
  // con otra key cuando cambia (como en el Perfil), si no se vería la vieja.
  // La del servidor va a la caché de disco, con su dirección en la key (cada
  // subida da una dirección nueva).
  const claveImagen = mostrada?.local
    ? `${cuenta}|celular|${local.version}`
    : `${cuenta}|api|${mostrada?.uri}`;
  const estaRota = rota?.clave === claveImagen && rota?.uri === mostrada?.uri;

  const redondo = { width: tamano, height: tamano, borderRadius: tamano / 2 };

  return (
    <View style={[styles.circulo, redondo]}>
      {mostrada && !estaRota ? (
        <Image
          key={claveImagen}
          source={{ uri: mostrada.uri }}
          style={redondo}
          contentFit="cover"
          cachePolicy={mostrada.local ? "none" : "disk"}
          onError={() => setRota({ clave: claveImagen, uri: mostrada.uri })}
        />
      ) : sabida ? (
        // El círculo no crece con la letra grande del sistema: las iniciales
        // tampoco, si no, no entrarían
        <Text
          style={[styles.iniciales, { fontSize: tamano / 3 }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {inicialesDe(nombre)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Como avatarFallback y avatarIniciales del Perfil: 96 px con letra de 32,
  // o sea, la letra es un tercio del tamaño
  circulo: {
    backgroundColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iniciales: { fontWeight: "800", color: "#3D4FBB" },
});
