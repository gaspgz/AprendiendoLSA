import { router, usePathname } from "expo-router";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "index", ruta: "/", icono: "🏠", label: "Home" },
  { name: "SenasScreen", ruta: "/SenasScreen", icono: "🤟", label: "Señas" },
  {
    name: "ProfileScreen",
    ruta: "/ProfileScreen",
    icono: "👤",
    label: "Perfil",
  },
];

const COLOR_BAR = "#C8D3F5";

export default function CustomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const esActivo = (tab) => {
    if (tab.name === "index") return pathname === "/" || pathname === "/index";
    return pathname.startsWith(tab.ruta);
  };

  return (
    <>
      {/* Android: tiñe la barra de notificaciones */}
      <StatusBar
        backgroundColor={COLOR_BAR}
        barStyle="dark-content"
        translucent={false}
      />

      {/*
        Estructura de dos capas para Android:
        - Capa exterior: maneja la sombra (elevation)
        - Capa interior: maneja el border radius + overflow:hidden
        En iOS la sombra funciona con border radius directamente.
      */}
      <View style={styles.sombra}>
        <View style={styles.contenedor}>
          {/* Fila de tabs */}
          <View style={styles.filatabs}>
            {TABS.map((tab) => {
              const activo = esActivo(tab);
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tabItem}
                  onPress={() => router.push(tab.ruta)}
                  activeOpacity={0.7}
                >
                  {/*
                    Dos capas igual que sombra+contenedor del tab bar:
                    - exterior: elevation/shadow (necesita backgroundColor para
                      que Android calcule el outline redondeado en cada render)
                    - interior: overflow:hidden para clipear al borderRadius
                  */}
                  <View style={[styles.iconoShadowLayer, activo && styles.iconoShadowLayerActivo]}>
                    <View style={[styles.iconoWrap, activo && styles.iconoWrapActivo]}>
                      <Text style={styles.icono}>{tab.icono}</Text>
                    </View>
                  </View>
                  <Text style={[styles.label, activo && styles.labelActivo]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/*
            Rellena el espacio del home indicator en iOS (la línea de abajo).
            En Android insets.bottom suele ser 0, así que no agrega espacio extra.
          */}
          <View style={{ height: insets.bottom, backgroundColor: COLOR_BAR }} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Capa exterior — solo maneja la sombra en Android
  sombra: {
    backgroundColor: COLOR_BAR,
    // iOS: la sombra funciona acá directamente
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Android: elevation acá, separada del overflow
    elevation: 12,
  },

  // Capa interior — maneja el border radius y el clip
  contenedor: {
    backgroundColor: COLOR_BAR,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // overflow:hidden para que el border radius se vea en Android
    // sin afectar la sombra de la capa exterior
    overflow: "hidden",
  },

  filatabs: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
    justifyContent: "space-around",
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  // Capa exterior — solo shadow/elevation (backgroundColor necesario para
  // que Android calcule un outline redondeado y no cuadrado)
  iconoShadowLayer: {
    borderRadius: 17,
  },
  iconoShadowLayerActivo: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#3D4FBB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Capa interior — clip redondeado del contenido
  iconoWrap: {
    width: 48,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconoWrapActivo: {
    backgroundColor: "#fff",
  },

  icono: { fontSize: 20 },

  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#7A86C0",
  },

  labelActivo: {
    fontWeight: "700",
    color: "#1A1A2E",
  },
});
