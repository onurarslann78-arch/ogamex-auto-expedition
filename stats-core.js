"use strict";
globalThis.OGXStats = {
  labels: { POINTS: "Toplam puan", BUILDING: "Bina istatistiği", RESEARCH: "Araştırma istatistiği", FLEET: "Filo istatistiği", DEFENSE: "Savunma istatistiği" },
  record(main, category, row) {
    if (main !== "PLAYER" || !Object.hasOwn(this.labels, category)) return null;
    const playerId = OGXAtlas.playerId(row.handler);
    const rank = OGXAtlas.amount(row.rank), value = OGXAtlas.amount(row.value);
    if (!playerId || rank === null || rank < 1 || value === null || !String(row.name || "").trim()) return null;
    return { playerId, player: String(row.name).trim(), category, rank, value };
  },
  freshRows(rows, previous) {
    return rows.length > 0 && (!previous?.length || rows.every(row => !previous.includes(row)));
  }
};
