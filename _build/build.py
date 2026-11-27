#!/usr/bin/env python3
"""Used.Market static site generator.

Renders every page from _build/content/** fragments and data/*.json into static HTML
at the repository root. Run:  python3 _build/build.py
No third-party packages required.
"""
import datetime as dt
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "_build", "content")
DATA = os.path.join(ROOT, "data")

SITE = {
    "name": "Used.Market",
    "url": "https://used.market",
    "tagline": "Check here before you buy or sell used",
    "adsense": "ca-pub-6620975821265271",
    "contact_url": "https://web.works/contact",
    "twitter": "",
}
TODAY = dt.date.today().isoformat()
H = html.escape


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


PLATFORMS = load("platforms.json")["items"]
PLAT = {p["id"]: p for p in PLATFORMS}
CATS = load("categories.json")["items"]
CAT = {c["id"]: c for c in CATS}

TOOLS = [
    ("where-to-sell", "Where-to-Sell Router", "🧭", "Ranks the best platforms for your item, value, region and priority — with estimated payout.", "y"),
    ("fee-calculator", "Fee & Payout Calculator", "💸", "Compare what you actually keep on 15+ platforms after selling and processing fees.", ""),
    ("value-estimator", "Used Value Estimator", "🏷️", "A transparent depreciation model: fair range, list price and quick-sale price.", "y"),
    ("scam-checker", "Scam Message Checker", "🚨", "Paste a buyer or seller message and get a risk score with 24 red-flag rules.", "c"),
    ("recall-check", "Recall Checker", "⚠️", "Search recent product recalls before you buy used baby gear, e-bikes, appliances and more.", "c"),
    ("inspection-checklists", "Inspection Checklists", "✅", "Tick-through checklists for 14 categories with must-pass checks. Saved on your device.", ""),
    ("listing-builder", "Listing Builder", "✍️", "Generate a title and description that fits each platform's character limits.", "y"),
    ("meetup-planner", "Safe Meetup & Payment Planner", "🤝", "The safest payment method and meeting spot for your deal's value and type.", ""),
    ("used-vs-new", "Buy Used vs New", "⚖️", "Cost per year of use, including warranty, repair risk and resale value.", ""),
    ("declutter-cash", "Declutter Cash Calculator", "📦", "Add your items and see total cash, time required and your effective hourly rate.", "y"),
    ("condition-grader", "Condition Grader", "🔎", "Five questions to the right condition grade and honest wording for your listing.", ""),
]

NAV_TOOLS = TOOLS[:8]

pages = []  # list of dicts: path, title, description, body, crumbs, schema, scripts, noads, exit, section, keywords, priority


def rel_prefix(path):
    depth = len([p for p in path.strip("/").split("/") if p]) if path not in ("", "index.html") else 0
    if path.endswith(".html") and "/" not in path:
        depth = 0
    return "../" * depth


def out_file(path):
    if path in ("", "index.html"):
        return os.path.join(ROOT, "index.html")
    if path.endswith(".html"):
        return os.path.join(ROOT, path)
    return os.path.join(ROOT, path.strip("/"), "index.html")


def canonical(path):
    if path in ("", "index.html"):
        return SITE["url"] + "/"
    return SITE["url"] + "/" + path


# ---------------------------------------------------------------- components
def ad(kind="incontent"):
    return '<div class="ad-slot" data-ad="%s" aria-label="Advertisement"></div>' % kind


def lead_band(cat=None, title=None, text=None):
    c = CAT.get(cat) if cat else None
    t = title or ("Selling %s? Let buyers come to you." % c["name"].lower() if c else "Have something to sell? Get offers instead of haggling.")
    x = text or "Tell us what it is once. We route qualified requests to vetted buyers, consignment shops and resale partners in our network — free, with no obligation."
    opts = "".join('<option value="%s"%s>%s</option>' % (k["id"], " selected" if c and k["id"] == c["id"] else "", H(k["name"])) for k in CATS)
    return """<div class="cta-band"><div><span class="tag">Free · no obligation</span><h2 class="mt1">%s</h2><p>%s</p></div>
<form class="mini-lead" action="{{R}}sell/" method="get"><select name="category" aria-label="Category">%s</select><input type="number" name="value" min="0" placeholder="Approx. value ($)" aria-label="Approximate value"><button class="btn btn-yellow" type="submit">Get offers →</button></form></div>""" % (H(t), H(x), opts)


def faq_html(faq):
    if not faq:
        return ""
    items = "".join("<details><summary>%s</summary><div><p>%s</p></div></details>" % (H(q), a) for q, a in faq)
    return '<section class="faq" aria-label="Frequently asked questions"><h2>Frequently asked questions</h2>%s</section>' % items


def faq_schema(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub("<[^>]+>", "", a)}} for q, a in faq]}


def tool_cards(items=None, cls="g3"):
    items = items or TOOLS
    return '<div class="grid %s">' % cls + "".join(
        '<a class="card tool-card" href="{{R}}tools/%s/"><div class="ico %s">%s</div><h3>%s</h3><p>%s</p><span class="go">Open tool →</span></a>' % (s, c, i, H(n), H(d))
        for s, n, i, d, c in items) + "</div>"


def cat_cards():
    return '<div class="grid g4">' + "".join(
        '<a class="card" href="{{R}}categories/%s/"><div class="ico">%s</div><h3 style="font-size:1.08rem">%s</h3><p class="small muted mb0">%s</p></a>' % (c["id"], c["icon"], H(c["name"]), H(", ".join(PLAT[p]["name"].split(" (")[0] for p in c["platforms"][:3])))
        for c in CATS) + "</div>"


def video(vid, title):
    return '<div><div class="video" data-yt="%s" data-title="%s" aria-label="Play video: %s"></div><p class="small mt1"><strong>%s</strong></p></div>' % (vid, H(title), H(title), H(title))


