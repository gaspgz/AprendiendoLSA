---
name: aprendiendo-lsa
description: Contexto completo del proyecto "Aprendiendo LSA", una app móvil React Native / Expo para aprender Lengua de Señas Argentina con gamificación estilo Duolingo. Usar este skill siempre que el usuario mencione LSA, Aprendiendo LSA, la app de señas, el proyecto escolar de Bialik, o cuando haga preguntas de código relacionadas con React Native, Expo Router, GIFs de señas (SenaGif, docs/gifs_nube.json), sistema de vidas, MockAPI, o cualquier pantalla (HomeScreen, SenasScreen, ProfileScreen, LoginScreen, CustomTabBar) del proyecto. También activar cuando el usuario mencione a "Cambiando miradas", el sistema de progreso de lecciones, o el reconocimiento de señas con cámara.
---

# Proyecto Aprendiendo LSA — Contexto completo

## ¿Qué es este proyecto?
App móvil en React Native / Expo para aprender **Lengua de Señas Argentina (LSA)** con enfoque gamificado estilo Duolingo. Proyecto escolar de la **Escuela Bialik**, guiado por un profesor. El contenido de señas está validado por **"Cambiando miradas"**, organización de la comunidad sorda.

**Sensibilidad cultural clave:** la app es explícitamente anti-apropiación cultural. Nunca sugerir contenido de señas sin pasar por validación de la comunidad sorda.

---

## Equipo
- **3 personas:** 1 backend, 1 frontend, 1 director (Gorelik) que ayuda en ambas áreas.
- El profesor proveerá la base de datos real más adelante (por ahora se usa MockAPI).

---

## Stack técnico
| Capa | Tecnología |
|------|-----------|
| Framework | React Native + Expo |
| Navegación | Expo Router (carpeta `app/`) |
| Backend temporal | MockAPI (fake REST API) |
| Persistencia local | AsyncStorage (`@react-native-async-storage/async-storage`) |
| GIFs de señas | En la API del curso, no en el proyecto (no videos: son demasiado pesados). Se muestran con `<SenaGif>` (expo-image, quedan en la caché del celular) |
| Auth | MockAPI por ahora, base de datos real pendiente |

---

## Estructura de archivos clave
```
app/
  (tabs)/
    _layout.tsx        ← Tab layout con CustomTabBar, SIN el tab bar default de Expo
    index.jsx          ← HomeScreen + NivelScreen + PantallaEjercicio (TODO en uno)
    senas.jsx          ← Re-exporta SenasScreen
    perfil.jsx         ← Re-exporta ProfileScreen
  login.jsx
  registro.jsx

components/
  CustomTabBar.jsx     ← Tab bar personalizado (reemplaza el de Expo)
  SenasScreen.jsx      ← Diccionario de señas con GIFs y buscador
  ProfileScreen.jsx    ← Perfil de usuario con stats y logros
  SenaGif.jsx          ← Muestra una seña desde su clave (GIF de la nube)

services/
  api.js               ← Todas las llamadas a MockAPI
  sesion.js            ← Guardar/leer/borrar sesión con AsyncStorage
  precargaSenas.js     ← Precarga los GIFs al abrir una lección

constants/
  gifsNube.js          ← Links de los GIFs. Lo genera scripts/generarGifs.js: NO editar a mano

docs/
  gifs_nube.json       ← Link de cada GIF de seña en la API, uno por clave

scripts/
  generarGifs.js       ← docs/gifs_nube.json → constants/gifsNube.js
  subir-senas.mjs      ← Sube a la API los GIFs de senas_listas/
```

---

## Reglas arquitectónicas — NUNCA violar

### 1. Navegación interna por estado React, NO por Expo Router
La transición mapa → lista de lecciones → ejercicio usa `useState` dentro de `index.jsx`. Expo Router solo cambia de tab.

```jsx
// ✅ CORRECTO
const [nivelAbierto, setNivelAbierto] = useState(null);
const [leccionActiva, setLeccionActiva] = useState(null);

// ❌ NUNCA hacer esto para ir al nivel
router.push('/nivel/2');
```

