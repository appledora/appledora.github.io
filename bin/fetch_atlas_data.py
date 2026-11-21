#!/usr/bin/env python3
"""Refresh the atlas datasheet from OpenAlex.

Writes  assets/bibliography/datasheet/nodes.csv and citation_edges.csv
(the two files bin/build_atlas_data.py reads), then run that script.

Which papers count as mine is set in bin/atlas_papers.json:
  author_ids   OpenAlex author ids to pull works from. Leave empty unless you are sure: common names share ids
               with namesakes, and every paper under such an id would be counted as yours.
  include      work ids to always count as mine (papers OpenAlex attributes to nobody, or to someone else)
  exclude      work ids to never count as mine
  name_queries raw author names to search for *candidates*; these are only reported, never added

Usage:  python3 bin/fetch_atlas_data.py [--dry-run] [--force] [--report FILE]
Set OPENALEX_EMAIL to use OpenAlex's polite pool (optional; never stored in the repo).
"""
import argparse, collections, csv, json, os, pathlib, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/bibliography/datasheet"
CONFIG = ROOT / "bin/atlas_papers.json"
API = "https://api.openalex.org"

FIELDS = ["role", "openalex_id", "doi", "title", "year", "date", "type", "venue", "cited_by_count",
          "n_references", "authors", "first_author", "institutions", "countries", "primary_topic",
          "subfield", "field", "domain", "keywords", "language", "open_access", "url", "abstract"]
EDGE_FIELDS = ["source", "target", "relation"]
ROLE_RANK = {"mine": 0, "both": 1, "cites_me": 2, "i_cited": 3}
SELECT = ("id,doi,display_name,publication_year,publication_date,type,primary_location,cited_by_count,"
          "referenced_works_count,referenced_works,authorships,primary_topic,keywords,language,"
          "open_access,abstract_inverted_index")

EMAIL = os.environ.get("OPENALEX_EMAIL", "")


def get(path, **params):
    if EMAIL:
        params["mailto"] = EMAIL
    query = urllib.parse.urlencode(params, safe=':|,*"')
    url = f"{API}/{path}?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "atlas-fetch/1.0" + (f" (mailto:{EMAIL})" if EMAIL else "")})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                time.sleep(0.12)
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 5:
                time.sleep(2 ** attempt)
                continue
            raise SystemExit(f"OpenAlex request failed ({e.code}): {url}")
        except urllib.error.URLError:
            if attempt < 5:
                time.sleep(2 ** attempt)
                continue
            raise SystemExit(f"Could not reach OpenAlex: {url}")


def paged(path, **params):
    cursor = "*"
    while cursor:
        page = get(path, cursor=cursor, **params)
        yield from page["results"]
        cursor = page["meta"].get("next_cursor")


def short(i):
    return i.rsplit("/", 1)[-1] if i else i


def works_by_ids(ids):
    ids = sorted(set(ids))
    out = []
    for k in range(0, len(ids), 50):
        out += get("works", filter="openalex_id:" + "|".join(ids[k:k + 50]), **{"per-page": 50, "select": SELECT})["results"]
    return out


def abstract_of(w):
    inv = w.get("abstract_inverted_index")
    if not inv:
        return ""
    words = {}
    for word, positions in inv.items():
        for p in positions:
            words[p] = word
    return " ".join(words[p] for p in sorted(words))


def row(w, role):
    src = ((w.get("primary_location") or {}).get("source") or {}).get("display_name") or ""
    auths = w.get("authorships") or []
    names = [a["author"].get("display_name") or a.get("raw_author_name") or "" for a in auths]
    insts, countries = [], []
    for a in auths:
        for inst in a.get("institutions") or []:
            if inst.get("display_name") and inst["display_name"] not in insts:
                insts.append(inst["display_name"])
        for c in (a.get("countries") or [i.get("country_code") for i in a.get("institutions") or []]):
            if c and c not in countries:
                countries.append(c)
    topic = w.get("primary_topic") or {}
    oa = w.get("open_access") or {}
    return {
        "role": role,
        "openalex_id": short(w["id"]),
        "doi": w.get("doi") or "",
        "title": w.get("display_name") or "",
        "year": w.get("publication_year") or "",
        "date": w.get("publication_date") or "",
        "type": w.get("type") or "",
        "venue": src,
        "cited_by_count": w.get("cited_by_count") or 0,
        "n_references": w.get("referenced_works_count") or 0,
        "authors": "; ".join(n for n in names if n),
        "first_author": names[0] if names else "",
        "institutions": "; ".join(insts),
        "countries": "; ".join(countries),
        "primary_topic": topic.get("display_name") or "",
        "subfield": (topic.get("subfield") or {}).get("display_name") or "",
        "field": (topic.get("field") or {}).get("display_name") or "",
        "domain": (topic.get("domain") or {}).get("display_name") or "",
        "keywords": "; ".join(k.get("display_name") for k in (w.get("keywords") or []) if k.get("display_name")),
        "language": w.get("language") or "",
        "open_access": oa.get("is_oa", ""),
        "url": oa.get("oa_url") or w.get("doi") or "",
        "abstract": abstract_of(w),
    }


def read_existing():
    path = DATA / "nodes.csv"
    if not path.exists():
        return {}
    out = {}
    for r in csv.DictReader(open(path, encoding="utf-8-sig")):
        cur = out.get(r["openalex_id"])
        if cur is None or ROLE_RANK[r["role"]] < ROLE_RANK[cur["role"]]:
            out[r["openalex_id"]] = r
    return out


