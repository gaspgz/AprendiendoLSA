import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
// Arriba del archivo — agregá este import
import { StatusBar } from "react-native";

// En el RENDER del mapa principal, antes del <SafeAreaView> existente, agregá:
<StatusBar
  backgroundColor="#C8D3F5"
  barStyle="dark-content"
  translucent={false}
/>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ══════════════════════════════════════════════════════════════════════
//  CONFIG API  — reemplazá la URL cuando tengas MockAPI listo
// ══════════════════════════════════════════════════════════════════════
const MOCKAPI_BASE = "https://TU-URL.mockapi.io/api"; // TODO: reemplazar
const USER_ID = "user_1"; // TODO: reemplazar con el id del usuario logueado
const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

// ══════════════════════════════════════════════════════════════════════
//  DATOS
// ══════════════════════════════════════════════════════════════════════
const NIVELES = [
  {
    id: 1, // NIVEL 1
    nombre: "Abecedario dactilológico",
    descripcion: "Aprendé las 27 letras del alfabeto en LSA.",
    totalXP: 150,
    lecciones: [
      {
        id: 1,
        titulo: "Letras A–F", // MODULO 1, nivel 1
        descripcion: "Las primeras seis letras.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál es la seña de la letra A?",
            opciones: [
              "Puño cerrado con pulgar al lado",
              "Mano abierta",
              "Dos dedos arriba",
              "Palma abajo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra B?",
            opciones: [
              "Cuatro dedos juntos arriba",
              "Puño cerrado",
              "Índice señalando",
              "Mano en C",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra C?",
            opciones: [
              "Mano curvada en forma de C",
              "Puño cerrado",
              "Mano abierta",
              "Dos dedos abajo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra D?",
            opciones: [
              "Índice arriba con resto curvo",
              "Mano abierta",
              "Puño cerrado",
              "Palma girada",
            ],
            correcta: 0,
          },
        ],
      },
      {
        id: 2,
        titulo: "Letras G–M", // MODULO 2, nivel 1
        descripcion: "Del séptimo al décimo tercer lugar.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál es la seña de la letra G?",
            opciones: [
              "Índice y pulgar apuntando al costado",
              "Puño cerrado",
              "Mano abierta",
              "Tres dedos arriba",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra H?",
            opciones: [
              "Índice y medio apuntando al costado",
              "Puño cerrado",
              "Palma hacia adelante",
              "Mano en O",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra M?",
            opciones: [
              "Tres dedos sobre el pulgar",
              "Mano abierta",
              "Puño al frente",
              "Índice curvo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Qué letra se hace con los 4 dedos sobre el pulgar?",
            opciones: ["N", "M", "B", "A"],
            correcta: 1,
          },
        ],
      },
      {
        id: 3,
        titulo: "Letras N–S", // MODULO 3, nivel 1
        descripcion: "Segundo grupo del alfabeto.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál es la seña de la letra N?",
            opciones: [
              "Dos dedos sobre el pulgar",
              "Mano abierta",
              "Puño al frente",
              "Índice curvo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra O?",
            opciones: [
              "Dedos y pulgar formando un círculo",
              "Mano abierta",
              "Puño cerrado",
              "Tres dedos arriba",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra S?",
            opciones: [
              "Puño cerrado con pulgar adentro",
              "Mano abierta",
              "Cuatro dedos arriba",
              "Palma abajo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿La letra R se hace con qué dedos cruzados?",
            opciones: [
              "Índice y medio",
              "Anular y meñique",
              "Pulgar e índice",
              "Índice y anular",
            ],
            correcta: 0,
          },
        ],
      },
      {
        id: 4,
        titulo: "Letras T–Z", // MODULO 4, nivel 1
        descripcion: "Las últimas letras del abecedario.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál es la seña de la letra T?",
            opciones: [
              "Pulgar entre índice y medio",
              "Mano abierta",
              "Puño cerrado",
              "Índice arriba",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra V?",
            opciones: [
              "Índice y medio en V",
              "Puño cerrado",
              "Mano abierta",
              "Tres dedos arriba",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuál es la seña de la letra Z?",
            opciones: [
              "Trazar Z con el índice en el aire",
              "Puño cerrado",
              "Mano abierta",
              "Pulgar arriba",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cuántas letras tiene el abecedario dactilológico LSA?",
            opciones: ["27", "26", "28", "25"],
            correcta: 0,
          },
        ],
      },
      {
        id: 5, // MODULO 5, nivel 1
        titulo: "Repaso completo",
        descripcion: "Practicá todo el abecedario.",
        xp: 30,
        ejercicios: [
          {
            pregunta:
              "¿Qué letra se hace con un puño cerrado y el pulgar al costado?",
            opciones: ["A", "S", "E", "M"],
            correcta: 0,
          },
          {
            pregunta: "¿Qué letra se hace trazando su forma en el aire?",
            opciones: ["Z", "A", "O", "C"],
            correcta: 0,
          },
          {
            pregunta:
              "¿Qué letra se hace con cuatro dedos juntos apuntando arriba?",
            opciones: ["B", "D", "F", "H"],
            correcta: 0,
          },
          {
            pregunta: "¿Qué letra se hace con índice y medio cruzados?",
            opciones: ["R", "V", "U", "H"],
            correcta: 0,
          },
        ],
      },
    ],
  },
  {
    id: 2, // NIVEL 2
    nombre: "Saludos y presentaciones",
    descripcion: "Hola, chau, ¿cómo estás? y más.",
    totalXP: 150,
    lecciones: [
      {
        id: 1, // MODULO 1, nivel 2
        titulo: "Hola y Chau",
        descripcion: "Las señas más básicas para saludar.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál es la seña para 'Hola'?",
            opciones: [
              "Mano abierta moviéndose de lado a lado",
              "Puño cerrado arriba",
              "Dos dedos señalando",
              "Palma abajo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cómo se dice 'Chau' en LSA?",
            opciones: [
              "Mano en el pecho",
              "Mano abierta moviéndose de lado a lado",
              "Índice al cielo",
              "Palma girada adentro",
            ],
            correcta: 1,
          },
          {
            pregunta: "¿Cuándo se usa la seña de 'Hola'?",
            opciones: [
              "Al saludar al llegar",
              "Al despedirse",
              "Al agradecer",
              "Al pedir algo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿La seña de 'Chau' se hace con la mano...?",
            opciones: [
              "Abierta moviéndose",
              "Cerrada quieta",
              "En forma de C",
              "Señalando",
            ],
            correcta: 0,
          },
        ],
      },
      {
        id: 2, // MODULO 2, nivel 2
        titulo: "¿Cómo estás?",
        descripcion: "Preguntá y respondé sobre tu estado.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Qué seña expresa 'Bien'?",
            opciones: [
              "Pulgar hacia arriba",
              "Mano abierta al pecho",
              "Índice y medio cruzados",
              "Mano cerrada afuera",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Qué seña expresa 'Mal'?",
            opciones: [
              "Pulgar hacia abajo",
              "Mano en el aire",
              "Puño cerrado",
              "Dedos abiertos",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Cómo se pregunta '¿Cómo estás?' en LSA?",
            opciones: [
              "Mano moviéndose con expresión interrogativa",
              "Solo mover la cabeza",
              "Señalar al otro",
              "Cruzar los brazos",
            ],
            correcta: 0,
          },
          {
            pregunta: "La expresión facial en LSA es...?",
            opciones: [
              "Parte esencial del mensaje",
              "Opcional",
              "Solo para emociones",
              "Irrelevante",
            ],
            correcta: 0,
          },
        ],
      },
      {
        id: 3, // MODULO 3, nivel 2
        titulo: "Me llamo...",
        descripcion: "Presentate con tu nombre en LSA.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "Para deletrear tu nombre en LSA usás:",
            opciones: [
              "El abecedario dactilológico",
              "Señas compuestas",
              "Solo expresión facial",
              "Movimiento de hombros",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Qué parte del cuerpo es central al presentarte?",
            opciones: [
              "Las manos y la cara",
              "Los pies",
              "Los hombros",
              "El torso",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Dónde se hace la seña 'yo' o 'me llamo'?",
            opciones: [
              "Señalando al pecho propio",
              "Señalando arriba",
              "Señalando al otro",
              "En el aire",
            ],
            correcta: 0,
          },
          {
            pregunta: "Al presentarte, ¿qué información podés dar primero?",
            opciones: ["Tu nombre", "Tu edad", "Tu trabajo", "Tu ciudad"],
            correcta: 0,
          },
        ],
      },
      {
        id: 4, // MODULO 4, nivel 2
        titulo: "Mucho gusto",
        descripcion: "El saludo formal en LSA.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuándo se usa 'Mucho gusto' en LSA?",
            opciones: [
              "Al conocer a alguien",
              "Al despedirse",
              "Al pedir algo",
              "Al agradecer",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿'Mucho gusto' es un saludo...?",
            opciones: [
              "Formal",
              "Informal",
              "Solo para amigos",
              "Para despedidas",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Qué expresión facial acompaña 'Mucho gusto'?",
            opciones: [
              "Sonrisa y contacto visual",
              "Cara seria",
              "Ojos cerrados",
              "Mirada hacia abajo",
            ],
            correcta: 0,
          },
          {
            pregunta: "¿Se puede combinar 'Hola' con 'Mucho gusto'?",
            opciones: [
              "Sí, en una primera presentación",
              "No, nunca",
              "Solo con desconocidos adultos",
              "Solo en contextos formales",
            ],
            correcta: 0,
          },
        ],
      },
      {
        id: 5, // MODULO 5, nivel 2
        titulo: "Repaso de saludos",
        descripcion: "Practicá todos los saludos.",
        xp: 30,
        ejercicios: [
          {
            pregunta: "¿Cuál de estas NO es una seña de saludo?",
            opciones: ["Gracias", "Hola", "Chau", "Mucho gusto"],
            correcta: 0,
          },
          {
            pregunta: "¿Qué seña usarías al entrar a un lugar?",
            opciones: ["Hola", "Chau", "Mucho gusto", "¿Cómo estás?"],
            correcta: 0,
          },
          {
            pregunta: "¿Qué seña usarías al irte?",
            opciones: ["Chau", "Hola", "Me llamo", "Mucho gusto"],
            correcta: 1,
          },
          {
            pregunta: "¿La expresión facial cambia el significado de una seña?",
            opciones: [
              "Sí, completamente",
              "No, nunca",
              "Solo a veces",
              "Solo en preguntas",
            ],
            correcta: 0,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    nombre: "Números del 1 al 20",
    descripcion: "Contá y usá números en LSA.",
    totalXP: 150,
    lecciones: [], // poner lecciones aca dentro
  },
  {
    id: 4,
    nombre: "Familia",
    descripcion: "Mamá, papá, hermano, hermana y más vínculos.",
    totalXP: 150,
    lecciones: [], // poner lecciones aca dentro
  },
  {
    id: 5,
    nombre: "Colores",
    descripcion: "Todos los colores básicos en señas.",
    totalXP: 150,
    lecciones: [], // poner lecciones aca dentro
  },
];

// ══════════════════════════════════════════════════════════════════════
//  HELPERS — VIDAS
// ══════════════════════════════════════════════════════════════════════

const checkRegenVidas = (vidasData) => {
  if (!vidasData || vidasData.vidas >= 3)
    return { vidas: 3, proximaRegen: null };
  const { vidas, proximaRegen } = vidasData;
  if (!proximaRegen) return vidasData;
  const ahora = Date.now();
  let nuevasVidas = vidas;
  let nuevaRegen = proximaRegen;
  while (nuevasVidas < 3 && ahora >= nuevaRegen) {
    nuevasVidas++;
    nuevaRegen = nuevasVidas < 3 ? nuevaRegen + DOS_HORAS_MS : null;
  }
  return {
    vidas: nuevasVidas,
    proximaRegen: nuevasVidas < 3 ? nuevaRegen : null,
  };
};

const perderUnaVida = (vidasData) => {
  const nuevasVidas = Math.max(0, vidasData.vidas - 1);
  const nuevaRegen = vidasData.proximaRegen ?? Date.now() + DOS_HORAS_MS;
  return {
    vidas: nuevasVidas,
    proximaRegen: nuevasVidas < 3 ? nuevaRegen : null,
  };
};

const formatCountdown = (ms) => {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ══════════════════════════════════════════════════════════════════════
//  HELPERS — PROGRESO / NIVELES
// ══════════════════════════════════════════════════════════════════════

const getNivelEstado = (nivel, leccionesCompletadas) => {
  const completadasEnNivel = leccionesCompletadas[nivel.id] || [];
  const totalLecciones = nivel.lecciones.length;

  if (totalLecciones === 0) return "bloqueado"; // sin contenido todavía

  if (nivel.id === 1) {
    return completadasEnNivel.length >= totalLecciones
      ? "completado"
      : "actual";
  }
  const nivelAnterior = NIVELES.find((n) => n.id === nivel.id - 1);
  const completadasAnterior = leccionesCompletadas[nivelAnterior.id] || [];
  if (completadasAnterior.length < nivelAnterior.lecciones.length)
    return "bloqueado";
  return completadasEnNivel.length >= totalLecciones ? "completado" : "actual";
};

// ══════════════════════════════════════════════════════════════════════
//  PERSISTENCIA — AsyncStorage + MockAPI
// ══════════════════════════════════════════════════════════════════════

const KEYS = {
  progreso: (uid) => `progreso_${uid}`,
  vidas: (uid) => `vidas_${uid}`,
};

const DEFAULT_PROGRESO = { leccionesCompletadas: { 0: [0] } }; // nivel 1, lección 1 done por defecto
const DEFAULT_VIDAS = { vidas: 3, proximaRegen: null };

const cargarDatos = async () => {
  try {
    const [progresoRaw, vidasRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.progreso(USER_ID)),
      AsyncStorage.getItem(KEYS.vidas(USER_ID)),
    ]);
    const progreso = progresoRaw ? JSON.parse(progresoRaw) : DEFAULT_PROGRESO;
    const vidasRaw2 = vidasRaw ? JSON.parse(vidasRaw) : DEFAULT_VIDAS;
    const vidas = checkRegenVidas(vidasRaw2); // regenerar si pasaron horas
    return { progreso, vidas };
  } catch {
    return { progreso: DEFAULT_PROGRESO, vidas: DEFAULT_VIDAS };
  }
};

const guardarProgreso = async (progreso) => {
  try {
    await AsyncStorage.setItem(
      KEYS.progreso(USER_ID),
      JSON.stringify(progreso),
    );
    // TODO: sincronizar con MockAPI
    // await fetch(`${MOCKAPI_BASE}/usuarios/${USER_ID}/progreso`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(progreso),
    // });
  } catch (e) {
    console.log("Error guardando progreso:", e);
  }
};

const guardarVidas = async (vidas) => {
  try {
    await AsyncStorage.setItem(KEYS.vidas(USER_ID), JSON.stringify(vidas));
    // TODO: sincronizar con MockAPI
    // await fetch(`${MOCKAPI_BASE}/usuarios/${USER_ID}/vidas`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(vidas),
    // });
  } catch (e) {
    console.log("Error guardando vidas:", e);
  }
};

// ══════════════════════════════════════════════════════════════════════
//  MAPA — componentes
// ══════════════════════════════════════════════════════════════════════

const CIRCLE_SIZE = 80;
const ZIGZAG_PADDING = 40;
const POSITIONS = [0.25, 0.62, 0.18, 0.7, 0.35];

const getPosition = (i) => ({
  x:
    ZIGZAG_PADDING +
    POSITIONS[i % POSITIONS.length] *
      (SCREEN_WIDTH - ZIGZAG_PADDING * 2 - CIRCLE_SIZE),
  y: i * 120,
});
const getTotalHeight = (c) => c * 120 + CIRCLE_SIZE + 40;

const toRomano = (n) => {
  const map = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let r = "";
  for (const [v, s] of map) {
    while (n >= v) {
      r += s;
      n -= v;
    }
  }
  return r;
};

const ConectorLinea = ({ from, to }) => {
  const x1 = from.x + CIRCLE_SIZE / 2,
    y1 = from.y + CIRCLE_SIZE / 2;
  const x2 = to.x + CIRCLE_SIZE / 2,
    y2 = to.y + CIRCLE_SIZE / 2;
  const dx = x2 - x1,
    dy = y2 - y1;
  return (
    <View
      style={{
        position: "absolute",
        left: x1,
        top: y1,
        width: Math.sqrt(dx * dx + dy * dy),
        height: 3,
        backgroundColor: "#D4C56A",
        borderRadius: 2,
        opacity: 0.5,
        transform: [{ rotate: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg` }],
        transformOrigin: "0 50%",
      }}
    />
  );
};

const NivelCirculo = ({ nivel, posicion, estado, onPress }) => {
  const c = {
    completado: { bg: "#F5CE5A", border: "#C9A227", text: "#5A3E00" },
    actual: { bg: "#F5CE5A", border: "#E8A000", text: "#3D2800" },
    bloqueado: { bg: "#D9D9D9", border: "#AAAAAA", text: "#888888" },
  }[estado];
  return (
    <TouchableOpacity
      onPress={() => onPress(nivel, estado)}
      activeOpacity={0.8}
      style={[
        styles.circulo,
        {
          left: posicion.x,
          top: posicion.y,
          backgroundColor: c.bg,
          borderColor: c.border,
          shadowColor: c.border,
        },
      ]}
    >
      {estado === "actual" && <View style={styles.pulsoAnillo} />}
      <Text style={[styles.circuloNumero, { color: c.text }]}>
        {toRomano(nivel.id)}
      </Text>
      {estado === "completado" && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
};

const NivelModal = ({ visible, nivel, estado, onClose, onIrNivel }) => {
  if (!nivel) return null;
  const etiqueta = {
    completado: "✓ Completado",
    actual: "▶ En curso",
    bloqueado: "🔒 Bloqueado",
  };
  const colorEtiqu = {
    completado: "#2E7D32",
    actual: "#E8A000",
    bloqueado: "#888",
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalNivel}>Nivel {toRomano(nivel.id)}</Text>
              <Text style={styles.modalNombre}>{nivel.nombre}</Text>
              <Text style={[styles.modalEstado, { color: colorEtiqu[estado] }]}>
                {etiqueta[estado]}
              </Text>
              <Text style={styles.modalDescripcion}>{nivel.descripcion}</Text>
              {estado !== "bloqueado" ? (
                <TouchableOpacity
                  style={styles.modalBoton}
                  onPress={() => {
                    onClose();
                    onIrNivel(nivel);
                  }}
                >
                  <Text style={styles.modalBotonTexto}>
                    {estado === "completado" ? "Repasar" : "Continuar"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalBoton, styles.modalBotonBloqueado]}
                  onPress={onClose}
                >
                  <Text style={[styles.modalBotonTexto, { color: "#888" }]}>
                    Completá el nivel anterior
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.modalCerrar}>
                <Text style={styles.modalCerrarTexto}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
//  VIDAS — modal sin vidas
// ══════════════════════════════════════════════════════════════════════

const ModalSinVidas = ({ visible, proximaRegen, onClose }) => {
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!visible || !proximaRegen) return;
    const actualizar = () =>
      setCountdown(formatCountdown(proximaRegen - Date.now()));
    actualizar();
    const t = setInterval(actualizar, 1000);
    return () => clearInterval(t);
  }, [visible, proximaRegen]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={{ fontSize: 52, textAlign: "center", marginBottom: 8 }}>
            💔
          </Text>
          <Text style={[styles.modalNombre, { textAlign: "center" }]}>
            Sin vidas
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              textAlign: "center",
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            Perdiste todas tus vidas.{"\n"}Próxima vida en:
          </Text>
          <View style={styles.countdownBox}>
            <Text style={styles.countdownTxt}>{countdown}</Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "#AAA",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Las vidas se regeneran de a una cada 2 horas
          </Text>
          <TouchableOpacity style={styles.modalBoton} onPress={onClose}>
            <Text style={styles.modalBotonTexto}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
//  NIVEL — componentes
// ══════════════════════════════════════════════════════════════════════

const BarraProgreso = ({ completadas, total }) => (
  <View style={styles.barraWrap}>
    <View style={styles.barraFondo}>
      <View
        style={[
          styles.barraRelleno,
          { width: `${(completadas / total) * 100}%` },
        ]}
      />
    </View>
    <Text style={styles.barraTxt}>
      {completadas}/{total}
    </Text>
  </View>
);

const LeccionCard = ({ leccion, index, onPress, bloqueada }) => {
  const estado = leccion.completada
    ? "completada"
    : bloqueada
      ? "bloqueada"
      : "disponible";
  const c = {
    completada: {
      bg: "#E8F5E9",
      border: "#A5D6A7",
      icon: "✓",
      iconColor: "#2E7D32",
    },
    disponible: {
      bg: "#EEF1FB",
      border: "#C8D3F5",
      icon: "▶",
      iconColor: "#3D4FBB",
    },
    bloqueada: {
      bg: "#F5F5F5",
      border: "#E0E0E0",
      icon: "🔒",
      iconColor: "#BDBDBD",
    },
  }[estado];
  return (
    <TouchableOpacity
      style={[
        styles.leccionCard,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
      onPress={() => !bloqueada && onPress(leccion)}
      activeOpacity={bloqueada ? 1 : 0.75}
    >
      <View style={[styles.leccionNumero, { borderColor: c.border }]}>
        <Text style={[styles.leccionNumeroTxt, { color: c.iconColor }]}>
          {index + 1}
        </Text>
      </View>
      <View style={styles.leccionInfo}>
        <Text
          style={[
            styles.leccionTitulo,
            { color: bloqueada ? "#BDBDBD" : "#1A1A2E" },
          ]}
        >
          {leccion.titulo}
        </Text>
        <Text
          style={[
            styles.leccionDesc,
            { color: bloqueada ? "#BDBDBD" : "#666" },
          ]}
          numberOfLines={1}
        >
          {leccion.descripcion}
        </Text>
        <Text style={[styles.leccionXP, { color: c.iconColor }]}>
          +{leccion.xp} XP
        </Text>
      </View>
      <Text style={[styles.leccionIconEstado, { color: c.iconColor }]}>
        {c.icon}
      </Text>
    </TouchableOpacity>
  );
};

// ── Ejercicio ─────────────────────────────────────────────────────────
const PantallaEjercicio = ({
  leccion,
  vidasGlobales,
  onTerminar,
  onPerderVida,
}) => {
  const [idx, setIdx] = useState(0);
  const [seleccionada, setSelec] = useState(null);
  const [confirmada, setConf] = useState(false);
  const [errorActual, setError] = useState(false); // error en la pregunta actual

  const ejercicio = leccion.ejercicios[idx];
  const total = leccion.ejercicios.length;
  const esCorrecta = seleccionada === ejercicio.correcta;

  const confirmar = () => {
    if (seleccionada === null) return;
    setConf(true);
    if (!esCorrecta) {
      setError(true);
      onPerderVida(); // descuenta vida global
    }
  };

  const siguiente = () => {
    if (!esCorrecta) {
      // debe reintentar esta misma pregunta
      setSelec(null);
      setConf(false);
      setError(false);
      return;
    }
    if (idx + 1 >= total) {
      onTerminar({ completada: true, xp: leccion.xp });
    } else {
      setIdx((i) => i + 1);
      setSelec(null);
      setConf(false);
      setError(false);
    }
  };

  const bgOpcion = (i) => {
    if (!confirmada) return seleccionada === i ? "#C8D3F5" : "#F5F6FA";
    if (i === ejercicio.correcta) return "#C8F5D3";
    if (i === seleccionada && !esCorrecta) return "#FFCDD2";
    return "#F5F6FA";
  };
  const borderOpcion = (i) => {
    if (!confirmada) return seleccionada === i ? "#3D4FBB" : "#E0E0E0";
    if (i === ejercicio.correcta) return "#2E7D32";
    if (i === seleccionada && !esCorrecta) return "#C62828";
    return "#E0E0E0";
  };

  return (
    <View style={styles.ejercicioContainer}>
      {/* Header */}
      <View style={styles.ejercicioHeader}>
        <TouchableOpacity
          onPress={() => onTerminar({ completada: false })}
          style={styles.cerrarBtn}
        >
          <Text style={styles.cerrarTxt}>✕</Text>
        </TouchableOpacity>
        <View style={styles.ejercicioBarraWrap}>
          <View style={styles.ejercicioBarraFondo}>
            <View
              style={[
                styles.ejercicioBarraRelleno,
                { width: `${(idx / total) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.ejercicioProgTxt}>
            {idx + 1}/{total}
          </Text>
        </View>
        {/* Vidas globales */}
        <View style={styles.vidasWrap}>
          {[...Array(3)].map((_, i) => (
            <Text
              key={i}
              style={{ fontSize: 18, opacity: i < vidasGlobales ? 1 : 0.2 }}
            >
              ❤️
            </Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        {/* Video placeholder */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoIcono}>🤟</Text>
          <Text style={styles.videoTxt}>Video de la seña</Text>
          <Text style={styles.videoSub}>Mirá bien antes de responder</Text>
        </View>

        <Text style={styles.pregunta}>{ejercicio.pregunta}</Text>

        <View style={styles.opcionesWrap}>
          {ejercicio.opciones.map((op, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.opcion,
                { backgroundColor: bgOpcion(i), borderColor: borderOpcion(i) },
              ]}
              onPress={() => !confirmada && setSelec(i)}
              activeOpacity={confirmada ? 1 : 0.75}
            >
              <Text style={styles.opcionLetra}>{["A", "B", "C", "D"][i]}</Text>
              <Text style={styles.opcionTxt}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Feedback */}
      {confirmada && (
        <View
          style={[
            styles.feedbackBanner,
            { backgroundColor: esCorrecta ? "#C8F5D3" : "#FFCDD2" },
          ]}
        >
          <Text
            style={[
              styles.feedbackTxt,
              { color: esCorrecta ? "#1B5E20" : "#B71C1C" },
            ]}
          >
            {esCorrecta
              ? "¡Correcto! 🎉"
              : `Incorrecto ❌  —  Intentá de nuevo\nRespuesta: ${ejercicio.opciones[ejercicio.correcta]}`}
          </Text>
        </View>
      )}

      <View style={styles.ejercicioBtnWrap}>
        {!confirmada ? (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { opacity: seleccionada === null ? 0.45 : 1 },
            ]}
            onPress={confirmar}
          >
            <Text style={styles.btnPrincipalTxt}>Confirmar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { backgroundColor: esCorrecta ? "#C8F5D3" : "#FFCDD2" },
            ]}
            onPress={siguiente}
          >
            <Text
              style={[
                styles.btnPrincipalTxt,
                { color: esCorrecta ? "#1B5E20" : "#B71C1C" },
              ]}
            >
              {esCorrecta
                ? idx + 1 >= total
                  ? "Terminar lección ✓"
                  : "Siguiente →"
                : "Reintentar esta pregunta 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ModalResultado = ({ visible, xpGanado, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { alignItems: "center" }]}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>🏆</Text>
        <Text style={styles.modalNombre}>¡Lección completada!</Text>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>
          Respondiste todas las preguntas correctamente
        </Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeTxt}>+{xpGanado} XP</Text>
        </View>
        <TouchableOpacity
          style={[styles.btnPrincipal, { width: "100%", marginTop: 8 }]}
          onPress={onClose}
        >
          <Text style={styles.btnPrincipalTxt}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ══════════════════════════════════════════════════════════════════════
//  MENÚ PERFIL
// ══════════════════════════════════════════════════════════════════════

const MenuPerfil = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.menuOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                router.push("/ProfileScreen");
              }}
            >
              <Text style={styles.menuItemIcono}>👤</Text>
              <Text style={styles.menuItemTxt}>Ver mi perfil</Text>
              <Text style={styles.menuItemFlecha}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                router.replace("/login");
              }}
            >
              <Text style={styles.menuItemIcono}>🚪</Text>
              <Text style={[styles.menuItemTxt, { color: "#C62828" }]}>
                Cerrar sesión
              </Text>
              <Text style={[styles.menuItemFlecha, { color: "#C62828" }]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

// ══════════════════════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════

export default function HomeScreen() {
  // ── datos persistentes ──
  const [progreso, setProgreso] = useState({
    leccionesCompletadas: { 1: [1] },
  });
  const [vidasData, setVidasData] = useState({ vidas: 3, proximaRegen: null });
  const [cargando, setCargando] = useState(true);

  // ── estado del mapa ──
  const [modalNivelVisible, setModalNivelVisible] = useState(false);
  const [menuPerfilVisible, setMenuPerfilVisible] = useState(false);
  const [modalSinVidas, setModalSinVidas] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const racha = 7; // TODO: traer de API

  // ── estado del nivel abierto ──
  const [nivelAbierto, setNivelAbierto] = useState(null);
  const [leccionActiva, setLeccionActiva] = useState(null);
  const [modalResultadoVisible, setModalResultado] = useState(false);
  const [xpUltimaLeccion, setXpUltimaLeccion] = useState(0);

  // ── regeneración de vidas (timer) ──
  const regenTimerRef = useRef(null);

  useEffect(() => {
    cargarDatos().then(({ progreso: p, vidas: v }) => {
      setProgreso(p);
      setVidasData(v);
      setCargando(false);
    });
  }, []);

  // chequear regeneración cada 30 segundos
  useEffect(() => {
    regenTimerRef.current = setInterval(() => {
      setVidasData((prev) => {
        const actualizado = checkRegenVidas(prev);
        if (actualizado.vidas !== prev.vidas) {
          guardarVidas(actualizado);
          return actualizado;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(regenTimerRef.current);
  }, []);

  // ── helpers de progreso ──
  const leccionesComp = progreso.leccionesCompletadas;

  const marcarLeccionCompleta = useCallback((nivelId, leccionId) => {
    setProgreso((prev) => {
      const actuales = prev.leccionesCompletadas[nivelId] || [];
      if (actuales.includes(leccionId)) return prev;
      const nuevo = {
        ...prev,
        leccionesCompletadas: {
          ...prev.leccionesCompletadas,
          [nivelId]: [...actuales, leccionId],
        },
      };
      guardarProgreso(nuevo);
      return nuevo;
    });
  }, []);

  const handlePerderVida = useCallback(() => {
    setVidasData((prev) => {
      const nuevo = perderUnaVida(prev);
      guardarVidas(nuevo);
      return nuevo;
    });
  }, []);

  // ── handlers mapa ──
  const handleNivelPress = useCallback((nivel, estado) => {
    setNivelSeleccionado(nivel);
    setEstadoSeleccionado(estado);
    setModalNivelVisible(true);
  }, []);

  const handleIrNivel = useCallback(
    (nivel) => {
      if (vidasData.vidas === 0) {
        setModalSinVidas(true);
        return;
      }
      setNivelAbierto(nivel);
      setLeccionActiva(null);
    },
    [vidasData.vidas],
  );

  const handleIrLeccion = useCallback(
    (leccion) => {
      if (vidasData.vidas === 0) {
        setModalSinVidas(true);
        return;
      }
      setLeccionActiva(leccion);
    },
    [vidasData.vidas],
  );

  // ── handlers ejercicio ──
  const handleTerminarEjercicio = useCallback(
    ({ completada, xp }) => {
      if (completada && leccionActiva && nivelAbierto) {
        marcarLeccionCompleta(nivelAbierto.id, leccionActiva.id);
        setXpUltimaLeccion(xp);
        setModalResultado(true);
      }
      setLeccionActiva(null);
    },
    [leccionActiva, nivelAbierto, marcarLeccionCompleta],
  );

  // ── utilidades de render ──
  const completadasDelNivel = nivelAbierto
    ? leccionesComp[nivelAbierto.id] || []
    : [];

  const esBloqueadaLeccion = (leccion, index) => {
    if (index === 0) return false;
    const anterior = nivelAbierto.lecciones[index - 1];
    return !completadasDelNivel.includes(anterior.id);
  };

  const posiciones = NIVELES.map((_, i) => getPosition(i));
  const alturaMapa = getTotalHeight(NIVELES.length);

  if (cargando) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontSize: 32 }}>🤟</Text>
        <Text style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
          Cargando tu progreso...
        </Text>
      </SafeAreaView>
    );
  }

  // ══ RENDER: ejercicio ══
  if (nivelAbierto && leccionActiva) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {vidasData.vidas === 0 ? (
          <ModalSinVidas
            visible={true}
            proximaRegen={vidasData.proximaRegen}
            onClose={() => {
              setLeccionActiva(null);
            }}
          />
        ) : (
          <>
            <PantallaEjercicio
              leccion={leccionActiva}
              vidasGlobales={vidasData.vidas}
              onTerminar={handleTerminarEjercicio}
              onPerderVida={handlePerderVida}
            />
            <ModalResultado
              visible={modalResultadoVisible}
              xpGanado={xpUltimaLeccion}
              onClose={() => setModalResultado(false)}
            />
          </>
        )}
      </SafeAreaView>
    );
  }

  // ══ RENDER: lista lecciones ══
  if (nivelAbierto) {
    const completadas = completadasDelNivel.length;
    const total = nivelAbierto.lecciones.length;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.nivelHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setNivelAbierto(null)}
          >
            <Text style={styles.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.nivelHeaderCenter}>
            <Text style={styles.nivelHeaderLabel}>
              Nivel {toRomano(nivelAbierto.id)}
            </Text>
            <Text style={styles.nivelHeaderNombre} numberOfLines={1}>
              {nivelAbierto.nombre}
            </Text>
          </View>
          {/* Vidas en header del nivel */}
          <View style={styles.vidasHeaderWrap}>
            {[...Array(3)].map((_, i) => (
              <Text
                key={i}
                style={{ fontSize: 14, opacity: i < vidasData.vidas ? 1 : 0.2 }}
              >
                ❤️
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.progresoWrap}>
          <BarraProgreso completadas={completadas} total={total} />
          <Text style={styles.progresoTxt}>
            {completadas === total
              ? "¡Nivel completado! 🏆"
              : `${total - completadas} lecciones restantes`}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        >
          {nivelAbierto.lecciones.map((leccion, index) => {
            const bloqueada = esBloqueadaLeccion(leccion, index);
            const completada = completadasDelNivel.includes(leccion.id);
            return (
              <LeccionCard
                key={leccion.id}
                leccion={{ ...leccion, completada }}
                index={index}
                onPress={handleIrLeccion}
                bloqueada={bloqueada}
              />
            );
          })}
          {completadas === total && (
            <View style={styles.nivelCompletoBanner}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>🎓</Text>
              <Text style={styles.nivelCompletoTxt}>
                ¡Completaste el nivel!
              </Text>
              <TouchableOpacity
                style={[styles.btnPrincipal, { marginTop: 12, width: "100%" }]}
                onPress={() => setNivelAbierto(null)}
              >
                <Text style={styles.btnPrincipalTxt}>Volver al mapa →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <ModalSinVidas
          visible={modalSinVidas}
          proximaRegen={vidasData.proximaRegen}
          onClose={() => setModalSinVidas(false)}
        />
      </SafeAreaView>
    );
  }

  // ══ RENDER: mapa ══
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.rachaContainer}>
          <Text style={styles.rachaFuego}>🔥</Text>
          <Text style={styles.rachaDias}>{racha}</Text>
        </View>
        {/* Vidas en el header del mapa */}
        <View style={styles.vidasMapaWrap}>
          {[...Array(3)].map((_, i) => (
            <Text
              key={i}
              style={{ fontSize: 16, opacity: i < vidasData.vidas ? 1 : 0.2 }}
            >
              ❤️
            </Text>
          ))}
        </View>
        <TouchableOpacity
          style={styles.perfilBtn}
          onPress={() => setMenuPerfilVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.perfilIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ height: alturaMapa, position: "relative" }}
        showsVerticalScrollIndicator={false}
      >
        {NIVELES.slice(0, -1).map((_, i) => (
          <ConectorLinea key={i} from={posiciones[i]} to={posiciones[i + 1]} />
        ))}
        {NIVELES.map((nivel, i) => {
          const estado = getNivelEstado(nivel, leccionesComp);
          return (
            <NivelCirculo
              key={nivel.id}
              nivel={nivel}
              posicion={posiciones[i]}
              estado={estado}
              onPress={handleNivelPress}
            />
          );
        })}
      </ScrollView>

      <NivelModal
        visible={modalNivelVisible}
        nivel={nivelSeleccionado}
        estado={estadoSeleccionado}
        onClose={() => setModalNivelVisible(false)}
        onIrNivel={handleIrNivel}
      />
      <MenuPerfil
        visible={menuPerfilVisible}
        onClose={() => setMenuPerfilVisible(false)}
      />
      <ModalSinVidas
        visible={modalSinVidas}
        proximaRegen={vidasData.proximaRegen}
        onClose={() => setModalSinVidas(false)}
      />
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  ESTILOS
// ══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF1FB" },

  // Mapa header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#C8D3F5",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 8,
  },
  rachaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  rachaFuego: { fontSize: 18 },
  rachaDias: { fontSize: 16, fontWeight: "bold", color: "#333" },
  vidasMapaWrap: { flexDirection: "row", gap: 2 },
  perfilBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  perfilIcon: { fontSize: 20 },

  // Círculos
  circulo: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  circuloNumero: { fontSize: 22, fontWeight: "bold", fontStyle: "italic" },
  checkmark: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  pulsoAnillo: {
    position: "absolute",
    width: CIRCLE_SIZE + 16,
    height: CIRCLE_SIZE + 16,
    borderRadius: (CIRCLE_SIZE + 16) / 2,
    borderWidth: 2.5,
    borderColor: "#E8A000",
    opacity: 0.4,
  },

  // Modales base
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
  },
  modalNivel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalNombre: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  modalEstado: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  modalDescripcion: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBoton: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalBotonBloqueado: { backgroundColor: "#F0F0F0" },
  modalBotonTexto: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },
  modalCerrar: { alignItems: "center", paddingVertical: 8 },
  modalCerrarTexto: { fontSize: 14, color: "#999" },

  // Sin vidas
  countdownBox: {
    backgroundColor: "#EEF1FB",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
  },
  countdownTxt: {
    fontSize: 32,
    fontWeight: "800",
    color: "#C62828",
    textAlign: "center",
    letterSpacing: 4,
  },

  // Menú perfil
  menuOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  menuCard: {
    position: "absolute",
    top: 80,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 4,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E0E4F0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  menuItemIcono: { fontSize: 18 },
  menuItemTxt: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  menuItemFlecha: { fontSize: 18, color: "#BDBDBD" },
  menuDivider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 12 },

  // Nivel header
  nivelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#C8D3F5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 14, color: "#3D4FBB", fontWeight: "600" },
  nivelHeaderCenter: { alignItems: "center", flex: 1 },
  nivelHeaderLabel: {
    fontSize: 12,
    color: "#3D4FBB",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  nivelHeaderNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginTop: 2,
  },
  vidasHeaderWrap: {
    flexDirection: "row",
    gap: 2,
    width: 60,
    justifyContent: "flex-end",
  },

  // Progreso nivel
  progresoWrap: { paddingHorizontal: 20, paddingVertical: 14 },
  barraWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  barraFondo: {
    flex: 1,
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  barraRelleno: { height: "100%", backgroundColor: "#F5CE5A", borderRadius: 5 },
  barraTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    minWidth: 32,
    textAlign: "right",
  },
  progresoTxt: { fontSize: 13, color: "#888", marginTop: 6 },

  // Lecciones
  lista: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  leccionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leccionNumero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  leccionNumeroTxt: { fontSize: 16, fontWeight: "bold" },
  leccionInfo: { flex: 1 },
  leccionTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  leccionDesc: { fontSize: 13, marginBottom: 4 },
  leccionXP: { fontSize: 12, fontWeight: "600" },
  leccionIconEstado: { fontSize: 20 },

  // Nivel completo
  nivelCompletoBanner: {
    backgroundColor: "#FFF8E1",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#F5CE5A",
  },
  nivelCompletoTxt: { fontSize: 18, fontWeight: "800", color: "#5A3E00" },

  // Ejercicio
  ejercicioContainer: { flex: 1, backgroundColor: "#fff" },
  ejercicioHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cerrarBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cerrarTxt: { fontSize: 18, color: "#999" },
  ejercicioBarraWrap: { flex: 1 },
  ejercicioBarraFondo: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  ejercicioBarraRelleno: {
    height: "100%",
    backgroundColor: "#F5CE5A",
    borderRadius: 4,
  },
  ejercicioProgTxt: {
    fontSize: 11,
    color: "#888",
    textAlign: "right",
    marginTop: 3,
  },
  vidasWrap: { flexDirection: "row", gap: 2 },
  ejercicioContent: { padding: 20, paddingBottom: 40 },
  videoPlaceholder: {
    height: 180,
    backgroundColor: "#EEF1FB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    borderStyle: "dashed",
  },
  videoIcono: { fontSize: 48, marginBottom: 8 },
  videoTxt: { fontSize: 15, fontWeight: "700", color: "#3D4FBB" },
  videoSub: { fontSize: 13, color: "#888", marginTop: 4 },
  pregunta: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 20,
    lineHeight: 26,
  },
  opcionesWrap: { gap: 10 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    gap: 12,
  },
  opcionLetra: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "800",
    fontSize: 14,
    color: "#555",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  opcionTxt: { flex: 1, fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  feedbackBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
  },
  feedbackTxt: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
  ejercicioBtnWrap: { paddingHorizontal: 16, paddingBottom: 20 },
  btnPrincipal: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrincipalTxt: { fontSize: 17, fontWeight: "bold", color: "#1A1A2E" },

  // XP badge
  xpBadge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#F5CE5A",
  },
  xpBadgeTxt: {
    fontSize: 28,
    fontWeight: "800",
    color: "#E8A000",
    textAlign: "center",
  },
});
