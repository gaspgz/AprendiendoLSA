import { useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── Ver u ocultar la contraseña (lo usan el login y el registro) ──

// El texto sin su último carácter (Array.from para no cortar un emoji).
const sinUltima = (texto) => Array.from(texto).slice(0, -1).join("");

// iOS: al volver a ocultar la contraseña, la tecla siguiente BORRA todo lo
// escrito y deja solo esa tecla (o nada, si fue "borrar"). Si pasó eso,
// devuelve lo que había con esa tecla aplicada. Si fue un cambio normal,
// lo devuelve tal cual.
const recuperarSiIOSBorro = (anterior, nuevo) => {
  const cambioNormal =
    anterior === "" || nuevo.length > 1 || nuevo === sinUltima(anterior);
  if (cambioNormal) return nuevo;
  return nuevo === "" ? sinUltima(anterior) : anterior + nuevo;
};

// Campo de contraseña con un botón adentro, a la derecha, para verla u
// ocultarla. Arranca oculta y cada campo tiene su propio botón.
// `style` es el estilo del campo (cada pantalla pasa el suyo); las demás
// props (placeholder, editable, autoComplete...) van directo al TextInput.
const CampoPassword = ({ value, onChangeText, style, ...props }) => {
  const [visible, setVisible] = useState(false);
  // Solo en iOS: queda en true desde que se oculta hasta la primera tecla
  // normal, para revisar si iOS borró lo escrito.
  const recienOcultada = useRef(false);

  const alternarVisible = () => {
    recienOcultada.current = Platform.OS === "ios" && visible;
    setVisible(!visible);
  };

  const cambiarTexto = (nuevo) => {
    let texto = nuevo;
    if (recienOcultada.current) {
      texto = recuperarSiIOSBorro(value, nuevo);
      if (texto === nuevo) recienOcultada.current = false;
    }
    onChangeText(texto);
  };

  return (
    <View>
      <TextInput
        {...props}
        style={[style, styles.inputPassword]}
        value={value}
        onChangeText={cambiarTexto}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.ojoBtn}
        onPress={alternarVisible}
        hitSlop={5}
        accessibilityRole="button"
        accessibilityLabel={
          visible ? "Ocultar contraseña" : "Mostrar contraseña"
        }
      >
        <Text style={styles.ojoTxt}>{visible ? "🙈" : "👁️"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Lugar a la derecha para que el texto no quede debajo del botón
  inputPassword: { paddingRight: 50 },
  // Botón de 40×40 (con hitSlop se puede tocar en 50×50)
  ojoBtn: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ojoTxt: { fontSize: 20 },
});

export default CampoPassword;
