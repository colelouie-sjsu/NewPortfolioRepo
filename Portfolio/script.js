document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Intro sequence: reveal logo, fade subtitle, then shrink title into header.
  requestAnimationFrame(() => {
    body.classList.add("intro-visible");
  });

  setTimeout(() => {
    body.classList.add("intro-subtitle-visible");
  }, 900);

  setTimeout(() => {
    body.classList.add("intro-exit");
  }, 2050);

  setTimeout(() => {
    body.classList.add("intro-complete");
    body.classList.remove("intro-active", "intro-visible", "intro-subtitle-visible", "intro-exit");
  }, 2850);
});
