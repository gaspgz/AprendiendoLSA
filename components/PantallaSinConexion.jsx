import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

// Sin conexión: alguno de los dos dice false. null quiere decir "todavía no
// se sabe" y no cuenta: así la pantalla no aparece un instante al abrir la app
const estaSinConexion = (estado) =>
  estado.isConnected === false || estado.isInternetReachable === false;

// Antes de bloquear se espera y se confirma: un corte corto (por ejemplo, al
// pasar del wifi a los datos) no muestra nada
const ESPERA_PARA_BLOQUEAR = 1500;
const DURACION_FADE = 200;

const TITULO = "Sin conexión a internet";
const SIGUE_SIN_CONEXION = "Todavía sin conexión";

// Lector de pantalla. En web announceForAccessibility no hace nada: ahí
// avisan los textos con role="alert"
const anunciar = (texto) => {
  if (Platform.OS === "ios") {
    // queue: espera a que VoiceOver termine lo que estaba diciendo
    AccessibilityInfo.announceForAccessibilityWithOptions(texto, {
      queue: true,
    });
  } else if (Platform.OS === "android") {
    AccessibilityInfo.announceForAccessibility(texto);
  }
};
const ROL_ALERTA = Platform.OS === "web" ? "alert" : undefined;

// Escucha a NetInfo y dice cuándo bloquear: recién si 1,5 s después sigue sin
// conexión. Cuando vuelve, desbloquea al instante.
const useSinConexion = () => {
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    let ultimoEstado = null;
    let espera = null;

    const desuscribir = NetInfo.addEventListener((estado) => {
      ultimoEstado = estado;
      if (!estaSinConexion(estado)) {
        clearTimeout(espera);
        espera = null;
        setBloqueado(false);
        return;
      }
      if (espera) return; // ya está esperando para confirmar
      espera = setTimeout(() => {
        espera = null;
        // Si hubiera vuelto, la espera ya estaría cancelada; igual se
        // confirma con el último estado antes de bloquear
        if (estaSinConexion(ultimoEstado)) setBloqueado(true);
      }, ESPERA_PARA_BLOQUEAR);
    });

    return () => {
      clearTimeout(espera);
      desuscribir();
    };
  }, []);

  return [bloqueado, setBloqueado];
};

// iOS: FullWindowOverlay (react-native-screens) agrega la capa a la ventana,
// encima de todo, también de un Modal abierto. Un Modal de RN no alcanza: iOS
// lo presenta desde el controlador raíz y, si ya hay otro Modal presentado, no
// aparece. Su contenedor ya viene con accessibilityViewIsModal.
const CapaIOS = ({ children }) => (
  <FullWindowOverlay>{children}</FullWindowOverlay>
);

// Android y web: un Modal. En Android es otra ventana (Dialog), que queda
// encima de cualquier otro Modal abierto; en web su portal se agrega al body
// al montarse, después de los que ya estaban, y queda arriba.
const CapaModal = ({ children }) => (
  <Modal
    visible
    transparent
    animationType="none" // el fade lo hace Animated, más corto
    statusBarTranslucent // Android: tapa también la barra de estado
    navigationBarTranslucent // y la de navegación
    onRequestClose={() => {}} // Android: el botón "atrás" no hace nada
  >
    {children}
  </Modal>
);

const Capa = Platform.OS === "ios" ? CapaIOS : CapaModal;

