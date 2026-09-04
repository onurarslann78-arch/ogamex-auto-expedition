"use strict";
importScripts("core.js");
const KEY = "ogxAutoExpeditionSettings";
let queue = Promise.resolve();
function serial(fn) { const next = queue.then(fn); queue = next.catch(() => {}); return next; }
async function read() { return chrome.storage.local.get(["ogxRun", "ogxLogs", "ogxScan"]); }
async function addLog(message, level = "info", origin = "") {
  const data = await read();
  const logs = data.ogxLogs || [];
  logs.push({ time: new Date().toLocaleString("tr-TR"), at: Date.now(), message: String(message).slice(0, 1500), level, origin });
  await chrome.storage.local.set({ ogxLogs: logs.slice(-500) });
}
async function notify(title, message) { if (chrome.notifications) await chrome.notifications.create({ type:"basic", iconUrl:"icon.svg", title:String(title).slice(0,80), message:String(message).slice(0,250) }); }
async function power() {
  const { ogxRun: run, ogxScan: scan } = await read();
  const data = await chrome.storage.sync.get(KEY);
  if ((run && data[KEY]?.enabled || scan?.status === "running") && data[KEY]?.keepAwake !== false) chrome.power.requestKeepAwake("system");
  else chrome.power.releaseKeepAwake();
}
function gameURL(raw) {
  try { const u = new URL(raw); return /^https?:$/.test(u.protocol) && (u.hostname === "ogamex.net" || u.hostname.endsWith(".ogamex.net")); } catch { return false; }
}
function canonicalURL(raw) { const url = new URL(raw); url.hash = ""; return url.href; }
async function scanMessage(m, sender, data) {
  let task = data.ogxScan;
  const tabId = sender.tab?.id;
  if (m.type === "OGX_SCAN_STATUS") return { task, owner: task?.tabId === tabId };
  if (m.type === "OGX_SCAN_START") {
    if (!gameURL(sender.tab?.url)) throw new Error("OGameX sekmesi gerekli.");
    if (task?.status === "running") throw new Error("Önce devam eden taramayı durdurun.");
    if (data.ogxRun?.pending || data.ogxRun?.busyUntil > Date.now()) throw new Error("Keşif gönderimi doğrulanmadan tarama başlatılamaz.");
    const origin = new URL(sender.tab.url).origin;
    task = { id: crypto.randomUUID(), tabId, origin, kind: m.kind, status: "running", done: 0, updated: Date.now(), message: "Başladı" };
    if (m.kind === "galaxy") {
      if (!Number.isInteger(m.galaxy) || m.galaxy < 1 || !Number.isInteger(m.end) || m.end < 1 || m.end > 10000) throw new Error("Galaksi veya son sistem okunamadı.");
      const lastGalaxy = m.lastGalaxy ?? m.galaxy;
      if (!Number.isInteger(lastGalaxy) || lastGalaxy < m.galaxy || lastGalaxy > 1000) throw new Error("Son galaksi sınırı geçersiz.");
      task.galaxy = m.galaxy; task.lastGalaxy = lastGalaxy; task.systems = m.end;
      task.delay = Number.isFinite(m.delay) ? Math.min(60, Math.max(1, Math.round(m.delay))) : 1;
      task.total = (lastGalaxy - m.galaxy + 1) * m.end;
    } else if (m.kind === "resources") {
      if (!Array.isArray(m.planets) || !m.planets.length || m.planets.length > 200) throw new Error("Gezegen listesi okunamadı.");
      task.planets = m.planets.map(p => {
        if (!/^[a-f0-9-]{36}$/i.test(p.id) || !/^\d+:\d+:\d+$/.test(p.coords)) throw new Error("Gezegen kimliği geçersiz.");
        return { id: p.id, coords: p.coords, name: String(p.name).slice(0, 100), url: `${origin}/home?planet=${encodeURIComponent(p.id)}` };
      });
      if (new Set(task.planets.map(p => p.id)).size !== task.planets.length) throw new Error("Gezegen listesinde tekrar var.");
      const initial = task.planets.find(p => p.id === m.initial);
      if (!initial) throw new Error("Dönüş gezegenini seçin.");
      task.returnUrl = initial.url; task.total = task.planets.length; task.targetUrl = task.planets[0].url;
    } else throw new Error("Bilinmeyen tarama türü.");
    const cfg = (await chrome.storage.sync.get(KEY))[KEY] || {};
    await chrome.storage.sync.set({ [KEY]: { ...cfg, enabled: false } });
    await chrome.storage.local.remove("ogxRun");
    if (data.ogxRun) await chrome.tabs.update(data.ogxRun.tabId, { autoDiscardable: true }).catch(() => {});
    await chrome.storage.local.set({ ogxScan: task });
    await chrome.tabs.update(tabId, { autoDiscardable: false }).catch(() => {});
    await addLog(`Tarama başladı: ${task.kind}, ${task.total} adım. Keşif duraklatıldı.`); await power();
    return { task, owner: true };
  }
  if (!task || task.tabId !== tabId || m.id !== task.id) throw new Error("Tarama sahibi veya kimliği değişti.");
  if (m.type === "OGX_SCAN_STOP") { task.status = "stopped"; task.message = "Kullanıcı durdurdu"; }
  else if (m.type === "OGX_SCAN_ERROR") { task.status = "error"; task.message = String(m.message).slice(0,500); }
  else if (m.type === "OGX_SCAN_STEP") {
    if (task.status !== "running" || m.step !== task.done + 1) throw new Error("Tarama sırası değişti; işlem iptal edildi.");
    if (task.kind === "resources") {
      const p = task.planets[task.done];
      if (canonicalURL(sender.tab.url) !== p.url) throw new Error("Kaynak sayfası hedef gezegenle eşleşmiyor.");
      for (const k of ["metal", "crystal", "deuterium"]) if (!Number.isSafeInteger(m.values?.[k]) || m.values[k] < 0) throw new Error("Kaynak sayacı okunamadı.");
      const resourceInfo={};
      for(const k of ["metal","crystal","deuterium"]){const x=m.resourceInfo?.[k];resourceInfo[k]=x&&Number.isSafeInteger(x.hourly)&&x.hourly>=0&&Number.isSafeInteger(x.capacity)&&x.capacity>=0?{hourly:x.hourly,capacity:x.capacity}:null;}
      await chrome.storage.local.set({ [`ogxOwn:${task.origin}:${p.id}`]: { id:p.id, coords:p.coords, name:p.name, origin:task.origin, at:Date.now(), metal:m.values.metal, crystal:m.values.crystal, deuterium:m.values.deuterium, resourceInfo } });
    }
    task.done = m.step; task.message = `${task.done}/${task.total} tamamlandı`;
    if (task.done >= task.total) task.status = "complete";
    else if (task.kind === "resources") task.targetUrl = task.planets[task.done].url;
  } else throw new Error("Bilinmeyen tarama işlemi.");
  task.updated = Date.now(); await chrome.storage.local.set({ ogxScan: task });
  if (task.status !== "running") {
    await chrome.tabs.update(tabId, { autoDiscardable: true }).catch(() => {});
    await addLog(`Tarama: ${task.message}. Keşif yeniden başlatılmadı.`); await power();
    await notify(task.status === "complete" ? "OGameX taraması tamamlandı" : "OGameX taraması durdu", task.message);
  }
  return { task, owner: true };
}
async function handle(m, sender) {
  const data = await read();
  let run = data.ogxRun;
  const tabId = sender.tab?.id;
  if (m.type?.startsWith("OGX_SCAN_")) return scanMessage(m, sender, data);
  if (m.type === "OGX_LOG") { await addLog(m.message, m.level, sender.tab?.url ? new URL(sender.tab.url).origin : ""); return { ok: true }; }
  if (m.type === "OGX_NOTIFY") {
    if (!gameURL(sender.tab?.url)) throw new Error("Bildirim kaynağı geçersiz.");
    await notify(m.title || "OGameX", m.message || "");
    return { ok: true };
  }
  if (m.type === "OGX_RUN") return { run, logs: (data.ogxLogs || []).slice(-30), owner: run?.tabId === tabId };
  if (m.type === "OGX_ACTIVATE") {
    if (data.ogxScan?.status === "running") throw new Error("Tarama bitmeden keşif başlatılamaz.");
    if (!gameURL(sender.tab?.url)) throw new Error("OGameX sekmesi gerekli.");
    if (!new URL(sender.tab.url).pathname.toLowerCase().includes("autoexpedition")) throw new Error("Adres çubuğunda /fleet/autoexpedition sayfasını açın.");
    if (run && run.tabId !== tabId) throw new Error("Diğer otomasyon sekmesini önce durdurun.");
    run = run || { tabId, url: canonicalURL(sender.tab.url), nextRefresh: Date.now() + 60000, lastSeen: Date.now(), busyUntil: 0, pending: null, hold: "" };
    await chrome.storage.local.set({ ogxRun: run });
    await addLog("Otomasyon bu sekmeye bağlandı."); await power(); return { ok: true, run };
  }
  if (m.type === "OGX_STOP") {
    if (data.ogxScan?.status === "running") {
      data.ogxScan.status = "stopped"; data.ogxScan.message = "Tüm otomasyon durduruldu";
      await chrome.storage.local.set({ ogxScan: data.ogxScan });
      await chrome.tabs.update(data.ogxScan.tabId, { autoDiscardable: true }).catch(() => {});
    }
    if (run) await chrome.tabs.update(run.tabId, { autoDiscardable: true }).catch(() => {});
    await chrome.storage.local.remove("ogxRun");
    const cfg = await chrome.storage.sync.get(KEY);
    await chrome.storage.sync.set({ [KEY]: { ...cfg[KEY], enabled: false } });
    await addLog("Otomasyon durduruldu; uyku engeli kaldırıldı."); await power(); return { ok: true };
  }
  if (!run || run.tabId !== tabId) throw new Error("Bu sekme otomasyon sahibi değil.");
  if (m.type === "OGX_HEARTBEAT") {
    run.lastSeen = Date.now();
    await chrome.storage.local.set({ ogxRun: run });
    return { ok: true };
  }
  if (m.type === "OGX_BEGIN") {
    const cfg = await chrome.storage.sync.get(KEY);
    if (!cfg[KEY]?.enabled || run.pending || run.hold) throw new Error(run.hold || "Gönderim kilitli.");
    run.pending = { before: m.before, expected: m.expected, beforeActive: Number.isInteger(m.beforeActive) ? m.beforeActive : null, at: Date.now() };
    run.busyUntil = Date.now() + 90000;
    await chrome.storage.local.set({ ogxRun: run }); return { ok: true };
  }
  if (m.type === "OGX_CONFIRMED") {
    if (!run.pending || !Array.isArray(m.ids)) throw new Error("Bekleyen gönderim yok.");
    if (!OGXCore.confirmation(run.pending.before, m.ids, run.pending.expected, run.pending.beforeActive, m.active)) throw new Error("Yeni filo veya keşif sayacı artışı doğrulanmadı.");
    run.pending = null; run.hold = ""; run.busyUntil = 0;
  } else if (m.type === "OGX_HOLD") {
    run.hold = String(m.reason); run.busyUntil = 0;
    run.nextRefresh = Math.min(run.nextRefresh, Date.now() + 60000);
  } else if (m.type === "OGX_ACK") {
    run.pending = null; run.hold = ""; run.busyUntil = 0;
    await addLog("Kullanıcı filo durumunu kontrol ederek gönderim kilidini kaldırdı.", "warn");
  } else if (m.type === "OGX_RETURN_TIME") {
    if (Number.isFinite(m.at) && m.at > Date.now()) run.nextRefresh = Math.min(run.nextRefresh, Math.max(Date.now() + 60000, m.at + 10000));
  } else return { ok: false };
  await chrome.storage.local.set({ ogxRun: run }); return { ok: true };
}
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (!m?.type?.startsWith("OGX_")) return false;
  serial(() => handle(m, sender)).then(reply, error => reply({ error: error.message }));
  return true;
});
async function watchdog() {
  const { ogxRun: run, ogxScan: scan } = await read();
  if (scan?.status === "running" && Date.now() - scan.updated > 180000) {
    scan.status = "error"; scan.message = "Tarama 3 dakika ilerlemedi. Oturum/bağlantıyı kontrol edin.";
    await chrome.storage.local.set({ ogxScan: scan });
    await chrome.tabs.update(scan.tabId, { autoDiscardable: true }).catch(() => {});
    await addLog(scan.message, "warn");
    await notify("OGameX taraması durdu", scan.message);
  }
  if (!run) { await power(); return; }
  const tab = await chrome.tabs.get(run.tabId).catch(() => null);
  if (!tab || !gameURL(tab.url) || canonicalURL(tab.url) !== run.url) {
    if (tab) await chrome.tabs.update(run.tabId, { autoDiscardable: true }).catch(() => {});
    await addLog("Otomasyon sekmesi kapandı veya adres değişti; yeniden başlatmanız gerekiyor.", "warn");
    await chrome.storage.local.remove("ogxRun"); await power(); return;
  }
  const cfg = (await chrome.storage.sync.get(KEY))[KEY] || {};
  await power();
  await chrome.tabs.update(run.tabId, { autoDiscardable: false }).catch(() => {});
  const now = Date.now();
  const heartbeatStale = cfg.enabled && now - (run.lastSeen || 0) > 90000;
  if (!heartbeatStale && !OGXCore.recovery(run, now, cfg.enabled && cfg.autoRecovery !== false)) return;
  // Only the bound auto-expedition route may be reloaded. Never navigate to a different planet/page.
  if (!new URL(run.url).pathname.toLowerCase().includes("autoexpedition")) return;
  if (tab.status === "loading") return;
  run.nextRefresh = Date.now() + 60000;
  await chrome.storage.local.set({ ogxRun: run });
  await addLog("Dönüş/toparlanma kontrolü: otomasyon sekmesi yenileniyor. Loglar korunur.");
  await chrome.tabs.reload(run.tabId);
}
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === "ogx-watchdog") serial(watchdog).catch(() => {}); });
chrome.tabs.onRemoved.addListener(id => serial(async () => {
  const { ogxScan: scan } = await read();
  if (scan?.tabId === id && scan.status === "running") { scan.status = "stopped"; scan.message = "Sekme kapandı"; await chrome.storage.local.set({ ogxScan: scan }); await power(); }
  const { ogxRun: run } = await read();
  if (run?.tabId === id) { await chrome.storage.local.remove("ogxRun"); await addLog("Sekme kapandı; uyku engeli kaldırıldı."); await power(); }
}));
chrome.storage.onChanged.addListener((_c, area) => { if (area === "sync") serial(power).catch(() => {}); });
chrome.runtime.onStartup.addListener(() => serial(async () => {
  const { ogxScan: scan } = await read();
  if (scan?.status === "running") { scan.status = "stopped"; scan.message = "Tarayıcı kapatıldı"; await chrome.storage.local.set({ ogxScan: scan }); }
  await chrome.storage.local.remove("ogxRun"); await power();
  await addLog("Tarayıcı yeniden açıldı. Doğru hesap/gezegende otomasyonu yeniden başlatın.");
}));
chrome.alarms.create("ogx-watchdog", { periodInMinutes: 0.5 });
serial(power).catch(() => {});
