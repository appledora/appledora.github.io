---
layout: page
title: 🏺 ARTIFACTS
permalink: /projects/
nav: true
nav_order: 3
display_categories: [research, development]
horizontal: false
---
<div class="terminal-status artifacts-terminal datasets-terminal">
  <div class="status-header">datasets.log</div>
  <div class="status-content">
    <ol class="artifacts-list">
    {%- assign sorted_datasets = site.data.projects | where_exp: "p", "p.category == 'dataset'" %}
    {% for dataset in sorted_datasets %}
      <li class="artifact-entry">
        <div class="artifact-line">
          <span class="artifact-prompt">$</span>
          <span class="artifact-title">{{ dataset.title }}</span>
          {% if dataset.github %}
          <a href="{{ dataset.github }}" target="_blank" rel="noopener noreferrer" class="artifact-github" title="View dataset">
            <i class="fa-solid fa-database"></i> view
          </a>
          {% endif %}
        </div>
        <p class="artifact-description">{{ dataset.description }}</p>
        {% if dataset.tags %}
        <div class="artifact-tags">
          {% for tag in dataset.tags %}
          <span class="pill-tag">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
      </li>
    {% endfor %}
    </ol>
  </div>
</div>

<div class="terminal-status artifacts-terminal">
  <div class="status-header">projects.log</div>
  <div class="status-content">
    <ol class="artifacts-list">
    {%- assign sorted_projects = site.data.projects | where_exp: "p", "p.category != 'dataset'" %}
    {% for project in sorted_projects %}
      <li class="artifact-entry">
        <div class="artifact-line">
          <span class="artifact-prompt">$</span>
          <span class="artifact-title">{{ project.title }}</span>
          {% if project.github %}
          <a href="{{ project.github }}" target="_blank" rel="noopener noreferrer" class="artifact-github" title="View on GitHub">
            <i class="fa-brands fa-github"></i> repo
          </a>
          {% endif %}
        </div>
        <p class="artifact-description">{{ project.description }}</p>
        {% if project.tags %}
        <div class="artifact-tags">
          {% for tag in project.tags %}
          <span class="pill-tag">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
      </li>
    {% endfor %}
    </ol>
  </div>
</div>