# ---------------------------------------------------------------- layout
def header(cur):
    dd = "".join('<a href="{{R}}tools/%s/"><span class="ico">%s</span><span><strong>%s</strong><span class="d">%s</span></span></a>' % (s, i, H(n), H(d)) for s, n, i, d, c in NAV_TOOLS)
    dd += '<a href="{{R}}tools/"><span class="ico">🧰</span><span><strong>All 11 tools</strong><span class="d">Used vs new, declutter cash, condition grader…</span></span></a>'

    def cur_attr(sec):
        return ' aria-current="page"' if cur == sec else ""
    return """<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><span class="tb-ico" aria-hidden="true">✉️</span><a href="%s" target="_blank" rel="noopener">Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership</a></div>
<header class="site-header"><div class="container hdr">
<a class="logo" href="{{R}}" aria-label="Used.Market home"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 9a4 4 0 0 1 4-4h12.3a4 4 0 0 1 2.8 1.2l10.7 10.7a4 4 0 0 1 0 5.6L22.5 34.8a4 4 0 0 1-5.6 0L6.2 24.1A4 4 0 0 1 5 21.3z" fill="#FFD23F" stroke="#0E3B2E" stroke-width="2.4"/><circle cx="13" cy="13" r="3" fill="#0E3B2E"/><path d="M15.5 25.5l9-9M18 18.5h.01M22 23h.01" stroke="#0E3B2E" stroke-width="2.6" stroke-linecap="round"/></svg><span>Used<span class="dot">.</span>Market</span></a>
<nav class="nav" aria-label="Main">
<button class="icon-btn nav-close" type="button" data-menu-close aria-label="Close menu">✕</button>
<div class="dd"><button type="button" aria-expanded="false" aria-haspopup="true">Tools <span aria-hidden="true">▾</span></button><div class="dd-menu">%s</div></div>
<a href="{{R}}marketplaces/"%s>Marketplaces</a>
<a href="{{R}}categories/"%s>Categories</a>
<a href="{{R}}guides/"%s>Guides</a>
<a href="{{R}}news/"%s>News &amp; Recalls</a>
<a href="{{R}}videos/"%s>Videos</a>
<a class="nav-cta" href="{{R}}sell/">Get Offers →</a>
</nav>
<div class="hdr-actions"><a class="icon-btn" href="{{R}}search/" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></a><button class="icon-btn" type="button" data-theme-toggle aria-label="Switch theme">☾</button><a class="btn btn-yellow btn-sm btn-cta" href="{{R}}sell/">Get Offers</a><button class="icon-btn menu-btn" type="button" data-menu aria-expanded="false" aria-label="Open menu">☰</button></div>
</div></header><div class="nav-scrim"></div>""" % (SITE["contact_url"], dd, cur_attr("marketplaces"), cur_attr("categories"), cur_attr("guides"), cur_attr("news"), cur_attr("videos"))


def footer():
    tools = "".join('<li><a href="{{R}}tools/%s/">%s</a></li>' % (s, H(n)) for s, n, i, d, c in TOOLS[:7])
    return """<footer class="site-footer"><div class="container">
<div class="f-grid">
<div class="f-brand"><a class="logo" href="{{R}}" style="color:#fff"><span>Used<span class="dot">.</span>Market</span></a><p class="mt1">The neutral command centre for the used economy: where to sell, what it's worth, what platforms take, and how to stay safe.</p>
<form class="js-form f-news" data-kind="newsletter" data-subject="Used.Market — newsletter signup" data-success="You're on the list. One useful email a month, no spam."><label class="sr-only" for="f-email">Email</label><input id="f-email" type="email" name="email" required placeholder="Your email"><input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn btn-yellow btn-sm" type="submit">Join</button></form><p class="small" style="color:#8FA79B;margin-top:6px">Monthly resale tips, fee changes and recall alerts.</p></div>
<div><h4>Tools</h4><ul>%s<li><a href="{{R}}tools/">All tools →</a></li></ul></div>
<div><h4>Explore</h4><ul><li><a href="{{R}}marketplaces/">Marketplace directory</a></li><li><a href="{{R}}categories/">Categories</a></li><li><a href="{{R}}guides/">Guides</a></li><li><a href="{{R}}news/">News &amp; recalls</a></li><li><a href="{{R}}videos/">Video academy</a></li><li><a href="{{R}}search/">Search</a></li></ul></div>
<div><h4>Get involved</h4><ul><li><a href="{{R}}sell/">Get offers</a></li><li><a href="{{R}}partners/">Advertise &amp; partner</a></li><li><a href="{{R}}support/">Support us</a></li><li><a href="{{R}}contests/">Contests &amp; prizes</a></li><li><a href="{{R}}careers/">Careers</a></li><li><a href="{{R}}about/">About</a></li><li><a href="{{R}}contact/">Contact</a></li></ul></div>
<div><h4>Legal</h4><ul><li><a href="{{R}}privacy/">Privacy policy</a></li><li><a href="{{R}}terms/">Terms of use</a></li><li><a href="{{R}}cookies/">Cookie policy</a></li><li><a href="{{R}}disclaimer/">Disclaimer</a></li><li><a href="{{R}}trademark/">Trademark &amp; copyright</a></li><li><a href="{{R}}editorial-policy/">Editorial policy</a></li><li><a href="{{R}}affiliate-disclosure/">Advertising disclosure</a></li><li><a href="{{R}}accessibility/">Accessibility</a></li><li><a href="{{R}}sitemap/">Sitemap</a></li></ul></div>
</div>
<p class="f-disclaimer">Used.Market is an independent information service. We are not a marketplace and we don't buy, sell, hold or ship items. Platform names are trademarks of their owners and are used only to identify them; no endorsement or affiliation is implied. Fees and policies change — always confirm on the platform. See our <a href="{{R}}trademark/">Trademark &amp; Copyright Disclosure</a>.</p>
<div class="f-bottom"><span>© <span data-year>%s</span> Used.Market. All rights reserved.</span><span><a href="#" data-cookie-settings>Cookie settings</a> · <a href="{{R}}privacy/">Privacy</a> · <a href="{{R}}terms/">Terms</a></span></div>
</div></footer>
<div class="cookie" role="dialog" aria-live="polite" aria-label="Cookie consent"><p><strong>Cookies &amp; ads.</strong> We use cookies for essential site features and Google AdSense to keep Used.Market free. You can allow personalised ads or keep ads non-personalised. <a href="{{R}}cookies/">Learn more</a>.</p><div class="btns"><button class="btn btn-sm" type="button" data-consent="all">Accept all</button><button class="btn btn-sm btn-ghost" type="button" data-consent="essential">Non-personalised only</button></div></div>""" % (tools, TODAY[:4])


