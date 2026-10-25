---
layout: page
permalink: /news/
title: 📜 QUESTLOG
nav: True
nav_order: 3
description: ""
---

<div class="terminal-status questlog-terminal">
  <div class="status-header">questlog.log</div>
  <div class="status-content">
    {%- assign news_sorted = site.data.news | sort: 'date' | reverse -%}
    {%- assign news_by_year = news_sorted | group_by_exp: "n", "n.date | date: '%Y'" -%}
    {%- for year in news_by_year %}
    <section class="ql-year">
      <h2 class="ql-year-label">{{ year.name }}</h2>
      <ol class="ql-list">
        {%- for new in year.items %}
        <li class="ql-item">
          <span class="ql-date">{{ new.date | date: "%b %d" }}</span>
          <span class="ql-text">{% if new.icon %}<span class="ql-icon">{{ new.icon }}</span>{% endif %}{{ new.content }}</span>
        </li>
        {%- endfor %}
      </ol>
    </section>
    {%- endfor %}
  </div>
</div>
