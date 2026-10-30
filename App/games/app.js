(() => {
  document.querySelector("#mainNav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;

    document.querySelectorAll(".nav-button").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      if (isActive) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.hidden = view.id !== `view-${button.dataset.view}`;
    });
  });

  document.querySelectorAll(".subnav").forEach((subnav) => {
    subnav.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;

      subnav.querySelectorAll("[data-category]").forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });

      if (subnav.id === "browseTabs") {
        document.querySelectorAll(".browse-panel").forEach((panel) => {
          panel.hidden = panel.id !== button.getAttribute("aria-controls");
        });
      } else {
        document.querySelector("#subscriptionEmptyTitle").textContent = button.dataset.category;
      }
    });

    subnav.addEventListener("keydown", (event) => {
      const tabs = [...subnav.querySelectorAll('[role="tab"]')];
      const currentIndex = tabs.indexOf(event.target);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });

  document.querySelector("#themeToggle").addEventListener("click", (event) => {
    const isLight = document.body.classList.toggle("light");
    event.currentTarget.setAttribute("aria-pressed", String(isLight));
    document.querySelector("#themeLabel").textContent = isLight ? "Dark mode" : "Light mode";
    document.querySelector("#themeIcon").textContent = isLight ? "☾" : "☼";
  });

  window.GameLibrary.initialize();
})();
