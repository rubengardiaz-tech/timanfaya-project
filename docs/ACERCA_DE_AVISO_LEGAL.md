# Acerca de / Aviso legal

**Proyecto Timanfaya — Modelo visual interactivo de Lanzarote**
*Última actualización de este texto: 11 de noviembre de 2026.*

## 1. Descripción del proyecto

El **Proyecto Timanfaya** es un modelo visual interactivo que compila información pública sobre las erupciones de Timanfaya (1730–1736, y las de 1824), los núcleos de población sepultados bajo la lava y los estudios geofísicos del subsuelo de Lanzarote. Reúne también tubos de lava, anomalías geotérmicas, datos de subsidencia (InSAR), cartografía y toponimia.

Su **objetivo** es facilitar la consulta y la visualización de fuentes históricas y científicas en un único mapa, con búsqueda, filtros, línea temporal, relieve 3D, fichas explicativas y una sección de «Limitaciones y lagunas».

## 2. Estado del proyecto

El visor se encuentra en **fase beta / de producción en actualización**: su contenido, sus capas y sus fichas se irán ampliando y corrigiendo a medida que se localicen y verifiquen nuevas fuentes. La información se ha recopilado exclusivamente a partir de **fuentes públicas y publicaciones científicas**, y cada elemento indica la fecha de consulta y el estado de verificación de su fuente.

## 3. Aviso sobre la precisión de los datos

- Las **localizaciones de los pueblos sepultados y de las estructuras del subsuelo son aproximadas**. Se basan en interpretaciones históricas, toponímicas y geofísicas ya publicadas y se representan con un nivel de confianza (alto / medio / bajo), un método de localización y, cuando procede, un radio de incertidumbre. Una ubicación aproximada es solo una referencia de área; no delimita un núcleo ni una estructura.
- Este modelo **no constituye una fuente oficial** ni sustituye a la cartografía oficial, a los estudios de campo ni a la información y normativa del Parque Nacional de Timanfaya. No debe utilizarse como prueba pericial ni para fines de ingeniería, urbanismo o seguridad.
- Los **datos geofísicos** (GPR, microgravedad, EMI, magnetometría, microsísmica, etc.) proceden de investigaciones publicadas. **No se reproducen datos brutos no públicos**; cuando solo existe una figura, la geometría se ha digitalizado y se indica expresamente.
- Las discrepancias entre fuentes (por ejemplo, entre las fases eruptivas de Carracedo y los «episodios» del IGME) se muestran, no se resuelven. Consulte «Limitaciones y lagunas» antes de citar un dato.

## 4. Licencia

El **código**, el **diseño de la interfaz** y los **contenidos originales elaborados por el proyecto** (textos de fichas, resúmenes, cronología, estructura de datos, y los productos derivados propios como los contornos InSAR calculados o los círculos de incertidumbre) se publican bajo la licencia **Creative Commons Attribution 4.0 International (CC BY 4.0)**: https://creativecommons.org/licenses/by/4.0/ — puede copiarlos, redistribuirlos y adaptarlos, también con fines comerciales, siempre que atribuya la autoría («Proyecto Timanfaya — Rubén Díaz García»), enlace la licencia e indique si ha realizado cambios. El texto de la licencia está en el archivo `LICENSE`.

**Los datos y obras de terceros se citan y enlazan a sus fuentes originales y no se relicencian.** Siguen sujetos a las condiciones de sus titulares, entre otras:

| Material | Titular / condiciones conocidas |
|---|---|
| Mapa Geológico Continuo GEODE 1:25.000 (polígonos de coladas y conos) | IGME; consulte sus condiciones de uso en la fuente |
| NGBE (topónimos) y PNOA (ortofoto) | IGN, CC BY 4.0 |
| Ortofotos históricas 1977 y 1990 y espacios naturales (WMS) | GRAFCAN / IDECanarias; según sus condiciones de uso |
| InSAR de Purcell et al. (2022), Zenodo 6620524 | CC BY 4.0 (el PNG y los contornos mostrados son un recorte y un derivado de ese dataset, con cambios) |
| Gómez-Ortiz et al. (2019), *Remote Sensing* 11(6):675, copia en DIGITAL.CSIC | CC BY-NC-SA 4.0 (la traza y el círculo de TA1 del Islote de Hilario se han **digitalizado de su Fig. 6**; esa geometría conserva las condiciones de la obra original y **no** se ofrece bajo CC BY) |
| Resúmenes EGU 2014 y 2017 | CC BY 3.0 |
| OpenStreetMap | © colaboradores de OpenStreetMap, ODbL |
| Teselas de terreno (Terrarium) | Mapzen / AWS Open Data |
| GeoNames / Wikidata | CC BY 4.0 / CC0 |
| MapLibre GL JS (componente incluido en `app/vendor`) | BSD-3-Clause |

