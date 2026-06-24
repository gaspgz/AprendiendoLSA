---
name: aprendiendo-lsa-niveles
description: Estructura detallada del sistema de niveles, secciones y tipos de ejercicios del proyecto Aprendiendo LSA. Usar este skill siempre que se hable de implementar ejercicios, secciones, tipos de preguntas, el flujo de lección, o cuando se mencionen ejercicios de "elegí la seña", "qué letra es esta", "qué palabra está deletreando", múltiple choice con GIFs, o cualquier lógica de gamificación relacionada con los módulos de aprendizaje de la app.
---

# Sistema de Niveles — Aprendiendo LSA

## Jerarquía completa

```
NIVEL  (ej: Nivel 1 — Abecedario)
  └── SECCIÓN  (ej: Sección 1 — Letras A–E)
        └── 20 ITEMS por sección
              ├── GIFs de enseñanza (introducción)
              └── Ejercicios de práctica (distintos tipos)
```

---

## Ejemplo concreto: Nivel 1 — Abecedario

### Sección 1 → Letras A–E (20 items totales)

| Items | Tipo | Descripción |
|-------|------|-------------| TIPO 1
| 1–5 | GIFs de enseñanza | Se muestran los 5 GIFs de las letras A, B, C, D, E una por una, sin pregunta. El usuario simplemente las ve y las aprende antes de ser evaluado. |
| 6–10 | Ejercicio TIPO 2 | "Elegí la seña correcta" — dado el nombre de una letra, elegir cuál imagen/GIF es la seña correcta |
| 11–15 | Ejercicio TIPO 3 | "¿Qué letra es esta?" — dado un GIF/imagen de la seña, elegir cuál letra corresponde |
| 16–19 | Ejercicio TIPO 4 | "¿Qué palabra está deletreando?" — dada una secuencia de señas, identificar la palabra |

---

## Tipos de ejercicios definidos

### ⚫ TIPO 1 - GIFS de enseñanza

| 1–5 | GIFs de enseñanza | Se muestran los 5 GIFs de las letras una por una, sin pregunta. El usuario simplemente las ve y las aprende antes de ser evaluado. |

### 🟢 Tipo 2 — "Elegí la seña correcta"

El usuario ve el **nombre de una letra** (ej: "A") y debe elegir **cuál de 3 imágenes/GIFs** muestra la seña correcta.

```
Pregunta: "Elegí la seña correcta para la letra A"

Opciones visuales:
[ GIF_incorrecto ] [ GIF_incorrecto ] [ GIF_correcto ✓ ]

Feedback: ✅ CORRECTA  /  ❌ INCORRECTA
```

**Mecánica clave:**

- Las opciones son GIFs o imágenes de señas (no texto)
- 3 opciones siempre
- Una sola correcta
- Feedback inmediato verde/rojo

---

### 🔵 Tipo 3 — "¿Qué letra es esta?"

El usuario ve un **GIF o imagen de una seña** y debe elegir **cuál letra corresponde** entre opciones de texto.

```
Pregunta: "¿Qué letra es esta?"

[ GIF de la seña ]

Opciones de texto: [ B ]  [ h ]  [ w ]

Feedback: ✅ CORRECTA  /  ❌ INCORRECTA
```

**Mecánica clave:**

- El estímulo es visual (GIF/imagen), la respuesta es textual (letra)
- Es el inverso del Tipo 1
- Puede incluir letras visualmente similares como distractores

---

### 🟡 Tipo 4 — "¿Qué palabra está deletreando?"

El usuario ve una **secuencia de señas** (una por cada letra de la palabra) y debe identificar **qué palabra se está deletreando** eligiendo entre opciones de palabras completas.

```
Pregunta: "¿Qué palabra está deletreando?"

Secuencia de GIFs: [ b ] [ e ] [ b ] [ é ]
                  (señas de cada letra)

Opciones: ( bebé )  ( cada )  ( debe )

Nota: las letras se repiten intencionalmente para dificultar
```

**Mecánica clave:**

- Se muestran N GIFs en secuencia (uno por letra de la palabra)
- Las opciones son palabras completas, no letras sueltas
- Las palabras distractoras comparten letras con la correcta para dificultar
- Letras repetidas en la secuencia son intencionales (ej: "bebé" repite la B)

---

### 🟠 Tipo 6 — "Elegí la seña correcta" (para palabras)

**Aplica a Nivel 2 en adelante.** Es el inverso del Tipo 5 y el equivalente del Tipo 2 pero para vocabulario completo. El usuario ve el **nombre de una palabra** y debe elegir **cuál de 3 GIFs** muestra la seña correcta.

```
Pregunta: "Elegí la seña correcta para 'gracias'"

Opciones visuales:
[ GIF_incorrecto ] [ GIF_incorrecto ] [ GIF_correcto ✓ ]

Feedback: ✅ CORRECTA  /  ❌ INCORRECTA
```

**Mecánica clave:**

- Igual al Tipo 2 pero el enunciado es una palabra completa (no una letra)
- Las opciones son GIFs de señas de vocabulario (no dactilología)
- 3 opciones siempre, una sola correcta
- Los GIFs incorrectos son señas de palabras similares o del mismo nivel para dificultar

