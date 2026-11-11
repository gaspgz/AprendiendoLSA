import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  actualizarUsuario,
  cerrarSesionRemota,
  eliminarUsuario,
  mensajeError,
  obtenerProgreso,
  obtenerUsuario,
} from "../../services/api";
import {
  borrarFotoLocal,
  guardarFotoPerfil,
  obtenerFotoLocal,
  procesarFoto,
  quitarFotoPerfil,
} from "../../services/fotoPerfil";
import { obtenerLogrosGuardados } from "../../services/logros";
import {
  cerrarSesion,
  guardarSesion,
  obtenerSesion,
  obtenerSesionId,
} from "../../services/sesion";
import { NIVELES } from "./index";

// ─── Helpers de datos ────────────────────────────────────────────────
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// "2026-10-06T15:15:21+00:00" → "Octubre 2026". null si no hay fecha válida.
const formatearMesAnio = (iso) => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return null;
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
};

// Lecciones del nivel que están en leccionesCompletadas. Las que el progreso
// tiene pero ya no existen en NIVELES no cuentan. El JSON trae las claves
// como string ("1"): obj[1] y obj["1"] son lo mismo en JS. Los ids de
// lección se comparan como string por si vienen así.
const leccionesHechasDelNivel = (nivel, leccionesCompletadas) => {
  const hechas = (leccionesCompletadas[nivel.id] || []).map(String);
  return nivel.lecciones.filter((leccion) =>
    hechas.includes(String(leccion.id)),
  );
};

// Un nivel está completo si TODAS sus lecciones están completadas
const nivelCompleto = (nivel, leccionesCompletadas) =>
  nivel.lecciones.length > 0 &&
  leccionesHechasDelNivel(nivel, leccionesCompletadas).length ===
    nivel.lecciones.length;

// Seña que enseña un ítem, por su clave de GIF (constants/gifsNube.js): las
// letras la tienen en `letra` y las palabras en `gifPalabra`. null si el ítem
// no es de enseñanza. El prefijo separa letras de palabras.
const senaEnsenada = (item) => {
  if (item.tipo === "ensenanza") return `letra:${item.letra}`;
  if (item.tipo === "ensenanza_palabra") return `palabra:${item.gifPalabra}`;
  return null;
};

// Misma tarjeta de siempre; `obtenido` sale de los datos reales
const calcularLogros = ({
  abecedarioCompleto,
  leccionPerfecta,
  senasAprendidas,
  primeraFrase,
  nivelesCompletados,
  totalNiveles,
}) => [
  {
    id: "abecedario_completo",
    icono: "🤟",
    nombre: "Abecedario completo",
    descripcion: "Completaste todas las letras",
    obtenido: abecedarioCompleto,
  },
  {
    id: "leccion_perfecta",
    icono: "💯",
    nombre: "Lección perfecta",
    descripcion: "Terminaste una lección sin errores",
    obtenido: leccionPerfecta,
  },
  {
    id: "50_senas",
    icono: "🏅",
    nombre: "50 señas",
    descripcion: "Aprendiste 50 señas",
    obtenido: senasAprendidas >= 50,
  },
  {
    id: "primera_frase",
    icono: "💬",
    nombre: "Primera frase",
    descripcion: "Completaste tu primera lección de frases",
    obtenido: primeraFrase,
  },
  {
    id: "mitad_del_camino",
    icono: "🧭",
    nombre: "Mitad del camino",
    descripcion: "Completaste la mitad de los niveles",
    obtenido:
      totalNiveles > 0 && nivelesCompletados >= Math.ceil(totalNiveles / 2),
  },
  {
    id: "graduado",
    icono: "🎓",
    nombre: "Graduado",
    descripcion: "Completaste todos los niveles",
    obtenido: totalNiveles > 0 && nivelesCompletados === totalNiveles,
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
// onCerrado: avisa cuando terminó de cerrarse (solo en iOS, ver
// cambiarFotoDesdeEditar)
const ModalEditar = ({
  visible,
  usuario,
  guardando,
  onGuardar,
  onCerrar,
  onCambiarFoto,
  onCerrado,
}) => {
  const [nombre, setNombre] = useState(usuario.nombre || "");

  // El valor inicial del useState queda congelado: cada vez que se abre,
  // el input arranca con el nombre actual. Se ajusta durante el render
  // (patrón recomendado por React) en vez de con un useEffect.
  const [estabaVisible, setEstabaVisible] = useState(visible);
  if (visible !== estabaVisible) {
    setEstabaVisible(visible);
    if (visible) setNombre(usuario.nombre || "");
  }

  const handleGuardar = () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "Completá tu nombre.");
      return;
    }
    onGuardar(nombre.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      onDismiss={onCerrado}
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

          {/* El email no se puede editar: la API no lo acepta en el PUT */}
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputSoloLectura]}
            value={usuario.email}
            editable={false}
            placeholder="tu@email.com"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputAyuda}>El email no se puede cambiar.</Text>

          {/* Foto: se cierra este modal y se abre la hoja "Foto de perfil" */}
          <TouchableOpacity
            style={styles.fotoEditRow}
            onPress={onCambiarFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            <Text style={styles.fotoEditTxt}>📷 Cambiar foto de perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGuardar}
            onPress={handleGuardar}
            disabled={guardando}
          >
            <Text style={styles.btnGuardarTxt}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Eliminar cuenta ─────────────────────────────────────────────────
