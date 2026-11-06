import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO = require("../assets/images/logo.png");

// Misma regla que PantallaSinConexion: null ("todavía no se sabe") no cuenta
const estaSinConexion = (estado) =>
  estado.isConnected === false || estado.isInternetReachable === false;

// true / false, o null mientras NetInfo todavía no avisó (al suscribirse avisa
// enseguida el último estado que conoce)
const useConectado = () => {
  const [conectado, setConectado] = useState(null);
  useEffect(
    () =>
      NetInfo.addEventListener((estado) =>
        setConectado(!estaSinConexion(estado)),
      ),
    [],
  );
  return conectado;
};

// Lector de pantalla. En web announceForAccessibility no hace nada: ahí
// avisa la región aria-live del final
const anunciar = (texto) => {
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibilityWithOptions(texto, {
      queue: true,
    });
  } else if (Platform.OS === "android") {
    AccessibilityInfo.announceForAccessibility(texto);
  }
};

// ─── Mini dibujos: copias en chico de partes reales de la app ─────────

// Colores de NivelCirculo (index.jsx)
const COLORES_NIVEL = {
  completado: { fondo: "#F5CE5A", borde: "#C9A227", texto: "#5A3E00" },
  actual: { fondo: "#F5CE5A", borde: "#E8A000", texto: "#3D2800" },
  bloqueado: { fondo: "#D9D9D9", borde: "#AAAAAA", texto: "#888888" },
};

// Círculo del mapa. El anillo del nivel en curso es 1,2 veces el círculo,
// como pulsoAnillo
const CirculoNivel = ({ numero, estado, tamano }) => {
  const colores = COLORES_NIVEL[estado];
  const anillo = Math.round(tamano * 1.2);
  return (
    <View style={[styles.circuloLugar, { width: anillo, height: anillo }]}>
      {estado === "actual" && (
        <View
          style={[
            styles.anillo,
            { width: anillo, height: anillo, borderRadius: anillo / 2 },
          ]}
        />
      )}
      <View
        style={[
          styles.circulo,
          {
            width: tamano,
            height: tamano,
            borderRadius: tamano / 2,
            backgroundColor: colores.fondo,
            borderColor: colores.borde,
          },
        ]}
      >
        <Text
          style={[
            styles.circuloNumero,
            { color: colores.texto, fontSize: Math.round(tamano * 0.28) },
          ]}
        >
          {numero}
        </Text>
        {estado === "completado" && <Text style={styles.circuloCheck}>✓</Text>}
      </View>
    </View>
  );
};

const DibujoLogo = () => (
  <Image source={LOGO} style={styles.logo} resizeMode="contain" />
);

const DibujoNiveles = () => (
  <View style={styles.centrado}>
    <View style={styles.filaCirculos}>
      {[
        ["I", "completado", "Completado"],
        ["II", "actual", "En curso"],
        ["III", "bloqueado", "Bloqueado"],
      ].map(([numero, estado, etiqueta]) => (
        <View key={numero} style={styles.circuloConEtiqueta}>
          <CirculoNivel numero={numero} estado={estado} tamano={52} />
          <Text style={styles.etiqueta}>{etiqueta}</Text>
        </View>
      ))}
    </View>
    {/* La pastilla va sobre el lila del header, como en el mapa */}
    <View style={styles.franja}>
      <View style={styles.pastilla}>
        <Text style={styles.pastillaEmoji}>📚</Text>
        <Text style={styles.pastillaTxt}>Nivel II</Text>
      </View>
    </View>
  </View>
);

// Como ItemQuePalabraOpciones después de responder bien
const DibujoOpciones = () => (
  <View style={styles.opciones}>
    {["chau", "hola", "gracias", "perdón"].map((opcion, i) => (
      <View
        key={opcion}
        style={[styles.opcion, i === 1 && styles.opcionCorrecta]}
      >
        <Text style={styles.opcionLetra}>{["A", "B", "C", "D"][i]}</Text>
        <Text style={styles.opcionTxt}>{opcion}</Text>
      </View>
    ))}
  </View>
);

