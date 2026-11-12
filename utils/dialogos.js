import { Alert, Platform } from "react-native";

// Carteles que también funcionan en la web. Ahí Alert.alert no muestra nada,
// así que en la web se usan los del navegador (window.confirm y window.alert).
// Para un cartel nuevo, usar estas funciones en vez de Alert.alert.

// Pregunta antes de hacer algo y devuelve true si se confirmó. En la web
// Alert.alert con botones no aparece: ahí se usa window.confirm.
export const confirmar = (titulo, mensaje, textoBoton) => {
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

// Avisa algo (por ejemplo, un error) con un solo botón, "OK". La Promise se
// cumple cuando se cierra el cartel. En la web se usa window.alert.
export const avisar = (titulo, mensaje) => {
  if (Platform.OS === "web") {
    window.alert(`${titulo}\n\n${mensaje}`);
    return Promise.resolve();
  }
  return new Promise((resolver) => {
    // style "cancel": en iOS el "OK" queda igual que el que pone Alert.alert
    // cuando no le pasás botones. Sin opciones, en Android no se cierra
    // tocando afuera, igual que antes.
    Alert.alert(titulo, mensaje, [
      { text: "OK", style: "cancel", onPress: () => resolver() },
    ]);
  });
};
