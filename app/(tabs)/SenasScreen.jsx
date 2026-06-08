import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// ─── GIFs locales ─────────────────────────────────────
const GIFS_ABECEDARIO = {
  A: require("../../assets/gifs/abecedario/A.gif"),
  B: require("../../assets/gifs/abecedario/B.gif"),
  C: require("../../assets/gifs/abecedario/C.gif"),
  D: require("../../assets/gifs/abecedario/D.gif"),
  E: require("../../assets/gifs/abecedario/E.gif"),
  F: require("../../assets/gifs/abecedario/F.gif"),
  G: require("../../assets/gifs/abecedario/G.gif"),
  H: require("../../assets/gifs/abecedario/H.gif"),
  I: require("../../assets/gifs/abecedario/I.gif"),
  J: require("../../assets/gifs/abecedario/J.gif"),
  K: require("../../assets/gifs/abecedario/K.gif"),
  L: require("../../assets/gifs/abecedario/L.gif"),
  M: require("../../assets/gifs/abecedario/M.gif"),
  N: require("../../assets/gifs/abecedario/N.gif"),
  Ñ: require("../../assets/gifs/abecedario/NN.gif"),
  O: require("../../assets/gifs/abecedario/O.gif"),
  P: require("../../assets/gifs/abecedario/P.gif"),
  Q: require("../../assets/gifs/abecedario/Q.gif"),
  R: require("../../assets/gifs/abecedario/R.gif"),
  S: require("../../assets/gifs/abecedario/S.gif"),
  T: require("../../assets/gifs/abecedario/T.gif"),
  U: require("../../assets/gifs/abecedario/U.gif"),
  V: require("../../assets/gifs/abecedario/V.gif"),
  W: require("../../assets/gifs/abecedario/W.gif"),
  X: require("../../assets/gifs/abecedario/X.gif"),
  Y: require("../../assets/gifs/abecedario/Y.gif"),
  Z: require("../../assets/gifs/abecedario/Z.gif"),
};
// ─── Nombres de display para presentaciones ──────────────────────────
const NOMBRES_PRESENTACION = {
  apellido: "Apellido",
  comoestas: "¿Cómo estás?",
  comotellamas: "¿Cómo te llamás?",
  como: "¿Cómo?",
  cualestuedad: "¿Cuál es tu edad?",
  cual: "¿Cuál?",
  cuando: "¿Cuándo?",
  cuanto: "¿Cuánto?",
  deque: "¿De qué?",
  dni: "DNI",
  donde: "¿Dónde?",
  nombre: "Nombre",
  oyente: "Oyente",
  paraque: "¿Para qué?",
  porque: "¿Por qué?",
  presentandonos: "Presentándonos",
  quedice: "¿Qué dice?",
  que: "¿Qué?",
  quien: "¿Quién?",
  sordo: "Sordo/a",
};

