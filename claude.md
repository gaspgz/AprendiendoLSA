# Aprendiendo LSA

Usar como skills cuando lo pida:

- @docs/skills/SKILL.md
- @docs/skills/SKILL-niveles.md

## GIFs de las señas

- Las señas se muestran con `<SenaGif clave="..." />` (`components/SenaGif.jsx`). En el proyecto no hay GIFs ni `require()` de GIFs.
- Los links están en `docs/gifs_nube.json` y se pasan al código con `node scripts/generarGifs.js`, que genera `constants/gifsNube.js` (no se edita a mano).
- Sumar una seña nueva (detalle en "Sumar una seña nueva" de `docs/skills/SKILL.md`):
  1. Subir el GIF a la API con `scripts/subir-senas.mjs` (nombre sin tildes ni ñ).
  2. Agregar su entrada a `docs/gifs_nube.json`.
  3. Correr `node scripts/generarGifs.js`.
  4. Usar la clave en NIVELES o en Señas.
