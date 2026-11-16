# Resumen ejecutivo — Proyecto Timanfaya

*Preparado el 11-nov-2026 (Atlantic/Canary, UTC+0) para Rubén Díaz García. Es un compendio de información pública con trazabilidad, no un informe pericial.*

## 1. Qué se ha construido
Un visor web estático (MapLibre GL JS) con 9 capas de datos (más el ráster InSAR), 71 fichas, 53 fuentes y una línea temporal de 29 eventos. Permite buscar, filtrar por confianza / erupción / ubicaciones aproximadas, ver el relieve en 3D (MDT incluido, funciona sin conexión), consultar la fuente de cada elemento y leer la sección «Limitaciones y lagunas». Cada elemento declara si su ubicación es aproximada y con qué método se obtuvo.

## 2. Hallazgos principales
1. **Geometría abierta de la erupción**: el IGME publica (GEODE 1:25.000) polígonos de coladas, conos y piroclastos separables por unidad: **145,4 km²** de coladas 1730–36 (3 «episodios» IGME) y **2,4 km²** de 1824; coherente con ≈146 km² de Longpré y Felpeto (2021). Es la única base geométrica pública utilizable; las cinco fases de Carracedo et al. (1992) **no** están cartografiadas en abierto.
2. **Cronología** (R16, basada en Carracedo y Rodríguez Badiola 1991): 5 fases entre el 1-sep-1730 y el 16-abr-1736 (2056 días según R01); 1824: Tao (31-jul a 22-ago), Nuevo del Fuego (29-sep a 4-oct) y Tinguatón (16–24-oct). Las fuentes primarias (Curbelo, Cabildo) solo cubren bien 1730–1731.
3. **Núcleos sepultados**: se documentan 23 lugares con fuente (9 con ancla toponímica y radio de incertidumbre de 0,7–2,5 km; 14 sin ubicación posible). Las mejores anclas: Tingafa (64 vecinos en 1733; la aldea ocupaba el lugar de la montaña según la base toponímica de la ULPGC), Peña Palomas y El Chupadero. **No existe una lista abierta de «los 21»**; otras fuentes hablan de 24 o «más de 30».
4. **Geofísica del subsuelo**: la única geometría de campo recuperable es la del **Islote de Hilario** (perfiles GPR/EMI/magnéticos y anomalía TA1: 250–605 °C a <70 m; cuenco >45 m), obtenida digitalizando una figura con ejes UTM 28N (error 1–3 m; validada contra GeoNames a ≈57 m). Para **Calderas Quemadas** (4 tubos someros, 2 visibles) y **Chinero** (tubos de 6–8 m de ancho) solo existe una zona de referencia.
5. **Geotermia y deformación**: laboratorio de Camelleros con aumento >20 °C desde 2004 (OAPN 360/2011); InSAR Sentinel-1 con subsidencia de ≈6 mm/año (mínimo suavizado −5,2 mm/año en las Montañas del Fuego). Datos InSAR abiertos (Zenodo, CC BY 4.0).
6. **Regional**: el aeromagnetismo muestra una anomalía lineal positiva ligada al sistema de alimentación y una discontinuidad estructural al sur del Parque (microsísmica); los datos no están disponibles en abierto.

## 3. Nivel de confianza por capa
| Capa | Elementos | Confianza |
|---|---|---|
| Coladas/piroclastos 1730–36 (IGME) | 130 polígonos | alto |
| Coladas/piroclastos 1824 (IGME) | 5 polígonos | alto |
| Centros eruptivos (puntos) | 13 | 12 alto, 1 medio |
| Huellas de conos (IGME) | 31 | alto |
| Núcleos sepultados | 23 (9 con geometría) | 3 medio, 20 bajo |
| Perfiles geofísicos | 7 (4 con geometría) | 2 alto (Hilario), 5 bajo |
| Tubos de lava | 3 | 1 medio, 2 bajo |
| Anomalías geotérmicas | 3 (2 con geometría) | 1 alto (TA1), 2 bajo |
| Gravedad/magnetometría/sísmica | 6 | bajo (sin geometría) |
| InSAR | ráster + 2 contornos derivados | alto (dato) / medio (contornos) |

## 4. Lagunas
**No es público**
- Lista nominal y coordenadas de los 21 núcleos (libro de De León agotado; tesis ULPGC restringida).
- Datos brutos geofísicos (GPR, gravedad, magnetometría, EMI/ERT, microsísmica); coordenadas de los perfiles de Calderas Quemadas y Chinero; mallas regionales de gravedad y aeromagnetismo.
- Límite vectorial del Parque (solo ráster WMS en el modelo); fases de Carracedo cartografiadas; mapa de Simancas georreferenciado.

**Solo está en artículos o informes (no como datos)**
- Dimensiones y profundidades de tubos (R04, R05); temperaturas y modelos de TA1 (R08); resultados OAPN (R09, solo figuras).

**Requiere contactar con investigadores o instituciones**
- José de León Hernández: lista de los 21 núcleos, mapa de ~300 topónimos, inventario arqueológico.
- Arnoso, Vélez, Montesinos (IGEO CSIC-UCM), Gómez-Ortiz y Martín-Crespo (URJC), Solla (Vigo), Blanco-Montenegro (UCM): coordenadas y datos brutos.
- OAPN / Parque Nacional (informes finales y base SIG de edificios volcánicos de García et al. 2009), IGN (vuelo aeromagnético 1993), MITECO (límite vectorial), Archivo de Simancas.

## 5. Conflictos entre fuentes sin resolver
Montaña Tingafa (IGME 1824 vs. ULPGC 1730–36); episodios IGME vs. fases de Carracedo; Santa Catalina (Caldera de la Rilla vs. Caldera Santa Catalina); fecha y lugar de la destrucción de Buen Lugar (marzo 1731 vs. enero 1732); superficie de coladas (145 / 146 / 176 / ≈200 km²); población de Tingafa (64 vecinos vs. ≈500 habitantes).

## 6. Advertencias de uso
- Ninguna posición de núcleo o estructura geofísica (salvo Hilario) debe presentarse como localización exacta.
- Fuentes no verificadas: GVP (R33) y EGU23-16329 (R44); no se ha usado ningún dato de ellas.
- Los servicios de fondo (PNOA, GRAFCAN, OSM) se cargan en directo.
