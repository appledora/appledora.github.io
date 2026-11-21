# Research map datasheet — Nazia Tasnim

Source: Google Scholar profile (publication list, read 2026-11-20) + OpenAlex (references, citing papers, metadata).

| File | Rows | What it is |
|---|---|---|
| my_papers.csv | 18 | Your Scholar papers, with Scholar citation counts and OpenAlex ids/metadata |
| papers_i_cited.csv | 630 | Unique papers in your papers' reference lists (column `cited_by_my_papers` lists which of yours cite it) |
| papers_citing_me.csv | 142 | Unique papers citing yours (`cites_my_papers` lists which) |
| citation_edges.csv | 833 | source -> target "cites" edges (OpenAlex ids) |
| nodes.csv | all | One table of all papers; `role` = mine / i_cited / cites_me / both |
| graph.json | | nodes + edges, ready for d3 / Cytoscape / Gephi |

Columns: ids, DOI, title, year, venue, authors, institutions, countries, topic/subfield/field/domain, keywords, abstract, OA url, counts.

Caveats
- Not matched in OpenAlex (no references/citers): "Regspeech12" and "Team passphrase: Dhaka AI vehicle detection".
- OpenAlex finds fewer citations than Scholar (e.g. 142 unique citers vs ~165 Scholar total), and reference lists are only as complete as publisher/arXiv metadata.
- "Seeing Isn't Orienting" matched to its OpenAlex record under a newer title.

## Refreshing

`bin/fetch_atlas_data.py` re-downloads `nodes.csv` and `citation_edges.csv` from OpenAlex; `bin/build_atlas_data.py` then rebuilds the files the Atlas page loads. A GitHub Action (`.github/workflows/refresh-atlas.yml`) does both every other month and opens a pull request. Which papers count as mine is set in `bin/atlas_papers.json`. The other files in this folder (`my_papers.csv`, `papers_i_cited.csv`, `papers_citing_me.csv`, `graph.json`) are from the original export and are not refreshed.
