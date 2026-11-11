/* Proyecto Timanfaya — visor estático (MapLibre GL JS). Sin dependencias externas salvo servicios WMS opcionales. */
(function(){
'use strict';
const D=window.TIMANFAYA_DATA;
const L=D.layers, FICHAS={}, REFS={};
D.fichas.fichas.forEach(f=>FICHAS[f.id]=f); D.referencias.referencias.forEach(r=>REFS[r.id]=r);
const EV=D.timeline.eventos;
const $=s=>document.querySelector(s), esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COL={alto:'#2e7d32',medio:'#f9a825',bajo:'#c62828'};
const d2ms=s=>Date.parse(s+'T00:00:00Z');

/* ---------- preproceso: fecha de inicio y era ---------- */
const t0={}; EV.filter(e=>e.tipo==='erupcion').forEach(e=>e.ficha_ids.forEach(id=>{const t=d2ms(e.inicio); if(!(id in t0)||t<t0[id]) t0[id]=t;}));
function prep(fc,eraDefault){fc.features.forEach(f=>{const p=f.properties;
  let era=''; const er=String(p.erupcion||eraDefault||''); if(er.indexOf('1730')>=0) era+='A'; if(er.indexOf('1824')>=0) era+='B'; p._era=era;
  p._t0=(p.id in t0)?t0[p.id]:(era==='B'?d2ms('1824-07-31'):(era?d2ms('1730-09-01'):0));
  if(p.erupcion==='1824'&&!(p.id in t0)) p._t0=d2ms('1824-07-31'); }); return fc;}
const SRC={col1730:prep(L.coladas_1730_1736),col1824:prep(L.coladas_1824),conos:prep(L.conos_centros_eruptivos),pueblos:prep(L.pueblos_sepultados,'1730-1736'),
  perfiles:prep(L.perfiles_geofisicos),tubos:prep(L.tubos_lava),geot:prep(L.anomalias_geotermicas),grav:prep(L.gravedad_magnetometria),insarv:prep(L.insar)};

/* ---------- geometría auxiliar ---------- */
function ring(lon,lat,r,n=48){const dy=r/110574,dx=r/(111320*Math.cos(lat*Math.PI/180)),c=[];for(let i=0;i<=n;i++){const a=2*Math.PI*i/n;c.push([lon+dx*Math.cos(a),lat+dy*Math.sin(a)]);}return {type:'Polygon',coordinates:[c]};}
function coords(g,out=[]){if(!g)return out;const c=g.coordinates;(function w(a){if(typeof a[0]==='number')out.push(a);else a.forEach(w);})(c);return out;}
function bbox(feats){let b=[180,90,-180,-90];feats.forEach(f=>coords(f.geometry).forEach(p=>{b[0]=Math.min(b[0],p[0]);b[1]=Math.min(b[1],p[1]);b[2]=Math.max(b[2],p[0]);b[3]=Math.max(b[3],p[1]);}));return b[0]>b[2]?null:b;}
function centroid(f){const g=f.geometry;if(g.type==='Point')return g.coordinates;const b=bbox([f]);return [(b[0]+b[2])/2,(b[1]+b[3])/2];}
const LAYER_OF={col1730:'coladas_1730_1736',col1824:'coladas_1824',conos:'conos_centros_eruptivos',pueblos:'pueblos_sepultados',perfiles:'perfiles_geofisicos',tubos:'tubos_lava',geot:'anomalias_geotermicas',grav:'gravedad_magnetometria'};
/* marcadores (puntos) para líneas y polígonos de las capas geofísicas + círculos de incertidumbre */
const MARK={}, UNC={type:'FeatureCollection',features:[]}, BYFICHA={}, NOGEO=[];
['conos','pueblos','perfiles','tubos','geot'].forEach(k=>{MARK[k]={type:'FeatureCollection',features:[]};
  SRC[k].features.forEach(f=>{ if(!f.geometry) return; const p=f.properties;
    if(p.feature_class==='huella_cono') return;
    const c=centroid(f); MARK[k].features.push({type:'Feature',properties:Object.assign({},p,{_k:k}),geometry:{type:'Point',coordinates:c}});
    if(p.incertidumbre_m&&f.geometry.type==='Point'&&p.incertidumbre_m>=20) UNC.features.push({type:'Feature',properties:Object.assign({},p,{_k:k}),geometry:ring(c[0],c[1],p.incertidumbre_m)});
  });});
Object.keys(SRC).forEach(k=>SRC[k].features.forEach(f=>{const id=f.properties.ficha_id||f.properties.id;(BYFICHA[id]=BYFICHA[id]||[]).push(f); if(!f.geometry&&FICHAS[id]) NOGEO.push(f.properties);}));
// fichas sin feature ni geometría (no espaciales)
const NOSPATIAL=Object.values(FICHAS).filter(f=>!BYFICHA[f.id]);

/* ---------- mapa ---------- */
const b64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;};
maplibregl.addProtocol('dem',async(params)=>{const m=/dem:\/\/(\d+)\/(\d+)\/(\d+)/.exec(params.url);const t=window.TIMANFAYA_DEM[m[1]+'/'+m[2]+'/'+m[3]];if(!t)throw new Error('sin tesela');return {data:b64(t)};});
const wms=(u,l,f,extra='')=>u+'?service=WMS&version=1.3.0&request=GetMap&layers='+l+'&styles=&format='+f+extra+'&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}';
const BASES=[
 {id:'relieve',label:'Relieve sombreado (MDT local)',src:null},
 {id:'pnoa',label:'Ortofoto PNOA actual (IGN)',tiles:['https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}'],attr:'© IGN, PNOA CC BY 4.0'},
 {id:'osm',label:'OpenStreetMap',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],attr:'© OpenStreetMap contributors'},
 {id:'o1977',label:'Ortofoto histórica 1977 (GRAFCAN)',url:wms('https://idecan1.grafcan.es/ServicioWMS/Historico/Ortofotos/OrtoExpress_1977','ortofoto_1977','image/png'),attr:'© GRAFCAN'},
 {id:'o1990',label:'Ortofoto histórica 1990 (GRAFCAN)',url:wms('https://idecan1.grafcan.es/ServicioWMS/Historico/Ortofotos/OrtoExpress_1990','ortofoto_1990','image/png'),attr:'© GRAFCAN'}];
