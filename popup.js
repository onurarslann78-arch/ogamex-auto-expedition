"use strict";
const ids = ["enabled", "expeditionCount", "expeditionDuration", "expeditionFleetSpeed", "fleetGroup", "delayMin", "delayMax", "maxRetries", "showPanel", "keepAwake", "autoRecovery", "notifications"];
const numbers = new Set(["delayMin", "delayMax", "maxRetries"]);
let tabId;
async function send(message) {
  const result = await chrome.tabs.sendMessage(tabId, message);
  if (result?.error) throw new Error(result.error);
  return result;
}
function fill(settings) { ids.forEach(id => { const el = document.getElementById(id); if (el.type === "checkbox") el.checked = !!settings[id]; else el.value = settings[id] ?? ""; }); }
function values() { return Object.fromEntries(ids.map(id => { const el = document.getElementById(id); return [id, el.type === "checkbox" ? el.checked : numbers.has(id) ? Number(el.value) : el.value.trim()]; })); }
function show(s) {
  const u = s.expeditionUsage;
  document.getElementById("status").textContent = `${s.settings.enabled ? "Aktif" : "Kapalı"} • ${u ? `${u.active}/${u.capacity} keşif` : "Keşif sayacı bulunamadı"}${s.run?.hold ? ` • ${s.run.hold}` : ""}`;
  showLogs(s.logs);
}
function showLogs(logs) { document.getElementById("logs").textContent = (logs || []).slice(-30).reverse().map(x => `[${x.time}] ${x.message}`).join("\n") || "Henüz log yok."; }
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); tabId = tab?.id;
  const savedShare = (await chrome.storage.sync.get("ogxShareHelper")).ogxShareHelper || {};
  document.getElementById("shareUrl").value = savedShare.url || "";
  if (savedShare.text) document.getElementById("shareText").value = savedShare.text;
  try { const s = await send({ type: "OGX_GET_STATE" }); fill(s.settings); show(s); }
  catch { const data = await chrome.storage.local.get("ogxLogs"); showLogs(data.ogxLogs); document.getElementById("status").textContent = "OGameX Çoklu Keşif sekmesini açın ve sayfayı yenileyin. Kalıcı loglar aşağıda."; document.querySelector('#settings button[type="submit"]').disabled = true; }
}
document.getElementById("settings").addEventListener("submit", async event => {
  event.preventDefault();
  try { const s = await send({ type: "OGX_SAVE_SETTINGS", settings: values() }); show(s); document.getElementById("message").textContent = "Ayarlar uygulandı."; }
  catch (error) { document.getElementById("message").textContent = error.message; }
});
document.getElementById("export").addEventListener("click", async () => {
  const data = await chrome.storage.local.get("ogxLogs");
  const blob = new Blob([JSON.stringify(data.ogxLogs || [], null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = "ogamex-loglar.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
});
document.getElementById("stop").addEventListener("click", async () => { await chrome.runtime.sendMessage({ type: "OGX_STOP" }); document.getElementById("enabled").checked = false; document.getElementById("message").textContent = "Otomasyon durduruldu; uyku engeli kaldırıldı."; });
document.getElementById("ack").addEventListener("click", async () => {
  if (!confirm("Filo hareketlerini kontrol ettiniz mi? Kilit kaldırıldığında boş slotlara yeni keşif gönderilebilir.")) return;
  try { show(await send({ type: "OGX_CLEAR_HOLD" })); } catch (error) { document.getElementById("message").textContent = error.message; }
});
document.getElementById("share").addEventListener("click", async () => {
  const output = document.getElementById("shareMessage");
  const result = OGXShare.draft(document.getElementById("shareUrl").value, document.getElementById("shareText").value);
  if (result.error) { output.textContent = result.error; return; }
  try {
    await chrome.storage.sync.set({ ogxShareHelper: { url: result.url, text: result.text } });
    await navigator.clipboard.writeText(result.message);
    let page = null;
    try { page = await send({ type: "OGX_OPEN_MESSAGES" }); } catch { /* Oyun sekmesi açık değilse yalnızca kopyala. */ }
    output.textContent = "Kopyalandı. Alıcıyı seçip yapıştırın ve göndermeden önce kontrol edin.";
    if (page?.url && tabId) await chrome.tabs.update(tabId, { url: page.url });
  } catch (error) { output.textContent = `Kopyalanamadı: ${error.message}`; }
});
init();
