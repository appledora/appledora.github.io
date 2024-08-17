---
layout: page
title: projects
permalink: /projects/
# description: Projects built for research and fun.
nav: true
nav_order: 3
display_categories: [research, development]
horizontal: false
---


<div class="projects-container">
  <div class="projects-grid">
  {%- assign categorized_projects = site.projects %}
    {%- assign sorted_projects = categorized_projects | sort: "importance" %}
    {% for project in sorted_projects %}
    
      <div class="project-card">
      {% include projects.html %}
        <!-- <h3><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
        <p>{{ project.description }}</p>
        {% if project.language %}
          <p class="language">{{ project.language }}</p>
        {% endif %} -->
      </div>
    {% endfor %}
  </div>
</div>
