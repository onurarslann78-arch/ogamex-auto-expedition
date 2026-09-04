(() => {
  "use strict";
  if (window.__ogxAutoExpeditionLoaded) return;
  window.__ogxAutoExpeditionLoaded = true;
  const KEY = "ogxAutoExpeditionSettings";
  const defaults = { enabled: false, expeditionCount: "5", expeditionDuration: "60", expeditionFleetSpeed: "100", fleetGroup: "", delayMin: 5, delayMax: 10, maxRetries: 5, showPanel: true, keepAwake: true, autoRecovery: true, notifications: true };
  let settings = { ...defaults }, logs = [], panel, owner = false, run = null;
  let tracked = new Set(), missing = new Map(), sending = false, polling = false;
  let generation = 0, retries = 0, due = 0, busy = false, heartbeatAt = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const ready = () => !!document.querySelector("#auto-expedition-container");
  const ids = () => new Set([...document.querySelectorAll('tr.row-mission-type-EXPEDITION[data-fleet-id]')].map(el => el.dataset.fleetId).filter(Boolean));
  const usage = () => OGXCore.usage(document.body?.innerText || "");
  async function rpc(message) {
    const result = await chrome.runtime.sendMessage(message);
    if (result?.error) throw new Error(result.error);
    return result;
  }
  function log(message, level = "info") {
    logs.push({ time: new Date().toLocaleString("tr-TR"), message, level }); logs = logs.slice(-30);
    rpc({ type: "OGX_LOG", message, level }).catch(() => {}); render();
  }
  function assertActive(token) {
    if (token !== generation || !settings.enabled || !owner || !ready()) throw new Error("İşlem iptal edildi veya sayfa değişti.");
  }
  function count() {
    const select = document.querySelector("#expeditionCount");
    const opts = [...(select?.options || [])].filter(o => !o.disabled).map(o => Number(o.value));
    return OGXCore.count(usage(), opts, settings.expeditionCount);
  }
  function choose(selector, value, optional = false) {
    if (optional && !value) return;
    const el = document.querySelector(selector);
    if (!el || ![...el.options].some(o => o.value === String(value) && !o.disabled)) throw new Error(`${selector}: ${value} seçeneği kullanılamıyor.`);
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (el.value !== String(value)) throw new Error("Oyun ayarı kabul etmedi.");
  }
  function selectAll() {
    const root = document.querySelector("#auto-expedition-container");
    let button = root?.querySelector('#btnSelectAll, #selectAll, .btn-select-all, .select-all, [data-action="select-all"], [data-action="selectAll"]');
    if (!button) button = [...(root?.querySelectorAll("button,a,[role=button],[title],[data-original-title],[data-title],[aria-label]") || [])].find(el => {
      const label = [el.textContent, ...["title", "data-original-title", "data-title", "aria-label"].map(a => el.getAttribute(a))].join(" ").toLocaleLowerCase("tr-TR");
      return /tümünü seç|tumunu sec|select all/.test(label);
    });
    if (!button) throw new Error('"Tümünü seç" düğmesi bulunamadı.');
    button.click();
  }
  async function prepare(token) {
    assertActive(token);
    if (!navigator.onLine) throw new Error("İnternet bağlantısı yok; gönderim bekliyor.");
    if (!usage()) throw new Error("Keşifler: aktif/kapasite okunamadı; güvenlik için gönderilmedi.");
    const expected = count();
    if (!expected) throw new Error("Boş veya seçilebilir keşif slotu yok.");
    choose("#fleetGroupSelect", settings.fleetGroup, true);
    choose("#expeditionCount", expected);
    choose("#expeditionDuration", settings.expeditionDuration);
    choose("#expeditionFleetSpeed", settings.expeditionFleetSpeed);
    selectAll(); await sleep(1000); assertActive(token);
    const button = document.querySelector("#btnSend");
    if (!button || button.disabled || button.classList.contains("disabled") || button.getAttribute("aria-disabled") === "true") throw new Error("Gönder butonu pasif: gemi, döteryum veya filo slotunu kontrol edin.");
    if (Number(document.querySelector("#expeditionCount")?.value) !== expected) throw new Error("Keşif sayısı değişti; gönderim iptal edildi.");
    return { button, expected };
  }
  async function attempt() {
    if (sending) return;
    sending = true; const token = generation; let journaled = false;
    try {
      const { button, expected } = await prepare(token);
      const before = [...ids()], beforeActive = usage()?.active;
      await rpc({ type: "OGX_BEGIN", before, expected, beforeActive }); journaled = true;
      assertActive(token);
      log(`${expected} keşif gönderiliyor. Tümünü seç uygulandı.`);
      button.click();
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        await sleep(1000); assertActive(token);
        const current = [...ids()], added = current.filter(id => !before.includes(id)), active = usage()?.active;
        if (OGXCore.confirmation(before,current,expected,beforeActive,active)) {
          await rpc({ type: "OGX_CONFIRMED", ids: current, active });
          log(`Gönderim doğrulandı: ${added.length} yeni filo kaydı, keşif sayacı ${active ?? '?'}.`);
          rpc({type:"OGX_NOTIFY",title:"Keşifler gönderildi",message:`${expected} keşif gönderimi doğrulandı.`}).catch(()=>{});
          retries = 0; tracked = ids(); return;
        }
      }
      throw new Error("Gönderim sonucu belirsiz/kısmi. Tekrar tıklama kilitlendi; filo hareketlerini kontrol edin.");
    } catch (error) {
      if (token !== generation) return;
      log(error.message, "warn");
      rpc({type:"OGX_NOTIFY",title:"Keşif otomasyonu durumu",message:error.message}).catch(()=>{});
      if (journaled) await rpc({ type: "OGX_HOLD", reason: error.message }).catch(() => {});
      else if (++retries >= Number(settings.maxRetries)) await rpc({ type: "OGX_HOLD", reason: "Hazırlık deneme sınırı doldu. Sayfayı kontrol edip kilidi kaldırın." }).catch(() => {});
      else due = Date.now() + Math.min(60000, 5000 * 2 ** (retries - 1));
    } finally { sending = false; render(); }
  }
  async function poll() {
    if (polling || sending) return;
    polling = true;
    try {
      const info = await rpc({ type: "OGX_RUN" }); owner = info.owner; run = info.run;
      if (!owner || !settings.enabled || !ready()) { render(); return; }
      if (Date.now() - heartbeatAt >= 30000) { await rpc({ type: "OGX_HEARTBEAT" }); heartbeatAt = Date.now(); }
      const current = ids();
      if (run.pending) {
        const active=usage()?.active;
        if (OGXCore.confirmation(run.pending.before,[...current],run.pending.expected,run.pending.beforeActive,active)) {
          await rpc({ type: "OGX_CONFIRMED", ids: [...current], active }); log("Yenileme sonrası bekleyen gönderim filo kimliği/sayaç ile doğrulandı.");
        }
        render(); return;
      }
      if (run.hold) { render(); return; }
      for (const id of tracked) {
        if (current.has(id)) missing.delete(id);
        else { missing.set(id, (missing.get(id) || 0) + 1); if (missing.get(id) >= 2) { tracked.delete(id); missing.delete(id); log(`Keşif kaydı ayrıldı: ${id}. Boş slot doğrulanacak.`);rpc({type:"OGX_NOTIFY",title:"Keşif filosu döndü",message:"Boş keşif slotu doğrulanıyor; yeniden gönderim hazırlanacak."}).catch(()=>{}); } }
      }
      current.forEach(id => tracked.add(id));
      // The longest stage of each fleet is its estimated return. It only schedules a fresh view, never a send.
      const maxima = new Map();
      document.querySelectorAll('tr.row-mission-type-EXPEDITION[data-fleet-id]').forEach(row => {
        const raw = row.querySelector("[data-remaining-seconds]")?.getAttribute("data-remaining-seconds");
        if (raw === null || raw === undefined || raw === "") return;
        const seconds = Number(raw);
        if (Number.isFinite(seconds) && seconds >= 0) maxima.set(row.dataset.fleetId, Math.max(maxima.get(row.dataset.fleetId) || 0, seconds));
      });
      if (maxima.size) await rpc({ type: "OGX_RETURN_TIME", at: Date.now() + Math.min(...maxima.values()) * 1000 });
      if (count() > 0) {
        if (!due) { due = Date.now() + (Number(settings.delayMin) + Math.random() * (Number(settings.delayMax) - Number(settings.delayMin))) * 1000; log(`${count()} boş keşif slotu; gecikme sonrası hazırlanacak.`); }
        if (Date.now() >= due) { due = 0; await attempt(); }
      } else due = 0;
      render();
    } catch (error) { console.warn("OGX", error.message); }
    finally { polling = false; }
  }
  async function apply(newSettings) {
    const next = { ...defaults, ...newSettings };
    for (const key of ["expeditionCount", "delayMin", "delayMax", "maxRetries"]) if (!Number.isFinite(Number(next[key]))) throw new Error("Sayısal ayarları kontrol edin.");
    if (+next.expeditionCount < 1 || +next.delayMin < 5 || +next.delayMax < +next.delayMin || +next.delayMax > 120 || +next.maxRetries < 1 || +next.maxRetries > 10) throw new Error("Gecikme 5–120 sn, deneme sınırı 1–10 olmalı.");
    if (next.enabled && !ready()) throw new Error("Önce Çoklu Keşif ekranını açın.");
    if (next.enabled) await rpc({ type: "OGX_ACTIVATE" });
    else await rpc({ type: "OGX_STOP" });
    generation++; due = 0; retries = 0; settings = next;
    await chrome.storage.sync.set({ [KEY]: next }); await poll();
  }
  function render() {
    if (!panel) return;
    panel.style.display = settings.showPanel ? "block" : "none";
    panel.querySelector("button").textContent = owner && settings.enabled ? "Durdur" : "Başlat";
    const u = usage();
    panel.querySelector(".ogx-status").textContent = `${owner && settings.enabled ? "Aktif" : "Kapalı / başka sekme"} • Keşif ${u ? `${u.active}/${u.capacity}` : "?"}${run?.hold ? ` • DURDU: ${run.hold}` : run?.pending ? " • Gönderim doğrulaması bekliyor" : ""}`;
    const logEl = panel.querySelector(".ogx-log"); logEl.replaceChildren();
    logs.slice(-8).reverse().forEach(item => { const el = document.createElement("div"); el.textContent = `[${item.time}] ${item.message}`; logEl.append(el); });
  }
  function state() { return { settings: { ...settings, enabled: owner && settings.enabled }, activeFleetCount: ids().size, trackedCount: tracked.size, expeditionUsage: usage(), sending, pageReady: ready(), logs, run }; }
  chrome.runtime.onMessage.addListener((m, _sender, reply) => {
    if (m.type === "OGX_OPEN_MESSAGES") {
      const link = [...document.querySelectorAll("a[href]")].find(item => OGXShare.isMessagePage(item.href, location.origin));
      reply({ url: link?.href || null }); return false;
    }
    if (m.type === "OGX_GET_STATE") { reply(state()); return false; }
    if (m.type === "OGX_SAVE_SETTINGS") { apply(m.settings).then(() => reply(state()), error => reply({ error: error.message })); return true; }
    if (m.type === "OGX_CLEAR_HOLD") { rpc({ type: "OGX_ACK" }).then(() => { retries = 0; due = 0; return poll(); }).then(() => reply(state()), error => reply({ error: error.message })); return true; }
    return false;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[KEY]) { settings = { ...defaults, ...changes[KEY].newValue }; if (!settings.enabled) { generation++; due = 0; } render(); }
  });
  async function init() {
    const saved = await chrome.storage.sync.get(KEY); settings = { ...defaults, ...saved[KEY] };
    const info = await rpc({ type: "OGX_RUN" }); logs = info.logs; owner = info.owner; run = info.run; tracked = ids();
    panel = document.createElement("section"); panel.id = "ogx-autoexp-panel";
    panel.innerHTML = '<div class="ogx-head"><span>OGameX Auto Expedition v1.2.3</span><button type="button">Başlat</button></div><div class="ogx-body"><div class="ogx-status"></div><div class="ogx-log"></div></div>';
    panel.querySelector("button").addEventListener("click", async () => { if (busy) return; busy = true; try { await apply({ ...settings, enabled: !(owner && settings.enabled) }); } catch (error) { log(error.message, "warn"); } finally { busy = false; } });
    document.documentElement.append(panel); render();
    setInterval(poll, 5000); await poll();
  }
  init().catch(error => console.error("OGX başlatılamadı", error));
})();
