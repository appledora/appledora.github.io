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
        <div class="project-card-content">
          <h3><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
          <div class="project-tags">
            {% for tag in project.tags %}
              <span class="project-tag">{{ tag }}</span>
            {% endfor %}
          </div>
          <p class="project-description">{{ project.description }}</p>
          {% if project.img %}
            <img src="{{ project.img | relative_url }}" alt="{{ project.title }}" class="project-image">
          {% endif %}
          <!-- {% if project.category %}
            <p class="project-category">{{ project.category }}</p>
          {% endif %} -->
          {% if project.github %}
            <p class="project-github"><a href="{{ project.github }}" target="_blank">
            <i class="fa-brands fa-github fa-2x"></i>
            </a></p>
          {% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-title');
    
    projectCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.classList.add('expanded');
      });
      
      card.addEventListener('mouseleave', function() {
        this.classList.remove('expanded');
      });
    });
  });
</script>