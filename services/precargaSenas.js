import { Image } from "expo-image";

// Precarga de GIFs de señas en la caché del disco de expo-image, la misma que
// usa SenaGif: cuando la seña aparece en pantalla, ya está en el celular.
//
// Image.prefetch no se puede frenar a la mitad: cancelar() hace que no
// arranque ninguna descarga nueva, y las que ya estaban en curso (como mucho
// 2) terminan solas.

// Nunca falla: si no se pudo bajar, SenaGif la vuelve a pedir al mostrarla
const bajar = (link) => Image.prefetch(link, "disk").catch(() => false);

// Al abrir una lección: listaParaAbrir se cumple cuando bajaron los
// `primeros` links (o a los `tope` ms, para no trabar la lección si la red
// está lenta). seguirEnSegundoPlano() baja el resto de a `deA` y en orden,
// recién cuando terminaron los primeros, así no compiten con ellos.
export const crearPrecarga = (
  links,
  { primeros = 3, tope = 8000, deA = 2 } = {},
) => {
  let cancelada = false;
  let enMarcha = false;
  const resto = links.slice(primeros);
  const primerosListos = Promise.all(links.slice(0, primeros).map(bajar));

  let reloj;
  const listaParaAbrir = Promise.race([
    primerosListos,
    new Promise((resolver) => {
      reloj = setTimeout(resolver, tope);
    }),
  ]).then(() => clearTimeout(reloj));

  const seguirEnSegundoPlano = () => {
    if (enMarcha) return;
    enMarcha = true;
    primerosListos.then(() => {
      let siguiente = 0;
      const trabajador = async () => {
        while (!cancelada && siguiente < resto.length)
          await bajar(resto[siguiente++]);
      };
      for (let i = 0; i < deA; i++) trabajador();
    });
  };

  return {
    listaParaAbrir,
    seguirEnSegundoPlano,
    cancelar: () => {
      cancelada = true;
    },
  };
};

// Para el modal de Señas: la anterior y la siguiente (las que falten se saltean)
export const precargar = (links) => links.filter(Boolean).forEach(bajar);
