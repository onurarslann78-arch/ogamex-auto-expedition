(() => {
  const mark=()=>document.documentElement?.setAttribute('data-ogx-sidebar-pending','');
  mark();
  if(!document.documentElement)new MutationObserver((_,o)=>{if(document.documentElement){mark();o.disconnect();}}).observe(document,{childList:true});
  setTimeout(()=>document.documentElement?.removeAttribute('data-ogx-sidebar-pending'),4000);
})();
