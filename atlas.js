(() => {
  "use strict";
  if (window.__ogxAtlas) return;
  window.__ogxAtlas = true;
  const A = OGXAtlas, origin = location.origin;
  const intelPrefix = `ogxIntel:${origin}:`, ownPrefix = `ogxOwn:${origin}:`, statsPrefix = `ogxStats:${origin}:`;
  const playerSelector = '#galaxyContent .col-player a, #statistics-container .statistics-section a[onclick*="ShowPlayerBadgeDialog"]';
  const memo = new Map();
  const observedRows=new WeakMap();
  let scanning = false, hoverToken = 0, hideTimer, navigating = false;
  const targetKey = `ogxTarget:${origin}`, jumpKey = `ogxJump:${origin}`;
  const host = document.createElement("div"); host.id = "ogx-atlas";
  const root = host.attachShadow({mode:"open"});
  root.innerHTML = `<style>
    :host{font:13px/1.5 Arial,sans-serif;color:#e0ecf7}
    button,select{font:inherit;color:#e0ecf7;background:#18334b;border:1px solid #48708f;border-radius:5px;padding:7px;cursor:pointer}
    #launch{position:fixed;bottom:16px;left:16px;z-index:2147483646}
    #target-dock{position:fixed;bottom:64px;left:16px;width:180px;max-width:calc(100vw - 32px);background:#111e29;border:1px solid #466174;padding:8px;box-sizing:border-box;z-index:2147483645;box-shadow:0 6px 18px #0008;font-size:12px}
    #dock-head{display:flex;align-items:center;gap:5px;margin-bottom:6px}#dock-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#dock-toggle{padding:0 6px}#dock-list{max-height:38vh;overflow:auto}#dock-list button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:3px 7px;margin:3px 0;font-size:12px;background:#192833;border:1px solid #3b4b58;border-radius:2px}#dock-list button:hover{border-color:#ffd25e;color:#ffd25e}#dock-list button[aria-current=true]{color:#d4ff55;border-color:#8baf3e}#dock-note{font-size:10px;color:#adc1cf;margin:6px 0 0}#dock-edit{padding:2px 5px;font-size:10px;margin-top:5px}.dock-moon{color:#e9d64c}
    #book{position:fixed;inset:8vh 8vw;z-index:2147483647;background:#101c2b;border:1px solid #58809f;border-radius:12px;padding:20px;overflow:auto;box-shadow:0 10px 70px #000b}
    #card{position:fixed;z-index:2147483647;background:#12283b;border:1px solid #74b6d9;border-radius:8px;padding:9px;width:280px;max-width:calc(100vw - 20px);max-height:220px;overflow:auto;white-space:pre-line;box-shadow:0 8px 28px #000b}
    .destination{display:block;width:100%;text-align:left;margin:5px 0}.seen{font-size:11px;color:#b1c8dc}input{padding:8px;background:#18334b;color:white;border:1px solid #48708f}#target-list{max-height:320px;overflow:auto}#target-status{color:#ffd080}.stat{padding:4px 0;border-bottom:1px solid #39586c;white-space:normal}.stat strong{color:#9edbff}a{color:#8ad1ff}#card p{margin:6px 0}#card button{padding:5px}
    [hidden]{display:none!important} h2{margin-top:0} p{color:#b7cbdc} table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border-bottom:1px solid #35516a;padding:8px;text-align:right}td:first-child,th:first-child{text-align:left}#close{float:right}#note{color:#ffd080}
  </style>
  <button id="launch">Gezegen defteri</button>
  <aside id="target-dock" hidden aria-label="Sabit hedefin gezegenleri"><div id="dock-head"><strong id="dock-name"></strong><button id="dock-toggle" aria-label="Hedef listesini küçült" aria-expanded="true">−</button></div><div id="dock-body"><div id="dock-list"></div><p id="dock-note" role="status"></p><button id="dock-edit">Hedefi değiştir</button></div></aside>
  <section id="book" hidden role="dialog" aria-label="Gezegen kaynak defteri">
    <button id="close">Kapat</button><h2>Gezegen kaynak defteri</h2>
    <h3>Hedef oyuncu</h3><input id="search-player" placeholder="Oyuncu adı ara" aria-label="Oyuncu adı ara"><select id="players" aria-label="Kayıtlı oyuncular"></select>
    <button id="pin-player">Hedef olarak sabitle</button><button id="unpin-player">Hedefi kaldır</button>
    <p id="target-status"></p><div id="target-stats"></div><div id="target-list"></div><hr>
    <p id="server"></p><p>Önce oyunda istediğin gezegene geç; aşağıdan o gezegeni seçip sayacı kaydet. Seçim oyundaki gezegeni değiştirmez. Eski kayıtlar canlı toplam değildir. Aylar bu listede yer almaz.</p>
    <select id="planet" aria-label="Şu anda açık olan gezegen"></select>
    <button id="capture">Ekrandaki kaynakları bu gezegene kaydet</button>
    <button id="export">Kayıtları JSON indir</button>
    <p id="note"></p><div id="table"></div>
  </section><aside id="card" hidden></aside>`;
  document.documentElement.append(host);
  const $ = id => root.getElementById(id);
  function recordsFor(all, id) {
    return Object.entries(all).filter(([key,r])=>key.startsWith(intelPrefix)&&r.playerId===id).map(([,r])=>r).sort((a,b)=>a.coords.localeCompare(b.coords,undefined,{numeric:true}));
  }
  let dockRefreshToken=0,dockTimer,dockRecords=[],dockTarget='',stepping=false;
  let activityVisible=sessionStorage.getItem('ogx-activity-visible')==='1';
  const activityButton=document.createElement('button');activityButton.textContent='⚠';activityButton.title='Aktivite bilgisini göster/gizle';activityButton.setAttribute('aria-label',activityButton.title);activityButton.setAttribute('aria-pressed',String(activityVisible));activityButton.style.cssText='padding:1px 5px;font-size:11px';$('dock-head').prepend(activityButton);
  const nextButton=document.createElement('button');nextButton.style.cssText='width:100%;padding:4px;margin-top:5px;font-size:11px';$('dock-body').append(nextButton);
  activityButton.onclick=()=>{activityVisible=!activityVisible;sessionStorage.setItem('ogx-activity-visible',activityVisible?'1':'0');activityButton.setAttribute('aria-pressed',String(activityVisible));refreshDock().catch(console.warn);};
  function nextIndex(){const last=sessionStorage.getItem(`ogx-last-target:${origin}:${dockTarget}`),i=dockRecords.findIndex(r=>r.coords===last);return dockRecords.length?(i+1)%dockRecords.length:0;}
  nextButton.onclick=async()=>{if(stepping||navigating||!dockRecords.length)return;stepping=true;nextButton.disabled=true;const r=dockRecords[nextIndex()],key=`ogx-last-target:${origin}:${dockTarget}`,old=sessionStorage.getItem(key);try{await navigationAllowed();sessionStorage.setItem(key,r.coords);$('dock-note').textContent=`${r.coords} açılıyor…`;await jump(r.coords);await refreshDock();}catch(e){if(old===null)sessionStorage.removeItem(key);else sessionStorage.setItem(key,old);$('dock-note').textContent=e.message;}finally{stepping=false;nextButton.disabled=!dockRecords.length;}};
  async function refreshDock(){
    const token=++dockRefreshToken,all=await chrome.storage.local.get(null),pin=all[targetKey];
    if(token!==dockRefreshToken)return;
    $('target-dock').hidden=!pin?.id;if(!pin?.id)return;
    const records=recordsFor(all,pin.id);dockRecords=records;dockTarget=pin.id;nextButton.textContent=records.length?`Sonraki hedef · ${nextIndex()+1}/${records.length}`:'Koordinat yok';nextButton.disabled=stepping||!records.length;$('dock-name').textContent=pin.name||'Hedef oyuncu';$('dock-name').title=pin.name||'Hedef oyuncu';
    $('dock-list').replaceChildren();
    for(const r of records){
      const button=document.createElement('button');button.type='button';button.title=`${r.name} • Son görülme: ${new Date(r.at).toLocaleString('tr-TR')} • Sisteme git`;
      const coordinate=document.createElement('span');coordinate.textContent=`◉ ${r.coords}`;
      const moon=document.createElement('span');moon.className='dock-moon';moon.textContent=r.moon?'☾':'';moon.title=r.moon?'Kayıtta ay var':'';
      if(activityVisible){const a=r.activity,old=!a||Date.now()-a.at>300000,badge=document.createElement('span');badge.textContent=old?'?':a.state==='active'?'🔴':a.state==='minutes'?`${a.minutes} dk`:a.state==='none'?'○':'?';badge.title=a?`Son gözlem: ${new Date(a.at).toLocaleString('tr-TR')}. Aktivite çevrimiçi olma garantisi değildir.${old?' Eski kayıt; sistemi yeniden aç.':''}`:'Aktivite henüz okunmadı';button.append(badge);}
      button.append(coordinate,moon);button.addEventListener('click',async()=>{
        if(navigating)return;$('dock-note').textContent=`${r.coords} açılıyor…`;
        try{await jump(r.coords);$('dock-list').querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));button.setAttribute('aria-current','true');$('dock-note').textContent=`${r.coords} • ${records.length} bilinen gezegen`;}catch(e){$('dock-note').textContent=e.message;}
      });$('dock-list').append(button);
    }
    $('dock-note').textContent=records.length?`${records.length} bilinen gezegen • Son tarama kayıtları`:'Henüz koordinat yok. Galaksi taraması yap.';
  }
  $('dock-toggle').addEventListener('click',()=>{const collapsed=!$('dock-body').hidden;$('dock-body').hidden=collapsed;$('dock-toggle').textContent=collapsed?'+':'−';$('dock-toggle').setAttribute('aria-expanded',String(!collapsed));});
  $('dock-edit').addEventListener('click',()=>{$('launch').click();});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&Object.keys(changes).some(k=>k===targetKey||k.startsWith(intelPrefix))){clearTimeout(dockTimer);dockTimer=setTimeout(()=>refreshDock().catch(console.warn),200);}});
  refreshDock().catch(console.warn);
  function statistics(container, all, id) {
    container.replaceChildren();
    if (!id) return;
    for (const [category, label] of Object.entries(OGXStats.labels)) {
      const r = all[`${statsPrefix}${id}:${category}`], line = document.createElement('div'); line.className = 'stat';
      const main = document.createElement('strong');main.textContent = `${label}: ${r ? r.value.toLocaleString('tr-TR') : 'Henüz okunmadı'}`;
      line.append(main);
      if (r) { const detail = document.createElement('div');detail.className='seen';detail.textContent=`Sıra: ${r.rank.toLocaleString('tr-TR')} • ${new Date(r.at).toLocaleString('tr-TR')}`;line.append(detail); }
      container.append(line);
    }
    const note=document.createElement('p');note.className='seen';note.textContent='Filo istatistiği gemi adedi olarak yorumlanmaz. Değerler son ziyaret edilen istatistik sayfalarındandır; canlı değildir.';
    const link=document.createElement('a');link.href=`${origin}/statistics?rel=${encodeURIComponent(id)}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Oyuncunun istatistik sayfasını yeni sekmede aç';
    container.append(note,link);
  }
  function destinations(container, records) {
    container.replaceChildren();
    records.forEach(r=>{
      const button=document.createElement('button');button.className='destination';button.textContent=`[${r.coords}] ${r.name} → Konuma git`;
      button.addEventListener('click',()=>jump(r.coords).catch(e=>alert(e.message)));
      const date=document.createElement('div');date.className='seen';date.textContent=`Son görülme: ${new Date(r.at).toLocaleString('tr-TR')}`;
      container.append(button,date);
    });
  }
  async function navigationAllowed() {
    const scan=await chrome.runtime.sendMessage({type:'OGX_SCAN_STATUS'});
    if(scan.task?.status==='running')throw new Error('Konuma gitmeden önce otomatik taramayı durdur.');
    const auto=await chrome.runtime.sendMessage({type:'OGX_RUN'});
    if(auto.owner)throw new Error('Bu sekmedeki keşif otomasyonunu önce durdur veya hedef defterini başka oyun sekmesinde aç.');
  }
  async function jump(coords) {
    if(navigating)throw new Error('Önceki konum açılıyor; biraz sonra tekrar tıkla.');
    if(A.coords(`[${coords}]`)!==coords)throw new Error('Koordinat geçersiz.');
    navigating=true;
    try {
      await navigationAllowed();
      const [g,s,p]=coords.split(':').map(Number);
      const gi=document.querySelector('#galaxyInput'),si=document.querySelector('#systemInput'),go=document.querySelector('.galaxy-route .x-btn-go');
      if(!gi||!si||!go){
        const link=[...document.querySelectorAll('#left-menu-1 a[href]')].find(a=>a.textContent.trim().toLocaleLowerCase('tr-TR')==='galaksi');
        if(!link||new URL(link.href).origin!==origin)throw new Error('Önce oyunun Galaksi ekranını aç; ardından koordinata tekrar tıkla.');
        sessionStorage.setItem(jumpKey,JSON.stringify({coords,at:Date.now()}));location.assign(link.href);return;
      }
      if(g>Number(gi.getAttribute('max-value')||gi.max)||s>Number(si.getAttribute('max-value')||si.max))throw new Error('Koordinat bu sunucunun sınırları dışında.');
      const old=[...document.querySelectorAll('#galaxyContent .galaxy-item')];
      const present=old.find(row=>Number(row.querySelector('.planet-index')?.textContent)===p);
      const presentCoords=A.coords(present?.querySelector('.col-planet-index [data-tooltip-content]')?.getAttribute('data-tooltip-content'));
      const highlight=row=>{row.scrollIntoView({block:'center',behavior:'smooth'});const prev=row.style.outline;row.style.outline='2px solid #ffcf5a';setTimeout(()=>{row.style.outline=prev;},6000);};
      // Route inputs can be edited before AJAX finishes: verify the loaded row too.
      if(+gi.value===g&&+si.value===s&&presentCoords===coords){
        $('book').hidden=true;$('card').hidden=true;hoverToken++;
        highlight(present);scan().catch(console.warn);return;
      }
      for(const [el,v] of [[gi,g],[si,s]]){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
      $('book').hidden=true;$('card').hidden=true;hoverToken++;go.click();
      const until=Date.now()+20000;
      while(Date.now()<until){
        await new Promise(resolve=>setTimeout(resolve,300));
        if(+document.querySelector('#galaxyInput')?.value!==g||+document.querySelector('#systemInput')?.value!==s)throw new Error('Galaksi seçimi değişti; konuma gitme iptal edildi.');
        const rows=[...document.querySelectorAll('#galaxyContent .galaxy-item')];
        const row=rows.find(row=>Number(row.querySelector('.planet-index')?.textContent)===p);
        const found=A.coords(row?.querySelector('[data-tooltip-content]')?.getAttribute('data-tooltip-content'));
        if(row&&!old.includes(row)&&(found===coords||!row.querySelector('.col-player a'))){
          highlight(row);scan().catch(console.warn);return;
        }
      }
      throw new Error('Sistem açılışı doğrulanamadı. Sayfayı kontrol et; kayıt eski olabilir.');
    }finally{navigating=false;}
  }
  async function refreshTargets(selected) {
    const all=await chrome.storage.local.get(null), pin=all[targetKey];
    const players=new Map(),counts=new Map();
    Object.entries(all).filter(([k])=>k.startsWith(intelPrefix)).forEach(([,r])=>{const prev=players.get(r.playerId);if(!prev||r.at>prev.at)players.set(r.playerId,r);counts.set(r.playerId,(counts.get(r.playerId)||0)+1);});
    Object.entries(all).filter(([k])=>k.startsWith(statsPrefix)).forEach(([,r])=>{const prev=players.get(r.playerId);if(!prev||r.at>prev.at)players.set(r.playerId,r);});
    const current=selected||$('players').value||pin?.id,query=$('search-player').value.toLocaleLowerCase('tr-TR');
    $('players').replaceChildren();
    const blank=document.createElement('option');blank.value='';blank.textContent='Kayıtlı oyuncu seç';$('players').append(blank);
    [...players.values()].sort((a,b)=>a.player.localeCompare(b.player,'tr')).filter(r=>r.player.toLocaleLowerCase('tr-TR').includes(query)).forEach(r=>{const o=document.createElement('option');o.value=r.playerId;o.textContent=`${r.player} (${counts.get(r.playerId)||0})`; $('players').append(o);});
    $('players').value=current||'';
    const id=$('players').value, records=recordsFor(all,id);
    $('target-status').textContent=`${pin?`Sabit hedef: ${pin.name}. `:''}${records.length} bilinen gezegen. Yalnızca taranan yerler; tüm gezegenler olduğu garantisi yoktur.`;
    destinations($('target-list'),records);
    statistics($('target-stats'),all,id);
  }
  async function pinPlayer(id,name){await chrome.storage.local.set({[targetKey]:{id,name,at:Date.now()}});$('search-player').value='';$('book').hidden=true;await refreshTargets(id);await refreshDock();}
  function roster() {
    return [...document.querySelectorAll('#other-planets a.planet-select')].map(a => {
      const url = new URL(a.getAttribute('href'), location.href);
      const id = url.searchParams.get('planet'), coords = A.coords(a.querySelector('.planet-coords')?.textContent);
      return { id, coords, name: a.querySelector('.planet-name')?.textContent?.trim() || "Gezegen" };
    }).filter(p => p.id && p.coords);
  }
  async function scan(force = false) {
    if (force) while (scanning) await new Promise(resolve => setTimeout(resolve, 25));
    if (scanning || document.hidden && !force) return;
    scanning = true;
    try {
      const writes = {}, now = Date.now();
      for (const row of document.querySelectorAll('#galaxyContent .galaxy-item')) {
        const player = row.querySelector('.col-player a'), playerId = A.playerId(player?.getAttribute('onclick'));
        const tooltip = row.querySelector('.col-planet-index [data-tooltip-content]')?.getAttribute('data-tooltip-content');
        const coords = A.coords(tooltip), position = Number(row.querySelector('.planet-index')?.textContent?.trim());
        // Coordinates come from the loaded row, not editable route inputs (which may be ahead of AJAX).
        if (!playerId || !coords || Number(coords.split(':')[2]) !== position) continue;
        const alliance=row.querySelector('.col-alliance')?.textContent.trim()||'';
        const moon=!!row.querySelector('.col-moon img,.col-moon [data-tooltip-content],.moon-img');
        const status=[...player.classList].filter(x=>/inactive|vacation|banned|strong|weak|status/i.test(x)).join(' ');
        if(!observedRows.has(row))observedRows.set(row,now);
        const fragment=document.createElement('template');fragment.innerHTML=tooltip||'';
        fragment.content.querySelectorAll('[class*="exclamation-triangle"], [class*="triangle-exclamation"]').forEach(icon=>icon.replaceWith(document.createTextNode('⚠')));
        const activity=A.activity(fragment.content.textContent,observedRows.get(row),tooltip);
        // The game's red activity marker is a background sprite, not an img/icon.
        const planetSprite=[...row.querySelectorAll('.col-planet-index [style]')].some(el=>A.activitySprite(el.getAttribute('style')));
        if(planetSprite)activity.state='active';
        const record = { origin, coords, playerId, player: player.textContent.trim(), name: row.querySelector('.col-planet-name')?.textContent.trim() || 'Gezegen', alliance, moon, status, activity, at: now };
        const key = intelPrefix + coords, signature = JSON.stringify({...record, at:0}), old = memo.get(key);
        if (!old || old.signature !== signature || now - old.at > 60000) { writes[key] = record; memo.set(key, {signature,at:now}); }
      }
      if (Object.keys(writes).length) await chrome.storage.local.set(writes);
    } finally { scanning = false; }
  }
  globalThis.OGXSaveGalaxy = () => scan(true);
  async function showPlayer(anchor) {
    clearTimeout(hideTimer);
    const token = ++hoverToken, id = A.playerId(anchor.getAttribute('onclick'));
    if (!id) return;
    await scan();
    await globalThis.OGXCollectStats?.();
    const all = await chrome.storage.local.get(null);
    if (token !== hoverToken) return;
    const records = Object.entries(all).filter(([key,r]) => key.startsWith(intelPrefix) && r.playerId === id).map(([,r])=>r).sort((a,b)=>a.coords.localeCompare(b.coords,undefined,{numeric:true}));
    const card = $('card'), rect = anchor.getBoundingClientRect();
    card.replaceChildren();
    const title=document.createElement('strong');title.textContent=`${anchor.textContent.trim()} — ${records.length} bilinen gezegen`;
    const pin=document.createElement('button');pin.textContent='Bu oyuncuyu hedef olarak sabitle';pin.addEventListener('click',()=>{card.hidden=true;pinPlayer(id,anchor.textContent.trim()).catch(console.warn);});
    const list=document.createElement('div');destinations(list,records);
    const note=document.createElement('p');note.textContent='Koordinata tıkla → Galaksi sistemini aç. Yalnızca kaydedilmiş gezegenler listelenir.';
    const stats=document.createElement('div');statistics(stats,all,id);
    card.append(title,pin,stats,list,note);
    card.hidden = false;
    const width = Math.min(300, innerWidth - 16), height = Math.min(240, innerHeight - 16);
    const rightSide = rect.right + 12;
    card.style.left = `${Math.max(8, Math.min(rightSide + width <= innerWidth ? rightSide : rect.left - width - 12, innerWidth - width - 8))}px`;
    card.style.top = `${Math.max(8, Math.min(rect.bottom + 12, innerHeight - height - 8))}px`;
  }
  document.addEventListener('pointerover', e => { const a=e.target.closest?.(playerSelector); if (a && !a.contains(e.relatedTarget)) showPlayer(a).catch(console.warn); });
  function laterHide(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!$('card').matches(':hover')&&!$('card').contains(root.activeElement)){hoverToken++;$('card').hidden=true;}},450);}
  $('card').addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  $('card').addEventListener('pointerleave',laterHide);
  document.addEventListener('pointerout', e => { const a=e.target.closest?.(playerSelector); if (a && !a.contains(e.relatedTarget)) laterHide(); });
  document.addEventListener('focusin',e=>{const a=e.target.closest?.(playerSelector);if(a)showPlayer(a).catch(console.warn);});
  document.addEventListener('focusout',laterHide);
  $('card').addEventListener('focusout',laterHide);
  $('players').addEventListener('change',()=>refreshTargets().catch(console.warn));
  $('search-player').addEventListener('input',()=>refreshTargets().catch(console.warn));
  $('pin-player').addEventListener('click',()=>{const el=$('players');if(el.value)pinPlayer(el.value,el.selectedOptions[0].textContent.replace(/ \(\d+\)$/,'')).catch(console.warn);});
  $('unpin-player').addEventListener('click',async()=>{await chrome.storage.local.remove(targetKey);await refreshTargets();});
  async function table() {
    const planets = roster(), keys = planets.map(p=>ownPrefix+p.id), data = await chrome.storage.local.get(keys);
    const table = document.createElement('table'), head = document.createElement('tr');
    for (const title of ['Gezegen','Metal','Kristal','Döteryum','Kayıt zamanı']) {const th=document.createElement('th');th.textContent=title;head.append(th);} table.append(head);
    const totals=[0,0,0]; let seen=0;
    planets.forEach(p=>{
      const r=data[ownPrefix+p.id], tr=document.createElement('tr');
      const vals=[`${p.name} [${p.coords}]`,...['metal','crystal','deuterium'].map((k,i)=>{if(r){totals[i]+=r[k];return r[k].toLocaleString('tr-TR');}return 'Bilinmiyor';}),r?new Date(r.at).toLocaleString('tr-TR'):'Ziyaret edip kaydet'];
      if(r)seen++; vals.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);}); table.append(tr);
    });
    const summary=document.createElement('p');summary.textContent=`Kaydı olan ${seen}/${planets.length} gezegenin son kayıt toplamı: Metal ${totals[0].toLocaleString('tr-TR')} • Kristal ${totals[1].toLocaleString('tr-TR')} • Döteryum ${totals[2].toLocaleString('tr-TR')}. Kayıtlar farklı saatlere ait olabilir.`;
    $('table').replaceChildren(summary,table);
  }
  $('launch').addEventListener('click',async()=>{
    $('book').hidden=false;$('server').textContent=`Sunucu: ${location.hostname}`;$('planet').replaceChildren();
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Şu anda açık olan gezegeni seç';$('planet').append(placeholder);
    roster().forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} [${p.coords}]`;$('planet').append(o);});
    $('note').textContent='Gezegen eşleştirmesi bu sürümde senin onayınla yapılır; yanlış gezegene kaynak kaydedilmemesi için açık gezegeni kontrol et.';await table();await refreshTargets();
  });
  $('close').addEventListener('click',()=>{$('book').hidden=true;$('launch').focus();});
  $('capture').addEventListener('click',async()=>{
    const p=roster().find(p=>p.id===$('planet').value);
    if(!p){$('note').textContent='Önce şu anda açık olan gezegeni seç.';return;}
    const r={...p,origin,at:Date.now()};
    r.resourceInfo={};for(const k of ['metal','crystal','deuterium']){r[k]=A.amount(document.querySelector(`#${k}-amount`)?.textContent);if(r[k]===null){$('note').textContent=`${k} sayacı okunamadı; kayıt yapılmadı.`;return;}r.resourceInfo[k]=A.resourceInfo(document.querySelector(`.resource-item-${k}`)?.getAttribute('data-tooltip-content'));}
    if(!confirm(`Ekrandaki kaynaklar ${p.name} [${p.coords}] gezegenine mi ait?`))return;
    await chrome.storage.local.set({[ownPrefix+p.id]:r});$('note').textContent='Kaydedildi. Diğer gezegenleri ziyaret ederek tabloyu tamamlayabilirsin.';await table();
  });
  $('export').addEventListener('click',async()=>{
    const keys=roster().map(p=>ownPrefix+p.id),data=await chrome.storage.local.get(keys);
    const url=URL.createObjectURL(new Blob([JSON.stringify(Object.values(data),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`ogamex-kaynaklar-${location.hostname}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('book').hidden=true;$('card').hidden=true;hoverToken++;}});
  setInterval(()=>scan().catch(console.warn),5000);scan().catch(console.warn);
  try {
    const raw=sessionStorage.getItem(jumpKey);sessionStorage.removeItem(jumpKey);
    if(raw){const pending=JSON.parse(raw);if(Date.now()-pending.at<120000)(async()=>{
      const deadline=Date.now()+20000;
      while(!document.querySelector('#galaxyInput')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,300));
      if(!document.querySelector('#galaxyInput'))throw new Error('Galaksi ekranı yüklenemedi. Koordinata tekrar tıklamadan önce ekranı kontrol et.');
      await jump(pending.coords);
    })().catch(e=>alert(e.message));}
  }catch(e){console.warn('OGX konum isteği',e);}
})();
