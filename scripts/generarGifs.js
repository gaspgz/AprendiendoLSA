// generarGifs.js
// Genera constants/gifsNube.js a partir de docs/gifs_nube.json: un objeto
// { claveApp: "https://..." } con el link de cada seña, en el mismo orden que
// el json. La app saca los GIFs de ahí (components/SenaGif.jsx).
//
// Uso (parado en la carpeta del proyecto):
//   node scripts/generarGifs.js
//
// Correlo cada vez que cambie docs/gifs_nube.json (por ejemplo, si se vuelve
// a subir una seña y cambia su link). No usa la API: solo lee el json.
const fs = require("fs");
const path = require("path");

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "docs", "gifs_nube.json");
const SALIDA = path.join(RAIZ, "constants", "gifsNube.js");
const ANCHO = 80; // el mismo largo de línea que usa Prettier

const fallar = (mensaje) => {
  console.error(`generarGifs: ${mensaje}. No se escribió nada.`);
  process.exit(1);
};

if (!fs.existsSync(ENTRADA))
  fallar(
    "no encontré docs/gifs_nube.json (¿estás parado en la carpeta del proyecto?)",
  );

let gifs;
try {
  ({ gifs } = JSON.parse(fs.readFileSync(ENTRADA, "utf8")));
} catch (e) {
  fallar(`no se pudo leer ${path.relative(RAIZ, ENTRADA)} (${e.message})`);
}
if (!Array.isArray(gifs) || gifs.length === 0) fallar('falta la lista "gifs"');

// Una sola entrada por clave, con un link https propio
const claves = new Set();
const links = new Set();
for (const g of gifs) {
  if (!g || typeof g.claveApp !== "string" || !g.claveApp)
    fallar(`hay una entrada sin claveApp: ${JSON.stringify(g)}`);
  if (typeof g.gif !== "string" || !g.gif.startsWith("https://"))
    fallar(`"${g.claveApp}" no tiene un link https`);
  if (claves.has(g.claveApp)) fallar(`"${g.claveApp}" está repetida`);
  if (links.has(g.gif)) fallar(`el link de "${g.claveApp}" está repetido`);
  claves.add(g.claveApp);
  links.add(g.gif);
}

// Sin comillas si la clave es un nombre válido (A, Ñ, n10, el_ella)
const nombre = (clave) =>
  /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(clave) ? clave : JSON.stringify(clave);
const linea = ({ claveApp, gif }) => {
  const una = `  ${nombre(claveApp)}: ${JSON.stringify(gif)},`;
  // Si no entra en una línea, el link va abajo (como lo deja Prettier)
  return una.length <= ANCHO
    ? una
    : `  ${nombre(claveApp)}:\n    ${JSON.stringify(gif)},`;
};

const salida = [
  "// Generado por scripts/generarGifs.js: no editar a mano",
  "// (para cambiar un link: docs/gifs_nube.json y volver a correr el script)",
  "",
  "export const GIFS_NUBE = {",
  ...gifs.map(linea),
  "};",
  "",
].join("\n");

fs.writeFileSync(SALIDA, salida);
console.log(
  `generarGifs: ${gifs.length} links en ${path.relative(RAIZ, SALIDA)}`,
);
