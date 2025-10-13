// Retro 8-bit Interactions - Improved Version
(function () {
  "use strict";

  function setupRetroEffects() {
    // Konami Code Easter Egg
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let konamiIndex = 0;

    document.addEventListener("keydown", function (e) {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          activateKonamiCode();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    });

    function activateKonamiCode() {
      document.body.style.animation = "rainbow 2s infinite";
      showAchievement("🎮 KONAMI CODE UNLOCKED! 🎮");
      setTimeout(() => {
        document.body.style.animation = "";
      }, 5000);
    }

    function showAchievement(text) {
      const achievement = document.createElement("div");
      achievement.innerHTML = text;
      achievement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--retro-success);
      color: var(--global-bg-color);
      padding: 20px 40px;
      border: var(--pixel-border);
      box-shadow: var(--pixel-shadow-hover);
      font-family: 'Press Start 2P', cursive;
      font-size: 1.2rem;
      z-index: 10000;
      animation: bounce 0.5s ease;
    `;
      document.body.appendChild(achievement);
      setTimeout(() => {
        achievement.remove();
      }, 3000);
    }

    // Pixel Button Click Effect
    const buttons = document.querySelectorAll("a.btn, button");
    buttons.forEach((button) => {
      button.addEventListener("click", function (e) {
        createParticles(e.clientX, e.clientY);
      });
    });

    function createParticles(x, y) {
      for (let i = 0; i < 3; i++) {
        // Reduced from 5 to 3
        const particle = document.createElement("div");
        particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: var(--retro-primary);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 9999;
      `;
        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / 3;
        const velocity = 3;
        let dx = Math.cos(angle) * velocity;
        let dy = Math.sin(angle) * velocity;
        let life = 30;

        const animate = () => {
          if (life <= 0) {
            particle.remove();
            return;
          }
          const currentX = parseFloat(particle.style.left);
          const currentY = parseFloat(particle.style.top);
          particle.style.left = currentX + dx + "px";
          particle.style.top = currentY + dy + "px";
          particle.style.opacity = life / 30;
          life--;
          requestAnimationFrame(animate);
        };
        animate();
      }
    }

    // Project card expansion with EVENT DELEGATION for immediate response
    // This works even if cards aren't in DOM yet
    document.body.addEventListener("click", function (e) {
      // Find if click was on or inside a project card
      const projectCard = e.target.closest(".project-card");

      if (!projectCard) return;

      // Don't expand if clicking a link
      if (e.target.tagName === "A" || e.target.closest("a")) return;

      // Toggle expansion
      projectCard.classList.toggle("expanded");

      const description = projectCard.querySelector(".project-description");
      if (description) {
        if (projectCard.classList.contains("expanded")) {
          description.style.display = "block";
          setTimeout(() => {
            description.style.opacity = "1";
          }, 10);
        } else {
          description.style.opacity = "0";
          setTimeout(() => {
            description.style.display = "none";
          }, 300);
        }
      }
    });

    // Also set up cards that are already in DOM for accessibility
    function setupProjectCards() {
      const projectCards = document.querySelectorAll(".project-card");
      projectCards.forEach((card) => {
        if (card.dataset.expandSetup) return;
        card.dataset.expandSetup = "true";

        // Add keyboard support
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");

        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.click();
          }
        });
      });
    }

    setupProjectCards();

    // Watch for new cards
    if (typeof MutationObserver !== "undefined") {
      const projectObserver = new MutationObserver(function (mutations) {
        let shouldSetup = false;
        mutations.forEach(function (mutation) {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(function (node) {
              if (
                node.nodeType === 1 &&
                (node.classList.contains("project-card") ||
                  node.querySelector(".project-card"))
              ) {
                shouldSetup = true;
              }
            });
          }
        });
        if (shouldSetup) {
          setupProjectCards();
        }
      });
      projectObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // CRT screen flicker effect on page load
    document.body.style.animation = "flicker 0.1s ease-in";
    setTimeout(() => {
      document.body.style.animation = "";
    }, 100);

    // Fixed sparkle effect for headers
    const headers = document.querySelectorAll("h1, h2, h3");
    headers.forEach((header) => {
      header.addEventListener("mouseenter", function (e) {
        createSparkle(e);
      });
    });

    function createSparkle(event) {
      const sparkle = document.createElement("span");
      sparkle.innerHTML = "✨";
      sparkle.className = "sparkle-effect";
      sparkle.style.cssText = `
      position: fixed;
      left: ${event.clientX + 10}px;
      top: ${event.clientY - 10}px;
      font-size: 1rem;
      animation: sparkle 0.8s ease-out;
      pointer-events: none;
      z-index: 9999;
    `;
      document.body.appendChild(sparkle);
      setTimeout(() => {
        sparkle.remove();
      }, 800);
    }

    // Smooth scroll enhancement with retro feel
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#" || !href) return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const targetPosition =
            target.getBoundingClientRect().top + window.pageYOffset;
          const startPosition = window.pageYOffset;
          const distance = targetPosition - startPosition;
          const duration = 800;
          let start = null;

          function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
          }

          function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return (c / 2) * t * t + b;
            t--;
            return (-c / 2) * (t * (t - 2) - 1) + b;
          }

          requestAnimationFrame(animation);
        }
      });
    });

    // Typing effect for specific text elements
    const typingElements = document.querySelectorAll(".typing-effect");
    typingElements.forEach((element) => {
      const text = element.textContent;
      element.textContent = "";
      element.style.opacity = "1";
      let index = 0;

      function type() {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
          setTimeout(type, 50);
        }
      }

      // Start typing when element is in viewport
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            type();
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(element);
    });

    // Glitch effect on random intervals for specific elements
    const glitchElements = document.querySelectorAll(".glitch-effect");
    glitchElements.forEach((element) => {
      setInterval(() => {
        if (Math.random() > 0.95) {
          element.style.animation = "glitch 0.3s ease";
          setTimeout(() => {
            element.style.animation = "";
          }, 300);
        }
      }, 2000);
    });

    // Pixel trail cursor effect - DISABLED for performance
    /*
  let lastX = 0;
  let lastY = 0;
  let throttleTimer = false;

  document.addEventListener('mousemove', (e) => {
    if (throttleTimer) return;
    throttleTimer = true;
    
    setTimeout(() => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2)
      );
      
      if (distance > 50) {
        createPixelTrail(e.clientX, e.clientY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
      throttleTimer = false;
    }, 100);
  });

  function createPixelTrail(x, y) {
    const trail = document.createElement('div');
    trail.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: var(--retro-primary);
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9998;
      opacity: 0.3;
      animation: fadeOut 0.5s ease-out;
    `;
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 500);
  }
  */

    // Page transition effect
    window.addEventListener("beforeunload", () => {
      document.body.style.animation = "fadeOut 0.3s ease-out";
    });

    // Scan lines effect - DISABLED for performance
    /*
  const scanlines = document.createElement('div');
  scanlines.className = 'scanlines';
  scanlines.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9997;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.05),
      rgba(0, 0, 0, 0.05) 1px,
      transparent 1px,
      transparent 2px
    );
    opacity: 0.3;
  `;
  document.body.appendChild(scanlines);
  */
  }

  // Run immediately if DOM is already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupRetroEffects);
  } else {
    setupRetroEffects();
  }
})();

// Enhanced CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
  }

  @keyframes sparkle {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-20px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translateY(-40px) scale(0);
    }
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  @keyframes glitch {
    0% {
      transform: translate(0);
    }
    20% {
      transform: translate(-2px, 2px);
    }
    40% {
      transform: translate(-2px, -2px);
    }
    60% {
      transform: translate(2px, 2px);
    }
    80% {
      transform: translate(2px, -2px);
    }
    100% {
      transform: translate(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .sparkle-effect {
    user-select: none;
  }

  /* Optional hover effects */
  h1, h2, h3 {
    position: relative;
    transition: all 0.3s ease;
  }

  h1:hover, h2:hover, h3:hover {
    transform: translateX(2px);
  }

  /* Subtle pulse for important elements */
  .pulse-effect {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
`;
document.head.appendChild(style);
