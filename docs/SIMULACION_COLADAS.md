# Simulación HIPOTÉTICA de la propagación de las coladas de 1730–1736 y 1824

> **Advertencia.** Este módulo es una **simulación hipotética**: un modelo estocástico con parámetros de fuente, derivados, **supuestos** o **calibrados** sobre el propio mapa IGME. **No es una reconstrucción histórica**, no prueba cómo ocurrió el proceso real ni debe usarse para delimitar núcleos sepultados, valorar bienes o tomar decisiones de seguridad u ordenación. Todo parámetro sin fuente está marcado como supuesto (ver `build/sim/params.json` y la tabla «Parámetros y trazabilidad» del visor).

Autor del proyecto: Rubén Díaz García (CC BY 4.0). Código reproducible: `build/sim/`.

## 1. Qué hace

1. **MDT previo a 1730** (y a 1824): MDT actual (AWS Terrarium, mosaico z13, remuestreado a una rejilla UTM 28N de 50 m) menos un espesor de lava estimado dentro de los polígonos IGME (coladas 73/75/77 y 80), con borde adelgazado, y conos sustituidos por una superficie armónica interpolada (`prepare_dem.py`).
2. **Fases y fechas**: diez centros de 1730–36 agrupados en las cinco fases de R13/R01/R16 y tres de 1824 (R13), con rangos de fechas y volúmenes (`params.json`).
3. **Modelo abierto propio**: apilamiento estocástico de lóbulos sobre el terreno que actualiza cada depósito (`model.py`, numba), ejecutado fase a fase (cada fase parte del terreno que deja la anterior) y repetido 40 veces por escenario (`simrun.py`, `run_all.py`).
4. **Validación** frente a los polígonos IGME (IoU, precisión, exhaustividad, AUC, mapa de zonas sobrestimadas e infravaloradas) y frente a datos de R13 (longitudes, fecha de llegada a la costa en 1824) y de las fechas de núcleos.
5. **Animación 2D/3D** en el visor sincronizada con la línea temporal, con núcleos sepultados coloreados según el momento estimado en que la simulación los cubre y su incertidumbre.

## 2. Método

### 2.1 MDT previo
- MDT actual: AWS Terrain Tiles/Terrarium (R32), interpolación bilineal a 50 m. Su resolución nativa es ≈17 m y su precisión vertical es de metros a decenas de metros (fuente de datos heterogénea); **no se ha cuantificado**.
- Espesor: R13 indica espesores medios probables de 15–25 m (por analogía con Laki, 25 m, y Holuhraun, 17 m), hasta ≈50 m en la costa oeste y mucho menores en los bordes; el volumen total sobre 146 km² es 2,2–3,7 km³ (espesor × área) o 4,2 km³ (relación empírica A–V de R13), mientras que las estimaciones previas oscilan entre 1 y 5 km³ (media 2,5 ± 1,4). Se definen **cuatro escenarios de espesor medio**: S1 15 m (2,18 km³), **S2 20 m (2,91 km³, base)**, S3 25 m (3,64 km³) y S4 28,9 m (4,21 km³).
- Distribución: espesor uniforme con rampa lineal hacia el borde del polígono (250 m, espesor relativo 0,25 en el borde; **supuestos**), reescalado para conservar el espesor medio. Para 1824: 7,8 m (19 Mm³ / 2,43 km²; derivado de R13).
- Conos: las huellas IGME (dilatadas 1 celda) se sustituyen por una superficie de Laplace desde el contorno (supuesto: ignora el volumen del cono).
- **No se resta**: tefra/lapilli (≈25 km² en IGME 79), lava ya sumergida bajo el mar, ni se corrigen los hundimientos posteriores (R11).

### 2.2 Fases, centros, fechas y volúmenes
Fuentes de fechas: R13 (Fig. 7, Tabla 1, basadas en R01 y Pallarés Padilla 2007) y R16. Las ventanas son rangos; en cada simulación se muestrea una fecha uniforme dentro de cada rango.

