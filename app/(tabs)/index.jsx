import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GIFS = {
  A: require("../../assets/gifs/abecedario/A.gif"),
  B: require("../../assets/gifs/abecedario/B.gif"),
  C: require("../../assets/gifs/abecedario/C.gif"),
  CH: require("../../assets/gifs/abecedario/Ch.gif"),
  D: require("../../assets/gifs/abecedario/D.gif"),
  E: require("../../assets/gifs/abecedario/E.gif"),
  F: require("../../assets/gifs/abecedario/F.gif"),
  G: require("../../assets/gifs/abecedario/G.gif"),
  H: require("../../assets/gifs/abecedario/H.gif"),
  I: require("../../assets/gifs/abecedario/I.gif"),
  J: require("../../assets/gifs/abecedario/J.gif"),
  K: require("../../assets/gifs/abecedario/K.gif"),
  L: require("../../assets/gifs/abecedario/L.gif"),
  LL: require("../../assets/gifs/abecedario/Ll.gif"),
  M: require("../../assets/gifs/abecedario/M.gif"),
  N: require("../../assets/gifs/abecedario/N.gif"),
  Ñ: require("../../assets/gifs/abecedario/NN.gif"),
  O: require("../../assets/gifs/abecedario/O.gif"),
  P: require("../../assets/gifs/abecedario/P.gif"),
  Q: require("../../assets/gifs/abecedario/Q.gif"),
  R: require("../../assets/gifs/abecedario/R.gif"),
  S: require("../../assets/gifs/abecedario/S.gif"),
  T: require("../../assets/gifs/abecedario/T.gif"),
  U: require("../../assets/gifs/abecedario/U.gif"),
  V: require("../../assets/gifs/abecedario/V.gif"),
  W: require("../../assets/gifs/abecedario/W.gif"),
  X: require("../../assets/gifs/abecedario/X.gif"),
  Y: require("../../assets/gifs/abecedario/Y.gif"),
  Z: require("../../assets/gifs/abecedario/Z.gif"),
};

// GIFs de VOCABULARIO (Nivel 2+). Keys = nombre del archivo sin acentos ni signos.
const GIFS_PALABRAS = {
  apellido: require("../../assets/gifs/presentaciones/apellido.gif"),
  comoestas: require("../../assets/gifs/presentaciones/comoestas.gif"),
  como: require("../../assets/gifs/presentaciones/como.gif"),
  comotellamas: require("../../assets/gifs/presentaciones/comotellamas.gif"),
  cual: require("../../assets/gifs/presentaciones/cual.gif"),
  cualestuedad: require("../../assets/gifs/presentaciones/cualestuedad.gif"),
  cuando: require("../../assets/gifs/presentaciones/cuando.gif"),
  cuanto: require("../../assets/gifs/presentaciones/cuanto.gif"),
  deque: require("../../assets/gifs/presentaciones/deque.gif"),
  dni: require("../../assets/gifs/presentaciones/dni.gif"),
  donde: require("../../assets/gifs/presentaciones/donde.gif"),
  nombre: require("../../assets/gifs/presentaciones/nombre.gif"),
  oyente: require("../../assets/gifs/presentaciones/oyente.gif"),
  paraque: require("../../assets/gifs/presentaciones/paraque.gif"),
  porque: require("../../assets/gifs/presentaciones/porque.gif"),
  presentandonos: require("../../assets/gifs/presentaciones/presentandonos.gif"),
  que: require("../../assets/gifs/presentaciones/que.gif"),
  quedice: require("../../assets/gifs/presentaciones/quedice.gif"),
  quien: require("../../assets/gifs/presentaciones/quien.gif"),
  sordo: require("../../assets/gifs/presentaciones/sordo.gif"),

  // ── Nivel 3 · Interacciones cotidianas ──
  // (interacciones/quien.gif es la misma seña que presentaciones/quien.gif)
  saludos: require("../../assets/gifs/interacciones/saludos.gif"),
  hola: require("../../assets/gifs/interacciones/hola.gif"),
  chau: require("../../assets/gifs/interacciones/chau.gif"),
  gracias: require("../../assets/gifs/interacciones/gracias.gif"),
  bienvenida: require("../../assets/gifs/interacciones/bienvenida.gif"),
  permiso: require("../../assets/gifs/interacciones/permiso.gif"),
  perdon: require("../../assets/gifs/interacciones/perdon.gif"),
  bien: require("../../assets/gifs/interacciones/bien.gif"),
  mal: require("../../assets/gifs/interacciones/mal.gif"),
  basta: require("../../assets/gifs/interacciones/basta.gif"),
  porfavor: require("../../assets/gifs/interacciones/porfavor.gif"),
  no: require("../../assets/gifs/interacciones/no.gif"),
  comunicar: require("../../assets/gifs/interacciones/comunicar.gif"),
  si: require("../../assets/gifs/interacciones/si.gif"),
  conversar: require("../../assets/gifs/interacciones/conversar.gif"),
  denada: require("../../assets/gifs/interacciones/denada.gif"),
  hablarsenas: require("../../assets/gifs/interacciones/hablarsenas.gif"),
  llamar: require("../../assets/gifs/interacciones/llamar.gif"),
  hablaroral: require("../../assets/gifs/interacciones/hablaroral.gif"),
  buendia: require("../../assets/gifs/interacciones/buendia.gif"),
  buenasnoches: require("../../assets/gifs/interacciones/buenasnoches.gif"),
  buenastardes: require("../../assets/gifs/interacciones/buenastardes.gif"),
  porejemplo: require("../../assets/gifs/interacciones/porejemplo.gif"),

  // ── Nivel 4 · Sentimientos ──
  sentimientos: require("../../assets/gifs/sentimientos/sentimientos.gif"),
  aburrido: require("../../assets/gifs/sentimientos/aburrido.gif"),
  alegre: require("../../assets/gifs/sentimientos/alegre.gif"),
  amar: require("../../assets/gifs/sentimientos/amar.gif"),
  asustado: require("../../assets/gifs/sentimientos/asustado.gif"),
  cansado: require("../../assets/gifs/sentimientos/cansado.gif"),
  caprichoso: require("../../assets/gifs/sentimientos/caprichoso.gif"),
  contento: require("../../assets/gifs/sentimientos/contento.gif"),
  culpa: require("../../assets/gifs/sentimientos/culpa.gif"),
  deprimido: require("../../assets/gifs/sentimientos/deprimido.gif"),
  enojado: require("../../assets/gifs/sentimientos/enojado.gif"),
  feliz: require("../../assets/gifs/sentimientos/feliz.gif"),
  gracioso: require("../../assets/gifs/sentimientos/gracioso.gif"),
  llorar: require("../../assets/gifs/sentimientos/llorar.gif"),
  miedoso: require("../../assets/gifs/sentimientos/miedoso.gif"),
  nervioso: require("../../assets/gifs/sentimientos/nervioso.gif"),
  orgulloso: require("../../assets/gifs/sentimientos/orgulloso.gif"),
  preocupado: require("../../assets/gifs/sentimientos/preocupado.gif"),
  sorprendido: require("../../assets/gifs/sentimientos/sorprendido.gif"),
  timido: require("../../assets/gifs/sentimientos/timido.gif"),
  tranquilo: require("../../assets/gifs/sentimientos/tranquilo.gif"),
  triste: require("../../assets/gifs/sentimientos/triste.gif"),

  // ── Nivel 5 · Números ──
  // Las claves llevan prefijo n para no chocar con los índices numéricos de JS.
  numeros: require("../../assets/gifs/numeros/numeros.gif"),
  n0: require("../../assets/gifs/numeros/0.gif"),
  n1: require("../../assets/gifs/numeros/1.gif"),
  n2: require("../../assets/gifs/numeros/2.gif"),
  n3: require("../../assets/gifs/numeros/3.gif"),
  n4: require("../../assets/gifs/numeros/4.gif"),
  n5: require("../../assets/gifs/numeros/5.gif"),
  n6: require("../../assets/gifs/numeros/6.gif"),
  n7: require("../../assets/gifs/numeros/7.gif"),
  n8: require("../../assets/gifs/numeros/8.gif"),
  n9: require("../../assets/gifs/numeros/9.gif"),
  n10: require("../../assets/gifs/numeros/10.gif"),
  n11: require("../../assets/gifs/numeros/11.gif"),
  n12: require("../../assets/gifs/numeros/12.gif"),
  n13: require("../../assets/gifs/numeros/13.gif"),
  n14: require("../../assets/gifs/numeros/14.gif"),
  n15: require("../../assets/gifs/numeros/15.gif"),
  n16: require("../../assets/gifs/numeros/16.gif"),
  n17: require("../../assets/gifs/numeros/17.gif"),
  n18: require("../../assets/gifs/numeros/18.gif"),
  n19: require("../../assets/gifs/numeros/19.gif"),
  n20: require("../../assets/gifs/numeros/20.gif"),
  n30: require("../../assets/gifs/numeros/30.gif"),
  n40: require("../../assets/gifs/numeros/40.gif"),
  n50: require("../../assets/gifs/numeros/50.gif"),
  n60: require("../../assets/gifs/numeros/60.gif"),
  n70: require("../../assets/gifs/numeros/70.gif"),
  n80: require("../../assets/gifs/numeros/80.gif"),
  n90: require("../../assets/gifs/numeros/90.gif"),
  n100: require("../../assets/gifs/numeros/100.gif"),
  n1000: require("../../assets/gifs/numeros/1000.gif"),
};

// Un número se puede escribir con dígitos o con letras: las dos valen.
const NUMEROS_EN_LETRAS = {
  0: "cero", 1: "uno", 2: "dos", 3: "tres", 4: "cuatro",
  5: "cinco", 6: "seis", 7: "siete", 8: "ocho", 9: "nueve",
  10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce",
  15: "quince", 16: "dieciséis", 17: "diecisiete", 18: "dieciocho",
  19: "diecinueve", 20: "veinte", 30: "treinta", 40: "cuarenta",
  50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta",
  90: "noventa", 100: "cien", 1000: "mil",
};