const GIFS_PRESENTACION = {
  apellido: require("../../assets/gifs/presentaciones/apellido.gif"),
  comoestas: require("../../assets/gifs/presentaciones/comoestas.gif"),
  comotellamas: require("../../assets/gifs/presentaciones/comotellamas.gif"),
  como: require("../../assets/gifs/presentaciones/como.gif"),
  cualestuedad: require("../../assets/gifs/presentaciones/cualestuedad.gif"),
  cual: require("../../assets/gifs/presentaciones/cual.gif"),
  cuando: require("../../assets/gifs/presentaciones/cuando.gif"),
  cuanto: require("../../assets/gifs/presentaciones/cuanto.gif"),
  deque: require("../../assets/gifs/presentaciones/deque.gif"),
  dni: require("../../assets/gifs/presentaciones/dni.gif"),
  donde: require("../../assets/gifs/presentaciones/donde.gif"),
  nombre: require("../../assets/gifs/presentaciones/nombre.gif"),
  oyente: require("../../assets/gifs/presentaciones/oyente.gif"),
  paraque: require("../../assets/gifs/presentaciones/paraque.gif"),
  porque: require("../../assets/gifs/presentaciones/porque.gif"),
  presentandonos: require("../../assets/gifs/presentaciones/presentandonos.gif"),
  quedice: require("../../assets/gifs/presentaciones/quedice.gif"),
  que: require("../../assets/gifs/presentaciones/que.gif"),
  quien: require("../../assets/gifs/presentaciones/quien.gif"),
  sordo: require("../../assets/gifs/presentaciones/sordo.gif"),
};
// ─── Datos ───────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: "abecedario",
    nombre: "Abecedario dactilológico",
    emoji: "🤟",
    color: "#EEF1FB",
    borderColor: "#C8D3F5",
    disponible: true,
    items: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "Ñ",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ].map((letra) => ({
      id: letra,
      titulo: `Letra ${letra}`,
      subtitulo: "Abecedario LSA",
      gifSource: GIFS_ABECEDARIO[letra], // ← GIF local
    })),
  },
  {
    id: "presentacion",
    nombre: "Presentaciones",
    emoji: "👋",
    color: "#E8F5E9",
    borderColor: "#A5D6A7",
    disponible: true,
    items: Object.keys(GIFS_PRESENTACION).map((key) => ({
      id: key,
      titulo: NOMBRES_PRESENTACION[key], // ← nombre legible
      subtitulo: "Presentaciones LSA",
      gifSource: GIFS_PRESENTACION[key],
    })),
  },
  {
    id: "numeros",
    nombre: "Números",
    emoji: "🔢",
    color: "#FFF8E1",
    borderColor: "#FFE082",
    disponible: false,
    items: [],
  },
  {
    id: "familia",
    nombre: "Familia",
    emoji: "👨‍👩‍👧",
    color: "#FCE4EC",
    borderColor: "#F48FB1",
    disponible: false,
    items: [],
  },
  {
    id: "colores",
    nombre: "Colores",
    emoji: "🎨",
    color: "#F3E5F5",
    borderColor: "#CE93D8",
    disponible: false,
    items: [],
  },
  {
    id: "acciones",
    nombre: "Acciones",
    emoji: "⚡",
    color: "#E0F7FA",
    borderColor: "#80DEEA",
    disponible: false,
    items: [],
  },
];

// ─── Modal de GIF con swipe ───────────────────────────────────────────
const VideoModal = ({ visible, items, indice, onNavegar, onClose }) => {
  if (!items || items.length === 0) return null;
  const item = items[indice];

  // Refs para que el PanResponder (creado una sola vez) siempre lea valores frescos
  const indiceRef = useRef(indice);
  const itemsRef = useRef(items);
  const onNavegarRef = useRef(onNavegar);
  indiceRef.current = indice;
  itemsRef.current = items;
  onNavegarRef.current = onNavegar;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 12,
      onPanResponderRelease: (_, gs) => {
        const idx = indiceRef.current;
        const list = itemsRef.current;
        if (gs.dx < -50 && idx < list.length - 1) onNavegarRef.current(idx + 1);
        else if (gs.dx > 50 && idx > 0) onNavegarRef.current(idx - 1);
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.videoModalOverlay}>
        <View style={styles.videoModalCard}>
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitulo}>{item.titulo}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.videoModalCerrar}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* GIF con flechas a los costados */}
          <View style={styles.videoPlayerRow}>
            <TouchableOpacity
              style={[styles.arrowBtn, indice === 0 && styles.arrowBtnDisabled]}
              onPress={() => indice > 0 && onNavegar(indice - 1)}
              activeOpacity={indice > 0 ? 0.7 : 1}
            >
              <Text style={[styles.arrowTxt, indice === 0 && styles.arrowTxtDisabled]}>
                ‹
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.videoPlayer, { flex: 1, marginBottom: 0 }]}
              {...panResponder.panHandlers}
            >
              {item.gifSource ? (
                <Image
                  source={item.gifSource}
                  style={styles.gifImagen}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Text style={styles.videoPlayerEmoji}>🤟</Text>
                  <Text style={styles.videoPlayerTxt}>{item.titulo}</Text>
                  <Text style={styles.videoPlayerSub}>GIF próximamente</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.arrowBtn,
                indice === items.length - 1 && styles.arrowBtnDisabled,
              ]}
              onPress={() => indice < items.length - 1 && onNavegar(indice + 1)}
              activeOpacity={indice < items.length - 1 ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.arrowTxt,
                  indice === items.length - 1 && styles.arrowTxtDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.navContador}>
            {indice + 1} / {items.length}
          </Text>
          <Text style={styles.videoModalSub}>{item.subtitulo}</Text>

          <TouchableOpacity style={styles.btnPrincipal} onPress={onClose}>
            <Text style={styles.btnPrincipalTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Pantalla interior de categoría ─────────────────────────────────
const CategoriaDetalle = ({ categoria, busqueda, onBack, onItemPress }) => {
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return categoria.items;
    return categoria.items.filter((item) =>
      item.titulo.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [busqueda, categoria.items]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.catHeader,
          {
            backgroundColor: categoria.color,
            borderBottomColor: categoria.borderColor,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.catHeaderCenter}>
          <Text style={styles.catHeaderEmoji}>{categoria.emoji}</Text>
          <Text style={styles.catHeaderNombre}>{categoria.nombre}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {itemsFiltrados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTxt}>No se encontraron señas</Text>
        </View>
      ) : (
        <FlatList
          data={itemsFiltrados}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.itemsGrid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemCard, { borderColor: categoria.borderColor }]}
              onPress={() => onItemPress(item, categoria.items)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.itemVideoThumb,
                  { backgroundColor: categoria.color },
                ]}
              >
                {/* Preview del GIF en la card */}
                {item.gifSource ? (
                  <Image
                    source={item.gifSource}
                    style={styles.gifPreview}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.itemLetra}>{item.id}</Text>
                )}
              </View>
              <Text style={styles.itemTitulo} numberOfLines={1}>
                {item.titulo}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