**Estructura de datos:**
```js
{ tipo: "elegir_sena_palabra", palabra: "gracias", opcionesGifs: [...], correcta: 2 }
```

---

### 🔴 Tipo 5 — "¿Cuál es esta palabra?" (escritura libre)

**Aplica a Nivel 2 en adelante.** El usuario ve el **GIF de una seña completa** (una palabra, no una letra del abecedario) y debe **escribir la respuesta** en un campo de texto libre.

```
Pregunta: "¿Cuál es esta palabra?"

[ GIF de la seña — ej: "hola", "gracias", "nombre" ]

Escribí la palabra aquí:
[ ________________________ ]

[ Confirmar ]

Feedback: ✅ CORRECTA  /  ❌ INCORRECTA
```

**Mecánica clave:**

- El estímulo es visual (GIF de una seña de vocabulario completo, no dactilológico)
- La respuesta es texto libre escrito por el usuario (no selección de opciones)
- La comparación es case-insensitive y sin tildes (ej: "Hola", "hola", "HOLA" son todas correctas)
- Es el tipo más difícil porque no hay opciones para guiarse
- Pensado para Nivel 2+ donde las señas son palabras/frases, no letras sueltas

---

## Estado de implementación

### ✅ Implementado actualmente

Solo existe **Tipo 0 — Múltiple choice de texto**: se muestra una pregunta en texto y 4 opciones también en texto. Es funcional pero no usa GIFs como opciones visuales.

```jsx
// Estructura actual en index.jsx a cambiar
{
  pregunta: "¿Cuál es la seña de la letra A?",
  opciones: ["Puño cerrado con pulgar al lado", "Mano abierta", ...],
  correcta: 0
}
```

### ⏳ Por implementar (por orden de prioridad)

1. **Fase introducción con GIFs** — los N items iniciales de cada sección son de visualización pura, sin pregunta
2. **Tipo 2** — opciones visuales (GIFs) en lugar de texto
3. **Tipo 3** — estímulo visual (GIF) + opciones de texto (letras)
4. **Tipo 4** — secuencia de GIFs + opciones de palabras completas
5. **Tipo 5** — GIF de una seña completa + campo de escritura libre (Nivel 2+)
6. **Tipo 6** — nombre de una palabra + elegir el GIF correcto entre 3 opciones (Nivel 2+)

---

## Estructura de datos planificada

### Sección (reemplazará a "lección" en el futuro)

```js
{
  id: 1,
  titulo: "Letras A–E",
  letras: ["A", "B", "C", "D", "E"],  // las letras que cubre esta sección
  xp: 50,
  items: [
    // Items tipo GIF de enseñanza (sin pregunta)
    { tipo: "ensenanza", gifSource: GIFS["A"], letra: "A" },
    { tipo: "ensenanza", gifSource: GIFS["B"], letra: "B" },
    // ...

    // Items tipo ejercicio
    { tipo: "elegir_sena", letra: "A", opcionesGifs: [...], correcta: 2 },
    { tipo: "que_letra",   gifSource: GIFS["B"], opciones: ["B","h","w"], correcta: 0 },
    { tipo: "que_palabra", secuenciaGifs: [...], opciones: ["bebé","cada","debe"], correcta: 0 },

    // Tipo 5 — escritura libre (Nivel 2+)
    { tipo: "escritura_libre", gifSource: GIFS_PALABRAS["hola"], respuestaCorrecta: "hola" },
  ]
}
```

---

## Reglas de diseño pedagógico

- Cada sección cubre exactamente 5 letras (o unidades de vocabulario en otros niveles)
- Siempre empieza con la fase de enseñanza (GIFs sin presión) antes de evaluar
- El Tipo 3 usa palabras que comparten letras entre sí para forzar atención
- El orden dentro de la sección es fijo: enseñanza → Tipo 2 → Tipo 3 → Tipo 4 (el orden de Nivel 2+ con Tipo 5 está por definir)
- Las vidas y el sistema de "debe responder bien para avanzar" aplican igual a todos los tipos

---

## Niveles planificados (estructura general)

| Nivel | Tema                                 | Secciones estimadas      |
| ----- | ------------------------------------ | ------------------------ |
| 1     | Abecedario dactilológico (27 letras) | 6 secciones de ~5 letras |
| 2     | Presentaciones                       | Por definir              |
| 3     | Palabras basicas                     | Por definir              |
| 4     | Sentimientos                         | Por definir              |
| 5     | A DEFINIR CATEGORIA                  | Por definir              |

## | MAS NIVELES A DEFINIR MAS ADELANTE

## Lo que NO cambiar al implementar los nuevos tipos

- El sistema de vidas global (3 vidas, 2h de regeneración) aplica igual
- La regla de "debe responder correctamente para avanzar" aplica a todos los tipos
- La navegación sigue siendo por estado interno (no Expo Router)
- Los GIFs siguen siendo `require()` estático (no dinámico)
- El progreso se guarda como `{ leccionesCompletadas: { nivelId: [seccionId] } }` — mismo formato, solo cambia que la unidad ahora se llama "sección" en lugar de "lección"
