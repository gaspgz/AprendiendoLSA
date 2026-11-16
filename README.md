# Aprendiendo LSA

App para aprender **Lengua de Señas Argentina** jugando: niveles, lecciones, vidas, experiencia (XP), racha y logros.
Hecha con **React Native + Expo (SDK 58)**. Los datos (usuarios, progreso, vidas) y los GIF de las señas vienen de la
API del curso (Python + FastAPI), documentada en https://ort.nilosolutions.com/api/lsa/docs

## Cómo correrla en tu compu

Necesitás **Node.js 22.13 o más nuevo** (lo pide Expo SDK 58) y la app **Expo Go** en el celular (de la tienda; abre proyectos con SDK 58).

```bash
git clone https://github.com/gaspgz/AprendiendoLSA.git
cd AprendiendoLSA
npm ci                 # instala exactamente lo del package-lock.json
cp .env.example .env   # y completá EXPO_PUBLIC_LSA_API_KEY con la clave del curso (te la da el profe)
npx expo start         # aparece un QR: escanealo con Expo Go
```

- Otra red o wifi de la escuela que bloquea: `npx expo start --tunnel`.
- En el navegador: `npx expo start --web`.
- Sin compilar nada: el QR de la última versión de `main` está en https://ort.nilosolutions.com/expo/

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `app/(tabs)/` | Las pestañas: `index.jsx` (mapa de niveles y lecciones), `SenasScreen.jsx` (diccionario), `ProfileScreen.jsx` |
| `app/LoginScreen.js`, `app/registro.jsx` | Entrar y crear cuenta |
| `services/` | `api.js` (todos los pedidos a la API pasan por `apiFetch`), sesión, logros, foto de perfil, precarga de GIF |
| `components/` | `SenaGif.jsx`, barra de pestañas, pantalla sin conexión |
| `docs/` | Contenido de los niveles y notas del proyecto |
| `landing/` | Página web de presentación |

## Antes de subir cambios

```bash
npx expo lint          # revisa errores comunes (por ejemplo, hooks dentro de un if)
```
El archivo `.env` no se sube nunca (está en `.gitignore`).