def exit_modal():
    opts = "".join('<option value="%s">%s</option>' % (c["id"], H(c["name"])) for c in CATS)
    return """<div class="modal" id="exit-modal" role="dialog" aria-modal="true" aria-labelledby="exit-h"><div class="modal-box"><button class="icon-btn modal-x" type="button" data-close aria-label="Close">✕</button>
<span class="tag">Before you go</span><h3 id="exit-h" class="mt1">Want offers on your item instead?</h3><p class="small">One short form. We route it to buyers and resale partners for your category. Free, no obligation.</p>
<form class="js-form" data-kind="exit-intent-lead" data-subject="Used.Market — quick lead (exit intent)" data-success="Got it! Watch your inbox for next steps."><div class="field"><label for="x-cat">What are you selling?</label><select id="x-cat" name="category" required><option value="">Choose a category</option>%s</select></div><div class="field"><label for="x-mail">Email</label><input id="x-mail" type="email" name="email" required placeholder="you@example.com"></div><input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn btn-coral btn-block" type="submit">Send me offers</button></form></div></div>""" % opts


def layout(pg):
    path = pg["path"]
    R = rel_prefix(path)
    title = pg["title"] if pg.get("raw_title") else (pg["title"] + " | Used.Market" if path not in ("", "index.html") else pg["title"])
    desc = pg["description"]
    schema = list(pg.get("schema") or [])
    if pg.get("crumbs") is not None and path not in ("", "index.html"):
        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE["url"] + "/"}]
        for i, (n, p) in enumerate(pg["crumbs"] + [(pg.get("crumb") or pg["title"], path)]):
            items.append({"@type": "ListItem", "position": i + 2, "name": n, "item": canonical(p)})
        schema.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})
    if pg.get("faq"):
        schema.append(faq_schema(pg["faq"]))
    ld = "".join('<script type="application/ld+json">%s</script>' % json.dumps(s, ensure_ascii=False, separators=(",", ":")) for s in schema)
    ads = "" if pg.get("noads") else '<meta name="google-adsense-account" content="%s">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>' % (SITE["adsense"], SITE["adsense"])
    robots = "noindex,follow" if pg.get("noindex") else "index,follow,max-image-preview:large"
    scripts = "".join('<script src="%sassets/js/%s" defer></script>' % (R, s) for s in pg.get("scripts", []))
    crumbs_html = ""
    if pg.get("crumbs") is not None and path not in ("", "index.html") and not pg.get("hide_crumbs"):
        parts = ['<a href="{{R}}">Home</a>'] + ['<a href="{{R}}%s">%s</a>' % (p, H(n)) for n, p in pg["crumbs"]] + ['<span aria-current="page">%s</span>' % H(pg.get("crumb") or pg["title"])]
        crumbs_html = '<nav class="crumbs" aria-label="Breadcrumb">' + '<span aria-hidden="true">/</span>'.join(parts) + "</nav>"
    body = pg["body"].replace("{{CRUMBS}}", crumbs_html)
    doc = """<!doctype html>
<html lang="en" data-root="%(R)s" data-theme="light">
<head>
<meta charset="utf-8">%(base)s
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="%(robots)s">
<link rel="canonical" href="%(canon)s">
<meta name="theme-color" content="#0E3B2E">
<meta property="og:site_name" content="Used.Market"><meta property="og:type" content="%(ogtype)s"><meta property="og:title" content="%(title)s"><meta property="og:description" content="%(desc)s"><meta property="og:url" content="%(canon)s"><meta property="og:image" content="%(url)s/assets/img/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="%(title)s"><meta name="twitter:description" content="%(desc)s"><meta name="twitter:image" content="%(url)s/assets/img/og.png">
%(ads)s
<link rel="icon" href="%(R)sassets/img/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="%(R)sassets/img/icon-192.png"><link rel="manifest" href="%(R)smanifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="%(R)sassets/css/site.css?v=%(v)s">
<script>try{var t=localStorage.getItem("um_theme");if(t)document.documentElement.setAttribute("data-theme",JSON.parse(t));else if(matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>
%(ld)s
</head>
<body>
%(header)s
<main id="main">
%(body)s
</main>
%(footer)s
%(exit)s
<script src="%(R)sassets/js/config.js?v=%(v)s"></script>
<script src="%(R)sassets/js/site.js?v=%(v)s"></script>
%(scripts)s
</body>
</html>
""" % {"R": R, "title": H(title), "desc": H(desc), "robots": robots, "canon": canonical(path), "ogtype": pg.get("og_type", "website"), "url": SITE["url"], "ads": ads,
       "ld": ld, "header": header(pg.get("section")), "body": body, "footer": footer(), "exit": exit_modal() if pg.get("exit") else "", "scripts": scripts, "v": TODAY.replace("-", ""),
       "base": '\n<script>document.write(\'<base href="\'+(/github\\.io$/.test(location.hostname)?"/used-market/":"/")+\'">\')</script>' if pg.get("base_dynamic") else ""}
    return doc.replace("{{R}}", R).replace("{{UPDATED}}", TODAY).replace("{{YEAR}}", TODAY[:4])


# ---------------------------------------------------------------- content loading
META_RE = re.compile(r"^\s*<!--\s*(\{.*?\})\s*-->", re.S)


