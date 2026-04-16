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

  const miscTabsRoot = document.querySelector("[data-misc-tabs]");
  if (miscTabsRoot) {
    const tabButtons = [...miscTabsRoot.querySelectorAll("[data-misc-target]")];
    const panels = [...miscTabsRoot.querySelectorAll("[data-misc-panel]")];
    const themeClasses = ["misc-theme-red", "misc-theme-light", "misc-theme-dark"];

    const activateTab = (button) => {
      const target = button.getAttribute("data-misc-target");
      const theme = button.getAttribute("data-misc-theme");

      tabButtons.forEach((tab) => {
        const isActive = tab === button;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panels.forEach((panel) => {
        const show = panel.getAttribute("data-misc-panel") === target;
        panel.toggleAttribute("hidden", !show);
        panel.classList.toggle("is-active", show);
      });

      if (theme) {
        body.classList.remove(...themeClasses);
        body.classList.add(`misc-theme-${theme}`);
      }
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button));
    });

    const initialTab = tabButtons.find((tab) => tab.classList.contains("is-active")) || tabButtons[0];
    if (initialTab) activateTab(initialTab);

    const miscImageViewer = document.getElementById("misc-image-viewer");
    const miscImageViewerImg = document.getElementById("misc-image-viewer-img");
    if (miscImageViewer && miscImageViewerImg) {
      const galleryImages = [...miscTabsRoot.querySelectorAll(".misc-poster-gallery__item img")];

      const openMiscImageViewer = (src, alt) => {
        miscImageViewerImg.setAttribute("src", src);
        miscImageViewerImg.setAttribute("alt", alt || "");
        miscImageViewer.removeAttribute("hidden");
        document.body.style.overflow = "hidden";
      };

      const closeMiscImageViewer = () => {
        if (miscImageViewer.hasAttribute("hidden")) return;
        miscImageViewer.setAttribute("hidden", "");
        miscImageViewerImg.setAttribute("src", "");
        miscImageViewerImg.setAttribute("alt", "");
        document.body.style.overflow = "";
      };

      galleryImages.forEach((img) => {
        img.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const src = img.getAttribute("src");
          if (src) openMiscImageViewer(src, img.getAttribute("alt") || "");
        });
      });

      miscImageViewer.querySelectorAll("[data-misc-image-close]").forEach((el) => {
        el.addEventListener("click", () => closeMiscImageViewer());
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMiscImageViewer();
      });
    }
  }

  const motionExpand = document.getElementById("motion-expand");
  if (motionExpand) {
    const cards = [...document.querySelectorAll(".motion-mg-card")];
    const titleEl = document.getElementById("motion-expand-title");
    const bodyEl = document.getElementById("motion-expand-body");
    const ctaEl = document.getElementById("motion-expand-cta");
    const video = motionExpand.querySelector(".motion-mg-expand__video");
    const source = video?.querySelector("source");
    const image = motionExpand.querySelector(".motion-mg-expand__image");
    const secondaryImage = motionExpand.querySelector(".motion-mg-expand__image-secondary");
    const secondaryImageLink = motionExpand.querySelector(".motion-mg-expand__image-secondary-link");
    const secondaryBadgeEl = motionExpand.querySelector("#motion-expand-secondary-badge");
    const closeTriggers = motionExpand.querySelectorAll("[data-motion-close]");
    const closeBtn = motionExpand.querySelector(".motion-mg-expand__close");
    let openTimer = null;
    let closeTimer = null;
    let languageSwapTimer = null;
    let openerCard = null;
    let currentVariantClass = "";
    let isSecondaryAltMode = false;
    let renderSecondaryLanguage = null;

    const openFromCard = (card) => {
      const src = card.getAttribute("data-media-src") || card.getAttribute("data-video-src");
      const secondarySrc = card.getAttribute("data-secondary-src") || "";
      const secondaryLink = card.getAttribute("data-secondary-link") || "";
      const secondarySrcKo = card.getAttribute("data-secondary-src-ko") || "";
      const secondaryLinkKo = card.getAttribute("data-secondary-link-ko") || "";
      const secondaryBadge = card.getAttribute("data-secondary-badge") || "";
      const secondaryBadgeAlt = card.getAttribute("data-secondary-badge-alt") || "";
      const allowLanguageToggle = card.getAttribute("data-language-toggle") === "true";
      const popupVariant = card.getAttribute("data-popup-variant") || "";
      const mediaType = card.getAttribute("data-media-type") || "video";
      const title = card.getAttribute("data-title") || "";
      const bodyText = card.getAttribute("data-body") || "";
      const bodyTextKo = card.getAttribute("data-body-ko") || "";
      const ctaText = card.getAttribute("data-popup-cta") || "";
      const ctaTextKo = card.getAttribute("data-popup-cta-ko") || "";
      const srcKo = card.getAttribute("data-media-src-ko") || "";
      const hasSecondaryLanguageToggle = allowLanguageToggle
        && Boolean(srcKo || secondarySrcKo || bodyTextKo || ctaTextKo);

      // Skip opening when no media is configured for this tile.
      if (!src) return;

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      card.classList.add("motion-mg-card--opening");

      openTimer = setTimeout(() => {
        if (currentVariantClass) {
          motionExpand.classList.remove(currentVariantClass);
          currentVariantClass = "";
        }
        if (popupVariant) {
          currentVariantClass = `popup-variant-${popupVariant.replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
          motionExpand.classList.add(currentVariantClass);
        }
        motionExpand.classList.toggle("has-secondary-media", mediaType === "image" && Boolean(secondarySrc));
        motionExpand.classList.toggle("is-merch-layout", popupVariant === "merch-stack");
        if (titleEl) titleEl.textContent = title;
        const renderContent = (useSecondaryLanguage = false) => {
          const currentSrc = useSecondaryLanguage && srcKo ? srcKo : src;
          const currentSecondarySrc = useSecondaryLanguage && secondarySrcKo ? secondarySrcKo : secondarySrc;
          const currentSecondaryLink = useSecondaryLanguage && secondaryLinkKo ? secondaryLinkKo : secondaryLink;
          const currentBodyText = useSecondaryLanguage && bodyTextKo ? bodyTextKo : bodyText;
          const currentCtaText = useSecondaryLanguage && ctaTextKo ? ctaTextKo : ctaText;
          const currentBadgeText = useSecondaryLanguage ? (secondaryBadgeAlt || "English") : secondaryBadge;

          if (bodyEl) {
            bodyEl.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = currentBodyText;
            bodyEl.appendChild(p);
          }
          if (ctaEl) {
            if (currentCtaText) {
              ctaEl.textContent = currentCtaText;
              ctaEl.removeAttribute("hidden");
            } else {
              ctaEl.textContent = "";
              ctaEl.setAttribute("hidden", "");
            }
          }
          if (mediaType === "image" && image) {
            video?.pause();
            video?.setAttribute("hidden", "");
            image.removeAttribute("hidden");
            image.setAttribute("src", currentSrc || "");
            image.setAttribute("alt", title);
            if (secondaryImage && currentSecondarySrc) {
              secondaryImage.removeAttribute("hidden");
              secondaryImage.setAttribute("src", currentSecondarySrc);
              secondaryImage.setAttribute("alt", `${title} supporting graphic`);
              if (secondaryImageLink) {
                if (currentSecondaryLink) {
                  secondaryImageLink.setAttribute("href", currentSecondaryLink);
                } else {
                  secondaryImageLink.removeAttribute("href");
                }
              }
            } else if (secondaryImage) {
              secondaryImage.setAttribute("hidden", "");
              secondaryImage.removeAttribute("src");
              secondaryImage.setAttribute("alt", "");
              secondaryImageLink?.removeAttribute("href");
            }
          }
          if (secondaryBadgeEl) {
            if (currentBadgeText && hasSecondaryLanguageToggle) {
              secondaryBadgeEl.textContent = currentBadgeText;
              secondaryBadgeEl.removeAttribute("hidden");
            } else {
              secondaryBadgeEl.textContent = "";
              secondaryBadgeEl.setAttribute("hidden", "");
            }
          }
        };

        isSecondaryAltMode = false;
        renderSecondaryLanguage = hasSecondaryLanguageToggle ? () => {
          if (languageSwapTimer) return;
          motionExpand.classList.add("is-language-swapping");
          isSecondaryAltMode = !isSecondaryAltMode;
          languageSwapTimer = setTimeout(() => {
            renderContent(isSecondaryAltMode);
            motionExpand.classList.remove("is-language-swapping");
            languageSwapTimer = null;
          }, 120);
        } : null;
        renderContent(false);

        if (mediaType === "image" && image) {
          // image content is handled by renderContent()
        } else if (video && source && src) {
          image?.setAttribute("hidden", "");
          if (secondaryImage) {
            secondaryImage.setAttribute("hidden", "");
            secondaryImage.removeAttribute("src");
            secondaryImage.setAttribute("alt", "");
          }
          if (secondaryBadgeEl) {
            secondaryBadgeEl.textContent = "";
            secondaryBadgeEl.setAttribute("hidden", "");
          }
          renderSecondaryLanguage = null;
          isSecondaryAltMode = false;
          secondaryImageLink?.removeAttribute("href");
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
      if (languageSwapTimer) {
        clearTimeout(languageSwapTimer);
        languageSwapTimer = null;
      }
      motionExpand.classList.remove("is-language-swapping");
      renderSecondaryLanguage = null;
      isSecondaryAltMode = false;
      if (secondaryBadgeEl) {
        secondaryBadgeEl.textContent = "";
        secondaryBadgeEl.setAttribute("hidden", "");
      }
      secondaryImageLink?.removeAttribute("href");
      if (ctaEl) {
        ctaEl.textContent = "";
        ctaEl.setAttribute("hidden", "");
      }
      motionExpand.classList.remove("has-secondary-media", "is-merch-layout");
      if (currentVariantClass) {
        motionExpand.classList.remove(currentVariantClass);
        currentVariantClass = "";
      }
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

    secondaryBadgeEl?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (renderSecondaryLanguage) {
        renderSecondaryLanguage();
      }
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

