(() => {
  "use strict";
  if (window.__ogxStats) return;
  window.__ogxStats = true;
  let lastCategory = null, lastRows = [], staleRows = null, signature = "", stableAt = 0, savedSignature = "", saving = false;
  const rows = () => [...document.querySelectorAll('#statistics-container .statistics-section tbody tr')];
  document.addEventListener('click', event => {
    const el = event.target.closest?.('#statistics-container .navigation, #statistics-container .statistics-section');
    if (el && !event.target.closest('tbody tr')) { staleRows = rows(); signature = ""; }
  }, true);
  document.addEventListener('change', event => {
    if (event.target.closest?.('#statistics-container')) { staleRows = rows(); signature = ""; }
  }, true);
  function status(root, text) {
    let note = root.querySelector('[data-ogx-stat-status]');
    if (!note) { note = document.createElement('p'); note.dataset.ogxStatStatus = '1'; note.style.cssText = 'color:#acd8ed;font:12px Arial;padding:8px;'; root.append(note); }
    note.textContent = text;
  }
  async function collect() {
    if (saving) return;
    const root = document.querySelector('#statistics-container');
    if (!root) { lastCategory = null; lastRows = []; staleRows = null; signature = ''; return; }
    const main = root.querySelector('.x-main-category.active')?.getAttribute('data-category');
    const category = root.querySelector('.x-sub-category.active')?.getAttribute('data-sub-category');
    const currentCategory = `${main}:${category}`, currentRows = rows();
    if (lastCategory && currentCategory !== lastCategory) { staleRows = lastRows; signature = ''; }
    lastCategory = currentCategory; lastRows = currentRows;
    if (main !== 'PLAYER' || !Object.hasOwn(OGXStats.labels, category)) { status(root, 'Oyuncu istatistik kaydı: bu kategori kaydedilmiyor.'); return; }
    if (staleRows && !OGXStats.freshRows(currentRows, staleRows)) { status(root, 'OGX: yeni kategori/sayfa tablosunun yüklenmesi bekleniyor.'); return; }
    staleRows = null;
    const records = currentRows.map(row => {
      const cells = [...row.children].filter(el => el.tagName === 'TD');
      const player = row.querySelector('a[onclick*="ShowPlayerBadgeDialog"]');
      const valueCell = cells[cells.length - 1];
      const primary = [...(valueCell?.children || [])].find(el => el.tagName === 'DIV' && !el.classList.contains('x-points-change'));
      return OGXStats.record(main, category, { handler: player?.getAttribute('onclick'), name: player?.textContent, rank: cells[0]?.textContent, value: primary?.textContent ?? valueCell?.textContent });
    }).filter(Boolean);
    if (!records.length) { status(root, 'OGX: doğrulanabilir oyuncu satırı yok; kayıt yapılmadı.'); return; }
    const nextSignature = JSON.stringify([currentCategory, records]);
    if (nextSignature !== signature) { signature = nextSignature; stableAt = Date.now(); return; }
    if (Date.now() - stableAt < 1200 || signature === savedSignature) return;
    saving = true;
    try {
      const now = Date.now(), updates = {};
      records.forEach(r => { updates[`ogxStats:${location.origin}:${r.playerId}:${category}`] = { ...r, at: now, origin: location.origin, source: location.href }; });
      await chrome.storage.local.set(updates); savedSignature = nextSignature;
      status(root, `OGX: ${records.length} oyuncunun ${OGXStats.labels[category]} kaydı alındı (${new Date(now).toLocaleTimeString('tr-TR')}). Yalnızca bu sayfa.`);
    } finally { saving = false; }
  }
  globalThis.OGXCollectStats = collect;
  setInterval(() => collect().catch(console.warn), 1000);
  collect().catch(console.warn);
})();
