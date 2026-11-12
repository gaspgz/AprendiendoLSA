import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

import AvatarUsuario from "../../components/AvatarUsuario";
import SenaGif, { linkDeSena } from "../../components/SenaGif";
import Tutorial from "../../components/Tutorial";
import {
  cerrarSesionRemota,
  completarLeccion,
  guardarProgreso as guardarProgresoAPI,
  guardarVidas as guardarVidasAPI,
  obtenerProgreso,
  obtenerVidas,
} from "../../services/api";
import { versionFotoPerfil } from "../../services/fotoPerfil";
import {
  borrarLeccionEnCurso,
  claveLeccionEnCurso,
  guardarLeccionEnCurso,
  obtenerTodasEnCurso,
} from "../../services/leccionEnCurso";
import { guardarLogro } from "../../services/logros";
import { crearPrecarga } from "../../services/precargaSenas";
import {
  cerrarSesion,
  obtenerSesion,
  obtenerSesionId,
} from "../../services/sesion";
import {
  marcarTutorialVisto,
  tutorialPendiente,
} from "../../services/tutorial";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Los GIFs de las señas están en la nube: SenaGif (components/SenaGif.jsx)
// muestra cada uno desde su clave. Los links están en constants/gifsNube.js,
// que se genera desde docs/gifs_nube.json con scripts/generarGifs.js.

// Señas que en la app se ven iguales: cuentan como UNA sola seña, igual que
// "él" y "ella" (las dos son el_ella). En los ejercicios, dos señas de un
// mismo grupo nunca van juntas en las opciones ni en un banco, y la escritura
// libre las acepta todas (respuestasAlternativas). Para otro par, sumalo acá.
export const SENAS_EQUIVALENTES = [["hola", "chau"]];

