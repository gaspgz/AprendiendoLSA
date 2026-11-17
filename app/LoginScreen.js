import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CampoPassword from "../components/CampoPassword";
import { cerrarSesionRemota, loginUsuario } from "../services/api";
import { guardarSesion, obtenerSesionId } from "../services/sesion";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Se llegó acá porque la sesión venció: app/_layout.tsx manda vencida=1.
  // Si se llega de otra forma (cerrar sesión, registro) no viene y no se
  // muestra nada.
  const { vencida } = useLocalSearchParams();
  const [avisoVencida, setAvisoVencida] = useState(vencida === "1");

  // Si la pantalla ya estaba montada, el valor inicial del useState queda
  // congelado: se ajusta durante el render (el mismo patrón que el nombre
  // en ModalEditar del Perfil) en vez de con un useEffect.
  const [vencidaAnterior, setVencidaAnterior] = useState(vencida);
  if (vencida !== vencidaAnterior) {
    setVencidaAnterior(vencida);
    setAvisoVencida(vencida === "1");
  }

  const handleLogin = async () => {
    setError("");
    setAvisoVencida(false);

    if (!email.trim() || !password.trim()) {
      setError("Completá todos los campos.");
      return;
    }

    setCargando(true);
    const resultado = await loginUsuario(email.trim(), password);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    // Si quedó una sesión anterior abierta (se llegó al login sin tocar
    // "Cerrar sesión"), la cerramos en el servidor antes de guardar la nueva.
    // No se espera la respuesta para que el login no tarde más.
    const sesionAnterior = await obtenerSesionId();
    if (sesionAnterior && sesionAnterior !== String(resultado.sesion_id)) {
      cerrarSesionRemota(sesionAnterior);
    }

    // Guardar sesión local: usuario + id del registro POST en MockAPI +
    // el token del login (hace falta para cambiar la foto de perfil).
    // Si el login no trajo token va null: borra el de la cuenta anterior.
    await guardarSesion(
      resultado.usuario,
      resultado.sesion_id,
      resultado.token ?? null,
    );

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Inicio de sesión</Text>

        {/* Aviso de sesión vencida: se va al escribir o al iniciar sesión */}
        {avisoVencida && (
          <View style={styles.avisoWrap}>
            <Text style={styles.avisoTxt}>
              Tu sesión venció. Volvé a iniciar sesión.
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
              setAvisoVencida(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!cargando}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <CampoPassword
            style={styles.input}
            placeholder="Tu contraseña"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
              setAvisoVencida(false);
            }}
            editable={!cargando}
            textContentType="password"
            autoComplete="password"
          />
        </View>

        {error !== "" && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorTxt}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} disabled>
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>
            Proximamente inicio de sesión con{" "}
            <Text style={{ fontWeight: "bold" }}>Google</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/registro")}>
          <Text style={styles.footerText}>
            ¿No tenés cuenta? <Text style={styles.linkText}>Registrate</Text>.
          </Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#000",
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#000" },
  input: {
    backgroundColor: "#EAECEF",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    height: 50,
    color: "#000",
  },
  errorWrap: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorTxt: { fontSize: 14, color: "#C62828", fontWeight: "500" },
  // Aviso de sesión vencida: como la caja de error, pero en el lila de la app
  avisoWrap: {
    backgroundColor: "#EEF1FB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8D3F5",
  },
  avisoTxt: { fontSize: 14, color: "#3D4FBB", fontWeight: "500" },
  loginButton: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 18, fontWeight: "bold", color: "#000" },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    opacity: 0.5,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 14, color: "#000" },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#000",
    marginBottom: 40,
  },
  linkText: { fontWeight: "bold", textDecorationLine: "underline" },
  logoContainer: { alignItems: "center", marginTop: 20 },
  logo: { width: 120, height: 120 },
});

export default LoginScreen;
