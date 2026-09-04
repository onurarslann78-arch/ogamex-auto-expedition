(() => {
  'use strict';
  if(window.__ogxResourcePanel)return;window.__ogxResourcePanel=true;
  const original=document.querySelector('#other-planets');if(!original)return;
  const A=OGXAtlas,R=OGXResources,origin=location.origin,prefix=`ogxOwn:${origin}:`,preference=`ogxResourcePanel:${origin}`;
  const roster=[...original.querySelectorAll('a.planet-select')].map(a=>({id:new URL(a.href).searchParams.get('planet'),coords:A.coords(a.querySelector('.planet-coords')?.textContent),name:a.querySelector('.planet-name')?.textContent.trim()||'Gezegen',href:a.href,image:a.querySelector('img')?.src,moon:a.closest('.planet-item')?.querySelector('a.moon-select')?.href,selected:a.classList.contains('selected')})).filter(p=>p.id&&p.coords);
  if(!roster.length)return;
  const host=document.createElement('div'),root=host.attachShadow({mode:'open'});original.before(host);
  root.innerHTML=`<style>:host{display:block;width:280px;max-width:calc(100vw - 24px);font:11px/1.2 Arial;color:#cce2f1}*{box-sizing:border-box}section{background:#101c26;border:1px solid #365468;padding:5px}header{display:flex;align-items:center;justify-content:space-between;padding:5px}button{background:#203746;border:1px solid #466475;color:#dceaf4;cursor:pointer;font-size:10px;padding:4px}article{display:grid;grid-template-columns:1fr 1fr;gap:5px;border:1px solid transparent;border-bottom-color:#29404c;padding:4px 2px}article.selected{border-color:#e4ba57;background:#393825}a{color:#cce2f1;text-decoration:none}a:hover{color:#fff}img{width:26px;height:26px;float:left;margin-right:4px;border-radius:50%}.identity{min-height:29px}.name{display:block;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:95px}.coords{font-size:10px;color:#8ab7d5}.values{display:flex;flex-direction:column;align-items:flex-end;font-variant-numeric:tabular-nums}.metal{color:#e5a0ad}.crystal{color:#95cef0}.deuterium{color:#a7dfa5}.moon{display:block;background:#182d3b;padding:3px;margin-bottom:3px;color:#ebda75}.age{font-size:9px;color:#a0acb6;grid-column:1/-1}.foot{padding:6px;border-top:1px solid #547083}.note{font-size:10px;color:#b6c5d0;margin-top:5px}[hidden]{display:none!important}</style><section><header><strong>Gezegen kaynakları</strong><button id="toggle">Normal liste</button></header><div id="content"><div id="rows"></div><div class="foot" id="totals"></div><div class="note">≈ Üretim tahmini; harcama ve filo getirileri sonraki ziyarette düzelir. 24 saatten eski kayıt ilerletilmez. Ay kaynakları bilinmiyor.</div></div><p id="status" class="note" role="status"></p></section>`;
  const $=id=>root.getElementById(id),elements=new Map();let saved={},enabled=true;
  host.style.setProperty('width','220px','important');
  const compactStyle=document.createElement('style');compactStyle.textContent=`
    section{padding:3px;font:11px/11px Arial,sans-serif}
    section *{font-family:Arial,sans-serif;font-size:11px;line-height:11px}
    header{height:20px;padding:2px 3px}header strong{font-size:10px;font-weight:normal}
    header button{font-size:9px;line-height:12px;padding:1px 4px}
    article{position:relative;grid-template-columns:minmax(0,1fr) 70px;gap:3px;padding:3px 2px;height:40px;min-height:40px}
    .identity{display:block;min-height:26px;padding-right:15px}.name{font-size:11px;line-height:13px;max-width:70px}.coords{font-size:9px;line-height:11px}
    img{width:22px;height:22px;margin:2px 4px 0 0}
    .values span{font-size:11px;line-height:11px;white-space:nowrap}
    .moon{position:absolute;left:119px;top:10px;display:block;background:none;font-size:15px;line-height:18px;padding:0;margin:0}
    .age{display:none}.foot{padding:4px 2px;font-size:10px;line-height:13px}
    #content>.note{display:none}#status:empty{display:none}#status{font-size:10px;line-height:13px;margin:3px 0}
  `;root.append(compactStyle);
  root.querySelector('header strong').textContent='Kaynaklar ≈';
  root.querySelector('header strong').title='Üretim tahmini. Harcama ve filo getirileri sonraki ziyarette düzelir. Son okuma için gezegen satırının üzerine gel.';
  for(const p of roster){const row=document.createElement('article');row.className=p.selected?'selected':'';const left=document.createElement('div'),link=document.createElement('a');link.href=p.href;link.className='identity';if(p.image){const img=document.createElement('img');img.src=p.image;img.alt='';link.append(img);}const name=document.createElement('span');name.className='name';name.textContent=p.name;const coord=document.createElement('span');coord.className='coords';coord.textContent=p.coords;link.append(name,coord);left.append(link);const right=document.createElement('div');if(p.moon){const moon=document.createElement('a');moon.href=p.moon;moon.className='moon';moon.textContent='☾ Aya git • ?';right.append(moon);}const values=document.createElement('div');values.className='values';right.append(values);const age=document.createElement('div');age.className='age';row.append(left,right,age);$('rows').append(row);elements.set(p.id,{values,age});}
  function render(){const totals={metal:0,crystal:0,deuterium:0};let known=0;for(const p of roster){const r=saved[prefix+p.id],el=elements.get(p.id);el.values.replaceChildren();if(r)known++;for(const k of Object.keys(totals)){const v=R.estimate(r,k,Date.now()),span=document.createElement('span');span.className=k;span.textContent=(v?.estimated?'≈ ':'')+R.compact(v?.value??null);span.title=`${k}: ${v?Math.floor(v.value).toLocaleString('tr-TR'):'Bilinmiyor'}`;el.values.append(span);if(v)totals[k]+=v.value;}el.age.textContent=r?`Son okuma: ${new Date(r.at).toLocaleString('tr-TR')}${Date.now()-r.at>86400000?' • ESKİ':''}`:'Ziyaret et veya kaynak turunu çalıştır';}$('totals').textContent=`Σ ${known}/${roster.length} kayıt • ≈ M ${R.compact(totals.metal)} / K ${R.compact(totals.crystal)} / D ${R.compact(totals.deuterium)}`;}
  function display(){original.hidden=enabled;original.toggleAttribute('data-ogx-hidden',enabled);$('content').hidden=!enabled;$('toggle').textContent=enabled?'Normal liste':'Kaynak paneli';document.documentElement.removeAttribute('data-ogx-sidebar-pending');}
  $('toggle').onclick=()=>{enabled=!enabled;display();chrome.storage.local.set({[preference]:enabled}).catch(console.warn);};
  root.addEventListener('click',async e=>{const link=e.target.closest?.('a');if(!link)return;e.preventDefault();try{const auto=await chrome.runtime.sendMessage({type:'OGX_RUN'}),scan=await chrome.runtime.sendMessage({type:'OGX_SCAN_STATUS'});if(auto.owner||scan.owner&&scan.task?.status==='running')throw new Error('Otomasyon bu sekmede çalışıyor. Önce durdur veya başka oyun sekmesini kullan.');location.assign(link.href);}catch(err){$('status').textContent=err.message;}});
  (async()=>{
    saved=await chrome.storage.local.get(null);enabled=saved[preference]!==false;
    const selected=roster.filter(p=>p.selected),requested=new URL(location.href).searchParams.get('planet');
    const initial=R.initial([...document.scripts].filter(s=>!s.src).map(s=>s.textContent).join('\n'));
    if(selected.length===1&&initial&&(!requested||requested===selected[0].id)&&!original.querySelector('.moon-select.selected')){
      const p=selected[0],resourceInfo={};for(const k of ['metal','crystal','deuterium'])resourceInfo[k]=A.resourceInfo(document.querySelector(`.resource-item-${k}`)?.getAttribute('data-tooltip-content'));
      const r={id:p.id,coords:p.coords,name:p.name,origin,...initial,at:performance.timeOrigin,resourceInfo};const key=prefix+p.id;
      if(!saved[key]||saved[key].at<=r.at){await chrome.storage.local.set({[key]:r});saved[key]=r;}
    }
    display();render();
    root.querySelectorAll('.moon').forEach(a=>{a.textContent='☾';a.title='Aya git • Ay kaynakları bilinmiyor';a.setAttribute('aria-label','Aya git');});
  })().catch(err=>{$('status').textContent=err.message;original.hidden=false;original.removeAttribute('data-ogx-hidden');document.documentElement.removeAttribute('data-ogx-sidebar-pending');});
  chrome.storage.onChanged.addListener((c,area)=>{if(area!=='local')return;let changed=false;for(const [k,v] of Object.entries(c))if(k.startsWith(prefix)){if(v.newValue)saved[k]=v.newValue;else delete saved[k];changed=true;}if(changed)render();});
  setInterval(()=>{if(enabled&&!document.hidden)render();},1000);
  root.addEventListener('pointerover',e=>{const row=e.target.closest?.('article');if(row)row.title=row.querySelector('.age')?.textContent||'';});
})();
