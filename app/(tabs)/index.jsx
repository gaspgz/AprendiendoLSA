import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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
        ],
      },
    ],
  },
  {
    id: 3,
    nombre: "Interacciones cotidianas",
    descripcion: "Aprendé las interacciones cotidianas.",
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
        <Image
          source={GIFS_PALABRAS[item.gifPalabra]}
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
                    <Image
                      source={GIFS_PALABRAS[clave]}
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
          <Text style={styles.itemCardSub}>¿Qué palabra es esta?</Text>
        </View>
        <View style={styles.gifGrandeWrap}>
          <Image
            source={GIFS_PALABRAS[item.gifPalabra]}
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
  const esCorrecta =
    normalizarTexto(texto) === normalizarTexto(item.respuestaCorrecta);

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
          <Text style={styles.itemCardSub}>¿Cuál es esta palabra?</Text>
        </View>
        <View style={styles.gifGrandeWrap}>
          <Image
            source={GIFS_PALABRAS[item.gifPalabra]}
            style={styles.gifGrande}
            contentFit="contain"
          />
        </View>
        <Text style={styles.escrituraLabel}>Escribí la palabra aquí</Text>
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
