import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SenaGif, { linkDeSena } from "../../components/SenaGif";
import { precargar } from "../../services/precargaSenas";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
// Espacio entre tarjetas de categoría (gap de la grilla)
const GAP_CATEGORIAS = 14;
// Tarjeta de categoría ancha (anchoCompleto): dos columnas más el espacio
// entre ellas, así sus bordes quedan alineados con los de la grilla
const ANCHO_CATEGORIA_COMPLETA = CARD_WIDTH * 2 + GAP_CATEGORIAS;
// Ancho máximo de una tarjeta de seña (grilla de 3 columnas): así, si la
// última fila queda incompleta, sus tarjetas no se estiran
const ANCHO_TARJETA_SENA = (SCREEN_WIDTH - 24) / 3 - 10;

// ─── Colores por categoría ───────────────────────────────────────────
// Solo colores que ya usa la app. Nada de rojo: en la app significa error.
const LILA = { fondo: "#EEF1FB", borde: "#C8D3F5", texto: "#3D4FBB" };
const DORADO = { fondo: "#FFF8E1", borde: "#F5CE5A", texto: "#5A3E00" };
const VIOLETA = { fondo: "#F4F2FD", borde: "#A99BF7", texto: "#8C7CF0" };
const VERDE = { fondo: "#E8F5E9", borde: "#A5D6A7", texto: "#2E7D32" };

// Clave = id de la categoría en CATEGORIAS. Dos categorías vecinas en la
// lista nunca comparten color.
const COLORES_CATEGORIA = {
  abecedario: LILA,
  presentacion: VERDE,
  Interacciones: DORADO,
  Sentimientos: VIOLETA,
  Numeros: LILA,
  familia: DORADO,
  pronombres: VERDE,
  acciones: VERDE,
};

// Para categorías nuevas que todavía no estén en COLORES_CATEGORIA
const COLOR_CATEGORIA_DEFECTO = {
  fondo: "#fff",
  borde: "#E0E4F0",
  texto: "#3D4FBB",
};

const colorDeCategoria = (categoriaId) =>
  COLORES_CATEGORIA[categoriaId] ?? COLOR_CATEGORIA_DEFECTO;

// ─── GIFs de las señas ───────────────────────────────────────────────
// Los GIFs están en la nube: SenaGif (components/SenaGif.jsx) muestra cada
// seña desde su clave de la app, la misma de NIVELES y constants/gifsNube.js.
// Las señas que en esta pantalla se llaman distinto se traducen acá, en un
// solo lugar; todas las demás se llaman igual en los dos lados.
const CLAVE_EN_LA_APP = {
  Ch: "CH",
  Ll: "LL",
  1: "n1",
  2: "n2",
  3: "n3",
  4: "n4",
  5: "n5",
  6: "n6",
  7: "n7",
  8: "n8",
  9: "n9",
  10: "n10",
  11: "n11",
  12: "n12",
  13: "n13",
  14: "n14",
  15: "n15",
  16: "n16",
  17: "n17",
  18: "n18",
  19: "n19",
  20: "n20",
  30: "n30",
  40: "n40",
  50: "n50",
  60: "n60",
  70: "n70",
  80: "n80",
  90: "n90",
  100: "n100",
  1000: "n1000",
};
const claveApp = (nombre) => CLAVE_EN_LA_APP[nombre] ?? nombre;
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

// ─── Interacciones cotidianas ────────────────────────────────────────

const NOMBRES_INTERACCIONES = {
  basta: "Basta",
  bien: "Bien",
  bienvenida: "Bienvenida",
  buenasnoches: "Buenas noches",
  buenastardes: "Buenas tardes",
  buendia: "Buen día",
  chau: "Chau",
  comunicar: "Comunicar",
  conversar: "Conversar",
  denada: "De Nada",
  gracias: "Gracias",
  hablaroral: "Hablar Oral",
  hablarsenas: "Hablar Señas",
  hola: "Hola",
  llamar: "Llamar",
  mal: "Mal",
  no: "No",
  perdon: "Perdón",
  permiso: "Permiso",
  porfavor: "Por favor",
  porejemplo: "Por ejemplo",
  saludos: "Saludos",
  si: "Si",
};

// ─── Sentimientos ──────────────────────────────────────────────────

const NOMBRES_SENTIMIENTOS = {
  aburrido: "Aburrido",
  alegre: "Alegre",
  amar: "Amar",
  asustado: "Asustado",
  cansado: "Cansado",
  caprichoso: "Caprichoso",
  contento: "Contento",
  culpa: "Culpa",
  deprimido: "Deprimido",
  loco: "Loco",
  feliz: "Feliz",
  gracioso: "Gracioso",
  llorar: "Llorar",
  miedoso: "Miedoso",
  nervioso: "Nervioso",
  orgulloso: "Orgulloso",
  preocupado: "Preocupado",
  sentimientos: "Sentimientos",
  sorprendido: "Sorprendido",
  verguenza: "Vergüenza",
  tranquilo: "Tranquilo",
  triste: "Triste",
};

