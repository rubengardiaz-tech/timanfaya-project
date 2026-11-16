/* Proyecto Timanfaya — módulo de SIMULACIÓN HIPOTÉTICA de coladas (1730–36 y 1824). Se apoya en window.__map y window.__api de app.js.
   Todo lo que se dibuja aquí es el resultado de un modelo con parámetros supuestos o calibrados, NO una reconstrucción histórica. */
(function(){
'use strict';
const S=window.TIMANFAYA_SIM; if(!S) return;
const J=S.json, $=s=>document.querySelector(s), esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EPOCH=Date.parse('1730-09-01T00:00:00Z'), DAY=86400000;
const iso=d=>new Date(EPOCH+Math.round(d)*DAY).toISOString().slice(0,10);
const PAL=['#1f77b4','#17becf','#2ca02c','#ff7f0e','#d62728','#9467bd'];           // fases 1–5 (índice 1..5)
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const st={on:false,show1730:true,show1824:true,mode:'prob',pmin:.5,unc:true,fill:false,cutDay:Infinity};
const sims={}; let map,api,ready=false,anim=null;

function loadPx(uri){return new Promise(res=>{const im=new Image();im.onerror=()=>res(null);im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);res(x.getImageData(0,0,im.width,im.height));};im.src=uri;});}
async function mk(key,corners){
  const [T,U,V]=await Promise.all(['t','u','v'].map(k=>loadPx(S.img[`s${key}_${k}`])));
  const n=T.width*T.height, o={key,w:T.width,h:T.height,corners,t50:new Uint16Array(n),P:new Uint8Array(n),d10:new Uint8Array(n),d90:new Uint8Array(n),ph:new Uint8Array(n),V:V.data};
  for(let i=0;i<n;i++){o.t50[i]=T.data[4*i]*256+T.data[4*i+1];o.P[i]=T.data[4*i+2];o.d10[i]=U.data[4*i];o.d90[i]=U.data[4*i+1];o.ph[i]=U.data[4*i+2];}
  const cv=document.createElement('canvas');cv.width=o.w;cv.height=o.h;o.cv=cv;o.ctx=cv.getContext('2d');o.img=o.ctx.createImageData(o.w,o.h);
  return o;
}
function draw(o){
  const D=o.img.data,n=o.w*o.h,cut=st.cutDay,pm=st.pmin*255-1e-6,mode=st.mode,unc=st.unc;
  for(let i=0;i<n;i++){const j=4*i;
    if(mode==='valid'){D[j]=o.V[j];D[j+1]=o.V[j+1];D[j+2]=o.V[j+2];D[j+3]=o.V[j+3];continue;}
    const p=o.P[i];D[j+3]=0;if(p<pm||p===0)continue;
    const t50=o.t50[i],a=o.d10[i]/5,b=o.d90[i]/5,t10=t50-a*a,t90=t50+b*b,pp=p/255;
    let cls=0;if(cut>=t90)cls=3;else if(cut>=t50)cls=2;else if(unc&&cut>=t10)cls=1;
    if(!cls)continue;
    let c; if(cls===1)c=[255,214,64]; else if(mode==='fase')c=hex(PAL[o.ph[i]]||PAL[0]); else if(o.key==='1824')c=cls===3?[110,40,160]:[160,90,205]; else c=cls===3?[196,40,24]:[232,104,40];
    D[j]=c[0];D[j+1]=c[1];D[j+2]=c[2];D[j+3]=cls===3?(110+120*pp):cls===2?(80+110*pp):(60+80*pp);
  }
  o.ctx.putImageData(o.img,0,0);
  const s=map.getSource('sim-'+o.key); if(s&&s.play){s.play();map.once('render',()=>{try{s.pause();}catch(e){}});}
  map.triggerRepaint();
}
function drawAll(){ if(!ready)return; Object.values(sims).forEach(draw); updateVillages(); updateReadout(); }
function updateReadout(){const el=$('#sim-date'); if(el)el.textContent=st.cutDay===Infinity?'sin filtro de fecha (resultado final de la simulación)':'simulado hasta '+iso(st.cutDay);}
function applyVis(){
  if(!ready)return; const v=st.on?'visible':'none';
  [['1730',st.show1730],['1824',st.show1824]].forEach(([k,s])=>{if(map.getLayer('sim-'+k+'-r'))map.setLayoutProperty('sim-'+k+'-r','visibility',st.on&&s?'visible':'none');});
  ['sim-nuc-c','sim-nuc-l','sim-vent-c'].forEach(l=>{if(map.getLayer(l))map.setLayoutProperty(l,'visibility',v);});
  const f=st.on&&!st.fill?0:null;
  [['col1730-f',.62],['col1824-f',.7]].forEach(([l,o])=>{if(map.getLayer(l))map.setPaintProperty(l,'fill-opacity',f===0?0.04:o);});
  const w=$('#simwarn'); if(w)w.hidden=!st.on; $('#btnSim').classList.toggle('on',st.on); $('#simpanel').hidden=!st.on;
  document.body.classList.toggle('simon',st.on); if(!st.on)stopAnim();
}
function villState(n){ if(n.t50_dia==null||n.P_disco_ge50<.5)return 3; const c=st.cutDay; if(c===Infinity)return 2; return c>=n.t90_dia?2:c>=n.t10_dia?1:0; }
const VCOL=['#9e9e9e','#f5b400','#c62828','#ffffff'];
function updateVillages(){
  const src=map.getSource('sim-nuc'); if(!src)return;
  src.setData({type:'FeatureCollection',features:J.nucleos.map(n=>({type:'Feature',properties:{id:n.id,nombre:n.nombre,s:villState(n)},geometry:{type:'Point',coordinates:[n.lon,n.lat]}}))});
  document.querySelectorAll('#sim-vl tr[data-id]').forEach(tr=>{const n=J.nucleos.find(x=>x.id===tr.dataset.id);tr.querySelector('i').style.background=VCOL[villState(n)];tr.querySelector('i').style.borderColor=villState(n)===3?'#c62828':'#444';});
}
const pct=x=>Math.round(100*x)+' %';
function villRows(){return J.nucleos.map(n=>`<tr data-id="${n.id}"><td><i class="vd"></i></td><td><a href="#" data-v="${n.id}">${esc(n.nombre)}</a>${n.ancla_en_cono?' <small title="El punto de anclaje del núcleo coincide con un cono/centro eruptivo: el resultado no es una prueba independiente">⚑</small>':''}</td><td>${pct(n.P_disco_ge50)}</td><td>${n.fecha_disco_p10_p50_p90?esc(n.fecha_disco_p10_p50_p90[0].slice(0,7))+' → '+esc(n.fecha_disco_p10_p50_p90[2].slice(0,7)):'—'}</td></tr>`).join('');}

