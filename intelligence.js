(() => {
  "use strict";
  if(window.__ogxIntelligence)return;window.__ogxIntelligence=true;
  const origin=location.origin,eventKey=`ogxEvents:${origin}`,reportPrefix=`ogxReport:${origin}:`;
  async function notify(title,message){const cfg=(await chrome.storage.sync.get('ogxAutoExpeditionSettings')).ogxAutoExpeditionSettings||{};if(cfg.notifications!==false)chrome.runtime.sendMessage({type:'OGX_NOTIFY',title,message}).catch(()=>{});}
  async function event(item){const data=await chrome.storage.local.get(eventKey),items=data[eventKey]||[];items.push({...item,at:Date.now()});await chrome.storage.local.set({[eventKey]:items.slice(-1000)});}
  chrome.storage.onChanged.addListener(async(changes,area)=>{
    if(area!=='local')return;
    for(const [key,c] of Object.entries(changes)){
      if(key.startsWith(`ogxIntel:${origin}:`)&&c.oldValue&&c.newValue){const d=OGXIntel.change(c.oldValue,c.newValue);if(d){await event({kind:'GALAXY',...d});const w=(await chrome.storage.local.get(`ogxWatch:${origin}`))[`ogxWatch:${origin}`]||{};if(w[d.playerId])await notify('Hedef değişikliği',`${d.player||'Oyuncu'} [${d.coords}]: ${d.changes.map(x=>x.label).join(', ')}`);}}
      if(key.startsWith(`ogxStats:${origin}:`)&&c.oldValue&&c.newValue&&c.oldValue.value!==c.newValue.value){const delta=c.newValue.value-c.oldValue.value;await event({kind:'STATS',playerId:c.newValue.playerId,player:c.newValue.player,category:c.newValue.category,delta,value:c.newValue.value});const w=(await chrome.storage.local.get(`ogxWatch:${origin}`))[`ogxWatch:${origin}`]||{};if(w[c.newValue.playerId])await notify('Hedef istatistiği değişti',`${c.newValue.player}: ${c.newValue.category} ${delta>0?'+':''}${delta.toLocaleString('tr-TR')}`);}
    }
  });
  async function reports(){
    const nodes=[...document.querySelectorAll('.message-content,.message-body,[data-message-id] .content,.combat-report-content')];
    const updates={};for(const node of nodes){const r=OGXIntel.report(node.innerText);if(!r)continue;const id=node.closest('[data-message-id]')?.getAttribute('data-message-id')||OGXIntel.hash(node.innerText);const key=reportPrefix+id;updates[key]={...r,id,origin,at:Date.now()};}
    const keys=Object.keys(updates);if(keys.length){const old=await chrome.storage.local.get(keys);for(const key of keys)if(old[key])delete updates[key];if(Object.keys(updates).length)await chrome.storage.local.set(updates);}
  }
  setInterval(()=>reports().catch(console.warn),5000);reports().catch(console.warn);
})();