const NOMBRES_NUMEROS = {
  1: "Uno",
  2: "Dos",
  3: "Tres",
  4: "Cuatro",
  5: "Cinco",
  6: "Seis",
  7: "Siete",
  8: "Ocho",
  9: "Nueve",
  10: "Diez",
  11: "Once",
  12: "Doce",
  13: "Trece",
  14: "Catorce",
  15: "Quince",
  16: "Dieciséis",
  17: "Diecisiete",
  18: "Dieciocho",
  19: "Diecinueve",
  20: "Veinte",
  30: "Treinta",
  40: "Cuarenta",
  50: "Cincuenta",
  60: "Sesenta",
  70: "Setenta",
  80: "Ochenta",
  90: "Noventa",
  100: "Cien",
  1000: "Mil",
  numeros: "Números",
};

// ─── Familia y vínculos ──────────────────────────────────────────────

const NOMBRES_FAMILIA = {
  abuelo: "Abuelo",
  bebe: "Bebé",
  bisabuelo: "Bisabuelo",
  familia: "Familia",
  gemelos: "Gemelos",
  hermano: "Hermano",
  hijastro: "Hijastro",
  hijo: "Hijo",
  madrastra: "Madrastra",
  mama: "Mamá",
  mellizos: "Mellizos",
  padrastro: "Padrastro",
  papa: "Papá",
  primo: "Primo",
  sobrino: "Sobrino",
  tio: "Tío",
  amante: "Amante",
  casados: "Casados",
  cunado: "Cuñado",
  divorciado: "Divorciado",
  juntos: "Juntos",
  novio: "Novio",
  pareja: "Pareja",
  separados: "Separados",
  soltero: "Soltero",
  suegro: "Suegro",
};

// ─── Pronombres ──────────────────────────────────────────────────────

