// Research atlas: one column per topic. Built on (top) -> my work (middle) -> built upon (bottom).
// Data: assets/bibliography/atlas/*.json, produced by bin/build_atlas_data.py
(function () {
  var root = document.getElementById('atlas');
  if (!root || !window.d3) return;

  var W = 900, H = 540, PAD = 10, GAP = 8;
  var LANES = {
    refs:   { y0: 30,  y1: 250, label: 'BUILT ON' },
    mine:   { y0: 290, y1: 354, label: 'MY WORK' },
    citers: { y0: 392, y1: 510, label: 'BUILT UPON' }
  };
  var LANE_OF = { i_cited: 'refs', mine: 'mine', cites_me: 'citers', both: 'citers' };
  var ROLE_LABEL = {
    mine: 'my paper',
    i_cited: 'a paper I build on',
    cites_me: 'builds on my work',
    both: 'two-way: I cite it, it cites me'
  };

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var isMe = function (name) { return /nazia/i.test(name) && /tasnim/i.test(name) || /tasnim,\s*nazia/i.test(name); };
  var pad2 = function (i) { return (i + 1 < 10 ? '0' : '') + (i + 1); };
  var shortTitle = function (t) { return t.replace(/:.*$/, ''); };
  var venueLine = function (n) { return n.vl || ((n.v || 'preprint').replace(/\s*\(.*?\)\s*/g, '').trim() + (n.year ? ' ' + n.year : '')); };

  var abstracts = null;
  var abstractsPromise = null;
  function loadAbstracts() {
    if (!abstractsPromise) {
      abstractsPromise = d3.json(root.dataset.abstracts).then(function (a) { abstracts = a; return a; })
        .catch(function () { abstracts = {}; return abstracts; });
    }
    return abstractsPromise;
  }

  d3.json(root.dataset.graph).then(init).catch(function () {
    $('atlas-detail').textContent = 'Could not load the graph data.';
  });

  function init(raw) {
    var themes = raw.themes;
    var nodes = raw.nodes.map(function (n) {
      var o = Object.assign({}, n);
      o.year = n.y;
      delete o.y;
      o.lane = LANE_OF[n.r];
      o.theme = n.th[0];
      o.cites = [];
      o.citedBy = [];
      o.rad = o.lane === 'mine'
        ? 5 + Math.sqrt(Math.min(n.c, 60)) * 0.9
        : 1.8 + Math.sqrt(Math.min(n.c, 3000)) * 0.11;
      return o;
    });
    var byId = new Map(nodes.map(function (n) { return [n.id, n]; }));
    var edges = [];
    raw.edges.forEach(function (e) {
      var a = byId.get(e[0]), b = byId.get(e[1]);
      if (!a || !b) return;
      a.cites.push(b);
      b.citedBy.push(a);
      edges.push({ s: a, t: b });
    });

    var cols = columns(themes);
    layout(nodes, cols);
    var api = drawViz(nodes, edges, themes, cols, byId);
    renderThemeChips(themes, api);
    api.selectTheme(0);
  }

  function columns(themes) {
    var weights = themes.map(function (t) { return Math.sqrt(t.refs + t.citers + 8 * t.mine.length + 10); });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var avail = W - 2 * PAD - (themes.length - 1) * GAP;
    var x0 = PAD;
    return weights.map(function (w) {
      var width = w / total * avail;
      var c = { x0: x0, x1: x0 + width, cx: x0 + width / 2 };
      x0 += width + GAP;
      return c;
    });
  }

  // Beeswarm per lane: each node sits in its topic column, at the first free slot walking out from the lane centre.
  function layout(nodes, cols) {
    Object.keys(LANES).forEach(function (k) { LANES[k].cy = (LANES[k].y0 + LANES[k].y1) / 2; });
    var CELL = 16;
    Object.keys(LANES).forEach(function (lane) {
      var L = LANES[lane];
      var placed = {};
      var free = function (px, py, rad) {
        var kx = Math.floor(px / CELL);
        for (var dk = -3; dk <= 3; dk++) {
          var bucket = placed[kx + dk];
          if (!bucket) continue;
          for (var i = 0; i < bucket.length; i++) {
            var o = bucket[i];
            if (Math.max(Math.abs(o.x - px), Math.abs(o.y - py)) < o.rad + rad + 1) return false;
          }
        }
        return true;
      };
      var cache = {};
      var offsets = function (col) {
        var key = col.x1 - col.x0;
        if (cache[key]) return cache[key];
        var list = [], hx = key / 2, hy = (L.y1 - L.y0) / 2;
        for (var dx = -hx; dx <= hx; dx += 2) {
          for (var dy = -hy; dy <= hy; dy += 2) list.push([dx, dy, dx * dx + dy * dy]);
        }
        list.sort(function (p, q) { return p[2] - q[2]; });
        return (cache[key] = list);
      };
      nodes.filter(function (n) { return n.lane === lane; })
        .sort(function (a, b) { return a.theme - b.theme || b.rad - a.rad; })
        .forEach(function (n) {
          var col = cols[n.theme], done = false, cand = offsets(col);
          for (var i = 0; i < cand.length && !done; i++) {
            var px = col.cx + cand[i][0], py = L.cy + cand[i][1];
            if (px - n.rad < col.x0 || px + n.rad > col.x1 || py - n.rad < L.y0 || py + n.rad > L.y1) continue;
            if (free(px, py, n.rad)) { n.x = px; n.y = py; done = true; }
          }
          if (!done) {
            n.x = col.x0 + n.rad + Math.random() * Math.max(1, col.x1 - col.x0 - 2 * n.rad);
            n.y = L.y0 + n.rad + Math.random() * Math.max(1, L.y1 - L.y0 - 2 * n.rad);
          }
          var kk = Math.floor(n.x / CELL);
          (placed[kk] = placed[kk] || []).push(n);
        });
    });
  }

  function drawViz(nodes, edges, themes, cols, byId) {
    var svg = d3.select('#atlas-svg').attr('viewBox', '0 0 ' + W + ' ' + H);
    svg.attr('role', 'group').attr('aria-label', 'Map of my papers by topic, with the papers they build on and the papers building on them');

    var bands = svg.append('g');
    Object.keys(LANES).forEach(function (k) {
      var L = LANES[k];
      bands.append('rect').attr('class', 'atlas-band').attr('x', 0).attr('y', L.y0 - 6).attr('width', W).attr('height', L.y1 - L.y0 + 12);
    });

    var colSel = svg.append('g').selectAll('rect').data(cols).join('rect')
      .attr('class', 'atlas-col')
      .attr('x', function (c) { return c.x0 - 2; })
      .attr('y', 14)
      .attr('width', function (c) { return c.x1 - c.x0 + 4; })
      .attr('height', 504);
    var labels = svg.append('g');
    Object.keys(LANES).forEach(function (k) {
      labels.append('text').attr('class', 'atlas-lane-label').attr('x', 8).attr('y', LANES[k].y0 - 12).text(LANES[k].label);
    });
    svg.append('g').selectAll('text').data(cols).join('text')
      .attr('class', 'atlas-tick')
      .attr('x', function (c) { return c.cx; })
      .attr('y', H - 6)
      .attr('text-anchor', 'middle')
      .text(function (c, i) { return pad2(i); });

    var edgeLayer = svg.append('g').attr('class', 'atlas-edges');
    var link = d3.linkVertical().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });
    var tip = $('atlas-tip');
    var wrap = $('atlas-viz-wrap');
    var state = { sel: null, theme: null };

    var nodeSel = svg.append('g').selectAll('rect').data(nodes).join('rect')
      .attr('class', function (n) { return 'atlas-node atlas-node--' + n.lane + (n.r === 'both' ? ' atlas-node--both' : ''); })
      .attr('x', function (n) { return n.x - n.rad; })
      .attr('y', function (n) { return n.y - n.rad; })
      .attr('width', function (n) { return n.rad * 2; })
      .attr('height', function (n) { return n.rad * 2; })
      .attr('shape-rendering', 'crispEdges');

    nodeSel.filter(function (n) { return n.lane === 'mine'; })
      .attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', function (n) { return n.t; })
      .on('keydown', function (ev, n) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); api.select(n); }
      });

    nodeSel
      .on('mouseenter', function (ev, n) {
        tip.innerHTML = '<b>' + esc(n.t) + '</b><br>' + esc(n.vl || [n.v, n.year].filter(Boolean).join(' · ')) + ' · cited by ' + n.c;
        tip.hidden = false;
        moveTip(ev);
      })
      .on('mousemove', moveTip)
      .on('mouseleave', function () { tip.hidden = true; })
      .on('click', function (ev, n) { ev.stopPropagation(); api.select(n); });
    svg.on('click', function () { api.clear(); });

    function moveTip(ev) {
      var r = wrap.getBoundingClientRect();
      tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 250) + 'px';
      tip.style.top = (ev.clientY - r.top + 14) + 'px';
    }

    var otherEnd = function (e) {
      if (state.sel) return e.s === state.sel ? e.t : e.s;
      return e.s.lane === 'mine' ? e.t : e.s;
    };

    function refresh() {
      var neigh = state.sel ? new Set([state.sel].concat(state.sel.cites, state.sel.citedBy)) : null;
      colSel.classed('is-active', function (c, i) { return i === state.theme; });
      nodeSel
        .classed('is-selected', function (n) { return n === state.sel; })
        .style('opacity', function (n) {
          var o = 1;
          if (neigh) { if (!neigh.has(n)) o = 0.1; }
          else if (state.theme != null && n.theme !== state.theme) o = 0.12;
          if (n.lane === 'mine') o = Math.max(o, 0.85);
          return o;
        });

      var shown = [];
      if (state.sel) {
        shown = edges.filter(function (e) { return e.s === state.sel || e.t === state.sel; });
      } else if (state.theme != null) {
        shown = edges.filter(function (e) {
          return (e.s.lane === 'mine' && e.s.theme === state.theme && e.t.lane !== 'mine') ||
                 (e.t.lane === 'mine' && e.t.theme === state.theme && e.s.lane !== 'mine');
        });
      }
      var paths = edgeLayer.selectAll('path').data(shown, function (e) { return e.s.id + '>' + e.t.id; });
      paths.exit().remove();
      paths.enter().append('path')
        .merge(paths)
        .attr('class', function (e) { return 'atlas-edge atlas-edge--' + otherEnd(e).lane + (state.sel ? '' : ' is-faint'); })
        .attr('d', function (e) { return link({ source: [e.s.x, e.s.y], target: [e.t.x, e.t.y] }); });

      document.querySelectorAll('.atlas-theme-chip').forEach(function (b) {
        b.setAttribute('aria-pressed', Number(b.dataset.i) === state.theme ? 'true' : 'false');
      });
    }

    var api = {
      select: function (n) {
        state.sel = n;
        state.theme = n.theme;
        refresh();
        renderPaper(n, themes, api);
      },
      selectTheme: function (i) {
        state.sel = null;
        state.theme = i;
        refresh();
        renderTheme(i, themes, byId, api);
      },
      clear: function () {
        state.sel = null;
        state.theme = null;
        refresh();
        $('atlas-detail').innerHTML = '<p class="atlas-empty">Pick a topic above, or click a square on the map.</p>';
      },
      byId: function (id) { return byId.get(id); }
    };
    return api;
  }

  function renderThemeChips(themes, api) {
    var box = $('atlas-themes');
    box.innerHTML = '';
    themes.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'atlas-theme-chip';
      b.dataset.i = i;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="atlas-theme-num">' + pad2(i) + '</span>' + esc(t.name);
      b.addEventListener('click', function () { api.selectTheme(i); });
      box.appendChild(b);
    });
  }

  function renderTheme(i, themes, byId, api) {
    var t = themes[i];
    var papers = t.mine.map(function (id) { return byId.get(id); })
      .sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
    var list = papers.map(function (n) {
      return '<li><button type="button" class="atlas-paper-btn" data-id="' + esc(n.id) + '">' + esc(n.t) + '</button>' +
        ' <span class="atlas-muted">· ' + esc(venueLine(n)) + '</span></li>';
    }).join('');
    var kws = t.keywords.map(function (k) { return '<span class="atlas-chip">' + esc(k) + '</span>'; }).join('');
    var box = $('atlas-detail');
    box.innerHTML =
      '<div class="atlas-detail-role atlas-detail-role--mine">topic ' + pad2(i) + '</div>' +
      '<h3 class="atlas-detail-title">' + esc(t.name) + '</h3>' +
      '<p class="atlas-detail-meta">' + esc(t.blurb) + '</p>' +
      '<ul class="atlas-paper-list">' + list + '</ul>' +
      '<p class="atlas-conn">builds on <b>' + t.refs + '</b> papers · built upon by <b>' + t.citers + '</b></p>' +
      '<p class="atlas-chips-label">related topics</p>' +
      '<p class="atlas-chips">' + kws + '</p>';
    box.querySelectorAll('.atlas-paper-btn').forEach(function (b) {
      b.addEventListener('click', function () { api.select(api.byId(b.dataset.id)); });
    });
  }

  function renderPaper(n, themes, api) {
    var box = $('atlas-detail');
    var authors = n.a.map(function (a) { return isMe(a) ? '<b>' + esc(a) + '</b>' : esc(a); }).join(', ');
    var meta = [esc(n.vl || [n.v, n.year].filter(Boolean).join(' · ')), 'cited by ' + n.c].filter(Boolean).join(' · ');
    var conn = '';
    if (n.lane === 'mine') {
      var nr = n.cites.filter(function (m) { return m.lane === 'refs'; }).length;
      conn = '<p class="atlas-conn">builds on <b>' + nr + '</b> papers in the data · built upon by <b>' + n.citedBy.length + '</b></p>';
    } else {
      var uniq = Array.from(new Set(n.cites.concat(n.citedBy).filter(function (m) { return m.lane === 'mine'; })));
      if (uniq.length) {
        conn = '<p class="atlas-conn">connected to: ' + uniq.map(function (m) {
          return '<button type="button" class="atlas-link-btn" data-id="' + esc(m.id) + '">' + esc(shortTitle(m.t)) + '</button>';
        }).join(' ') + '</p>';
      }
    }
    var topic = n.theme != null
      ? '<p class="atlas-conn">topic: <button type="button" class="atlas-link-btn" data-theme="' + n.theme + '">' + pad2(n.theme) + ' ' + esc(themes[n.theme].name) + '</button></p>'
      : '';
    var kws = n.kw.map(function (k) { return '<span class="atlas-chip">' + esc(k) + '</span>'; }).join('');
    var title = n.u ? '<a href="' + esc(n.u) + '" target="_blank" rel="noopener noreferrer">' + esc(n.t) + ' ↗</a>' : esc(n.t);
    box.innerHTML =
      '<div class="atlas-detail-role atlas-detail-role--' + n.lane + '">' + esc(ROLE_LABEL[n.r]) + '</div>' +
      '<h3 class="atlas-detail-title">' + title + '</h3>' +
      '<p class="atlas-detail-meta">' + meta + '</p>' +
      '<p class="atlas-detail-authors">' + authors + '</p>' +
      topic + conn +
      (kws ? '<p class="atlas-chips">' + kws + '</p>' : '') +
      '<details class="atlas-abstract"><summary>abstract</summary><p>loading…</p></details>';
    box.querySelectorAll('[data-id]').forEach(function (b) {
      b.addEventListener('click', function () { api.select(api.byId(b.dataset.id)); });
    });
    box.querySelectorAll('[data-theme]').forEach(function (b) {
      b.addEventListener('click', function () { api.selectTheme(Number(b.dataset.theme)); });
    });
    var d = box.querySelector('.atlas-abstract');
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      loadAbstracts().then(function (a) {
        d.querySelector('p').textContent = a[n.id] || 'No abstract in the dataset.';
      });
    });
  }
})();