// Lo que se ve: fondo lila claro en toda la pantalla y una tarjeta al centro
const ContenidoSinConexion = ({ opacidad, onVolvio }) => {
  const insets = useSafeAreaInsets();
  const [comprobando, setComprobando] = useState(false);
  const [sigueSinConexion, setSigueSinConexion] = useState(false);

  const reintentar = async () => {
    setComprobando(true);
    setSigueSinConexion(false);
    let estado = null;
    try {
      estado = await NetInfo.refresh();
    } catch {
      // si no se pudo comprobar, se toma como que sigue sin conexión
    }
    setComprobando(false);
    if (estado && !estaSinConexion(estado)) {
      onVolvio();
    } else {
      setSigueSinConexion(true);
      anunciar(SIGUE_SIN_CONEXION);
    }
  };

  return (
    <Animated.View
      style={[
        styles.fondo,
        {
          opacity: opacidad,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        },
      ]}
      accessibilityViewIsModal // iOS: VoiceOver no recorre lo de abajo
    >
      {/* Sombra en Android: elevation y overflow:'hidden' se cancelan, así
          que van dos Views (afuera la sombra, adentro el borde redondeado) */}
      <View style={styles.sombraTarjeta}>
        <View style={styles.tarjeta}>
          <Text style={styles.icono} aria-hidden>
            📡
          </Text>
          <Text style={styles.titulo} role={ROL_ALERTA ?? "header"}>
            {TITULO}
          </Text>
          <Text style={styles.texto}>
            Para seguir aprendiendo necesitás estar conectado. Cuando vuelva la
            señal, seguís donde estabas.
          </Text>
          <TouchableOpacity
            style={[styles.boton, comprobando && styles.botonDeshabilitado]}
            onPress={reintentar}
            disabled={comprobando}
            accessibilityRole="button"
            accessibilityState={{ disabled: comprobando, busy: comprobando }}
          >
            <Text style={styles.botonTxt}>
              {comprobando ? "Comprobando..." : "Reintentar"}
            </Text>
          </TouchableOpacity>
          {sigueSinConexion && (
            <Text style={styles.sigue} role={ROL_ALERTA}>
              {SIGUE_SIN_CONEXION}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Bloquea toda la app mientras no hay internet: el login, el progreso, las
// vidas y el XP dependen de la API, y lo que se hiciera sin conexión podría no
// llegar al servidor. Envuelve a la app (children), que sigue montada debajo:
// cuando vuelve la conexión, cada pantalla sigue donde estaba.
export default function PantallaSinConexion({ children }) {
  const [bloqueado, setBloqueado] = useSinConexion();
  // La capa sigue montada durante el fade de salida
  const [montada, setMontada] = useState(false);
  const [bloqueadoAntes, setBloqueadoAntes] = useState(bloqueado);
  if (bloqueado !== bloqueadoAntes) {
    setBloqueadoAntes(bloqueado);
    if (bloqueado) setMontada(true);
  }
  const [opacidad] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!montada) return;
    if (bloqueado) {
      Keyboard.dismiss(); // que no se pueda seguir escribiendo en lo de abajo
      anunciar(TITULO);
    }
    const fade = Animated.timing(opacidad, {
      toValue: bloqueado ? 1 : 0,
      duration: DURACION_FADE,
      useNativeDriver: Platform.OS !== "web",
    });
    fade.start(({ finished }) => {
      if (finished && !bloqueado) setMontada(false);
    });
    return () => fade.stop();
  }, [bloqueado, montada, opacidad]);

  return (
    <>
      {/* La app sigue montada y, mientras está bloqueada, oculta para el
          lector de pantalla: importantForAccessibility en Android, aria-hidden
          en iOS y web. collapsable={false}: esta View existe siempre en
          nativo, así que cambiar estas props no mueve las pantallas */}
      <View
        style={styles.app}
        collapsable={false}
        importantForAccessibility={bloqueado ? "no-hide-descendants" : "auto"}
        aria-hidden={bloqueado}
      >
        {children}
      </View>
      {/* Se monta recién al bloquear: así queda encima de lo que ya estaba
          abierto */}
      {montada && (
        <Capa>
          <ContenidoSinConexion
            opacidad={opacidad}
            onVolvio={() => setBloqueado(false)}
          />
        </Capa>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  fondo: {
    flex: 1,
    backgroundColor: "#EEF1FB",
    alignItems: "center",
    justifyContent: "center",
  },
  sombraTarjeta: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tarjeta: {
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  icono: { fontSize: 56, marginBottom: 16 },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 10,
  },
  texto: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  // Igual que los botones principales de la app
  boton: {
    alignSelf: "stretch",
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTxt: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },
  sigue: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 12 },
});
