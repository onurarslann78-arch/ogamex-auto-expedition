"use strict";
globalThis.OGXCore = {
  scanTarget(done, systems, firstGalaxy, lastGalaxy) {
    if (![done, systems, firstGalaxy, lastGalaxy].every(Number.isInteger) || done < 0 || systems < 1 || firstGalaxy < 1 || lastGalaxy < firstGalaxy) return null;
    const galaxy = firstGalaxy + Math.floor(done / systems);
    return galaxy <= lastGalaxy ? { galaxy, system: done % systems + 1 } : null;
  },
  usage(text) {
    const m = String(text).match(/(?:Keşifler|Expeditions)\s*:\s*(\d+)\s*\/\s*(\d+)/i);
    if (!m || +m[1] > +m[2] || +m[2] < 1) return null;
    return { active: +m[1], capacity: +m[2], open: +m[2] - +m[1] };
  },
  count(usage, options, limit) {
    if (!usage) return 0;
    const ceiling = Math.min(usage.open, Math.max(0, Number(limit) || 0));
    return Math.max(0, ...options.filter(n => Number.isInteger(n) && n > 0 && n <= ceiling));
  },
  confirmation(beforeIds, currentIds, expected, beforeActive, currentActive) {
    if (!Array.isArray(beforeIds) || !Array.isArray(currentIds) || !Number.isInteger(expected) || expected < 1) return false;
    const before=new Set(beforeIds),added=new Set(currentIds.filter(id=>id&&!before.has(id))).size;
    if (added >= expected) return true;
    return Number.isInteger(beforeActive) && Number.isInteger(currentActive) && currentActive - beforeActive >= expected;
  },
  recovery(run, now, enabled) {
    if (!enabled || !run || run.busyUntil > now) return false;
    return now >= run.nextRefresh;
  }
};
