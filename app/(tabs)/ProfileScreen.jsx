import { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Datos mock (reemplazar con MockAPI cuando esté lista) ────────────
const USUARIO_MOCK = {
  id: "1",
  nombre: "María García",
  email: "maria@gmail.com",
  foto: null, // reemplazar con URL real o require() local
  fechaRegistro: "Marzo 2025",
};

const STATS_MOCK = {
  nivelesCompletados: 2,
  totalNiveles: 5,
  xpTotal: 340,
  rachaDias: 7,
  rachaMaxima: 12,
};

const LOGROS_MOCK = [
  {
    id: "1",
    icono: "🏆",
    nombre: "Primer nivel",
    descripcion: "Completaste tu primer nivel",
    obtenido: true,
  },
  {
    id: "2",
    icono: "🔥",
    nombre: "Racha de 7 días",
    descripcion: "7 días seguidos practicando",
    obtenido: true,
  },
  {
    id: "3",
    icono: "⭐",
    nombre: "Perfeccionista",
    descripcion: "10 ejercicios perfectos seguidos",
    obtenido: false,
  },
  {
    id: "4",
    icono: "🤟",
    nombre: "Abecedario completo",
    descripcion: "Aprendiste todas las letras",
    obtenido: false,
  },
  {
    id: "5",
    icono: "🎓",
    nombre: "Graduado",
    descripcion: "Completaste todos los niveles",
    obtenido: false,
  },
  {
    id: "6",
    icono: "💪",
    nombre: "Constante",
    descripcion: "30 días seguidos practicando",
    obtenido: false,
  },
];

// ─── Tarjeta de stat ─────────────────────────────────────────────────
const StatCard = ({ icono, valor, label, color }) => (
  <View style={[styles.statCard, { borderColor: color + "55" }]}>
    <Text style={styles.statIcono}>{icono}</Text>
    <Text style={[styles.statValor, { color }]}>{valor}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Modal de edición ────────────────────────────────────────────────
const ModalEditar = ({ visible, usuario, onGuardar, onCerrar }) => {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [email, setEmail] = useState(usuario.email);

  const handleGuardar = () => {
    if (!nombre.trim() || !email.trim()) {
      Alert.alert("Error", "Completá todos los campos.");
      return;
    }
    onGuardar({ ...usuario, nombre: nombre.trim(), email: email.trim() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Editar perfil</Text>
            <TouchableOpacity onPress={onCerrar}>
              <Text style={styles.modalCerrarTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Foto — por ahora solo aviso, cuando esté MockAPI se activa */}
          <View style={styles.fotoEditRow}>
            <Text style={styles.fotoEditTxt}>📷 Cambiar foto de perfil</Text>
            <Text style={styles.fotoEditSub}>Disponible próximamente</Text>
          </View>

          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
            <Text style={styles.btnGuardarTxt}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Pantalla principal ──────────────────────────────────────────────
const ProfileScreen = () => {
  const [usuario, setUsuario] = useState(USUARIO_MOCK);
  const [modalEditar, setModalEditar] = useState(false);

  const iniciales = usuario.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleGuardar = (datosActualizados) => {
    // TODO: llamada a MockAPI → PUT /users/:id
    setUsuario(datosActualizados);
    setModalEditar(false);
  };

  const handleCerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que querés cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => {
          // TODO: limpiar token / navegación a LoginScreen
          Alert.alert("Sesión cerrada");
        },
      },
    ]);
  };

  const progresoPct = Math.round(
    (STATS_MOCK.nivelesCompletados / STATS_MOCK.totalNiveles) * 100,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Mi perfil</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setModalEditar(true)}
          >
            <Text style={styles.editBtnTxt}>✏️ Editar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar + datos ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {usuario.foto ? (
              <Image source={{ uri: usuario.foto }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarIniciales}>{iniciales}</Text>
              </View>
            )}
          </View>
          <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
          <Text style={styles.usuarioEmail}>{usuario.email}</Text>
          <Text style={styles.usuarioDesde}>
            Miembro desde {usuario.fechaRegistro}
          </Text>
        </View>

        {/* ── Progreso general ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Progreso general</Text>
          <View style={styles.progresoWrap}>
            <View style={styles.progresoTextos}>
              <Text style={styles.progresoLabel}>
                {STATS_MOCK.nivelesCompletados} de {STATS_MOCK.totalNiveles}{" "}
                niveles
              </Text>
              <Text style={styles.progresoPct}>{progresoPct}%</Text>
            </View>
            <View style={styles.barraFondo}>
              <View
                style={[styles.barraRelleno, { width: `${progresoPct}%` }]}
              />
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icono="⭐"
              valor={STATS_MOCK.xpTotal}
              label="XP total"
              color="#E8A000"
            />
            <StatCard
              icono="🔥"
              valor={STATS_MOCK.rachaDias}
              label="Racha actual"
              color="#E53935"
            />
            <StatCard
              icono="📈"
              valor={STATS_MOCK.rachaMaxima}
              label="Racha máxima"
              color="#3D4FBB"
            />
            <StatCard
              icono="🎯"
              valor={`${STATS_MOCK.nivelesCompletados}/${STATS_MOCK.totalNiveles}`}
              label="Niveles"
              color="#2E7D32"
            />
          </View>
        </View>

        {/* ── Logros ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Logros — {LOGROS_MOCK.filter((l) => l.obtenido).length}/
            {LOGROS_MOCK.length}
          </Text>
          <View style={styles.logrosGrid}>
            {LOGROS_MOCK.map((logro) => (
              <View
                key={logro.id}
                style={[
                  styles.logroCard,
                  !logro.obtenido && styles.logroCardBloqueado,
                ]}
              >
                <Text
                  style={[
                    styles.logroIcono,
                    !logro.obtenido && styles.logroIconoBloqueado,
                  ]}
                >
                  {logro.obtenido ? logro.icono : "🔒"}
                </Text>
                <Text
                  style={[
                    styles.logroNombre,
                    !logro.obtenido && styles.logroTextoBloqueado,
                  ]}
                >
                  {logro.nombre}
                </Text>
                <Text
                  style={[
                    styles.logroDesc,
                    !logro.obtenido && styles.logroTextoBloqueado,
                  ]}
                >
                  {logro.descripcion}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity
          style={styles.btnCerrarSesion}
          onPress={handleCerrarSesion}
        >
          <Text style={styles.btnCerrarSesionTxt}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal editar ── */}
      <ModalEditar
        visible={modalEditar}
        usuario={usuario}
        onGuardar={handleGuardar}
        onCerrar={() => setModalEditar(false)}
      />
    </SafeAreaView>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FC" },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitulo: { fontSize: 28, fontWeight: "800", color: "#1A1A2E" },
  editBtn: {
    backgroundColor: "#EEF1FB",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C8D3F5",
  },
  editBtnTxt: { fontSize: 14, fontWeight: "600", color: "#3D4FBB" },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarWrap: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarIniciales: { fontSize: 32, fontWeight: "800", color: "#3D4FBB" },
  usuarioNombre: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  usuarioEmail: { fontSize: 14, color: "#888", marginBottom: 4 },
  usuarioDesde: { fontSize: 12, color: "#AAAAAA" },

  // Secciones
  seccion: { marginBottom: 24 },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },

  // Progreso
  progresoWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E4F0",
  },
  progresoTextos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progresoLabel: { fontSize: 14, color: "#555", fontWeight: "600" },
  progresoPct: { fontSize: 14, fontWeight: "700", color: "#3D4FBB" },
  barraFondo: {
    height: 10,
    backgroundColor: "#EEF1FB",
    borderRadius: 5,
    overflow: "hidden",
  },
  barraRelleno: { height: "100%", backgroundColor: "#F5CE5A", borderRadius: 5 },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statIcono: { fontSize: 26, marginBottom: 6 },
  statValor: { fontSize: 24, fontWeight: "800", marginBottom: 2 },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    textAlign: "center",
  },

  // Logros
  logrosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logroCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E0E4F0",
    padding: 14,
    alignItems: "center",
  },
  logroCardBloqueado: { backgroundColor: "#F5F5F5", borderColor: "#E0E0E0" },
  logroIcono: { fontSize: 28, marginBottom: 6 },
  logroIconoBloqueado: { opacity: 0.4 },
  logroNombre: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 2,
  },
  logroDesc: { fontSize: 11, color: "#888", textAlign: "center" },
  logroTextoBloqueado: { color: "#BDBDBD" },

  // Cerrar sesión
  btnCerrarSesion: {
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
    marginTop: 8,
  },
  btnCerrarSesionTxt: { fontSize: 16, fontWeight: "700", color: "#C62828" },

  // Modal editar
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  modalCerrarTxt: { fontSize: 20, color: "#BDBDBD", padding: 4 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#EAECEF",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 16,
    color: "#1A1A2E",
  },
  fotoEditRow: {
    backgroundColor: "#F7F8FC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E4F0",
  },
  fotoEditTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D4FBB",
    marginBottom: 3,
  },
  fotoEditSub: { fontSize: 12, color: "#AAAAAA" },
  btnGuardar: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  btnGuardarTxt: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },
});

export default ProfileScreen;
