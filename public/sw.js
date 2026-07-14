// Service worker mínimo — su único propósito es que el navegador considere
// el sitio instalable como app (ícono en el home, pantalla completa sin
// barra de navegador). No cachea nada a propósito: Moorcado es un
// marketplace en vivo y siempre debe pedir conexión real, nunca mostrar
// catálogo o mensajes desactualizados por una copia offline.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
