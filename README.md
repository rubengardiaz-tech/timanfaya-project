# Proyecto Timanfaya — modelo visual interactivo de Lanzarote

Visor web estático (sin servidor ni compilación) que reúne información pública sobre las erupciones de Timanfaya (1730–1736 y 1824), los núcleos sepultados, los estudios geofísicos del subsuelo, tubos de lava, anomalías geotérmicas, InSAR y toponimia, con trazabilidad de cada elemento a su fuente y marca explícita de las ubicaciones aproximadas.

## Contenido
```
index.html      redirección a app/ (necesaria para GitHub Pages desde la raíz del repositorio)
.nojekyll       indica a GitHub Pages que sirva los archivos tal cual (sin Jekyll)
app/            aplicación (index.html, app.js, sim.js, style.css, vendor/maplibre-gl 4.7.1, data/bundle.js, dem_bundle.js y sim_bundle.js)
data/           capas GeoJSON (incl. costa_lanzarote.geojson: línea de costa IGN), fichas.json, referencias.json, timeline.json, sim/ (ráster y JSON de la simulación hipotética)
docs/           FUENTES_Y_METODOLOGIA.md, RESUMEN_EJECUTIVO.md, ACERCA_DE_AVISO_LEGAL.md, SIMULACION_COLADAS.md (+ LICENSE en la raíz)
build/          scripts de generación y pruebas (Python; test_velocidades.py prueba el selector de velocidad; shot3d.py, shot_costa.py y test_costa.py comprueban el 3D y el recorte a la costa), build/sim/ (código y parámetros de la simulación) y teselas de terreno de origen
(Las capturas screenshot*.png NO forman parte del despliegue: se entregan aparte en timanfaya_capturas.zip.)
```

## Uso local
- **Opción 1**: abrir `app/index.html` con doble clic (funciona desde `file://`; los datos y el relieve van incrustados).
- **Opción 2**: servidor estático: `cd app && python3 -m http.server 8080` → http://localhost:8080
- Los mapas de fondo (PNOA, OpenStreetMap, ortofotos GRAFCAN, límites de espacios naturales) requieren Internet; los datos propios y el relieve 3D no.

## Despliegue
**GitHub Pages** (rama + carpeta): Pages solo puede servir la **raíz (`/`)** o la carpeta **`/docs`** de una rama; **no** admite `app/` directamente. Con la estructura actual:
1. Sube todo el contenido de esta carpeta a la raíz del repositorio (incluye `index.html`, `.nojekyll` y `app/`).
2. *Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / carpeta `/ (root)` → Save*.
3. La URL será `https://USUARIO.github.io/REPOSITORIO/`; el `index.html` de la raíz redirige automáticamente a `app/` (enlace directo: `.../REPOSITORIO/app/`).
Alternativas: (a) renombrar `app` → `docs` y elegir `/docs` (entonces borra el `index.html` raíz); (b) *Source: GitHub Actions* con un flujo que publique solo `app/` (el sitio publicado pesa menos, porque no incluye `build/`, `data/` ni `docs/`).
Todas las rutas internas de la aplicación son relativas, por lo que funciona en subrutas (`/REPOSITORIO/`). Límites de GitHub (verificados en su documentación): sitio publicado ≤ 1 GB, ~100 GB/mes de ancho de banda (límite orientativo), aviso a partir de 50 MiB por archivo, bloqueo a 100 MiB, 25 MiB por archivo al subir desde el navegador.
**Netlify**: arrastra la carpeta `app/` a https://app.netlify.com/drop o enlaza el repositorio con *Publish directory* = `app` y sin comando de build.
Para publicar también los datos abiertos, copia `data/` junto a `app/` (los GeoJSON y JSON completos están ya embebidos en `app/data/bundle.js`).

## Velocidad de reproducción
Selector de tres velocidades (Lenta · Normal · Rápida) en la línea temporal y, replicado, en el panel de la simulación; ambos están sincronizados y se recuerdan (`localStorage`, clave `timanfaya.velocidad`). En la simulación equivalen a 1 / 3 / 9 meses de tiempo simulado por segundo (1824, de solo 4 meses, a cámara lenta ×1/6; el salto 1736→1824 es instantáneo) y se pueden cambiar durante la reproducción. En la reproducción de eventos de la línea temporal equivalen a 4,2 / 2,8 / 1,1 s por evento. Accesible: grupo `radiogroup`, teclado (flechas), foco visible y aviso `aria-live`.

