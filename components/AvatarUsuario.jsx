import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { obtenerFotoLocal } from "../services/fotoPerfil";

// ─── Avatar de una cuenta ────────────────────────────────────────────
// Foto redonda de una cuenta: el botón del mapa y, más adelante, el ranking.
// Muestra, en este orden:
//   1. la foto guardada en el celular para ese uid (services/fotoPerfil.js);
//   2. si no hay, fotoApi (el campo foto del usuario), si es un link o un
//      data URI;
//   3. si no hay, o si la imagen no carga, las iniciales del nombre, como el
//      avatar del Perfil.
// Props:
//   - uid y nombre: de quién es.
//   - fotoApi: opcional, el campo foto del usuario.
//   - tamano: el diámetro, en px.
//   - version: un valor que cambia cuando se guarda o se quita la foto (el de
//     versionFotoPerfil, en services/fotoPerfil.js). Si cambia, la foto del
//     celular se vuelve a leer; si no, no se toca nada.

// Lo último que se leyó del celular de cada cuenta: { version, uri }. Si el
// avatar se vuelve a montar con la misma versión (el mapa, al volver de un
// nivel), arranca con esto y no espera la lectura: así no parpadea.
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

  // La foto del celular (uri, o null si no tiene), con la cuenta y la versión
  // para las que se leyó. Solo se usa si es de esta cuenta: así nunca se ve
  // la de otra, aunque el uid cambie mientras se lee.
  const [local, setLocal] = useState(() => {
    const leida = cuenta == null ? undefined : leidas.get(cuenta);
    return leida?.version === version
      ? { cuenta, ...leida }
      : { cuenta: null, version: null, uri: null };
  });
  // La imagen que no se pudo mostrar ({ clave, uri }): ahí van las iniciales
  const [rota, setRota] = useState(null);

  useEffect(() => {
    if (cuenta == null) return;
    let cancelado = false;
    obtenerFotoLocal(cuenta).then((uri) => {
      if (cancelado) return; // ya cambió la cuenta o la versión
      leidas.set(cuenta, { version, uri });
      // Si es lo mismo que ya se ve, no se vuelve a dibujar
      setLocal((prev) =>
        prev.cuenta === cuenta && prev.version === version && prev.uri === uri
          ? prev
          : { cuenta, version, uri },
      );
    });
    return () => {
      cancelado = true;
    };
  }, [cuenta, version]);

  // Hasta la primera lectura no se sabe si hay foto en el celular: se ve
  // solo el círculo (ni fotoApi ni las iniciales, que enseguida cambiarían)
  const deEstaCuenta = local.cuenta === cuenta;
  const sabida = cuenta == null || deEstaCuenta;
  const fotoLocal = deEstaCuenta ? local.uri : null;
  const fuente = !sabida
    ? null
    : fotoLocal || (esFotoValida(fotoApi) ? fotoApi.trim() : null);

  // Otra cuenta, otra versión o la otra foto → otro Image, que se monta de
  // cero. La foto del celular siempre está en el mismo archivo: sin caché y
  // con otra key cuando cambia (como en el Perfil), si no se vería la vieja.
  const claveImagen = fotoLocal
    ? `${cuenta}|celular|${local.version}`
    : `${cuenta}|api`;
  const estaRota = rota?.clave === claveImagen && rota?.uri === fuente;

  const redondo = { width: tamano, height: tamano, borderRadius: tamano / 2 };

  return (
    <View style={[styles.circulo, redondo]}>
      {fuente && !estaRota ? (
        <Image
          key={claveImagen}
          source={{ uri: fuente }}
          style={redondo}
          contentFit="cover"
          cachePolicy={fotoLocal ? "none" : "disk"}
          onError={() => setRota({ clave: claveImagen, uri: fuente })}
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
