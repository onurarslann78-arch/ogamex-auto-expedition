"use strict";
globalThis.OGXIntel = {
  change(before, after) {
    if (!before || !after) return null;
    const fields = [["player","Oyuncu adı"],["name","Gezegen adı"],["moon","Ay"],["status","Durum"],["alliance","İttifak"]];
    const changes = fields.filter(([key]) => (before[key] ?? null) !== (after[key] ?? null)).map(([key,label]) => ({key,label,before:before[key]??"—",after:after[key]??"—"}));
    return changes.length ? { coords: after.coords || before.coords, playerId: after.playerId || before.playerId, player: after.player || before.player, changes } : null;
  },
  report(text) {
    const raw=String(text||"").replace(/\s+/g," ").trim(); if(raw.length<20)return null;
    const low=raw.toLocaleLowerCase("tr-TR"); let type="DİĞER";
    if(/karanlık madde/.test(low))type="KARANLIK MADDE";else if(/korsan/.test(low))type="KORSAN";else if(/uzaylı/.test(low))type="UZAYLI";else if(/metal|kristal|döteryum/.test(low))type="KAYNAK";else if(/gemi.*bul|bulunan gemi|filo.*bul/.test(low))type="GEMİ";else if(/hiçbir şey|boş dönd/.test(low))type="BOŞ";else if(/gecik|erken dön/.test(low))type="SÜRE";else return null;
    const amount=(label)=>{const a=raw.match(new RegExp(label+"\\s*:?\\s*([0-9.]+)","i")),b=raw.match(new RegExp("([0-9.]+)\\s*"+label,"i")),m=a||b;return m?Number(m[1].replaceAll(".","")):0;};
    return {type,metal:amount("Metal"),crystal:amount("Kristal"),deuterium:amount("Döteryum"),darkMatter:amount("Karanlık madde"),summary:raw.slice(0,240)};
  },
  hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
};