| Fase | Centro | Episodio IGME | Inicio (mediana; P5–P95) | Fin | V (Mm³) | Área simulada (km²) | Tipo de fecha |
|---|---|---|---|---|---|---|---|
| 1 | Caldera de los Cuervos | 1 | 1730-09-01 (1730-09-01 – 1730-09-01) | 1730-09-19 (1730-09-19 – 1730-09-19) | 25 | 3.4 | fuente |
| 1 | Santa Catalina (Caldera de la Rilla, candidata) | 1 | 1730-10-10 (1730-10-10 – 1730-10-10) | 1730-10-31 (1730-10-31 – 1730-10-31) | 14 | 2.3 | fuente |
| 1 | Pico Partido | 1 | 1730-10-10 (1730-10-10 – 1730-10-10) | 1731-01-18 (1731-01-02 – 1731-01-30) | 601 | 39.9 | fuente |
| 2 | Montañas del Señalo | 1 | 1731-03-11 (1731-03-01 – 1731-03-19) | 1731-07-18 (1731-07-03 – 1731-07-28) | 90 | 1.7 | fuente+supuesto |
| 3 | Volcán El Quemado | 2 | 1731-07-01 (1731-06-23 – 1731-07-10) | 1731-09-03 (1731-08-28 – 1731-09-09) | 354 | 24.2 | fuente+supuesto |
| 3 | Montaña Rajada | 2 | 1731-09-03 (1731-08-28 – 1731-09-09) | 1731-11-05 (1731-10-29 – 1731-11-10) | 198 | 16.9 | fuente+supuesto |
| 3 | Calderas Quemadas | 2 | 1731-11-05 (1731-10-29 – 1731-11-10) | 1732-01-09 (1731-12-29 – 1732-01-14) | 361 | 6.9 | fuente+supuesto |
| 4 | Montañas del Fuego (3 bocas) | 2 | 1732-01-30 (1732-01-03 – 1732-02-27) | 1735-07-22 (1735-02-26 – 1736-02-12) | 630 | 36.7 | supuesto |
| 5 | Montaña de las Nueces | 3 | 1736-03-14 (1736-03-11 – 1736-03-19) | 1736-04-05 (1736-04-02 – 1736-04-09) | 140 | 5.1 | fuente |
| 5 | Montaña Colorada | 3 | 1736-04-06 (1736-04-02 – 1736-04-09) | 1736-04-16 (1736-04-16 – 1736-04-16) | 500 | 19.5 | fuente |

- Ubicaciones: NGBE (R27) salvo: Quemadas y dos bocas de Fuego (centroides de conos IGME, **supuesto**), **Nueces: ubicación desconocida** (supuesto: cono IGME unidad 78 de 0,09 km² próximo a Colorada) y Tao (inferida, ver §5).
- Volumen: el volumen total del escenario se reparte entre los tres episodios IGME en proporción al área de sus polígonos de colada (73: 36,5; 75: 77,2; 77: 31,7 km²) y, dentro de cada episodio, entre sus centros según el polígono más próximo (supuesto). **Nueces tiene 140 Mm³ fijos (R13: 140 ± 30)**; Colorada recibe el resto del episodio 3. La hipótesis «episodios IGME 1/2/3 = fases 1–2/3–4/5» procede de R56 (guía geológica IGME).
- 1824 (R13): V = 19 Mm³ (rango 10–49) repartido por las áreas de R13 (Tao 0,16; Nuevo del Fuego 1,76; Tinguatón 0,51 km²; coinciden con los polígonos IGME unidad 80).
- Temporalidad: tasa de emisión constante dentro de la ventana de cada centro (supuesto). Las ventanas solapadas se simulan **secuencialmente** (simplificación).

### 2.3 Modelo de propagación
Inspirado en MrLavaLoba (R54) y en la familia de autómatas de pendiente tipo DOWNFLOW (R55) **pero con código propio**. MrLavaLoba se evaluó: **no se usa ni se incluye** porque su licencia impide redistribuirlo sin consentimiento de los titulares y no exporta tiempos de llegada.