// ─── Pantalla principal ──────────────────────────────────────────────
const SenasScreen = () => {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [itemsModal, setItemsModal] = useState([]);
  const [indiceModal, setIndiceModal] = useState(0);

  const resultadosGlobales = useMemo(() => {
    if (!busqueda.trim()) return [];
    const resultados = [];
    CATEGORIAS.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.titulo.toLowerCase().includes(busqueda.toLowerCase())) {
          resultados.push({ ...item, categoria: cat });
        }
      });
    });
    return resultados;
  }, [busqueda]);

  const handleItemPress = (item, listaCompleta) => {
    const idx = listaCompleta.findIndex((i) => i.id === item.id);
    setItemsModal(listaCompleta);
    setIndiceModal(idx >= 0 ? idx : 0);
    setVideoVisible(true);
  };

  const enBusquedaGlobal = busqueda.trim().length > 0 && !categoriaActiva;

  return (
    <SafeAreaView style={styles.container}>
      {!categoriaActiva && (
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Señas</Text>
          <Text style={styles.headerSub}>Buscá y aprendé señas en LSA</Text>
        </View>
      )}

      <View style={styles.buscadorWrap}>
        <View style={styles.buscador}>
          <Text style={styles.buscadorIcono}>🔍</Text>
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar seña..."
            placeholderTextColor="#9CA3AF"
            value={busqueda}
            onChangeText={(t) => {
              setBusqueda(t);
              if (t.trim()) setCategoriaActiva(null);
            }}
            autoCapitalize="none"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Text style={styles.buscadorLimpiar}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {categoriaActiva ? (
        <CategoriaDetalle
          categoria={categoriaActiva}
          busqueda={busqueda}
          onBack={() => {
            setCategoriaActiva(null);
            setBusqueda("");
          }}
          onItemPress={handleItemPress}
        />
      ) : enBusquedaGlobal ? (
        <FlatList
          data={resultadosGlobales}
          keyExtractor={(item) => item.id + item.categoria.id}
          contentContainerStyle={styles.busquedaResultados}
          ListHeaderComponent={
            <Text style={styles.busquedaHeader}>
              {resultadosGlobales.length} resultado
              {resultadosGlobales.length !== 1 ? "s" : ""}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🤷</Text>
              <Text style={styles.emptyTxt}>
                No encontramos esa seña todavía
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultadoRow}
              onPress={() => handleItemPress(item, resultadosGlobales)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.resultadoThumb,
                  { backgroundColor: item.categoria.color },
                ]}
              >
                {item.gifSource ? (
                  <Image
                    source={item.gifSource}
                    style={styles.gifPreviewResultado}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.resultadoLetra}>{item.id}</Text>
                )}
              </View>
              <View style={styles.resultadoInfo}>
                <Text style={styles.resultadoTitulo}>{item.titulo}</Text>
                <Text style={styles.resultadoCat}>{item.categoria.nombre}</Text>
              </View>
              <Text style={styles.resultadoFlecha}>▶</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.categoriasGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.seccionTitulo}>Categorías</Text>
          <View style={styles.grid}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catCard,
                  { backgroundColor: cat.color, borderColor: cat.borderColor },
                  !cat.disponible && styles.catCardBloqueada,
                ]}
                onPress={() => cat.disponible && setCategoriaActiva(cat)}
                activeOpacity={cat.disponible ? 0.75 : 1}
              >
                {!cat.disponible && <Text style={styles.catLockIcon}>🔒</Text>}
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.catNombre,
                    !cat.disponible && styles.catNombreBloqueada,
                  ]}
                >
                  {cat.nombre}
                </Text>
                {cat.disponible && (
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeTxt}>
                      {cat.items.length} señas
                    </Text>
                  </View>
                )}
                {!cat.disponible && (
                  <Text style={styles.catProximo}>Próximamente</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <VideoModal
        visible={videoVisible}
        items={itemsModal}
        indice={indiceModal}
        onNavegar={(nuevoIndice) => setIndiceModal(nuevoIndice)}
        onClose={() => setVideoVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FC" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitulo: { fontSize: 28, fontWeight: "800", color: "#1A1A2E" },
  headerSub: { fontSize: 14, color: "#888", marginTop: 2 },

  buscadorWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "#E0E4F0",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buscadorIcono: { fontSize: 17 },
  buscadorInput: { flex: 1, fontSize: 15, color: "#1A1A2E" },
  buscadorLimpiar: { fontSize: 16, color: "#BDBDBD", paddingLeft: 6 },

  categoriasGrid: { paddingHorizontal: 16, paddingBottom: 40 },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  catCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    position: "relative",
  },
  catCardBloqueada: { opacity: 0.55 },
  catLockIcon: { position: "absolute", top: 10, right: 12, fontSize: 14 },
  catEmoji: { fontSize: 38, marginBottom: 10 },
  catNombre: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
  },
  catNombreBloqueada: { color: "#AAAAAA" },
  catBadge: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  catBadgeTxt: { fontSize: 11, fontWeight: "600", color: "#3D4FBB" },
  catProximo: { fontSize: 11, color: "#AAAAAA", marginTop: 6 },

  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 14, fontWeight: "600", color: "#3D4FBB" },
  catHeaderCenter: { flex: 1, alignItems: "center" },
  catHeaderEmoji: { fontSize: 22 },
  catHeaderNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 2,
    textAlign: "center",
  },

  itemsGrid: { padding: 12, gap: 10 },
  itemCard: {
    flex: 1,
    margin: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemVideoThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden", // ← necesario para que el GIF no se salga del borde
  },
  gifPreview: {
    width: 56,
    height: 56,
  },
  gifPreviewResultado: {
    width: 44,
    height: 44,
  },
  itemLetra: { fontSize: 26, fontWeight: "800", color: "#3D4FBB" },
  itemTitulo: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },

  busquedaResultados: { paddingHorizontal: 16, paddingBottom: 40 },
  busquedaHeader: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    fontWeight: "600",
  },
  resultadoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E4F0",
  },
  resultadoThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  resultadoLetra: { fontSize: 22, fontWeight: "800", color: "#3D4FBB" },
  resultadoInfo: { flex: 1 },
  resultadoTitulo: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  resultadoCat: { fontSize: 12, color: "#888", marginTop: 2 },
  resultadoFlecha: { fontSize: 14, color: "#C8D3F5" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: "#888", textAlign: "center" },

  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  videoModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  videoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  videoModalTitulo: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  videoModalCerrar: { fontSize: 20, color: "#BDBDBD", padding: 4 },
  videoPlayer: {
    height: 240,
    backgroundColor: "#EEF1FB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    overflow: "hidden", // ← necesario para el GIF en el modal
  },
  gifImagen: {
    width: "100%",
    height: "100%",
  },
  videoPlayerEmoji: { fontSize: 52, marginBottom: 8 },
  videoPlayerTxt: { fontSize: 18, fontWeight: "700", color: "#3D4FBB" },
  videoPlayerSub: { fontSize: 13, color: "#888", marginTop: 4 },
  videoModalSub: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },
  btnPrincipal: {
    backgroundColor: "#C8D3F5",
    borderRadius: 25,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrincipalTxt: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },

  videoPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF1FB",
    borderWidth: 1.5,
    borderColor: "#C8D3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowBtnDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E8E8E8",
  },
  arrowTxt: {
    fontSize: 26,
    color: "#3D4FBB",
    fontWeight: "300",
    lineHeight: 30,
  },
  arrowTxtDisabled: {
    color: "#CCCCCC",
  },
  navContador: {
    fontSize: 13,
    fontWeight: "600",
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 6,
  },
});

export default SenasScreen;
