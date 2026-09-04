"use strict";
(function (root) {
  const MAX_MESSAGE_LENGTH = 1500;
  function draft(rawUrl, rawText) {
    let url;
    try { url = new URL(String(rawUrl || "").trim()); }
    catch { return { error: "Geçerli bir herkese açık indirme bağlantısı girin." }; }
    if (url.protocol !== "https:" || url.username || url.password) return { error: "Bağlantı https:// ile başlamalı ve herkese açık olmalı. Yerel dosya bağlantısı kullanılamaz." };
    const text = String(rawText || "").trim();
    if (!text) return { error: "Paylaşılacak mesajı yazın." };
    const message = `${text}\n${url.href}`;
    if (message.length > MAX_MESSAGE_LENGTH) return { error: `Mesaj ${MAX_MESSAGE_LENGTH} karakterden kısa olmalı.` };
    return { url: url.href, text, message };
  }
  function isMessagePage(href, origin) {
    try {
      const url = new URL(href, origin);
      return url.origin === origin && /\/(?:messages?|chat)(?:[\/?#]|$)/i.test(url.pathname);
    } catch { return false; }
  }
  root.OGXShare = { draft, isMessagePage, MAX_MESSAGE_LENGTH };
})(typeof globalThis !== "undefined" ? globalThis : window);
