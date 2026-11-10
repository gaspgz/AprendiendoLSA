import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { GIFS_NUBE } from "../constants/gifsNube";

// Link de la seña en la nube (constants/gifsNube.js), o null si no tiene
export const linkDeSena = (clave) => GIFS_NUBE[clave] ?? null;

// Una seña desde su clave (la de NIVELES: "A", "CH", "hola", "n10"...). El GIF
// se baja de la nube y expo-image lo guarda en la caché del disco: cada GIF se
// baja una sola vez por celular.
// - style: la caja del GIF (su tamaño, el mismo que tenía el Image). Mientras
//   carga se ve el fondo de quien la contiene con una ruedita, sin que cambie
//   el tamaño.
// - Si no carga, o si la clave no tiene link: "No se pudo cargar la seña" y
//   "Reintentar", que la vuelve a pedir.
// - compacto: para cajas chicas (las letras de "¿qué palabra está
//   deletreando?").
export default function SenaGif({
  clave,
  style,
  contentFit = "contain",
  compacto = false,
}) {
  // Otra clave es otra seña: se monta de cero (con su ruedita y su error)
  return (
    <CajaSena
      key={clave}
      clave={clave}
      style={style}
      contentFit={contentFit}
      compacto={compacto}
    />
  );
}

const CajaSena = ({ clave, style, contentFit, compacto }) => {
  const link = linkDeSena(clave);
  // "cargando" | "lista" | "error"
  const [estado, setEstado] = useState(link ? "cargando" : "error");
  // Cada reintento monta un Image nuevo, que vuelve a pedir el GIF
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!link)
      console.warn(
        `[SenaGif] La seña "${clave}" no tiene link en constants/gifsNube.js`,
      );
  }, [link, clave, intento]);

  const reintentar = () => {
    if (link) setEstado("cargando");
    setIntento((n) => n + 1);
  };

  return (
    <View style={style}>
      {link && (
        <Image
          key={intento}
          source={{ uri: link }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          cachePolicy="disk"
          onLoad={() => setEstado("lista")}
          onError={() => setEstado("error")}
        />
      )}
      {estado === "cargando" && (
        <View style={styles.capa}>
          <ActivityIndicator
            color="#3D4FBB"
            size={compacto ? "small" : "large"}
            accessibilityLabel="Cargando la seña"
          />
        </View>
      )}
      {estado === "error" && (
        <View style={[styles.capa, compacto && styles.capaCompacta]}>
          <Text
            style={[styles.errorTxt, compacto && styles.errorTxtCompacto]}
            numberOfLines={3}
          >
            No se pudo cargar la seña
          </Text>
          <TouchableOpacity
            style={[styles.boton, compacto && styles.botonCompacto]}
            onPress={reintentar}
            accessibilityRole="button"
          >
            <Text
              style={[styles.botonTxt, compacto && styles.botonTxtCompacto]}
            >
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Encima del GIF, del mismo tamaño que la caja
  capa: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 10,
  },
  capaCompacta: { padding: 4, gap: 4 },
  errorTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  errorTxtCompacto: { fontSize: 10 },
  // Como los botones de la app, más chico
  boton: {
    backgroundColor: "#C8D3F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  botonCompacto: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 4 },
  botonTxt: { fontSize: 13, fontWeight: "bold", color: "#1A1A2E" },
  botonTxtCompacto: { fontSize: 10 },
});
