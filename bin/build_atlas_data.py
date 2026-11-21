"""Slim the research-map datasheet into the files assets/js/atlas.js loads.

Reads  assets/bibliography/datasheet/{nodes.csv,citation_edges.csv}
Writes assets/bibliography/atlas/{graph.json,abstracts.json}

Each of my papers is assigned to one theme in THEMES below (matched by title
fragment). Every cited / citing paper is placed under the theme(s) of the
papers of mine it connects to.
"""
import csv, json, collections, pathlib

# (theme name, one-line blurb, [(title fragment, venue label or None)])
# Venue labels match the Publications page; None falls back to the OpenAlex venue + year.
THEMES = [
    ("Multimodal evaluation & robustness",
     "Benchmarks and attacks that show where vision-language models fall short.",
     [("Seeing Isn", "ECCV 2026"), ("Vision-LLMs Can Fool", "NeurIPS Workshop 2024")]),
    ("Efficient adaptation & compression",
     "Adapting and compressing networks with a handful of parameters.",
     [("RECAST", "ICLR 2025"), ("Decompose, Mix, Adapt", "CVPR 2026")]),
    ("Interpretability & unlearning",
     "What models represent inside, and what they still know after we try to erase it.",
     [("Representation-Aware Unlearning", "EMNLP Findings 2026")]),
    ("Low-resource speech",
     "Speech recognition datasets and benchmarks for Bangla and its dialects.",
     [("OOD-Speech", "Interspeech 2023"), ("Are ASR foundation", "AACL-IJCNLP 2025")]),
    ("Language & culture benchmarks",
     "Datasets and benchmarks that test language models on culture, dialect and low-resource languages.",
     [("From Facts to Folklore", "AACL-IJCNLP 2025"), ("CulturalRiddles", None), ("Last Translation Benchmark", None),
      ("Mapping Violence", None), ("TEAM-Atreides", "SemEval 2022")]),
    ("Health & bioinformatics",
     "Early work on disease surveillance and genome analysis.",
     [("Observing the Unobserved", "FLAIRS 2021"), ("Exploring the Scope", "KDD-Health 2022"),
      ("Choice of assemblers", "Briefings in Bioinformatics 2021")]),
    ("Applied vision",
     "Vision pipelines for real-world detection and retail checkout.",
     [("VISTA", "CVPR Workshop 2022")]),
]

import argparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
_ap = argparse.ArgumentParser(description=__doc__)
_ap.add_argument("--src", type=pathlib.Path, default=ROOT / "assets/bibliography/datasheet")
_ap.add_argument("--out", type=pathlib.Path, default=ROOT / "assets/bibliography/atlas")
_args = _ap.parse_args()
SRC, OUT = _args.src, _args.out
OUT.mkdir(parents=True, exist_ok=True)

split = lambda s: [x.strip() for x in (s or "").split(";") if x.strip()]
nodes = list(csv.DictReader(open(SRC / "nodes.csv", encoding="utf-8-sig")))
edges = list(csv.DictReader(open(SRC / "citation_edges.csv", encoding="utf-8-sig")))
# A paper can appear under two roles (e.g. one of mine that also cites another of mine). Keep the strongest.
ROLE_RANK = {"mine": 0, "both": 1, "cites_me": 2, "i_cited": 3}
merged = {}
for n in nodes:
    cur = merged.get(n["openalex_id"])
    if cur is None or ROLE_RANK[n["role"]] < ROLE_RANK[cur["role"]]:
        merged[n["openalex_id"]] = n
nodes = list(merged.values())
by_id = merged

theme_of, venue_label = {}, {}
for n in nodes:
    if n["role"] != "mine":
        continue
    hits = [(i, label) for i, (_, _, papers) in enumerate(THEMES) for frag, label in papers if frag.lower() in n["title"].lower()]
    if len(hits) != 1:
        raise SystemExit(f"Paper needs exactly one theme in THEMES (got {len(hits)}): {n['title']}")
    theme_of[n["openalex_id"]], venue_label[n["openalex_id"]] = hits[0]

neighbours = collections.defaultdict(list)
for e in edges:
    s, t = e["source"], e["target"]
    if s in theme_of and t not in theme_of:
        neighbours[t].append(theme_of[s])
    if t in theme_of and s not in theme_of:
        neighbours[s].append(theme_of[t])

slim, abstracts = [], {}
for n in nodes:
    i = n["openalex_id"]
    if i in theme_of:
        th = [theme_of[i]]
    else:
        counts = collections.Counter(neighbours[i])
        th = [t for t, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]
    authors = split(n["authors"])
    slim.append({
        "id": i,
        "t": n["title"],
        "y": int(n["year"]) if n["year"].isdigit() else None,
        "r": n["role"],
        "c": int(n["cited_by_count"] or 0),
        "v": n["venue"],
        "a": authors[:4] + (["…"] if len(authors) > 4 else []),
        "sf": n["subfield"],
        "kw": split(n["keywords"])[:5],
        "u": n["url"] or n["doi"],
        "th": th,
    })
    if venue_label.get(i):
        slim[-1]["vl"] = venue_label[i]
    if n["abstract"]:
        abstracts[i] = n["abstract"]

themes = []
for idx, (name, blurb, _) in enumerate(THEMES):
    members = [s for s in slim if s["th"] and s["th"][0] == idx]
    kw = collections.Counter(k.lower() for s in members for k in s["kw"])
    themes.append({
        "name": name,
        "blurb": blurb,
        "mine": [s["id"] for s in members if s["r"] == "mine"],
        "refs": sum(s["r"] in ("i_cited", "both") for s in members),
        "citers": sum(s["r"] in ("cites_me", "both") for s in members),
        "keywords": [k for k, _ in kw.most_common(8)],
    })

graph = {"themes": themes, "nodes": slim, "edges": [[e["source"], e["target"]] for e in edges]}
(OUT / "graph.json").write_text(json.dumps(graph, ensure_ascii=False, separators=(",", ":")))
(OUT / "abstracts.json").write_text(json.dumps(abstracts, ensure_ascii=False, separators=(",", ":")))
for t in themes:
    print(f"{t['name'][:36]:36} mine={len(t['mine'])} refs={t['refs']:3} citers={t['citers']:3}  {t['keywords'][:5]}")
print("unassigned nodes:", sum(1 for s in slim if not s["th"]))
