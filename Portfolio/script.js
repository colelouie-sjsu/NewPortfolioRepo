document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const introSkipKey = "skipIntroOnce";

  document.querySelectorAll("[data-href]").forEach((el) => {
    el.addEventListener("click", () => {
      const href = el.getAttribute("data-href");
      if (!href) return;

      const isReturnButton = el.classList.contains("motion-mg-return")
        || el.classList.contains("project-detail__back");
      const isIndexDestination = /(^|\/)\.\.\/index\.html$|(^|\/)index\.html$/.test(href);

      if (isReturnButton && isIndexDestination) {
        try {
          sessionStorage.setItem(introSkipKey, "1");
        } catch (e) {
          // Ignore storage errors; navigation still works.
        }
      }

      window.location.assign(href);
    });
  });

  const motionExpand = document.getElementById("motion-expand");
  if (motionExpand) {
    const cards = [...document.querySelectorAll(".motion-mg-card")];
    const titleEl = document.getElementById("motion-expand-title");
    const bodyEl = document.getElementById("motion-expand-body");
    const video = motionExpand.querySelector(".motion-mg-expand__video");
    const source = video?.querySelector("source");
    const image = motionExpand.querySelector(".motion-mg-expand__image");
    const secondaryImage = motionExpand.querySelector(".motion-mg-expand__image-secondary");
    const closeTriggers = motionExpand.querySelectorAll("[data-motion-close]");
    const closeBtn = motionExpand.querySelector(".motion-mg-expand__close");
    let openTimer = null;
    let closeTimer = null;
    let openerCard = null;

    const openFromCard = (card) => {
      const src = card.getAttribute("data-media-src") || card.getAttribute("data-video-src");
      const secondarySrc = card.getAttribute("data-secondary-src") || "";
      const popupVariant = card.getAttribute("data-popup-variant") || "";
      const mediaType = card.getAttribute("data-media-type") || "video";
      const title = card.getAttribute("data-title") || "";
      const bodyText = card.getAttribute("data-body") || "";

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      card.classList.add("motion-mg-card--opening");

      openTimer = setTimeout(() => {
        motionExpand.classList.toggle("has-secondary-media", mediaType === "image" && Boolean(secondarySrc));
        motionExpand.classList.toggle("is-merch-layout", popupVariant === "merch-stack");
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) {
          bodyEl.innerHTML = "";
          const p = document.createElement("p");
          p.textContent = bodyText;
          bodyEl.appendChild(p);
        }
        if (mediaType === "image" && image) {
          video?.pause();
          video?.setAttribute("hidden", "");
          image.removeAttribute("hidden");
          image.setAttribute("src", src || "");
          image.setAttribute("alt", title);
          if (secondaryImage && secondarySrc) {
            secondaryImage.removeAttribute("hidden");
            secondaryImage.setAttribute("src", secondarySrc);
            secondaryImage.setAttribute("alt", `${title} supporting graphic`);
          } else if (secondaryImage) {
            secondaryImage.setAttribute("hidden", "");
            secondaryImage.removeAttribute("src");
            secondaryImage.setAttribute("alt", "");
          }
        } else if (video && source && src) {
          image?.setAttribute("hidden", "");
          if (secondaryImage) {
            secondaryImage.setAttribute("hidden", "");
            secondaryImage.removeAttribute("src");
            secondaryImage.setAttribute("alt", "");
          }
          video.removeAttribute("hidden");
          video.pause();
          source.setAttribute("src", src);
          video.load();
        }
        motionExpand.removeAttribute("hidden");
        requestAnimationFrame(() => {
          motionExpand.classList.add("is-open");
        });
        document.body.style.overflow = "hidden";
        openerCard = card;
        card.classList.remove("motion-mg-card--opening");
        closeBtn?.focus();
      }, 120);
    };

    const closeExpand = () => {
      if (!motionExpand.classList.contains("is-open") && motionExpand.hasAttribute("hidden")) return;
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
      motionExpand.classList.remove("is-open");
      video?.pause();
      if (image) {
        image.setAttribute("hidden", "");
        image.removeAttribute("src");
      }
      if (secondaryImage) {
        secondaryImage.setAttribute("hidden", "");
        secondaryImage.removeAttribute("src");
        secondaryImage.setAttribute("alt", "");
      }
      motionExpand.classList.remove("has-secondary-media", "is-merch-layout");
      document.body.style.overflow = "";
      closeTimer = setTimeout(() => {
        motionExpand.setAttribute("hidden", "");
        if (openerCard) {
          openerCard.focus();
          openerCard = null;
        }
      }, 280);
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => openFromCard(card));
    });

    closeTriggers.forEach((el) => {
      el.addEventListener("click", () => closeExpand());
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && motionExpand.classList.contains("is-open")) {
        closeExpand();
      }
    });
  }

  if (!body.classList.contains("intro-active")) return;

  try {
    if (sessionStorage.getItem(introSkipKey) === "1") {
      sessionStorage.removeItem(introSkipKey);
      body.classList.add("intro-complete");
      body.classList.remove("intro-active", "intro-visible", "intro-subtitle-visible", "intro-exit");
      return;
    }
  } catch (e) {
    // Ignore storage errors and fall back to normal intro behavior.
  }

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

