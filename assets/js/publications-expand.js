// Publications Click-to-Expand - Clean Version with Empty Card Removal
document.addEventListener("DOMContentLoaded", function () {
  // FIRST: Remove any empty list items before doing anything else
  const allListItems = document.querySelectorAll(
    ".publications ol.bibliography > li"
  );
  allListItems.forEach((item) => {
    // Remove if empty or doesn't have publication-item class
    if (!item.classList.contains("publication-item")) {
      item.remove();
      return;
    }
    // Also remove if it's effectively empty (no meaningful content)
    if (item.textContent.trim() === "") {
      item.remove();
      return;
    }
  });

  // NOW: Set up click-to-expand on remaining valid items
  const publicationItems = document.querySelectorAll(
    ".publications ol.bibliography > li.publication-item"
  );

  publicationItems.forEach((item) => {
    // Add accessibility attributes
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-expanded", "false");

    // Card click handler
    item.addEventListener("click", function (e) {
      // Allow normal link behavior - don't interfere with links at all
      const clickedElement = e.target;
      const isLink =
        clickedElement.tagName === "A" || clickedElement.closest("a");
      const isInLinks = clickedElement.closest(".links");

      if (isLink || isInLinks) {
        // Don't do anything - let the browser handle the link click
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
});
