---
name: aprendiendo-lsa
description: Contexto completo del proyecto "Aprendiendo LSA", una app móvil React Native / Expo para aprender Lengua de Señas Argentina con gamificación estilo Duolingo. Usar este skill siempre que el usuario mencione LSA, Aprendiendo LSA, la app de señas, el proyecto escolar de Bialik, o cuando haga preguntas de código relacionadas con React Native, Expo Router, GIFs locales, sistema de vidas, MockAPI, o cualquier pantalla (HomeScreen, SenasScreen, ProfileScreen, LoginScreen, CustomTabBar) del proyecto. También activar cuando el usuario mencione a "Cambiando miradas", el sistema de progreso de lecciones, o el reconocimiento de señas con cámara.
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
| Assets | GIFs locales (no videos, demasiado pesados) |
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

services/
  api.js               ← Todas las llamadas a MockAPI
  sesion.js            ← Guardar/leer/borrar sesión con AsyncStorage

assets/
  gifs/
    abecedario/        ← A.gif, B.gif ... Z.gif, NN.gif (para la Ñ)
    presentaciones/    ← apellido.gif, comoestas.gif, etc.
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

### 2. GIFs siempre con require() estático
React Native no permite require() dinámico. Siempre declarar un objeto de mapeo con requires fijos.

```jsx
// ✅ CORRECTO
const GIFS = { A: require('../../assets/gifs/abecedario/A.gif') };
const src = GIFS[letra];

// ❌ NUNCA — crashea en RN
require(`../../assets/gifs/abecedario/${letra}.gif`);
```

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

### 🔄 En progreso
- Integración completa con MockAPI para progreso y vidas
- Pantalla de Registro

### ⏳ Pendiente
- Base de datos real (la provee el profesor)
- Reconocimiento de señas con cámara (MediaPipe Holistic + clasificador propio)
- Traductor en tiempo real señas ↔ voz/texto (Fase 3)
- Más categorías de señas (números, familia, colores, acciones)