// Corazones del header del mapa (el apagado, con opacity 0.2) y el contador
// con el formato de formatCountdown
const DibujoVidas = () => (
  <View style={styles.centrado}>
    <View style={[styles.franja, styles.franjaVidas]}>
      {[0, 1, 2].map((i) => (
        <Text key={i} style={[styles.corazon, i === 2 && styles.apagado]}>
          ❤️
        </Text>
      ))}
    </View>
    <Text style={styles.proximaVida}>Próxima vida en 01:59:00</Text>
  </View>
);

// Como StatCard del perfil
const Estadistica = ({ icono, valor, etiqueta, color }) => (
  <View style={[styles.stat, { borderColor: color + "55" }]}>
    <Text style={styles.statIcono}>{icono}</Text>
    <Text style={[styles.statValor, { color }]}>{valor}</Text>
    <Text style={styles.statEtiqueta}>{etiqueta}</Text>
  </View>
);

const DibujoProgreso = () => (
  <View style={styles.fila}>
    <Estadistica icono="⭐" valor="50" etiqueta="XP total" color="#E8A000" />
    {/* 7 = NIVELES.length en index.jsx */}
    <Estadistica icono="🎯" valor="1/7" etiqueta="Niveles" color="#2E7D32" />
  </View>
);

// La pestaña Señas (ícono y nombre de CustomTabBar), el buscador y dos
// tarjetas de la grilla con los colores de sus categorías
const DibujoSenas = () => (
  <View style={styles.centrado}>
    <View style={[styles.franja, styles.franjaPestana]}>
      <View style={styles.pestanaIcono}>
        <Text style={styles.pestanaEmoji}>🤟</Text>
      </View>
      <Text style={styles.pestanaTxt}>Señas</Text>
    </View>
    <View style={styles.buscador}>
      <Text style={styles.buscadorIcono}>🔍</Text>
      <Text style={styles.buscadorTxt}>Buscar seña...</Text>
    </View>
    <View style={styles.fila}>
      <View style={[styles.tarjetaSena, styles.senaAbecedario]}>
        <Text style={[styles.senaLetra, styles.senaAbecedarioTxt]}>A</Text>
      </View>
      <View style={[styles.tarjetaSena, styles.senaInteracciones]}>
        <Text style={[styles.senaPalabra, styles.senaInteraccionesTxt]}>
          Hola
        </Text>
      </View>
    </View>
  </View>
);

const DibujoFinal = () => (
  <CirculoNivel numero="I" estado="actual" tamano={72} />
);

// ─── Los 7 pasos ─────────────────────────────────────────────────────
const armarPasos = ({ nombre, desdeMenu }) => [
  {
    titulo: nombre
      ? `¡Te damos la bienvenida, ${nombre}!`
      : "¡Te damos la bienvenida!",
    texto:
      "Con Aprendiendo LSA vas a aprender Lengua de Señas Argentina paso a paso. Gran mayoría de las señas fueron validadas por Cambiando miradas, una organización de la comunidad sorda.",
    nota: "Podés volver a ver este tutorial cuando quieras desde el menú 👤.",
    Dibujo: DibujoLogo,
  },
  {
    titulo: "Tu camino de niveles",
    texto:
      "Cada círculo del mapa es un nivel. Empezás por el I, y cuando terminás todas sus lecciones se desbloquea el siguiente. Arriba siempre ves en qué nivel estás.",
    Dibujo: DibujoNiveles,
  },
  {
    titulo: "Lecciones y ejercicios",
    texto:
      "Tocá un nivel para ver sus lecciones. En cada lección primero mirás las señas nuevas y después practicás: elegir la seña correcta, reconocer una palabra, escribirla o armar una frase. Para avanzar, cada respuesta tiene que estar bien.",
    Dibujo: DibujoOpciones,
  },
  {
    titulo: "Tus vidas",
    // 3 vidas y 2 horas: checkRegenVidas y DOS_HORAS_MS en index.jsx
    texto:
      "Tenés 3 vidas. Cada error te saca una, y se recupera una vida cada 2 horas. Si te quedás sin vidas, esperás a que se recargue alguna para seguir.",
    Dibujo: DibujoVidas,
  },
  {
    titulo: "Tu progreso",
    texto:
      "Cada lección que terminás te da XP ⭐. En tu perfil ves tu XP, los niveles que completaste y tus logros.",
    Dibujo: DibujoProgreso,
  },
  {
    titulo: "El diccionario de señas",
    texto:
      "En la pestaña Señas están todas las señas ordenadas por categoría. Podés buscar cualquier palabra y tocarla para ver la seña.",
    Dibujo: DibujoSenas,
  },
  {
    titulo: "¡Todo listo!",
    texto: `Necesitás estar conectado a internet para que se guarde tu progreso. ${
      desdeMenu ? "¡Seguí aprendiendo!" : "¡Ya podés empezar con el Nivel I!"
    }`,
    Dibujo: DibujoFinal,
  },
];