// Un número se puede escribir con dígitos o con letras: las dos valen.
const NUMEROS_EN_LETRAS = {
  0: "cero",
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciséis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve",
  20: "veinte",
  30: "treinta",
  40: "cuarenta",
  50: "cincuenta",
  60: "sesenta",
  70: "setenta",
  80: "ochenta",
  90: "noventa",
  100: "cien",
  1000: "mil",
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
//  CONFIG
// ══════════════════════════════════════════════════════════════════════
const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

// ══════════════════════════════════════════════════════════════════════
//  DATOS
// ══════════════════════════════════════════════════════════════════════
export const NIVELES = [
  {
    id: 1, // NIVEL 1 en el mapa (id 1)
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
    id: 7, // NIVEL 2 en el mapa (id 7)
    nombre: "Pronombres",
    descripcion: "Pronombres personales y posesivos.",
    totalXP: 50,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 7 (única)
        titulo: "Pronombres",
        descripcion: "él/ella, ellos/ellas, mío, nosotros, tuyo, vos y yo.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-7) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "el_ella",
            nombre: "él/ella",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "ellos_ellas",
            nombre: "ellos/ellas",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "mio", nombre: "mío" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "nosotros",
            nombre: "nosotros",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "tuyo", nombre: "tuyo" },
          { tipo: "ensenanza_palabra", gifPalabra: "vos", nombre: "vos" },
          { tipo: "ensenanza_palabra", gifPalabra: "yo", nombre: "yo" },
          // ── Bloque 2 (items 8-14): Tipo 2,3,2,5,3,5,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "ellos/ellas",
            opcionesGifs: ["el_ella", "ellos_ellas", "nosotros"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "vos",
            opciones: ["tuyo", "vos", "yo", "mío"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mío",
            opcionesGifs: ["tuyo", "yo", "mio"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "nosotros",
            respuestaCorrecta: "nosotros",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "el_ella",
            opciones: ["mío", "ellos/ellas", "él/ella", "tuyo"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "tuyo",
            respuestaCorrecta: "tuyo",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "yo",
            opcionesGifs: ["yo", "vos", "mio"],
            correcta: 0,
          },
          // ── Bloque 3 (items 15-21): Tipo 5,3,2,3,5,2,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "mio",
            respuestaCorrecta: "mío",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "tuyo",
            opciones: ["yo", "nosotros", "tuyo", "vos"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "vos",
            opcionesGifs: ["yo", "tuyo", "vos"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "nosotros",
            opciones: ["nosotros", "tuyo", "yo", "mío"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "yo",
            respuestaCorrecta: "yo",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "él/ella",
            opcionesGifs: ["el_ella", "ellos_ellas", "vos"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "ellos_ellas",
            opciones: ["tuyo", "yo", "él/ella", "ellos/ellas"],
            correcta: 3,
          },
          // ── Bloque 4 (items 22-28): Tipo 5,2,5,2,3,5,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "vos",
            respuestaCorrecta: "vos",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tuyo",
            opcionesGifs: ["mio", "tuyo", "vos"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "ellos_ellas",
            respuestaCorrecta: "ellos/ellas",
            respuestasAlternativas: [
              "ellos",
              "ellas",
              "ellas/ellos",
              "ellos o ellas",
              "ellas o ellos",
            ],
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "nosotros",
            opcionesGifs: ["ellos_ellas", "yo", "nosotros"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mio",
            opciones: ["tuyo", "mío", "vos", "nosotros"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "el_ella",
            respuestaCorrecta: "él/ella",
            respuestasAlternativas: [
              "él",
              "ella",
              "ella/él",
              "él o ella",
              "ella o él",
            ],
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "yo",
            opciones: ["nuestro", "tuyo", "vos", "yo"],
            correcta: 3,
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
    id: 2, // NIVEL 3 en el mapa (id 2)
    nombre: "Saludos y presentaciones",
    descripcion: "Nombre, apellido, DNI y preguntas básicas.",
    totalXP: 330,
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
            opciones: ["¿cuál?", "¿quién?", "por ejemplo", "¿cómo?"],
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
            opciones: ["¿cuál?", "¿quién?", "por ejemplo", "¿cómo?"],
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
      {
        id: 6, // SECCIÓN 6, nivel 2 · lección extra de frases
        titulo: "Lección: datos personales y pronombres",
        descripcion: "Frases con tus datos y los pronombres.",
        xp: 50,
        items: [
          // ── Frases: todas en modo "armar" salvo la última, en "elegir" ──
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["mio", "dni"],
            palabras: ["mi", "DNI"],
            banco: ["tu", "DNI", "yo", "mi", "nombre"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["mio", "nombre"],
            palabras: ["mi", "nombre"],
            banco: ["nombre", "vos", "apellido", "mi", "tu"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["tuyo", "apellido"],
            palabras: ["tu", "apellido"],
            banco: ["mi", "apellido", "DNI", "tu", "nombre"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["nombre", "el_ella"],
            palabras: ["nombre", "él"],
            // "de" no tiene seña: va fijo, antes de la palabra 1 (él)
            fijas: { 1: "de" },
            banco: ["yo", "nombre", "nosotros", "él", "apellido"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["apellido", "el_ella"],
            palabras: ["apellido", "ella"],
            // "de" no tiene seña: va fijo, antes de la palabra 1 (ella)
            fijas: { 1: "de" },
            banco: ["ellos", "DNI", "ella", "apellido", "vos"],
          },
          {
            tipo: "frase_senas",
            modo: "elegir",
            secuencia: ["mio", "nombre", "tuyo", "apellido"],
            palabras: ["mi", "nombre", "tu", "apellido"],
            opciones: [
              "tu nombre mi apellido",
              "mi apellido tu nombre",
              "mi nombre tu apellido",
              "mi nombre tu DNI",
            ],
            correcta: 2,
          },
        ],
      },
    ],
  },
  {
    id: 3, // NIVEL 4 en el mapa (id 3)
    nombre: "Interacciones cotidianas",
    descripcion: "Saludos, cortesía y frases del día a día.",
    totalXP: 350,
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
            opciones: ["bienvenida", "gracias", "hola", "saludo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "gracias",
            opcionesGifs: ["hola", "gracias", "bienvenida"],
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
            opcionesGifs: ["gracias", "saludos", "chau"],
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
            opcionesGifs: ["saludos", "hola", "gracias"],
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
            // Se ve igual que hola (SENAS_EQUIVALENTES): las dos valen
            respuestasAlternativas: ["hola"],
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
            // Se ve igual que chau (SENAS_EQUIVALENTES): las dos valen
            respuestasAlternativas: ["chau"],
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "chau",
            opciones: ["saludos", "bienvenida", "chau", "bien"],
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
            opcionesGifs: ["bienvenida", "hola", "saludos"],
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
            opcionesGifs: ["chau", "gracias", "saludos"],
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
            // Se ve igual que hola (SENAS_EQUIVALENTES): las dos valen
            respuestasAlternativas: ["hola"],
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
            // Se ve igual que chau (SENAS_EQUIVALENTES): las dos valen
            respuestasAlternativas: ["chau"],
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
            opciones: ["bienvenida", "gracias", "hola", "saludo"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "chau",
            opciones: ["saludos", "bienvenida", "chau", "bien"],
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
      {
        id: 6, // SECCIÓN 6, nivel 3 · lección extra de frases
        titulo: "Lección: saludos y datos personales",
        descripcion: "Pequeñas conversaciones con saludos y tus datos.",
        xp: 50,
        items: [
          // ── Frases: todas en modo "armar" salvo la última, en "elegir" ──
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["hola", "tuyo", "nombre"],
            palabras: ["hola", "tu", "nombre"],
            banco: ["mi", "nombre", "gracias", "hola", "apellido", "tu"],
          },
          // Ejercicio suelto (no es frase)
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "buendia",
            opciones: ["buen día", "buenas tardes", "buenas noches", "hola"],
            correcta: 0,
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["hola", "mio", "nombre", "tuyo", "apellido"],
            palabras: ["hola", "mi", "nombre", "tu", "apellido"],
            banco: [
              "tu",
              "gracias",
              "nombre",
              "hola",
              "DNI",
              "apellido",
              "saludos",
              "mi",
            ],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["tuyo", "apellido", "gracias"],
            palabras: ["tu", "apellido", "gracias"],
            banco: ["gracias", "mi", "apellido", "por favor", "tu", "nombre"],
          },
          {
            tipo: "frase_senas",
            modo: "elegir",
            secuencia: ["gracias", "chau"],
            palabras: ["gracias", "chau"],
            opciones: [
              "gracias chau",
              "de nada chau",
              "gracias saludos",
              "perdón chau",
            ],
            correcta: 0,
          },
        ],
      },
    ],
  },
  {
    id: 4, // NIVEL 5 en el mapa (id 4)
    nombre: "Sentimientos",
    descripcion: "Cómo te sentís y cómo se sienten los demás.",
    totalXP: 350,
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
        descripcion: "loco, feliz, gracioso, llorar, miedoso y nervioso.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "loco",
            nombre: "loco",
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
            gifPalabra: "loco",
            opciones: ["nervioso", "loco", "triste", "preocupado"],
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
            opcionesGifs: ["miedoso", "loco", "llorar"],
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
            palabra: "loco",
            opcionesGifs: ["feliz", "loco", "gracioso"],
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
            opcionesGifs: ["nervioso", "miedoso", "loco"],
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
            gifPalabra: "loco",
            respuestaCorrecta: "loco",
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
          "orgulloso, preocupado, sorprendido, vergüenza, tranquilo y triste.",
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
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "verguenza",
            nombre: "vergüenza",
          },
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
            opcionesGifs: ["sorprendido", "preocupado", "verguenza"],
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
            palabra: "vergüenza",
            opcionesGifs: ["tranquilo", "preocupado", "verguenza"],
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
            gifPalabra: "verguenza",
            opciones: ["vergüenza", "cansado", "preocupado", "triste"],
            correcta: 0,
          },
          // ── Bloque 4 (items 19-24): Tipo 3,5,3,2,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sorprendido",
            opciones: ["deprimido", "vergüenza", "alegre", "sorprendido"],
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
            gifPalabra: "verguenza",
            respuestaCorrecta: "vergüenza",
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
            gifPalabra: "verguenza",
            opciones: ["vergüenza", "cansado", "preocupado", "triste"],
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
            palabra: "loco",
            opcionesGifs: ["nervioso", "loco", "miedoso"],
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
            palabra: "vergüenza",
            opcionesGifs: ["verguenza", "tranquilo", "preocupado"],
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
            opciones: ["deprimido", "vergüenza", "alegre", "sorprendido"],
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
            gifPalabra: "verguenza",
            respuestaCorrecta: "vergüenza",
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
            gifPalabra: "loco",
            respuestaCorrecta: "loco",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "feliz",
            opciones: ["feliz", "gracioso", "contento", "alegre"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "loco",
            opciones: ["nervioso", "loco", "triste", "preocupado"],
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
      {
        id: 6, // SECCIÓN 6, nivel 4 · lección extra de frases
        titulo: "Lección: sentimientos y saludos",
        descripcion: "Contá cómo te sentís y saludá.",
        xp: 50,
        items: [
          // ── Frases: todas en modo "armar" salvo la última, en "elegir" ──
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["yo", "feliz"],
            palabras: ["yo", "feliz"],
            banco: ["triste", "yo", "contento", "feliz", "vos"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["el_ella", "triste"],
            palabras: ["él", "triste"],
            banco: ["feliz", "él", "cansado", "yo", "triste"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["el_ella", "nervioso"],
            palabras: ["ella", "nerviosa"],
            banco: ["yo", "nerviosa", "alegre", "ella", "triste"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["hola", "comoestas"],
            palabras: ["hola", "¿cómo estás?"],
            banco: ["¿cómo?", "hola", "bien", "¿cómo estás?", "gracias"],
          },
          {
            tipo: "frase_senas",
            modo: "elegir",
            secuencia: ["hola", "yo", "contento"],
            palabras: ["hola", "yo", "contento"],
            opciones: [
              "hola yo triste",
              "gracias yo contento",
              "hola vos contento",
              "hola yo contento",
            ],
            correcta: 3,
          },
        ],
      },
    ],
  },
  {
    id: 5, // NIVEL 6 en el mapa (id 5)
    nombre: "Números",
    descripcion: "Del 0 al 1000, con la seña de cada número.",
    totalXP: 450,
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
      {
        id: 8, // SECCIÓN 8, nivel 5 · lección extra de frases
        titulo: "Lección: números y personas",
        descripcion: "Números combinados con lo que ya sabés.",
        xp: 50,
        items: [
          // ── Frases: todas en modo "armar" salvo la última, en "elegir" ──
          // Ejercicio suelto (no es frase)
          {
            tipo: "escritura_libre",
            gifPalabra: "n100",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "100",
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["el_ella", "n9"],
            palabras: ["él", "9"],
            banco: ["9", "yo", "él", "6", "nosotros"],
          },
          // Ejercicio suelto (no es frase)
          {
            tipo: "escritura_libre",
            gifPalabra: "n8",
            enunciado: "¿Cuál es este número?",
            etiqueta: "Escribí el número aquí",
            respuestaCorrecta: "8",
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["yo", "n17"],
            palabras: ["yo", "17"],
            banco: ["7", "vos", "17", "yo", "70"],
          },
          {
            tipo: "frase_senas",
            modo: "elegir",
            secuencia: ["el_ella", "n40"],
            palabras: ["ella", "40"],
            opciones: ["yo 40", "ella 40", "ella 14", "ellos 40"],
            correcta: 1,
          },
        ],
      },
    ],
  },
  {
    id: 6, // NIVEL 7 en el mapa (id 6)
    nombre: "Familia y vínculos",
    descripcion: "Familia, parentescos y estado civil.",
    totalXP: 400,
    lecciones: [
      {
        id: 1, // SECCIÓN 1, nivel 6
        titulo: "La familia",
        descripcion: "abuelo, bebé, bisabuelo, familia y gemelos.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "abuelo", nombre: "abuelo" },
          { tipo: "ensenanza_palabra", gifPalabra: "bebe", nombre: "bebé" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "bisabuelo",
            nombre: "bisabuelo",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "familia",
            nombre: "familia",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "gemelos",
            nombre: "gemelos",
          },
          // ── Bloque 2 (items 6-10): Tipo 3,2,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bebe",
            opciones: ["familia", "bisabuelo", "gemelos", "bebé"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bisabuelo",
            opcionesGifs: ["abuelo", "familia", "bisabuelo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "gemelos",
            opcionesGifs: ["gemelos", "bebe", "familia"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "abuelo",
            respuestaCorrecta: "abuelo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "familia",
            opciones: ["familia", "gemelos", "bebé", "abuelo"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "bebe",
            respuestaCorrecta: "bebé",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gemelos",
            opciones: ["abuelo", "familia", "gemelos", "bebé"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bisabuelo",
            respuestaCorrecta: "bisabuelo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "abuelo",
            opciones: ["bebé", "familia", "abuelo", "bisabuelo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "familia",
            opcionesGifs: ["gemelos", "familia", "abuelo"],
            correcta: 1,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,2,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bisabuelo",
            opciones: ["abuelo", "gemelos", "familia", "bisabuelo"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bebé",
            opcionesGifs: ["bebe", "gemelos", "bisabuelo"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "familia",
            respuestaCorrecta: "familia",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "abuelo",
            opcionesGifs: ["bisabuelo", "abuelo", "bebe"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gemelos",
            respuestaCorrecta: "gemelos",
          },
        ],
      },
      {
        id: 2, // SECCIÓN 2, nivel 6
        titulo: "Hijos y hermanos",
        descripcion: "hermano, hijastro, hijo, madrastra y mamá.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "hermano",
            nombre: "hermano",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "hijastro",
            nombre: "hijastro",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "hijo", nombre: "hijo" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "madrastra",
            nombre: "madrastra",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "mama", nombre: "mamá" },
          // ── Bloque 2 (items 6-10): Tipo 2,2,3,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "madrastra",
            opcionesGifs: ["mama", "madrastra", "hijastro"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hermano",
            opcionesGifs: ["hijo", "hijastro", "hermano"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hijo",
            opciones: ["madrastra", "mamá", "hijo", "ahijado"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mama",
            respuestaCorrecta: "mamá",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hijastro",
            opciones: ["hijastro", "hijo", "hermano", "tío"],
            correcta: 0,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "hermano",
            respuestaCorrecta: "hermano",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "madrastra",
            opciones: ["papá", "padrastro", "mamá", "madrastra"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hijo",
            respuestaCorrecta: "hijo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mama",
            opciones: ["mamá", "papá", "madrina", "madrastra"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hijastro",
            opcionesGifs: ["hijastro", "hijo", "madrastra"],
            correcta: 0,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hermano",
            opciones: ["hijo", "hermano", "hijastro", "ahijado"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mamá",
            opcionesGifs: ["madrastra", "hermano", "mama"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "madrastra",
            respuestaCorrecta: "madrastra",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hijastro",
            respuestaCorrecta: "hijastro",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hijo",
            opcionesGifs: ["hijastro", "hijo", "hermano"],
            correcta: 1,
          },
        ],
      },
      {
        id: 3, // SECCIÓN 3, nivel 6
        titulo: "Padres, tíos y primos",
        descripcion: "mellizos, padrastro, papá, primo, sobrino y tío.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-6) ──
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "mellizos",
            nombre: "mellizos",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "padrastro",
            nombre: "padrastro",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "papa", nombre: "papá" },
          { tipo: "ensenanza_palabra", gifPalabra: "primo", nombre: "primo" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "sobrino",
            nombre: "sobrino",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "tio", nombre: "tío" },
          // ── Bloque 2 (items 7-12): Tipo 3,2,5,2,3,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "padrastro",
            opciones: ["papá", "primo", "tío", "padrastro"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mellizos",
            opcionesGifs: ["mellizos", "primo", "sobrino"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sobrino",
            respuestaCorrecta: "sobrino",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "papá",
            opcionesGifs: ["padrastro", "tio", "papa"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "tio",
            opciones: ["papá", "sobrino", "tío", "primo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "primo",
            opcionesGifs: ["sobrino", "primo", "tio"],
            correcta: 1,
          },
          // ── Bloque 3 (items 13-18): Tipo 2,3,5,2,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "tío",
            opcionesGifs: ["papa", "primo", "tio"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "primo",
            opciones: ["sobrino", "tío", "primo", "papá"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "padrastro",
            respuestaCorrecta: "padrastro",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sobrino",
            opcionesGifs: ["sobrino", "primo", "mellizos"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "papa",
            respuestaCorrecta: "papá",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mellizos",
            opciones: ["papá", "padrastro", "mellizos", "primo"],
            correcta: 2,
          },
          // ── Bloque 4 (items 19-24): Tipo 3,5,3,2,5,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "papa",
            opciones: ["papá", "padrastro", "primo", "tío"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "tio",
            respuestaCorrecta: "tío",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sobrino",
            opciones: ["tío", "sobrino", "primo", "padrastro"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "padrastro",
            opcionesGifs: ["papa", "padrastro", "sobrino"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "primo",
            respuestaCorrecta: "primo",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mellizos",
            respuestaCorrecta: "mellizos",
          },
        ],
      },
      {
        id: 4, // SECCIÓN 4, nivel 6
        titulo: "Estado civil",
        descripcion: "amante, casados, cuñado, divorciado y juntos.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "amante", nombre: "amante" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "casados",
            nombre: "casados",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "cunado", nombre: "cuñado" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "divorciado",
            nombre: "divorciado",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "juntos", nombre: "juntos" },
          // ── Bloque 2 (items 6-10): Tipo 2,2,3,5,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "divorciado",
            opcionesGifs: ["casados", "juntos", "divorciado"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "amante",
            opcionesGifs: ["amante", "juntos", "cunado"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "casados",
            opciones: ["divorciado", "juntos", "cuñado", "casados"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cunado",
            respuestaCorrecta: "cuñado",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "juntos",
            opcionesGifs: ["casados", "divorciado", "juntos"],
            correcta: 2,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,2,3,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "amante",
            respuestaCorrecta: "amante",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cunado",
            opciones: ["cuñado", "divorciado", "juntos", "casados"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "casados",
            opcionesGifs: ["divorciado", "casados", "amante"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "divorciado",
            opciones: ["divorciado", "juntos", "casados", "amante"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "juntos",
            respuestaCorrecta: "juntos",
          },
          // ── Bloque 4 (items 16-20): Tipo 5,2,5,3,3 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "divorciado",
            respuestaCorrecta: "divorciado",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "cuñado",
            opcionesGifs: ["cunado", "amante", "casados"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "casados",
            respuestaCorrecta: "casados",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "amante",
            opciones: ["juntos", "cuñado", "amante", "casados"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "juntos",
            opciones: ["casados", "divorciado", "juntos", "separados"],
            correcta: 2,
          },
        ],
      },
      {
        id: 5, // SECCIÓN 5, nivel 6
        titulo: "Noviazgo y pareja",
        descripcion: "novio, pareja, separados, soltero y suegro.",
        xp: 50,
        items: [
          // ── Tipo 1: enseñanza (items 1-5) ──
          { tipo: "ensenanza_palabra", gifPalabra: "novio", nombre: "novio" },
          { tipo: "ensenanza_palabra", gifPalabra: "pareja", nombre: "pareja" },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "separados",
            nombre: "separados",
          },
          {
            tipo: "ensenanza_palabra",
            gifPalabra: "soltero",
            nombre: "soltero",
          },
          { tipo: "ensenanza_palabra", gifPalabra: "suegro", nombre: "suegro" },
          // ── Bloque 2 (items 6-10): Tipo 3,2,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "soltero",
            opciones: ["casados", "soltero", "amante", "suegro"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "pareja",
            opcionesGifs: ["novio", "pareja", "separados"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "novio",
            opcionesGifs: ["novio", "pareja", "suegro"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "separados",
            respuestaCorrecta: "separados",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "suegro",
            opciones: ["separados", "novio", "pareja", "suegro"],
            correcta: 3,
          },
          // ── Bloque 3 (items 11-15): Tipo 5,3,5,3,2 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "novio",
            respuestaCorrecta: "novio",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "pareja",
            opciones: ["suegro", "separados", "pareja", "soltero"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "suegro",
            respuestaCorrecta: "suegro",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "separados",
            opciones: ["separados", "juntos", "soltero", "suegro"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "soltero",
            opcionesGifs: ["separados", "novio", "soltero"],
            correcta: 2,
          },
          // ── Bloque 4 (items 16-20): Tipo 3,2,5,5,2 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "novio",
            opciones: ["soltero", "pareja", "juntos", "novio"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "separados",
            opcionesGifs: ["separados", "soltero", "pareja"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "soltero",
            respuestaCorrecta: "soltero",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "pareja",
            respuestaCorrecta: "pareja",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "suegro",
            opcionesGifs: ["novio", "suegro", "soltero"],
            correcta: 1,
          },
        ],
      },
      {
        id: 6, // SECCIÓN 6, nivel 6
        titulo: "Repaso del nivel",
        descripcion: "Todas las palabras del nivel, mezcladas.",
        xp: 100,
        items: [
          // ── Bloque 1 (items 1-10): Tipo 2,3,2,5,3,2,5,5,3,2 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "cuñado",
            opcionesGifs: ["hermano", "suegro", "cunado"],
            correcta: 2,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "gemelos",
            opciones: ["abuelo", "familia", "gemelos", "bebé"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "separados",
            opcionesGifs: ["separados", "divorciado", "juntos"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "novio",
            respuestaCorrecta: "novio",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "abuelo",
            opciones: ["bebé", "familia", "abuelo", "bisabuelo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "familia",
            opcionesGifs: ["pareja", "familia", "abuelo"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "padrastro",
            respuestaCorrecta: "padrastro",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "suegro",
            respuestaCorrecta: "suegro",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "novio",
            opciones: ["soltero", "pareja", "juntos", "novio"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "primo",
            opcionesGifs: ["sobrino", "tio", "primo"],
            correcta: 2,
          },
          // ── Bloque 2 (items 11-20): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "sobrino",
            opciones: ["tío", "sobrino", "primo", "padrastro"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mamá",
            opcionesGifs: ["madrastra", "mama", "papa"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bebe",
            respuestaCorrecta: "bebé",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hermano",
            opcionesGifs: ["hermano", "primo", "hijo"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "pareja",
            opcionesGifs: ["pareja", "novio", "casados"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hijastro",
            opciones: ["hijastro", "hijo", "hermano", "tío"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "bisabuelo",
            respuestaCorrecta: "bisabuelo",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "tío",
            opcionesGifs: ["sobrino", "papa", "tio"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "primo",
            respuestaCorrecta: "primo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "papa",
            opciones: ["papá", "padrastro", "primo", "tío"],
            correcta: 0,
          },
          // ── Bloque 3 (items 21-30): Tipo 3,2,5,2,2,3,5,2,5,3 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "soltero",
            opciones: ["casados", "soltero", "amante", "suegro"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "amante",
            opcionesGifs: ["novio", "amante", "pareja"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "abuelo",
            respuestaCorrecta: "abuelo",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "mellizos",
            opcionesGifs: ["gemelos", "hermano", "mellizos"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "sobrino",
            opcionesGifs: ["sobrino", "primo", "hijo"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "madrastra",
            opciones: ["papá", "padrastro", "mamá", "madrastra"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "gemelos",
            respuestaCorrecta: "gemelos",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "casados",
            opcionesGifs: ["divorciado", "casados", "juntos"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "cunado",
            respuestaCorrecta: "cuñado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "juntos",
            opciones: ["casados", "divorciado", "juntos", "separados"],
            correcta: 2,
          },
          // ── Bloque 4 (items 31-40): Tipo 2,3,2,2,5,3,2,5,5,3 ──
          {
            tipo: "elegir_sena_palabra",
            palabra: "divorciado",
            opcionesGifs: ["casados", "divorciado", "separados"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hijo",
            opciones: ["madrastra", "mamá", "hijo", "ahijado"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "padrastro",
            opcionesGifs: ["padrastro", "papa", "madrastra"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hijastro",
            opcionesGifs: ["hijo", "padrastro", "hijastro"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "casados",
            respuestaCorrecta: "casados",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "tio",
            opciones: ["papá", "sobrino", "tío", "primo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "hijo",
            opcionesGifs: ["hijo", "hijastro", "sobrino"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hermano",
            respuestaCorrecta: "hermano",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "familia",
            respuestaCorrecta: "familia",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bisabuelo",
            opciones: ["abuelo", "gemelos", "familia", "bisabuelo"],
            correcta: 3,
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
            gifPalabra: "hijastro",
            respuestaCorrecta: "hijastro",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "familia",
            opciones: ["familia", "gemelos", "bebé", "abuelo"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mama",
            respuestaCorrecta: "mamá",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mellizos",
            opciones: ["papá", "padrastro", "mellizos", "primo"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bebé",
            opcionesGifs: ["hijo", "mellizos", "bebe"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "madrastra",
            opcionesGifs: ["mama", "madrastra", "padrastro"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "hijo",
            respuestaCorrecta: "hijo",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "cunado",
            opciones: ["cuñado", "divorciado", "juntos", "casados"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "amante",
            opciones: ["juntos", "cuñado", "amante", "casados"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "madrastra",
            respuestaCorrecta: "madrastra",
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
            gifPalabra: "soltero",
            respuestaCorrecta: "soltero",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "novio",
            opcionesGifs: ["novio", "amante", "soltero"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "primo",
            opciones: ["sobrino", "tío", "primo", "papá"],
            correcta: 2,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "suegro",
            opcionesGifs: ["cunado", "abuelo", "suegro"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "sobrino",
            respuestaCorrecta: "sobrino",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "mama",
            opciones: ["mamá", "papá", "madrina", "madrastra"],
            correcta: 0,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "papá",
            opcionesGifs: ["padrastro", "papa", "tio"],
            correcta: 1,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "mellizos",
            respuestaCorrecta: "mellizos",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "divorciado",
            opciones: ["divorciado", "juntos", "casados", "amante"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "padrastro",
            opciones: ["papá", "primo", "tío", "padrastro"],
            correcta: 3,
          },
          // ── Bloque 7 (items 61-70): Tipo 3,2,5,3,3,5,5,2,3,5 ──
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "casados",
            opciones: ["divorciado", "juntos", "cuñado", "casados"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "juntos",
            opcionesGifs: ["casados", "separados", "juntos"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "tio",
            respuestaCorrecta: "tío",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "separados",
            opciones: ["separados", "juntos", "soltero", "suegro"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "pareja",
            opciones: ["suegro", "separados", "pareja", "soltero"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "amante",
            respuestaCorrecta: "amante",
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "papa",
            respuestaCorrecta: "papá",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "abuelo",
            opcionesGifs: ["abuelo", "bisabuelo", "tio"],
            correcta: 0,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "bebe",
            opciones: ["familia", "bisabuelo", "gemelos", "bebé"],
            correcta: 3,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "juntos",
            respuestaCorrecta: "juntos",
          },
          // ── Bloque 8 (items 71-78): Tipo 5,2,3,2,5,3,2,5 ──
          {
            tipo: "escritura_libre",
            gifPalabra: "separados",
            respuestaCorrecta: "separados",
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "soltero",
            opcionesGifs: ["separados", "soltero", "divorciado"],
            correcta: 1,
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "suegro",
            opciones: ["separados", "novio", "pareja", "suegro"],
            correcta: 3,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "gemelos",
            opcionesGifs: ["mellizos", "bebe", "gemelos"],
            correcta: 2,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "divorciado",
            respuestaCorrecta: "divorciado",
          },
          {
            tipo: "que_palabra_opciones",
            gifPalabra: "hermano",
            opciones: ["hijo", "hermano", "hijastro", "ahijado"],
            correcta: 1,
          },
          {
            tipo: "elegir_sena_palabra",
            palabra: "bisabuelo",
            opcionesGifs: ["bisabuelo", "abuelo", "familia"],
            correcta: 0,
          },
          {
            tipo: "escritura_libre",
            gifPalabra: "pareja",
            respuestaCorrecta: "pareja",
          },
          // ── Motivación: fin de la sección ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡felicidades!",
            subtitulo: "Estás avanzando muchísimo",
            textoBoton: "¡Terminar!",
          },
        ],
      },
      {
        id: 7, // SECCIÓN 7, nivel 6 · lección extra de frases
        titulo: "Lección: familia y todo lo anterior",
        descripcion: "Frases sobre tu familia con todo lo aprendido.",
        xp: 50,
        items: [
          // ── Frases: todas en modo "armar" salvo la última, en "elegir" ──
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["mio", "mama"],
            palabras: ["mi", "mamá"],
            banco: ["papá", "mi", "abuelo", "mamá", "tu"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["mio", "papa"],
            palabras: ["mi", "papá"],
            banco: ["tu", "papá", "hermano", "mi", "mamá"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["mio", "hermano", "feliz"],
            palabras: ["mi", "hermano", "feliz"],
            banco: ["feliz", "tu", "hermano", "triste", "mi", "primo"],
          },
          {
            tipo: "frase_senas",
            modo: "armar",
            secuencia: ["hola", "mio", "familia"],
            palabras: ["hola", "mi", "familia"],
            banco: ["familia", "mamá", "mi", "abuelo", "hola", "tu"],
          },
          {
            tipo: "frase_senas",
            modo: "elegir",
            secuencia: ["tuyo", "abuelo"],
            palabras: ["tu", "abuelo"],
            opciones: ["mi abuelo", "tu bisabuelo", "tu abuelo", "tu tío"],
            correcta: 2,
          },
          // ── Motivación: fin del último nivel (y de la app) ──
          {
            tipo: "motivacion",
            variante: "corazon",
            titulo: "¡completaste todos los niveles!",
            subtitulo: "Ya sabés un montón de LSA",
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
  const { vidas } = vidasData;
  const proximaRegen = Number(vidasData.proximaRegen);
  if (!proximaRegen || Number.isNaN(proximaRegen)) {
    return { vidas, proximaRegen: null };
  }
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

// Número del nivel en el mapa (1, 2, 3...) según su lugar en NIVELES: es el
// que ve el usuario. El id no sigue el orden: solo identifica al nivel y es
// la clave del progreso guardado ({ "7": [1] } es Pronombres).
const numeroDeNivel = (nivel) =>
  NIVELES.findIndex((n) => n.id === nivel.id) + 1;

const getNivelEstado = (nivel, leccionesCompletadas) => {
  const totalLecciones = nivel.lecciones.length;
  if (totalLecciones === 0) return "bloqueado";

  const completadas = contarCompletadasValidas(
    leccionesCompletadas[nivel.id] || [],
    nivel.lecciones,
  );
  // Un nivel terminado queda completado aunque el anterior no lo esté: así
  // nadie pierde el acceso a lo que ya hizo si cambia el orden del mapa
  if (completadas >= totalLecciones) return "completado";
  // Un nivel empezado sigue abierto aunque el anterior no esté completo: por
  // ejemplo, si a un nivel ya terminado se le agrega una lección nueva
  if (completadas > 0) return "actual";

  // El primero y el anterior salen del orden en NIVELES, no del id
  const indice = numeroDeNivel(nivel) - 1;
  if (indice === 0) return "actual";
  const nivelAnterior = NIVELES[indice - 1];
  const completadasAnterior = contarCompletadasValidas(
    leccionesCompletadas[nivelAnterior.id] || [],
    nivelAnterior.lecciones,
  );
  if (completadasAnterior < nivelAnterior.lecciones.length) return "bloqueado";
  return "actual";
};

// Devuelve el progreso con la lección agregada, sin modificar el original.
// Es pura (no guarda ni llama a nada), así sirve para el updater de setProgreso.
const agregarLeccion = (progreso, nivelId, leccionId) => {
  const actuales = progreso.leccionesCompletadas[nivelId] || [];
  if (actuales.includes(leccionId)) return progreso;
  return {
    ...progreso,
    leccionesCompletadas: {
      ...progreso.leccionesCompletadas,
      [nivelId]: [...actuales, leccionId],
    },
  };
};

// ══════════════════════════════════════════════════════════════════════
//  PERSISTENCIA — AsyncStorage, keyeado por id de usuario
// ══════════════════════════════════════════════════════════════════════

const KEYS = {
  progreso: (uid) => `progreso_${uid}`,
  vidas: (uid) => `vidas_${uid}`,
};

const DEFAULT_PROGRESO = { leccionesCompletadas: {} }; // usuario nuevo: nada completado
const DEFAULT_VIDAS = { vidas: 3, proximaRegen: null };

// Lee de la API. Si falla (sin internet, 401...), usa la copia del celular.
const cargarDatos = async (uid) => {
  if (!uid) return { progreso: DEFAULT_PROGRESO, vidas: DEFAULT_VIDAS };

  const [resProgreso, resVidas] = await Promise.all([
    obtenerProgreso(uid),
    obtenerVidas(uid),
  ]);

  let progreso = null;
  let vidas = null;

  if (resProgreso.ok) {
    progreso = {
      leccionesCompletadas: resProgreso.progreso?.leccionesCompletadas || {},
    };
    AsyncStorage.setItem(KEYS.progreso(uid), JSON.stringify(progreso)).catch(
      () => {},
    );
  }

  if (resVidas.ok) {
    vidas = {
      vidas: resVidas.vidas?.vidas ?? 3,
      proximaRegen: resVidas.vidas?.proximaRegen
        ? Number(resVidas.vidas.proximaRegen)
        : null,
    };
    AsyncStorage.setItem(KEYS.vidas(uid), JSON.stringify(vidas)).catch(
      () => {},
    );
  }

  // Lo que no vino de la API se completa con lo guardado en el celular
  if (!progreso || !vidas) {
    try {
      const [progresoRaw, vidasRaw] = await Promise.all([
        AsyncStorage.getItem(KEYS.progreso(uid)),
        AsyncStorage.getItem(KEYS.vidas(uid)),
      ]);
      if (!progreso) {
        progreso = progresoRaw ? JSON.parse(progresoRaw) : DEFAULT_PROGRESO;
      }
      if (!vidas) {
        vidas = vidasRaw ? JSON.parse(vidasRaw) : DEFAULT_VIDAS;
      }
    } catch {
      progreso = progreso || DEFAULT_PROGRESO;
      vidas = vidas || DEFAULT_VIDAS;
    }
  }

  return { progreso, vidas: checkRegenVidas(vidas) };
};

// Guarda en el celular al toque y sincroniza con la API.
const guardarProgreso = async (uid, progreso) => {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(KEYS.progreso(uid), JSON.stringify(progreso));
  } catch (e) {
    console.log("Error guardando progreso local:", e);
  }
  const res = await guardarProgresoAPI(uid, progreso.leccionesCompletadas);
  if (!res.ok) console.log("No se pudo sincronizar el progreso:", res.error);
};

const guardarVidas = async (uid, vidas) => {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(KEYS.vidas(uid), JSON.stringify(vidas));
  } catch (e) {
    console.log("Error guardando vidas local:", e);
  }
  const res = await guardarVidasAPI(uid, vidas);
  if (!res.ok) console.log("No se pudieron sincronizar las vidas:", res.error);
};

// ══════════════════════════════════════════════════════════════════════
//  LECCIÓN EN CURSO — avance de una lección a medias (services/leccionEnCurso)
// ══════════════════════════════════════════════════════════════════════

// Campos de un ítem que nombran un GIF (claves de constants/gifsNube.js). Si
// se agrega un tipo de ítem con otro campo de GIF, sumarlo acá.
const CAMPOS_GIF = [
  "letra",
  "gifLetra",
  "gifPalabra",
  "opcionesLetras",
  "opcionesGifs",
  "secuencia",
];

// Links de los GIFs de una lección desde el ítem `desde` hasta el final, en
// orden y sin repetir: enseñanza, opciones, secuencias de letras y de frases.
// Las claves sin link se saltean (SenaGif muestra el error al aparecer).
const linksDeLeccion = (leccion, desde) => {
  const claves = (leccion.items || [])
    .slice(desde)
    .flatMap((item) => CAMPOS_GIF.flatMap((campo) => item[campo] ?? []));
  return [...new Set(claves.map(linkDeSena).filter(Boolean))];
};

// Firma de una lección: "<cantidad de ítems>-<hash>" (la de "Letras A–E" es
// "20-1r2mihr"). El hash sale del tipo y los GIFs de cada ítem, en orden.
// Cambia si se agregan, sacan o reordenan ítems, o si cambia el tipo o un GIF
// de alguno: ahí el índice guardado ya no apunta al mismo ítem. No cambia por
// los textos (títulos, opciones escritas, motivación) ni por la respuesta
// correcta.
const firmaDeLeccion = (leccion) => {
  const items = leccion.items || [];
  const gifsDe = (item) => CAMPOS_GIF.flatMap((campo) => item[campo] ?? []);
  // Por ejemplo "ensenanza,A|...|que_letra,B|elegir_sena,D,A,E,D|..."
  const texto = items
    .map((item) => [item.tipo, ...gifsDe(item)].join(","))
    .join("|");
  // FNV-1a de 32 bits: un número corto que cambia si cambia cualquier letra
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${items.length}-${(hash >>> 0).toString(36)}`;
};

// Compara lo guardado con la lección actual. null: no hay nada guardado.
// { valido: true, indice, errores, total } o { valido: false, motivo }.
const revisarAvance = (leccion, guardado) => {
  if (guardado == null) return null;
  const total = leccion.items?.length ?? 0;
  const { indice, errores } = guardado;
  let motivo = null;
  if (guardado.firma !== firmaDeLeccion(leccion) || guardado.total !== total)
    motivo = "la lección cambió (la firma no coincide)";
  else if (!Number.isInteger(errores) || errores < 0)
    motivo = `los errores no son válidos (${errores})`;
  // total sería después del último ítem
  else if (!Number.isInteger(indice) || indice < 0 || indice >= total)
    motivo = `el índice no es válido (${indice} de ${total})`;
  // En el ítem 0 solo se guarda si hubo errores: sin errores es lo mismo que
  // empezar de cero
  else if (indice === 0 && errores === 0)
    motivo = "no hay nada para continuar (ítem 1 sin errores)";
  return motivo
    ? { valido: false, motivo }
    : { valido: true, indice, errores, total };
};

const avisarAvanceDescartado = (nivelId, leccionId, motivo) =>
  console.warn(
    `[Lección en curso] Se descartó el avance guardado: ${motivo}. La lección empieza de cero.`,
    { nivel: nivelId, leccion: leccionId },
  );

// Al cargar la cuenta queda solo el avance que todavía sirve. El de una
// lección completada (por ejemplo, en otro celular) se borra sin avisar; el
// que ya no coincide con la lección, con un console.warn.
const limpiarEnCurso = (uid, todas, leccionesCompletadas) => {
  const validas = {};
  for (const nivel of NIVELES) {
    for (const leccion of nivel.lecciones) {
      const clave = claveLeccionEnCurso(nivel.id, leccion.id);
      const revision = revisarAvance(leccion, todas[clave]);
      if (!revision) continue;
      const completada = (leccionesCompletadas[nivel.id] || []).includes(
        leccion.id,
      );
      if (!completada && revision.valido) {
        validas[clave] = todas[clave];
        continue;
      }
      if (!completada)
        avisarAvanceDescartado(nivel.id, leccion.id, revision.motivo);
      borrarLeccionEnCurso(uid, nivel.id, leccion.id);
    }
  }
  return validas;
};

// ══════════════════════════════════════════════════════════════════════
//  MAPA — componentes
// ══════════════════════════════════════════════════════════════════════

const CIRCLE_SIZE = 80;
const ZIGZAG_PADDING = 40;
// Ancho en el que se puede ubicar el borde izquierdo de un círculo
const ANCHO_UTIL = SCREEN_WIDTH - ZIGZAG_PADDING * 2 - CIRCLE_SIZE;
// Zigzag regular para cualquier cantidad de niveles: índice par a la
// izquierda, impar a la derecha (fracciones de ANCHO_UTIL)
const LADO_IZQ = 0.2;
const LADO_DER = 0.8;
// Distancia vertical entre un nivel y el siguiente
const ESPACIO_VERTICAL = 120;
// Aire arriba del primer nivel: su anillo de pulso sobresale 8 px del
// círculo y en y = 0 se cortaba
const MARGEN_ARRIBA = 24;
// Aire debajo del último nivel. La tab bar no tapa el mapa (va debajo del
// ScrollView, no encima), así que no hace falta sumarle su alto
const MARGEN_ABAJO = 40;

const getPosition = (i) => ({
  x: ZIGZAG_PADDING + (i % 2 === 0 ? LADO_IZQ : LADO_DER) * ANCHO_UTIL,
  y: MARGEN_ARRIBA + i * ESPACIO_VERTICAL,
});
const getTotalHeight = (cantidad) =>
  MARGEN_ARRIBA + (cantidad - 1) * ESPACIO_VERTICAL + CIRCLE_SIZE + MARGEN_ABAJO;

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
        {toRomano(numeroDeNivel(nivel))}
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
              <Text style={styles.modalNivel}>
                Nivel {toRomano(numeroDeNivel(nivel))}
              </Text>
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

// avance: { indice, total } si la lección está a medias (si no, null)
const LeccionCard = ({ leccion, index, onPress, bloqueada, avance }) => {
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
  const xp = (
    <Text style={[styles.leccionXP, { color: c.iconColor }]}>
      +{leccion.xp} XP
    </Text>
  );
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
        {/* A medias: cuánto hizo (ítems vistos / total) */}
        {avance && (
          <View style={styles.leccionAvanceFondo}>
            <View
              style={[
                styles.leccionAvanceRelleno,
                { width: `${(avance.indice / avance.total) * 100}%` },
              ]}
            />
          </View>
        )}
        <Text
          style={[
            styles.leccionDesc,
            { color: bloqueada ? "#BDBDBD" : "#666" },
          ]}
          numberOfLines={1}
        >
          {leccion.descripcion}
        </Text>
        {avance ? (
          <View style={styles.leccionPie}>
            {xp}
            <View style={styles.leccionEtiqueta}>
              <Text style={styles.leccionEtiquetaTxt}>
                En curso · {avance.indice}/{avance.total}
              </Text>
            </View>
          </View>
        ) : (
          xp
        )}
      </View>
      {avance ? (
        <Text style={[styles.leccionContinuarTxt, { color: c.iconColor }]}>
          Continuar
        </Text>
      ) : (
        <Text style={[styles.leccionIconEstado, { color: c.iconColor }]}>
          {c.icon}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ══════════════════════════════════════════════════════════════════════
//  NIVEL — cartel "Tenés esta lección a medias"
// ══════════════════════════════════════════════════════════════════════

// iOS presenta un solo Modal de RN por vez: si este cartel se abriera o se
// cerrara justo cuando otro Modal se abre o se cierra (el del nivel al entrar,
// el del resultado al cerrarlo, el de "Sin vidas"), alguno podría no
// aparecer. Por eso en iOS va en un FullWindowOverlay, que no es un Modal
// (como en PantallaSinConexion). En Android cada Modal es otra ventana y en
// web otro portal: ahí se pueden abrir y cerrar varios a la vez.
const CapaCartelIOS = ({ children }) => (
  <FullWindowOverlay>{children}</FullWindowOverlay>
);
const CapaCartelModal = ({ children, onCerrar }) => (
  <Modal visible transparent animationType="fade" onRequestClose={onCerrar}>
    {children}
  </Modal>
);
const CapaCartel = Platform.OS === "ios" ? CapaCartelIOS : CapaCartelModal;

// cartel: { leccion, indice, total } o null (cerrado)
const CartelLeccionEnCurso = ({
  cartel,
  onContinuar,
  onEmpezarDeNuevo,
  onCancelar,
}) => {
  if (!cartel) return null;
  return (
    <CapaCartel onCerrar={onCancelar}>
      <TouchableWithoutFeedback onPress={onCancelar}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalNivel}>{cartel.leccion.titulo}</Text>
              <Text style={styles.modalNombre}>
                Tenés esta lección a medias
              </Text>
              <Text style={styles.modalDescripcion}>
                Podés seguir donde la dejaste o empezarla otra vez desde el
                principio.
              </Text>
              <TouchableOpacity style={styles.modalBoton} onPress={onContinuar}>
                <Text style={styles.modalBotonTexto}>
                  Continuar (ejercicio {cartel.indice + 1} de {cartel.total})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonSecundario]}
                onPress={onEmpezarDeNuevo}
              >
                <Text
                  style={[
                    styles.modalBotonTexto,
                    styles.modalBotonSecundarioTexto,
                  ]}
                >
                  Empezar de nuevo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancelar} style={styles.modalCerrar}>
                <Text style={styles.modalCerrarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </CapaCartel>
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
        <SenaGif clave={item.letra} style={styles.gifGrande} />
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
                    <SenaGif clave={letra} style={styles.gifOpcion} />
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
          <SenaGif clave={item.gifLetra} style={styles.gifGrande} />
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
                <SenaGif
                  clave={letra}
                  style={{ width: gifW, height: gifW * 1.3 }}
                  contentFit="cover"
                  compacto
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
  // respuestasAlternativas (opcional): otras respuestas que también valen,
  // como "ella" para "él/ella". Los espacios alrededor de "/" no cuentan.
  const comparable = (s) => normalizarTexto(s).replace(/\s*\/\s*/g, "/");
  const aceptadas = [
    item.respuestaCorrecta,
    ...(enLetras ? [enLetras] : []),
    ...(item.respuestasAlternativas ?? []),
  ];
  const esCorrecta = aceptadas.some((r) => comparable(r) === comparable(texto));

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

// ── Frases en señas (frase_senas): varias señas seguidas ─────────────
// Visor: una sola seña por vez, del mismo tamaño que en los demás
// ejercicios (los GIFs de vocabulario son apaisados y en fila quedaban de
// ~80×45 px). Flechas y chips numerados para moverse entre las señas.
const VisorFrase = ({ secuencia, actual, onCambiar }) => {
  const total = secuencia.length;
  const esPrimera = actual === 0;
  const esUltima = actual === total - 1;

  return (
    <>
      <View style={styles.gifGrandeWrap}>
        {/* Un solo GIF montado; con key, cada seña arranca desde el inicio */}
        <SenaGif
          key={actual}
          clave={secuencia[actual]}
          style={styles.gifGrande}
        />
      </View>
      {total > 1 && (
        <View style={styles.fraseNav}>
          <TouchableOpacity
            style={[styles.fraseFlecha, esPrimera && styles.fraseFlechaOff]}
            onPress={() => onCambiar(actual - 1)}
            disabled={esPrimera}
            accessibilityRole="button"
            accessibilityLabel="Seña anterior"
          >
            <Text
              style={[
                styles.fraseFlechaTxt,
                esPrimera && styles.fraseFlechaTxtOff,
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>
          {secuencia.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.fraseChip, i === actual && styles.fraseChipActivo]}
              onPress={() => onCambiar(i)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Ver seña ${i + 1} de ${total}`}
              accessibilityState={{ selected: i === actual }}
            >
              <Text
                style={[
                  styles.fraseChipTxt,
                  i === actual && styles.fraseChipTxtActivo,
                ]}
              >
                {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.fraseFlecha, esUltima && styles.fraseFlechaOff]}
            onPress={() => onCambiar(actual + 1)}
            disabled={esUltima}
            accessibilityRole="button"
            accessibilityLabel="Seña siguiente"
          >
            <Text
              style={[
                styles.fraseFlechaTxt,
                esUltima && styles.fraseFlechaTxtOff,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// Texto de la frase con sus palabras fijas (sin seña) en su lugar:
// fijas: { 1: "de" } pone "de" antes de la palabra 1 → "nombre de él".
// Con el índice palabras.length, la fija va al final.
const textoDeFrase = ({ palabras, fijas = {} }) => {
  const partes = [];
  palabras.forEach((palabra, i) => {
    if (fijas[i]) partes.push(fijas[i]);
    partes.push(palabra);
  });
  if (fijas[palabras.length]) partes.push(fijas[palabras.length]);
  return partes.join(" ");
};

// modo "armar": tocar palabras del banco para completar la frase en orden
// (misma mecánica que ItemQuePalabra). modo "elegir": 4 frases para elegir
// (misma mecánica y colores que ItemQuePalabraOpciones).
// fijas (opcional): palabras sin seña, como "de". Se ven entre los espacios
// pero no son un espacio, no están en el banco ni en el visor, y la respuesta
// se sigue evaluando solo con las señas. En "elegir" las opciones ya las
// traen escritas.
const ItemFraseSenas = ({
  item,
  idx,
  total,
  vidasGlobales,
  onCorrecto,
  onPerderVida,
  onSalir,
}) => {
  const armar = item.modo === "armar";
  const n = item.secuencia.length;
  const [actual, setActual] = useState(0); // seña que muestra el visor
  const [slots, setSlots] = useState(() => Array(n).fill(null)); // "armar"
  const [seleccionado, setSelec] = useState(null); // "elegir"
  const [confirmado, setConf] = useState(false);

  // En "armar" cada espacio guarda el índice de una palabra del banco
  const usadas = new Set(slots.filter((s) => s !== null));
  const completo = armar
    ? slots.every((s) => s !== null)
    : seleccionado !== null;
  const esCorrecta = armar
    ? slots.every((s, i) => s !== null && item.banco[s] === item.palabras[i])
    : seleccionado === item.correcta;
  const fijas = item.fijas ?? {};
  // Todos los espacios en una fila: ancho útil (padding 20 por lado) menos
  // los gaps de 8 de palabraGifsRow, con un máximo de 120. Cada palabra fija
  // ocupa su texto (~9 px por letra) más un gap.
  const anchoFijas = Object.values(fijas).reduce(
    (total, fija) => total + fija.length * 9 + 8,
    0,
  );
  const anchoSlot = Math.min(
    120,
    Math.floor((SCREEN_WIDTH - 40 - anchoFijas - 8 * (n - 1)) / n),
  );

  const tapPalabra = (bancoIdx) => {
    if (confirmado || usadas.has(bancoIdx)) return;
    const primerVacio = slots.findIndex((s) => s === null);
    if (primerVacio === -1) return;
    const nuevo = [...slots];
    nuevo[primerVacio] = bancoIdx;
    setSlots(nuevo);
    // El visor pasa solo a la seña del siguiente espacio vacío
    const siguienteVacio = nuevo.findIndex((s) => s === null);
    if (siguienteVacio !== -1) setActual(siguienteVacio);
  };

  const tapSlot = (slotIdx) => {
    if (confirmado || slots[slotIdx] === null) return;
    const nuevo = [...slots];
    nuevo[slotIdx] = null;
    setSlots(nuevo);
    setActual(slotIdx); // se ve la seña del espacio que se vació
  };

  const confirmar = () => {
    if (!completo) return;
    setConf(true);
    if (!esCorrecta) onPerderVida();
  };
  const siguiente = () => {
    if (esCorrecta) {
      onCorrecto();
      return;
    }
    setSlots(Array(n).fill(null));
    setSelec(null);
    setConf(false);
    if (armar) setActual(0);
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
          <Text style={styles.itemCardTitulo}>Mirá bien las señas</Text>
          <Text style={styles.itemCardSub}>
            {armar ? "Armá la frase que ves" : "¿Qué frase es esta?"}
          </Text>
        </View>

        <VisorFrase
          secuencia={item.secuencia}
          actual={actual}
          onCambiar={setActual}
        />

        {armar ? (
          <>
            <View style={styles.palabraGifsRow}>
              {slots.map((s, i) => (
                <Fragment key={i}>
                  {fijas[i] ? (
                    <Text style={styles.fraseFija}>{fijas[i]}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.palabraSlot,
                      { width: anchoSlot, paddingHorizontal: 4 },
                      s !== null && styles.palabraSlotLleno,
                      i === actual && !confirmado && styles.fraseSlotActual,
                      confirmado && esCorrecta && styles.palabraSlotCorrecto,
                      confirmado && !esCorrecta && styles.palabraSlotError,
                    ]}
                    onPress={() => tapSlot(i)}
                  >
                    <Text
                      style={[styles.palabraSlotLetra, styles.fraseSlotTxt]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {s !== null ? item.banco[s] : ""}
                    </Text>
                  </TouchableOpacity>
                </Fragment>
              ))}
              {fijas[n] ? (
                <Text style={styles.fraseFija}>{fijas[n]}</Text>
              ) : null}
            </View>

            <Text style={styles.letrasDisponiblesLabel}>
              Palabras disponibles
            </Text>
            <View style={styles.letrasDisponiblesGrid}>
              {item.banco.map((palabra, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.letraBtn,
                    styles.frasePalabraBtn,
                    usadas.has(i) && styles.letraBtnUsada,
                  ]}
                  onPress={() => tapPalabra(i)}
                  activeOpacity={usadas.has(i) ? 1 : 0.7}
                >
                  <Text
                    style={[
                      styles.letraBtnTxt,
                      usadas.has(i) && styles.letraBtnTxtUsada,
                    ]}
                  >
                    {palabra}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
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
                <Text style={styles.opcionLetra}>
                  {["A", "B", "C", "D"][i]}
                </Text>
                <Text style={styles.opcionTxt}>{op}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
              : `Incorrecto ❌ — La frase es: ${textoDeFrase(item)}`}
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

// inicio: { indice, errores } para seguir una lección a medias (o null).
// onAvance({ indice, errores }): avisa por dónde va, para guardarlo.
const PantallaEjercicioNueva = ({
  leccion,
  vidasGlobales,
  onTerminar,
  onPerderVida,
  inicio,
  onAvance,
}) => {
  const [idx, setIdx] = useState(inicio?.indice ?? 0);
  // Vidas perdidas en este intento: arranca en 0 al empezar la lección y en
  // lo guardado al continuarla. Una respuesta mal cuenta aunque después se
  // acierte al reintentar.
  const [errores, setErrores] = useState(inicio?.errores ?? 0);
  const items = leccion.items;
  const total = items.length;
  const item = items[idx];

  const avanzar = () => {
    if (idx + 1 >= total)
      onTerminar({ completada: true, xp: leccion.xp, errores });
    else {
      setIdx((i) => i + 1);
      onAvance?.({ indice: idx + 1, errores });
    }
  };
  const salir = () => onTerminar({ completada: false });
  const perderVida = () => {
    setErrores((n) => n + 1);
    onPerderVida();
    // El error también se guarda, aunque sea en el primer ítem: si no, salir
    // y volver lo borraría (y así se podría conseguir "Lección perfecta")
    onAvance?.({ indice: idx, errores: errores + 1 });
  };

  const common = {
    idx,
    total,
    vidasGlobales,
    onCorrecto: avanzar,
    onPerderVida: perderVida,
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
  if (item.tipo === "frase_senas")
    return <ItemFraseSenas key={idx} item={item} {...common} />;
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

// xpGanado: el XP que sumó esa lección. En un repaso es 0 y no se muestra.
const ModalResultado = ({ visible, xpGanado, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { alignItems: "center" }]}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>🏆</Text>
        <Text style={styles.modalNombre}>¡Lección completada!</Text>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>
          Respondiste todas las preguntas correctamente
        </Text>
        {xpGanado > 0 && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeTxt}>+{xpGanado} XP</Text>
          </View>
        )}
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

const MenuPerfil = ({ visible, onClose, onVerTutorial }) => {
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
                onVerTutorial();
              }}
            >
              <Text style={styles.menuItemIcono}>📖</Text>
              <Text style={styles.menuItemTxt}>Tutorial</Text>
              <Text style={styles.menuItemFlecha}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                onClose();
                // 1) avisarle a la API que esta sesión se cierra. Si falla
                //    (sin internet, endpoint caído), el logout local sigue igual.
                try {
                  const sesionId = await obtenerSesionId();
                  await cerrarSesionRemota(sesionId);
                } catch (e) {
                  console.log("No se pudo cerrar la sesión remota:", e);
                }
                // 2) borrar usuario + sesion_id de AsyncStorage. OJO: no se
                //    tocan progreso_<uid>, vidas_<uid> ni
                //    leccion_en_curso_<uid>, que son por usuario y tienen que
                //    sobrevivir al logout.
                await cerrarSesion();
                // 3) recién ahora, al login
                router.replace("/LoginScreen");
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

// Emojis de la pastilla del nivel actual, en el header del mapa
const EMOJI_NIVEL_EN_CURSO = "📚";
const EMOJI_TODO_COMPLETO = "🏆";

// Ítems que solo se miran, sin respuesta: una lección que tiene solo estos no
// cuenta para el logro "Lección perfecta"
const ITEMS_SIN_RESPUESTA = ["ensenanza", "ensenanza_palabra", "motivacion"];

// Pantalla de carga de la app: al entrar ("Cargando tu progreso...") y al
// abrir una lección ("Cargando lección...")
const PantallaCargando = ({ texto }) => (
  <SafeAreaView
    style={[
      styles.container,
      { justifyContent: "center", alignItems: "center" },
    ]}
    edges={["top", "left", "right"]}
  >
    <Text style={{ fontSize: 32 }}>🤟</Text>
    <Text style={{ fontSize: 14, color: "#888", marginTop: 8 }}>{texto}</Text>
  </SafeAreaView>
);

export default function HomeScreen() {
  // ── datos persistentes ──
  const [userId, setUserId] = useState(null);
  const [progreso, setProgreso] = useState({ leccionesCompletadas: {} });
  const [vidasData, setVidasData] = useState({ vidas: 3, proximaRegen: null });
  const [cargando, setCargando] = useState(true);

  // ── estado del mapa ──
  const [modalNivelVisible, setModalNivelVisible] = useState(false);
  const [menuPerfilVisible, setMenuPerfilVisible] = useState(false);
  const [modalSinVidas, setModalSinVidas] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  // ── tutorial: solo para cuentas nuevas, o desde el menú 👤 ──
  // clave = email de la sesión (es la que deja el registro)
  const [tutorial, setTutorial] = useState({
    visible: false,
    desdeMenu: false,
    clave: null,
  });
  const [nombreUsuario, setNombreUsuario] = useState("");

  // ── foto del botón de perfil (components/AvatarUsuario.jsx) ──
  // fotoApi: el campo foto del usuario de la sesión. versionFoto: la de
  // services/fotoPerfil.js, que cambia al guardar o quitar la foto. Se
  // revisan cada vez que el mapa vuelve a estar en pantalla.
  const [fotoApi, setFotoApi] = useState(null);
  const [versionFoto, setVersionFoto] = useState(0);

  // ── estado del nivel abierto ──
  const [nivelAbierto, setNivelAbierto] = useState(null);
  const [leccionActiva, setLeccionActiva] = useState(null);
  const [modalResultadoVisible, setModalResultado] = useState(false);
  const [xpUltimaLeccion, setXpUltimaLeccion] = useState(0);

  // ── lecciones a medias ──
  // Copia en memoria de leccion_en_curso_<uid>: "<nivelId>_<leccionId>" →
  // { indice, total, errores, firma }. Se carga con la cuenta y cambia junto
  // con cada guardado o borrado.
  const [enCurso, setEnCurso] = useState({});
  // Cartel "Tenés esta lección a medias": { leccion, indice, total } o null
  const [cartelEnCurso, setCartelEnCurso] = useState(null);

  // ── GIFs de la lección que se abre (ver abrirLeccion) ──
  // Mientras bajan los primeros se ve "Cargando lección...". precargaRef es
  // la precarga de la lección abierta (se cancela al cerrarla); aperturaRef
  // cuenta las aperturas, para no abrir una que ya no corresponde (por
  // ejemplo, si cambió la cuenta mientras cargaba).
  const [cargandoLeccion, setCargandoLeccion] = useState(false);
  const precargaRef = useRef(null);
  const aperturaRef = useRef(0);

  // ── regeneración de vidas (timer) ──
  const regenTimerRef = useRef(null);
  // El interval de regeneración se crea una sola vez, así que su closure
  // congelaría el userId inicial (null). Por eso el id vive además en un ref,
  // que siempre devuelve el valor actual.
  const userIdRef = useRef(null);
  // Último xpTotal conocido del servidor: arranca con el de la sesión y se
  // actualiza con cada respuesta de completarLeccion. Sirve para avisar si
  // una lección se completó pero el XP no subió.
  const xpTotalRef = useRef(null);

  // ── carga inicial: primero la sesión, después los datos de ESE usuario ──
  // ── ACA SACAMOS CARGA INICIAL POR QUE NOS DABA EL ERROR DEL PROGRESO ──

  // ── carga: cada vez que el mapa vuelve a estar en pantalla ──
  // Las pestañas no se cierran al cambiar de una a otra, así que la sesión
  // se revisa al volver del login o al cambiar de usuario.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const usuario = await obtenerSesion();

        // Sin sesión → al login
        if (!usuario || usuario.id == null) {
          userIdRef.current = null;
          setUserId(null);
          router.replace("/LoginScreen");
          return;
        }

        const uid = String(usuario.id);

        // El nombre y la foto del botón de perfil (AvatarUsuario) se revisan
        // en CADA foco, también si es el mismo usuario: si se cambiaron en el
        // Perfil, se ven al volver. Si no cambiaron, quedan los mismos
        // valores y la foto no se toca.
        setNombreUsuario(usuario.nombre ?? "");
        setFotoApi(usuario.foto ?? null);
        setVersionFoto(versionFotoPerfil(uid));

        // Mismo usuario que ya está cargado → no hace falta pedir todo de nuevo
        if (uid === userIdRef.current) return;

        userIdRef.current = uid;
        xpTotalRef.current = usuario.xpTotal ?? null;
        setCargando(true);
        setUserId(uid);
        setNivelAbierto(null);
        setLeccionActiva(null);
        setEnCurso({});
        setCartelEnCurso(null);
        setModalResultado(false); // el resultado era de la cuenta anterior
        // Si se estaba abriendo una lección, ya no se abre
        aperturaRef.current++;
        precargaRef.current?.cancelar();
        setCargandoLeccion(false);

        const { progreso: p, vidas: v } = await cargarDatos(uid);
        const todasEnCurso = await obtenerTodasEnCurso(uid);
        if (userIdRef.current !== uid) return; // cambió el usuario mientras cargaba
        setProgreso(p);
        setVidasData(v);
        setEnCurso(
          limpiarEnCurso(uid, todasEnCurso, p.leccionesCompletadas || {}),
        );
        setCargando(false);

        // Cuenta recién creada (el registro dejó la marca): el tutorial se
        // abre ahora, con el progreso ya cargado
        if (await tutorialPendiente(usuario.email)) {
          if (userIdRef.current !== uid) return;
          setTutorial({
            visible: true,
            desdeMenu: false,
            clave: usuario.email,
          });
        }
      })();
    }, []),
  );

  // chequear regeneración cada 30 segundos
  useEffect(() => {
    regenTimerRef.current = setInterval(() => {
      const uid = userIdRef.current; // valor actual, no el del closure inicial
      setVidasData((prev) => {
        const actualizado = checkRegenVidas(prev);
        if (actualizado.vidas !== prev.vidas) {
          guardarVidas(uid, actualizado);
          return actualizado;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(regenTimerRef.current);
  }, []);

  // ── helpers de progreso ──
  const leccionesComp = progreso.leccionesCompletadas;

  const marcarLeccionCompleta = useCallback(
    (nivelId, leccionId, xp) => {
      // Repaso de una lección ya completada: no se marca de nuevo ni suma XP.
      // Se decide con el estado actual, no con lo que calcula el updater.
      const actuales = progreso.leccionesCompletadas[nivelId] || [];
      if (actuales.includes(leccionId)) return;

      // Sin un xp válido no se llama a la API (mandarlo vacío hacía que la API
      // sumara 0 sin avisar). Tampoco se marca en el celular, para que no
      // quede distinto del servidor.
      if (!Number.isFinite(xp)) {
        console.warn(
          "[XP] xp inválido: no se marcó la lección ni se llamó a completarLeccion. Revisá el xp de esa lección en NIVELES.",
          { nivel: nivelId, leccion: leccionId, xp },
        );
        return;
      }

      const uid = userIdRef.current;

      // El updater es puro: solo calcula el estado nuevo. La caché y la API
      // van afuera, una sola vez.
      setProgreso((prev) => agregarLeccion(prev, nivelId, leccionId));
      AsyncStorage.setItem(
        KEYS.progreso(uid),
        JSON.stringify(agregarLeccion(progreso, nivelId, leccionId)),
      ).catch(() => {});

      // Este endpoint marca la lección Y suma el XP en una sola llamada.
      // Su respuesta trae el xpTotal nuevo: si no subió, se avisa.
      const xpAntes = xpTotalRef.current;
      completarLeccion(uid, { nivel: nivelId, leccion: leccionId, xp }).then(
        (res) => {
          if (!res.ok) {
            console.log("No se pudo completar la lección:", res.error);
            return;
          }
          const xpDespues = res.data?.xpTotal;
          const subio =
            Number.isFinite(xpDespues) &&
            (xpAntes == null || xpDespues > xpAntes);
          if (!subio) {
            console.warn(
              "[XP] completarLeccion respondió ok pero el xpTotal no subió.",
              {
                nivel: nivelId,
                leccion: leccionId,
                xp,
                antes: xpAntes,
                despues: xpDespues,
                yaEstaba: res.data?.yaEstaba,
              },
            );
          }
          if (Number.isFinite(xpDespues)) xpTotalRef.current = xpDespues;
        },
      );
    },
    [progreso],
  );

  const handlePerderVida = useCallback(() => {
    setVidasData((prev) => {
      const nuevo = perderUnaVida(prev);
      guardarVidas(userIdRef.current, nuevo);
      return nuevo;
    });
  }, []);

  // ── helpers de lecciones a medias (memoria + celular, nunca la API) ──
  const guardarAvance = useCallback((nivelId, leccionId, datos) => {
    const clave = claveLeccionEnCurso(nivelId, leccionId);
    setEnCurso((prev) => ({ ...prev, [clave]: datos }));
    guardarLeccionEnCurso(userIdRef.current, nivelId, leccionId, datos);
  }, []);

  const borrarAvance = useCallback((nivelId, leccionId) => {
    const clave = claveLeccionEnCurso(nivelId, leccionId);
    setEnCurso((prev) => {
      if (prev[clave] === undefined) return prev;
      const resto = { ...prev };
      delete resto[clave];
      return resto;
    });
    borrarLeccionEnCurso(userIdRef.current, nivelId, leccionId);
  }, []);

  // Cada vez que se pasa al ítem siguiente (o se pierde una vida). Los repasos
  // de lecciones completadas no se guardan: empiezan siempre de cero.
  const handleAvanceLeccion = useCallback(
    ({ indice, errores }) => {
      if (!nivelAbierto || !leccionActiva?.items) return;
      const completadas = progreso.leccionesCompletadas[nivelAbierto.id] || [];
      if (completadas.includes(leccionActiva.id)) return;
      guardarAvance(nivelAbierto.id, leccionActiva.id, {
        indice,
        total: leccionActiva.items.length,
        errores,
        firma: firmaDeLeccion(leccionActiva),
      });
    },
    [nivelAbierto, leccionActiva, progreso, guardarAvance],
  );

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

  // Abre una lección desde el ítem `desde` (0, o el guardado al continuar):
  // espera solo los 3 primeros GIFs, con un tope de 8 s para no trabar la
  // lección si la red está lenta, y recién ahí la abre. El resto se baja en
  // segundo plano mientras se avanza (efecto de abajo).
  const abrirLeccion = useCallback(async (leccion, desde) => {
    const apertura = ++aperturaRef.current;
    precargaRef.current?.cancelar();
    const precarga = crearPrecarga(linksDeLeccion(leccion, desde));
    precargaRef.current = precarga;
    setCargandoLeccion(true);
    await precarga.listaParaAbrir;
    if (aperturaRef.current !== apertura) return; // ya no corresponde
    setCargandoLeccion(false);
    setLeccionActiva(leccion);
  }, []);

  // Con la lección abierta, el resto de sus GIFs se baja de a 2 y en orden.
  // Al cerrarla (salir, terminar, quedarse sin vidas, cambiar de cuenta) se
  // deja de bajar.
  useEffect(() => {
    if (!leccionActiva) return;
    const precarga = precargaRef.current;
    precarga?.seguirEnSegundoPlano();
    return () => precarga?.cancelar();
  }, [leccionActiva]);

  const handleIrLeccion = useCallback(
    (leccion) => {
      if (vidasData.vidas === 0) {
        setModalSinVidas(true);
        return;
      }
      const nivelId = nivelAbierto.id;
      const revision = revisarAvance(
        leccion,
        enCurso[claveLeccionEnCurso(nivelId, leccion.id)],
      );
      if (revision) {
        const completada = (
          progreso.leccionesCompletadas[nivelId] || []
        ).includes(leccion.id);
        if (!completada && revision.valido) {
          // A medias: se pregunta si sigue o empieza de nuevo
          setCartelEnCurso({
            leccion,
            indice: revision.indice,
            total: revision.total,
          });
          return;
        }
        // Completada (repaso, de cero) o ya no coincide con la lección
        if (!completada)
          avisarAvanceDescartado(nivelId, leccion.id, revision.motivo);
        borrarAvance(nivelId, leccion.id);
      }
      abrirLeccion(leccion, 0);
    },
    [
      vidasData.vidas,
      nivelAbierto,
      enCurso,
      progreso,
      borrarAvance,
      abrirLeccion,
    ],
  );

  // ── cartel "Tenés esta lección a medias" ──
  // Sin vidas se comporta igual que al querer entrar a cualquier lección (y
  // no se borra nada)
  const continuarLeccion = () => {
    if (!cartelEnCurso) return;
    setCartelEnCurso(null);
    if (vidasData.vidas === 0) {
      setModalSinVidas(true);
      return;
    }
    // Abre en el ítem guardado: lo toma de enCurso (ver avanceParaSeguir), y
    // los GIFs se precargan desde ese ítem
    abrirLeccion(cartelEnCurso.leccion, cartelEnCurso.indice);
  };

  const empezarDeNuevo = () => {
    if (!cartelEnCurso) return;
    setCartelEnCurso(null);
    if (vidasData.vidas === 0) {
      setModalSinVidas(true);
      return;
    }
    borrarAvance(nivelAbierto.id, cartelEnCurso.leccion.id);
    abrirLeccion(cartelEnCurso.leccion, 0);
  };

  // ── handlers ejercicio ──
  // Al terminar se vuelve a la lista y ahí aparece ModalResultado (en la
  // pantalla del ejercicio no está: se cierra en este mismo render).
  const handleTerminarEjercicio = useCallback(
    ({ completada, xp, errores }) => {
      if (completada && leccionActiva && nivelAbierto) {
        // Un repaso no suma XP (ver marcarLeccionCompleta): el cartel no
        // muestra el "+XP"
        const esRepaso = (
          progreso.leccionesCompletadas[nivelAbierto.id] || []
        ).includes(leccionActiva.id);
        setXpUltimaLeccion(esRepaso ? 0 : xp);
        setModalResultado(true);
        marcarLeccionCompleta(nivelAbierto.id, leccionActiva.id, xp);
        // Terminada: ya no queda nada para continuar
        borrarAvance(nivelAbierto.id, leccionActiva.id);

        // Lección perfecta: terminada sin perder ninguna vida y con al menos
        // un ejercicio. También vale al repetir una lección ya completada.
        const tieneEjercicios = (leccionActiva.items || []).some(
          (item) => !ITEMS_SIN_RESPUESTA.includes(item.tipo),
        );
        if (errores === 0 && tieneEjercicios)
          guardarLogro(userIdRef.current, "leccion_perfecta");
      }
      setLeccionActiva(null);
    },
    [
      leccionActiva,
      nivelAbierto,
      progreso,
      marcarLeccionCompleta,
      borrarAvance,
    ],
  );

  // ── handlers tutorial ──
  const abrirTutorialDesdeMenu = () =>
    setTutorial({ visible: true, desdeMenu: true, clave: null });

  // Recién al terminarlo u omitirlo deja de estar pendiente; si se cierra la
  // app en la mitad, vuelve a aparecer. Abierto desde el menú no toca la marca.
  // Se cierra sin borrar desdeMenu: así el texto no cambia durante el fade.
  const cerrarTutorial = () => {
    if (!tutorial.desdeMenu) marcarTutorialVisto(tutorial.clave);
    setTutorial((t) => ({ ...t, visible: false }));
  };

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

  // Avance guardado con el que se puede seguir una lección: { indice, total,
  // errores } o null. Las completadas no tienen: se repasan de cero.
  const avanceParaSeguir = (nivel, leccion) => {
    if ((leccionesComp[nivel.id] || []).includes(leccion.id)) return null;
    const revision = revisarAvance(
      leccion,
      enCurso[claveLeccionEnCurso(nivel.id, leccion.id)],
    );
    return revision?.valido ? revision : null;
  };

  const posiciones = NIVELES.map((_, i) => getPosition(i));
  const alturaMapa = getTotalHeight(NIVELES.length);

  // Nivel por el que va el usuario (pastilla del header del mapa): el primero
  // "actual"; si están todos completos, el último completado. El último ?? es
  // solo para que el header no se rompa si NIVELES cambia de forma rara.
  const estadosNiveles = NIVELES.map((nivel) => ({
    nivel,
    estado: getNivelEstado(nivel, leccionesComp),
  }));
  const completados = estadosNiveles.filter((n) => n.estado === "completado");
  const nivelActual =
    estadosNiveles.find((n) => n.estado === "actual") ??
    completados[completados.length - 1] ??
    estadosNiveles[0];

  if (cargando || !userId) {
    return <PantallaCargando texto="Cargando tu progreso..." />;
  }

  // Bajando los primeros GIFs de la lección que se va a abrir
  if (cargandoLeccion) {
    return <PantallaCargando texto="Cargando lección..." />;
  }

  // ══ RENDER: ejercicio ══
  if (nivelAbierto && leccionActiva) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#fff" }}
        edges={["top", "left", "right"]}
      >
        {vidasData.vidas === 0 ? (
          <ModalSinVidas
            visible={true}
            proximaRegen={vidasData.proximaRegen}
            onClose={() => {
              setLeccionActiva(null);
            }}
          />
        ) : leccionActiva.items ? (
          <PantallaEjercicioNueva
            leccion={leccionActiva}
            vidasGlobales={vidasData.vidas}
            onTerminar={handleTerminarEjercicio}
            onPerderVida={handlePerderVida}
            // Solo se usa al montarse: "Continuar" abre en lo guardado,
            // "Empezar de nuevo" ya lo borró y arranca de cero
            inicio={avanceParaSeguir(nivelAbierto, leccionActiva)}
            onAvance={handleAvanceLeccion}
          />
        ) : (
          <PantallaEjercicio
            leccion={leccionActiva}
            vidasGlobales={vidasData.vidas}
            onTerminar={handleTerminarEjercicio}
            onPerderVida={handlePerderVida}
          />
        )}
      </SafeAreaView>
    );
  }

  // ══ RENDER: lista lecciones ══
  if (nivelAbierto) {
    const completadas = completadasDelNivel.length;
    const total = nivelAbierto.lecciones.length;
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.nivelHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setNivelAbierto(null)}
          >
            <Text style={styles.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.nivelHeaderCenter}>
            <Text style={styles.nivelHeaderLabel}>
              Nivel {toRomano(numeroDeNivel(nivelAbierto))}
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
                avance={
                  bloqueada ? null : avanceParaSeguir(nivelAbierto, leccion)
                }
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

        {/* Al terminar una lección se vuelve acá: el resultado aparece en ese
            momento y se cierra con su "Continuar" */}
        <ModalResultado
          visible={modalResultadoVisible}
          xpGanado={xpUltimaLeccion}
          onClose={() => setModalResultado(false)}
        />
        <CartelLeccionEnCurso
          cartel={cartelEnCurso}
          onContinuar={continuarLeccion}
          onEmpezarDeNuevo={empezarDeNuevo}
          onCancelar={() => setCartelEnCurso(null)}
        />
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        {/* Nivel por el que va el usuario: al tocarlo abre el modal del nivel */}
        <TouchableOpacity
          style={styles.nivelActualContainer}
          onPress={() =>
            handleNivelPress(nivelActual.nivel, nivelActual.estado)
          }
          activeOpacity={0.8}
        >
          <Text style={styles.nivelActualEmoji}>
            {nivelActual.estado === "completado"
              ? EMOJI_TODO_COMPLETO
              : EMOJI_NIVEL_EN_CURSO}
          </Text>
          <Text style={styles.nivelActualTxt}>
            Nivel {toRomano(numeroDeNivel(nivelActual.nivel))}
          </Text>
        </TouchableOpacity>
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
          accessibilityRole="button"
          accessibilityLabel="Menú de perfil"
        >
          {/* 34 px dentro del círculo blanco de 40: queda un borde de 3 px */}
          <AvatarUsuario
            uid={userId}
            nombre={nombreUsuario}
            fotoApi={fotoApi}
            tamano={34}
            version={versionFoto}
          />
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
        onVerTutorial={abrirTutorialDesdeMenu}
      />
      <ModalSinVidas
        visible={modalSinVidas}
        proximaRegen={vidasData.proximaRegen}
        onClose={() => setModalSinVidas(false)}
      />
      <Tutorial
        visible={tutorial.visible}
        nombre={nombreUsuario}
        desdeMenu={tutorial.desdeMenu}
        onCerrar={cerrarTutorial}
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
  nivelActualContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  nivelActualEmoji: { fontSize: 18 },
  nivelActualTxt: { fontSize: 16, fontWeight: "bold", color: "#333" },
  vidasMapaWrap: { flexDirection: "row", gap: 2 },
  perfilBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

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
  modalBotonSecundario: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#C8D3F5",
  },
  modalBotonSecundarioTexto: { color: "#3D4FBB" },
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
  // Lección a medias: barrita fina, etiqueta dorada y "Continuar"
  leccionAvanceFondo: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
    marginBottom: 6,
  },
  leccionAvanceRelleno: {
    height: "100%",
    backgroundColor: "#F5CE5A",
    borderRadius: 2,
  },
  leccionPie: { flexDirection: "row", alignItems: "center", gap: 8 },
  leccionEtiqueta: {
    backgroundColor: "#FFF8E1",
    borderColor: "#F5CE5A",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  leccionEtiquetaTxt: { fontSize: 11, fontWeight: "700", color: "#5A3E00" },
  leccionContinuarTxt: { fontSize: 13, fontWeight: "700" },

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

  // ── Frases en señas: visor (flechas y chips), espacios y banco ──
  fraseNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: -6,
    marginBottom: 18,
  },
  fraseFlecha: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF1FB",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  fraseFlechaOff: { backgroundColor: "#F5F5F5", borderColor: "#E8E8E8" },
  fraseFlechaTxt: {
    fontSize: 26,
    color: "#3D4FBB",
    fontWeight: "300",
    lineHeight: 30,
  },
  fraseFlechaTxtOff: { color: "#CCCCCC" },
  fraseChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF1FB",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  fraseChipActivo: { backgroundColor: "#3D4FBB", borderColor: "#3D4FBB" },
  fraseChipTxt: { fontSize: 14, fontWeight: "700", color: "#3D4FBB" },
  fraseChipTxtActivo: { color: "#fff" },
  // Espacio de la seña que se está viendo
  fraseSlotActual: { borderColor: "#E8A000" },
  fraseSlotTxt: { fontSize: 15 },
  // Palabra fija sin seña ("de"): texto gris entre los espacios
  fraseFija: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    alignSelf: "center",
  },
  // letraBtn tiene ancho fijo para una letra: las palabras usan su ancho
  frasePalabraBtn: { width: "auto", minWidth: 40, paddingHorizontal: 14 },

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