- Cada centro emite F cadenas de lóbulos intercaladas. Un lóbulo deposita `dz` metros en una celda de 50 m.
- El lóbulo padre es el último de la cadena (exponente de lóbulo e = 0). El hijo se coloca en uno de los 8 vecinos con probabilidad ∝ (pendiente descendente)^γ + peso mínimo, sobre la superficie topográfica + depósitos; si no hay descenso, ∝ exp(−(h − h_min)/escala), lo que rellena depresiones.
- Las celdas por debajo de −10 m actúan como sumidero (lava perdida en el mar; entre −10 y 0 m puede formarse delta).
- Nº de lóbulos = V/(dz·Δ²). Nº efectivo de cadenas F_ef = min(F, N/L_min).
- Tiempo: fracción del volumen emitido por el centro en que una celda recibe su primer lóbulo × duración de su ventana. Las probabilidades son la fracción de simulaciones que cubren la celda; los percentiles de fecha, condicionados a cobertura.
- Parámetros finales: dz = 2.0 m, F = 200, e = 0.0, γ = 1.0, peso mínimo = 0.05, L_min = 300.

### 2.4 Calibración (no es validación independiente)
- Barrido grueso (`sweep.py`, 90 combinaciones × 6 simulaciones; e, F, wmin, dz) y fino (`sweep2.py`, 72 comb.): e = 0 fue siempre lo mejor y IoU ≈ 0,60–0,61 en un amplio plateau de F, wmin, dz. Ambos barridos usaron la primera asignación de volúmenes (vecino más próximo en todo el campo).
- Cambio estructural posterior: volumen por episodio IGME + Nueces fijo (R13) → IoU 0,61 → 0,65.
- Barrido 3 (`sweep3.py`, 108 comb.): nivel del mar (−20…0 m), longitud mínima de cadena (sin límite/150/300), F, wmin con la asignación final. Se eligió L_min = 300 por su mejor compromiso entre IoU de 1730 y la longitud de la colada de Nuevo del Fuego (R13), de modo que **1824 no es ya una prueba totalmente independiente**.
- Validación cruzada espacial (`sweep_cv.py`): calibrar con las fases 1–3 y evaluar en las 4–5 da IoU 0.66 (óptimo posible 0.66); a la inversa, 0.61 (0.63). El modelo tiene pocos parámetros efectivos y se transfiere bien, pero esto no valida el mecanismo físico.

## 3. Validación

### 3.1 1730–1736 frente a IGME (unidades 73, 75, 77; 145.6 km²; huella P ≥ 0.5; 40 simulaciones)
| Escenario | Espesor (m) | V (km³) | IoU | Precisión | Exhaustividad | F1 | AUC | km² simulados | km² sobrestimados | km² infravalorados | Lava perdida en el mar |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 15 | 2.18 | 0.59 | 0.78 | 0.70 | 0.74 | 0.90 | 131 | 28 | 43 | 0.0 % |
| S2 (base) | 20 | 2.91 | 0.65 | 0.76 | 0.82 | 0.79 | 0.93 | 157 | 38 | 27 | 0.1 % |
| S3 | 25 | 3.64 | 0.65 | 0.72 | 0.87 | 0.79 | 0.94 | 176 | 50 | 19 | 1.0 % |
| S4 | 28.9 | 4.21 | 0.64 | 0.69 | 0.89 | 0.78 | 0.94 | 187 | 57 | 16 | 2.5 % |

- Escenario base S2: IoU medio de una simulación individual 0.63; área media por simulación 156.6 ± 0.9 km². IoU según el umbral de probabilidad: P≥0.1: 0.62 · P≥0.2: 0.63 · P≥0.3: 0.64 · P≥0.4: 0.64 · P≥0.5: 0.65 · P≥0.6: 0.65 · P≥0.7: 0.64 · P≥0.8: 0.64 · P≥0.9: 0.62.
- La coincidencia es poco sensible al volumen (S2–S4), pero el área sobrestimada crece con él y la infravalorada decrece.
- **Mapa de zonas sobrestimadas e infravaloradas**: modo «Validación frente a IGME» del visor (verde = coincide, rojo = sobrestimado, azul = infravalorado). Sobrestimación principal: la plataforma costera del oeste (lava que construye un delta sobre la batimetría actual) y bordes del campo; infravaloración principal: flujos largos y estrechos hacia el este/noreste (colada de las Nueces) y el norte.
- Nueces: el modelo da una colada de ≈4.0 km frente a 21,7 km (R13): **fallo conocido**.