const PARAM_TAG={fuente:['fuente','#2e7d32'],derivado:['derivado','#00838f'],supuesto:['SUPUESTO','#e65100'],calibrado:['calibrado','#6a1b9a'],'fuente+supuesto':['fuente + supuesto','#9e7d00'],'':['','#777']};
const tag=t=>{const x=PARAM_TAG[t]||PARAM_TAG[''];return `<span class="tag" style="background:${x[1]};color:#fff">${x[0]}</span>`;};
function refsHtml(s){return esc(s).replace(/R\d{2}/g,m=>`<a href="#" data-ref="${m}">${m}</a>`);}
function modalWire(){document.querySelectorAll('#modalc [data-ref]').forEach(a=>a.onclick=e=>{e.preventDefault();api.openSources(a.dataset.ref);});}
function modal(html){const m=$('#modalc');m.innerHTML=html;$('#modal').hidden=false;modalWire();}
const f1=(x,d=2)=>x==null?'—':(+x).toFixed(d);
function openParams(){
  const P=J.parametros,rows=[];
  const add=(n,v,t,src)=>rows.push(`<tr><td>${esc(n)}</td><td>${esc(v)}</td><td>${tag(t)}</td><td>${refsHtml(src||'')}</td></tr>`);
  const grp=(t)=>rows.push(`<tr><th colspan="4">${esc(t)}</th></tr>`);
  grp('MDT previo a 1730 / 1824');
  Object.entries(P.mdt).forEach(([k,o])=>add(k.replace(/_/g,' '),o.valor,o.tipo,(o.fuente?o.fuente+'. ':'')+o.nota));
  grp('Escenarios de espesor medio de la colada (→ volumen total)');
  Object.entries(P.escenarios_espesor_m).forEach(([k,o])=>add(k+' · espesor medio (m)',o.valor+(k===J.escenario_base?' (escenario base)':''),o.tipo,(o.fuente?o.fuente+'. ':'')+o.nota));
  grp('Fases y centros 1730–1736');
  P.fases_1730.centros.forEach(c=>{const b=c.bocas?c.bocas.map(x=>x.lon.toFixed(4)+', '+x.lat.toFixed(4)).join(' / '):(c.lon.toFixed(4)+', '+c.lat.toFixed(4));
    add(`${c.nombre} · ubicación (lon, lat)`,b,/SUPUESTO|supuesto/.test(c.coord_fuente)?'supuesto':'fuente',c.coord_fuente);
    add(`${c.nombre} · fechas`,'inicio '+c.inicio.join('…')+' · fin '+c.fin.join('…'),c.tipo_fecha,c.fecha_fuente);});
  add('Asignación del volumen por centro',P.fases_1730.asignacion_volumen.slice(0,60)+'…','supuesto',P.fases_1730.asignacion_volumen);
  grp('Fases 1824');
  const v=P.fases_1824.volumen_total_m3; add('Volumen total (m³)',v.valor+' (rango '+v.rango.join('–')+')',v.tipo,v.fuente);
  P.fases_1824.centros.forEach(c=>{add(`${c.nombre} · ubicación`,c.lon.toFixed(4)+', '+c.lat.toFixed(4),/inferid/.test(c.coord_fuente)?'supuesto':'fuente',c.coord_fuente);add(`${c.nombre} · fechas`,'inicio '+c.inicio.join('…')+' · fin '+c.fin.join('…'),'fuente',c.fecha_fuente);});
  grp('Parámetros del modelo de lóbulos');
  Object.entries(P.modelo).forEach(([k,o])=>add(k.replace(/_/g,' '),o.valor+(o.rango?' (rango '+o.rango.join('–')+')':''),o.tipo,(o.fuente?o.fuente+'. ':'')+o.nota));
  modal(`<h2>Parámetros de la simulación y su trazabilidad</h2><div class="simwarn2">SIMULACIÓN HIPOTÉTICA. Cada parámetro se etiqueta como <b>fuente</b> (valor de una referencia citada), <b>derivado</b> (cálculo propio a partir de valores de fuente), <b>SUPUESTO</b> (decisión sin respaldo en fuente) o <b>calibrado</b> (ajustado comparando con el mapa IGME: no es validación independiente). Los identificadores Rxx remiten a «Fuentes».</div>
  <table class="refs simp"><thead><tr><th>Parámetro</th><th>Valor</th><th>Tipo</th><th>Fuente / nota</th></tr></thead><tbody>${rows.join('')}</tbody></table>
  <p class="mini">Código y archivo completo: <code>build/sim/params.json</code> y <code>docs/SIMULACION_COLADAS.md</code>.</p>`);
}
function openFases(){
  const rw=J.fases_1730.map(f=>`<tr><td>${f.fase}</td><td>${esc(f.nombre)}</td><td>${f.inicio[1]} <small>(${f.inicio[0]} – ${f.inicio[2]})</small></td><td>${f.fin[1]} <small>(${f.fin[0]} – ${f.fin[2]})</small></td><td>${Math.round(f.V_Mm3)}</td><td>${f1(f.km2_sim,1)}</td><td>${tag(f.tipo_fecha)}</td></tr>`).join('');
  const r24=J.fases_1824.map(f=>`<tr><td>1824</td><td>${esc(f.nombre)}</td><td>${f.inicio[1]}</td><td>${f.fin[1]} <small>(${f.fin[0]} – ${f.fin[2]})</small></td><td>${f1(f.V_Mm3,1)}</td><td>—</td><td>${tag('fuente')}</td></tr>`).join('');
  modal(`<h2>Fases simuladas, fechas y volúmenes</h2><div class="simwarn2">SIMULACIÓN HIPOTÉTICA. Fechas = mediana (percentiles 5–95) de las fechas muestreadas en las ${J.n_simulaciones} simulaciones dentro de los rangos de las fuentes (R13, R01, R16). Volumen del escenario base (${J.escenario_base}).</div>
  <table class="refs simp"><thead><tr><th>Fase</th><th>Centro</th><th>Inicio</th><th>Fin</th><th>Volumen (Mm³)</th><th>Área simulada (km²)</th><th>Fechas</th></tr></thead><tbody>${rw}${r24}</tbody></table>`);
}
function openValid(){
  const E=J.escenarios,sc=Object.keys(E),r24=J.res_1824;
  const rows=sc.map(k=>{const m=E[k];return `<tr><td>${k}${k===J.escenario_base?' ★':''}</td><td>${m.espesor_medio_m}</td><td>${f1(m.volumen_km3)}</td><td><b>${f1(m.IoU)}</b></td><td>${f1(m.precision)}</td><td>${f1(m.recall)}</td><td>${f1(m.F1)}</td><td>${f1(m.AUC)}</td><td>${f1(m.km2_pred,0)}</td><td>${f1(m.km2_sobre,0)}</td><td>${f1(m.km2_infra,0)}</td></tr>`;}).join('');
  const m24=r24.metricas, rc=r24.centros.map(c=>`<tr><td>${esc(c.id)}</td><td>${f1(c.V_Mm3,1)}</td><td>${c.longitud_ref_km}</td><td>${f1(c.longitud_sim_km_mediana,1)} <small>(${f1(c.longitud_sim_km_p10_p90[0],1)}–${f1(c.longitud_sim_km_p10_p90[1],1)})</small></td><td>${c.fecha_llegada_90pc?c.fecha_llegada_90pc[0]+' … '+c.fecha_llegada_90pc[2]:'—'}</td></tr>`).join('');
  const vr=J.nucleos.map(n=>`<tr><td>${esc(n.nombre)}${n.ancla_en_cono?' ⚑':''}</td><td>${pct(n.P_disco_ge50)}</td><td>${n.fecha_disco_p10_p50_p90?n.fecha_disco_p10_p50_p90.join(' · '):'—'}</td><td>${n.fecha_documentada?esc(n.fecha_documentada[0]+' — '+n.fecha_documentada[1]):'—'}</td></tr>`).join('');
  modal(`<h2>Validación frente a los polígonos IGME</h2><div class="simwarn2">SIMULACIÓN HIPOTÉTICA. Coincidencia con las coladas IGME (unidades 73, 75, 77) en celdas de ${J.dx_m} m, con la huella «P ≥ ${J.umbral}» sobre ${J.n_simulaciones} simulaciones. Parte del ajuste es <b>calibración sobre el mismo mapa</b> (ver tipo «calibrado» en los parámetros); no es validación independiente.</div>
  <h3>1730–1736 por escenario de volumen</h3><table class="refs simp"><thead><tr><th>Esc.</th><th>Espesor (m)</th><th>V (km³)</th><th>IoU</th><th>Precisión</th><th>Exhaustividad</th><th>F1</th><th>AUC (P)</th><th>km² simulados</th><th>km² sobrestimados</th><th>km² infravalorados</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="mini">Área IGME observada: ${f1(E[J.escenario_base].km2_obs,1)} km². IoU = intersección/unión; precisión = fracción simulada que es lava IGME; exhaustividad = fracción de lava IGME cubierta; AUC = capacidad de la probabilidad para separar celdas con/sin lava IGME. Validación cruzada espacial (calibrar en fases 1–3 y evaluar en 4–5): IoU ${f1(J.cv.A_en_B.IoU_B)} (óptimo posible ${f1(J.cv.A_en_B.IoU_B_mejor_posible)}); a la inversa (calibrar en 4–5, evaluar en 1–3): IoU ${f1(J.cv.B_en_A.IoU_A)} (${f1(J.cv.B_en_A.IoU_A_mejor_posible)}).</p>
  <h3>1824 (mismos parámetros del modelo)</h3><p>IoU ${f1(m24.IoU)} · precisión ${f1(m24.precision)} · exhaustividad ${f1(m24.recall)} · AUC ${f1(m24.AUC)} · área simulada ${f1(m24.km2_pred,1)} km² frente a ${f1(m24.km2_obs,1)} km² (IGME). <b>Atención:</b> un parámetro estructural (longitud mínima de cadena) se eligió viendo la longitud de la colada de Nuevo del Fuego, por lo que 1824 no es una prueba totalmente independiente.</p>
  <table class="refs simp"><thead><tr><th>Centro 1824</th><th>V (Mm³)</th><th>Longitud R13 (km)</th><th>Longitud simulada, mediana (P10–P90)</th><th>Fecha en que alcanza el 90 % de su longitud (P10…P90)</th></tr></thead><tbody>${rc}</tbody></table>
  <p class="mini">R13 indica que la colada de Nuevo del Fuego alcanzó la costa el 3-oct-1824.</p>
  <h3>Núcleos sepultados: fecha simulada de cobertura frente a fecha documentada</h3><table class="refs simp"><thead><tr><th>Núcleo</th><th>P(≥50 % del disco de incertidumbre cubierto)</th><th>Fecha simulada P10 · P50 · P90</th><th>Fecha documentada</th></tr></thead><tbody>${vr}</tbody></table>
  <p class="mini">⚑ El punto del núcleo es el propio cono/centro eruptivo (anclaje toponímico): su cobertura simulada no constituye una prueba independiente. Las ubicaciones de los núcleos tienen incertidumbres de 0,7–2,5 km (ver fichas).</p>`);
}
function villExtra(id){
  const n=J.nucleos.find(x=>x.id===id); if(!n)return '';
  const doc=n.fecha_documentada?`<tr><td>Fecha documentada</td><td>${esc(n.fecha_documentada[0])} · ${esc(n.fecha_documentada[1])}</td></tr>`:'';
  return `<h4>Simulación hipotética de cobertura por lava</h4><div class="simwarn2">SIMULACIÓN HIPOTÉTICA: resultado de un modelo con parámetros supuestos; no es un dato histórico.</div>
  <table><tr><td>P(punto del núcleo cubierto)</td><td>${pct(n.P_punto)}</td></tr><tr><td>P(≥50 % del disco de incertidumbre de ${n.radio_m} m cubierto)</td><td>${pct(n.P_disco_ge50)}</td></tr>
  <tr><td>Fecha simulada de cobertura (P10 · P50 · P90)</td><td>${n.fecha_disco_p10_p50_p90?esc(n.fecha_disco_p10_p50_p90.join(' · ')):'sin cobertura suficiente en las simulaciones'}</td></tr>${doc}</table>
  <p class="mini">La fecha de cobertura proviene del reparto del volumen emitido por cada centro en su ventana temporal (tasa constante: supuesto) y no incluye la incertidumbre de la ubicación del núcleo salvo por el disco indicado.${n.ancla_en_cono?' <b>El anclaje del núcleo es un cono/centro eruptivo: no es una prueba independiente.</b>':''} Más: <a href="#" id="sim-open-lim">Limitaciones del modelo</a>.</p>`;
}
function build(){
  const first=map.getLayer('col1730-l')?'col1730-l':undefined;
  [['1730',J.corners_1730],['1824',J.corners_1824]].forEach(([k,c])=>{const o=sims[k];
    map.addSource('sim-'+k,{type:'canvas',canvas:o.cv,coordinates:c,animate:false});
    map.addLayer({id:'sim-'+k+'-r',type:'raster',source:'sim-'+k,paint:{'raster-opacity':.82,'raster-resampling':'nearest','raster-fade-duration':0},layout:{visibility:'none'}},first);});
  map.addSource('sim-nuc',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'sim-nuc-c',type:'circle',source:'sim-nuc',paint:{'circle-radius':8,'circle-color':['match',['get','s'],0,VCOL[0],1,VCOL[1],2,VCOL[2],VCOL[3]],'circle-stroke-color':['case',['==',['get','s'],3],'#c62828','#1b1b1b'],'circle-stroke-width':2},layout:{visibility:'none'}});
  map.addSource('sim-vent',{type:'geojson',data:{type:'FeatureCollection',features:J.fases_1730.concat(J.fases_1824).map(f=>({type:'Feature',properties:{nombre:f.nombre},geometry:{type:'Point',coordinates:[f.lon,f.lat]}}))}});
  map.addLayer({id:'sim-vent-c',type:'circle',source:'sim-vent',paint:{'circle-radius':4,'circle-color':'#fff','circle-stroke-color':'#000','circle-stroke-width':1.5},layout:{visibility:'none'}});
  map.on('click','sim-nuc-c',e=>{const id=e.features[0].properties.id;api.openFicha(id,true);});
  map.on('mouseenter','sim-nuc-c',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','sim-nuc-c',()=>map.getCanvas().style.cursor='');
  ready=true; drawAll(); applyVis();
}
function panel(){
  const d=document.createElement('div');d.id='simpanel';d.hidden=true;
  d.innerHTML=`<div class="sh"><b>Simulación hipotética de coladas</b><button id="sim-x" aria-label="Cerrar">×</button></div>
  <div class="simwarn2"><b>⚠ SIMULACIÓN HIPOTÉTICA.</b> Resultado de un modelo estocástico con parámetros supuestos o calibrados sobre el mapa IGME. <b>No es una reconstrucción ni un dato histórico</b> y no debe usarse para decisiones de ordenación, seguridad o valoración de bienes. <a href="#" id="sim-lim">Limitaciones del modelo</a></div>
  <div class="srow"><label><input type="checkbox" id="sim-c1730" checked> 1730–36</label> <label><input type="checkbox" id="sim-c1824" checked> 1824</label></div>
  <div class="srow">Modo <select id="sim-mode"><option value="prob">Probabilidad y fecha de llegada</option><option value="fase">Color por fase del centro</option><option value="valid">Validación frente a IGME</option></select></div>
  <div class="srow">P mínima de cobertura <input type="range" id="sim-p" min="10" max="90" step="10" value="50"><b id="sim-pv">0,5</b></div>
  <div class="srow"><label><input type="checkbox" id="sim-unc" checked> banda de incertidumbre del frente (P10–P90)</label></div>
  <div class="srow"><label><input type="checkbox" id="sim-fill"> rellenar polígonos IGME (reales)</label></div>
  <div class="srow" role="radiogroup" aria-labelledby="sim-spd-l"><span id="sim-spd-l"><b>Velocidad</b></span>
    <label><input type="radio" class="vel" name="velsim" value="lenta"> Lenta <small>1 mes/s</small></label>
    <label><input type="radio" class="vel" name="velsim" value="normal"> Normal <small>3 meses/s</small></label>
    <label><input type="radio" class="vel" name="velsim" value="rapida"> Rápida <small>9 meses/s</small></label></div>
  <div class="mini" id="sim-spdinfo"></div>
  <div class="srow"><button id="sim-play">▶ Animar</button><button id="sim-end">Resultado final</button><button id="sim-reset">Reiniciar</button></div>
  <div class="mini" id="sim-date"></div>
  <div id="sim-leg" class="mini"></div>
  <div class="srow"><button id="sim-b-par">Parámetros y trazabilidad</button><button id="sim-b-fas">Fases y fechas</button><button id="sim-b-val">Validación</button></div>
  <h4>Núcleos sepultados (simulación)</h4><div class="mini">Gris: aún no alcanzado · ámbar: dentro de la incertidumbre del frente · rojo: cubierto · borde rojo/blanco: P&lt;50 % de cobertura. ⚑ anclado a un cono.</div>
  <table id="sim-vl"><thead><tr><th></th><th>Núcleo</th><th>P(cob.)</th><th>Fecha P10→P90</th></tr></thead><tbody>${villRows()}</tbody></table>
  <div class="mini">${J.n_simulaciones} simulaciones · escenario ${J.escenario_base} · celdas de ${J.dx_m} m · código en build/sim/</div>`;
  $('#mapwrap').appendChild(d);
  const w=document.createElement('div');w.id='simwarn';w.hidden=true;w.innerHTML='SIMULACIÓN HIPOTÉTICA — resultado de un modelo, no una reconstrucción histórica';$('#mapwrap').appendChild(w);
  $('#sim-x').onclick=()=>{st.on=false;applyVis();stopAnim();};
  $('#sim-c1730').onchange=e=>{st.show1730=e.target.checked;applyVis();};$('#sim-c1824').onchange=e=>{st.show1824=e.target.checked;applyVis();};
  $('#sim-mode').onchange=e=>{st.mode=e.target.value;legend();drawAll();};
  $('#sim-p').oninput=e=>{st.pmin=e.target.value/100;$('#sim-pv').textContent=String(st.pmin).replace('.',',');drawAll();};
  $('#sim-unc').onchange=e=>{st.unc=e.target.checked;drawAll();};
  $('#sim-fill').onchange=e=>{st.fill=e.target.checked;applyVis();};
  $('#sim-b-par').onclick=openParams;$('#sim-b-fas').onclick=openFases;$('#sim-b-val').onclick=openValid;
  $('#sim-lim').onclick=e=>{e.preventDefault();api.openFicha('sim-limitaciones');};
  $('#sim-end').onclick=()=>{stopAnim();api.setCut(Infinity);};
  $('#sim-reset').onclick=()=>{stopAnim();api.setCut(Date.parse('1730-08-31T00:00:00Z'));};
  $('#sim-play').onclick=()=>window.__simPlayToggle();
  $('#sim-vl').addEventListener('click',e=>{const a=e.target.closest('[data-v]');if(!a)return;e.preventDefault();const n=J.nucleos.find(x=>x.id===a.dataset.v);api.openFicha(n.id,true);map.flyTo({center:[n.lon,n.lat],zoom:Math.max(map.getZoom(),12.3)});});
  document.querySelectorAll('#simpanel input.vel').forEach(r=>{r.onchange=()=>window.__spd.set(r.value);});
  window.__spd.on(spdInfo);window.__spd.set(window.__spd.key,true);spdInfo();
  legend();
}
function legend(){const el=$('#sim-leg');if(!el)return;const sw=(c,t)=>`<span class="sw" style="background:${c}"></span>${t}`;
  el.innerHTML=st.mode==='valid'?[sw('rgb(46,160,67)','coincide con IGME'),sw('rgb(214,39,40)','sobrestimado (simulado, no IGME)'),sw('rgb(31,90,220)','infravalorado (IGME, no simulado)')].join(' · ')
   :st.mode==='fase'?PAL.slice(1).map((c,i)=>sw(c,'fase '+(i+1))).join(' · ')+' · '+sw('#ffd640','frente incierto')
   :[sw('#c42818','1730–36 cubierto (≥P90 de la fecha)'),sw('#e86828','cubierto (mediana)'),sw('#6e28a0','1824 cubierto'),sw('#ffd640','frente incierto (P10–P50)')].join(' · ')+'<br>La opacidad crece con la probabilidad de cobertura.';}
