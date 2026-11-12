import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CampoPassword from "../components/CampoPassword";
import { registrarUsuario } from "../services/api";
import { marcarTutorialPendiente } from "../services/tutorial";

// ── Requisitos de la contraseña ──
// Se revisan en la app, antes de llamar a la API. Si al enviar falta alguno,
// se muestra el error del primero que falta (por eso van en este orden).
const requisitosPassword = (password, repetir) => [
  {
    texto: "Al menos 8 caracteres",
    cumple: password.length >= 8,
    error: "La contraseña tiene que tener al menos 8 caracteres.",
  },
  {
    texto: "Al menos una letra",
    cumple: /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(password),
    error: "La contraseña tiene que tener al menos una letra.",
  },
  {
    texto: "Al menos un número",
    cumple: /[0-9]/.test(password),
    error: "La contraseña tiene que tener al menos un número.",
  },
  {
    texto: "Las contraseñas coinciden",
    cumple: repetir === password,
    error: "Las contraseñas no coinciden.",
  },
];

const RegistroScreen = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Se recalculan en cada tecla: la lista y el botón se actualizan solos
  const requisitos = requisitosPassword(password, repetirPassword);
  const faltaRequisito = requisitos.find((r) => !r.cumple);
  const puedeEnviar =
    nombre.trim() !== "" && email.trim() !== "" && !faltaRequisito;

  const handleRegistro = async () => {
    // Ya se está creando la cuenta (por ejemplo, Enter dos veces en la web)
    if (cargando) return;
    setError("");

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Completá todos los campos.");
      return;
    }

    // Si falta un requisito de la contraseña (por ejemplo, si se apretó Enter
    // en la web), se avisa el primero que falta y NO se llama a la API.
    if (faltaRequisito) {
      setError(faltaRequisito.error);
      return;
    }

    setCargando(true);
    const resultado = await registrarUsuario({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
    });
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    // Cuenta nueva: al entrar por primera vez le aparece el tutorial
    await marcarTutorialPendiente(email);

    // Cuenta creada. La API de registro no devuelve sesión,
    // así que mandamos al usuario a loguearse con lo recién creado.
    // Si vino desde el login, volvemos a ese en vez de apilar otro.
    if (router.canGoBack()) router.back();
    else router.replace("/LoginScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En iOS, cuando aparece el teclado se achica el lugar y se puede
          scrollear hasta "Crear cuenta". Si todo entra, queda centrado como
          antes. "handled": tocar 👁️ o un botón funciona al primer toque,
          sin que se cierre el teclado */}
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Crear cuenta</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#9CA3AF"
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                setError("");
              }}
              editable={!cargando}
            />
          </View>

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
              }}
              editable={!cargando}
              textContentType="newPassword"
              autoComplete="new-password"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Repetir contraseña</Text>
            <CampoPassword
              style={styles.input}
              placeholder="Repetí tu contraseña"
              placeholderTextColor="#9CA3AF"
              value={repetirPassword}
              onChangeText={(t) => {
                setRepetirPassword(t);
                setError("");
              }}
              editable={!cargando}
              textContentType="newPassword"
              autoComplete="new-password"
              onSubmitEditing={handleRegistro}
            />
          </View>

          {password !== "" && (
            <View style={styles.requisitos}>
              {requisitos.map((r) => (
                <Text
                  key={r.texto}
                  style={[styles.requisito, r.cumple && styles.requisitoCumple]}
                >
                  {r.cumple ? "✓" : "○"} {r.texto}
                </Text>
              ))}
            </View>
          )}

          {error !== "" && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorTxt}>⚠ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.registerButton,
              (cargando || !puedeEnviar) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegistro}
            disabled={cargando || !puedeEnviar}
          >
            {cargando ? (
              <ActivityIndicator color="#1A1A2E" />
            ) : (
              <Text style={styles.registerButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/LoginScreen");
            }}
          >
            <Text style={styles.footerText}>
              ¿Ya tenés cuenta?{" "}
              <Text style={styles.linkText}>Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  teclado: { flex: 1 },
  // flexGrow y no flex: 1, porque con flex: 1 el ScrollView no deja
  // scrollear. Si todo entra, ocupa la pantalla y queda centrado (como
  // antes); si no entra, crece y se puede scrollear.
  content: { flexGrow: 1, paddingHorizontal: 30, justifyContent: "center" },
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
    backgroundColor: "#EAEBEF",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5D8",
    height: 50,
    color: "#000",
  },
  requisitos: { marginTop: -8, marginBottom: 16 },
  requisito: { fontSize: 13, color: "#9CA3AF", marginBottom: 2 },
  requisitoCumple: { color: "#2E7D32" },
  errorWrap: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorTxt: { fontSize: 14, color: "#C62828", fontWeight: "500" },
  registerButton: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: { fontSize: 18, fontWeight: "bold", color: "#000" },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#000",
    marginTop: 20,
  },
  linkText: { fontWeight: "bold", textDecorationLine: "underline" },
});

export default RegistroScreen;