### 3.2 1824 (mismos parámetros del modelo)
IoU 0.41, precisión 0.60, exhaustividad 0.57, AUC 0.97; área simulada 2.3 km² frente a 2.4 km² (IGME).

| Centro | V (Mm³) | Longitud R13 (km) | Longitud simulada, mediana (P10–P90) | Fecha en que alcanza el 90 % de su longitud (P10 … P90) |
|---|---|---|---|---|
| tao | 1.3 | 0.4 | 3.5 (2.2–4.6) | 1824-07-31 … 1824-07-31 |
| nuevo_del_fuego | 13.8 | 6.34 | 5.8 (5.0–6.8) | 1824-10-03 … 1824-10-04 |
| tinguaton | 4.0 | 1.35 | 4.8 (3.1–6.4) | 1824-10-17 … 1824-10-22 |

R13 indica que Nuevo del Fuego alcanzó la costa el 3-oct-1824 (inicio 29-sep): la simulación da 3–4 oct (consistente, con tasa constante supuesta). Tao y Tinguatón: longitudes sobrestimadas (el modelo no detiene pronto las cadenas de poco volumen).

### 3.3 Núcleos sepultados: fecha simulada frente a documentada
Se calcula, por simulación, la fecha mediana de las celdas del disco de incertidumbre (radio = incertidumbre de la ubicación, ≤ 2,5 km) si ≥ 50 % del disco queda cubierto.

| Núcleo | Radio (m) | P(≥50 % del disco cubierto) | Fecha simulada P10 · P50 · P90 | Fecha documentada |
|---|---|---|---|---|
| Tingafa (Tíngafa) ⚑ | 700 | 100 % | 1730-10-18 · 1730-10-19 · 1730-10-20 | 1731-03-07 (R24 (von Buch 1825)) |
| Chimanfaya ⚑ | 2000 | 100 % | 1730-11-03 · 1730-11-15 · 1730-12-09 | 1730-09 (R16/R19/R22: «primera aldea») |
| Santa Catalina (aldea y ermita) ⚑ | 2000 | 100 % | 1730-10-19 · 1730-10-19 · 1730-10-21 | 1730-09-07 (R21 (divulgación, sin contrastar)) |
| Testeina | 1500 | 100 % | 1736-04-05 · 1736-04-08 · 1736-04-09 | — |
| Peña Palomas | 1500 | 100 % | 1730-09-16 · 1730-10-03 · 1730-11-26 | — |
| El Chupadero (Chupaderos) | 1500 | 0 % | — | — |
| Los Rodeos (Rodeo) | 1500 | 100 % | 1730-11-28 · 1730-12-09 · 1730-12-27 | — |
| Mazo (Maso) | 2000 | 100 % | 1730-11-13 · 1730-11-21 · 1730-11-26 | — |
| Mancha Blanca (emplazamiento antiguo) | 2500 | 100 % | 1736-03-30 · 1736-04-02 · 1736-04-05 | — |

⚑ El punto del núcleo coincide con un cono/centro eruptivo (anclaje toponímico): la cobertura no es una prueba independiente. **Desajustes**: Tingafa simulada en octubre de 1730 (por lava de Pico Partido) frente al 7-mar-1731 documentado (R24); Santa Catalina ≈6 semanas después de la fecha de R21; Chimanfaya ≈2 meses después de septiembre de 1730 (R16). Con incertidumbres de ubicación de 0,7–2,5 km y cronología imprecisa, **las fechas simuladas de núcleos no son fiables a escala de días ni de meses**.

## 4. Trazabilidad de parámetros
Tipos: **fuente** = valor de una referencia; **derivado** = cálculo propio a partir de fuentes; **supuesto** = sin respaldo en fuente; **calibrado** = ajustado comparando con IGME.