// Normaliza texto para comparar respuestas libres: minúsculas, sin tildes ni signos.
const normalizarTexto = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa cada vocal de su tilde (á -> a + ´)
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code < 0x0300 || code > 0x036f; // descarta marcas diacríticas combinantes
    })
    .join("")
    .replace(/[¿?¡!.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
    totalXP: 290,
    lecciones: [
      {
        id: 1,
        titulo: "Letras A–E",
        descripcion: "Las primeras cinco letras con GIFs y ejercicios.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza", letra: "A" },
          { tipo: "ensenanza", letra: "B" },
          { tipo: "ensenanza", letra: "C" },
          { tipo: "ensenanza", letra: "D" },
          { tipo: "ensenanza", letra: "E" },
          // ── Bloque 2 (items 6-10): Tipo 2,3,2,4,3 ──
          {
            tipo: "elegir_sena",
            letra: "A",
            opcionesLetras: ["C", "D", "A"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "B",
            opciones: ["D", "C", "B", "E"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "D",
            opcionesLetras: ["A", "E", "D"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["B", "E", "B", "E"],
            palabraCorrecta: "BEBE",
            letrasDisponibles: [
              "A",
              "K",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "F",
              "E",
              "B",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "E",
            opciones: ["A", "E", "C", "D"],
            correcta: 1,
          },
          // ── Bloque 3 (items 11-15): Tipo 4,3,2,3,4 ──
          {
            tipo: "que_palabra",
            secuencia: ["C", "E", "D", "E"],
            palabraCorrecta: "CEDE",
            letrasDisponibles: [
              "A",
              "K",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "D",
              "E",
              "B",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "C",
            opciones: ["C", "A", "D", "E"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena",
            letra: "C",
            opcionesLetras: ["B", "E", "C"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "A",
            opciones: ["D", "A", "B", "E"],
            correcta: 1,
          },
          {
            tipo: "que_palabra",
            secuencia: ["C", "A", "D", "A"],
            palabraCorrecta: "CADA",
            letrasDisponibles: [
              "A",
              "C",
              "D",
              "S",
              "H",
              "E",
              "J",
              "F",
              "E",
              "L",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          // ── Bloque 4 (items 16-20): Tipo 4,2,3,2,4 ──
          {
            tipo: "que_palabra",
            secuencia: ["C", "A", "B", "E"],
            palabraCorrecta: "CABE",
            letrasDisponibles: [
              "A",
              "K",
              "D",
              "S",
              "C",
              "E",
              "J",
              "F",
              "E",
              "B",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "E",
            opcionesLetras: ["A", "C", "E"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "D",
            opciones: ["E", "B", "A", "D"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena",
            letra: "B",
            opcionesLetras: ["D", "A", "B"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["D", "E", "B", "E"],
            palabraCorrecta: "DEBE",
            letrasDisponibles: [
              "A",
              "D",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "S",
              "E",
              "B",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
        ],
      },
      // ── Sección 2: F G H I J ───────────────────────────────────────
      {
        id: 2,
        titulo: "Letras F–J",
        descripcion: "Cinco nuevas letras con GIFs y ejercicios.",
        xp: 50,
        items: [
          { tipo: "ensenanza", letra: "F" },
          { tipo: "ensenanza", letra: "G" },
          { tipo: "ensenanza", letra: "H" },
          { tipo: "ensenanza", letra: "I" },
          { tipo: "ensenanza", letra: "J" },
          // Bloque 2: 2,3,2,2,4
          {
            tipo: "elegir_sena",
            letra: "I",
            opcionesLetras: ["H", "J", "I"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "I",
            opciones: ["A", "I", "F", "J"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena",
            letra: "G",
            opcionesLetras: ["F", "H", "G"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "F",
            opcionesLetras: ["G", "I", "F"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["J", "E", "F", "E"],
            palabraCorrecta: "JEFE",
            letrasDisponibles: [
              "A",
              "C",
              "D",
              "S",
              "H",
              "E",
              "J",
              "F",
              "E",
              "L",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          // Bloque 3: 3,3,2,4,3
          {
            tipo: "que_letra",
            gifLetra: "H",
            opciones: ["J", "H", "B", "E"],
            correcta: 1,
          },
          {
            tipo: "que_letra",
            gifLetra: "F",
            opciones: ["F", "I", "J", "E"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena",
            letra: "H",
            opcionesLetras: ["I", "J", "H"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["A", "B", "E", "J", "A"],
            palabraCorrecta: "ABEJA",
            letrasDisponibles: [
              "A",
              "K",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "D",
              "E",
              "B",
              "J",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "J",
            opciones: ["F", "B", "J", "H"],
            correcta: 2,
          },
          // Bloque 4: 2,4,4,3,4
          {
            tipo: "elegir_sena",
            letra: "J",
            opcionesLetras: ["I", "H", "J"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["H", "I", "J", "O"],
            palabraCorrecta: "HIJO",
            letrasDisponibles: [
              "I",
              "K",
              "D",
              "S",
              "C",
              "E",
              "J",
              "D",
              "E",
              "H",
              "W",
              "Q",
              "C",
              "P",
              "S",
              "O",
            ],
          },
          {
            tipo: "que_palabra",
            secuencia: ["D", "E", "J", "A"],
            palabraCorrecta: "DEJA",
            letrasDisponibles: [
              "A",
              "J",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "F",
              "E",
              "B",
              "W",
              "D",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "G",
            opciones: ["B", "J", "C", "G"],
            correcta: 3,
          },
          {
            tipo: "que_palabra",
            secuencia: ["B", "A", "J", "E"],
            palabraCorrecta: "BAJE",
            letrasDisponibles: [
              "A",
              "D",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "S",
              "J",
              "B",
              "W",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
        ],
      },
      // ── Sección 3: K L M N Ñ ───────────────────────────────────────
      {
        id: 3,
        titulo: "Letras K–Ñ",
        descripcion: "Cinco nuevas letras con GIFs y ejercicios.",
        xp: 50,
        items: [
          { tipo: "ensenanza", letra: "K" },
          { tipo: "ensenanza", letra: "L" },
          { tipo: "ensenanza", letra: "M" },
          { tipo: "ensenanza", letra: "N" },
          { tipo: "ensenanza", letra: "Ñ" },
          // Bloque 2: 3,2,4,2,2
          {
            tipo: "que_letra",
            gifLetra: "L",
            opciones: ["A", "F", "L", "D"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "K",
            opcionesLetras: ["L", "M", "K"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["G", "E", "N", "I", "A", "L"],
            palabraCorrecta: "GENIAL",
            letrasDisponibles: [
              "L",
              "D",
              "G",
              "S",
              "I",
              "E",
              "A",
              "S",
              "J",
              "B",
              "N",
              "M",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "L",
            opcionesLetras: ["K", "N", "L"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "M",
            opcionesLetras: ["N", "L", "M"],
            correcta: 2,
          },
          // Bloque 3: 2,3,4,3,4
          {
            tipo: "elegir_sena",
            letra: "N",
            opcionesLetras: ["M", "Ñ", "N"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "M",
            opciones: ["F", "I", "M", "E"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["N", "I", "Ñ", "A"],
            palabraCorrecta: "NIÑA",
            letrasDisponibles: [
              "I",
              "O",
              "D",
              "Ñ",
              "C",
              "E",
              "G",
              "O",
              "N",
              "B",
              "W",
              "M",
              "G",
              "I",
              "S",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "K",
            opciones: ["D", "L", "M", "K"],
            correcta: 3,
          },
          {
            tipo: "que_palabra",
            secuencia: ["B", "I", "E", "N"],
            palabraCorrecta: "BIEN",
            letrasDisponibles: [
              "A",
              "J",
              "O",
              "I",
              "C",
              "E",
              "G",
              "A",
              "E",
              "B",
              "L",
              "D",
              "C",
              "P",
              "E",
              "N",
            ],
          },
          // Bloque 4: 4,3,4,3,2
          {
            tipo: "que_palabra",
            secuencia: ["M", "E", "D", "I", "A"],
            palabraCorrecta: "MEDIA",
            letrasDisponibles: [
              "A",
              "C",
              "B",
              "S",
              "D",
              "O",
              "E",
              "F",
              "M",
              "L",
              "W",
              "N",
              "C",
              "P",
              "I",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "Ñ",
            opciones: ["K", "L", "Ñ", "N"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["K", "I", "L", "O", "G", "R", "A", "M", "O"],
            palabraCorrecta: "KILOGRAMO",
            letrasDisponibles: [
              "A",
              "K",
              "G",
              "O",
              "C",
              "E",
              "B",
              "I",
              "R",
              "O",
              "J",
              "Q",
              "M",
              "P",
              "L",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "N",
            opciones: ["H", "N", "E", "Ñ"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena",
            letra: "Ñ",
            opcionesLetras: ["N", "M", "Ñ"],
            correcta: 2,
          },
        ],
      },
      // ── Sección 4: O P Q R S ───────────────────────────────────────
      {
        id: 4,
        titulo: "Letras O–S",
        descripcion: "Cinco nuevas letras con GIFs y ejercicios.",
        xp: 50,
        items: [
          { tipo: "ensenanza", letra: "O" },
          { tipo: "ensenanza", letra: "P" },
          { tipo: "ensenanza", letra: "Q" },
          { tipo: "ensenanza", letra: "R" },
          { tipo: "ensenanza", letra: "S" },
          // Bloque 2: 3,2,2,4,3
          {
            tipo: "que_letra",
            gifLetra: "S",
            opciones: ["I", "S", "H", "J"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena",
            letra: "O",
            opcionesLetras: ["P", "Q", "O"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "Q",
            opcionesLetras: ["O", "R", "Q"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["P", "I", "S", "O"],
            palabraCorrecta: "PISO",
            letrasDisponibles: [
              "A",
              "C",
              "D",
              "S",
              "H",
              "O",
              "J",
              "P",
              "E",
              "L",
              "I",
              "Q",
              "C",
              "P",
              "L",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "R",
            opciones: ["Q", "I", "R", "E"],
            correcta: 2,
          },
          // Bloque 3: 3,2,4,3,4
          {
            tipo: "que_letra",
            gifLetra: "Q",
            opciones: ["Q", "O", "S", "R"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena",
            letra: "R",
            opcionesLetras: ["Q", "S", "R"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["R", "E", "A", "L"],
            palabraCorrecta: "REAL",
            letrasDisponibles: [
              "I",
              "K",
              "I",
              "S",
              "C",
              "E",
              "J",
              "D",
              "L",
              "E",
              "R",
              "W",
              "Q",
              "C",
              "A",
              "S",
              "O",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "O",
            opciones: ["B", "L", "D", "O"],
            correcta: 3,
          },
          {
            tipo: "que_palabra",
            secuencia: ["S", "E", "Ñ", "O", "R", "A"],
            palabraCorrecta: "SEÑORA",
            letrasDisponibles: [
              "A",
              "Ñ",
              "Q",
              "S",
              "C",
              "E",
              "B",
              "O",
              "E",
              "R",
              "J",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          // Bloque 4: 3,2,4,2,4
          {
            tipo: "que_letra",
            gifLetra: "P",
            opciones: ["Q", "P", "C", "L"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena",
            letra: "S",
            opcionesLetras: ["R", "Q", "S"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["E", "M", "P", "L", "E", "O"],
            palabraCorrecta: "EMPLEO",
            letrasDisponibles: [
              "P",
              "J",
              "Q",
              "S",
              "L",
              "E",
              "B",
              "F",
              "S",
              "E",
              "M",
              "W",
              "D",
              "N",
              "O",
              "R",
              "A",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "P",
            opcionesLetras: ["Q", "R", "P"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["P", "R", "E", "M", "I", "O"],
            palabraCorrecta: "PREMIO",
            letrasDisponibles: [
              "A",
              "D",
              "Q",
              "M",
              "C",
              "E",
              "B",
              "O",
              "J",
              "I",
              "W",
              "R",
              "C",
              "P",
              "E",
              "A",
            ],
          },
        ],
      },
      // ── Sección 5: T U V W X ───────────────────────────────────────
      {
        id: 5,
        titulo: "Letras T–X",
        descripcion: "Cinco nuevas letras con GIFs y ejercicios.",
        xp: 50,
        items: [
          { tipo: "ensenanza", letra: "T" },
          { tipo: "ensenanza", letra: "U" },
          { tipo: "ensenanza", letra: "V" },
          { tipo: "ensenanza", letra: "W" },
          { tipo: "ensenanza", letra: "X" },
          // Bloque 2: 2,2,3,4,2
          {
            tipo: "elegir_sena",
            letra: "V",
            opcionesLetras: ["U", "W", "V"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "T",
            opcionesLetras: ["U", "V", "T"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "T",
            opciones: ["W", "T", "I", "G"],
            correcta: 1,
          },
          {
            tipo: "que_palabra",
            secuencia: ["T", "E", "X", "T", "O"],
            palabraCorrecta: "TEXTO",
            letrasDisponibles: [
              "I",
              "K",
              "I",
              "T",
              "C",
              "E",
              "T",
              "D",
              "L",
              "E",
              "R",
              "W",
              "Q",
              "X",
              "A",
              "K",
              "O",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "W",
            opcionesLetras: ["V", "X", "W"],
            correcta: 2,
          },
          // Bloque 3: 4,3,2,3,4
          {
            tipo: "que_palabra",
            secuencia: ["R", "U", "T", "A"],
            palabraCorrecta: "RUTA",
            letrasDisponibles: [
              "E",
              "D",
              "Q",
              "A",
              "C",
              "U",
              "B",
              "T",
              "J",
              "I",
              "W",
              "R",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "V",
            opciones: ["J", "X", "V", "U"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena",
            letra: "X",
            opcionesLetras: ["W", "V", "X"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "X",
            opciones: ["F", "W", "X", "R"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["W", "I", "F", "I"],
            palabraCorrecta: "WIFI",
            letrasDisponibles: [
              "A",
              "I",
              "Q",
              "S",
              "W",
              "E",
              "B",
              "T",
              "E",
              "R",
              "I",
              "Q",
              "C",
              "F",
              "E",
              "A",
            ],
          },
          // Bloque 4: 4,2,4,3,3
          {
            tipo: "que_palabra",
            secuencia: ["A", "U", "T", "O"],
            palabraCorrecta: "AUTO",
            letrasDisponibles: [
              "A",
              "C",
              "D",
              "S",
              "H",
              "O",
              "J",
              "P",
              "E",
              "L",
              "I",
              "Q",
              "T",
              "P",
              "L",
              "A",
              "U",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "U",
            opcionesLetras: ["T", "V", "U"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["V", "E", "N", "T", "A", "N", "A"],
            palabraCorrecta: "VENTANA",
            letrasDisponibles: [
              "N",
              "M",
              "Q",
              "T",
              "L",
              "E",
              "B",
              "F",
              "S",
              "E",
              "A",
              "W",
              "D",
              "N",
              "O",
              "V",
              "A",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "W",
            opciones: ["V", "W", "U", "L"],
            correcta: 1,
          },
          {
            tipo: "que_letra",
            gifLetra: "U",
            opciones: ["X", "O", "T", "U"],
            correcta: 3,
          },
        ],
      },
      // ── Sección 6: Y Z CH LL ───────────────────────────────────────
      {
        id: 6,
        titulo: "Letras Y, Z, CH, LL",
        descripcion: "Las últimas letras del abecedario LSA.",
        xp: 40,
        items: [
          { tipo: "ensenanza", letra: "Y" },
          { tipo: "ensenanza", letra: "Z" },
          { tipo: "ensenanza", letra: "CH" },
          { tipo: "ensenanza", letra: "LL" },
          // Bloque 2: 3,2,3,4
          {
            tipo: "que_letra",
            gifLetra: "Z",
            opciones: ["B", "Y", "CH", "Z"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena",
            letra: "CH",
            opcionesLetras: ["LL", "Y", "CH"],
            correcta: 2,
          },
          {
            tipo: "que_letra",
            gifLetra: "Y",
            opciones: ["Z", "Y", "G", "S"],
            correcta: 1,
          },
          {
            tipo: "que_palabra",
            secuencia: ["Z", "O", "N", "A"],
            palabraCorrecta: "ZONA",
            letrasDisponibles: [
              "I",
              "K",
              "Z",
              "S",
              "C",
              "E",
              "J",
              "D",
              "L",
              "E",
              "R",
              "W",
              "N",
              "C",
              "A",
              "S",
              "O",
            ],
          },
          // Bloque 3: 3,2,4,2
          {
            tipo: "que_letra",
            gifLetra: "CH",
            opciones: ["CH", "X", "LL", "Y"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena",
            letra: "Y",
            opcionesLetras: ["Z", "CH", "Y"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["M", "A", "Y", "O", "R"],
            palabraCorrecta: "MAYOR",
            letrasDisponibles: [
              "A",
              "Ñ",
              "O",
              "S",
              "R",
              "E",
              "B",
              "M",
              "Y",
              "R",
              "J",
              "Q",
              "C",
              "P",
              "E",
              "A",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "Z",
            opcionesLetras: ["Y", "LL", "Z"],
            correcta: 2,
          },
          // Bloque 4: 4,2,4,3
          {
            tipo: "que_palabra",
            secuencia: ["LL", "A", "V", "E"],
            palabraCorrecta: "LLAVE",
            letrasDisponibles: [
              "V",
              "C",
              "D",
              "LL",
              "A",
              "O",
              "J",
              "P",
              "E",
              "L",
              "I",
              "Q",
              "C",
              "P",
              "L",
              "A",
            ],
          },
          {
            tipo: "elegir_sena",
            letra: "LL",
            opcionesLetras: ["CH", "Y", "LL"],
            correcta: 2,
          },
          {
            tipo: "que_palabra",
            secuencia: ["CH", "O", "Q", "U", "E"],
            palabraCorrecta: "CHOQUE",
            letrasDisponibles: [
              "P",
              "U",
              "Q",
              "S",
              "L",
              "E",
              "B",
              "CH",
              "S",
              "Q",
              "M",
              "C",
              "D",
              "N",
              "O",
              "R",
              "E",
            ],
          },
          {
            tipo: "que_letra",
            gifLetra: "LL",
            opciones: ["I", "LL", "H", "Z"],
            correcta: 1,
          },
        ],
      },
    ],
  },
  {
    id: 2, // NIVEL 2
    nombre: "Saludos y presentaciones",
    descripcion: "Nombre, apellido, DNI y preguntas básicas.",
    totalXP: 280,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 2
        titulo: "Nombre y datos",
        descripcion: "apellido, DNI, nombre, oyente y presentándonos.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "apellido",
            nombre: "apellido",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "dni", nombre: "DNI" },
          { tipo: "ensenanza_palabra", gifPalabra: "nombre", nombre: "nombre" },
          { tipo: "ensenanza_palabra", gifPalabra: "oyente", nombre: "oyente" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "presentandonos",
            nombre: "presentándonos",
          },
          // ── Bloque 2 (items 6-10): Tipo 2,3,2,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "apellido",
            opcionesGifs: ["nombre", "dni", "apellido"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "oyente",
            opciones: ["sordo", "DNI", "oyente", "nombre"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "nombre",
            opcionesGifs: ["presentandonos", "nombre", "oyente"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "dni",
            respuestaCorrecta: "DNI",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "presentandonos",
            opciones: ["oyente", "presentándonos", "apellido", "nombre"],
            correcta: 1,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,2,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "nombre",
            respuestaCorrecta: "nombre",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "apellido",
            opciones: ["apellido", "presentándonos", "nombre", "DNI"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "presentándonos",
            opcionesGifs: ["apellido", "oyente", "presentandonos"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "dni",
            opciones: ["oyente", "DNI", "nombre", "sordo"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "oyente",
            respuestaCorrecta: "oyente",
          },
          // ── Bloque 4 (items 16-20): Tipo 5,2,5,2,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "apellido",
            respuestaCorrecta: "apellido",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "oyente",
            opcionesGifs: ["oyente", "nombre", "dni"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "presentandonos",
            respuestaCorrecta: "presentándonos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "nombre",
            opciones: ["sordo", "oyente", "apellido", "nombre"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "DNI",
            opcionesGifs: ["dni", "nombre", "apellido"],
            correcta: 0,
          },
        ],
      },
      {
        id: 2, // SECCIÓN 2, nivel 2
        titulo: "Preguntas básicas",
        descripcion: "sordo y las preguntas ¿cómo?, ¿cuál? y ¿cuándo?.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "sordo", nombre: "sordo" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "comoestas",
            nombre: "¿cómo estás?",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "como", nombre: "¿cómo?" },
          { tipo: "ensenanza_palabra", gifPalabra: "cual", nombre: "¿cuál?" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "cuando",
            nombre: "¿cuándo?",
          },
          // ── Bloque 2 (items 6-10): Tipo 2,3,2,2,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo?",
            opcionesGifs: ["comoestas", "como", "cual"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cuando",
            opciones: ["¿qué?", "¿cuánto?", "¿cómo estás?", "¿cuándo?"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sordo",
            opcionesGifs: ["sordo", "como", "cuando"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo estás?",
            opcionesGifs: ["como", "comoestas", "cual"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cual",
            respuestaCorrecta: "¿cuál?",
          },
          // ── Bloque 3 (items 11-15): Tipo 3,3,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sordo",
            opciones: ["¿cómo estás?", "sordo", "oyente", "¿cuál?"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comoestas",
            opciones: ["¿cuándo?", "¿cómo estás?", "¿cómo?", "¿cuál?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuándo?",
            opcionesGifs: ["cual", "cuando", "como"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "como",
            respuestaCorrecta: "¿cómo?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cual",
            opciones: ["¿cómo?", "¿cuándo?", "¿cuál?", "¿quién?"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 2,5,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuál?",
            opcionesGifs: ["cuando", "cual", "comoestas"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comoestas",
            respuestaCorrecta: "¿cómo estás?",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sordo",
            respuestaCorrecta: "sordo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "como",
            opciones: ["¿cómo?", "¿cuánto?", "¿cuál?", "¿cómo estás?"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cuando",
            respuestaCorrecta: "¿cuándo?",
          },
        ],
      },
      {
        id: 3, // SECCIÓN 3, nivel 2
        titulo: "Cuánto, dónde y por qué",
        descripcion:
          "¿cuánto?, ¿cuál es tu edad?, ¿dónde?, ¿para qué?, ¿por qué?.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "cuanto",
            nombre: "¿cuánto?",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "cualestuedad",
            nombre: "¿cuál es tu edad?",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "donde", nombre: "¿dónde?" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "paraque",
            nombre: "¿para qué?",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "porque",
            nombre: "¿por qué?",
          },
          // ── Bloque 2 (items 6-10): Tipo 3,2,5,2,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "donde",
            opciones: ["¿cómo estás?", "¿dónde?", "oyente", "¿cuál?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuál es tu edad?",
            opcionesGifs: ["donde", "cualestuedad", "paraque"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porque",
            respuestaCorrecta: "¿por qué?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿para qué?",
            opcionesGifs: ["porque", "cuanto", "paraque"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuánto?",
            opcionesGifs: ["cuanto", "donde", "cualestuedad"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 2,3,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿dónde?",
            opcionesGifs: ["paraque", "donde", "porque"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cualestuedad",
            opciones: ["¿cuál es tu edad?", "¿cómo estás?", "oyente", "¿cuál?"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cuanto",
            respuestaCorrecta: "¿cuánto?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porque",
            opciones: [
              "¿cómo te sentís?",
              "¿por qué?",
              "¿cuánto?",
              "¿para qué?",
            ],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "paraque",
            respuestaCorrecta: "¿para qué?",
          },
          // ── Bloque 4 (items 16-20): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "donde",
            respuestaCorrecta: "¿dónde?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "paraque",
            opciones: ["¿cómo estás?", "¿cuál?", "¿por qué?", "¿para qué?"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cualestuedad",
            respuestaCorrecta: "¿cuál es tu edad?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cuanto",
            opciones: ["¿cuánto?", "¿cuál?", "¿cómo?", "¿de qué?"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿por qué?",
            opcionesGifs: ["porque", "paraque", "cuanto"],
            correcta: 0,
          },
        ],
      },
      {
        id: 4, // SECCIÓN 4, nivel 2
        titulo: "Qué, quién y de qué",
        descripcion: "¿qué decís?, ¿qué?, ¿quién?, ¿cómo te llamas?, ¿de qué?.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "quedice",
            nombre: "¿qué decís?",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "que", nombre: "¿qué?" },
          { tipo: "ensenanza_palabra", gifPalabra: "quien", nombre: "¿quién?" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "comotellamas",
            nombre: "¿cómo te llamas?",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "deque",
            nombre: "¿de qué?",
          },
          // ── Bloque 2 (items 6-10): Tipo 3,2,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "quien",
            opciones: ["¿cuál?", "¿quién?", "¿quién?", "¿cómo?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo te llamás?",
            opcionesGifs: ["quedice", "comotellamas", "deque"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿qué?",
            opcionesGifs: ["que", "quien", "deque"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "deque",
            respuestaCorrecta: "¿de qué?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "quedice",
            opciones: ["¿qué?", "¿qué decís?", "¿de qué?", "¿cómo te llamas?"],
            correcta: 1,
          },
          // ── Bloque 3 (items 11-15): Tipo 3,2,5,3,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "que",
            opciones: ["¿de qué?", "¿qué?", "¿quién?", "¿cómo?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿de qué?",
            opcionesGifs: ["que", "deque", "quien"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "quedice",
            respuestaCorrecta: "¿qué decís?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comotellamas",
            opciones: [
              "¿cuál es tu edad?",
              "¿cómo te llamas?",
              "¿cómo estás?",
              "¿de qué?",
            ],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "quien",
            respuestaCorrecta: "¿quién?",
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,2,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deque",
            opciones: ["¿quién?", "¿para qué?", "¿por qué?", "¿de qué?"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿quién?",
            opcionesGifs: ["que", "quien", "deque"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comotellamas",
            respuestaCorrecta: "¿cómo te llamas?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿qué decís?",
            opcionesGifs: ["comotellamas", "quedice", "deque"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "que",
            respuestaCorrecta: "¿qué?",
          },
        ],
      },
      {
        id: 5, // SECCIÓN 5, nivel 2
        titulo: "Repaso del nivel",
        descripcion: "Practicá las 20 señas del nivel.",
        xp: 80,
        items: [
          // ── Bloque 1 (items 1-10): Tipo 2,3,2,5,3,2,5,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuál?",
            opcionesGifs: ["cuando", "cual", "como"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sordo",
            opciones: ["¿cómo estás?", "oyente", "sordo", "¿cuál?"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "apellido",
            opcionesGifs: ["nombre", "apellido", "dni"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comoestas",
            respuestaCorrecta: "¿cómo estás?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "que",
            opciones: ["¿de qué?", "¿quién?", "¿qué?", "¿cómo?"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "oyente",
            opcionesGifs: ["oyente", "nombre", "sordo"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cuanto",
            respuestaCorrecta: "¿cuánto?",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "dni",
            respuestaCorrecta: "DNI",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comotellamas",
            opciones: ["¿cómo te llamas?", "¿cuál es tu edad?", "¿cómo estás?"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sordo",
            opcionesGifs: ["sordo", "oyente", "cual"],
            correcta: 0,
          },
          // ── Bloque 2 (items 11-20): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comoestas",
            opciones: ["¿cuándo?", "¿cómo estás?", "¿cómo?", "¿cuál?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿dónde?",
            opcionesGifs: ["paraque", "donde", "porque"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "quien",
            respuestaCorrecta: "¿quién?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo?",
            opcionesGifs: ["comoestas", "como", "cual"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿qué?",
            opcionesGifs: ["que", "quien", "deque"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "apellido",
            opciones: ["DNI", "presentándonos", "nombre", "apellido"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cual",
            respuestaCorrecta: "¿cuál?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuál es tu edad?",
            opcionesGifs: ["donde", "cualestuedad", "comoestas"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comotellamas",
            respuestaCorrecta: "¿cómo te llamas?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "quien",
            opciones: ["¿cuál?", "¿quién?", "¿quién?", "¿cómo?"],
            correcta: 1,
          },
          // ── Bloque 3 (items 21-30): Tipo 2,3,2,2,5,3,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿qué decís?",
            opcionesGifs: ["que", "quedice", "deque"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "oyente",
            opciones: ["oyente", "DNI", "sordo", "nombre"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "presentándonos",
            opcionesGifs: ["apellido", "oyente", "presentandonos"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿para qué?",
            opcionesGifs: ["porque", "cuanto", "paraque"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sordo",
            respuestaCorrecta: "sordo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "quedice",
            opciones: ["¿qué?", "¿qué decís?", "¿de qué?", "¿cómo te llamas?"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿por qué?",
            opcionesGifs: ["porque", "paraque", "cuanto"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cuando",
            respuestaCorrecta: "¿cuándo?",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "como",
            respuestaCorrecta: "¿cómo?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "donde",
            opciones: ["¿cómo estás?", "¿dónde?", "¿quién?", "¿cuál?"],
            correcta: 1,
          },
          // ── Motivación: van 30 ejercicios ──
          {
            tipo: "motivacion",
            variante: "check",
            titulo: "¡seguí así!",
            subtitulo: "Ya llevás 30 ejercicios de esta sección",
          },
          // ── Bloque 4 (items 31-40): Tipo 5,3,5,3,2,2,5,3,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "que",
            respuestaCorrecta: "¿qué?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "paraque",
            opciones: ["¿cómo estás?", "¿cuál?", "¿por qué?", "¿para qué?"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cualestuedad",
            respuestaCorrecta: "¿cuál es tu edad?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cuanto",
            opciones: ["¿cuánto?", "¿cuál?", "¿cómo?", "¿de qué?"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿quién?",
            opcionesGifs: ["que", "quien", "deque"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo estás?",
            opcionesGifs: ["como", "comoestas", "cual"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "nombre",
            respuestaCorrecta: "nombre",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deque",
            opciones: ["¿quién?", "¿para qué?", "¿por qué?", "¿de qué?"],
            correcta: 3,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porque",
            opciones: [
              "¿cómo te sentís?",
              "¿por qué?",
              "¿cuánto?",
              "¿para qué?",
            ],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "apellido",
            respuestaCorrecta: "apellido",
          },
          // ── Motivación: van 40 ejercicios ──
          {
            tipo: "motivacion",
            variante: "estrella",
            titulo: "¡vamos por más!",
            subtitulo: "40 ejercicios completados, ya falta poco",
          },
          // ── Bloque 5 (items 41-50): Tipo 5,2,3,2,5,3,2,5,2,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "quedice",
            respuestaCorrecta: "¿qué decís?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cómo te llamás?",
            opcionesGifs: ["quedice", "comotellamas", "deque"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "presentandonos",
            opciones: ["hola", "presentándonos", "apellido", "nombre"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuánto?",
            opcionesGifs: ["cuanto", "donde", "cualestuedad"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "deque",
            respuestaCorrecta: "¿de qué?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cualestuedad",
            opciones: ["¿cuál es tu edad?", "¿cómo estás?", "oyente", "¿cuál?"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "nombre",
            opcionesGifs: ["apellido", "nombre", "oyente"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porque",
            respuestaCorrecta: "¿por qué?",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "DNI",
            opcionesGifs: ["dni", "nombre", "apellido"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cual",
            opciones: ["¿cómo?", "¿cuándo?", "¿cuál?", "¿quién?"],
            correcta: 2,
          },
          // ── Bloque 6 (items 51-60): Tipo 3,2,2,5,3,3,5,3,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "como",
            opciones: ["¿cómo?", "¿cuánto?", "¿cuál?", "¿cómo estás?"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿de qué?",
            opcionesGifs: ["que", "deque", "quien"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "¿cuándo?",
            opcionesGifs: ["cual", "cuando", "como"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "donde",
            respuestaCorrecta: "¿dónde?",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "nombre",
            opciones: ["sordo", "oyente", "apellido", "nombre"],
            correcta: 3,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "dni",
            opciones: ["oyente", "DNI", "nombre", "sordo"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "presentandonos",
            respuestaCorrecta: "presentándonos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cuando",
            opciones: ["¿qué?", "¿cuánto?", "¿cómo estás?", "¿cuándo?"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "paraque",
            respuestaCorrecta: "¿para qué?",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "oyente",
            respuestaCorrecta: "oyente",
          },
          // ── Motivación: fin de la sección (y del nivel) ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡felicidades!",
            subtitulo: "Ya sabés lo básico para comunicarte por LSA",
            textoBoton: "¡Terminar!",
          },
        ],
      },
    ],
  },
  {
    id: 3, // NIVEL 3
    nombre: "Interacciones cotidianas",
    descripcion: "Saludos, cortesía y frases del día a día.",
    totalXP: 300,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 3
        titulo: "Saludos",
        descripcion: "saludos, hola, chau, gracias y bienvenida.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "saludos",
            nombre: "saludos",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "hola", nombre: "hola" },
          { tipo: "ensenanza_palabra", gifPalabra: "chau", nombre: "chau" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "gracias",
            nombre: "gracias",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "bienvenida",
            nombre: "bienvenida",
          },
          // ── Bloque 2 (items 6-10): Tipo 3,2,5,2,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hola",
            opciones: ["chau", "gracias", "hola", "saludo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "gracias",
            opcionesGifs: ["hola", "gracias", "chau"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bienvenida",
            respuestaCorrecta: "bienvenida",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "chau",
            opcionesGifs: ["hola", "saludos", "chau"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "saludos",
            opcionesGifs: ["saludos", "bienvenida", "hola"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 2,3,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "hola",
            opcionesGifs: ["chau", "hola", "gracias"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "saludos",
            opciones: ["hola", "saludos", "oyente", "gracias"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "chau",
            respuestaCorrecta: "chau",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bienvenida",
            opciones: ["saludos", "bienvenida", "presentándonos", "nombre"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gracias",
            respuestaCorrecta: "gracias",
          },
          // ── Bloque 4 (items 16-20): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "saludos",
            respuestaCorrecta: "saludos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gracias",
            opciones: ["gracias", "de nada", "hola", "chau"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hola",
            respuestaCorrecta: "hola",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "chau",
            opciones: ["hola", "bienvenida", "chau", "bien"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bienvenida",
            opcionesGifs: ["gracias", "chau", "bienvenida"],
            correcta: 2,
          },
        ],
      },
      {
        id: 2, // SECCIÓN 2, nivel 3
        titulo: "Cortesía",
        descripcion: "permiso, perdón, bien, mal, basta y por favor.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "permiso",
            nombre: "permiso",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "perdon", nombre: "perdón" },
          { tipo: "ensenanza_palabra", gifPalabra: "bien", nombre: "bien" },
          { tipo: "ensenanza_palabra", gifPalabra: "mal", nombre: "mal" },
          { tipo: "ensenanza_palabra", gifPalabra: "basta", nombre: "basta" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "porfavor",
            nombre: "por favor",
          },
          // ── Bloque 2 (items 7-12): Tipo 3,2,5,3,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "perdon",
            opciones: ["de nada", "por favor", "gracias", "perdón"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "basta",
            opcionesGifs: ["basta", "mal", "permiso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mal",
            respuestaCorrecta: "mal",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porfavor",
            opciones: ["gracias", "permiso", "por favor", "perdón"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "permiso",
            respuestaCorrecta: "permiso",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bien",
            opcionesGifs: ["mal", "bien", "basta"],
            correcta: 1,
          },
          // ── Bloque 3 (items 13-18): Tipo 5,3,5,3,2,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "perdon",
            respuestaCorrecta: "perdón",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "basta",
            opciones: ["frenar", "basta", "para", "espera"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porfavor",
            respuestaCorrecta: "por favor",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "permiso",
            opciones: ["bienvenido", "por favor", "permiso", "perdón"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mal",
            opcionesGifs: ["bien", "basta", "mal"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bien",
            opciones: ["bueno", "mal", "bien", "malo"],
            correcta: 2,
          },
          // ── Bloque 4 (items 19-24): Tipo 3,5,2,2,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mal",
            opciones: ["mal", "bien", "malo", "bueno"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "basta",
            respuestaCorrecta: "basta",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "perdón",
            opcionesGifs: ["perdon", "permiso", "porfavor"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "permiso",
            opcionesGifs: ["porfavor", "permiso", "perdon"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bien",
            respuestaCorrecta: "bien",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "por favor",
            opcionesGifs: ["perdon", "gracias", "porfavor"],
            correcta: 2,
          },
        ],
      },
      {
        id: 3, // SECCIÓN 3, nivel 3
        titulo: "Sí, no y comunicación",
        descripcion: "no, por ejemplo, comunicar, sí, conversar y de nada.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          { tipo: "ensenanza_palabra", gifPalabra: "no", nombre: "no" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "porejemplo",
            nombre: "por ejemplo",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "comunicar",
            nombre: "comunicar",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "si", nombre: "sí" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "conversar",
            nombre: "conversar",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "denada",
            nombre: "de nada",
          },
          // ── Bloque 2 (items 7-12): Tipo 2,2,3,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "comunicar",
            opcionesGifs: ["conversar", "comunicar", "denada"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "conversar",
            opcionesGifs: ["conversar", "comunicar", "no"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "no",
            opciones: ["basta", "por favor", "sí", "no"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porejemplo",
            respuestaCorrecta: "por ejemplo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "denada",
            opciones: ["por favor", "gracias", "de nada", "permiso"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sí",
            opcionesGifs: ["no", "si", "basta"],
            correcta: 1,
          },
          // ── Bloque 3 (items 13-18): Tipo 5,2,2,3,5,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "denada",
            respuestaCorrecta: "de nada",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "por ejemplo",
            opcionesGifs: ["porejemplo", "comunicar", "conversar"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "no",
            opcionesGifs: ["si", "basta", "no"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comunicar",
            opciones: ["acceder", "hablar", "comunicar", "charlar"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "conversar",
            respuestaCorrecta: "conversar",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "si",
            opciones: ["no", "sí", "basta", "comunicar"],
            correcta: 1,
          },
          // ── Bloque 4 (items 19-24): Tipo 3,5,2,3,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "conversar",
            opciones: ["expresar", "comunicar", "hablar", "conversar"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "no",
            respuestaCorrecta: "no",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "de nada",
            opcionesGifs: ["gracias", "denada", "porfavor"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porejemplo",
            opciones: ["por ejemplo", "para", "quién", "por favor"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "si",
            respuestaCorrecta: "sí",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comunicar",
            respuestaCorrecta: "comunicar",
          },
        ],
      },
      {
        id: 4, // SECCIÓN 4, nivel 3
        titulo: "Hablar y saludar",
        descripcion: "hablar señas, llamar, hablar oral y saludos del día.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "hablarsenas",
            nombre: "hablar señas",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "llamar", nombre: "llamar" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "hablaroral",
            nombre: "hablar oral",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "buendia",
            nombre: "buen día",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "buenasnoches",
            nombre: "buenas noches",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "buenastardes",
            nombre: "buenas tardes",
          },
          // ── Bloque 2 (items 7-12): Tipo 2,3,2,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "hablar oral",
            opcionesGifs: ["hablarsenas", "hablaroral", "llamar"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "llamar",
            opciones: ["comunicar", "hablar", "llamar", "expresar"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buenas noches",
            opcionesGifs: ["buendia", "buenastardes", "buenasnoches"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hablarsenas",
            respuestaCorrecta: "hablar señas",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buenastardes",
            opciones: ["buen día", "buenas noches", "buenas tardes", "buenas"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "buendia",
            respuestaCorrecta: "buen día",
          },
          // ── Bloque 3 (items 13-18): Tipo 5,2,3,3,2,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "buenasnoches",
            respuestaCorrecta: "buenas noches",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buen día",
            opcionesGifs: ["buendia", "buenasnoches", "buenastardes"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hablarsenas",
            opciones: ["hablar señas", "comunicar", "hablar", "charlar"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hablaroral",
            opciones: ["hablar", "expresar", "hablar oral", "hablar señas"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "llamar",
            opcionesGifs: ["comunicar", "conversar", "llamar"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "buenastardes",
            respuestaCorrecta: "buenas tardes",
          },
          // ── Bloque 4 (items 19-24): Tipo 2,2,3,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "hablar señas",
            opcionesGifs: ["hablarsenas", "hablaroral", "comunicar"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buenas tardes",
            opcionesGifs: ["buenasnoches", "buenastardes", "buendia"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buenasnoches",
            opciones: ["buenas", "buenas tardes", "buenas noches", "buen día"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "llamar",
            respuestaCorrecta: "llamar",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buendia",
            opciones: ["buen día", "buenas", "buenas noches", "buenas tardes"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hablaroral",
            respuestaCorrecta: "hablar oral",
          },
        ],
      },
      {
        id: 5, // SECCIÓN 5, nivel 3
        titulo: "Repaso del nivel",
        descripcion: "Practicá las 23 señas del nivel.",
        xp: 100,
        items: [
          // ── Bloque 1 (items 1-10): Tipo 2,3,2,5,3,2,5,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "hola",
            opcionesGifs: ["chau", "hola", "saludos"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bien",
            opciones: ["bueno", "mal", "bien", "malo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "por ejemplo",
            opcionesGifs: ["comunicar", "conversar", "porejemplo"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "comunicar",
            respuestaCorrecta: "comunicar",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "no",
            opciones: ["basta", "por favor", "sí", "no"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "basta",
            opcionesGifs: ["basta", "permiso", "mal"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porfavor",
            respuestaCorrecta: "por favor",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "llamar",
            respuestaCorrecta: "llamar",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buenastardes",
            opciones: ["buen día", "buenas noches", "buenas tardes", "buenas"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "gracias",
            opcionesGifs: ["denada", "gracias", "porfavor"],
            correcta: 1,
          },
          // ── Bloque 2 (items 11-20): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "perdon",
            opciones: ["de nada", "por favor", "gracias", "perdón"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "permiso",
            opcionesGifs: ["permiso", "perdon", "porfavor"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bien",
            respuestaCorrecta: "bien",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "saludos",
            opcionesGifs: ["hola", "saludos", "bienvenida"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "chau",
            opcionesGifs: ["chau", "hola", "saludos"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "comunicar",
            opciones: ["acceder", "hablar", "comunicar", "charlar"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bienvenida",
            respuestaCorrecta: "bienvenida",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sí",
            opcionesGifs: ["no", "basta", "si"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "buenastardes",
            respuestaCorrecta: "buenas tardes",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "denada",
            opciones: ["por favor", "gracias", "de nada", "permiso"],
            correcta: 2,
          },
          // ── Bloque 3 (items 21-30): Tipo 2,3,2,2,5,3,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "bienvenida",
            opcionesGifs: ["bienvenida", "saludos", "gracias"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gracias",
            opciones: ["gracias", "de nada", "hola", "chau"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mal",
            opcionesGifs: ["bien", "mal", "basta"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "por favor",
            opcionesGifs: ["gracias", "perdon", "porfavor"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "chau",
            respuestaCorrecta: "chau",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "llamar",
            opciones: ["comunicar", "hablar", "llamar", "expresar"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buenas tardes",
            opcionesGifs: ["buenastardes", "buendia", "buenasnoches"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "permiso",
            respuestaCorrecta: "permiso",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "perdon",
            respuestaCorrecta: "perdón",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "conversar",
            opciones: ["expresar", "comunicar", "hablar", "conversar"],
            correcta: 3,
          },
          // ── Motivación: van 30 ejercicios ──
          {
            tipo: "motivacion",
            variante: "check",
            titulo: "¡seguí así!",
            subtitulo: "Ya llevás 30 ejercicios de esta sección",
          },
          // ── Bloque 4 (items 31-40): Tipo 5,3,5,3,2,2,5,3,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "buenasnoches",
            respuestaCorrecta: "buenas noches",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hablaroral",
            opciones: ["hablar", "expresar", "hablar oral", "hablar señas"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "si",
            respuestaCorrecta: "sí",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "basta",
            opciones: ["frenar", "basta", "para", "espera"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hablar oral",
            opcionesGifs: ["hablaroral", "hablarsenas", "llamar"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buenas noches",
            opcionesGifs: ["buendia", "buenasnoches", "buenastardes"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "porejemplo",
            respuestaCorrecta: "por ejemplo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hablarsenas",
            opciones: ["hablar señas", "comunicar", "hablar", "charlar"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "permiso",
            opciones: ["bienvenido", "por favor", "permiso", "perdón"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mal",
            respuestaCorrecta: "mal",
          },
          // ── Motivación: van 40 ejercicios ──
          {
            tipo: "motivacion",
            variante: "estrella",
            titulo: "¡vamos por más!",
            subtitulo: "40 ejercicios completados, ya falta poco",
          },
          // ── Bloque 5 (items 41-50): Tipo 5,2,3,2,5,3,2,5,2,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "buendia",
            respuestaCorrecta: "buen día",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "llamar",
            opcionesGifs: ["conversar", "llamar", "comunicar"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mal",
            opciones: ["mal", "bien", "malo", "bueno"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "buen día",
            opcionesGifs: ["buenastardes", "buenasnoches", "buendia"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "saludos",
            respuestaCorrecta: "saludos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buenasnoches",
            opciones: ["buenas", "buenas tardes", "buenas noches", "buen día"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "no",
            opcionesGifs: ["no", "si", "basta"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "denada",
            respuestaCorrecta: "de nada",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hablar señas",
            opcionesGifs: ["comunicar", "hablaroral", "hablarsenas"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porejemplo",
            opciones: ["por ejemplo", "para", "quién", "por favor"],
            correcta: 0,
          },
          // ── Bloque 6 (items 51-69): Tipo 3,2,2,5,3,3,5,3,5,5,2,2,2,3,3,3,5,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "porfavor",
            opciones: ["gracias", "permiso", "por favor", "perdón"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "de nada",
            opcionesGifs: ["denada", "gracias", "porfavor"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bien",
            opcionesGifs: ["mal", "bien", "basta"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "basta",
            respuestaCorrecta: "basta",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buendia",
            opciones: ["buen día", "buenas", "buenas noches", "buenas tardes"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bienvenida",
            opciones: ["saludos", "bienvenida", "presentándonos", "nombre"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "no",
            respuestaCorrecta: "no",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "si",
            opciones: ["no", "sí", "basta", "comunicar"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hola",
            respuestaCorrecta: "hola",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gracias",
            respuestaCorrecta: "gracias",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "perdón",
            opcionesGifs: ["permiso", "porfavor", "perdon"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "comunicar",
            opcionesGifs: ["comunicar", "conversar", "llamar"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "conversar",
            opcionesGifs: ["comunicar", "llamar", "conversar"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "saludos",
            opciones: ["hola", "saludos", "oyente", "gracias"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hola",
            opciones: ["chau", "gracias", "hola", "saludo"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "chau",
            opciones: ["hola", "bienvenida", "chau", "bien"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "conversar",
            respuestaCorrecta: "conversar",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hablarsenas",
            respuestaCorrecta: "hablar señas",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hablaroral",
            respuestaCorrecta: "hablar oral",
          },
          // ── Motivación: fin de la sección (y del nivel) ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡felicidades!",
            subtitulo:
              "Ya podés manejar las interacciones del día a día en LSA",
            textoBoton: "¡Terminar!",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    nombre: "Sentimientos",
    descripcion: "Cómo te sentís y cómo se sienten los demás.",
    totalXP: 300,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 4
        titulo: "Primeros sentimientos",
        descripcion: "sentimientos, aburrido, alegre, amar y asustado.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "sentimientos",
            nombre: "sentimientos",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "aburrido",
            nombre: "aburrido",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "alegre", nombre: "alegre" },
          { tipo: "ensenanza_palabra", gifPalabra: "amar", nombre: "amar" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "asustado",
            nombre: "asustado",
          },
          // ── Bloque 2 (items 6-10): Tipo 2,2,3,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "amar",
            opcionesGifs: ["alegre", "amar", "asustado"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sentimientos",
            opcionesGifs: ["aburrido", "asustado", "sentimientos"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "aburrido",
            opciones: ["alegre", "aburrido", "feliz", "amar"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "asustado",
            respuestaCorrecta: "asustado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "alegre",
            opciones: ["alegre", "sentimientos", "amar", "feliz"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "aburrido",
            respuestaCorrecta: "aburrido",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "amar",
            opciones: ["frenar", "basta", "amar", "espera"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sentimientos",
            respuestaCorrecta: "sentimientos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "asustado",
            opciones: ["triste", "contento", "feliz", "asustado"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "alegre",
            opcionesGifs: ["alegre", "aburrido", "amar"],
            correcta: 0,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sentimientos",
            opciones: ["sentimientos", "alegre", "asustado", "aburrido"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "aburrido",
            opcionesGifs: ["amar", "aburrido", "alegre"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "amar",
            respuestaCorrecta: "amar",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "alegre",
            respuestaCorrecta: "alegre",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "asustado",
            opcionesGifs: ["sentimientos", "aburrido", "asustado"],
            correcta: 2,
          },
        ],
      },
      {
        id: 2, // SECCIÓN 2, nivel 4
        titulo: "Ánimo y cansancio",
        descripcion: "cansado, caprichoso, contento, culpa y deprimido.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "cansado",
            nombre: "cansado",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "caprichoso",
            nombre: "caprichoso",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "contento",
            nombre: "contento",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "culpa", nombre: "culpa" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "deprimido",
            nombre: "deprimido",
          },
          // ── Bloque 2 (items 6-10): Tipo 3,2,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cansado",
            opciones: ["caprichoso", "contento", "cansado", "preocupado"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "culpa",
            opcionesGifs: ["culpa", "caprichoso", "deprimido"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "contento",
            opcionesGifs: ["cansado", "contento", "alegre"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "caprichoso",
            respuestaCorrecta: "caprichoso",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deprimido",
            opciones: ["triste", "deprimido", "preocupado", "alegre"],
            correcta: 1,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "culpa",
            respuestaCorrecta: "culpa",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "contento",
            opciones: ["culpa", "deprimido", "feliz", "contento"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cansado",
            respuestaCorrecta: "cansado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "caprichoso",
            opciones: ["triste", "culpa", "contento", "caprichoso"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "deprimido",
            opcionesGifs: ["cansado", "deprimido", "culpa"],
            correcta: 1,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,2,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "culpa",
            opciones: ["culpa", "caprichoso", "triste", "deprimido"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "cansado",
            opcionesGifs: ["caprichoso", "deprimido", "cansado"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "contento",
            respuestaCorrecta: "contento",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "caprichoso",
            opcionesGifs: ["caprichoso", "culpa", "aburrido"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "deprimido",
            respuestaCorrecta: "deprimido",
          },
        ],
      },
      {
        id: 3, // SECCIÓN 3, nivel 4
        titulo: "Emociones fuertes",
        descripcion: "enojado, feliz, gracioso, llorar, miedoso y nervioso.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "enojado",
            nombre: "enojado",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "feliz", nombre: "feliz" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "gracioso",
            nombre: "gracioso",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "llorar", nombre: "llorar" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "miedoso",
            nombre: "miedoso",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "nervioso",
            nombre: "nervioso",
          },
          // ── Bloque 2 (items 7-13): Tipo 2,3,2,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "gracioso",
            opcionesGifs: ["gracioso", "feliz", "miedoso"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "enojado",
            opciones: ["nervioso", "enojado", "triste", "preocupado"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "miedoso",
            opcionesGifs: ["nervioso", "miedoso", "llorar"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "llorar",
            opcionesGifs: ["miedoso", "enojado", "llorar"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "nervioso",
            respuestaCorrecta: "nervioso",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "feliz",
            respuestaCorrecta: "feliz",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "nervioso",
            opciones: ["triste", "nervioso", "preocupado", "alegre"],
            correcta: 1,
          },
          // ── Bloque 3 (items 14-19): Tipo 3,2,5,2,3,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "llorar",
            opciones: ["miedoso", "deprimido", "nervioso", "llorar"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "enojado",
            opcionesGifs: ["feliz", "enojado", "gracioso"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "miedoso",
            respuestaCorrecta: "miedoso",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "nervioso",
            opcionesGifs: ["nervioso", "miedoso", "enojado"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gracioso",
            opciones: ["miedoso", "gracioso", "nervioso", "feliz"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "feliz",
            opcionesGifs: ["contento", "alegre", "feliz"],
            correcta: 2,
          },
          // ── Bloque 4 (items 20-25): Tipo 3,5,3,3,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "feliz",
            opciones: ["feliz", "gracioso", "contento", "alegre"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "enojado",
            respuestaCorrecta: "enojado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "miedoso",
            opciones: ["preocupado", "nervioso", "miedoso", "gracioso"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deprimido",
            opciones: ["deprimido", "triste", "llorar", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gracioso",
            respuestaCorrecta: "gracioso",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "llorar",
            respuestaCorrecta: "llorar",
          },
        ],
      },
      {
        id: 4, // SECCIÓN 4, nivel 4
        titulo: "Carácter y calma",
        descripcion:
          "orgulloso, preocupado, sorprendido, tímido, tranquilo y triste.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "orgulloso",
            nombre: "orgulloso",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "preocupado",
            nombre: "preocupado",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "sorprendido",
            nombre: "sorprendido",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "timido", nombre: "tímido" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "tranquilo",
            nombre: "tranquilo",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "triste", nombre: "triste" },
          // ── Bloque 2 (items 7-12): Tipo 3,2,5,2,3,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "tranquilo",
            opciones: ["relajado", "alegre", "feliz", "tranquilo"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sorprendido",
            opcionesGifs: ["sorprendido", "preocupado", "timido"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "triste",
            respuestaCorrecta: "triste",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "orgulloso",
            opcionesGifs: ["triste", "orgulloso", "tranquilo"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "preocupado",
            opciones: ["deprimido", "nervioso", "preocupado", "triste"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tímido",
            opcionesGifs: ["tranquilo", "preocupado", "timido"],
            correcta: 2,
          },
          // ── Bloque 3 (items 13-18): Tipo 2,3,5,2,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "triste",
            opcionesGifs: ["triste", "deprimido", "llorar"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "orgulloso",
            opciones: ["orgulloso", "caprichoso", "culpa", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sorprendido",
            respuestaCorrecta: "sorprendido",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "preocupado",
            opcionesGifs: ["nervioso", "preocupado", "triste"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "tranquilo",
            respuestaCorrecta: "tranquilo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "timido",
            opciones: ["tímido", "vergonzoso", "preocupado", "triste"],
            correcta: 0,
          },
          // ── Bloque 4 (items 19-24): Tipo 3,5,3,2,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sorprendido",
            opciones: ["deprimido", "tímido", "alegre", "sorprendido"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "orgulloso",
            respuestaCorrecta: "orgulloso",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "triste",
            opciones: ["triste", "deprimido", "llorar", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tranquilo",
            opcionesGifs: ["sorprendido", "tranquilo", "preocupado"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "timido",
            respuestaCorrecta: "tímido",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "preocupado",
            respuestaCorrecta: "preocupado",
          },
        ],
      },
      {
        id: 5, // SECCIÓN 5, nivel 4
        titulo: "Repaso del nivel",
        descripcion: "Todos los sentimientos del nivel, mezclados.",
        xp: 100,
        items: [
          // ── Bloque 1 (items 1-10): Tipo 2,3,2,5,3,2,5,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "gracioso",
            opcionesGifs: ["feliz", "gracioso", "contento"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "asustado",
            opciones: ["triste", "contento", "feliz", "asustado"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "caprichoso",
            opcionesGifs: ["caprichoso", "culpa", "cansado"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "amar",
            respuestaCorrecta: "amar",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "timido",
            opciones: ["tímido", "vergonzoso", "preocupado", "triste"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sentimientos",
            opcionesGifs: ["amar", "sentimientos", "asustado"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "orgulloso",
            respuestaCorrecta: "orgulloso",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "tranquilo",
            respuestaCorrecta: "tranquilo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "nervioso",
            opciones: ["triste", "nervioso", "preocupado", "alegre"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "llorar",
            opcionesGifs: ["llorar", "triste", "miedoso"],
            correcta: 0,
          },
          // ── Bloque 2 (items 11-20): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "alegre",
            opciones: ["alegre", "sentimientos", "amar", "feliz"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "enojado",
            opcionesGifs: ["nervioso", "enojado", "miedoso"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "preocupado",
            respuestaCorrecta: "preocupado",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "miedoso",
            opcionesGifs: ["miedoso", "asustado", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "amar",
            opcionesGifs: ["alegre", "contento", "amar"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cansado",
            opciones: ["caprichoso", "contento", "cansado", "preocupado"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "caprichoso",
            respuestaCorrecta: "caprichoso",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "culpa",
            opcionesGifs: ["deprimido", "culpa", "triste"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "aburrido",
            respuestaCorrecta: "aburrido",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gracioso",
            opciones: ["miedoso", "gracioso", "nervioso", "feliz"],
            correcta: 1,
          },
          // ── Bloque 3 (items 21-30): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "llorar",
            opciones: ["miedoso", "deprimido", "nervioso", "llorar"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "orgulloso",
            opcionesGifs: ["tranquilo", "orgulloso", "feliz"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sentimientos",
            respuestaCorrecta: "sentimientos",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tímido",
            opcionesGifs: ["timido", "tranquilo", "preocupado"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "contento",
            opcionesGifs: ["alegre", "feliz", "contento"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deprimido",
            opciones: ["triste", "deprimido", "preocupado", "alegre"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gracioso",
            respuestaCorrecta: "gracioso",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "nervioso",
            opcionesGifs: ["nervioso", "preocupado", "miedoso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "asustado",
            respuestaCorrecta: "asustado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sorprendido",
            opciones: ["deprimido", "tímido", "alegre", "sorprendido"],
            correcta: 3,
          },
          // ── Bloque 4 (items 31-40): Tipo 2,3,2,2,5,3,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "triste",
            opcionesGifs: ["llorar", "deprimido", "triste"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sentimientos",
            opciones: ["sentimientos", "alegre", "asustado", "aburrido"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "feliz",
            opcionesGifs: ["feliz", "contento", "gracioso"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "deprimido",
            opcionesGifs: ["cansado", "deprimido", "culpa"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "alegre",
            respuestaCorrecta: "alegre",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "tranquilo",
            opciones: ["relajado", "alegre", "feliz", "tranquilo"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "asustado",
            opcionesGifs: ["miedoso", "sorprendido", "asustado"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cansado",
            respuestaCorrecta: "cansado",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "culpa",
            respuestaCorrecta: "culpa",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "triste",
            opciones: ["triste", "deprimido", "llorar", "nervioso"],
            correcta: 0,
          },
          // ── Motivación: tras los primeros 40 ejercicios ──
          {
            tipo: "motivacion",
            variante: "check",
            titulo: "¡seguí así!",
            subtitulo: "Ya llevás 40 ejercicios de esta sección",
          },
          // ── Bloque 5 (items 41-50): Tipo 5,3,5,3,2,2,5,3,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "timido",
            respuestaCorrecta: "tímido",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "orgulloso",
            opciones: ["orgulloso", "caprichoso", "culpa", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "contento",
            respuestaCorrecta: "contento",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "miedoso",
            opciones: ["preocupado", "nervioso", "miedoso", "gracioso"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tranquilo",
            opcionesGifs: ["cansado", "tranquilo", "aburrido"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sorprendido",
            opcionesGifs: ["sorprendido", "asustado", "miedoso"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "enojado",
            respuestaCorrecta: "enojado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "feliz",
            opciones: ["feliz", "gracioso", "contento", "alegre"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "enojado",
            opciones: ["nervioso", "enojado", "triste", "preocupado"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "llorar",
            respuestaCorrecta: "llorar",
          },
          // ── Motivación: tras 50 ejercicios ──
          {
            tipo: "motivacion",
            variante: "estrella",
            titulo: "¡vamos por más!",
            subtitulo: "50 ejercicios completados, ya falta poco",
          },
          // ── Bloque 6 (items 51-60): Tipo 5,2,3,2,5,3,2,5,3,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "nervioso",
            respuestaCorrecta: "nervioso",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "cansado",
            opcionesGifs: ["aburrido", "cansado", "deprimido"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "aburrido",
            opciones: ["alegre", "aburrido", "feliz", "amar"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "aburrido",
            opcionesGifs: ["aburrido", "cansado", "tranquilo"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "deprimido",
            respuestaCorrecta: "deprimido",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "preocupado",
            opciones: ["deprimido", "nervioso", "preocupado", "triste"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "alegre",
            opcionesGifs: ["contento", "feliz", "alegre"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "feliz",
            respuestaCorrecta: "feliz",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "culpa",
            opciones: ["culpa", "caprichoso", "triste", "deprimido"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "caprichoso",
            opciones: ["triste", "culpa", "contento", "caprichoso"],
            correcta: 3,
          },
          // ── Bloque 7 (items 61-67): Tipo 3,2,5,3,3,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "contento",
            opciones: ["culpa", "deprimido", "feliz", "contento"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "preocupado",
            opcionesGifs: ["preocupado", "nervioso", "triste"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "triste",
            respuestaCorrecta: "triste",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "deprimido",
            opciones: ["deprimido", "triste", "llorar", "nervioso"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "amar",
            opciones: ["frenar", "basta", "amar", "espera"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "miedoso",
            respuestaCorrecta: "miedoso",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sorprendido",
            respuestaCorrecta: "sorprendido",
          },
          // ── Motivación: fin de la sección (y del nivel) ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡felicidades!",
            subtitulo: "Estás avanzando muchísimo",
            textoBoton: "¡Terminar!",
          },
        ],
      },
    ],
  },
  {
    id: 5,
    nombre: "Números",
    descripcion: "Del 0 al 1000, con la seña de cada número.",
    totalXP: 400,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 5
        titulo: "Del 0 al 3",
        descripcion: "números, 0, 1, 2 y 3.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "numeros",
            nombre: "números",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "n0", nombre: "0" },
          { tipo: "ensenanza_palabra", gifPalabra: "n1", nombre: "1" },
          { tipo: "ensenanza_palabra", gifPalabra: "n2", nombre: "2" },
          { tipo: "ensenanza_palabra", gifPalabra: "n3", nombre: "3" },
          // ── Bloque 2 (items 6-10): Tipo 2,2,3,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "1",
            opcionesGifs: ["n2", "n1", "n3"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "3",
            opcionesGifs: ["n3", "n0", "n2"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "numeros",
            opciones: ["números", "3", "2", "0"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n2",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "2",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n0",
            enunciado: "¿Qué número es este?",
            opciones: ["3", "0", "1", "4"],
            correcta: 1,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n1",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "1",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n3",
            enunciado: "¿Qué número es este?",
            opciones: ["3", "4", "1", "2"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "numeros",
            respuestaCorrecta: "números",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n2",
            enunciado: "¿Qué número es este?",
            opciones: ["4", "3", "2", "1"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "0",
            opcionesGifs: ["n1", "n3", "n0"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n1",
            enunciado: "¿Qué número es este?",
            opciones: ["3", "2", "1", "números"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "2",
            opcionesGifs: ["n2", "n3", "n1"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n0",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "0",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n3",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "3",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "números",
            opcionesGifs: ["n0", "numeros", "n2"],
            correcta: 1,
          },
        ],
      },
      {
        id: 2, // SECCIÓN 2, nivel 5
        titulo: "Del 4 al 8",
        descripcion: "4, 5, 6, 7 y 8.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "n4", nombre: "4" },
          { tipo: "ensenanza_palabra", gifPalabra: "n5", nombre: "5" },
          { tipo: "ensenanza_palabra", gifPalabra: "n6", nombre: "6" },
          { tipo: "ensenanza_palabra", gifPalabra: "n7", nombre: "7" },
          { tipo: "ensenanza_palabra", gifPalabra: "n8", nombre: "8" },
          // ── Bloque 2 (items 6-10): Tipo 3,2,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n5",
            enunciado: "¿Qué número es este?",
            opciones: ["4", "6", "5", "8"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "7",
            opcionesGifs: ["n6", "n7", "n8"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "4",
            opcionesGifs: ["n4", "n5", "n6"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n8",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "8",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n6",
            enunciado: "¿Qué número es este?",
            opciones: ["6", "7", "5", "8"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n7",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "7",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n4",
            enunciado: "¿Qué número es este?",
            opciones: ["6", "2", "3", "4"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n5",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "5",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n8",
            enunciado: "¿Qué número es este?",
            opciones: ["7", "8", "5", "9"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "6",
            opcionesGifs: ["n5", "n8", "n6"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n7",
            enunciado: "¿Qué número es este?",
            opciones: ["9", "5", "7", "6"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "5",
            opcionesGifs: ["n5", "n4", "n7"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n4",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "4",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n6",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "6",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "8",
            opcionesGifs: ["n7", "n4", "n8"],
            correcta: 2,
          },
        ],
      },
      {
        id: 3, // SECCIÓN 3, nivel 5
        titulo: "Del 9 al 13",
        descripcion: "9, 10, 11, 12 y 13.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "n9", nombre: "9" },
          { tipo: "ensenanza_palabra", gifPalabra: "n10", nombre: "10" },
          { tipo: "ensenanza_palabra", gifPalabra: "n11", nombre: "11" },
          { tipo: "ensenanza_palabra", gifPalabra: "n12", nombre: "12" },
          { tipo: "ensenanza_palabra", gifPalabra: "n13", nombre: "13" },
          // ── Bloque 2 (items 6-10): Tipo 2,3,2,2,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "12",
            opcionesGifs: ["n12", "n13", "n11"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n9",
            enunciado: "¿Qué número es este?",
            opciones: ["7", "8", "9", "6"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "11",
            opcionesGifs: ["n10", "n11", "n13"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "13",
            opcionesGifs: ["n11", "n12", "n13"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n10",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "10",
          },
          // ── Bloque 3 (items 11-15): Tipo 3,2,5,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n10",
            enunciado: "¿Qué número es este?",
            opciones: ["11", "6", "8", "10"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "9",
            opcionesGifs: ["n9", "n10", "n12"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n13",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "13",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n11",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "11",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n12",
            enunciado: "¿Qué número es este?",
            opciones: ["15", "13", "12", "11"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,5,3,2,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n13",
            enunciado: "¿Qué número es este?",
            opciones: ["12", "13", "10", "11"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n9",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "9",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n11",
            enunciado: "¿Qué número es este?",
            opciones: ["11", "13", "12", "10"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "10",
            opcionesGifs: ["n13", "n10", "n9"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n12",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "12",
          },
        ],
      },
      {
        id: 4, // SECCIÓN 4, nivel 5
        titulo: "Del 14 al 18",
        descripcion: "14, 15, 16, 17 y 18.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "n14", nombre: "14" },
          { tipo: "ensenanza_palabra", gifPalabra: "n15", nombre: "15" },
          { tipo: "ensenanza_palabra", gifPalabra: "n16", nombre: "16" },
          { tipo: "ensenanza_palabra", gifPalabra: "n17", nombre: "17" },
          { tipo: "ensenanza_palabra", gifPalabra: "n18", nombre: "18" },
          // ── Bloque 2 (items 6-10): Tipo 3,2,5,2,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n16",
            enunciado: "¿Qué número es este?",
            opciones: ["16", "18", "17", "14"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "18",
            opcionesGifs: ["n16", "n18", "n17"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n15",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "15",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "14",
            opcionesGifs: ["n14", "n15", "n16"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n17",
            enunciado: "¿Qué número es este?",
            opciones: ["18", "15", "17", "16"],
            correcta: 2,
          },
          // ── Bloque 3 (items 11-15): Tipo 2,3,5,2,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "16",
            opcionesGifs: ["n17", "n16", "n14"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n14",
            enunciado: "¿Qué número es este?",
            opciones: ["16", "18", "12", "14"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n18",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "18",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "17",
            opcionesGifs: ["n15", "n18", "n17"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n15",
            enunciado: "¿Qué número es este?",
            opciones: ["17", "16", "15", "18"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,5,2,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n18",
            enunciado: "¿Qué número es este?",
            opciones: ["14", "16", "18", "15"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n14",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "14",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "15",
            opcionesGifs: ["n15", "n17", "n16"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n16",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "16",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n17",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "17",
          },
        ],
      },
      {
        id: 5, // SECCIÓN 5, nivel 5
        titulo: "19, 20 y las decenas",
        descripcion: "19, 20, 30, 40 y 50.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "n19", nombre: "19" },
          { tipo: "ensenanza_palabra", gifPalabra: "n20", nombre: "20" },
          { tipo: "ensenanza_palabra", gifPalabra: "n30", nombre: "30" },
          { tipo: "ensenanza_palabra", gifPalabra: "n40", nombre: "40" },
          { tipo: "ensenanza_palabra", gifPalabra: "n50", nombre: "50" },
          // ── Bloque 2 (items 6-10): Tipo 2,2,3,5,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "40",
            opcionesGifs: ["n40", "n30", "n50"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "19",
            opcionesGifs: ["n20", "n19", "n30"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n50",
            enunciado: "¿Qué número es este?",
            opciones: ["40", "20", "30", "50"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n20",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "20",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "30",
            opcionesGifs: ["n50", "n40", "n30"],
            correcta: 2,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,2,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n19",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "19",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n40",
            enunciado: "¿Qué número es este?",
            opciones: ["20", "40", "50", "30"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "20",
            opcionesGifs: ["n20", "n19", "n50"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n30",
            enunciado: "¿Qué número es este?",
            opciones: ["50", "20", "30", "40"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n50",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "50",
          },
          // ── Bloque 4 (items 16-20): Tipo 5,2,5,3,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n30",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "30",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "50",
            opcionesGifs: ["n40", "n50", "n20"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n40",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "40",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n20",
            enunciado: "¿Qué número es este?",
            opciones: ["30", "40", "20", "50"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n19",
            enunciado: "¿Qué número es este?",
            opciones: ["19", "30", "20", "40"],
            correcta: 0,
          },
        ],
      },
      {
        id: 6, // SECCIÓN 6, nivel 5
        titulo: "De 60 a 1000",
        descripcion: "60, 70, 80, 90, 100 y 1000.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          { tipo: "ensenanza_palabra", gifPalabra: "n60", nombre: "60" },
          { tipo: "ensenanza_palabra", gifPalabra: "n70", nombre: "70" },
          { tipo: "ensenanza_palabra", gifPalabra: "n80", nombre: "80" },
          { tipo: "ensenanza_palabra", gifPalabra: "n90", nombre: "90" },
          { tipo: "ensenanza_palabra", gifPalabra: "n100", nombre: "100" },
          { tipo: "ensenanza_palabra", gifPalabra: "n1000", nombre: "1000" },
          // ── Bloque 2 (items 7-12): Tipo 2,3,2,5,3,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "100",
            opcionesGifs: ["n100", "n1000", "n90"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n60",
            enunciado: "¿Qué número es este?",
            opciones: ["80", "60", "100", "70"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "80",
            opcionesGifs: ["n70", "n80", "n90"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n70",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "70",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n1000",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "1100", "100", "10000"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n90",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "90",
          },
          // ── Bloque 3 (items 13-18): Tipo 5,3,2,3,5,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n1000",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "1000",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n70",
            enunciado: "¿Qué número es este?",
            opciones: ["100", "90", "70", "60"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "60",
            opcionesGifs: ["n60", "n80", "n70"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n80",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "100", "80", "90"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n100",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "100",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "90",
            opcionesGifs: ["n100", "n60", "n90"],
            correcta: 2,
          },
          // ── Bloque 4 (items 19-24): Tipo 5,2,3,2,5,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n60",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "60",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "1000",
            opcionesGifs: ["n1000", "n100", "n90"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n90",
            enunciado: "¿Qué número es este?",
            opciones: ["60", "1000", "100", "90"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "70",
            opcionesGifs: ["n80", "n70", "n60"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n80",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "80",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n100",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "80", "90", "100"],
            correcta: 3,
          },
        ],
      },
      {
        id: 7, // SECCIÓN 7, nivel 5
        titulo: "Repaso del nivel",
        descripcion: "Todos los números del nivel, mezclados.",
        xp: 100,
        items: [
          // ── Bloque 1 (items 1-10): Tipo 2,3,2,5,3,2,5,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "2",
            opcionesGifs: ["n2", "n1", "n3"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n16",
            enunciado: "¿Qué número es este?",
            opciones: ["16", "18", "17", "14"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "18",
            opcionesGifs: ["n16", "n18", "n17"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n7",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "7",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n14",
            enunciado: "¿Qué número es este?",
            opciones: ["16", "18", "12", "14"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "5",
            opcionesGifs: ["n5", "n4", "n6"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n0",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "0",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n17",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "17",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n12",
            enunciado: "¿Qué número es este?",
            opciones: ["15", "13", "12", "11"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "1",
            opcionesGifs: ["n3", "n1", "n0"],
            correcta: 1,
          },
          // ── Bloque 2 (items 11-20): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n9",
            enunciado: "¿Qué número es este?",
            opciones: ["7", "8", "9", "6"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "13",
            opcionesGifs: ["n13", "n12", "n11"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n6",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "6",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "80",
            opcionesGifs: ["n80", "n90", "n70"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "20",
            opcionesGifs: ["n30", "n20", "n40"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n15",
            enunciado: "¿Qué número es este?",
            opciones: ["17", "16", "15", "18"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n8",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "8",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "números",
            opcionesGifs: ["n0", "numeros", "n2"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n9",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "9",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n70",
            enunciado: "¿Qué número es este?",
            opciones: ["100", "90", "70", "60"],
            correcta: 2,
          },
          // ── Bloque 3 (items 21-30): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n1000",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "1100", "100", "10000"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "11",
            opcionesGifs: ["n11", "n10", "n12"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n4",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "4",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "60",
            opcionesGifs: ["n70", "n60", "n80"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "14",
            opcionesGifs: ["n14", "n16", "n15"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n3",
            enunciado: "¿Qué número es este?",
            opciones: ["3", "4", "1", "2"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n5",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "5",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "70",
            opcionesGifs: ["n60", "n80", "n70"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "1000",
            opcionesGifs: ["n100", "n1000", "n90"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n11",
            enunciado: "¿Qué número es este?",
            opciones: ["11", "13", "12", "10"],
            correcta: 0,
          },
          // ── Bloque 4 (items 31-40): Tipo 2,3,2,2,5,3,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "10",
            opcionesGifs: ["n10", "n11", "n13"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n4",
            enunciado: "¿Qué número es este?",
            opciones: ["6", "2", "3", "4"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "30",
            opcionesGifs: ["n40", "n30", "n50"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "16",
            opcionesGifs: ["n17", "n16", "n14"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n3",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "3",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n60",
            enunciado: "¿Qué número es este?",
            opciones: ["80", "60", "100", "70"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "7",
            opcionesGifs: ["n7", "n8", "n6"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "numeros",
            respuestaCorrecta: "números",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n2",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "2",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n30",
            enunciado: "¿Qué número es este?",
            opciones: ["50", "20", "30", "40"],
            correcta: 2,
          },
          // ── Motivación: tras los primeros 40 ejercicios ──
          {
            tipo: "motivacion",
            variante: "check",
            titulo: "¡seguí así!",
            subtitulo: "Ya llevás 40 ejercicios de esta sección",
          },
          // ── Bloque 5 (items 41-50): Tipo 5,3,5,3,2,2,5,3,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n10",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "10",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n19",
            enunciado: "¿Qué número es este?",
            opciones: ["19", "30", "20", "40"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n16",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "16",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n90",
            enunciado: "¿Qué número es este?",
            opciones: ["60", "1000", "100", "90"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "12",
            opcionesGifs: ["n12", "n13", "n11"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "15",
            opcionesGifs: ["n15", "n17", "n16"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n1",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "1",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n18",
            enunciado: "¿Qué número es este?",
            opciones: ["14", "16", "18", "15"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n80",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "100", "80", "90"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n11",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "11",
          },
          // ── Motivación: tras 50 ejercicios ──
          {
            tipo: "motivacion",
            variante: "estrella",
            titulo: "¡vamos por más!",
            subtitulo: "50 ejercicios completados, ya falta poco",
          },
          // ── Bloque 6 (items 51-60): Tipo 5,2,3,2,5,3,2,5,3,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n13",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "13",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "100",
            opcionesGifs: ["n100", "n1000", "n90"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n5",
            enunciado: "¿Qué número es este?",
            opciones: ["4", "6", "5", "8"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "0",
            opcionesGifs: ["n1", "n3", "n0"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n12",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "12",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n50",
            enunciado: "¿Qué número es este?",
            opciones: ["40", "20", "30", "50"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "40",
            opcionesGifs: ["n40", "n30", "n50"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n18",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "18",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n40",
            enunciado: "¿Qué número es este?",
            opciones: ["20", "40", "50", "30"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n100",
            enunciado: "¿Qué número es este?",
            opciones: ["1000", "80", "90", "100"],
            correcta: 3,
          },
          // ── Bloque 7 (items 61-70): Tipo 3,2,5,3,3,5,5,2,3,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n2",
            enunciado: "¿Qué número es este?",
            opciones: ["4", "3", "2", "1"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "3",
            opcionesGifs: ["n3", "n0", "n2"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n15",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "15",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n20",
            enunciado: "¿Qué número es este?",
            opciones: ["30", "40", "20", "50"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n17",
            enunciado: "¿Qué número es este?",
            opciones: ["18", "15", "17", "16"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n1000",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "1000",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n100",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "100",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "4",
            opcionesGifs: ["n4", "n5", "n6"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n0",
            enunciado: "¿Qué número es este?",
            opciones: ["3", "0", "1", "4"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n20",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "20",
          },
          // ── Bloque 8 (items 71-80): Tipo 5,2,3,2,5,3,2,5,5,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "n40",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "40",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "90",
            opcionesGifs: ["n100", "n60", "n90"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n8",
            enunciado: "¿Qué número es este?",
            opciones: ["7", "8", "5", "9"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "9",
            opcionesGifs: ["n9", "n10", "n12"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n14",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "14",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n13",
            enunciado: "¿Qué número es este?",
            opciones: ["12", "13", "10", "11"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "19",
            opcionesGifs: ["n20", "n19", "n30"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n30",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "30",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n19",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "19",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "6",
            opcionesGifs: ["n5", "n8", "n6"],
            correcta: 2,
          },
          // ── Bloque 9 (items 81-90): Tipo 2,3,5,2,5,5,3,2,5,5 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "8",
            opcionesGifs: ["n7", "n4", "n8"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "numeros",
            opciones: ["números", "3", "2", "0"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n60",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "60",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "17",
            opcionesGifs: ["n15", "n18", "n17"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n90",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "90",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n70",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "70",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "n10",
            enunciado: "¿Qué número es este?",
            opciones: ["11", "6", "8", "10"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "50",
            opcionesGifs: ["n40", "n50", "n20"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n80",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "80",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "n50",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "50",
          },
          // ── Motivación: fin de la sección (y del nivel) ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡felicidades!",
            subtitulo: "Estás avanzando muchísimo",
            textoBoton: "¡Terminar!",
          },
        ],
      },
    ],
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

const contarCompletadasValidas = (ids, lecciones) => {
  const validIds = new Set(lecciones.map((l) => l.id));
  return [...new Set(ids)].filter((id) => validIds.has(id)).length;
};

const getNivelEstado = (nivel, leccionesCompletadas) => {
  const totalLecciones = nivel.lecciones.length;
  if (totalLecciones === 0) return "bloqueado";

  const completadas = contarCompletadasValidas(
    leccionesCompletadas[nivel.id] || [],
    nivel.lecciones,
  );

  if (nivel.id === 1) {
    return completadas >= totalLecciones ? "completado" : "actual";
  }
  const nivelAnterior = NIVELES.find((n) => n.id === nivel.id - 1);
  const completadasAnterior = contarCompletadasValidas(
    leccionesCompletadas[nivelAnterior.id] || [],
    nivelAnterior.lecciones,
  );
  if (completadasAnterior < nivelAnterior.lecciones.length) return "bloqueado";
  return completadas >= totalLecciones ? "completado" : "actual";
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

// ══════════════════════════════════════════════════════════════════════
//  NUEVOS TIPOS DE EJERCICIO (items)
// ══════════════════════════════════════════════════════════════════════

const EjercicioHeader = ({ idx, total, vidasGlobales, onSalir }) => (
  <View style={styles.ejercicioHeader}>
    <TouchableOpacity onPress={onSalir} style={styles.cerrarBtn}>
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
    </View>
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
);

const ItemEnsenanza = ({
  item,
  idx,
  total,
  vidasGlobales,
  onContinuar,
  onSalir,
}) => (
  <View style={styles.ejercicioContainer}>
    <EjercicioHeader
      idx={idx}
      total={total}
      vidasGlobales={vidasGlobales}
      onSalir={onSalir}
    />
    <ScrollView contentContainerStyle={styles.ejercicioContent}>
      <View style={styles.itemCard}>
        <Text style={styles.itemCardLetraGrande}>{item.letra}</Text>
        <Text style={styles.itemCardTitulo}>Letra {item.letra}</Text>
        <Text style={styles.itemCardSub}>Mirá bien la seña</Text>
      </View>
      <View style={styles.gifGrandeWrap}>
        <Image
          source={GIFS[item.letra]}
          style={styles.gifGrande}
          contentFit="contain"
        />
      </View>
    </ScrollView>
    <View style={styles.ejercicioBtnWrap}>
      <TouchableOpacity style={styles.btnPrincipal} onPress={onContinuar}>
        <Text style={styles.btnPrincipalTxt}>Continuar →</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ItemElegirSena = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const [seleccionado, setSelec] = useState(null);
  const [confirmado, setConf] = useState(false);
  const esCorrecta = seleccionado === item.correcta;

  const confirmar = () => {
    if (seleccionado === null) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (!esCorrecta) {
      setSelec(null);
      setConf(false);
    } else onCorrecto();
  };

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        <View style={styles.itemCard}>
          <Text style={styles.itemCardLetraGrande}>{item.letra}</Text>
          <Text style={styles.itemCardTitulo}>Letra {item.letra}</Text>
          <Text style={styles.itemCardSub}>Elegí la seña correcta</Text>
        </View>
        <View style={styles.gifOpcionesWrap}>
          {item.opcionesLetras.map((letra, i) => {
            let borderColor = "#E0E0E0";
            let bgColor = "#F5F6FA";
            if (confirmado) {
              if (i === item.correcta) {
                borderColor = "#2E7D32";
                bgColor = "#C8F5D3";
              } else if (i === seleccionado) {
                borderColor = "#C62828";
                bgColor = "#FFCDD2";
              }
            } else if (seleccionado === i) {
              borderColor = "#3D4FBB";
              bgColor = "#EEF1FB";
            }
            return (
              <View
                key={i}
                style={{
                  elevation: confirmado ? 0 : 3,
                  borderRadius: 16,
                  marginBottom: 4,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.gifOpcionBtn,
                    { borderColor, backgroundColor: bgColor },
                  ]}
                  onPress={() => !confirmado && setSelec(i)}
                  activeOpacity={confirmado ? 1 : 0.75}
                >
                  <View style={styles.gifOpcionImgWrap}>
                    <Image
                      source={GIFS[letra]}
                      style={styles.gifOpcion}
                      contentFit="contain"
                    />
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      seleccionado === i &&
                        !confirmado &&
                        styles.radioCircleSelec,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {confirmado && (
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
            {esCorrecta ? "¡Correcto! 🎉" : "Incorrecto ❌ — Intentá de nuevo"}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { opacity: seleccionado === null ? 0.45 : 1 },
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ItemQueLEtra = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const [seleccionado, setSelec] = useState(null);
  const [confirmado, setConf] = useState(false);
  const esCorrecta = seleccionado === item.correcta;

  const confirmar = () => {
    if (seleccionado === null) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (!esCorrecta) {
      setSelec(null);
      setConf(false);
    } else onCorrecto();
  };

  const bgOp = (i) => {
    if (!confirmado) return seleccionado === i ? "#C8D3F5" : "#F5F6FA";
    if (i === item.correcta) return "#C8F5D3";
    if (i === seleccionado) return "#FFCDD2";
    return "#F5F6FA";
  };
  const bdOp = (i) => {
    if (!confirmado) return seleccionado === i ? "#3D4FBB" : "#E0E0E0";
    if (i === item.correcta) return "#2E7D32";
    if (i === seleccionado) return "#C62828";
    return "#E0E0E0";
  };

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        <View style={styles.itemCard}>
          <Text style={styles.itemCardTitulo}>Mirá bien la seña</Text>
          <Text style={styles.itemCardSub}>¿Qué letra es esta?</Text>
        </View>
        <View style={styles.gifGrandeWrap}>
          <Image
            source={GIFS[item.gifLetra]}
            style={styles.gifGrande}
            contentFit="contain"
          />
        </View>
        <View style={styles.opcionesWrap}>
          {item.opciones.map((op, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.opcion,
                { backgroundColor: bgOp(i), borderColor: bdOp(i) },
              ]}
              onPress={() => !confirmado && setSelec(i)}
              activeOpacity={confirmado ? 1 : 0.75}
            >
              <Text style={styles.opcionLetra}>{["A", "B", "C", "D"][i]}</Text>
              <Text style={styles.opcionTxt}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {confirmado && (
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
              : `Incorrecto ❌ — La respuesta es ${item.opciones[item.correcta]}`}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { opacity: seleccionado === null ? 0.45 : 1 },
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ItemQuePalabra = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const n = item.secuencia.length;
  const [slots, setSlots] = useState(() => Array(n).fill(null));
  const [confirmado, setConf] = useState(false);

  const letrasUsadas = new Set(slots.filter((s) => s !== null));
  const palabraIngresada = slots
    .map((s) => (s !== null ? item.letrasDisponibles[s] : ""))
    .join("");
  const esCorrecta = palabraIngresada === item.palabraCorrecta;
  const completo = slots.every((s) => s !== null);

  const tapLetra = (letraIdx) => {
    if (confirmado || letrasUsadas.has(letraIdx)) return;
    const primerVacio = slots.findIndex((s) => s === null);
    if (primerVacio === -1) return;
    const nuevo = [...slots];
    nuevo[primerVacio] = letraIdx;
    setSlots(nuevo);
  };

  const tapSlot = (slotIdx) => {
    if (confirmado || slots[slotIdx] === null) return;
    const nuevo = [...slots];
    nuevo[slotIdx] = null;
    setSlots(nuevo);
  };

  const confirmar = () => {
    if (!completo) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };

  const siguiente = () => {
    if (!esCorrecta) {
      setSlots(Array(n).fill(null));
      setConf(false);
    } else onCorrecto();
  };

  const gifW = n <= 4 ? Math.floor((SCREEN_WIDTH - 56) / 4) : 72;

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        <View style={styles.itemCard}>
          <Text style={styles.itemCardTitulo}>Formá la palabra</Text>
          <Text style={styles.itemCardSub}>
            Mirá los GIFs y seleccioná las letras
          </Text>
        </View>

        {/* GIFs + slots */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.palabraGifsRow,
            { paddingHorizontal: 4 },
          ]}
          style={{ marginBottom: 16 }}
        >
          {item.secuencia.map((letra, i) => (
            <View key={i} style={styles.palabraGifCol}>
              <View
                style={[
                  styles.palabraGifWrap,
                  { width: gifW, height: gifW * 1.3 },
                ]}
              >
                <Image
                  source={GIFS[letra]}
                  style={{ width: gifW, height: gifW * 1.3 }}
                  contentFit="cover"
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.palabraSlot,
                  { width: gifW },
                  slots[i] !== null && styles.palabraSlotLleno,
                  confirmado && esCorrecta && styles.palabraSlotCorrecto,
                  confirmado && !esCorrecta && styles.palabraSlotError,
                ]}
                onPress={() => tapSlot(i)}
              >
                <Text style={styles.palabraSlotLetra}>
                  {slots[i] !== null ? item.letrasDisponibles[slots[i]] : ""}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.letrasDisponiblesLabel}>Letras disponibles</Text>
        <View style={styles.letrasDisponiblesGrid}>
          {item.letrasDisponibles.map((letra, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.letraBtn,
                letrasUsadas.has(i) && styles.letraBtnUsada,
              ]}
              onPress={() => tapLetra(i)}
              activeOpacity={letrasUsadas.has(i) ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.letraBtnTxt,
                  letrasUsadas.has(i) && styles.letraBtnTxtUsada,
                ]}
              >
                {letra}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {confirmado && (
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
              : `Incorrecto ❌ — La palabra era ${item.palabraCorrecta}`}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[styles.btnPrincipal, { opacity: completo ? 1 : 0.45 }]}
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// GIF de una seña de vocabulario. Si el archivo todavía no está en assets
// avisa en pantalla en vez de mostrar un recuadro vacío.
const SenaGif = ({ clave, style }) => {
  const source = GIFS_PALABRAS[clave];
  if (!source)
    return (
      <View style={[style, styles.gifFaltante]}>
        <Text style={styles.gifFaltanteTxt}>GIF pendiente</Text>
        <Text style={styles.gifFaltanteSub}>{clave}</Text>
      </View>
    );
  return <Image source={source} style={style} contentFit="contain" />;
};

// ── Tipo 1 (palabras): enseñanza de vocabulario ───────────────────────
const ItemEnsenanzaPalabra = ({
  item,
  idx,
  total,
  vidasGlobales,
  onContinuar,
  onSalir,
}) => (
  <View style={styles.ejercicioContainer}>
    <EjercicioHeader
      idx={idx}
      total={total}
      vidasGlobales={vidasGlobales}
      onSalir={onSalir}
    />
    <ScrollView contentContainerStyle={styles.ejercicioContent}>
      <View style={styles.itemCard}>
        <Text style={styles.itemCardPalabraGrande}>{item.nombre}</Text>
        <Text style={styles.itemCardSub}>Mirá bien la seña</Text>
      </View>
      <View style={styles.gifGrandeWrap}>
        <SenaGif clave={item.gifPalabra} style={styles.gifGrande} />
      </View>
    </ScrollView>
    <View style={styles.ejercicioBtnWrap}>
      <TouchableOpacity style={styles.btnPrincipal} onPress={onContinuar}>
        <Text style={styles.btnPrincipalTxt}>Continuar →</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Tipo 6: "Elegí la seña correcta" para una palabra (3 GIFs) ─────────
const ItemElegirSenaPalabra = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const [seleccionado, setSelec] = useState(null);
  const [confirmado, setConf] = useState(false);
  const esCorrecta = seleccionado === item.correcta;

  const confirmar = () => {
    if (seleccionado === null) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (!esCorrecta) {
      setSelec(null);
      setConf(false);
    } else onCorrecto();
  };

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        <View style={styles.itemCard}>
          <Text style={styles.itemCardPalabraGrande}>{item.palabra}</Text>
          <Text style={styles.itemCardSub}>Elegí la seña correcta</Text>
        </View>
        <View style={styles.gifOpcionesWrap}>
          {item.opcionesGifs.map((clave, i) => {
            let borderColor = "#E0E0E0";
            let bgColor = "#F5F6FA";
            if (confirmado) {
              if (i === item.correcta) {
                borderColor = "#2E7D32";
                bgColor = "#C8F5D3";
              } else if (i === seleccionado) {
                borderColor = "#C62828";
                bgColor = "#FFCDD2";
              }
            } else if (seleccionado === i) {
              borderColor = "#3D4FBB";
              bgColor = "#EEF1FB";
            }
            return (
              <View
                key={i}
                style={{
                  elevation: confirmado ? 0 : 3,
                  borderRadius: 16,
                  marginBottom: 4,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.gifOpcionBtn,
                    { borderColor, backgroundColor: bgColor },
                  ]}
                  onPress={() => !confirmado && setSelec(i)}
                  activeOpacity={confirmado ? 1 : 0.75}
                >
                  <View style={styles.gifOpcionImgWrap}>
                    <SenaGif clave={clave} style={styles.gifOpcion} />
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      seleccionado === i &&
                        !confirmado &&
                        styles.radioCircleSelec,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {confirmado && (
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
            {esCorrecta ? "¡Correcto! 🎉" : "Incorrecto ❌ — Intentá de nuevo"}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { opacity: seleccionado === null ? 0.45 : 1 },
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Tipo 3 (palabras): "¿Qué palabra es esta?" (GIF -> 4 opciones texto) ─
const ItemQuePalabraOpciones = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const [seleccionado, setSelec] = useState(null);
  const [confirmado, setConf] = useState(false);
  const esCorrecta = seleccionado === item.correcta;

  const confirmar = () => {
    if (seleccionado === null) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (!esCorrecta) {
      setSelec(null);
      setConf(false);
    } else onCorrecto();
  };

  const bgOp = (i) => {
    if (!confirmado) return seleccionado === i ? "#C8D3F5" : "#F5F6FA";
    if (i === item.correcta) return "#C8F5D3";
    if (i === seleccionado) return "#FFCDD2";
    return "#F5F6FA";
  };
  const bdOp = (i) => {
    if (!confirmado) return seleccionado === i ? "#3D4FBB" : "#E0E0E0";
    if (i === item.correcta) return "#2E7D32";
    if (i === seleccionado) return "#C62828";
    return "#E0E0E0";
  };

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView contentContainerStyle={styles.ejercicioContent}>
        <View style={styles.itemCard}>
          <Text style={styles.itemCardTitulo}>Mirá bien la seña</Text>
          <Text style={styles.itemCardSub}>
            {item.enunciado || "¿Qué palabra es esta?"}
          </Text>
        </View>
        <View style={styles.gifGrandeWrap}>
          <SenaGif clave={item.gifPalabra} style={styles.gifGrande} />
        </View>
        <View style={styles.opcionesWrap}>
          {item.opciones.map((op, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.opcion,
                { backgroundColor: bgOp(i), borderColor: bdOp(i) },
              ]}
              onPress={() => !confirmado && setSelec(i)}
              activeOpacity={confirmado ? 1 : 0.75}
            >
              <Text style={styles.opcionLetra}>{["A", "B", "C", "D"][i]}</Text>
              <Text style={styles.opcionTxt}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {confirmado && (
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
              : `Incorrecto ❌ — La respuesta es ${item.opciones[item.correcta]}`}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              { opacity: seleccionado === null ? 0.45 : 1 },
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Tipo 5: "¿Cuál es esta palabra?" (escritura libre) ────────────────
const ItemEscrituraLibre = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const [texto, setTexto] = useState("");
  const [confirmado, setConf] = useState(false);
  // Un número vale escrito con dígitos o con letras: "7" y "siete" son correctas.
  const enLetras = NUMEROS_EN_LETRAS[item.respuestaCorrecta];
  const esCorrecta =
    normalizarTexto(texto) === normalizarTexto(item.respuestaCorrecta) ||
    (!!enLetras && normalizarTexto(texto) === normalizarTexto(enLetras));

  const confirmar = () => {
    if (!texto.trim()) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (!esCorrecta) {
      setTexto("");
      setConf(false);
    } else onCorrecto();
  };

  return (
    <KeyboardAvoidingView
      style={styles.ejercicioContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <ScrollView
        contentContainerStyle={styles.ejercicioContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.itemCard}>
          <Text style={styles.itemCardTitulo}>Mirá bien la seña</Text>
          <Text style={styles.itemCardSub}>
            {item.enunciado || "¿Cuál es esta palabra?"}
          </Text>
        </View>
        <View style={styles.gifGrandeWrap}>
          <SenaGif clave={item.gifPalabra} style={styles.gifGrande} />
        </View>
        <Text style={styles.escrituraLabel}>
          {item.etiqueta || "Escribí la palabra aquí"}
        </Text>
        <TextInput
          style={[
            styles.escrituraInput,
            confirmado &&
              (esCorrecta ? styles.escrituraInputOk : styles.escrituraInputErr),
          ]}
          value={texto}
          onChangeText={(t) => !confirmado && setTexto(t)}
          editable={!confirmado}
          placeholder="Escribí tu respuesta..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={confirmar}
          returnKeyType="done"
        />
      </ScrollView>
      {confirmado && (
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
              : `Incorrecto ❌ — La respuesta es ${item.respuestaCorrecta}`}
          </Text>
        </View>
      )}
      <View style={styles.ejercicioBtnWrap}>
        {!confirmado ? (
          <TouchableOpacity
            style={[styles.btnPrincipal, { opacity: texto.trim() ? 1 : 0.45 }]}
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
              {esCorrecta ? "Siguiente →" : "Reintentar 🔄"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Motivación: checkpoint entre ejercicios (sin pregunta) ────────────
const MOTIVACION_ICONO = {
  check: "checkmark",
  estrella: "star",
  corazon: "heart",
};

// Rayitas alrededor del círculo (3 por lado), posicionadas dentro del wrap
const MOTIVACION_RAYOS = [
  { top: 26, left: 20, rotate: "-45deg" },
  { top: 62, left: 10, rotate: "0deg" },
  { top: 98, left: 20, rotate: "45deg" },
  { top: 26, right: 20, rotate: "45deg" },
  { top: 62, right: 10, rotate: "0deg" },
  { top: 98, right: 20, rotate: "-45deg" },
];

// Chispita decorativa: dos barras redondeadas cruzadas + titileo en loop
const ChispaMotivacion = ({ color, size, delay = 0 }) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [delay, v]);

  const grosor = Math.max(3, Math.round(size * 0.28));
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        transform: [
          {
            scale: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.15],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          position: "absolute",
          left: (size - grosor) / 2,
          top: 0,
          width: grosor,
          height: size,
          borderRadius: grosor / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: (size - grosor) / 2,
          left: 0,
          width: size,
          height: grosor,
          borderRadius: grosor / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
};

const ItemMotivacion = ({
  item,
  idx,
  total,
  vidasGlobales,
  onContinuar,
  onSalir,
}) => {
  const pop = useRef(new Animated.Value(0)).current; // círculo con el ícono
  const rayos = useRef(new Animated.Value(0)).current; // rayitas
  const texto = useRef(new Animated.Value(0)).current; // título + subtítulo
  const boton = useRef(new Animated.Value(0)).current; // botón continuar

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(rayos, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(texto, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(boton, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [pop, rayos, texto, boton]);

  const icono = MOTIVACION_ICONO[item.variante] || "checkmark";
  const tituloLargo = (item.titulo || "").length > 16;

  return (
    <View style={styles.ejercicioContainer}>
      <EjercicioHeader
        idx={idx}
        total={total}
        vidasGlobales={vidasGlobales}
        onSalir={onSalir}
      />
      <View style={styles.motivacionBody}>
        <View style={styles.motivacionCard}>
          <View style={styles.motivacionIconoWrap}>
            {MOTIVACION_RAYOS.map((r, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.motivacionRayo,
                  { top: r.top, left: r.left, right: r.right },
                  {
                    opacity: rayos,
                    transform: [{ rotate: r.rotate }, { scale: rayos }],
                  },
                ]}
              />
            ))}
            <Animated.View
              style={[
                styles.motivacionCirculo,
                { transform: [{ scale: pop }] },
              ]}
            >
              <Ionicons name={icono} size={54} color="#fff" />
            </Animated.View>
          </View>

          <Animated.View
            style={{
              opacity: texto,
              transform: [
                {
                  translateY: texto.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            }}
          >
            <Text
              style={[
                styles.motivacionTitulo,
                tituloLargo && styles.motivacionTituloChico,
              ]}
            >
              {item.titulo}
            </Text>
            {!!item.subtitulo && (
              <Text style={styles.motivacionSub}>{item.subtitulo}</Text>
            )}
          </Animated.View>

          <View style={styles.motivacionDeco}>
            <ChispaMotivacion color="#7FD1B9" size={20} delay={0} />
            <View style={styles.motivacionPunto} />
            <View style={styles.motivacionAnillo} />
            <ChispaMotivacion color="#A99BF7" size={14} delay={450} />
          </View>
        </View>
      </View>
      <View style={styles.ejercicioBtnWrap}>
        <Animated.View
          style={{
            opacity: boton,
            transform: [
              {
                translateY: boton.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity style={styles.btnPrincipal} onPress={onContinuar}>
            <Text style={styles.btnPrincipalTxt}>
              {item.textoBoton || "Continuar"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const PantallaEjercicioNueva = ({
  leccion,
  vidasGlobales,
  onTerminar,
  onPerderVida,
}) => {
  const [idx, setIdx] = useState(0);
  const items = leccion.items;
  const total = items.length;
  const item = items[idx];

  const avanzar = () => {
    if (idx + 1 >= total) onTerminar({ completada: true, xp: leccion.xp });
    else setIdx((i) => i + 1);
  };
  const salir = () => onTerminar({ completada: false });

  const common = {
    idx,
    total,
    vidasGlobales,
    onCorrecto: avanzar,
    onPerderVida,
    onSalir: salir,
  };

  if (item.tipo === "ensenanza")
    return (
      <ItemEnsenanza key={idx} item={item} {...common} onContinuar={avanzar} />
    );
  if (item.tipo === "ensenanza_palabra")
    return (
      <ItemEnsenanzaPalabra
        key={idx}
        item={item}
        {...common}
        onContinuar={avanzar}
      />
    );
  if (item.tipo === "elegir_sena")
    return <ItemElegirSena key={idx} item={item} {...common} />;
  if (item.tipo === "elegir_sena_palabra")
    return <ItemElegirSenaPalabra key={idx} item={item} {...common} />;
  if (item.tipo === "que_letra")
    return <ItemQueLEtra key={idx} item={item} {...common} />;
  if (item.tipo === "que_palabra_opciones")
    return <ItemQuePalabraOpciones key={idx} item={item} {...common} />;
  if (item.tipo === "que_palabra")
    return <ItemQuePalabra key={idx} item={item} {...common} />;
  if (item.tipo === "escritura_libre")
    return <ItemEscrituraLibre key={idx} item={item} {...common} />;
  if (item.tipo === "motivacion")
    return (
      <ItemMotivacion key={idx} item={item} {...common} onContinuar={avanzar} />
    );
  return null;
};

// ── Ejercicio (texto — lecciones antiguas) ─────────────────────────────────────────────────────────
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
    ? (() => {
        const validIds = new Set(nivelAbierto.lecciones.map((l) => l.id));
        return [...new Set(leccionesComp[nivelAbierto.id] || [])].filter((id) =>
          validIds.has(id),
        );
      })()
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
            {leccionActiva.items ? (
              <PantallaEjercicioNueva
                leccion={leccionActiva}
                vidasGlobales={vidasData.vidas}
                onTerminar={handleTerminarEjercicio}
                onPerderVida={handlePerderVida}
              />
            ) : (
              <PantallaEjercicio
                leccion={leccionActiva}
                vidasGlobales={vidasData.vidas}
                onTerminar={handleTerminarEjercicio}
                onPerderVida={handlePerderVida}
              />
            )}
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
            {completadas >= total
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
          {completadas >= total && (
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

  // ── Nuevos tipos de ejercicio ──────────────────────────────────────
  itemCard: {
    backgroundColor: "#EEF1FB",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
  },
  itemCardLetraGrande: {
    fontSize: 56,
    fontWeight: "900",
    color: "#3D4FBB",
    marginBottom: 4,
  },
  itemCardTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D4FBB",
    marginBottom: 4,
  },
  itemCardSub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  gifGrandeWrap: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  gifGrande: {
    width: SCREEN_WIDTH - 40,
    height: 240,
  },
  // elegir_sena
  gifOpcionesWrap: {
    gap: 10,
  },
  gifOpcionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2.5,
    padding: 8,
    gap: 10,
    overflow: "hidden",
  },
  gifOpcionImgWrap: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  gifOpcion: {
    width: "100%",
    height: 140,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  radioCircleSelec: {
    borderColor: "#3D4FBB",
    backgroundColor: "#3D4FBB",
  },
  // que_palabra
  palabraGifsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  palabraGifCol: {
    alignItems: "center",
    gap: 8,
  },
  palabraGifWrap: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  palabraSlot: {
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF1FB",
  },
  palabraSlotLleno: {
    borderColor: "#3D4FBB",
    backgroundColor: "#C8D3F5",
  },
  palabraSlotCorrecto: {
    borderColor: "#2E7D32",
    backgroundColor: "#C8F5D3",
  },
  palabraSlotError: {
    borderColor: "#C62828",
    backgroundColor: "#FFCDD2",
  },
  palabraSlotLetra: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  letrasDisponiblesLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3D4FBB",
    marginBottom: 12,
    textAlign: "center",
  },
  letrasDisponiblesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  letraBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  letraBtnUsada: {
    backgroundColor: "#F0F0F0",
    borderColor: "#E0E0E0",
    elevation: 0,
    shadowOpacity: 0,
  },
  letraBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  letraBtnTxtUsada: {
    color: "#BDBDBD",
  },

  // ── Vocabulario (Nivel 2+): título de palabra y escritura libre ──
  itemCardPalabraGrande: {
    fontSize: 30,
    fontWeight: "900",
    color: "#3D4FBB",
    marginBottom: 6,
    textAlign: "center",
  },
  escrituraLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  escrituraInput: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A2E",
    backgroundColor: "#F5F6FA",
    minHeight: 54,
  },
  escrituraInputOk: {
    borderColor: "#2E7D32",
    backgroundColor: "#C8F5D3",
  },
  escrituraInputErr: {
    borderColor: "#C62828",
    backgroundColor: "#FFCDD2",
  },

  gifFaltante: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF1FB",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    borderStyle: "dashed",
    borderRadius: 16,
  },
  gifFaltanteTxt: { fontSize: 15, fontWeight: "700", color: "#3D4FBB" },
  gifFaltanteSub: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },

  // ── Motivación (checkpoints) ───────────────────────────────────────
  motivacionBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  motivacionCard: {
    backgroundColor: "#F4F2FD",
    borderRadius: 28,
    paddingVertical: 34,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  motivacionIconoWrap: {
    width: 220,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  motivacionCirculo: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#8C7CF0",
    alignItems: "center",
    justifyContent: "center",
  },
  motivacionRayo: {
    position: "absolute",
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A99BF7",
  },
  motivacionTitulo: {
    fontSize: 40,
    fontWeight: "900",
    color: "#3D4FBB",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  motivacionTituloChico: { fontSize: 30 },
  motivacionSub: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 21,
  },
  motivacionDeco: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 22,
  },
  motivacionPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A99BF7",
  },
  motivacionAnillo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 4,
    borderColor: "#7FD1B9",
  },

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