def read_fragment(fp):
    with open(fp, encoding="utf-8") as f:
        txt = f.read()
    m = META_RE.match(txt)
    if not m:
        raise SystemExit("Missing meta header in %s" % fp)
    meta = json.loads(m.group(1))
    return meta, txt[m.end():]


def expand(body, meta):
    body = body.replace("{{AD}}", ad()).replace("{{AD_SIDE}}", ad("sidebar"))
    body = body.replace("{{TOOLS_GRID}}", tool_cards()).replace("{{CATS_GRID}}", cat_cards())
    body = body.replace("{{FAQ}}", faq_html(meta.get("faq")))
    body = re.sub(r"\{\{LEAD(?::([a-z-]+))?\}\}", lambda m: lead_band(m.group(1)), body)
    body = re.sub(r"\{\{VIDEO:([\w-]+):([^}]+)\}\}", lambda m: video(m.group(1), m.group(2)), body)
    body = re.sub(r"\{\{TOOLCARDS:([\w,-]+)\}\}", lambda m: tool_cards([t for t in TOOLS if t[0] in m.group(1).split(",")], "g3"), body)
    body = body.replace("{{GUIDES_GRID}}", guides_grid(GUIDES))
    body = re.sub(r"\{\{GUIDES:([\w,-]+)\}\}", lambda m: guides_grid([g for g in GUIDES if g["slug"] in m.group(1).split(",")]), body)
    return body


GUIDES = []


def guides_grid(gs, cls="g3"):
    return '<div class="grid %s">' % cls + "".join(
        '<a class="card" href="{{R}}guides/%s/"><span class="tag green">%s</span><h3 class="mt1" style="font-size:1.12rem">%s</h3><p class="small muted">%s</p><span class="go">Read · %s min →</span></a>' % (g["slug"], H(g["cat"]), H(g["title"]), H(g["description"]), g["minutes"])
        for g in gs) + "</div>"


def load_guides():
    d = os.path.join(CONTENT, "guides")
    for fn in sorted(os.listdir(d)):
        if fn.endswith(".html"):
            meta, body = read_fragment(os.path.join(d, fn))
            meta["body"] = body
            GUIDES.append(meta)
    GUIDES.sort(key=lambda g: (g.get("order", 50), g["title"]))


def tool_lookup(slug):
    for t in TOOLS:
        if t[0] == slug:
            return t
    return None


def guide_page(g):
    body = expand(g["body"], {})
    heads = re.findall(r"<h2>(.*?)</h2>", body)
    toc = ""
    for h2 in heads:
        sid = re.sub(r"[^a-z0-9]+", "-", re.sub("<[^>]+>", "", h2).lower()).strip("-")
        body = body.replace("<h2>%s</h2>" % h2, '<h2 id="%s">%s</h2>' % (sid, h2), 1)
        toc += '<li><a href="#%s">%s</a></li>' % (sid, re.sub("<[^>]+>", "", h2))
    toc_html = '<nav class="toc" aria-label="Contents"><h4>In this guide</h4><ol>%s</ol></nav>' % toc if toc else ""
    # in-content ad after 2nd h2 section
    parts = body.split("<h2 ", 3)
    if len(parts) > 3:
        body = parts[0] + "<h2 " + parts[1] + "<h2 " + parts[2] + ad() + "<h2 " + parts[3]
    tools = [tool_lookup(t) for t in g.get("tools", []) if tool_lookup(t)]
    side_tools = "".join('<li><a href="{{R}}tools/%s/">%s %s</a></li>' % (t[0], t[2], H(t[1])) for t in tools)
    related = [x for x in GUIDES if x["slug"] != g["slug"] and x["cat"] == g["cat"]][:4]
    side_rel = "".join('<li><a href="{{R}}guides/%s/">%s</a></li>' % (x["slug"], H(x["title"])) for x in related)
    sources = ""
    if g.get("sources"):
        sources = '<h2 id="sources">Sources &amp; further reading</h2><ul class="small">' + "".join('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>' % (H(u), H(t)) for t, u in g["sources"]) + "</ul>"
    vid = ""
    if g.get("video"):
        vid = '<div class="mt2">' + video(g["video"][0], g["video"][1]) + '<p class="small muted">Third-party video embedded via YouTube\'s privacy-enhanced mode. Views are the creator\'s own.</p></div>'
    cat_link = g.get("category")
    html_body = """<div class="container"><div class="article-hero">{{CRUMBS}}<span class="tag green">%(cat)s</span><h1 class="mt1">%(title)s</h1><p class="lede" style="font-size:1.15rem;color:var(--ink-2);max-width:760px">%(desc)s</p>
<div class="byline"><span>By the Used.Market editorial team</span><span>Updated %(upd)s</span><span>%(min)s min read</span></div></div>
<div class="layout"><article class="prose">%(toc)s%(body)s%(vid)s%(sources)s
<div class="author"><div class="av">UM</div><div><strong>Used.Market Editorial</strong><div class="small muted">Researched from platform policies, regulator guidance and real sold data. <a href="{{R}}editorial-policy/">How we research</a>.</div></div></div>
%(faq)s</article>
<aside class="sidebar"><div class="side-card"><h4>Tools for this</h4><ul>%(tools)s</ul></div>%(adside)s<div class="side-card"><h4>Related guides</h4><ul>%(rel)s</ul></div><div class="side-card" style="background:var(--green);color:#EAF5EF;border:0"><h4 style="color:#fff">Selling it?</h4><p class="small">Get offers from buyers and resale partners — free.</p><a class="btn btn-yellow btn-sm" href="{{R}}sell/%(lead)s">Get offers →</a></div></aside></div>
<div class="mt3">%(leadband)s</div></div>""" % {
        "cat": H(g["cat"]), "title": H(g["title"]), "desc": H(g["description"]), "upd": g.get("updated", TODAY), "min": g["minutes"], "toc": toc_html, "body": body,
        "vid": vid, "sources": sources, "faq": faq_html(g.get("faq")), "tools": side_tools, "adside": ad("sidebar"), "rel": side_rel or '<li><a href="{{R}}guides/">All guides</a></li>',
        "lead": ("?category=%s" % cat_link) if cat_link else "", "leadband": lead_band(cat_link)}
    art = {"@context": "https://schema.org", "@type": "Article", "headline": g["title"], "description": g["description"], "datePublished": g.get("date", TODAY), "dateModified": g.get("updated", TODAY),
           "author": {"@type": "Organization", "name": "Used.Market Editorial"}, "publisher": {"@type": "Organization", "name": "Used.Market", "logo": {"@type": "ImageObject", "url": SITE["url"] + "/assets/img/icon-512.png"}},
           "mainEntityOfPage": canonical("guides/%s/" % g["slug"]), "image": SITE["url"] + "/assets/img/og.png"}
    pages.append({"path": "guides/%s/" % g["slug"], "title": g["title"], "description": g["description"], "body": html_body, "crumbs": [("Guides", "guides/")], "crumb": g.get("short", g["title"]),
                  "schema": [art], "faq": g.get("faq"), "section": "guides", "og_type": "article", "keywords": g.get("keywords", ""), "exit": True, "priority": "0.7"})


