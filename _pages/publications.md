---
layout: page
permalink: /publications/
title: 🪶 PUBLICATIONS
subtitle:  Research Papers
description: ""
nav: true
nav_order: 2
---

<div class="publications-compact">
{% bibliography %}
</div>

<style>
/* Hide empty li elements */
.publications-compact ol.bibliography li:empty,
.publications-compact ol.bibliography li br {
  display: none !important;
}
</style>

<script>
// Click handler - works IMMEDIATELY via capture phase
document.addEventListener('click', function(e) {
  const clickedLi = e.target.closest('ol.bibliography li');
  if (clickedLi && !e.target.closest('a') && !e.target.closest('.btn')) {
    const allLis = document.querySelectorAll('ol.bibliography li');
    const isExpanded = clickedLi.classList.contains('expanded');
    allLis.forEach(function(li) { li.classList.remove('expanded'); });
    if (!isExpanded) { clickedLi.classList.add('expanded'); }
  }
}, true); // Capture phase - runs before page load completes

// Wrap year groups and add badges
window.addEventListener('load', function() {
  const yearHeadings = document.querySelectorAll('.publications-compact h2.bibliography');
  
  yearHeadings.forEach(function(h2) {
    const yearText = h2.textContent.trim();
    const nextOl = h2.nextElementSibling;
    
    if (nextOl && nextOl.tagName === 'OL') {
      const wrapper = document.createElement('div');
      wrapper.className = 'year-group';
      
      const badge = document.createElement('div');
      badge.className = 'year-badge';
      badge.textContent = yearText;
      
      h2.parentNode.insertBefore(wrapper, h2);
      wrapper.appendChild(badge);
      wrapper.appendChild(nextOl);
      h2.style.display = 'none';
    }
  });
});
</script>