// Pregunta antes de hacer algo y devuelve true si se confirmó. En la web
// Alert.alert con botones no aparece: ahí se usa window.confirm.
const confirmar = (titulo, mensaje, textoBoton) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolver(false) },
        {
          text: textoBoton,
          style: "destructive",
          onPress: () => resolver(true),
        },
      ],
      // Android: tocar afuera cierra el cartel; cuenta como "Cancelar"
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
};

// Lo que el celular guarda de una cuenta, además de la sesión. "Cerrar
// sesión" lo deja a propósito (si volvés a entrar sigue ahí); al eliminar la
// cuenta se borra. Salen de: index.jsx (progreso_ y vidas_),
// services/leccionEnCurso.js, services/logros.js y services/tutorial.js
// (este va por email, sin espacios y en minúsculas).
const clavesDeLaCuenta = ({ id, email }) => {
  const uid = String(id).trim();
  const claves = [
    `progreso_${uid}`,
    `vidas_${uid}`,
    `leccion_en_curso_${uid}`,
    `logros_${uid}`,
  ];
  const mail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (mail) claves.push(`tutorial_pendiente_${mail}`);
  return claves;
};

// ─── Modal de ajustes ────────────────────────────────────────────────
// Armado igual que ModalEditar. Mientras se elimina la cuenta no se puede
// cerrar: ni con la ✕ ni con el botón "atrás" de Android.
const ModalAjustes = ({ visible, eliminando, error, onEliminar, onCerrar }) => {
  const cerrar = () => {
    if (!eliminando) onCerrar();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Ajustes</Text>
            <TouchableOpacity onPress={cerrar} disabled={eliminando}>
              <Text style={styles.modalCerrarTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.ajustesTexto}>
            Si eliminás tu cuenta se borran tu usuario y TODO tu progreso
            (lecciones, XP, vidas y logros). No se puede deshacer.
          </Text>

          {/* La caja roja de errores de la app (como en el login) */}
          {error !== "" && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btnCerrarSesion, eliminando && styles.btnEliminando]}
            onPress={onEliminar}
            disabled={eliminando}
          >
            {eliminando ? (
              <ActivityIndicator color="#C62828" />
            ) : (
              <Text style={styles.btnCerrarSesionTxt}>Eliminar cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Hoja "Foto de perfil" ───────────────────────────────────────────
// Recorte cuadrado al elegir. En la web el navegador no recorta: lo hace
// procesarFoto.
const OPCIONES_FOTO = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
};

// Armada igual que ModalEditar. Primero las opciones y, después de elegir
// una foto, la vista previa con "Guardar" y "Cancelar". Mientras procesa,
// guarda o quita la foto, no se puede cerrar.
// onCambio(uri): se guardó una foto nueva (o se quitó: uri null).
const ModalFoto = ({ visible, uid, hayFoto, onCambio, onCerrar }) => {
  const [fotoNueva, setFotoNueva] = useState(null); // la de la vista previa
  const [ocupado, setOcupado] = useState(null); // "procesando", "guardando" o "quitando"
  // { texto, configuracion } (configuracion: mostrar "Abrir configuración")
  const [error, setError] = useState(null);
  // La cámara o la galería ya se están abriendo: un segundo toque no hace nada
  const eligiendo = useRef(false);

  // Cada vez que se abre arranca de cero, sin el error de la vez anterior
  // (igual que el nombre en ModalEditar)
  const [estabaVisible, setEstabaVisible] = useState(visible);
  if (visible !== estabaVisible) {
    setEstabaVisible(visible);
    if (visible) {
      setFotoNueva(null);
      setOcupado(null);
      setError(null);
    }
  }

  const cerrar = () => {
    if (!ocupado) onCerrar();
  };

  // Abre la cámara (camara true) o la galería. Si se cancela, no pasa nada.
  const elegir = async (camara) => {
    if (eligiendo.current || ocupado) return;
    eligiendo.current = true;
    setError(null);
    try {
      // La cámara necesita permiso. La galería no: abre el selector del
      // sistema. En la web tampoco: el navegador abre su propio selector.
      if (camara && Platform.OS !== "web") {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          setError({
            texto:
              "Para usar la cámara, habilitá el permiso en la configuración del celular.",
            configuracion: true,
          });
          return;
        }
      }
      const resultado = camara
        ? await ImagePicker.launchCameraAsync(OPCIONES_FOTO)
        : await ImagePicker.launchImageLibraryAsync(OPCIONES_FOTO);
      if (resultado.canceled || !resultado.assets?.length) return;

      setOcupado("procesando");
      const uri = await procesarFoto(resultado.assets[0].uri);
      if (uri) setFotoNueva(uri);
      else setError({ texto: "No se pudo preparar la foto. Probá con otra." });
    } catch (e) {
      console.log("No se pudo abrir la cámara o la galería:", e);
      setError({
        texto: camara
          ? "No se pudo abrir la cámara."
          : "No se pudo abrir la galería.",
      });
    } finally {
      eligiendo.current = false;
      setOcupado(null);
    }
  };

  const guardar = async () => {
    setOcupado("guardando");
    setError(null);
    const guardada = await guardarFotoPerfil(uid, fotoNueva); // null si falla
    if (guardada) {
      onCambio(guardada); // se cierra la hoja con "Guardando..." a la vista
      return;
    }
    setOcupado(null);
    setError({ texto: "No se pudo guardar la foto. Probá de nuevo." });
  };

  const quitar = async () => {
    const seguro = await confirmar(
      "Quitar foto",
      "¿Seguro que querés quitar tu foto? Vas a volver a ver tus iniciales.",
      "Quitar",
    );
    if (!seguro) return;

    setOcupado("quitando");
    setError(null);
    if (await quitarFotoPerfil(uid)) {
      onCambio(null);
      return;
    }
    setOcupado(null);
    setError({ texto: "No se pudo quitar la foto. Probá de nuevo." });
  };

  // "Cancelar" de la vista previa: vuelve a las opciones sin guardar nada
  const cancelarVistaPrevia = () => {
    setFotoNueva(null);
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Foto de perfil</Text>
            <TouchableOpacity
              onPress={cerrar}
              disabled={!!ocupado}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Text style={styles.modalCerrarTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* La caja roja de errores (como en Ajustes): se ve también en la
              web, donde Alert.alert no aparece */}
          {error && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorTxt}>⚠️ {error.texto}</Text>
              {error.configuracion && (
                <TouchableOpacity
                  style={styles.fotoConfigBtn}
                  onPress={() => Linking.openSettings()}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir configuración"
                >
                  <Text style={styles.fotoConfigTxt}>Abrir configuración</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {ocupado === "procesando" ? (
            <ActivityIndicator
              size="large"
              color="#3D4FBB"
              style={styles.fotoProcesando}
            />
          ) : fotoNueva ? (
            <>
              <Image
                source={{ uri: fotoNueva }}
                style={styles.fotoVistaPrevia}
                contentFit="cover"
                cachePolicy="none"
                accessibilityLabel="Vista previa de la foto"
              />
              <TouchableOpacity
                style={[
                  styles.btnGuardar,
                  ocupado === "guardando" && styles.btnGuardando,
                ]}
                onPress={guardar}
                disabled={ocupado === "guardando"}
                accessibilityRole="button"
                accessibilityLabel="Guardar foto"
              >
                <Text style={styles.btnGuardarTxt}>
                  {ocupado === "guardando" ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fotoCancelarBtn}
                onPress={cancelarVistaPrevia}
                disabled={ocupado === "guardando"}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.fotoCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.fotoOpcion}
                onPress={() => elegir(true)}
                disabled={!!ocupado}
                accessibilityRole="button"
                accessibilityLabel="Sacar foto con la cámara"
              >
                <Text style={styles.fotoOpcionTxt}>📷 Sacar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fotoOpcion}
                onPress={() => elegir(false)}
                disabled={!!ocupado}
                accessibilityRole="button"
                accessibilityLabel="Elegir foto de la galería"
              >
                <Text style={styles.fotoOpcionTxt}>
                  🖼️ Elegir de la galería
                </Text>
              </TouchableOpacity>
              {hayFoto && (
                <TouchableOpacity
                  style={[
                    styles.fotoOpcion,
                    ocupado === "quitando" && styles.btnGuardando,
                  ]}
                  onPress={quitar}
                  disabled={!!ocupado}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar foto de perfil"
                >
                  <Text style={[styles.fotoOpcionTxt, styles.fotoQuitarTxt]}>
                    🗑️ Quitar foto
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Pantalla principal ──────────────────────────────────────────────
const ProfileScreen = () => {
  // { usuario, leccionesCompletadas, logrosGuardados } — null mientras carga
  // la primera vez
  const [perfil, setPerfil] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Ajustes: modal abierto, cuenta eliminándose y error a mostrar ("" = nada)
  const [modalAjustes, setModalAjustes] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorAjustes, setErrorAjustes] = useState("");
  // Foto de perfil guardada en el celular: de qué cuenta es (así nunca se ve
  // la de otra) y "version", que cambia cada vez que se guarda o se quita
  const [foto, setFoto] = useState({ uid: null, uri: null, version: 0 });
  const [fotoRota, setFotoRota] = useState(null); // la que no se pudo mostrar
  const [modalFoto, setModalFoto] = useState(false);
  // Se tocó "Cambiar foto" en Editar: en iOS la hoja espera a que Editar
  // termine de cerrarse (ver cambiarFotoDesdeEditar)
  const fotoAlCerrarEditar = useRef(false);

  // La pestaña queda montada: se recarga cada vez que toma foco, así si
  // completaste una lección y volvés al perfil el XP ya está actualizado
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;

      (async () => {
        const sesion = await obtenerSesion();

        // Sin sesión guardada (o sesión sin id) → al login
        if (!sesion || sesion.id == null) {
          router.replace("/LoginScreen");
          return;
        }

        // Si se entró con otra cuenta, no mostrar los datos de la anterior
        setPerfil((prev) => (prev?.usuario.id === sesion.id ? prev : null));

        // La foto guardada en el celular, de esta cuenta (sin esperar a la API)
        obtenerFotoLocal(sesion.id).then((uri) => {
          if (!cancelado) setFoto((prev) => ({ ...prev, uid: sesion.id, uri }));
        });

        // Los logros que se ganan jugando ("Lección perfecta") están en el
        // celular, guardados por cuenta
        const [resUsuario, resProgreso, logrosGuardados] = await Promise.all([
          obtenerUsuario(sesion.id),
          obtenerProgreso(sesion.id),
          obtenerLogrosGuardados(sesion.id),
        ]);
        if (cancelado) return;

        // Si falla la red queda lo último que se cargó; si no había nada,
        // los datos de la sesión local (nombre, email...)
        setPerfil((prev) => ({
          usuario:
            (resUsuario.ok && resUsuario.usuario) || prev?.usuario || sesion,
          leccionesCompletadas: resProgreso.ok
            ? resProgreso.progreso?.leccionesCompletadas || {}
            : prev?.leccionesCompletadas || {},
          logrosGuardados,
        }));
      })();

      return () => {
        cancelado = true;
      };
    }, []),
  );

  if (!perfil) {
    return (
      <SafeAreaView
        style={[styles.container, styles.cargando]}
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator size="large" color="#3D4FBB" />
      </SafeAreaView>
    );
  }

  const { usuario, leccionesCompletadas, logrosGuardados = [] } = perfil;

  const iniciales = (usuario.nombre || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleGuardar = async (nombreNuevo) => {
    setGuardando(true);
    try {
      // Solo el nombre: el PUT es parcial, no toca los otros campos (xpTotal)
      const res = await actualizarUsuario(usuario.id, { nombre: nombreNuevo });
      if (!res.ok) {
        Alert.alert("Error", res.error);
        return;
      }

      // La API devuelve el usuario completo ya actualizado
      const usuarioActualizado = {
        ...usuario,
        nombre: nombreNuevo,
        ...res.usuario,
      };
      setPerfil((prev) => ({ ...prev, usuario: usuarioActualizado }));
      setModalEditar(false);

      // También en la sesión local, sin perder el sesion_id
      const sesionId = await obtenerSesionId();
      await guardarSesion(usuarioActualizado, sesionId);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que querés cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          // Igual que el MenuPerfil de index.jsx: si la API falla (sin
          // internet, endpoint caído), el logout local sigue igual
          try {
            const sesionId = await obtenerSesionId();
            await cerrarSesionRemota(sesionId);
          } catch {
            // se sigue igual
          }
          await cerrarSesion();
          router.replace("/LoginScreen");
        },
      },
    ]);
  };

  // ── Ajustes: eliminar cuenta ──
  const abrirAjustes = () => {
    setErrorAjustes(""); // el error de la vez anterior no queda
    setModalAjustes(true);
  };

  const handleEliminarCuenta = async () => {
    const seguro = await confirmar(
      "Eliminar cuenta",
      "Se van a borrar tu usuario y TODO tu progreso. No se puede deshacer.",
      "Eliminar",
    );
    if (!seguro) return;

    setErrorAjustes("");
    setEliminando(true);
    try {
      // Id y email se guardan ANTES de cerrarSesion(): después ya no están
      const sesion = await obtenerSesion();
      if (!sesion || sesion.id == null) {
        setErrorAjustes("No se encontró tu sesión. Volvé a iniciar sesión.");
        return;
      }
      const cuenta = { id: sesion.id, email: sesion.email };
      const sesionId = await obtenerSesionId();

      const { ok, data, status } = await eliminarUsuario(cuenta.id);
      // 404: la cuenta ya no existe, así que cuenta como eliminada
      if (!ok && status !== 404) {
        setErrorAjustes(
          status === 0
            ? "No hay conexión. Tu cuenta NO se eliminó, probá de nuevo."
            : mensajeError(status, data, "No se pudo eliminar la cuenta."),
        );
        return;
      }

      // La cuenta ya no está: se cierra la sesión en la API (puede fallar si
      // la API ya la borró junto con el usuario; no importa)...
      try {
        await cerrarSesionRemota(sesionId);
      } catch {
        // se sigue igual
      }
      // ...y se borra todo lo de esta cuenta en el celular
      try {
        await cerrarSesion();
        await AsyncStorage.multiRemove(clavesDeLaCuenta(cuenta));
      } catch (e) {
        console.log("No se pudo borrar todo lo guardado de la cuenta:", e);
      }
      // También la foto de perfil (el archivo y su key). No tira error.
      await borrarFotoLocal(cuenta.id);
      setModalAjustes(false);
      router.replace("/LoginScreen");
    } catch (e) {
      // Falló antes de borrar (por ejemplo, al leer la sesión): no se borró nada
      console.log("No se pudo eliminar la cuenta:", e);
      setErrorAjustes("No se pudo eliminar la cuenta. Probá de nuevo.");
    } finally {
      setEliminando(false);
    }
  };

  // ── Foto de perfil ──
  // La del celular (si es de esta cuenta); si no, la de la API
  // (usuario.foto); si no, las iniciales
  const fotoLocal = String(foto.uid) === String(usuario.id) ? foto.uri : null;
  const fotoAvatar = fotoLocal || usuario.foto || null;

  const abrirFoto = () => setModalFoto(true);

  // La hoja guardó una foto nueva (uri) o la quitó (null)
  const fotoCambiada = (uri) => {
    setFoto((prev) => ({ uid: usuario.id, uri, version: prev.version + 1 }));
    setFotoRota(null);
    setModalFoto(false);
  };

  // "📷 Cambiar foto de perfil" de Editar: se cierra Editar y se abre la
  // hoja. En iOS un Modal que se abre mientras otro se está cerrando no
  // aparece (los dos salen de la misma pantalla), así que ahí la hoja se
  // abre en el onDismiss de Editar, que solo existe en iOS y llega cuando
  // terminó de cerrarse. En Android y en la web se abre enseguida.
  const cambiarFotoDesdeEditar = () => {
    setModalEditar(false);
    if (Platform.OS === "ios") fotoAlCerrarEditar.current = true;
    else setModalFoto(true);
  };
  const editarCerrado = () => {
    if (!fotoAlCerrarEditar.current) return;
    fotoAlCerrarEditar.current = false;
    setModalFoto(true);
  };

  // Si algún dato viene null/undefined se muestra 0
  const xpTotal = usuario.xpTotal ?? 0;
  const miembroDesde = formatearMesAnio(usuario.fechaRegistro);

  const nivelesCompletos = NIVELES.filter((nivel) =>
    nivelCompleto(nivel, leccionesCompletadas),
  );
  const nivelesCompletados = nivelesCompletos.length;
  const totalNiveles = NIVELES.length;

  // Lecciones completadas de todos los niveles (solo las que existen)
  const leccionesHechas = NIVELES.flatMap((nivel) =>
    leccionesHechasDelNivel(nivel, leccionesCompletadas),
  );
  const totalLecciones = NIVELES.reduce(
    (total, nivel) => total + nivel.lecciones.length,
    0,
  );

  // Señas distintas que se enseñan en esas lecciones: si una seña se enseña
  // en dos lecciones, cuenta una sola vez
  const senasAprendidas = new Set(
    leccionesHechas.flatMap((leccion) =>
      (leccion.items || []).map(senaEnsenada).filter(Boolean),
    ),
  ).size;

  const logros = calcularLogros({
    abecedarioCompleto: nivelesCompletos.some((nivel) => nivel.id === 1),
    leccionPerfecta: logrosGuardados.includes("leccion_perfecta"),
    senasAprendidas,
    // Lección de frases: la que tiene ejercicios frase_senas (se reconoce
    // por el contenido, no por el id)
    primeraFrase: leccionesHechas.some((leccion) =>
      (leccion.items || []).some((item) => item.tipo === "frase_senas"),
    ),
    nivelesCompletados,
    totalNiveles,
  });

  const progresoPct = totalNiveles
    ? Math.round((nivelesCompletados / totalNiveles) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Mi perfil</Text>
          <View style={styles.headerBotones}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setModalEditar(true)}
            >
              <Text style={styles.editBtnTxt}>✏️ Editar</Text>
            </TouchableOpacity>
            {/* Ajustes: más adelante el emoji se cambia por una imagen */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={abrirAjustes}
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
            >
              <Text style={styles.editBtnTxt}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Avatar + datos ── */}
        <View style={styles.avatarSection}>
          {/* Tocar el avatar (o el circulito 📷) abre la hoja "Foto de perfil" */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={abrirFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            {fotoAvatar && fotoAvatar !== fotoRota ? (
              <Image
                // La foto del celular siempre está en el mismo archivo: sin
                // caché y con otra key cuando cambia, si no se vería la vieja
                key={foto.version}
                source={{ uri: fotoAvatar }}
                style={styles.avatarImg}
                contentFit="cover"
                cachePolicy={fotoLocal ? "none" : "disk"}
                onError={() => setFotoRota(fotoAvatar)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarIniciales}>{iniciales}</Text>
              </View>
            )}
            <View style={styles.avatarCamara}>
              <Text style={styles.avatarCamaraTxt}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
          <Text style={styles.usuarioEmail}>{usuario.email}</Text>
          {/* Sin fecha de registro, la línea no se muestra */}
          {miembroDesde ? (
            <Text style={styles.usuarioDesde}>
              Miembro desde {miembroDesde}
            </Text>
          ) : null}
        </View>

        {/* ── Progreso general ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Progreso general</Text>
          <View style={styles.progresoWrap}>
            <View style={styles.progresoTextos}>
              <Text style={styles.progresoLabel}>
                {nivelesCompletados} de {totalNiveles} niveles
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
              valor={xpTotal}
              label="XP total"
              color="#E8A000"
            />
            <StatCard
              icono="🎯"
              valor={`${nivelesCompletados}/${totalNiveles}`}
              label="Niveles"
              color="#2E7D32"
            />
            <StatCard
              icono="📖"
              valor={`${leccionesHechas.length}/${totalLecciones}`}
              label="Lecciones completadas"
              color="#3D4FBB"
            />
            <StatCard
              icono="📚"
              valor={senasAprendidas}
              label="Señas aprendidas"
              color="#8C7CF0"
            />
          </View>
        </View>

        {/* ── Logros ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Logros — {logros.filter((l) => l.obtenido).length}/{logros.length}
          </Text>
          <View style={styles.logrosGrid}>
            {logros.map((logro) => (
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
        guardando={guardando}
        onGuardar={handleGuardar}
        onCerrar={() => setModalEditar(false)}
        onCambiarFoto={cambiarFotoDesdeEditar}
        onCerrado={editarCerrado}
      />

      {/* ── Hoja foto de perfil ── */}
      <ModalFoto
        visible={modalFoto}
        uid={usuario.id}
        hayFoto={!!fotoLocal}
        onCambio={fotoCambiada}
        onCerrar={() => setModalFoto(false)}
      />

      {/* ── Modal ajustes ── */}
      <ModalAjustes
        visible={modalAjustes}
        eliminando={eliminando}
        error={errorAjustes}
        onEliminar={handleEliminarCuenta}
        onCerrar={() => setModalAjustes(false)}
      />
    </SafeAreaView>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FC" },
  cargando: { justifyContent: "center", alignItems: "center" },
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
  // "✏️ Editar" y "⚙️" juntos, a la derecha del título
  headerBotones: { flexDirection: "row", gap: 8 },

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
  // Circulito 📷, abajo a la derecha del avatar
  avatarCamara: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCamaraTxt: { fontSize: 14 },
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
  inputSoloLectura: { color: "#888", marginBottom: 4 },
  inputAyuda: { fontSize: 12, color: "#AAAAAA", marginBottom: 16 },
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
  btnGuardar: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  btnGuardarTxt: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },

  // Modal ajustes (el botón "Eliminar cuenta" usa btnCerrarSesion)
  ajustesTexto: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 20,
  },
  btnEliminando: { opacity: 0.6 },
  // Caja roja de error, igual que en el login y el registro
  errorWrap: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorTxt: { fontSize: 14, color: "#C62828", fontWeight: "500" },

  // Hoja foto de perfil ("Guardar" usa btnGuardar, el botón principal)
  fotoOpcion: {
    backgroundColor: "#F7F8FC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E4F0",
  },
  fotoOpcionTxt: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  fotoQuitarTxt: { color: "#C62828" },
  fotoProcesando: { marginVertical: 60 },
  fotoVistaPrevia: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: "center",
    backgroundColor: "#EEF1FB",
    marginBottom: 24,
  },
  btnGuardando: { opacity: 0.6 },
  fotoCancelarBtn: {
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    marginTop: 10,
  },
  fotoCancelarTxt: { fontSize: 16, fontWeight: "700", color: "#3D4FBB" },
  // "Abrir configuración", dentro de la caja roja
  fotoConfigBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  fotoConfigTxt: { fontSize: 14, fontWeight: "700", color: "#C62828" },
});
export default ProfileScreen;