def category_pages():
    for c in CATS:
        plats = [PLAT[p] for p in c["platforms"] if p in PLAT]
        pl = "".join('<div class="rank"><div class="n">%d</div><div><h4><a href="%s" target="_blank" rel="noopener nofollow">%s</a></h4><div class="small muted">%s · %s</div><p class="why">%s</p></div></div>' % (i + 1, p["url"], H(p["name"]), H(p["type"]), H(p["feeText"]), H(p["bestFor"])) for i, p in enumerate(plats))
        buy = "".join("<li>%s</li>" % H(x) for x in c["buy"])
        sell = "".join("<li>%s</li>" % H(x) for x in c["sell"])
        flags = "".join("<li>%s</li>" % H(x) for x in c["flags"])
        crit = [x[0] for x in c["check"] if x[1] == "crit"]
        crit_html = "".join("<li><strong>%s</strong></li>" % H(x) for x in crit)
        vids = "".join(video(v, "Video: inspecting used %s" % c["name"].lower()) for v in c.get("videos", []))
        rel_g = [g for g in GUIDES if g.get("category") == c["id"]]
        faq = [
            ("Where is the best place to sell used %s?" % c["name"].lower(), "It depends on value, speed and whether the item ships well. For %s, the platforms most sellers start with are %s. Run our <a href=\"{{R}}tools/where-to-sell/?category=%s\">Where-to-Sell Router</a> to rank them for your item." % (c["name"].lower(), ", ".join(p["name"] for p in plats[:3]), c["id"])),
            ("How much are used %s worth?" % c["name"].lower(), "As a rule of thumb, %s lose about %d%% of their value in the first year and around %d%% a year after that, depending on brand and condition. Use the <a href=\"{{R}}tools/value-estimator/?category=%s\">Used Value Estimator</a>, then confirm with recent sold listings." % (c["name"].lower(), c["dep"]["y1"], c["dep"]["yr"], c["id"])),
            ("What must I check before buying used %s?" % c["name"].lower(), "The must-pass checks are: " + "; ".join(crit[:4]) + ". Our interactive checklist covers the rest."),
        ]
        body = """<div class="container"><div class="article-hero">{{CRUMBS}}<span class="tag">%(icon)s Category</span><h1 class="mt1">Buy &amp; sell used %(lname)s</h1><p style="font-size:1.15rem;color:var(--ink-2);max-width:780px">%(intro)s</p>
<div class="chips mt2"><a class="btn" href="{{R}}tools/value-estimator/?category=%(id)s">What's mine worth?</a><a class="btn btn-ghost" href="{{R}}tools/where-to-sell/?category=%(id)s">Where to sell it</a><a class="btn btn-ghost" href="{{R}}tools/inspection-checklists/?category=%(id)s">Inspection checklist</a><a class="btn btn-coral" href="{{R}}sell/?category=%(id)s#get-offers">Get offers</a></div></div>
<div class="layout"><div class="prose">
<h2>Best places to sell used %(lname)s</h2><p>Ranked by typical fit for this category. Fees shown are seller-side and change often — compare exact payouts in the <a href="{{R}}tools/fee-calculator/">Fee Calculator</a>.</p>%(pl)s
%(ad)s
<h2>Buying used %(lname)s: what the pros check</h2><ul>%(buy)s</ul>
<div class="callout warn"><h4>Must-pass checks before you pay</h4><ul class="mb0">%(crit)s</ul></div>
<h2>Selling used %(lname)s for the best price</h2><ul>%(sell)s</ul>
<h2>Red flags</h2><ul>%(flags)s</ul>
<h2>How fast do %(lname)s lose value?</h2><p>Our estimator uses a typical curve for this category: about <strong>%(y1)d%%</strong> in year one, then roughly <strong>%(yr)d%%</strong> a year, with a floor near <strong>%(fl)d%%</strong> of the original price for working items. Brand, condition, completeness (box, accessories, receipts) and seasonal demand move the number up or down.</p>
%(vids)s
%(relg)s
%(faq)s
</div><aside class="sidebar"><div class="side-card"><h4>Tools</h4><ul><li><a href="{{R}}tools/value-estimator/?category=%(id)s">🏷️ Value estimator</a></li><li><a href="{{R}}tools/fee-calculator/">💸 Fee calculator</a></li><li><a href="{{R}}tools/scam-checker/">🚨 Scam checker</a></li><li><a href="{{R}}tools/recall-check/">⚠️ Recall checker</a></li><li><a href="{{R}}tools/listing-builder/">✍️ Listing builder</a></li></ul></div>%(adside)s</aside></div>
<div class="mt3">%(lead)s</div></div>""" % {
            "icon": c["icon"], "lname": H(c["name"].lower()), "intro": H(c["intro"]), "id": c["id"], "pl": pl, "ad": ad(), "buy": buy, "crit": crit_html, "sell": sell, "flags": flags,
            "y1": c["dep"]["y1"], "yr": c["dep"]["yr"], "fl": c["dep"]["floor"], "vids": ('<h2>Watch: inspection walkthroughs</h2><div class="grid g2">%s</div><p class="small muted">Third-party videos via YouTube privacy-enhanced mode.</p>' % vids) if vids else "",
            "relg": ('<h2>Guides for this category</h2>' + guides_grid(rel_g, "g2")) if rel_g else "", "faq": faq_html(faq), "adside": ad("sidebar"), "lead": lead_band(c["id"])}
        pages.append({"path": "categories/%s/" % c["id"], "title": "Buy & Sell Used %s: Prices, Platforms, Checklists" % c["name"], "description": "Where to sell used %s, what they're worth, the must-pass checks before you buy, and red flags to avoid." % c["name"].lower(),
                      "body": body, "crumbs": [("Categories", "categories/")], "crumb": c["name"], "faq": faq, "section": "categories", "keywords": c["name"], "exit": True, "priority": "0.7"})