def write_csv(path, fields, rows):
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    tmp.replace(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="fetch and report, write nothing")
    ap.add_argument("--force", action="store_true", help="write even if the result looks much smaller than the current data")
    ap.add_argument("--report", help="also write the report to this file")
    ap.add_argument("--out-dir", type=pathlib.Path, default=DATA, help="where to write the CSVs (default: the datasheet folder)")
    args = ap.parse_args()

    cfg = json.load(open(CONFIG))
    exclude = set(cfg.get("exclude", []))
    log = []
    say = lambda s="": (print(s), log.append(s))

    # 1. my works: author ids + pinned ids - exclusions
    mine = {}
    if cfg.get("author_ids"):
        for w in paged("works", filter="author.id:" + "|".join(cfg["author_ids"]), **{"per-page": 200, "select": SELECT}):
            mine[short(w["id"])] = w
    pinned = [i for i in cfg.get("include", []) if i not in mine]
    for w in works_by_ids(pinned):
        mine[short(w["id"])] = w
    for i in exclude:
        mine.pop(i, None)
    missing = [i for i in cfg.get("include", []) if i not in mine and i not in exclude]
    if missing:
        say(f"WARNING: pinned papers not returned by OpenAlex: {', '.join(missing)}")

    # 2. candidates by name (reported only)
    norm = lambda t: "".join(ch for ch in (t or "").lower() if ch.isalnum())
    my_titles = {norm(w.get("display_name")) for w in mine.values()}
    candidates, duplicates = {}, 0
    for q in cfg.get("name_queries", []):
        for w in paged("works", filter=f'raw_author_name.search:"{q}"', **{"per-page": 100, "select": "id,display_name,publication_year,authorships"}):
            wid = short(w["id"])
            if wid in mine or wid in exclude:
                continue
            if norm(w.get("display_name")) in my_titles:
                duplicates += 1
            else:
                candidates[wid] = w

    # 3. references and citers
    ref_ids = {short(r) for w in mine.values() for r in w.get("referenced_works") or []}
    citer_works, citer_edges = {}, set()
    for mid in mine:
        for w in paged("works", filter=f"cites:{mid}", **{"per-page": 200, "select": SELECT}):
            cid = short(w["id"])
            citer_works[cid] = w
            citer_edges.add((cid, mid))
    ref_works = {short(w["id"]): w for w in works_by_ids(ref_ids - set(mine) - set(citer_works))}
    ref_works.update({i: citer_works[i] for i in ref_ids if i in citer_works})

    # 4. nodes
    nodes = {}
    for i, w in mine.items():
        nodes[i] = row(w, "mine")
    for i, w in citer_works.items():
        if i not in nodes:
            nodes[i] = row(w, "both" if i in ref_ids else "cites_me")
    for i, w in ref_works.items():
        if i not in nodes:
            nodes[i] = row(w, "i_cited")
    ordered = sorted(nodes.values(), key=lambda r: (ROLE_RANK[r["role"]], -int(r["year"] or 0), r["openalex_id"]))

    # 5. edges: source cites target
    edges = set(citer_edges)
    for mid, w in mine.items():
        for r in w.get("referenced_works") or []:
            if short(r) in nodes:
                edges.add((mid, short(r)))
    edge_rows = [{"source": s, "target": t, "relation": "cites"} for s, t in sorted(edges)]

    # 6. report
    old = read_existing()
    old_mine = {i for i, r in old.items() if r["role"] == "mine"}
    counts = collections.Counter(r["role"] for r in ordered)
    say(f"mine={counts['mine']}  i_cited={counts['i_cited']}  cites_me={counts['cites_me']}  both={counts['both']}  edges={len(edge_rows)}")
    if old:
        say(f"before: {len(old)} nodes, {len(old_mine)} mine")
        for i in sorted(set(mine) - old_mine):
            say(f"  + new paper of mine: {nodes[i]['title']} ({nodes[i]['year']})  [{i}]")
        for i in sorted(old_mine - set(mine)):
            say(f"  - no longer mine: {old[i]['title']}  [{i}]")
    if duplicates:
        say(f"({duplicates} extra OpenAlex records of papers you already pinned were ignored)")
    if candidates:
        say("")
        say(f"{len(candidates)} papers match your name but are NOT counted. If any are yours, add the id to \"include\" in bin/atlas_papers.json; otherwise add it to \"exclude\" to silence this:")
        for i, w in sorted(candidates.items(), key=lambda kv: -(kv[1].get("publication_year") or 0)):
            first = ", ".join((a["author"].get("display_name") or "") for a in (w.get("authorships") or [])[:3])
            say(f"  ? {i}  {w.get('publication_year')}  {w.get('display_name', '')[:80]}  ({first})")
    if args.report:
        pathlib.Path(args.report).write_text("\n".join(log) + "\n")

    # 7. sanity check, then write
    if old and not args.force:
        if counts["mine"] < max(1, len(old_mine) // 2) or len(nodes) < len(old) // 2:
            raise SystemExit("Result is less than half the size of the current data; refusing to overwrite (use --force).")
    if args.dry_run:
        say("dry run: nothing written")
        return
    args.out_dir.mkdir(parents=True, exist_ok=True)
    write_csv(args.out_dir / "nodes.csv", FIELDS, ordered)
    write_csv(args.out_dir / "citation_edges.csv", EDGE_FIELDS, edge_rows)
    say(f"wrote {args.out_dir / 'nodes.csv'} and {args.out_dir / 'citation_edges.csv'}")


if __name__ == "__main__":
    main()