// Tutorial a pantalla completa (tapa la tab bar). Se usa solo para cuentas
// nuevas o desde el menú 👤; quien lo abre decide qué pasa al cerrarlo.
export default function Tutorial({ visible, nombre, desdeMenu, onCerrar }) {
  const insets = useSafeAreaInsets();
  const conectado = useConectado();
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  // Se abre recién cuando se sabe que hay conexión: si se abriera con la
  // pantalla sin conexión ya puesta, quedaría encima de ella. Una vez abierto
  // queda abierto (si se corta, el bloqueo va encima y al volver sigue en el
  // mismo paso).
  if (visible && !abierto && conectado === true) {
    setAbierto(true);
    setPaso(0); // siempre desde el paso 1
  }
  if (!visible && abierto) setAbierto(false);

  const pasos = armarPasos({ nombre: nombre?.trim(), desdeMenu });
  const { titulo, texto, nota, Dibujo } = pasos[paso];
  const esPrimero = paso === 0;
  const esUltimo = paso === pasos.length - 1;
  const textoFinal = desdeMenu ? "Listo" : "¡Empezar!";
  const anuncio = `Paso ${paso + 1} de ${pasos.length}: ${titulo}`;

  useEffect(() => {
    if (abierto) anunciar(anuncio);
  }, [abierto, anuncio]);

  const anterior = () => setPaso((p) => Math.max(0, p - 1));
  const siguiente = () => {
    if (esUltimo) onCerrar();
    else setPaso((p) => p + 1);
  };
  // Botón "atrás" de Android: paso anterior; en el primero, igual que Omitir
  const atras = () => {
    if (esPrimero) onCerrar();
    else anterior();
  };

  return (
    <Modal
      visible={abierto}
      transparent
      animationType="fade"
      statusBarTranslucent // Android: tapa también la barra de estado
      navigationBarTranslucent // y la de navegación
      onRequestClose={atras}
    >
      <View
        style={[
          styles.fondo,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
          },
        ]}
      >
        <View style={styles.arriba}>
          <Text style={styles.contador}>
            Paso {paso + 1} de {pasos.length}
          </Text>
          {!esUltimo && (
            <TouchableOpacity
              onPress={onCerrar}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Omitir tutorial"
            >
              <Text style={styles.omitir}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tarjeta: si el texto no entra, scrollea por dentro. Sombra en
            Android: elevation y overflow:'hidden' se cancelan, así que van
            dos Views (afuera la sombra, adentro el borde redondeado) */}
        <View style={styles.centro}>
          <View style={styles.sombraTarjeta}>
            <View style={styles.tarjeta}>
              <ScrollView
                style={styles.tarjetaScroll}
                contentContainerStyle={styles.tarjetaContenido}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.dibujo} aria-hidden>
                  <Dibujo />
                </View>
                <Text style={styles.titulo} role="header">
                  {titulo}
                </Text>
                <Text style={styles.texto}>{texto}</Text>
                {nota && <Text style={styles.nota}>{nota}</Text>}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.puntos} aria-hidden>
          {pasos.map((_, i) => (
            <View
              key={i}
              style={[styles.punto, i === paso && styles.puntoActual]}
            />
          ))}
        </View>
        <View style={styles.botones}>
          {!esPrimero && (
            <TouchableOpacity
              style={[styles.boton, styles.botonAtras]}
              onPress={anterior}
              accessibilityRole="button"
              accessibilityLabel="Paso anterior"
            >
              <Text style={styles.botonAtrasTxt}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.boton, styles.botonSiguiente]}
            onPress={siguiente}
            accessibilityRole="button"
            accessibilityLabel={esUltimo ? textoFinal : "Paso siguiente"}
          >
            <Text style={styles.botonSiguienteTxt}>
              {esUltimo ? textoFinal : "Siguiente"}
            </Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === "web" && (
          <Text style={styles.soloLector} aria-live="polite">
            {anuncio}
          </Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#EEF1FB" },
  arriba: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
    marginBottom: 12,
  },
  contador: { fontSize: 13, fontWeight: "600", color: "#888" },
  omitir: { fontSize: 15, fontWeight: "700", color: "#3D4FBB" },

  centro: { flex: 1, justifyContent: "center" },
  sombraTarjeta: {
    flexShrink: 1,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tarjeta: { flexShrink: 1, borderRadius: 20, overflow: "hidden" },
  tarjetaScroll: { flexGrow: 0 },
  tarjetaContenido: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  dibujo: { alignItems: "center", justifyContent: "center", marginBottom: 20 },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 10,
  },
  texto: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
  nota: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 14,
  },

  puntos: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 16,
  },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C8D3F5" },
  puntoActual: { width: 20, backgroundColor: "#3D4FBB" },
  botones: { flexDirection: "row", gap: 12 },
  // Como los botones principales de la app
  boton: {
    flex: 1,
    height: 52,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  botonAtras: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
  },
  botonAtrasTxt: { fontSize: 16, fontWeight: "bold", color: "#3D4FBB" },
  botonSiguiente: { backgroundColor: "#C8D3F5" },
  botonSiguienteTxt: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },
  soloLector: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },

  // ── Mini dibujos ──
  centrado: { alignItems: "center" },
  fila: { flexDirection: "row", justifyContent: "center", gap: 10 },
  franja: {
    backgroundColor: "#C8D3F5",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logo: { width: 110, height: 110 },

  filaCirculos: { flexDirection: "row", justifyContent: "center", gap: 10 },
  circuloConEtiqueta: { alignItems: "center", width: 78 },
  circuloLugar: { alignItems: "center", justifyContent: "center" },
  anillo: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#E8A000",
    opacity: 0.4,
  },
  circulo: { borderWidth: 3, alignItems: "center", justifyContent: "center" },
  circuloNumero: { fontWeight: "bold", fontStyle: "italic" },
  circuloCheck: {
    position: "absolute",
    bottom: 3,
    right: 6,
    fontSize: 10,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  etiqueta: { fontSize: 11, fontWeight: "600", color: "#555", marginTop: 4 },
  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pastillaEmoji: { fontSize: 15 },
  pastillaTxt: { fontSize: 14, fontWeight: "bold", color: "#333" },

  opciones: { alignSelf: "stretch", gap: 6 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 7,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "#F5F6FA",
    borderColor: "#E0E0E0",
  },
  opcionCorrecta: { backgroundColor: "#C8F5D3", borderColor: "#2E7D32" },
  opcionLetra: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "800",
    fontSize: 11,
    color: "#555",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  opcionTxt: { fontSize: 13, color: "#1A1A2E", fontWeight: "500" },

  franjaVidas: { flexDirection: "row", gap: 4 },
  corazon: { fontSize: 26 },
  apagado: { opacity: 0.2 },
  proximaVida: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginTop: 10,
  },

  stat: {
    width: 110,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
  },
  statIcono: { fontSize: 22, marginBottom: 4 },
  statValor: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  statEtiqueta: { fontSize: 11, fontWeight: "500", color: "#888" },

  franjaPestana: { alignItems: "center", gap: 3, paddingVertical: 6 },
  pestanaIcono: {
    width: 48,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pestanaEmoji: { fontSize: 20 },
  pestanaTxt: { fontSize: 11, fontWeight: "700", color: "#1A1A2E" },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E4F0",
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginVertical: 10,
  },
  buscadorIcono: { fontSize: 15 },
  buscadorTxt: { fontSize: 14, color: "#9CA3AF" },
  tarjetaSena: {
    width: 76,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Colores de categoría de SenasScreen: abecedario (lila) e interacciones
  // (dorado)
  senaAbecedario: { backgroundColor: "#EEF1FB", borderColor: "#C8D3F5" },
  senaAbecedarioTxt: { color: "#3D4FBB" },
  senaInteracciones: { backgroundColor: "#FFF8E1", borderColor: "#F5CE5A" },
  senaInteraccionesTxt: { color: "#5A3E00" },
  senaLetra: { fontSize: 28, fontWeight: "800" },
  senaPalabra: { fontSize: 15, fontWeight: "700" },
});