const style={version:8,sources:{
  dem:{type:'raster-dem',tiles:['dem://{z}/{x}/{y}'],encoding:'terrarium',tileSize:256,minzoom:6,maxzoom:12,attribution:'MDT: Mapzen/AWS Terrain Tiles'},
  dem2:{type:'raster-dem',tiles:['dem://{z}/{x}/{y}'],encoding:'terrarium',tileSize:256,minzoom:6,maxzoom:12}},
 layers:[{id:'bg',type:'background',paint:{'background-color':'#d9d5c8'}}]};
BASES.forEach(b=>{if(!b.url&&!b.tiles)return;style.sources['bm-'+b.id]={type:'raster',tiles:b.tiles||[b.url],tileSize:256,attribution:b.attr,maxzoom:19};
  style.layers.push({id:'bm-'+b.id,type:'raster',source:'bm-'+b.id,layout:{visibility:'none'}});});
style.sources['wms-eenn']={type:'raster',tiles:[wms('https://idecan2.grafcan.es/ServicioWMS/EspNat','EENN','image/png','&transparent=true')],tileSize:256,attribution:'© GRAFCAN (Espacios Naturales)'};
style.layers.push({id:'hs',type:'hillshade',source:'dem2',paint:{'hillshade-exaggeration':.55,'hillshade-shadow-color':'#2b2118','hillshade-highlight-color':'#fff','hillshade-accent-color':'#5a4636'}});
style.layers.push({id:'wms-eenn',type:'raster',source:'wms-eenn',paint:{'raster-opacity':.7},layout:{visibility:'none'}});
const map=new maplibregl.Map({container:'map',style,center:[-13.72,29.0],zoom:10.6,maxPitch:75,hash:false,attributionControl:{compact:true}});
window.__map=map;
map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');
map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-right');