### MDT previo
| Parámetro | Valor | Tipo | Fuente / nota |
|---|---|---|---|
| espesor_medio_1824_m | 7.8 | derivado | R13. V/A = 19×10^6 m³ (R13, Tabla 2) / 2,43 km² (coladas 1824; R13 Tabla 2 y polígonos IGME unidad 80) = 7,8 m. Espesor uniforme por falta de datos. |
| borde_adelgazamiento_m | 250 | supuesto | R13 indica que los espesores son «mucho menores» en los bordes del campo de lavas, sin cuantificar. Se supone una rampa lineal de espesor desde el borde hasta esta distancia. |
| espesor_borde_rel | 0.25 | supuesto | Espesor relativo en el mismo borde del polígono respecto al espesor pleno de la rampa; el conjunto se reescala para conservar el espesor medio del escenario. |
| cono_buffer_celdas | 1 | supuesto | Dilatación (en celdas de 50 m) de las huellas de conos IGME antes de sustituir su relieve por una superficie interpolada (Laplace). |

### Escenarios de espesor
| Parámetro | Valor | Tipo | Fuente / nota |
|---|---|---|---|
| S1 | 15 | fuente | R13. Extremo inferior de 15–25 m de espesor medio (R13) → V = 2,2 km³ sobre 146 km². |
| S2 | 20 | derivado | R13. Punto medio de 15–25 m (R13) → V ≈ 2,9 km³. |
| S3 | 25 | fuente | R13. Extremo superior de 15–25 m (R13) → V ≈ 3,6 km³ (análogo Laki: 25 m). |
| S4 | 28.9 | derivado | R13. 4,2 km³ (relación empírica A–V de R13) / 146 km² = 28,9 m. |

### Modelo
| Parámetro | Valor | Tipo | Fuente / nota |
|---|---|---|---|
| dz_lobulo_m | 2.0 | calibrado | Calibrado en barrido (sweep.py, sweep2.py; plateau IoU≈0,60–0,61 para dz 1–3 m). Espesor depositado por cada lóbulo (1 celda de 50×50 m). Define la resolución vertical del apilamiento y el nº de lóbulos (V/(dz·Δ²)). |
| n_flujos_paralelos | 200 | calibrado | Calibrado en barrido (100–400 casi equivalentes). Nº de cadenas de lóbulos avanzando de forma intercalada en cada centro (análogo a los «flows» de MrLavaLoba). |
| exponente_lobulo | 0.0 | calibrado | Elección del lóbulo padre: índice = floor(n·u^e); e=0 siempre el último (cadena que avanza), e=1 uniforme. El barrido grueso (e=0, 0,1, 0,3, 0,6, 1,0) dio el mejor ajuste con e=0; valores mayores sobreestiman o subestiman fuertemente la superficie. |
| exponente_pendiente | 1.0 | supuesto | Peso de cada vecino ∝ (pendiente descendente)^γ. |
| peso_minimo_vecino | 0.05 | calibrado | Peso residual para permitir la dispersión lateral. |
| escala_relleno_depresion_m | 1.0 | supuesto | Si no hay vecino más bajo, peso ∝ exp(−(h−h_min)/escala). |
| limite_mar_m | -10 | supuesto | Las celdas con superficie por debajo de este nivel actúan como sumidero (lava perdida en el mar); entre −10 y 0 m la lava puede formar delta. |
| longitud_min_cadena | 300 | calibrado | Valor elegido en sweep3.py (150/300/sin límite) por el mejor compromiso entre IoU 1730 y la longitud de la colada de Nuevo del Fuego (R13: 6,34 km) → ya no es una validación independiente para 1824. Modificación estructural introducida tras comprobar que con F fijo las coladas pequeñas de 1824 (pocos lóbulos) no pueden alcanzar su longitud observada: nº efectivo de cadenas F_ef = min(F, N_lóbulos / longitud_min_cadena). Ver docs/SIMULACION_COLADAS.md (§ Validación 1824). |
| volumen_nueces_Mm3 | 140 (rango [110, 170]) | fuente | R13 (§4.4: 140 ± 30 ×10^6 m³ para la colada de las Nueces, a partir de R01 y R41). Volumen fijado para la fase Nueces; el resto del volumen del 3.er episodio IGME se asigna a Colorada. |
| n_simulaciones | 40 | supuesto | Nº de ejecuciones estocásticas por escenario para estimar probabilidades. |
| umbral_probabilidad_mapa | 0.5 | supuesto | Umbral de P(cobertura) para la huella «consenso» comparada con IGME. |

