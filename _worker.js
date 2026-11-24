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
    // Film und Musik: Teilstücke ausliefern (Safari und iPhone spielen sonst nicht ab)
    if (/\.(mp4|mp3)$/.test(p)) {
      const voll = await env.ASSETS.fetch(new Request(url.toString()));
      if (!voll.ok) return voll;
      const kopfzeilen = new Headers(voll.headers); kopfzeilen.set("Accept-Ranges", "bytes");
      const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") || "");
      const lang = Number(voll.headers.get("Content-Length")) || 0;
      if (!m || (m[1] === "" && m[2] === "") || !lang) return new Response(request.method === "HEAD" ? null : voll.body, { status: 200, headers: kopfzeilen });
      const von = m[1] === "" ? Math.max(0, lang - Number(m[2])) : Number(m[1]);
      const bis = m[1] === "" || m[2] === "" ? lang - 1 : Math.min(Number(m[2]), lang - 1);
      if (von > bis || von >= lang) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + lang } });
      kopfzeilen.set("Content-Range", "bytes " + von + "-" + bis + "/" + lang); kopfzeilen.set("Content-Length", String(bis - von + 1));
      if (request.method === "HEAD") return new Response(null, { status: 206, headers: kopfzeilen });
      if (von === 0 && bis === lang - 1) return new Response(voll.body, { status: 206, headers: kopfzeilen });
      return new Response((await voll.arrayBuffer()).slice(von, bis + 1), { status: 206, headers: kopfzeilen });
    }
    // Seiten mit .html direkt ausliefern
    if (p.endsWith(".html")) {
      const u = new URL(url); u.pathname = p.slice(0, -5);
      return kopf(await env.ASSETS.fetch(new Request(u, request)), url.hostname);
    }
    return kopf(await env.ASSETS.fetch(request), url.hostname);
  }
};