const MONTH=30.4375*DAY, SEGS=[[Date.parse('1730-08-31T00:00:00Z'),Date.parse('1736-05-01T00:00:00Z'),1],[Date.parse('1824-07-25T00:00:00Z'),Date.parse('1824-11-01T00:00:00Z'),1/6]];
const nf=x=>String(+x.toFixed(2)).replace('.',',');
function spdInfo(){const S=window.__spd;if(!S)return;const el=$('#sim-spdinfo');if(!el)return;const m=S.mps();
  el.innerHTML=`<b>${S.speeds[S.key].label}</b>: ${nf(m)} ${m===1?'mes':'meses'} de tiempo simulado por segundo (1730–36). En 1824 (4 meses) se reproduce a cámara lenta ×1/6 (${nf(m/6)} meses/s). El salto 1736→1824 es instantáneo.`;}
function setPlayLabels(on){const a=$('#sim-play'),b=$('#play');if(a)a.textContent=on?'❚❚ Pausa':'▶ Animar';if(b)b.textContent=on?'❚❚':'▶';}
function stopAnim(){if(anim){cancelAnimationFrame(anim.id);anim=null;setPlayLabels(false);}else{const a=$('#sim-play');if(a)a.textContent='▶ Animar';}}
function play(){
  const c=window.__api.state.cut; let t=(c===Infinity||c==null||c<SEGS[0][0]||c>=SEGS[1][1])?SEGS[0][0]:c;   // reanuda desde la fecha actual
  let last=performance.now(); setPlayLabels(true);
  const step=now=>{
    const dt=Math.min((now-last)/1000,0.25); last=now;                        // la velocidad se lee en cada fotograma: cambia en caliente
    let seg=SEGS.findIndex(s=>t>=s[0]&&t<s[1]); if(seg<0)seg=t<SEGS[1][0]?0:1;
    t+=dt*window.__spd.mps()*MONTH*SEGS[seg][2];
    if(seg===0&&t>=SEGS[0][1])t=SEGS[1][0];                                    // salto 1736 → 1824
    if(t>=SEGS[1][1]){window.__api.setCut(SEGS[1][1]);stopAnim();return;}
    window.__api.setCut(t); anim.id=requestAnimationFrame(step);
  };
  anim={id:requestAnimationFrame(step)};
}
window.__simActive=()=>st.on;
window.__simPlayToggle=()=>{if(anim)stopAnim();else play();};
window.__simUpdate=function(){const c=window.__api&&window.__api.state?window.__api.state.cut:Infinity;st.cutDay=(c===Infinity||c==null)?Infinity:(c-EPOCH)/DAY;drawAll();};
window.__simFichaExtra=villExtra;
document.addEventListener('click',e=>{if(e.target&&e.target.id==='sim-open-lim'){e.preventDefault();api.openFicha('sim-limitaciones');}});
async function init(){
  map=window.__map;api=window.__api;
  const o1=await mk('1730',J.corners_1730),o2=await mk('1824',J.corners_1824);sims['1730']=o1;sims['1824']=o2;
  panel();
  const go=()=>build(); if(map.getLayer('col1730-l'))go(); else map.once('idle',go);
  $('#btnSim').onclick=()=>{st.on=!st.on;if(st.on&&!window.__simFirst){window.__simFirst=1;map.fitBounds([[-13.88,28.93],[-13.58,29.08]],{padding:{left:330,top:30,bottom:100,right:30},duration:800});}applyVis();window.__simUpdate();if(!st.on)stopAnim();};
  window.__sim={st,sims,openParams,openFases,openValid,play,stopAnim};
}
const wait=setInterval(()=>{if(window.__ready&&window.__map&&window.__api){clearInterval(wait);init().catch(e=>{window.__errs=(window.__errs||[]);window.__errs.push('SIM: '+(e&&e.stack||e));console.error('SIM',e&&e.stack||e);});}},100);
})();