def directory_page():
    cards = "".join('<article class="card plat"><div class="top"><div><h3 style="font-size:1.08rem;margin:0">%s</h3><div class="small muted">%s</div></div></div><p class="small mb0">%s</p><div class="fee">💸 %s</div><div class="fee">🛡 %s</div><div class="actions"><a class="btn btn-sm" href="%s" target="_blank" rel="noopener nofollow">Visit</a></div></article>' % (H(p["name"]), H(p["type"]), H(p["bestFor"]), H(p["feeText"]), H(p["protection"]), p["url"]) for p in PLATFORMS)
    regions = ["US", "CA", "UK", "EU", "IN", "AU", "NZ", "SG", "MY", "PH", "ES", "FR", "DE", "NL", "JP"]
    body = """<section class="hero" style="padding-bottom:24px"><div class="container">{{CRUMBS}}<span class="tag">%(n)d platforms · neutral</span><h1 class="mt1">Marketplace directory</h1><p class="lede">Every major place to buy, sell, trade in, consign or give away used goods — with fees, protection and a trust score built on the same three criteria regulators use: identity checks, on-platform payment and transaction records.</p></div></section>
<section style="padding-top:0"><div class="container" id="dir-app">
<div class="dir-filters"><label class="sr-only" for="dir-q">Search platforms</label><input id="dir-q" type="search" placeholder="Search: phones, furniture, luxury, Canada…"><select id="dir-cat" aria-label="Category"></select><select id="dir-region" aria-label="Region"><option value="">All regions</option>%(reg)s</select><select id="dir-type" aria-label="Type"></select><select id="dir-mode" aria-label="Local or shipping"><option value="">Local or ship</option><option value="local">Local pickup</option><option value="ship">Ships</option></select><select id="dir-sort" aria-label="Sort"><option value="trust">Sort: trust score</option><option value="price">Best prices</option><option value="speed">Fastest</option><option value="effort">Least effort</option><option value="name">A–Z</option></select></div>
<p class="small muted" id="dir-count"></p>
<div class="grid g3" id="dir-grid">%(cards)s</div>
<p class="small muted mt2">Trust score (0–100) = on-platform payment (40) + identity verification (30) + buyer/seller protection (20) + transaction records (10). It measures safeguards, not product quality. Data updated %(upd)s. Spot an error? <a href="{{R}}contact/">Tell us</a>.</p>
%(ad)s
<div class="mt2">%(lead)s</div>
</div></section>
<div class="cmp-bar" role="region" aria-label="Compare"><span id="cmp-n">0 selected</span><button class="btn btn-yellow btn-sm" type="button" id="cmp-go">Compare</button><button class="btn btn-sm btn-ghost" style="color:var(--paper);border-color:#555" type="button" id="cmp-clear">Clear</button></div>
<div class="modal" id="cmp-modal" role="dialog" aria-modal="true" aria-label="Compare platforms"><div class="modal-box" style="max-width:960px"><button class="icon-btn modal-x" type="button" data-close aria-label="Close">✕</button><h3>Side-by-side comparison</h3><div id="cmp-body"></div></div></div>""" % {
        "n": len(PLATFORMS), "reg": "".join("<option>%s</option>" % r for r in regions), "cards": cards, "upd": load("platforms.json")["updated"], "ad": ad(), "lead": lead_band()}
    pages.append({"path": "marketplaces/", "title": "Marketplace Directory: %d Places to Buy & Sell Used (Fees, Trust Scores)" % len(PLATFORMS), "description": "Compare %d used-goods marketplaces, buyback services and consignment sites by fees, protection, region and trust score." % len(PLATFORMS),
                  "body": body, "crumbs": [], "crumb": "Marketplaces", "scripts": ["tools/common.js", "tools/directory.js"], "section": "marketplaces", "keywords": "marketplace directory platforms compare", "priority": "0.9"})


