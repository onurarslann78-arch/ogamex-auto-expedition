"use strict";
globalThis.OGXAtlas = {
  activitySprite(style) {
    const s=String(style||'');
    return /galaxy-icon-kit\.gif(?:[?][^)]*)?/i.test(s) && /(?:\)|background-position\s*:)\s*-60px\s+0(?:px)?(?:\s|;|$)/i.test(s) && !/(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(s);
  },
  activity(text, at, markup = '') {
    if(!text)return {state:'unknown',at};
    const match=String(text).match(/(?:Aktivite|Activite|Activity)\s*:\s*([^\n]*)/i);
    if(!match)return {state:'none',at};
    const minutes=match[1].match(/^(\d+)\s*(?:dakika|dk|min)/i);
    if(minutes)return {state:'minutes',minutes:Number(minutes[1]),at};
    if(/[⚠▲△]/.test(match[1]))return {state:'active',at};
    // Font/image icons have no textContent. Inspect only the activity value,
    // never the transport/spy links that also contain icons.
    const value=String(markup).split(/(?:Aktivite|Activite|Activity)\s*(?:<[^>]*>\s*)*:/i)[1]?.split(/<\/div\s*>|<a\b|<br\b|Nakliye|Casusluk|Saldırı/i)[0] || '';
    if([...value.matchAll(/\bstyle\s*=\s*(["'])(.*?)\1/gi)].some(m=>this.activitySprite(m[2])))return {state:'active',at};
    if(/<(?:i|img|svg)\b/i.test(value)&&!/(?:display\s*:\s*none|visibility\s*:\s*hidden|\bhidden\b)/i.test(value))return {state:'active',at};
    return {state:'unknown',at};
  },
  coords(text) {
    const m = String(text || "").match(/\[(\d+):(\d+):(\d+)\]/);
    if (!m || +m[1] < 1 || +m[2] < 1 || +m[3] < 1 || +m[3] > 15) return null;
    return `${+m[1]}:${+m[2]}:${+m[3]}`;
  },
  playerId(handler) {
    return String(handler || "").match(/ShowPlayerBadgeDialog\(\s*['"]([a-fA-F0-9-]{36})['"]\s*\)/)?.[1]?.toLowerCase() || null;
  },
  amount(text) {
    const s = String(text ?? "").trim();
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(s)) return null;
    const n = Number(s.replace(/\./g, ""));
    return Number.isSafeInteger(n) ? n : null;
  },
  resourceInfo(html) {
    const text=String(html||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ");
    const read=label=>{const m=text.match(new RegExp(label+"\\s*:?\\s*([0-9.]+)","i"));return m?this.amount(m[1]):null;};
    const hourly=read("Saatlik üretim"),capacity=read("Depo kapasitesi");
    return hourly===null&&capacity===null?null:{hourly,capacity};
  }
};
