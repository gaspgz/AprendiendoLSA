// subir-senas.mjs
// Sube a la API del curso las señas de la carpeta "senas_listas".
//
// Uso (parado en la carpeta del proyecto):
//   node --env-file=.env scripts/subir-senas.mjs          -> PRUEBA: solo muestra qué haría, no sube nada
//   node --env-file=.env scripts/subir-senas.mjs --subir  -> sube de verdad
//
// Cómo decide qué hacer con cada archivo:
//   - El nombre de la carpeta es la categoría (abecedario, numeros, ...).
//   - El nombre del archivo, sin extensión, es la clave ("A", "buendia", ...).
//   - Si en la API ya hay una seña con esa clave, le sube el archivo.
//   - Si no hay, primero crea la seña y después le sube el archivo.
//   Para comparar claves ignora mayúsculas, espacios y guiones bajos:
//   "buendia" (archivo) encuentra a "buen dia" (API).

import fs from "node:fs";
import path from "node:path";

const BASE = "https://ort.nilosolutions.com/api/lsa";
const CLAVE_API = process.env.EXPO_PUBLIC_LSA_API_KEY;
const CARPETA = "senas_listas";
const SUBIR = process.argv.includes("--subir");
const LIMITE = 5 * 1024 * 1024; // la API no acepta más de 5 MB
const TIPOS = { ".webp": "image/webp", ".gif": "image/gif" };

if (!CLAVE_API) {
  console.error("No encontré EXPO_PUBLIC_LSA_API_KEY. ¿Corriste el comando con --env-file=.env?");
  process.exit(1);
}
if (!fs.existsSync(CARPETA)) {
  console.error(`No encontré la carpeta "${CARPETA}". ¿Estás parado en la carpeta del proyecto?`);
  process.exit(1);
}

// "Buen dia", "buen_dia" y "buendia" quedan todos como "buendia"
const normalizar = (texto) => texto.toLowerCase().replace(/[\s_-]/g, "");

async function pedir(ruta, opciones = {}) {
  const res = await fetch(BASE + ruta, {
    ...opciones,
    headers: { "X-API-Key": CLAVE_API, ...(opciones.headers || {}) },
  });
  const texto = await res.text();
  let datos;
  try { datos = JSON.parse(texto); } catch { datos = texto; }
  return { ok: res.ok, status: res.status, datos };
}

// 1. Traer las señas que ya existen en la API
const existentes = await pedir("/senas");
if (!existentes.ok) {
  console.error("No pude leer /senas:", existentes.status, JSON.stringify(existentes.datos));
  process.exit(1);
}
const porClave = new Map(existentes.datos.map((s) => [normalizar(s.clave), s]));
console.log(`La API tiene ${existentes.datos.length} señas cargadas.`);
console.log(SUBIR ? "Modo SUBIR: se sube de verdad.\n" : "Modo PRUEBA: no se sube nada.\n");

// 2. Juntar los archivos de senas_listas/<categoria>/<clave>.webp
const archivos = [];
for (const categoria of fs.readdirSync(CARPETA)) {
  const dirCategoria = path.join(CARPETA, categoria);
  if (!fs.statSync(dirCategoria).isDirectory()) continue;
  for (const nombre of fs.readdirSync(dirCategoria)) {
    const ext = path.extname(nombre).toLowerCase();
    if (!TIPOS[ext]) continue;
    archivos.push({
      categoria,
      nombre,
      ext,
      ruta: path.join(dirCategoria, nombre),
      clave: path.parse(nombre).name,
    });
  }
}

// 3. Recorrerlos uno por uno
const vistas = new Set();
const cuenta = { existentes: 0, nuevas: 0, subidas: 0, errores: 0, salteadas: 0 };

for (const a of archivos) {
  const etiqueta = `${a.categoria}/${a.nombre}`;
  const peso = fs.statSync(a.ruta).size;
  const pesoTxt = `${Math.round(peso / 1024)} KB`;
  const claveNorm = normalizar(a.clave);

  if (peso > LIMITE) {
    console.log(`⚠  ${etiqueta} pesa ${pesoTxt}: supera 5 MB, lo salteo`);
    cuenta.salteadas++;
    continue;
  }
  if (vistas.has(claveNorm)) {
    console.log(`⚠  ${etiqueta}: ya hay otro archivo con la clave "${a.clave}", lo salteo`);
    cuenta.salteadas++;
    continue;
  }
  vistas.add(claveNorm);

  let sena = porClave.get(claveNorm);
  sena ? cuenta.existentes++ : cuenta.nuevas++;

  if (!SUBIR) {
    console.log(
      sena
        ? `↑  ${etiqueta} (${pesoTxt}) → se sube a la seña existente "${sena.clave}"`
        : `+  ${etiqueta} (${pesoTxt}) → se crea la seña NUEVA "${a.clave}" en "${a.categoria}"`
    );
    continue;
  }

  // Si la seña no existe, crearla
  if (!sena) {
    const r = await pedir("/senas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave: a.clave, categoria: a.categoria, etiqueta: a.clave }),
    });
    if (!r.ok) {
      console.log(`✗  No pude crear "${a.clave}":`, r.status, JSON.stringify(r.datos));
      cuenta.errores++;
      continue;
    }
    sena = r.datos;
    porClave.set(claveNorm, sena);
  }

  // Subir el archivo a la seña
  const form = new FormData();
  form.append("archivo", new Blob([fs.readFileSync(a.ruta)], { type: TIPOS[a.ext] }), a.nombre);
  const r = await pedir(`/senas/${sena.id}/gif`, { method: "POST", body: form });
  if (r.ok) {
    console.log(`✓  ${etiqueta} → "${sena.clave}"`);
    cuenta.subidas++;
  } else {
    console.log(`✗  ${etiqueta}:`, r.status, JSON.stringify(r.datos));
    cuenta.errores++;
  }
}

console.log("\n--- Resumen ---");
console.log(`Archivos encontrados: ${archivos.length}`);
console.log(`Para señas que ya existían: ${cuenta.existentes}`);
console.log(`Señas nuevas: ${cuenta.nuevas}`);
console.log(`Salteados: ${cuenta.salteadas}`);
if (SUBIR) {
  console.log(`Subidos bien: ${cuenta.subidas}`);
  console.log(`Con error: ${cuenta.errores}`);
} else {
  console.log("\nSi la lista está bien, corré lo mismo agregando --subir al final.");
}