### 2. Las señas se muestran con `<SenaGif clave="..." />`
Los GIFs de las señas están en la API del curso, no en el proyecto. Para mostrar una seña se usa siempre `components/SenaGif.jsx` con su clave (la misma que usa NIVELES: `"A"`, `"CH"`, `"hola"`, `"n10"`...). La caja la define `style`, igual que antes con `<Image>`.

```jsx
// ✅ CORRECTO
import SenaGif from "../../components/SenaGif";

<SenaGif clave="A" style={styles.gifGrande} />
<SenaGif clave={item.gifPalabra} style={styles.gifOpcion} />

// ❌ NUNCA: GIFs en el proyecto ni links sueltos
require("../../assets/....gif");
<Image source={{ uri: "https://..." }} />
```

- Mientras carga muestra una ruedita en la caja; si falla, "No se pudo cargar la seña" y "Reintentar". expo-image la guarda en la caché del celular: cada GIF se baja una sola vez.
- Los links están en `docs/gifs_nube.json` y se pasan al código con `node scripts/generarGifs.js`, que genera `constants/gifsNube.js`. **`constants/gifsNube.js` no se edita a mano.**
- Las claves no se cambian nunca: las usan NIVELES, Señas y la firma de las lecciones a medias (cambiar una borra el avance guardado).
- Señas usa otros nombres para algunas señas (`Ch`, `Ll`, `1`…`1000`); la traducción a la clave está en un solo lugar: `CLAVE_EN_LA_APP` en `app/(tabs)/SenasScreen.jsx`.

### 3. Sombra + border radius en Android: dos capas
`elevation` y `overflow: 'hidden'` se cancelan en Android. Siempre dos Views anidados:

```jsx
// Capa exterior: solo elevation/sombra (sin overflow)
<View style={{ elevation: 12 }}>
  // Capa interior: borderRadius + overflow:hidden
  <View style={{ borderRadius: 20, overflow: 'hidden' }}>
    {contenido}
  </View>
</View>
```

### 4. _layout.tsx tiene backgroundColor "#C8D3F5" en el View raíz
Esto colorea la status bar (arriba) y home indicator (abajo) en iOS. No cambiar sin entender el impacto.

### 5. TextInput en iOS siempre con placeholderTextColor
Sin este prop el placeholder es invisible en iOS.
```jsx
<TextInput placeholderTextColor="#9CA3AF" ... />
```

---

## Sumar una seña nueva

0. **Antes que nada:** la seña tiene que estar validada por la comunidad sorda ("Cambiando miradas"). Nunca se suma una seña sin esa validación.
1. **Subir el GIF a la API.** El nombre del archivo es la clave de la seña: **sin tildes ni ñ** (por ejemplo `cunado.gif`, o `NN.gif` para la Ñ) y de hasta 5 MB. Con el script del equipo:
   - poner el archivo en `senas_listas/<categoria>/<clave>.gif`;
   - probar con `node --env-file=.env scripts/subir-senas.mjs` (solo muestra qué haría);
   - subir con `node --env-file=.env scripts/subir-senas.mjs --subir`.

   Si se vuelve a subir una seña que ya estaba, la API le da un **link nuevo**: hay que actualizarlo en el paso 2. Con el link viejo, los celulares que ya lo bajaron seguirían mostrando el GIF anterior.
2. **Agregar su entrada a `docs/gifs_nube.json`**, en `gifs` (una sola por clave, sin links repetidos). Los datos de la API (`clave`, `categoria`, `etiqueta`, `gif`, `id`) salen de la lista `GET https://ort.nilosolutions.com/api/lsa/senas`, la misma que lee `subir-senas.mjs`:
   ```json
   {
     "claveApp": "colores",
     "claveNube": "colores",
     "categoriaNube": "colores",
     "etiquetaNube": "colores",
     "gif": "https://ort.nilosolutions.com/api/lsa/uploads/xxxxxxxxxxxx.gif",
     "idNube": "xxxxxxxxxxxx",
     "estado": "nuevo",
     "diferencia": null,
     "bytes": 1234567
   }
   ```
   `estado` y `diferencia` vienen de la verificación de la migración (`identico` o `reexportado` contra el GIF local de antes); en una seña nueva van `"nuevo"` y `null`. `bytes` es el tamaño del GIF.