def news_page():
    news = load("news.json")
    rec = load("recalls.json")
    ni = news.get("items", [])[:40]
    ri = rec.get("items", [])[:24]
    nhtml = "".join('<div class="news-item"><div><div class="src">%s · %s</div><a href="%s" target="_blank" rel="noopener nofollow">%s</a></div></div>' % (H(x.get("source", "")), H(x.get("date", "")), H(x.get("url", "#")), H(x.get("title", ""))) for x in ni) or '<p class="muted">Headlines refresh automatically every day.</p>'
    rhtml = "".join('<div class="card recall mt1"><div class="small muted">%s%s</div><h4 class="mt0"><a href="%s" target="_blank" rel="noopener">%s</a></h4>%s</div>' % (H(x.get("date", "")), (" · Hazard: " + H(", ".join(x.get("hazards", [])))) if x.get("hazards") else "", H(x.get("url", "#")), H(x.get("title", "")), ('<p class="small mb0"><strong>Remedy:</strong> %s</p>' % H(x["remedy"])) if x.get("remedy") else "") for x in ri) or '<p class="muted">Recall data refreshes automatically every day from the U.S. Consumer Product Safety Commission.</p>'
    body = """<section class="hero" style="padding-bottom:24px"><div class="container">{{CRUMBS}}<span class="tag coral">Auto-updated daily</span><h1 class="mt1">Resale news &amp; product recalls</h1><p class="lede">Second-hand market headlines and the latest consumer product recalls — refreshed automatically every day. Last refresh: <strong>%(nu)s</strong>.</p></div></section>
<section style="padding-top:0"><div class="container"><div class="layout"><div>
<h2>Latest product recalls</h2><p class="small muted">Source: U.S. Consumer Product Safety Commission. Before buying used baby gear, e-bikes, heaters or appliances, search the model in our <a href="{{R}}tools/recall-check/">Recall Checker</a>.</p>%(r)s
%(ad)s
<h2 class="mt3">Resale &amp; second-hand headlines</h2><p class="small muted">Headlines and links only; each story belongs to its publisher.</p>%(n)s
</div><aside class="sidebar"><div class="side-card"><h4>Stay safe</h4><ul><li><a href="{{R}}tools/recall-check/">⚠️ Recall checker</a></li><li><a href="{{R}}tools/scam-checker/">🚨 Scam checker</a></li><li><a href="{{R}}guides/used-baby-gear-safety/">Used baby gear safety</a></li><li><a href="{{R}}guides/e-bike-battery-safety/">Used e-bike batteries</a></li></ul></div>%(adside)s</aside></div></div></section>""" % {
        "nu": news.get("updated") or rec.get("updated") or TODAY, "r": rhtml, "n": nhtml, "ad": ad(), "adside": ad("sidebar")}
    pages.append({"path": "news/", "title": "Resale News & Product Recalls (Updated Daily)", "description": "Daily-updated second-hand market headlines and the latest consumer product recalls to check before you buy used.", "body": body, "crumbs": [], "crumb": "News & Recalls", "section": "news", "priority": "0.8", "changefreq": "daily"})


VIDEOS = [
    ("MRp5EW8VVm0", "How to inspect a used car before buying", "Cars"),
    ("8yfQX9VTZJo", "Buying a used car — mechanical inspection", "Cars"),
    ("sSi8xuRm5eE", "Used car interior & exterior inspection", "Cars"),
    ("cDxNfrEiJkk", "How to completely check a used iPhone", "Phones"),
    ("VH0gViuxBH0", "Check a used iPhone before you buy it", "Phones"),
    ("QEB6Kj2TFZw", "Tips to avoid Facebook Marketplace scams (news report)", "Safety"),
    ("BZtc03Rw-_I", "How to avoid scams on Facebook Marketplace", "Safety"),
    ("f5QfGpHDq58", "Common online marketplace scams and how to spot them", "Safety"),
]


def videos_page():
    grid = "".join('<div class="card">%s<span class="chip">%s</span></div>' % (video(v, t), H(c)) for v, t, c in VIDEOS)
    searches = [("how to sell on facebook marketplace", "Selling locally"), ("how to price used items to sell", "Pricing"), ("how to take product photos with phone", "Photos"), ("how to ship furniture", "Shipping bulky items"), ("how to spot fake sneakers", "Authentication"), ("how to check used laptop before buying", "Laptops")]
    sl = "".join('<a class="card" href="https://www.youtube.com/results?search_query=%s" target="_blank" rel="noopener"><span class="tag green">%s</span><h3 class="mt1" style="font-size:1.05rem">%s</h3><span class="go">Watch on YouTube →</span></a>' % (q.replace(" ", "+"), H(c), H(q.capitalize())) for q, c in searches)
    body = """<section class="hero" style="padding-bottom:24px"><div class="container">{{CRUMBS}}<span class="tag">Video academy</span><h1 class="mt1">Learn to buy &amp; sell used — in minutes</h1><p class="lede">Hand-picked walkthroughs on inspecting cars and phones and spotting marketplace scams. Videos load only when you press play (privacy-enhanced mode).</p></div></section>
<section style="padding-top:0"><div class="container"><div class="grid g2">%(grid)s</div>%(ad)s
<h2 class="mt3">More topics on YouTube</h2><div class="grid g3">%(sl)s</div>
<div class="callout mt3"><h4>Make videos for Used.Market</h4><p class="mb0">We pay creators for clear, honest how-to videos about buying and selling used. <a href="{{R}}careers/">See open creator roles</a> or <a href="{{R}}partners/">sponsor a series</a>.</p></div>
<p class="small muted mt2">All videos are owned by their creators and embedded using YouTube's standard player. Inclusion is not an endorsement of any product or channel.</p></div></section>""" % {"grid": grid, "ad": ad(), "sl": sl}
    pages.append({"path": "videos/", "title": "Video Academy: Inspect, Price & Sell Used Items Safely", "description": "Curated videos on inspecting used cars and phones, avoiding marketplace scams and selling faster.", "body": body, "crumbs": [], "crumb": "Videos", "section": "videos", "priority": "0.6"})


def guides_index():
    cats = []
    for g in GUIDES:
        if g["cat"] not in cats:
            cats.append(g["cat"])
    sections = "".join('<h2 class="mt3" id="%s">%s</h2>%s' % (re.sub("[^a-z]+", "-", c.lower()), H(c), guides_grid([g for g in GUIDES if g["cat"] == c])) for c in cats)
    body = """<section class="hero" style="padding-bottom:24px"><div class="container">{{CRUMBS}}<span class="tag green">%(n)d guides</span><h1 class="mt1">Guides to buying &amp; selling used</h1><p class="lede">Practical, sourced and updated. Each guide links to the tool that does the maths for you.</p><div class="chips mt2">%(chips)s</div></div></section>
<section style="padding-top:0"><div class="container">%(sec)s %(ad)s</div></section>""" % {"n": len(GUIDES), "chips": "".join('<a class="chip" href="#%s">%s</a>' % (re.sub("[^a-z]+", "-", c.lower()), H(c)) for c in cats), "sec": sections, "ad": ad()}
    pages.append({"path": "guides/", "title": "Guides: Buy & Sell Used Safely and Profitably", "description": "Step-by-step guides on pricing, fees, scams, recalls, inspections and selling every category of used goods.", "body": body, "crumbs": [], "crumb": "Guides", "section": "guides", "priority": "0.8"})