/* ---------- definición de capas ---------- */
const GRP={er:'Erupciones',vi:'Núcleos de población',gf:'Geofísica del subsuelo',ia:'Datos auxiliares'};
const LAYERS=[]; // {id,label,grp,color,ids:[mapLayerIds], on}
function L_(def){LAYERS.push(Object.assign({on:true,ids:[]},def));return LAYERS[LAYERS.length-1];}
const confC=['match',['get','confianza'],'alto',COL.alto,'medio',COL.medio,COL.bajo];
function addSrc(id,data){map.addSource(id,{type:'geojson',data});}
function build(){
  // IGME
  addSrc('col1730',SRC.col1730);addSrc('col1824',SRC.col1824);addSrc('conos',SRC.conos);
  const lv=L_({id:'col1730',label:'Coladas 1730–36 (IGME 73/75/77)',grp:'er',color:'#c8441d'});
  map.addLayer({id:'col1730-f',type:'fill',source:'col1730',filter:['==',['get','tipo'],'colada'],paint:{'fill-color':['match',['get','unidad_IGME'],'73','#9e2a1b','75','#d2461e','#ef8a3b'],'fill-opacity':.62}});
  map.addLayer({id:'col1730-l',type:'line',source:'col1730',filter:['==',['get','tipo'],'colada'],paint:{'line-color':'#5a1409','line-width':.6}});
  lv.ids.push('col1730-f','col1730-l');
  const lp=L_({id:'pir',label:'Piroclastos y arenas (IGME 79/77a/82)',grp:'er',color:'#8c7b69',on:false});
  map.addLayer({id:'pir-f',type:'fill',source:'col1730',filter:['in',['get','tipo'],['literal',['piroclastos','arenas']]],paint:{'fill-color':'#8c7b69','fill-opacity':.45},layout:{visibility:'none'}});
  map.addLayer({id:'pir24-f',type:'fill',source:'col1824',filter:['==',['get','tipo'],'piroclastos'],paint:{'fill-color':'#8c7b69','fill-opacity':.45},layout:{visibility:'none'}});
  lp.ids.push('pir-f','pir24-f');
  const l24=L_({id:'col1824',label:'Coladas 1824 (IGME 80)',grp:'er',color:'#7b2fa8'});
  map.addLayer({id:'col1824-f',type:'fill',source:'col1824',filter:['==',['get','tipo'],'colada'],paint:{'fill-color':'#7b2fa8','fill-opacity':.7}});
  map.addLayer({id:'col1824-l',type:'line',source:'col1824',filter:['==',['get','tipo'],'colada'],paint:{'line-color':'#3d1457','line-width':.8}});
  l24.ids.push('col1824-f','col1824-l');
  const lh=L_({id:'huellas',label:'Huellas de conos (IGME 74/76/78/81)',grp:'er',color:'#3b2a20'});
  map.addLayer({id:'huellas-f',type:'fill',source:'conos',filter:['==',['get','feature_class'],'huella_cono'],paint:{'fill-color':['case',['==',['get','erupcion'],'1824'],'#b46bd8','#2a1a14'],'fill-opacity':.8}});
  lh.ids.push('huellas-f');
  // incertidumbre
  map.addSource('unc',{type:'geojson',data:UNC});
  map.addLayer({id:'unc-f',type:'fill',source:'unc',paint:{'fill-color':confC,'fill-opacity':.08}});
  map.addLayer({id:'unc-l',type:'line',source:'unc',paint:{'line-color':confC,'line-width':1.3,'line-dasharray':[3,2]}});
  // InSAR
  const ib=D.insarBounds;
  map.addSource('insar-img',{type:'image',url:D.insarPng,coordinates:[[ib.west,ib.north],[ib.east,ib.north],[ib.east,ib.south],[ib.west,ib.south]]});
  const li=L_({id:'insar',label:'InSAR Sentinel-1 · velocidad vertical (ráster)',grp:'ia',color:'#e6732a',on:false});
  map.addLayer({id:'insar-r',type:'raster',source:'insar-img',paint:{'raster-opacity':.85,'raster-fade-duration':0},layout:{visibility:'none'}});li.ids.push('insar-r');
  addSrc('insarv',SRC.insarv);
  const lc=L_({id:'insarc',label:'Contornos de subsidencia derivados (≤2 y ≤3,5 mm/año)',grp:'ia',color:'#d4a017',on:false});
  map.addLayer({id:'insarc-f',type:'fill',source:'insarv',paint:{'fill-color':['interpolate',['linear'],['get','umbral_mm_ano'],-3.5,'#7a0b0b',-2,'#f0a020'],'fill-opacity':.45},layout:{visibility:'none'}});
  map.addLayer({id:'insarc-l',type:'line',source:'insarv',paint:{'line-color':'#7a0b0b','line-width':1.2},layout:{visibility:'none'}});lc.ids.push('insarc-f','insarc-l');
  // capas geofísicas: geometría real
  ['perfiles','tubos','geot'].forEach(k=>addSrc(k,SRC[k]));
  const lpf=L_({id:'perfiles',label:'Perfiles geofísicos (GPR, EMI, magnetometría, gravedad)',grp:'gf',color:'#1565c0'});
  map.addLayer({id:'perfiles-ln',type:'line',source:'perfiles',filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#1565c0','line-width':4}});
  map.addLayer({id:'perfiles-pg',type:'fill',source:'perfiles',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#1565c0','fill-opacity':.06}});
  map.addLayer({id:'perfiles-pgl',type:'line',source:'perfiles',filter:['==',['geometry-type'],'Polygon'],paint:{'line-color':'#1565c0','line-width':1.4,'line-dasharray':[3,2]}});
  lpf.ids.push('perfiles-ln','perfiles-pg','perfiles-pgl');
  const ltb=L_({id:'tubos',label:'Tubos de lava',grp:'gf',color:'#00897b'});
  map.addLayer({id:'tubos-pg',type:'fill',source:'tubos',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#00897b','fill-opacity':.06}});
  map.addLayer({id:'tubos-pgl',type:'line',source:'tubos',filter:['==',['geometry-type'],'Polygon'],paint:{'line-color':'#00897b','line-width':1.4,'line-dasharray':[3,2]}});
  ltb.ids.push('tubos-pg','tubos-pgl');
  const lg=L_({id:'geot',label:'Anomalías geotérmicas',grp:'gf',color:'#e53935'});
  map.addLayer({id:'geot-pg',type:'fill',source:'geot',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#e53935','fill-opacity':.55}});
  map.addLayer({id:'geot-pgl',type:'line',source:'geot',filter:['==',['geometry-type'],'Polygon'],paint:{'line-color':'#8e0000','line-width':1.5}});
  lg.ids.push('geot-pg','geot-pgl');
  L_({id:'grav',label:'Gravedad / magnetometría / sísmica (sin geometría, ver lista)',grp:'gf',color:'#6a1b9a',nolayer:true});
  // marcadores
  Object.keys(MARK).forEach(k=>addSrc('m-'+k,MARK[k]));
  const mk=(id,k,color,r,shape)=>{map.addLayer({id:id,type:'circle',source:'m-'+k,filter:shape||['all'],paint:{'circle-color':color,'circle-radius':['interpolate',['linear'],['zoom'],8,r*.7,14,r*1.5],'circle-stroke-color':confC,'circle-stroke-width':2.5,'circle-opacity':.95}});
    map.addLayer({id:id+'-t',type:'symbol',source:'m-'+k,filter:shape||['all'],minzoom:11.5,layout:{'text-field':['get','nombre'],'text-size':11,'text-offset':[0,1.2],'text-anchor':'top','text-optional':true,'text-font':[]}});}
  // sin glyphs no hay etiquetas: se eliminan abajo
  map.addLayer({id:'conos-p',type:'circle',source:'m-conos',paint:{'circle-color':['case',['==',['get','erupcion'],'1824'],'#b46bd8','#ff5a1f'],'circle-radius':['interpolate',['linear'],['zoom'],8,3.5,14,7],'circle-stroke-color':confC,'circle-stroke-width':2.5}});
  LAYERS.find(x=>x.id==='huellas'); 
  const lcp=L_({id:'conosp',label:'Centros eruptivos (puntos NGBE)',grp:'er',color:'#ff5a1f'});lcp.ids.push('conos-p');
  map.addLayer({id:'pueblos-p',type:'circle',source:'m-pueblos',paint:{'circle-color':'#f4f1ea','circle-radius':['interpolate',['linear'],['zoom'],8,5,14,9],'circle-stroke-color':confC,'circle-stroke-width':3}});
  map.addLayer({id:'pueblos-i',type:'circle',source:'m-pueblos',paint:{'circle-color':'#3b2a20','circle-radius':['interpolate',['linear'],['zoom'],8,1.6,14,3]}});
  const lpu=L_({id:'pueblos',label:'Núcleos sepultados (ubicación aproximada)',grp:'vi',color:'#f4f1ea'});lpu.ids.push('pueblos-p','pueblos-i');
  map.addLayer({id:'perfiles-m',type:'circle',source:'m-perfiles',paint:{'circle-color':'#1565c0','circle-radius':['interpolate',['linear'],['zoom'],8,3.5,14,6],'circle-stroke-color':confC,'circle-stroke-width':2.2}});lpf.ids.push('perfiles-m');
  map.addLayer({id:'tubos-m',type:'circle',source:'m-tubos',paint:{'circle-color':'#00897b','circle-radius':['interpolate',['linear'],['zoom'],8,3.5,14,6],'circle-stroke-color':confC,'circle-stroke-width':2.2}});ltb.ids.push('tubos-m');
  map.addLayer({id:'geot-m',type:'circle',source:'m-geot',paint:{'circle-color':'#e53935','circle-radius':['interpolate',['linear'],['zoom'],8,3.5,14,6],'circle-stroke-color':confC,'circle-stroke-width':2.2}});lg.ids.push('geot-m');
  // resaltado
  map.addSource('hl',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'hl-f',type:'fill',source:'hl',filter:['in',['geometry-type'],['literal',['Polygon','MultiPolygon']]],paint:{'fill-color':'#ffd400','fill-opacity':.35}});
  map.addLayer({id:'hl-l',type:'line',source:'hl',filter:['!=',['geometry-type'],'Point'],paint:{'line-color':'#ffd400','line-width':3}});
  map.addLayer({id:'hl-p',type:'circle',source:'hl',filter:['==',['geometry-type'],'Point'],paint:{'circle-radius':14,'circle-color':'#ffd400','circle-opacity':.35,'circle-stroke-color':'#000','circle-stroke-width':2}});
  buildUI(); applyFilters(); buildLabels();
}
const LBL=[];
function buildLabels(){[['conos','conosp'],['pueblos','pueblos']].forEach(([k,lid])=>MARK[k].features.forEach(f=>{const el=document.createElement('div');el.className='lbl'+(k==='pueblos'?' lp':'');el.textContent=f.properties.nombre.replace(/ \(.*$/,'');
  const m=new maplibregl.Marker({element:el,anchor:'top',offset:[0,9]}).setLngLat(f.geometry.coordinates).addTo(map);LBL.push({el,p:f.properties,lid});}));
  map.on('zoom',updateLabels);updateLabels();}
function updateLabels(){const z=map.getZoom();LBL.forEach(l=>{const L=LAYERS.find(x=>x.id===l.lid);let v=z>=11.4&&L&&L.on&&state.conf.includes(l.p.confianza)&&(state.approx||!l.p.ubicacion_aproximada)&&(!isFinite(state.cut)||l.p._t0<=state.cut);
  const era=l.p._era;if(era&&!((era.includes('A')&&state.e1730)||(era.includes('B')&&state.e1824)))v=false;l.el.style.display=v?'':'none';});}
const CLICKABLE=['conos-p','pueblos-p','perfiles-m','tubos-m','geot-m','perfiles-ln','geot-pg','perfiles-pg','tubos-pg','huellas-f','col1824-f','col1730-f','insarc-f','pir-f'];

/* ---------- filtros ---------- */
const state={conf:['alto','medio','bajo'],e1730:true,e1824:true,approx:true,unc:true,cut:Infinity,base:'pnoa',overlayEENN:false};
function G(){ const f=['all',['in',['get','confianza'],['literal',state.conf]]];
  const era=['any',['==',['get','_era'],'']]; if(state.e1730)era.push(['in','A',['get','_era']]); if(state.e1824)era.push(['in','B',['get','_era']]); f.push(era);
  if(!state.approx) f.push(['!=',['get','ubicacion_aproximada'],true]);
  if(isFinite(state.cut)) f.push(['<=',['coalesce',['get','_t0'],0],state.cut]);
  return f;}
const BASEF={'col1730-f':['==',['get','tipo'],'colada'],'col1730-l':['==',['get','tipo'],'colada'],'pir-f':['in',['get','tipo'],['literal',['piroclastos','arenas']]],'pir24-f':['==',['get','tipo'],'piroclastos'],
 'col1824-f':['==',['get','tipo'],'colada'],'col1824-l':['==',['get','tipo'],'colada'],'huellas-f':['==',['get','feature_class'],'huella_cono'],
 'perfiles-ln':['==',['geometry-type'],'LineString'],'perfiles-pg':['==',['geometry-type'],'Polygon'],'perfiles-pgl':['==',['geometry-type'],'Polygon'],
 'tubos-pg':['==',['geometry-type'],'Polygon'],'tubos-pgl':['==',['geometry-type'],'Polygon'],'geot-pg':['==',['geometry-type'],'Polygon'],'geot-pgl':['==',['geometry-type'],'Polygon']};
function applyFilters(){const g=G();
  const all=['col1730-f','col1730-l','pir-f','pir24-f','col1824-f','col1824-l','huellas-f','perfiles-ln','perfiles-pg','perfiles-pgl','tubos-pg','tubos-pgl','geot-pg','geot-pgl','conos-p','pueblos-p','pueblos-i','perfiles-m','tubos-m','geot-m'];
  all.forEach(id=>{ if(!map.getLayer(id))return; map.setFilter(id,BASEF[id]?['all',BASEF[id],g]:g);});
  const vis=LAYERS.filter(l=>l.on).map(l=>l.id);
  const kmap={conos:'conosp',pueblos:'pueblos',perfiles:'perfiles',tubos:'tubos',geot:'geot'};
  const ks=Object.keys(kmap).filter(k=>vis.includes(kmap[k]));
  const uf=['all',['in',['get','_k'],['literal',ks]],g]; ['unc-f','unc-l'].forEach(id=>{map.setFilter(id,uf);map.setLayoutProperty(id,'visibility',state.unc?'visible':'none');});
  if(typeof updateLabels==='function'&&LBL.length)updateLabels();
  const ins=map.getLayer('insarc-f'); if(ins){map.setFilter('insarc-f',['all',['in',['get','confianza'],['literal',state.conf]]]);}
}
function setBase(id){state.base=id;BASES.forEach(b=>{if(map.getLayer('bm-'+b.id))map.setLayoutProperty('bm-'+b.id,'visibility',b.id===id?'visible':'none');});
  map.setPaintProperty('hs','hillshade-exaggeration',id==='relieve'?.8:.35);}
function setLayerVis(l,on){l.on=on;l.ids.forEach(i=>{if(map.getLayer(i))map.setLayoutProperty(i,'visibility',on?'visible':'none');});applyFilters();}

/* ---------- UI lateral ---------- */
function buildUI(){
  $('#basemaps').innerHTML=BASES.map(b=>`<div class="lyr"><input type="radio" name="bm" id="bm-${b.id}" value="${b.id}" ${b.id===state.base?'checked':''}><label for="bm-${b.id}">${esc(b.label)}</label></div>`).join('')+
   `<div class="lyr"><input type="checkbox" id="ov-eenn"><label for="ov-eenn">Espacios naturales protegidos (límite del Parque, WMS GRAFCAN)</label></div>`;
  document.querySelectorAll('input[name=bm]').forEach(i=>i.onchange=()=>setBase(i.value));
  $('#ov-eenn').onchange=e=>map.setLayoutProperty('wms-eenn','visibility',e.target.checked?'visible':'none');
  let h='';Object.keys(GRP).forEach(g=>{h+=`<div class="lg">${GRP[g]}</div>`;LAYERS.filter(l=>l.grp===g).forEach(l=>{h+=`<div class="lyr"><span class="sw" style="background:${l.color}"></span><input type="checkbox" id="ly-${l.id}" ${l.on?'checked':''}><label for="ly-${l.id}">${esc(l.label)}</label></div>`;});});
  $('#layers').innerHTML=h;
  LAYERS.forEach(l=>{const el=$('#ly-'+l.id);el.onchange=()=>{ if(l.nolayer){l.on=el.checked;} else setLayerVis(l,el.checked); }; if(l.nolayer){el.checked=true;el.disabled=true;}});
  document.querySelectorAll('.fc').forEach(c=>c.onchange=()=>{state.conf=[...document.querySelectorAll('.fc')].filter(x=>x.checked).map(x=>x.value);applyFilters();});
  $('#fe1730').onchange=e=>{state.e1730=e.target.checked;applyFilters();};$('#fe1824').onchange=e=>{state.e1824=e.target.checked;applyFilters();};
  $('#fapprox').onchange=e=>{state.approx=e.target.checked;applyFilters();};$('#func').onchange=e=>{state.unc=e.target.checked;applyFilters();};
  $('#legend').innerHTML=`<div><i class="dot c-alto"></i>Confianza alta (anillo verde)</div><div><i class="dot c-medio"></i>Confianza media (ámbar)</div><div><i class="dot c-bajo"></i>Confianza baja (rojo)</div>
   <div><svg width="26" height="14"><ellipse cx="13" cy="7" rx="12" ry="6" fill="none" stroke="#c62828" stroke-dasharray="3 2"/></svg>Radio de incertidumbre de una ubicación aproximada</div>
   <div><span class="sw" style="background:#d2461e"></span>Coladas 1730–36 (rojo: 1.er episodio IGME → naranja claro: 3.º)</div><div><span class="sw" style="background:#7b2fa8"></span>Coladas 1824</div>
   <div><span class="sw" style="background:#1565c0"></span>Perfil geofísico · <span class="sw" style="background:#00897b"></span>tubo · <span class="sw" style="background:#e53935"></span>anomalía térmica</div>
   <div class="mini">Todos los núcleos sepultados son ubicaciones <b>aproximadas</b> (ver radio en cada ficha).</div>`;
  const ng=[...NOGEO.map(p=>({id:p.ficha_id,t:p.nombre})),...NOSPATIAL.map(f=>({id:f.id,t:f.titulo}))];
  $('#nogeo-n').textContent=ng.length;$('#nogeo').innerHTML=ng.map(x=>`<div data-id="${x.id}">${esc(x.t)}</div>`).join('');
  document.querySelectorAll('#nogeo div').forEach(d=>d.onclick=()=>openFicha(d.dataset.id));
}

/* ---------- ficha ---------- */
function citeShort(r){const a=(r.autores||'').split(';')[0];return `${a}${r.autores&&r.autores.indexOf(';')>0?' et al.':''}${r.anio?' ('+r.anio+')':''}. ${r.titulo}`;}
function refHtml(id){const r=REFS[id];if(!r)return `<div class="src">${esc(id)}</div>`;const link=r.doi?`<a target="_blank" rel="noopener" href="https://doi.org/${esc(r.doi)}">DOI ${esc(r.doi)}</a>`:(r.url?`<a target="_blank" rel="noopener" href="${esc(r.url)}">enlace</a>`:'sin enlace');
  return `<div class="src"><b>[${r.id}]</b> ${esc(citeShort(r))}<small>${esc(r.tipo)} · ${link} · <a href="#" data-ref="${r.id}">ver en Fuentes</a></small><small>Verificación: ${esc(r.verificacion)}</small></div>`;}
function highlight(ids){const fs=[];ids.forEach(id=>(BYFICHA[id]||[]).forEach(f=>fs.push({type:'Feature',properties:{},geometry:f.geometry})));map.getSource('hl').setData({type:'FeatureCollection',features:fs.filter(f=>f.geometry)});return fs;}
function fit(ids){const fs=[];ids.forEach(id=>(BYFICHA[id]||[]).forEach(f=>f.geometry&&fs.push(f)));const b=bbox(fs);if(!b)return;
  const big=(b[2]-b[0])>0.002||(b[3]-b[1])>0.002;const pad={top:60,bottom:140,left:40,right:state.panel?400:40};
  if(!big){map.flyTo({center:[(b[0]+b[2])/2,(b[1]+b[3])/2],zoom:Math.max(map.getZoom(),13.2),essential:true});}else map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:pad,maxZoom:14,duration:900});}
function openFicha(id,noFit){const f=FICHAS[id];if(!f)return;state.panel=true;state.cur=id;$('#right').hidden=false;
  const feats=BYFICHA[id]||[];const p=feats[0]&&feats[0].properties||{};const noSpatial=feats.length===0;const sinGeo=feats.length>0&&!feats.some(x=>x.geometry);
  const aprox=feats.some(x=>x.properties.ubicacion_aproximada);const inc=p.incertidumbre_m;
  let h=`<h2>${esc(f.titulo)}</h2><span class="badge b-capa">${esc(f.categoria)}</span><span class="badge b-${f.confianza}">confianza ${esc(f.confianza)}</span>`;
  if(aprox)h+=`<span class="badge b-aprox">UBICACIÓN APROXIMADA${inc?' ≈ ±'+inc+' m':''}</span>`;
  if(sinGeo)h+=`<span class="badge b-aprox">SIN GEOMETRÍA</span>`;
  if(noSpatial)h+=`<span class="badge b-capa">${id==='insar-s1'?'RÁSTER':'FICHA DOCUMENTAL'}</span>`;
  if(f.estado)h+=`<p><b>Estado:</b> ${esc(f.estado)}</p>`;
  h+=`<p>${esc(f.resumen)}</p>`;
  if(noSpatial)h+=`<div class="warn" style="border-color:#555;background:#f3f3f3">${id==='insar-s1'?'Se representa como ráster georreferenciado (capa «InSAR Sentinel-1»), no como entidades vectoriales.':'Ficha documental: no tiene geometría vectorial propia en el mapa.'}</div>`;
  if(aprox||sinGeo)h+=`<div class="warn">${sinGeo?'No existen coordenadas publicadas en las fuentes abiertas consultadas; no se muestra en el mapa.':'La posición mostrada es una referencia de área, no la localización exacta del elemento.'}</div>`;
  if(f.detalle&&f.detalle.length)h+=`<h4>Datos</h4><table>${f.detalle.map(d=>`<tr><td>${esc(d.k)}</td><td>${esc(d.v)}</td></tr>`).join('')}</table>`;
  if(f.metodo_localizacion)h+=`<h4>Método de localización / procesado</h4><p>${esc(f.metodo_localizacion)}</p>`;
  if(f.limitaciones)h+=`<h4>Limitaciones</h4><p>${esc(f.limitaciones)}</p>`;
  if(f.variantes&&f.variantes.length)h+=`<h4>Variantes toponímicas</h4><p>${f.variantes.map(esc).join(' · ')}</p>`;
  h+=`<h4>Fuentes (${f.source_ids.length})</h4>${f.source_ids.map(refHtml).join('')}`;
  if(f.enlaces&&f.enlaces.length)h+=`<h4>Enlaces</h4><p>${f.enlaces.map(e=>`<a target="_blank" rel="noopener" href="${esc(e.u)}">${esc(e.t)}</a>`).join(' · ')}</p>`;
  const evs=EV.filter(e=>e.ficha_ids.includes(id));if(evs.length)h+=`<h4>Línea temporal</h4>`+evs.map(e=>`<p><a href="#" data-ev="${e.id}">${esc(e.fecha_texto)}${e.fecha_aproximada?' (aprox.)':''} — ${esc(e.titulo)}</a></p>`).join('');
  h+=`<div class="act-row">${(sinGeo||noSpatial)?'':'<button data-act="fit">Centrar en el mapa</button>'}<button data-act="copy">Copiar cita</button></div>`;
  $('#ficha').innerHTML=h;wireLinks($('#ficha'));$('#right').scrollTop=0;
  highlight([id]);if(id==='insar-s1'){const l=LAYERS.find(x=>x.id==='insar');if(l&&!l.on){setLayerVis(l,true);$('#ly-insar').checked=true;}const ib=D.insarBounds;map.fitBounds([[ib.west+0.12,ib.south+0.06],[ib.east-0.12,ib.north-0.06]],{padding:{top:40,bottom:140,left:40,right:400},duration:800});}
  else if(!noFit&&!sinGeo&&!noSpatial)fit([id]);
  $('#ficha').querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{ if(b.dataset.act==='fit')fit([id]); else {const t=`${f.titulo}. Proyecto Timanfaya (modelo visual), ficha ${f.id}. Fuentes: ${f.source_ids.map(s=>'['+s+'] '+citeShort(REFS[s]||{titulo:s})).join('; ')}`;navigator.clipboard&&navigator.clipboard.writeText(t);b.textContent='Copiado';}});
}
function wireLinks(root){root.querySelectorAll('[data-ref]').forEach(a=>a.onclick=e=>{e.preventDefault();openSources(a.dataset.ref);});root.querySelectorAll('[data-ev]').forEach(a=>a.onclick=e=>{e.preventDefault();openEvent(a.dataset.ev);});root.querySelectorAll('[data-fi]').forEach(a=>a.onclick=e=>{e.preventDefault();openFicha(a.dataset.fi);});}
$('#closeR').onclick=()=>{$('#right').hidden=true;state.panel=false;highlight([]);map.resize();};

/* ---------- eventos / línea temporal ---------- */
const SEG=[['1730-08-01',0],['1736-05-01',.55],['1824-06-01',.65],['1824-11-01',.78],['2023-01-01',1]].map(a=>[d2ms(a[0]),a[1]]);
function pos2ms(p){p/=1000;for(let i=1;i<SEG.length;i++)if(p<=SEG[i][1]){const[a,b]=[SEG[i-1],SEG[i]];return a[0]+(b[0]-a[0])*(p-a[1])/(b[1]-a[1]);}return SEG[SEG.length-1][0];}
function ms2pos(ms){for(let i=1;i<SEG.length;i++)if(ms<=SEG[i][0]){const[a,b]=[SEG[i-1],SEG[i]];return 1000*(a[1]+(b[1]-a[1])*(ms-a[0])/(b[0]-a[0]));}return 1000;}
const fmt=ms=>new Date(ms).toISOString().slice(0,10);
function setCut(ms){state.cut=ms;const s=$('#slider');if(ms===Infinity){s.value=1000;$('#tdate').textContent='todo (sin filtro de fecha)';}else{s.value=ms2pos(ms);$('#tdate').textContent='hasta '+fmt(ms);}applyFilters();}
$('#slider').oninput=e=>{const v=+e.target.value;if(v>=1000)setCut(Infinity);else setCut(pos2ms(v));};
$('#tlreset').onclick=()=>{stopPlay();setCut(Infinity);highlight([]);document.querySelectorAll('.ev.act').forEach(x=>x.classList.remove('act'));};
$('#tlevents').innerHTML=EV.map(e=>`<span class="ev ${e.tipo==='erupcion'?'er':e.tipo==='estudio'?'es':'do'}" data-ev="${e.id}" title="${esc(e.descripcion)}">${esc(e.fecha_texto.length>16?e.fecha_texto.slice(0,7):e.fecha_texto)} · ${esc(e.titulo.length>46?e.titulo.slice(0,44)+'…':e.titulo)}</span>`).join('');
function openEvent(id){const e=EV.find(x=>x.id===id);if(!e)return;state.panel=true;$('#right').hidden=false;
  document.querySelectorAll('.ev').forEach(x=>x.classList.toggle('act',x.dataset.ev===id));
  let h=`<h2>${esc(e.titulo)}</h2><span class="badge b-capa">${e.tipo==='erupcion'?'Erupción':e.tipo==='estudio'?'Estudio':'Documento histórico'}</span>${e.fecha_aproximada?'<span class="badge b-aprox">FECHA APROXIMADA</span>':''}<p><b>${esc(e.fecha_texto)}</b></p><p>${esc(e.descripcion)}</p>`;
  if(e.ficha_ids.length)h+=`<h4>Elementos relacionados</h4>`+e.ficha_ids.map(i=>`<p><a href="#" data-fi="${i}">${esc((FICHAS[i]||{}).titulo||i)}</a></p>`).join('');
  h+=`<h4>Fuentes</h4>${e.source_ids.map(refHtml).join('')}`;$('#ficha').innerHTML=h;wireLinks($('#ficha'));
  highlight(e.ficha_ids);fit(e.ficha_ids);if(e.tipo==='erupcion'&&e.fin)setCut(d2ms(e.fin)+86400000);}
$('#tlevents').querySelectorAll('.ev').forEach(x=>x.onclick=()=>openEvent(x.dataset.ev));
let playT=null;function stopPlay(){clearInterval(playT);playT=null;$('#play').textContent='▶';}
$('#play').onclick=()=>{if(playT){stopPlay();return;}const seq=EV.filter(e=>e.tipo==='erupcion');let i=0;$('#play').textContent='❚❚';openEvent(seq[0].id);playT=setInterval(()=>{i++;if(i>=seq.length){stopPlay();return;}openEvent(seq[i].id);},2800);};
$('#btnTl').onclick=e=>{const t=$('#tl');t.classList.toggle('hide');e.target.classList.toggle('on');};

/* ---------- 3D ---------- */
let is3d=false;
$('#btn3d').onclick=e=>{is3d=!is3d;e.target.classList.toggle('on',is3d);if(is3d){map.setTerrain({source:'dem',exaggeration:1.6});map.easeTo({pitch:62,bearing:-25,zoom:Math.max(map.getZoom(),11.2),duration:1200});}else{map.setTerrain(null);map.easeTo({pitch:0,bearing:0,duration:900});}};

/* ---------- búsqueda ---------- */
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const IDX=[...Object.values(FICHAS).map(f=>({t:'f',id:f.id,title:f.titulo,sub:f.categoria,txt:norm([f.titulo,f.resumen,f.categoria,f.estado,(f.variantes||[]).join(' '),(f.detalle||[]).map(d=>d.k+' '+d.v).join(' ')].join(' '))})),
  ...Object.values(REFS).map(r=>({t:'r',id:r.id,title:`[${r.id}] ${citeShort(r)}`,sub:'Fuente · '+r.tipo,txt:norm([r.titulo,r.autores,r.anio,r.aporta,r.tipo_dato].join(' '))})),
  ...EV.map(e=>({t:'e',id:e.id,title:e.titulo,sub:'Línea temporal · '+e.fecha_texto,txt:norm(e.titulo+' '+e.descripcion)}))];
$('#q').oninput=e=>{const q=norm(e.target.value.trim());const R=$('#results');if(q.length<2){R.hidden=true;return;}
  const terms=q.split(/\s+/);const hits=IDX.filter(x=>terms.every(t=>x.txt.indexOf(t)>=0)).sort((a,b)=>(a.t>b.t?1:-1)).slice(0,30);
  R.innerHTML=hits.length?hits.map((h,i)=>`<div data-i="${i}">${esc(h.title)}<small>${esc(h.sub)}</small></div>`).join(''):'<div>Sin resultados</div>';R.hidden=false;
  R.querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>{const h=hits[+d.dataset.i];R.hidden=true;if(h.t==='f')openFicha(h.id);else if(h.t==='e')openEvent(h.id);else openSources(h.id);});};
document.addEventListener('click',e=>{if(!e.target.closest('.searchbox'))$('#results').hidden=true;});

/* ---------- modales ---------- */
function modal(html){$('#modalc').innerHTML=html;$('#modal').hidden=false;}
$('#closeM').onclick=()=>$('#modal').hidden=true;$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').hidden=true;};
function openSources(focus){const rows=Object.values(REFS);
  modal(`<h2>Fuentes y trazabilidad (${rows.length})</h2><p class="mini">Cada elemento del mapa lleva <code>source_ids</code> que remiten a esta tabla. «Verificación» indica qué se comprobó realmente (fecha de consulta ${esc(rows[0].fecha_consulta)}); las fuentes NO verificadas están marcadas.</p>
  <p><input id="sf" placeholder="Filtrar fuentes…" style="width:50%;padding:5px"> <label><input type="checkbox" id="sv"> solo con DOI/URL verificado y leído</label></p>
  <table class="refs"><thead><tr><th>ID</th><th>Cita</th><th>Tipo / dato</th><th>Aporta</th><th>Verificación / acceso</th></tr></thead><tbody id="rb"></tbody></table>`);
  const draw=()=>{const q=norm($('#sf').value);const v=$('#sv').checked;$('#rb').innerHTML=rows.filter(r=>(!q||norm(JSON.stringify(r)).indexOf(q)>=0)&&(!v||/leído|abierto|verificad/i.test(r.verificacion)&&!/NO verificada/.test(r.verificacion))).map(r=>{
    const lk=[r.doi?`<a target="_blank" rel="noopener" href="https://doi.org/${esc(r.doi)}">doi:${esc(r.doi)}</a>`:'',r.url?`<a target="_blank" rel="noopener" href="${esc(r.url)}">URL</a>`:''].filter(Boolean).join('<br>');
    const bad=/NO verificada|no abierto|no consultado/i.test(r.verificacion);
    return `<tr id="r-${r.id}"><td><b>${r.id}</b></td><td>${esc(citeShort(r))}<br>${lk}</td><td>${esc(r.tipo)}<br><small>${esc(r.tipo_dato)}</small></td><td>${esc(r.aporta)}</td><td><span class="tag ${bad?'t-no':'t-ok'}">${bad?'parcial / no abierto':'abierto y leído'}</span> ${esc(r.verificacion)}<br><small>Acceso: ${esc(r.acceso)}</small>${r.notas?`<br><small>${esc(r.notas)}</small>`:''}</td></tr>`;}).join('');};
  $('#sf').oninput=draw;$('#sv').onchange=draw;draw();if(focus){const el=$('#r-'+focus);if(el){el.scrollIntoView({block:'center'});el.style.background='#fff2c4';}}}
$('#btnSrc').onclick=()=>openSources();
$('#btnLim').onclick=()=>modal(window.TIMANFAYA_LIMITES);
const openAbout=()=>modal(window.TIMANFAYA_ACERCA);$('#btnAbout').onclick=openAbout;$('#lnkAbout').onclick=e=>{e.preventDefault();openAbout();};

/* ---------- interacción en el mapa ---------- */
const popup=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:10});
function pick(pt){const ls=CLICKABLE.filter(i=>map.getLayer(i));const fs=map.queryRenderedFeatures(pt,{layers:ls});return fs.length?fs[0]:null;}
map.on('click',e=>{const f=pick(e.point);if(f&&f.properties.ficha_id)openFicha(f.properties.ficha_id,true);});
map.on('mousemove',e=>{const f=pick(e.point);map.getCanvas().style.cursor=f?'pointer':'';if(f&&f.properties.nombre){popup.setLngLat(e.lngLat).setHTML(`<b>${esc(f.properties.nombre)}</b><br>confianza ${esc(f.properties.confianza)}${f.properties.ubicacion_aproximada==='true'||f.properties.ubicacion_aproximada===true?' · <span style="color:#b00020">aprox.</span>':''}`).addTo(map);}else if(f&&f.properties.descripcion_IGME){popup.setLngLat(e.lngLat).setHTML(`<b>${esc(f.properties.descripcion_IGME)}</b><br>IGME · unidad ${esc(f.properties.unidad_IGME)} · ${f.properties.area_km2} km²`).addTo(map);}else popup.remove();});
map.on('load',()=>{build();setBase('pnoa');window.__ready=true;});
map.on('error',e=>{window.__errs=(window.__errs||[]);window.__errs.push(String(e&&e.error&&e.error.message||e));});
window.__api={openFicha,openEvent,setCut,openSources,toggle3d:()=>$('#btn3d').click(),setBase,LAYERS,state,openLim:()=>$('#btnLim').click(),openAbout:()=>$('#btnAbout').click()};
})();