Centros (coordenadas, fechas, volumen 1824): véanse `build/sim/params.json` y la tabla del visor.

## 5. Hallazgo colateral: identificación de los conos de 1824 (inferencia propia)
Las áreas de las coladas IGME de 1824 coinciden con las de R13 (Tabla 2): 1,76 km² (colada que sale del Chinero hacia el norte, ≈6,1 km; R13: Nuevo del Fuego 6,34 km), 0,51 km² (≈1,5 km, junto al Volcán Nuevo del NGBE; R13: Tinguatón 1,35 km, a 4 km ENE de Nuevo del Fuego) y 0,16 km² (0,4 km, sector de Tao; R13: Tao 0,16 km², 0,4 km, a ≈14 km). De ahí: **Chinero = Nuevo del Fuego, Volcán Nuevo = Tinguatón, cono de Pico Perneo = Tao**. Es una inferencia propia (no una atribución publicada) y R13 describe Tao en el extremo «occidental» y Nuevo del Fuego en el «oriental», lo contrario de lo que resulta; discrepancia no resuelta. Las fichas de los conos se han actualizado como inferencia.

## 6. Limitaciones del modelo
Ver la ficha «Limitaciones del modelo de simulación» del visor. Resumen:
- Sin física de la lava (reología, temperatura, canales/tubos, inercia); lóbulo de 2 m en celdas de 50 m; tasa de emisión constante.
- Terreno previo = MDT actual − espesor uniforme con borde adelgazado: ignora el espesor real variable (hasta ≈50 m en la costa oeste), la batimetría real, los tefras y los hundimientos posteriores (R11); precisión vertical del MDT no cuantificada.
- Posición de Nueces desconocida; Quemadas y bocas de Fuego tomadas de polígonos IGME; reparto del volumen por polígonos IGME más próximos (supuesto); equivalencia episodios IGME ↔ fases es una hipótesis (R56).
- Cronología posterior a 1731 mal documentada (R13): inicio de Nueces en febrero de 1733 o marzo–abril de 1736 (el visor simula la versión clásica de 1736; la alternativa de 1733 solo cambiaría fechas, no el apilamiento), posible fin en 1735, actividad de Fuego discontinua.
- Los volúmenes de R13 excluyen lava perdida en el mar y tefras; el escenario no los corrige.
- Calibración y validación sobre el mismo mapa: validación cruzada espacial solo parcial; 1824 no es totalmente independiente.
- Fallos: flujos largos (Nueces), longitudes de Tao/Tinguatón, delta costero del oeste, fechas de núcleos.

## 7. Reproducir
```
pip install numpy scipy shapely pyproj rasterio pillow numba      # + playwright para test_sim.py
cd build/sim
python prepare_dem.py        # rejilla, MDT actual y previos  -> out/dem.npz   (necesita /workspace/raw/dem13.npy y data/*.geojson)
python sweep.py; python sweep2.py; python sweep3.py; python sweep_cv.py   # calibración (opcional)
python run_all.py            # simulaciones y métricas        -> out/resultados.json, out/*.npz
python export_web.py         # PNG + data/sim/simulacion.json
python make_doc.py           # regenera este documento
cd .. && python final.py && python bundle.py   # fichas, fuentes y app/data/sim_bundle.js
python test_sim.py           # prueba Playwright + capturas (desde la raíz del proyecto)
```
Semillas fijas; el resultado es determinista para una versión de numba/numpy dada. Los `.npz` intermedios (≈17 MB) se omiten del zip.

## 8. Referencias
R13 (Longpré y Felpeto 2021), R01 (Carracedo et al. 1992), R16, R14 (IGME GEODE), R41 (Solana et al. 2004), R32 (Terrarium), R11 (Purcell et al. 2022), R54 (MrLavaLoba, de' Michieli Vitturi y Tarquini 2018), R55 (DOWNFLOW, Favalli et al. 2005), R56 (guía geológica IGME). Detalle de cada una en el apartado «Fuentes» del visor.