def categories_index():
    body = """<section class="hero" style="padding-bottom:24px"><div class="container">{{CRUMBS}}<span class="tag">14 categories</span><h1 class="mt1">Browse by category</h1><p class="lede">Where to sell, what it's worth, must-pass checks and red flags — for each kind of used item.</p></div></section>
<section style="padding-top:0"><div class="container">%s%s<div class="mt3">%s</div></div></section>""" % (cat_cards(), ad(), lead_band())
    pages.append({"path": "categories/", "title": "Used Goods Categories: Phones, Cars, Furniture & More", "description": "Category hubs for buying and selling used phones, laptops, cars, bikes, furniture, fashion, luxury, baby gear, books, instruments and more.", "body": body, "crumbs": [], "crumb": "Categories", "section": "categories", "priority": "0.8"})


def html_sitemap():
    groups = {}
    for p in pages:
        if p.get("noindex"):
            continue
        sec = p["path"].split("/")[0] or "home"
        groups.setdefault(sec, []).append(p)
    out = ""
    for sec in sorted(groups):
        out += '<h2 class="mt2" style="font-size:1.3rem">%s</h2><ul>' % H(sec.replace("-", " ").title()) + "".join('<li><a href="{{R}}%s">%s</a></li>' % (p["path"], H(p.get("crumb") or p["title"])) for p in sorted(groups[sec], key=lambda x: x["path"])) + "</ul>"
    body = '<div class="container narrow" style="padding:36px var(--gutter) 60px">{{CRUMBS}}<h1>Sitemap</h1>%s</div>' % out
    pages.append({"path": "sitemap/", "title": "Sitemap", "description": "Every page on Used.Market.", "body": body, "crumbs": [], "crumb": "Sitemap", "priority": "0.3"})


def load_pages():
    d = os.path.join(CONTENT, "pages")
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".html"):
            continue
        meta, body = read_fragment(os.path.join(d, fn))
        meta["body"] = expand(body, meta)
        meta.setdefault("crumbs", [])
        if meta.get("tool"):
            t = tool_lookup(meta["tool"])
            meta.setdefault("schema", []).append({"@context": "https://schema.org", "@type": "WebApplication", "name": t[1], "description": t[3], "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any (web browser)", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "url": canonical(meta["path"])})
            meta.setdefault("scripts", []).insert(0, "tools/common.js")
            meta.setdefault("exit", True)
            meta.setdefault("section", "tools")
        pages.append(meta)


def home_schema():
    return [
        {"@context": "https://schema.org", "@type": "Organization", "name": "Used.Market", "url": SITE["url"] + "/", "logo": SITE["url"] + "/assets/img/icon-512.png", "description": "Independent tools and guides for buying and selling used goods."},
        {"@context": "https://schema.org", "@type": "WebSite", "name": "Used.Market", "url": SITE["url"] + "/", "potentialAction": {"@type": "SearchAction", "target": SITE["url"] + "/search/?q={search_term_string}", "query-input": "required name=search_term_string"}},
    ]


# ---------------------------------------------------------------- write
def write_all():
    for pg in pages:
        fp = out_file(pg["path"])
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(layout(pg))
    # sitemap.xml
    urls = []
    for pg in pages:
        if pg.get("noindex"):
            continue
        urls.append("<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>" % (canonical(pg["path"]), TODAY, pg.get("changefreq", "weekly"), pg.get("priority", "0.6")))
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % "\n".join(urls))
    with open(os.path.join(ROOT, "robots.txt"), "w") as f:
        f.write("User-agent: *\nAllow: /\nDisallow: /thank-you/\n\nUser-agent: Mediapartners-Google\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE["url"])
    with open(os.path.join(ROOT, "ads.txt"), "w") as f:
        f.write("google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0\n")
    with open(os.path.join(ROOT, "manifest.webmanifest"), "w") as f:
        json.dump({"name": "Used.Market", "short_name": "Used.Market", "description": SITE["tagline"], "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#FBF7EE", "theme_color": "#0E3B2E",
                   "icons": [{"src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "assets/img/favicon.svg", "sizes": "any", "type": "image/svg+xml"}]}, f, indent=1)
    idx = []
    for pg in pages:
        if pg.get("noindex"):
            continue
        sec = (pg["path"].split("/")[0] or "home").replace("-", " ").title()
        idx.append({"t": pg.get("crumb") or pg["title"], "d": pg["description"], "u": pg["path"], "s": sec, "k": pg.get("keywords", "")})
    with open(os.path.join(DATA, "search-index.json"), "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, separators=(",", ":"))


def main():
    load_guides()
    load_pages()
    for g in GUIDES:
        guide_page(g)
    category_pages()
    directory_page()
    news_page()
    videos_page()
    guides_index()
    categories_index()
    for pg in pages:
        if pg["path"] in ("", "index.html"):
            pg["schema"] = home_schema() + pg.get("schema", [])
    html_sitemap()
    paths = [p["path"] for p in pages]
    dup = {p for p in paths if paths.count(p) > 1}
    if dup:
        raise SystemExit("Duplicate paths: %s" % dup)
    write_all()
    print("Built %d pages (%d guides, %d categories, %d platforms)" % (len(pages), len(GUIDES), len(CATS), len(PLATFORMS)))


if __name__ == "__main__":
    sys.exit(main())