const NOMBRES_PRONOMBRES = {
  el_ella: "Él/Ella",
  ellos_ellas: "Ellos/Ellas",
  mio: "Mío",
  nosotros: "Nosotros",
  tuyo: "Tuyo",
  vos: "Vos",
  yo: "Yo",
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
      "Ch",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "Ll",
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
      clave: claveApp(letra),
    })),
  },
  {
    id: "presentacion",
    nombre: "Presentaciones",
    emoji: "👋",
    color: "#E8F5E9",
    borderColor: "#A5D6A7",
    disponible: true,
    items: Object.keys(NOMBRES_PRESENTACION).map((key) => ({
      id: key,
      titulo: NOMBRES_PRESENTACION[key], // ← nombre legible
      subtitulo: "Presentaciones LSA",
      clave: claveApp(key),
    })),
  },
  {
    id: "Interacciones",
    nombre: "Interacciones Cotidianas",
    emoji: "🙋",
    color: "#FFF8E1",
    borderColor: "#F5CE5A",
    disponible: true,
    items: Object.keys(NOMBRES_INTERACCIONES).map((key) => ({
      id: key,
      titulo: NOMBRES_INTERACCIONES[key],
      subtitulo: "Interacciones Cotidianas LSA",
      clave: claveApp(key),
    })),
  },
  {
    id: "Sentimientos",
    nombre: "Sentimientos",
    emoji: "😊",
    color: "#F4F2FD",
    borderColor: "#A99BF7",
    disponible: true,
    items: Object.keys(NOMBRES_SENTIMIENTOS).map((key) => ({
      id: key,
      titulo: NOMBRES_SENTIMIENTOS[key],
      subtitulo: "Sentimientos LSA",
      clave: claveApp(key),
    })),
  },
  {
    id: "Numeros",
    nombre: "Números",
    emoji: "🔢",
    color: "#EEF1FB",
    borderColor: "#C8D3F5",
    disponible: true,
    items: Object.keys(NOMBRES_NUMEROS).map((key) => ({
      id: key,
      titulo: NOMBRES_NUMEROS[key],
      subtitulo: "Números LSA",
      clave: claveApp(key),
    })),
  },
  {
    id: "familia",
    nombre: "Familia y vínculos",
    emoji: "👪",
    color: "#FFF8E1",
    borderColor: "#F5CE5A",
    disponible: true,
    items: Object.keys(NOMBRES_FAMILIA).map((key) => ({
      id: key,
      titulo: NOMBRES_FAMILIA[key],
      subtitulo: "Familia y vínculos LSA",
      clave: claveApp(key),
    })),
  },
  {
    id: "pronombres",
    nombre: "Pronombres",
    emoji: "👥",
    color: "#E8F5E9",
    borderColor: "#A5D6A7",
    disponible: true,
    // Tarjeta horizontal que ocupa todo el ancho de la grilla
    anchoCompleto: true,
    items: Object.keys(NOMBRES_PRONOMBRES).map((key) => ({
      id: key,
      titulo: NOMBRES_PRONOMBRES[key],
      subtitulo: "Pronombres LSA",
      clave: claveApp(key),
    })),
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
              <Text
                style={[
                  styles.arrowTxt,
                  indice === 0 && styles.arrowTxtDisabled,
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.videoPlayer, { flex: 1, marginBottom: 0 }]}
              {...panResponder.panHandlers}
            >
              <SenaGif clave={item.clave} style={styles.gifImagen} />
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

// ─── Tarjeta de seña (grilla y búsqueda) ─────────────────────────────
// Solo texto, sin GIF ni Image: así la grilla no decodifica ninguna
// animación. El GIF se carga recién al abrir la seña en el modal.

// Qué muestra la tarjeta: la letra o el número grandes; para palabras y
// frases, el nombre de la seña.
const contenidoTarjeta = (item, categoriaId) => {
  if (categoriaId === "abecedario") {
    return { tipo: "letra", texto: item.id.toUpperCase() };
  }
  if (categoriaId === "Numeros" && /^\d+$/.test(item.id)) {
    return { tipo: "numero", texto: item.id };
  }
  return { tipo: "palabra", texto: item.titulo ?? item.id };
};

const etiquetaAccesible = ({ tipo, texto }) => {
  if (tipo === "letra") return `Seña de la letra ${texto}`;
  if (tipo === "numero") return `Seña del número ${texto}`;
  return `Seña de ${texto}`;
};

const TarjetaSena = ({ item, categoria, mostrarCategoria, onPress }) => {
  const colores = colorDeCategoria(categoria.id);
  const contenido = contenidoTarjeta(item, categoria.id);
  const esPalabra = contenido.tipo === "palabra";
  // Las frases usan hasta 2 líneas. Una palabra sola va en 1 línea y se
  // achica si no entra: con 2 líneas se cortaría a la mitad de la palabra.
  const lineas = esPalabra && contenido.texto.includes(" ") ? 2 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        { backgroundColor: colores.fondo, borderColor: colores.borde },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={
        mostrarCategoria
          ? `${etiquetaAccesible(contenido)}, ${categoria.nombre}`
          : etiquetaAccesible(contenido)
      }
    >
      <Text
        style={[
          esPalabra ? styles.itemTextoPalabra : styles.itemTextoGrande,
          { color: colores.texto },
        ]}
        numberOfLines={lineas}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {contenido.texto}
      </Text>
      {mostrarCategoria && (
        <Text
          style={[styles.itemCategoria, { color: colores.texto }]}
          numberOfLines={1}
        >
          {categoria.nombre}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Tarjeta de categoría ancha ──────────────────────────────────────
// Para las categorías con anchoCompleto: ocupa toda la fila de la grilla y
// va en horizontal (ícono, nombre y cantidad, flecha). Mismo radio, borde y
// colores que las demás tarjetas de categoría.
const TarjetaCategoriaAncha = ({ categoria, onPress }) => {
  const colores = colorDeCategoria(categoria.id);
  const cantidad = `${categoria.items.length} señas`;

  return (
    <TouchableOpacity
      style={[styles.catAnchaSombra, { backgroundColor: categoria.color }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Categoría ${categoria.nombre}, ${cantidad}`}
    >
      <View
        style={[
          styles.catAnchaInterior,
          {
            backgroundColor: categoria.color,
            borderColor: categoria.borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.catAnchaCirculo,
            {
              backgroundColor: categoria.color,
              borderColor: categoria.borderColor,
            },
          ]}
        >
          <Text style={styles.catAnchaEmoji}>{categoria.emoji}</Text>
        </View>
        <View style={styles.catAnchaTextos}>
          <Text style={styles.catAnchaNombre}>{categoria.nombre}</Text>
          <Text style={[styles.catAnchaCantidad, { color: colores.texto }]}>
            {cantidad}
          </Text>
        </View>
        <Text style={[styles.catAnchaFlecha, { color: colores.texto }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Búsqueda ────────────────────────────────────────────────────────
// Deja un texto listo para comparar; pasan por acá la búsqueda y los
// nombres de las señas: minúsculas, sin tildes, sin ¿?¡!., y sin espacios
// de más. Así "mio" encuentra "Mío". Por cómo funciona NFD, la ñ queda como
// n ("nino" encuentra "niño"). Es solo para comparar: lo que se muestra no
// cambia.
const normalizarBusqueda = (texto) =>
  String(texto ?? "")
    .toLowerCase()
    .normalize("NFD") // separa cada letra de su tilde (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, "") // saca las tildes sueltas
    .replace(/[¿?¡!.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ─── Pantalla interior de categoría ─────────────────────────────────
const CategoriaDetalle = ({ categoria, busqueda, onBack, onItemPress }) => {
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return categoria.items;
    const buscado = normalizarBusqueda(busqueda);
    return categoria.items.filter((item) =>
      normalizarBusqueda(item.titulo).includes(buscado),
    );
  }, [busqueda, categoria.items]);

  const colores = colorDeCategoria(categoria.id);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.catHeader,
          {
            backgroundColor: colores.fondo,
            borderBottomColor: colores.borde,
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
            <TarjetaSena
              item={item}
              categoria={categoria}
              onPress={() => onItemPress(item, categoria.items)}
            />
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
    const buscado = normalizarBusqueda(busqueda);
    const resultados = [];
    CATEGORIAS.forEach((cat) => {
      cat.items.forEach((item) => {
        if (normalizarBusqueda(item.titulo).includes(buscado)) {
          resultados.push({ ...item, categoria: cat });
        }
      });
    });
    return resultados;
  }, [busqueda]);

  // En el modal se precargan la seña anterior y la siguiente: al pasar con
  // las flechas o deslizando, ya están bajadas
  const mostrarSena = (lista, indice) => {
    setIndiceModal(indice);
    precargar(
      [lista[indice - 1], lista[indice + 1]].map(
        (sena) => sena && linkDeSena(sena.clave),
      ),
    );
  };

  const handleItemPress = (item, listaCompleta) => {
    const idx = listaCompleta.findIndex((i) => i.id === item.id);
    setItemsModal(listaCompleta);
    mostrarSena(listaCompleta, idx >= 0 ? idx : 0);
    setVideoVisible(true);
  };

  const enBusquedaGlobal = busqueda.trim().length > 0 && !categoriaActiva;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          numColumns={3}
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
            <TarjetaSena
              item={item}
              categoria={item.categoria}
              mostrarCategoria
              onPress={() => handleItemPress(item, resultadosGlobales)}
            />
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.categoriasGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.seccionTitulo}>Categorías</Text>
          <View style={styles.grid}>
            {CATEGORIAS.map((cat) =>
              cat.anchoCompleto ? (
                <TarjetaCategoriaAncha
                  key={cat.id}
                  categoria={cat}
                  onPress={() => cat.disponible && setCategoriaActiva(cat)}
                />
              ) : (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    {
                      backgroundColor: cat.color,
                      borderColor: cat.borderColor,
                    },
                    !cat.disponible && styles.catCardBloqueada,
                  ]}
                  onPress={() => cat.disponible && setCategoriaActiva(cat)}
                  activeOpacity={cat.disponible ? 0.75 : 1}
                >
                  {!cat.disponible && (
                    <Text style={styles.catLockIcon}>🔒</Text>
                  )}
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
              ),
            )}
          </View>
        </ScrollView>
      )}

      <VideoModal
        visible={videoVisible}
        items={itemsModal}
        indice={indiceModal}
        onNavegar={(nuevoIndice) => mostrarSena(itemsModal, nuevoIndice)}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP_CATEGORIAS },
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

  // Tarjeta de categoría ancha. Dos capas porque en Android elevation y
  // overflow:'hidden' se cancelan: afuera la sombra (con fondo, porque sin
  // fondo Android no dibuja la elevation) y adentro el borderRadius con
  // overflow:'hidden'.
  catAnchaSombra: {
    width: ANCHO_CATEGORIA_COMPLETA,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  catAnchaInterior: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  // Tiene el mismo fondo que la tarjeta: sin el borde no se vería
  catAnchaCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  catAnchaEmoji: { fontSize: 32 },
  catAnchaTextos: { flex: 1 },
  catAnchaNombre: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  catAnchaCantidad: { fontSize: 12, fontWeight: "600", marginTop: 3 },
  catAnchaFlecha: { fontSize: 32, fontWeight: "300", lineHeight: 36 },

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
  // Tarjeta de seña: fondo, borde y texto los pone el color de la categoría.
  // No lleva overflow:'hidden', así la sombra (elevation) anda en Android.
  itemCard: {
    flex: 1,
    maxWidth: ANCHO_TARJETA_SENA,
    height: 96,
    margin: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemTextoGrande: { fontSize: 34, fontWeight: "800", textAlign: "center" },
  itemTextoPalabra: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  itemCategoria: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },

  busquedaResultados: { paddingHorizontal: 16, paddingBottom: 40 },
  busquedaHeader: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    fontWeight: "600",
  },
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
