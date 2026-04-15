document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  document.querySelectorAll("[data-href]").forEach((el) => {
    el.addEventListener("click", () => {
      const href = el.getAttribute("data-href");
      if (href) window.location.assign(href);
    });
  });

  if (!body.classList.contains("intro-active")) return;

  // Intro sequence: reveal logo, fade subtitle, then shrink title into header.
  requestAnimationFrame(() => {
    body.classList.add("intro-visible");
  });

  setTimeout(() => {
    body.classList.add("intro-subtitle-visible");
  }, 1100);

  setTimeout(() => {
    body.classList.add("intro-exit");
  }, 4100);

  setTimeout(() => {
    body.classList.add("intro-complete");
    body.classList.remove("intro-active", "intro-visible", "intro-subtitle-visible", "intro-exit");
  }, 5000);
});
