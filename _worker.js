// www.engelshove.de auf Cloudflare Pages. Erzeugt von tools/cloudflare_seite.py, nicht von Hand ändern.
const ALT = {"/leistungen": "leistungen.html", "/projekte": "projekte.html", "/projekte/einfamilienhaeuser": "wohnhaus.html", "/projekte/gewerbebauten": "gewerbebau.html", "/projekte/interieur": "galerie.html#innen", "/projekte/modernisierung": "umbau.html", "/presse": "presse.html", "/team": "index.html#team", "/kontakt": "kontakt.html", "/impressum": "impressum.html", "/datenschutz": "datenschutz.html", "/karriere": "karriere.html"};
const SEITEN = new Set(["datenschutz", "galerie", "garten-und-pools", "gewerbebau", "google6ce7b31ed2cf2084", "impressum", "karriere", "kontakt", "leistungen", "presse", "projekt-ammerland", "projekt-bergisch", "projekt-klinker", "projekt-lamellen", "projekt-lichtband", "projekt-rheine", "projekte", "umbau", "wohnhaus"]);
const kopf = (antwort, host) => {
  const a = new Response(antwort.body, antwort);
  a.headers.set("X-Content-Type-Options", "nosniff");
  a.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (host.endsWith(".pages.dev")) a.headers.set("X-Robots-Tag", "noindex");   // Testadresse nicht in Google
  return a;
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const kurz = p.replace(/\/index\.html$/, "").replace(/\/+$/, "");
    // Adressen der alten Website: echte Weiterleitung (301)
    if (kurz && ALT[kurz]) return Response.redirect(url.origin + "/" + ALT[kurz], 301);
    if (p === "/index.html") return Response.redirect(url.origin + "/" + url.search, 301);
    // Eine Adresse je Seite: /leistungen führt auf /leistungen.html
    if (kurz && SEITEN.has(kurz.slice(1))) return Response.redirect(url.origin + kurz + ".html" + url.search, 301);
    // Seiten mit .html direkt ausliefern
    if (p.endsWith(".html")) {
      const u = new URL(url); u.pathname = p.slice(0, -5);
      return kopf(await env.ASSETS.fetch(new Request(u, request)), url.hostname);
    }
    return kopf(await env.ASSETS.fetch(request), url.hostname);
  }
};
