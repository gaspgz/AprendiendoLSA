import PantallaSinConexion from "@/components/PantallaSinConexion";
import {
  alVencerSesion,
  cerrarSesion,
  obtenerSesion,
  obtenerToken,
} from "@/services/sesion";
import { router, Stack, usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { StatusBar } from "react-native";

const LOGIN = "/LoginScreen";

// Layout raíz. El login y el registro van acá, afuera de las pestañas:
// así router.replace("/LoginScreen") cierra las pestañas. Si el login fuera
// otra pestaña, el Home seguiría montado y volvería a redirigir en bucle.
export default function RootLayout() {
  const pathname = usePathname();
  const enElLogin = pathname === LOGIN;
  // Lo mismo, para leerlo desde el aviso (que no es un render)
  const enElLoginRef = useRef(enElLogin);
  // Ya se mandó al login por la sesión: si llegan varios 401 juntos (por
  // ejemplo progreso y vidas), se hace una sola vez. Vuelve a empezar
  // cuando se sale del login, o sea cuando se entró de nuevo.
  const yaMandado = useRef(false);

  useEffect(() => {
    enElLoginRef.current = enElLogin;
    if (!enElLogin) yaMandado.current = false;
  }, [enElLogin]);

  // Borra la sesión del celular y va al login con el aviso. NO llama a
  // cerrarSesionRemota: sin token (o con uno vencido) PUT /sesiones falla
  // igual. No es async para que el "una sola vez" valga desde el primer
  // aviso, aunque lleguen varios en el mismo momento.
  const salirPorSesionVencida = useCallback(() => {
    if (yaMandado.current || enElLoginRef.current) return;
    yaMandado.current = true;
    (async () => {
      try {
        await cerrarSesion();
      } catch (e) {
        console.log("No se pudo borrar la sesión vencida:", e);
      }
      router.replace({ pathname: LOGIN, params: { vencida: "1" } });
    })();
  }, []);

  // Al abrir: una sesión guardada de antes de que la app guardara el token
  // no sirve, porque la API pide Authorization en el usuario, el progreso,
  // las vidas y demás (sin token contesta 403). Se cierra y se vuelve a
  // entrar.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const sesion = await obtenerSesion();
      if (cancelado || !sesion) return;
      if (await obtenerToken()) return; // la sesión está bien
      if (!cancelado) salirPorSesionVencida();
    })();
    return () => {
      cancelado = true;
    };
  }, [salirPorSesionVencida]);

  // El token vence a los 30 días: cuando la API contesta 401, apiFetch avisa
  // (services/sesion.js) y se sale al login desde cualquier pantalla
  useEffect(
    () => alVencerSesion(salirPorSesionVencida),
    [salirPorSesionVencida],
  );

  return (
    <>
      {/* Hora y batería oscuras en toda la app, también en login y registro */}
      <StatusBar barStyle="dark-content" />
      {/* Sin internet se bloquea toda la app: login, registro, pestañas y sus
          modales. Envuelve al Stack, así las pantallas siguen montadas debajo
          y, cuando vuelve la conexión, cada una sigue donde estaba */}
      <PantallaSinConexion>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="LoginScreen" />
          <Stack.Screen name="registro" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </PantallaSinConexion>
    </>
  );
}
