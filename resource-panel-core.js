"use strict";
globalThis.OGXResources = {
  initial(text) {
    const block=String(text).match(/\bvar\s+resources\s*=\s*\{([^}]+)\}/)?.[1];
    if(!block)return null;
    const out={};
    for(const [key,field] of [['metal','initialMetal'],['crystal','initialCrystal'],['deuterium','initialDeuterium']]){
      const raw=block.match(new RegExp('\\b'+field+'\\s*:\\s*(\\d+(?:\\.\\d+)?)\\s*[,}]?'))?.[1];
      if(raw===undefined)return null;const value=Number(raw);if(!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER)return null;out[key]=Math.floor(value);
    }return out;
  },
  estimate(record,key,now) {
    if(!record||!Number.isFinite(record[key])||!Number.isFinite(record.at))return null;
    const age=Math.max(0,now-record.at),info=record.resourceInfo?.[key];
    if(age>86400000||!Number.isFinite(info?.hourly)||info.hourly<0||!Number.isFinite(info?.capacity))return {value:record[key],estimated:false,stale:true};
    const value=record[key]>=info.capacity?record[key]:Math.min(info.capacity,record[key]+info.hourly*age/3600000);
    return {value:Math.floor(value),estimated:age>0,stale:false};
  },
  compact(n){if(n===null||!Number.isFinite(n))return '?';for(const [size,suffix] of [[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']])if(n>=size)return (n/size).toLocaleString('tr-TR',{maximumFractionDigits:2})+suffix;return Math.floor(n).toLocaleString('tr-TR');}
};
