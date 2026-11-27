#!/usr/bin/env python3
"""Daily auto-refresh: pulls recent CPSC recalls and resale headlines into data/*.json.

Used by .github/workflows/auto-refresh.yml. Safe to run locally. On any network
failure the existing data is kept, so the site never goes blank.
"""
import datetime as dt
import email.utils
import json
import re
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
UA = {"User-Agent": "Mozilla/5.0 (compatible; UsedMarketRefresh/1.0; +https://used.market)"}
TODAY = dt.date.today()


def get(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def save(name, obj):
    with open(os.path.join(DATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def load(name):
    try:
        with open(os.path.join(DATA, name), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"items": []}


def short(t, n=170):
    t = " ".join((t or "").split())
    first = re.split(r"(?<=[.!?])\s", t, maxsplit=1)[0]
    return first if len(first) <= n else first[: n - 1].rsplit(" ", 1)[0] + "…"


def refresh_recalls():
    start = (TODAY - dt.timedelta(days=150)).isoformat()
    url = "https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=" + start
    try:
        raw = json.loads(get(url))
    except Exception as e:
        print("recalls: kept previous data (%s)" % e)
        return False
    items = []
    for r in raw:
        title = (r.get("Title") or "").strip()
        if not title:
            continue
        items.append({
            "title": title,
            "date": (r.get("RecallDate") or "")[:10],
            "url": r.get("URL") or "https://www.cpsc.gov/Recalls",
            "hazards": [short(h.get("Name", "")) for h in (r.get("Hazards") or []) if h.get("Name")][:2],
            "remedy": " ".join(x.get("Name", "") for x in (r.get("Remedies") or []))[:300],
            "products": [p.get("Name", "") for p in (r.get("Products") or []) if p.get("Name")][:5],
            "brands": [m.get("Name", "") for m in (r.get("Manufacturers") or []) if m.get("Name")][:3],
            "units": next((p.get("NumberOfUnits") for p in (r.get("Products") or []) if p.get("NumberOfUnits")), ""),
        })
    items.sort(key=lambda x: x["date"], reverse=True)
    if not items:
        print("recalls: empty response, kept previous data")
        return False
    save("recalls.json", {"updated": TODAY.isoformat(), "source": "U.S. Consumer Product Safety Commission (CPSC) recalls API", "items": items[:250]})
    print("recalls: %d items" % len(items))
    return True


QUERIES = ['"resale" secondhand market', '"thrift" OR "secondhand" shopping', '"marketplace scam"', '"used car" prices', '"refurbished" phones OR laptops', 'CPSC recall', '"pre-owned" luxury resale']
KEYWORDS = re.compile(r"resale|resell|second-?hand|used|thrift|refurb|recall|marketplace|scam|consign|vintage|pre-?owned|circular|flip|trade-?in", re.I)


def refresh_news():
    seen, items = set(), []
    for q in QUERIES:
        url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:14d", "hl": "en-US", "gl": "US", "ceid": "US:en"})
        try:
            root = ET.fromstring(get(url))
        except Exception as e:
            print("news: %s failed (%s)" % (q, e))
            continue
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip()
            src_el = it.find("source")
            source = src_el.text.strip() if src_el is not None and src_el.text else ""
            if source and title.endswith(" - " + source):
                title = title[: -len(" - " + source)]
            key = title.lower()[:90]
            if not title or key in seen or not KEYWORDS.search(title):
                continue
            seen.add(key)
            try:
                d = email.utils.parsedate_to_datetime(it.findtext("pubDate")).date().isoformat()
            except Exception:
                d = TODAY.isoformat()
            items.append({"title": title, "url": it.findtext("link") or "", "source": source, "date": d, "topic": q})
    if not items:
        print("news: kept previous data")
        return False
    items.sort(key=lambda x: x["date"], reverse=True)
    save("news.json", {"updated": TODAY.isoformat(), "items": items[:80]})
    print("news: %d items" % len(items))
    return True


if __name__ == "__main__":
    refresh_recalls()
    refresh_news()
