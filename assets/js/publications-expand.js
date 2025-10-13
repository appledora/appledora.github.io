// Publications Click-to-Expand - Immediate Interactive Version
(function () {
  "use strict";

  function setupPublications() {
    const publicationItems = document.querySelectorAll(
      ".publications ol.bibliography > li.publication-item"
    );

    publicationItems.forEach((item) => {
      // Skip if already set up
      if (item.dataset.clickSetup) return;
      item.dataset.clickSetup = "true";

      // Add accessibility attributes
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-expanded", "false");

      // Card click handler
      item.addEventListener("click", function (e) {
        // Allow normal link behavior
        const clickedElement = e.target;
        const isLink =
          clickedElement.tagName === "A" || clickedElement.closest("a");
        const isInLinks = clickedElement.closest(".links");

        if (isLink || isInLinks) {
          return;
        }

        // Toggle expansion
        const isExpanded = this.classList.contains("expanded");

        // Close all others
        publicationItems.forEach((otherItem) => {
          if (otherItem !== this) {
            otherItem.classList.remove("expanded");
            otherItem.setAttribute("aria-expanded", "false");
          }
        });

        // Toggle this one
        if (isExpanded) {
          this.classList.remove("expanded");
          this.setAttribute("aria-expanded", "false");
        } else {
          this.classList.add("expanded");
          this.setAttribute("aria-expanded", "true");
        }
      });

      // Keyboard support
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  // Run immediately if DOM is already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPublications);
  } else {
    setupPublications();
  }

  // Also run when new content is added (for dynamic loading)
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(function (mutations) {
      let shouldSetup = false;
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function (node) {
            if (
              node.nodeType === 1 &&
              (node.classList.contains("publication-item") ||
                node.querySelector(".publication-item"))
            ) {
              shouldSetup = true;
            }
          });
        }
      });
      if (shouldSetup) {
        setupPublications();
      }
    });

    // Start observing after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
})();
