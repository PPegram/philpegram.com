#!/usr/bin/env python3
"""Static checks for the site. Run from the repository root: python3 scripts/check_site.py"""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://philpegram.com"
errors, warnings = [], []


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.h1 = [], [], 0
        self.title = self.desc = self.canonical = None
        self.jsonld, self._in_title, self._in_ld, self._buf = [], False, False, ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self._in_title, self.title = True, ""
        if tag == "meta" and a.get("name") == "description":
            self.desc = a.get("content")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld, self._buf = True, ""
        for key in ("href", "src"):
            if key in a and tag in ("a", "link", "script", "img", "iframe"):
                self.links.append(a[key])

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._in_ld:
            self._in_ld = False
            self.jsonld.append(self._buf)

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_ld:
            self._buf += data


def resolve(url):
    p = urlparse(url)
    path = unquote(p.path)
    if path in ("", "/"):
        return ROOT / "index.html", p.fragment
    target = ROOT / path.lstrip("/")
    if target.is_file():
        return target, p.fragment
    if (ROOT / (path.lstrip("/") + ".html")).is_file():
        return ROOT / (path.lstrip("/") + ".html"), p.fragment
    return None, p.fragment


pages = {f.name: f for f in sorted(ROOT.glob("*.html"))}
parsed = {}
for name, f in pages.items():
    pg = Page()
    pg.feed(f.read_text(encoding="utf-8"))
    parsed[name] = pg

for name, pg in parsed.items():
    if not (pg.title or "").strip():
        errors.append(f"{name}: missing <title>")
    if name != "404.html":
        if not pg.canonical:
            errors.append(f"{name}: missing canonical")
        elif not pg.canonical.startswith(SITE):
            errors.append(f"{name}: canonical not on {SITE}: {pg.canonical}")
        if not pg.desc:
            warnings.append(f"{name}: missing meta description")
        if pg.h1 != 1:
            warnings.append(f"{name}: expected 1 <h1>, found {pg.h1}")
    dupes = {i for i in pg.ids if pg.ids.count(i) > 1}
    if dupes:
        errors.append(f"{name}: duplicate ids {sorted(dupes)}")
    for block in pg.jsonld:
        try:
            json.loads(block)
        except ValueError as e:
            errors.append(f"{name}: invalid JSON-LD ({e})")
    for link in pg.links:
        p = urlparse(link)
        if p.scheme in ("http", "https"):
            if p.netloc not in ("philpegram.com", "www.philpegram.com"):
                continue
        elif p.scheme or link.startswith(("mailto:", "tel:", "data:", "javascript:")):
            continue
        if link.startswith("#"):
            target, frag = f, link[1:]
            tpage = pg
        else:
            target, frag = resolve(link if link.startswith(("http", "/")) else "/" + link)
            if target is None:
                errors.append(f"{name}: broken local link {link}")
                continue
            tpage = parsed.get(target.name)
        if frag and tpage and frag not in tpage.ids:
            warnings.append(f"{name}: fragment #{frag} not found in {link}")

sm = ROOT / "sitemap.xml"
if sm.exists():
    for loc in re.findall(r"<loc>([^<]+)</loc>", sm.read_text(encoding="utf-8")):
        target, _ = resolve(loc)
        if target is None:
            errors.append(f"sitemap.xml: {loc} has no matching file")

for w in warnings:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print(f"{len(pages)} pages checked: {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
