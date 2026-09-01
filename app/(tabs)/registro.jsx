import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registrarUsuario } from "../../services/api";

const RegistroScreen = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    setError("");

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Completá todos los campos.");
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

    // Cuenta creada. La API de registro no devuelve sesión,
    // así que mandamos al usuario a loguearse con lo recién creado.
    router.replace("/LoginScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
          <TextInput
            style={styles.input}
            placeholder="Tu contraseña"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            secureTextEntry
            editable={!cargando}
          />
        </View>

        {error !== "" && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorTxt}>⚠ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.registerButton,
            cargando && styles.registerButtonDisabled,
          ]}
          onPress={handleRegistro}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.registerButtonText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/LoginScreen")}>
          <Text style={styles.footerText}>
            ¿Ya tenés cuenta?{" "}
            <Text style={styles.linkText}>Iniciar sesión</Text>
          </Text>
        </TouchableOpacity>
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
