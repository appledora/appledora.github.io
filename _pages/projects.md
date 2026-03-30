---
layout: page
title: 🏺 ARTIFACTS
permalink: /projects/
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

      <div class="project-card" onclick="toggleProjectCard(this)">
        <div class="project-card-content">
          <h3 class="project-title-clickable">{{ project.title }}</h3>
          <div class="project-tags">
            {% for tag in project.tags %}
              <span class="project-tag">{{ tag }}</span>
            {% endfor %}
          </div>
          <p class="project-description">{{ project.description }}</p>
          {% if project.img %}
            <img src="{{ project.img | relative_url }}" alt="{{ project.title }}" class="project-image">
          {% endif %}
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
function toggleProjectCard(card) {
  const allCards = document.querySelectorAll('.project-card');
  const isExpanded = card.classList.contains('expanded');
  
  // Close all cards first
  allCards.forEach(function(c) {
    c.classList.remove('expanded');
  });
  
  // Open clicked card if it wasn't already open
  if (!isExpanded) {
    card.classList.add('expanded');
    // Scroll smoothly to card with offset
    const cardRect = card.getBoundingClientRect();
    const scrollTop = window.pageYOffset + cardRect.top - 100;
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }
}
</script>