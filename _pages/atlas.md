---
layout: page
permalink: /atlas/
title: 🗺️ ATLAS
description: "The topics I work on, and the papers around them."
nav: true
nav_order: 3.5
---

<div class="terminal-status atlas-terminal" id="atlas" data-graph="{{ '/assets/bibliography/atlas/graph.json' | relative_url }}" data-abstracts="{{ '/assets/bibliography/atlas/abstracts.json' | relative_url }}">
  <div class="status-header">atlas.log</div>
  <div class="status-content">
    <p class="atlas-hint">Pick a topic to see the papers behind it, what they build on, and who builds on them.</p>
    <div class="atlas-themes" id="atlas-themes"></div>
    <div class="atlas-viz-scroll">
      <div class="atlas-viz-wrap" id="atlas-viz-wrap">
        <svg id="atlas-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="atlas-tip" id="atlas-tip" hidden></div>
      </div>
    </div>
    <div class="atlas-detail" id="atlas-detail"></div>
    <noscript>The interactive map needs JavaScript.</noscript>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="{{ '/assets/js/atlas.js' | relative_url }}" defer></script>