## Regenerar los datos
Véase `docs/FUENTES_Y_METODOLOGIA.md`, apartado 5 (`build/final.py` y `build/bundle.py`). Los insumos brutos (polígonos IGME, NGBE, ráster InSAR) no se incluyen por tamaño; se descargan de los servicios indicados.

## Estructura de datos
Cada `Feature` GeoJSON incluye: `id`, `ficha_id`, `nombre`, `confianza` (alto/medio/bajo), `ubicacion_aproximada`, `incertidumbre_m` (si aplica), `metodo` y `source_ids` (identificadores de `referencias.json`). `fichas.json` contiene resumen, detalle, método de localización, limitaciones y fuentes; `timeline.json`, los eventos con fecha aproximada marcada.

## Simulación hipotética de coladas
El botón **Simulación** del visor muestra una **simulación hipotética** de la propagación de las coladas de 1730–1736 y 1824 (modelo estocástico de lóbulos sobre un MDT previo estimado, ejecutado por fases y repetido 40 veces), con probabilidad de cobertura, fecha estimada de llegada con incertidumbre, validación frente a los polígonos IGME y núcleos sepultados coloreados según el momento en que la simulación los cubre. **No es una reconstrucción histórica**: sus parámetros son de fuente, derivados, supuestos o calibrados (tabla «Parámetros y trazabilidad»). Método, validación y limitaciones: `docs/SIMULACION_COLADAS.md`; código y parámetros reproducibles: `build/sim/` (requiere numpy, scipy, shapely, pyproj, rasterio, numba; orden: `prepare_dem.py` → `run_all.py` → `analysis_mar.py` → `export_web.py` → `make_doc.py`, luego `build/final.py` y `build/bundle.py`).

### Simulación en 3D y línea de costa (actualización)
- **3D**: con relieve activo, MapLibre dibuja una imagen/canvas como una sola tesela y recorta lo que sobresale (la simulación aparecía cortada en vertical). Ahora `app/sim.js` reparte cada capa en teselas web z = 11 (un canvas de 500 × 498 px por tesela; los canvas cuadrados o potencia de 2 se ven negros en el MapLibre 4.7.1 vendorizado) y remuestrea el ráster UTM en cada una.
- **Mar**: el MDT Terrarium no tiene batimetría (mar plano a 0 m) y la lava simulada se extendía sobre él (≈8,5 % de la huella del escenario base). La huella se recorta a la línea de costa actual del IGN (`data/costa_lanzarote.geojson`, fuente R57) y la validación se calcula solo en tierra. Detalle y métricas: `docs/SIMULACION_COLADAS.md` §3.4.

## Licencias y atribuciones
- **Código, diseño de la interfaz y contenidos originales del proyecto: Creative Commons Attribution 4.0 International (CC BY 4.0)** — ver `LICENSE` y https://creativecommons.org/licenses/by/4.0/. Atribución: «Proyecto Timanfaya — Rubén Díaz García». Copyright (c) 2026 Rubén Díaz García. Contacto: rubendiazgar@outlook.es.
- **Datos y obras de terceros: se citan y enlazan, no se relicencian.** IGME GEODE (condiciones del IGME); IGN NGBE y PNOA (CC BY 4.0); GRAFCAN/IDECanarias (condiciones de GRAFCAN); Purcell et al. 2022, Zenodo 6620524 (CC BY 4.0); Gómez-Ortiz et al. 2019 en DIGITAL.CSIC (CC BY-NC-SA 4.0: la traza de Hilario digitalizada de su Fig. 6 conserva esas condiciones); OpenStreetMap (ODbL); Mapzen/AWS Terrain Tiles (base del MDT de la simulación); MrLavaLoba solo como referencia metodológica (no se incluye su código; licencia restrictiva); GeoNames (CC BY 4.0) y Wikidata (CC0). Los PDF y artículos citados no se redistribuyen.
- MapLibre GL JS: BSD-3-Clause (`app/vendor/LICENSE-maplibre.txt`).
- Texto completo del aviso legal, créditos y contacto: `docs/ACERCA_DE_AVISO_LEGAL.md` (también en el botón «Acerca de» del visor).
- Proyecto sin ánimo comercial y no oficial (no es un producto del Parque Nacional de Timanfaya ni del Cabildo de Lanzarote).

## Limitaciones
Léase la sección «Limitaciones y lagunas» de la aplicación. El modelo no es una prueba pericial ni delimita con exactitud núcleos sepultados.
