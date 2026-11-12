# Landing de Aprendiendo LSA — cómo publicarla

La carpeta ya está lista para subir a cualquier hosting estático (GitHub Pages, Netlify, Vercel, Hostinger, etc.). Subí el **contenido** de esta carpeta tal cual (que `index.html` quede en la raíz del sitio).

## Antes de publicar: reemplazos pendientes

Buscá la palabra `REEMPLAZAR` en los archivos. Son 4 cosas:

1. **Links de las tiendas** (en `index.html`, aparecen 2 veces: hero y sección final):
   - Pegá la URL real de Google Play y del App Store en los `href="#"`.
   - Borrá el atributo `data-pendiente` de cada link (eso apaga el aviso de "muy pronto").
   - Borrá el `<span class="pronto">Muy pronto</span>` de cada botón.
   - Opcional: cuando tengan los links, Google y Apple ofrecen sus badges oficiales para descargar
     (buscá "Google Play badge" y "App Store marketing tools"); pueden reemplazar los botones si quieren.

2. **Dominio** — reemplazá `TU-DOMINIO.com` por el dominio real en:
   - `index.html` (etiquetas `og:url`, `og:image`, `twitter:image` y el `<link rel="canonical">`, que hay que descomentar)
   - `robots.txt` (línea `Sitemap:`)
   - `sitemap.xml` (etiqueta `<loc>`)

3. **Verificación en Google**: cuando el sitio esté online, dénlo de alta en
   [Google Search Console](https://search.google.com/search-console) y manden el `sitemap.xml`.
   Con eso Google lo indexa mucho más rápido.

4. **Instagram**: el link ya apunta a `@aprendiendo_lsa`; si cambia el usuario, actualizarlo en el footer y la sección final.

## Opción rápida y gratis: GitHub Pages

1. En el repo, Settings → Pages → Source: rama `main`, carpeta `/landing` (o mover estos archivos a un repo propio).
2. En un par de minutos queda online en `https://usuario.github.io/...`.
3. Hecho eso, usar esa URL como dominio en el punto 2.

## Estructura

```
landing/
├── index.html        ← la página
├── css/styles.css    ← estilos
├── js/script.js      ← animaciones e interacciones
├── img/              ← capturas (sin la ruedita de Expo), logo, favicon, imagen OG
├── robots.txt        ← para los buscadores
├── sitemap.xml       ← para los buscadores
└── README-publicar.md
```