La referencia exhaustiva, con la condición de acceso de cada fuente, está en la sección «Fuentes» y en `referencias.json`. Los artículos y PDF citados **no se redistribuyen**.

## 5. Créditos y fuentes

Este trabajo se apoya en el de muchos autores e instituciones; se reconocen en particular:

- **José de León Hernández**, *Lanzarote bajo el volcán* (Cabildo de Lanzarote, 2009), y su tesis doctoral (ULPGC, 2006) sobre la reconstrucción del territorio y las aldeas sepultadas. La lista nominal de los 21 núcleos no es pública y este modelo no la reproduce; solo recoge lo citado en fuentes abiertas.
- **Estudios geofísicos publicados en DIGITAL.CSIC y revistas**: Gómez-Ortiz, D.; Blanco-Montenegro, I.; Arnoso, J.; Martín-Crespo, T.; Solla, M.; Montesinos, F.G.; Vélez, E.; Sánchez, N. (2019); Solla, M.; Montesinos, F.G.; Gómez-Ortiz, D.; Martín-Crespo, T.; Arnoso, J.; Vélez, E. (2015); Gómez-Ortiz, D.; Montesinos, F.G.; Martín-Crespo, T.; Solla, M.; Arnoso, J.; Vélez, E. (2014).
- **Informes del Programa de Investigación de la Red de Parques Nacionales (OAPN / MITECO)**: Arnoso, J. et al. (proyecto 360/2011) y García, A. et al. (2009).
- **Volcanología e InSAR**: Carracedo, J.C.; Rodríguez Badiola, E.; Soler, V. (1990, 1992); Longpré, M.-A. y Felpeto, A. (2021); Purcell, V. et al. (2022).
- **Datos cartográficos**: IGME (GEODE), IGN (NGBE, PNOA), GRAFCAN/IDECanarias, Fundación César Manrique y la base de datos «Toponimia de Lanzarote» (ULPGC).

**Trazabilidad:** cada elemento del mapa (polígono, punto, línea, ficha y evento de la línea temporal) lleva identificadores de fuente (`source_ids`) que remiten a la tabla de «Fuentes» y a `referencias.json`, con el DOI o la URL, el tipo de dato y el estado de verificación. Si encuentra un elemento sin fuente vinculable, es un error: por favor, comuníquelo.

## 6. Carácter del proyecto

- Es un proyecto **sin ánimo comercial**, con finalidad **divulgativa y de investigación**.
- **No es un producto oficial** del Parque Nacional de Timanfaya, del Organismo Autónomo Parques Nacionales ni del Cabildo de Lanzarote, ni cuenta con su respaldo, y no está vinculado a ellos. Los nombres y marcas de terceros se citan solo a efectos de atribución.
- Se ofrece «tal cual», sin garantías de exactitud, integridad ni disponibilidad. Los servicios de mapa de fondo de terceros se cargan en directo y pueden dejar de estar disponibles.

## 7. Contacto y mejoras

Se agradece cualquier ayuda para mejorar el modelo: **errores** (datación, ubicación, cita, enlace roto), **información adicional verificable** (publicaciones, documentos de archivo, datos abiertos) y propuestas de mejora. Indique, si es posible, la ficha o el elemento afectado y la fuente que lo respalda; lo que no pueda verificarse con una fuente pública se incorporará, en su caso, como hipótesis claramente marcada.

**Contacto:** [rubendiazgar@outlook.es](mailto:rubendiazgar@outlook.es)

**Titular del copyright:** © 2026 Rubén Díaz García (contenidos originales, código y diseño bajo CC BY 4.0).
