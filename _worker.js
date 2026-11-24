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
// Seite holen. Gibt es sie nicht und ein KI-Dienst hat Text verlangt, kommt die Fehlermeldung als Text mit Wegweiser (Status bleibt 404).
const seite = async (env, anfrage, text) => {
  const a = await env.ASSETS.fetch(anfrage);
  if (a.status === 404 && text) return new Response("# Seite nicht gefunden (404)

Diese Adresse gibt es bei der Engelshove Bau GmbH nicht (mehr).

Hier geht es weiter:

- [Startseite](https://www.engelshove.de/)
- [Alle Seiten in Kurzfassung](https://www.engelshove.de/llms.txt)
- [Sitemap](https://www.engelshove.de/sitemap.xml)
- [Kontakt](https://www.engelshove.de/kontakt.html)
", { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8", "Vary": "Accept" } });
  if ((a.headers.get("Content-Type") || "").includes("text/html")) { const b = new Response(a.body, a); b.headers.append("Vary", "Accept"); return b; }
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
      if (!m || (m[1] === "" && m[2] === "")) return new Response(request.method === "HEAD" ? null : voll.body, { status: 200, headers: kopfzeilen });
      const ganz = await voll.arrayBuffer(), lang = ganz.byteLength;
      const von = m[1] === "" ? Math.max(0, lang - Number(m[2])) : Number(m[1]);
      const bis = m[1] === "" || m[2] === "" ? lang - 1 : Math.min(Number(m[2]), lang - 1);
      if (von > bis || von >= lang) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + lang } });
      kopfzeilen.set("Content-Range", "bytes " + von + "-" + bis + "/" + lang); kopfzeilen.set("Content-Length", String(bis - von + 1));
      return new Response(request.method === "HEAD" ? null : ganz.slice(von, bis + 1), { status: 206, headers: kopfzeilen });
    }
    // KI-Dienste, die ausdrücklich Text verlangen (Accept: text/markdown), bekommen die Textfassung der Seite (leistungen.md usw.)
    const will = request.headers.get("Accept") || "";
    const text = will.includes("text/markdown") && !will.trimStart().startsWith("text/html");
    if (text && (p === "/" || p.endsWith(".html"))) {
      const u = new URL(url); u.pathname = p === "/" ? "/index.md" : p.slice(0, -5) + ".md";
      const a = await env.ASSETS.fetch(new Request(u.toString()));
      if (a.ok) { const k = new Headers(a.headers); k.set("Content-Type", "text/markdown; charset=utf-8"); k.set("Vary", "Accept"); return kopf(new Response(a.body, { status: 200, headers: k }), url.hostname); }
    }
    // Seiten mit .html direkt ausliefern
    if (p.endsWith(".html")) {
      const u = new URL(url); u.pathname = p.slice(0, -5);
      return kopf(await seite(env, new Request(u, request), text), url.hostname);
    }
    return kopf(await seite(env, request, text), url.hostname);
  }
};
