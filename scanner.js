(() => {
  "use strict";
  const A = OGXAtlas;
  let task = null, running = false, stopped = false;
  const host = document.createElement('div'), ui = host.attachShadow({mode:'open'});
  ui.innerHTML = `<style>:host{font:13px/1.5 Arial;color:#e7f4ff}button,select{padding:8px;border-radius:5px;border:1px solid #46728c;color:#fff;background:#18334b;cursor:pointer}#open{position:fixed;left:156px;bottom:16px;z-index:2147483646}#box{position:fixed;left:20px;top:15vh;width:360px;max-height:75vh;overflow:auto;background:#101c2b;padding:18px;border:1px solid #6f98b2;border-radius:9px;z-index:2147483647}#box button{margin:4px 0}p{color:#bfcede}[hidden]{display:none!important}progress{width:100%}#close{float:right}</style>
    <button id="open">Otomatik tarama</button><section id="box" hidden><button id="close">Kapat</button><h3>Otomatik tarama v1.0</h3>
    <p>Seçilen ilk galaksinin Sistem 1 konumundan başlar. Her galaksinin tüm sistemlerini bitirip sonraki galaksiye geçer. Hızlı mod varsayılan 1 sn bekler; oyun yavaşsa süreyi artır. Oyuncu defteri güncellenir; filo gönderilmez.</p>
    <label>İlk galaksi <input id="firstGalaxy" type="number" min="1" value="1" style="width:65px"></label> <label>Son galaksi <input id="lastGalaxy" type="number" min="1" style="width:65px"></label> <label>Adım bekleme <input id="scanDelay" type="number" min="1" max="60" value="1" style="width:55px"> sn</label><br>
    <button id="galaxy">Seçilen galaksi aralığını tara</button>
    <hr><p>Kaynak turu: tüm kendi gezegenlerini ziyaret eder. Bitince dönülecek gezegeni seç:</p>
    <select id="initial" aria-label="Dönüş gezegeni"></select><button id="resources">Tüm gezegenlerin kaynaklarını güncelle</button>
    <p>Her iki tarama da keşfi durdurur. Bitince keşfi doğru gezegende kendin yeniden başlat. Tarama sırasında bu sekmede gezinme.</p>
    <progress id="progress" max="1" value="0"></progress><p id="status">Hazır</p><button id="stop">Taramayı durdur</button></section>`;
  document.documentElement.append(host);const $=id=>ui.getElementById(id);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function rpc(m){const r=await chrome.runtime.sendMessage(m);if(r?.error)throw new Error(r.error);return r;}
  function roster(){return [...document.querySelectorAll('#other-planets a.planet-select')].map(a=>({id:new URL(a.href).searchParams.get('planet'),coords:A.coords(a.querySelector('.planet-coords')?.textContent),name:a.querySelector('.planet-name')?.textContent.trim()||'Gezegen'})).filter(p=>p.id&&p.coords);}
  function target(){return OGXCore.scanTarget(task.done,task.systems||task.total,task.galaxy,task.lastGalaxy||task.galaxy);}
  function render(){if(!task)return;const next=task.kind==='galaxy'?target():null;$('progress').max=task.total;$('progress').value=task.done;$('status').textContent=`${task.kind==='galaxy'?(next?`Galaksi ${next.galaxy} • Sistem ${next.system}`:'Galaksi taraması tamamlandı'):'Kaynak turu'} • ${task.done}/${task.total} • ${task.message}${task.status==='running'?' • Çalışıyor':''}`;}
  async function active(){if(stopped)throw new Error('Tarama durduruldu.');const r=await rpc({type:'OGX_SCAN_STATUS'});if(!r.owner||r.task?.id!==task.id||r.task.status!=='running')throw new Error('Tarama durdu veya sahipliği değişti.');task=r.task;if(!navigator.onLine)throw new Error('İnternet bağlantısı kesildi.');}
  async function wait(ms){const until=Date.now()+ms;while(Date.now()<until){if(stopped)throw new Error('Tarama durduruldu.');await sleep(Math.min(250,until-Date.now()));}}
  function choose(selector,value){const el=document.querySelector(selector);if(!el)throw new Error('Galaksi kontrolleri bulunamadı.');el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  async function loadSystem(galaxy,system){
    await active();const old=[...document.querySelectorAll('#galaxyContent .galaxy-item')];
    const button=document.querySelector('.galaxy-route .x-btn-go');if(!button)throw new Error('Galaksi Git düğmesi bulunamadı.');
    choose('#galaxyInput',galaxy);choose('#systemInput',system);button.click();
    const deadline=Date.now()+25000;let stableSince=0;
    while(Date.now()<deadline){
      await wait(300);
      if(+document.querySelector('#galaxyInput')?.value!==galaxy||+document.querySelector('#systemInput')?.value!==system)throw new Error('Galaksi/sistem değiştirildi; tarama durdu.');
      const rows=[...document.querySelectorAll('#galaxyContent .galaxy-item')];
      const replaced=rows.length>=15&&rows.some(row=>!old.includes(row));
      const coords=rows.map(row=>A.coords(row.querySelector('.col-planet-index [data-tooltip-content]')?.getAttribute('data-tooltip-content'))).filter(Boolean);
      const matched=coords.every(c=>c.startsWith(`${galaxy}:${system}:`));
      if(replaced&&matched){if(!stableSince)stableSince=Date.now();if(Date.now()-stableSince>=500){await active();await globalThis.OGXSaveGalaxy();return;}}else stableSince=0;
    }
    throw new Error(`Sistem ${system} yüklenmesi doğrulanamadı (25 sn). Eski liste yeni sistem olarak kaydedilmedi.`);
  }
  async function execute(){
    if(running)return;running=true;
    try{
      await active();
      if(task.kind==='galaxy'){
        while(task.done<task.total){const step=task.done+1,next=target();if(!next)throw new Error('Tarama hedefi hesaplanamadı.');$('status').textContent=`Galaksi ${next.galaxy} • Sistem ${next.system} yükleniyor…`;
          await loadSystem(next.galaxy,next.system);await active();
          task=(await rpc({type:'OGX_SCAN_STEP',id:task.id,step})).task;render();
          if(task.status!=='running')break;await wait((task.delay||5)*1000);
        }
      }else{
        const expected=task.planets[task.done];
        const actual=new URL(location.href);actual.hash='';
        if(actual.href!==task.targetUrl)throw new Error('Kaynak turu hedef sayfası değişti. Baştan başlatın.');
        await wait(2000);await active();
        const text=document.querySelector('#content-wrapper')?.innerText||'';
        const found=text.match(/Koordinatlar\s*:?\s*(\[\d+:\d+:\d+\])/i);
        if(!found||A.coords(found[1])!==expected.coords)throw new Error('Genel bakış koordinatı hedef gezegenle doğrulanamadı; kaynak kaydedilmedi.');
        const values={},resourceInfo={};for(const k of ['metal','crystal','deuterium']){values[k]=A.amount(document.querySelector(`#${k}-amount`)?.textContent);if(values[k]===null)throw new Error(`${k} sayacı okunamadı.`);const tip=document.querySelector(`.resource-item-${k}`)?.getAttribute('data-tooltip-content');resourceInfo[k]=A.resourceInfo(tip);}
        task=(await rpc({type:'OGX_SCAN_STEP',id:task.id,step:task.done+1,values,resourceInfo})).task;render();
        await wait(5000);
        if(task.status==='complete'){if(!stopped)location.assign(task.returnUrl);}
        else{await active();location.assign(task.targetUrl);}
      }
    }catch(e){
      if(!stopped&&task?.status==='running'){try{task=(await rpc({type:'OGX_SCAN_ERROR',id:task.id,message:e.message})).task;}catch{}}
      $('status').textContent=e.message;render();
    }finally{running=false;}
  }
  $('open').addEventListener('click',async()=>{$('box').hidden=false;$('initial').replaceChildren();const first=document.createElement('option');first.value='';first.textContent='Tur sonunda dönülecek gezegen';$('initial').append(first);roster().forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} [${p.coords}]`;$('initial').append(o);});const max=document.querySelector('#galaxyInput')?.getAttribute('max-value')||document.querySelector('#galaxyInput')?.max;$('lastGalaxy').value=max||'';const r=await rpc({type:'OGX_SCAN_STATUS'});task=r.task;render();});
  $('close').addEventListener('click',()=>{$('box').hidden=true;});
  $('galaxy').addEventListener('click',async()=>{
    try{
      const galaxy=Number($('firstGalaxy').value),galaxyInput=document.querySelector('#galaxyInput'),input=document.querySelector('#systemInput');
      const serverLast=Number(galaxyInput?.getAttribute('max-value')||galaxyInput?.max),lastGalaxy=Number($('lastGalaxy').value),delay=Number($('scanDelay').value);
      const end=Number(input?.getAttribute('max-value')||input?.max);
      if(!Number.isInteger(galaxy)||galaxy<1||!Number.isInteger(lastGalaxy)||lastGalaxy<galaxy||lastGalaxy>serverLast||!Number.isInteger(end)||end<1||delay<1||delay>60)throw new Error('Galaksi aralığı veya bekleme süresi geçersiz. Önce Galaksi ekranını açın.');
      if(!confirm(`Galaksi ${galaxy}–${lastGalaxy}, her birinde sistem 1–${end}: toplam ${(lastGalaxy-galaxy+1)*end} sistem taransın mı? Saatler sürebilir. Keşif durdurulacak. Bu sekmede işlem yapmayın.`))return;
      task=(await rpc({type:'OGX_SCAN_START',kind:'galaxy',galaxy,lastGalaxy,end,delay})).task;stopped=false;render();execute();
    }catch(e){$('status').textContent=e.message;}
  });
  $('resources').addEventListener('click',async()=>{
    try{
      const planets=roster(),initial=$('initial').value;
      if(!initial)throw new Error('Önce tur sonunda dönülecek gezegeni seçin.');
      if(!confirm(`${planets.length} gezegenin kaynakları sırayla okunsun mu? Keşif durdurulacak.`))return;
      task=(await rpc({type:'OGX_SCAN_START',kind:'resources',planets,initial})).task;stopped=false;render();location.assign(task.targetUrl);
    }catch(e){$('status').textContent=e.message;}
  });
  $('stop').addEventListener('click',async()=>{stopped=true;if(task){try{task=(await rpc({type:'OGX_SCAN_STOP',id:task.id})).task;}catch(e){$('status').textContent=e.message;}}render();});
  chrome.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c.ogxScan&&task?.id===c.ogxScan.newValue?.id){task=c.ogxScan.newValue;render();if(task.status!=='running'&&task.status!=='complete')stopped=true;}});
  (async()=>{const r=await rpc({type:'OGX_SCAN_STATUS'});if(r.owner){task=r.task;render();if(task.status==='running'){$('box').hidden=false;execute();}}})().catch(console.warn);
})();
