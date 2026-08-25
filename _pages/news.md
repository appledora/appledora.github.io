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
    <ol class="artifacts-list">
    {%- assign news_sorted = site.data.news | sort: 'date' | reverse %}
    {% for new in news_sorted %}
      <li class="artifact-entry">
        <div class="artifact-line">
          <span class="artifact-prompt">$</span>
          <span class="mono-label">{{ new.date | date: "%b %d, %Y" }}</span>
        </div>
        <p class="artifact-description">{% if new.icon %}{{ new.icon }} {% endif %}{{ new.content }}</p>
      </li>
    {% endfor %}
    </ol>
  </div>
</div>