3. **Correr `node scripts/generarGifs.js`** parado en la carpeta del proyecto. Regenera `constants/gifsNube.js`; si una clave o un link están repetidos, o un link no es https, avisa y no escribe nada.
4. **Usar la clave:**
   - en **NIVELES** (`app/(tabs)/index.jsx`), en el campo del ítem: `letra`, `gifLetra`, `gifPalabra`, `opcionesLetras`, `opcionesGifs` o `secuencia`. Si se inventa otro campo para GIFs, sumarlo a `CAMPOS_GIF` (lo usan la precarga y la firma de la lección);
   - en **Señas** (`app/(tabs)/SenasScreen.jsx`), agregando el nombre y su título al `NOMBRES_*` de la categoría. Si en Señas se llama distinto que la clave, sumarlo a `CLAVE_EN_LA_APP`.

   Si una clave no tiene link, `SenaGif` avisa con `console.warn` y muestra "No se pudo cargar la seña".

---

## Sistema de vidas
- 3 vidas globales compartidas entre todos los niveles
- Se pierde 1 vida por cada respuesta incorrecta en cualquier ejercicio
- Regeneración: 1 vida cada 2 horas
- Con 0 vidas: bloqueado hasta regenerar al menos 1
- Persistido en AsyncStorage + TODO sincronizar con API

**Estructuras en AsyncStorage:**
```js
// Progreso de lecciones
{ leccionesCompletadas: { 1: [1, 2, 3], 2: [1] } }
// nivelId → array de leccionIds completadas

// Vidas
{ vidas: 2, proximaRegen: 1716000000000 } // timestamp ms
```

---

## Lógica de ejercicios (múltiple choice)
- Cada pregunta **debe responderse correctamente** antes de avanzar.
- Respuesta incorrecta → feedback rojo + pierde 1 vida global + botón "Reintentar esta pregunta".
- Lección completa **solo** cuando todas las preguntas son respondidas correctamente.
- Mínimo 4 ejercicios por lección.

---

## MockAPI — configuración
- URL base en `services/api.js` → constante `MOCKAPI_BASE`
- Resource `usuarios`: campos `id, nombre, email, password, racha, xpTotal`
- Auth simulada: buscar por email, comparar password en cliente (sin JWT real)
- Progreso y vidas en AsyncStorage con TODO comments marcando dónde enchufar la API real

---

## Paleta de colores
```
Primario lila:   #C8D3F5   (header, tab bar, botones principales)
Fondo app:       #EEF1FB
Dorado niveles:  #F5CE5A
Texto principal: #1A1A2E
Accent azul:     #3D4FBB
```

---

## Estado del desarrollo

### ✅ Frontend completo
- LoginScreen conectado a MockAPI
- HomeScreen con mapa de niveles dinámico (zigzag, estado computado desde progreso)
- NivelScreen dentro de index.jsx (lista de lecciones + ejercicios)
- SenasScreen con abecedario + presentaciones (GIFs reales), buscador con normalización de tildes, modal con navegación prev/next entre señas
- ProfileScreen con stats, logros, edición de nombre/email
- CustomTabBar personalizado (reemplaza el de Expo), con fixes para iOS y Android
- Sistema de vidas con countdown de regeneración
- GIFs de señas desde la API del curso con `SenaGif`; al abrir una lección se esperan los 3 primeros y el resto se baja en segundo plano

### 🔄 En progreso
- Integración completa con MockAPI para progreso y vidas
- Pantalla de Registro

### ⏳ Pendiente
- Base de datos real (la provee el profesor)
- Reconocimiento de señas con cámara (MediaPipe Holistic + clasificador propio)
- Traductor en tiempo real señas ↔ voz/texto (Fase 3)
- Más categorías de señas (números, familia, colores, acciones)
