import { Stack } from "expo-router";
import { StatusBar } from "react-native";

// Layout raíz. El login y el registro van acá, afuera de las pestañas:
// así router.replace("/LoginScreen") cierra las pestañas. Si el login fuera
// otra pestaña, el Home seguiría montado y volvería a redirigir en bucle.
export default function RootLayout() {
  return (
    <>
      {/* Hora y batería oscuras en toda la app, también en login y registro */}
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
