// Publications Interactive Features
document.addEventListener("DOMContentLoaded", function () {
  // Handle publication card clicks to show/hide abstract and expanded image
  const publicationItems = document.querySelectorAll(
    ".publications ol.bibliography li"
  );

  publicationItems.forEach((item) => {
    const title = item.querySelector(".title");
    const preview = item.querySelector(".preview");
    const abstract = item.querySelector(".abstract");

    // Create expanded image element if preview exists
    if (preview) {
      const expandedImg = document.createElement("img");
      expandedImg.src = preview.src;
      expandedImg.alt = preview.alt;
      expandedImg.className = "preview-expanded";

      // Insert after publication-content or at the end
      const content = item.querySelector(".publication-content");
      if (content) {
        content.parentNode.insertBefore(expandedImg, content.nextSibling);
      } else {
        item.appendChild(expandedImg);
      }

      // Click on preview to expand
      preview.addEventListener("click", function (e) {
        e.preventDefault();
        toggleExpanded(item);
      });

      // Click on expanded image to collapse
      expandedImg.addEventListener("click", function (e) {
        e.preventDefault();
        toggleExpanded(item);
      });
    }

    // Click on title to toggle abstract
    if (title) {
      title.addEventListener("click", function (e) {
        e.preventDefault();
        toggleAbstract(item);
      });
    }
  });

  function toggleExpanded(item) {
    item.classList.toggle("expanded");

    // Also show abstract when expanding
    if (item.classList.contains("expanded")) {
      const abstract = item.querySelector(".abstract");
      if (abstract && !abstract.classList.contains("open")) {
        abstract.classList.add("open");
      }
    }
  }

  function toggleAbstract(item) {
    const abstract = item.querySelector(".abstract");
    if (abstract) {
      abstract.classList.toggle("open");
    }
  }

  // Optional: Close expanded view when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".publications ol.bibliography li")) {
      publicationItems.forEach((item) => {
        if (item.classList.contains("expanded") && !item.contains(e.target)) {
          item.classList.remove("expanded");
        }
      });
    }
  });

  // Handle bibtex/abstract button clicks (existing functionality)
  const detailsButtons = document.querySelectorAll(
    ".publications .details-button"
  );
  detailsButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const item = this.closest("li");
      const targetClass = this.textContent.toLowerCase().trim();
      const targetElement = item.querySelector(`.${targetClass}`);

      if (targetElement) {
        targetElement.classList.toggle("open");
      }
    });
  });
});
