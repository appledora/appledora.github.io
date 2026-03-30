---
layout: page
permalink: /news/
title: 📜 QUESTLOG
nav: True
nav_order: 3
description: ""
---

<div class="news-timeline">

{% for new in site.data.news %}
<div class="timeline-item">
  <div class="timeline-marker">
    <span class="timeline-date">{{ new.date | date: "%b %Y" }}</span>
  </div>
  <div class="timeline-content">
    <div class="timeline-badge">
      {{ new.icon }}
    </div>
    <div class="timeline-text">
      {{ new.content }}
    </div>
  </div>
</div>
{% endfor %}

</div>
