document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const introSkipKey = "skipIntroOnce";
  const globalThemeStorageKey = "portfolioGlobalThemeAlt";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!body.classList.contains("page-home")) {
    body.classList.add("page-assets-pending");
  }

  try {
    if (localStorage.getItem(globalThemeStorageKey) === "1") {
      body.classList.add("theme-alt-global");
    }
  } catch (e) {
    // Ignore storage read errors.
  }

  const headerLogo = document.querySelector(".site-header .site-title");
  let homeGlitchTimer = null;
  if (headerLogo) {
    headerLogo.addEventListener("dblclick", () => {
      const isAltEnabled = body.classList.toggle("theme-alt-global");
      try {
        localStorage.setItem(globalThemeStorageKey, isAltEnabled ? "1" : "0");
      } catch (e) {
        // Ignore storage write errors.
      }
      body.classList.remove("home-theme-glitch");
      // Force restart of the glitch animation on every theme toggle.
      void body.offsetWidth;
      body.classList.add("home-theme-glitch");
      if (homeGlitchTimer) {
        clearTimeout(homeGlitchTimer);
      }
      homeGlitchTimer = setTimeout(() => {
        body.classList.remove("home-theme-glitch");
        homeGlitchTimer = null;
      }, 680);
    });
  }

  document.querySelectorAll("[data-href]").forEach((el) => {
    el.addEventListener("click", () => {
      const href = el.getAttribute("data-href");
      if (!href) return;
      if (body.classList.contains("tiles-exit") || body.classList.contains("tile-transition-active")) {
        return;
      }

      const isReturnButton = el.classList.contains("motion-mg-return")
        || el.classList.contains("project-detail__back");
      const isIndexDestination = /(^|\/)\.\.\/index\.html$|(^|\/)index\.html$/.test(href);
      const isHomeTile = body.classList.contains("page-home") && el.classList.contains("project-tile");
      const prefersReducedMotionNav = prefersReducedMotion;
      const transitionMs = prefersReducedMotionNav ? 0 : 820;

      const navigate = () => {
        if (isReturnButton && isIndexDestination) {
          try {
            sessionStorage.setItem(introSkipKey, "1");
          } catch (e) {
            // Ignore storage errors; navigation still works.
          }
        }
        window.location.assign(href);
      };

      if (isHomeTile) {
        body.classList.add("tiles-exit");
        body.classList.remove("tiles-reveal");
        window.setTimeout(navigate, transitionMs);
        return;
      }

      if (isReturnButton && isIndexDestination) {
        playReturnPageExit(transitionMs).then(navigate);
        return;
      }

      navigate();
    });
  });

  const isVisibleAsset = (el) => {
    if (el.closest("[hidden]")) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return "";
    const trimmedUrl = url.trim();
    const idPatterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of idPatterns) {
      const match = trimmedUrl.match(pattern);
      if (match?.[1]) return match[1];
    }
    return "";
  };

  const applyCardThumbs = () => {
    document.querySelectorAll(".motion-mg-card").forEach((card) => {
      const explicitThumb = card.getAttribute("data-thumb-src") || "";
      const mediaThumb = card.getAttribute("data-media-src") || "";
      const videoSrc = card.getAttribute("data-video-src") || "";
      let thumbSrc = explicitThumb || mediaThumb;
      if (!thumbSrc && videoSrc) {
        const youtubeVideoId = extractYouTubeVideoId(videoSrc);
        if (youtubeVideoId) {
          thumbSrc = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
        }
      }

      const setThumbImage = (src) => {
        if (!src) return;
        card.style.setProperty("--card-thumb", `url("${src}")`);
        let thumbImg = card.querySelector(".motion-mg-card__thumb");
        if (!thumbImg) {
          thumbImg = document.createElement("img");
          thumbImg.className = "motion-mg-card__thumb";
          thumbImg.alt = "";
          thumbImg.setAttribute("loading", "lazy");
          thumbImg.setAttribute("aria-hidden", "true");
          card.insertBefore(thumbImg, card.firstChild);
        }
        if (thumbImg.getAttribute("src") !== src) {
          thumbImg.setAttribute("src", src);
        }
      };

      if (thumbSrc) {
        setThumbImage(thumbSrc);
        return;
      }

      // Capture a frame from local videos so tiles still show artwork.
      if (videoSrc && !extractYouTubeVideoId(videoSrc)) {
        const video = document.createElement("video");
        video.src = videoSrc;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        const captureFrame = () => {
          try {
            if (!video.videoWidth || !video.videoHeight) return;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumbImage(canvas.toDataURL("image/jpeg", 0.82));
          } catch (e) {
            // Ignore capture failures (e.g. tainted canvas).
          }
        };
        video.addEventListener("loadeddata", () => {
          try {
            video.currentTime = Math.min(0.15, (video.duration || 1) * 0.05);
          } catch (e) {
            captureFrame();
          }
        });
        video.addEventListener("seeked", captureFrame, { once: true });
      }
    });
  };

  const collectPageAssets = () => {
    const visibleCards = [...document.querySelectorAll(".motion-mg-card")].filter(isVisibleAsset);
    const pageChrome = [...document.querySelectorAll(
      ".jsa-semester-tabs, .misc-posters-menu, .misc-posters-panel.is-active .project-detail__title, .misc-posters-panel.is-active .project-detail__lead",
    )].filter(isVisibleAsset);
    const fallbackAssets = [...document.querySelectorAll(
      ".about-layout__photo-wrap, .about-layout__content > *, .contacts-card-wrap, .contacts-layout__content > *, .jsa-semester-empty",
    )].filter(isVisibleAsset);

    return visibleCards.length
      ? [...pageChrome, ...visibleCards]
      : fallbackAssets;
  };

  const playReturnPageExit = (transitionMs) => new Promise((resolve) => {
    if (transitionMs <= 0) {
      resolve();
      return;
    }

    // Close any open detail popup so page tiles are visible for the exit.
    const openExpand = document.getElementById("motion-expand");
    if (openExpand && openExpand.classList.contains("is-open")) {
      openExpand.classList.remove("is-open");
      openExpand.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }
    ["misc-image-viewer", "ai-image-viewer", "jsa-image-viewer"].forEach((id) => {
      const viewer = document.getElementById(id);
      if (viewer && !viewer.hasAttribute("hidden")) {
        viewer.setAttribute("hidden", "");
      }
    });

    body.classList.add("tile-transition-active", "page-assets-exit");

    const assets = collectPageAssets();
    assets.forEach((el, index) => {
      el.classList.remove("page-enter-asset");
      el.classList.add("page-exit-asset");
      el.style.setProperty("--page-exit-delay", `${Math.min(index * 0.05, 0.4)}s`);
    });
    body.classList.remove("page-assets-ready", "page-assets-ready--instant");
    restartFlipAnimation(assets);

    // Soften surrounding chrome so the falling assets read clearly.
    document.querySelectorAll(".site-header, .header-divider, .vector-scroll-bg").forEach((el) => {
      el.classList.add("page-exit-chrome");
    });

    window.setTimeout(() => {
      resolve();
    }, transitionMs);
  });

  const restartFlipAnimation = (elements) => {
    elements.forEach((el) => {
      el.style.animation = "none";
    });
    // Force the browser to commit the pre-animation state before restarting.
    void body.offsetWidth;
    elements.forEach((el) => {
      el.style.removeProperty("animation");
    });
  };

  const revealPageAssets = () => {
    if (body.classList.contains("page-home")) return;

    const assets = collectPageAssets();
    assets.forEach((el, index) => {
      el.classList.add("page-enter-asset");
      el.style.setProperty("--page-enter-delay", `${Math.min(0.04 + index * 0.07, 0.9)}s`);
    });

    if (!assets.length || prefersReducedMotion) {
      body.classList.add("page-assets-ready", "page-assets-ready--instant");
      body.classList.remove("page-assets-pending");
      return;
    }

    body.classList.remove("page-assets-ready", "page-assets-ready--instant");
    body.classList.add("page-assets-pending");
    restartFlipAnimation(assets);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("page-assets-ready");
        body.classList.remove("page-assets-pending");
      });
    });
  };

  applyCardThumbs();

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
        const linkedAnchor = img.closest(".misc-poster-gallery__link");

        img.addEventListener("click", (e) => {
          if (linkedAnchor) return;
          e.preventDefault();
          e.stopPropagation();
          const src = img.getAttribute("src");
          if (src) openMiscImageViewer(src, img.getAttribute("alt") || "");
        });

        if (linkedAnchor) {
          img.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMiscImageViewer();
            const href = linkedAnchor.getAttribute("href");
            if (!href) return;
            const target = linkedAnchor.getAttribute("target") || "_self";
            if (target === "_blank") {
              window.open(href, "_blank", "noopener,noreferrer");
              return;
            }
            window.location.assign(href);
          });
        }
      });

      miscImageViewer.querySelectorAll("[data-misc-image-close]").forEach((el) => {
        el.addEventListener("click", () => closeMiscImageViewer());
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMiscImageViewer();
      });
    }
  }

  const aiImageViewer = document.getElementById("ai-image-viewer");
  const aiImageViewerImg = document.getElementById("ai-image-viewer-img");
  if (body.classList.contains("page-ai-artworks") && aiImageViewer && aiImageViewerImg) {
    const aiGalleryImages = [...document.querySelectorAll(".ai-drop-tab__grid img")];

    const openAiImageViewer = (src, alt) => {
      aiImageViewerImg.setAttribute("src", src);
      aiImageViewerImg.setAttribute("alt", alt || "");
      aiImageViewer.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
    };

    const closeAiImageViewer = () => {
      if (aiImageViewer.hasAttribute("hidden")) return;
      aiImageViewer.setAttribute("hidden", "");
      aiImageViewerImg.setAttribute("src", "");
      aiImageViewerImg.setAttribute("alt", "");
      document.body.style.overflow = "";
    };

    aiGalleryImages.forEach((img) => {
      img.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const src = img.getAttribute("src");
        if (src) openAiImageViewer(src, img.getAttribute("alt") || "");
      });
    });

    aiImageViewer.querySelectorAll("[data-ai-image-close]").forEach((el) => {
      el.addEventListener("click", () => closeAiImageViewer());
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAiImageViewer();
    });
  }

  if (body.classList.contains("page-vector-portraits")) {
    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const tracks = [...document.querySelectorAll(".vector-scroll-bg__track")];
    tracks.forEach((track) => {
      const sets = [...track.querySelectorAll(".vector-scroll-bg__set")];
      if (!sets.length) return;

      const baseImages = [...sets[0].querySelectorAll("img")];
      const shuffled = shuffleInPlace(baseImages.map((img) => ({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
      })));

      sets.forEach((set) => {
        const setImages = [...set.querySelectorAll("img")];
        setImages.forEach((img, idx) => {
          const item = shuffled[idx % shuffled.length];
          img.setAttribute("src", item.src);
          img.setAttribute("alt", item.alt);
        });
      });
    });
  }

  const aiDropTabs = [...document.querySelectorAll(".ai-drop-tab")];
  if (aiDropTabs.length) {
    const transitionTiming = "max-height 0.42s ease, opacity 0.28s ease";

    aiDropTabs.forEach((tab) => {
      const summary = tab.querySelector(".ai-drop-tab__summary");
      const content = tab.querySelector(".ai-drop-tab__content");
      if (!summary || !content) return;

      if (!tab.open) {
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
      }

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        if (tab.classList.contains("is-animating")) return;

        const isOpening = !tab.open;
        tab.classList.add("is-animating");
        content.style.overflow = "hidden";
        content.style.transition = transitionTiming;

        if (isOpening) {
          tab.open = true;
          content.style.maxHeight = "0px";
          content.style.opacity = "0";
          requestAnimationFrame(() => {
            content.style.maxHeight = `${content.scrollHeight}px`;
            content.style.opacity = "1";
          });
        } else {
          content.style.maxHeight = `${content.scrollHeight}px`;
          content.style.opacity = "1";
          requestAnimationFrame(() => {
            content.style.maxHeight = "0px";
            content.style.opacity = "0";
          });
        }

        const onTransitionEnd = (event) => {
          if (event.propertyName !== "max-height") return;
          content.removeEventListener("transitionend", onTransitionEnd);
          tab.classList.remove("is-animating");

          if (!isOpening) {
            tab.open = false;
          } else {
            content.style.maxHeight = "";
          }

          content.style.transition = "";
          content.style.overflow = "";
          if (tab.open) {
            content.style.opacity = "";
          }
        };

        content.addEventListener("transitionend", onTransitionEnd);
      });
    });
  }

  const aiGalleryRoot = document.querySelector("[data-ai-gallery]");
  if (aiGalleryRoot) {
    const slides = [...aiGalleryRoot.querySelectorAll("[data-ai-slide]")].map((el) => ({
      src: el.getAttribute("data-src") || "",
      title: el.getAttribute("data-title") || "",
      text: el.getAttribute("data-text") || "",
    })).filter((slide) => Boolean(slide.src));

    const imageEl = document.getElementById("ai-gallery-image");
    const titleEl = document.getElementById("ai-gallery-title");
    const textEl = document.getElementById("ai-gallery-text");
    const navButtons = [...aiGalleryRoot.querySelectorAll("[data-ai-dir]")];
    let currentIdx = 0;

    const renderAiSlide = (idx) => {
      if (!slides.length || !imageEl || !titleEl || !textEl) return;
      const total = slides.length;
      currentIdx = ((idx % total) + total) % total;
      const slide = slides[currentIdx];

      imageEl.setAttribute("src", slide.src);
      imageEl.setAttribute("alt", slide.title || "AI artwork slide");
      titleEl.textContent = slide.title;
      textEl.textContent = slide.text;
    };

    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = Number(btn.getAttribute("data-ai-dir") || "0");
        renderAiSlide(currentIdx + step);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (!slides.length) return;
      if (e.key === "ArrowLeft") renderAiSlide(currentIdx - 1);
      if (e.key === "ArrowRight") renderAiSlide(currentIdx + 1);
    });

    renderAiSlide(0);
  }

  const motionExpand = document.getElementById("motion-expand");
  if (motionExpand) {
    const cards = [...document.querySelectorAll(".motion-mg-card")];
    const titleEl = document.getElementById("motion-expand-title");
    const bodyEl = document.getElementById("motion-expand-body");
    const ctaEl = document.getElementById("motion-expand-cta");
    const video = motionExpand.querySelector(".motion-mg-expand__video");
    const source = video?.querySelector("source");
    const youtubePlayer = motionExpand.querySelector(".motion-mg-expand__youtube-player");
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
    const jsaImageViewer = document.getElementById("jsa-image-viewer");
    const jsaImageViewerImg = document.getElementById("jsa-image-viewer-img");
    const isJsaPostersPage = body.classList.contains("page-jsa-posters");

    const openJsaImageViewer = (src, altText) => {
      if (!isJsaPostersPage || !jsaImageViewer || !jsaImageViewerImg || !src) return;
      jsaImageViewerImg.setAttribute("src", src);
      jsaImageViewerImg.setAttribute("alt", altText || "");
      jsaImageViewer.removeAttribute("hidden");
    };

    const closeJsaImageViewer = () => {
      if (!jsaImageViewer || jsaImageViewer.hasAttribute("hidden")) return;
      jsaImageViewer.setAttribute("hidden", "");
      if (jsaImageViewerImg) {
        jsaImageViewerImg.setAttribute("src", "");
        jsaImageViewerImg.setAttribute("alt", "");
      }
    };

    if (isJsaPostersPage && jsaImageViewer && jsaImageViewerImg) {
      [image, secondaryImage].forEach((imgEl) => {
        if (!imgEl) return;
        imgEl.addEventListener("click", (event) => {
          if (imgEl.hasAttribute("hidden")) return;
          event.preventDefault();
          const src = imgEl.getAttribute("src") || "";
          const altText = imgEl.getAttribute("alt") || "";
          openJsaImageViewer(src, altText);
        });
      });

      jsaImageViewer.querySelectorAll("[data-jsa-image-close]").forEach((el) => {
        el.addEventListener("click", () => closeJsaImageViewer());
      });
    }

    if (image) {
      image.addEventListener("dblclick", () => {
        const externalLink = image.dataset.externalLink;
        if (!externalLink) return;
        window.open(externalLink, "_blank", "noopener,noreferrer");
      });
    }

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
            if (youtubePlayer) {
              youtubePlayer.setAttribute("hidden", "");
              youtubePlayer.setAttribute("src", "");
            }
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
            if (!currentSecondarySrc && currentSecondaryLink) {
              image.style.cursor = "pointer";
              image.dataset.externalLink = currentSecondaryLink;
            } else {
              image.style.cursor = "";
              delete image.dataset.externalLink;
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
          const youtubeVideoId = extractYouTubeVideoId(src);
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
          if (youtubeVideoId && youtubePlayer) {
            video.setAttribute("hidden", "");
            video.pause();
            source.setAttribute("src", "");
            youtubePlayer.removeAttribute("hidden");
            youtubePlayer.setAttribute(
              "src",
              `https://www.youtube.com/embed/${youtubeVideoId}?rel=0`,
            );
          } else {
            if (youtubePlayer) {
              youtubePlayer.setAttribute("hidden", "");
              youtubePlayer.setAttribute("src", "");
            }
            video.removeAttribute("hidden");
            video.pause();
            source.setAttribute("src", src);
            video.load();
          }
        }
        motionExpand.removeAttribute("hidden");
        requestAnimationFrame(() => {
          motionExpand.classList.add("is-open");
        });
        document.body.style.overflow = "hidden";
        openerCard = card;
        card.classList.remove("motion-mg-card--opening");
        if (closeBtn) {
          closeBtn.focus();
        } else if (titleEl) {
          titleEl.setAttribute("tabindex", "-1");
          titleEl.focus();
        }
      }, 120);
    };

    const closeExpand = () => {
      if (!motionExpand.classList.contains("is-open") && motionExpand.hasAttribute("hidden")) return;
      closeJsaImageViewer();
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
      motionExpand.classList.remove("is-open");
      video?.pause();
      if (source) {
        source.setAttribute("src", "");
      }
      if (youtubePlayer) {
        youtubePlayer.setAttribute("hidden", "");
        youtubePlayer.setAttribute("src", "");
      }
      if (image) {
        image.setAttribute("hidden", "");
        image.removeAttribute("src");
        image.style.cursor = "";
        delete image.dataset.externalLink;
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
      if (e.key === "Escape" && jsaImageViewer && !jsaImageViewer.hasAttribute("hidden")) {
        closeJsaImageViewer();
        return;
      }
      if (e.key === "Escape" && motionExpand.classList.contains("is-open")) {
        closeExpand();
      }
    });
  }

  const revealHomeTiles = (instant = false) => {
    if (!body.classList.contains("page-home")) return;
    const tiles = [...document.querySelectorAll(".project-tile")];

    if (instant || prefersReducedMotion) {
      body.classList.add("tiles-reveal", "tiles-reveal--instant");
      return;
    }

    body.classList.remove("tiles-reveal", "tiles-reveal--instant");
    restartFlipAnimation(tiles);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("tiles-reveal");
      });
    });
  };

  // Run entrance after page setup/thumbs so flip-up has content to show.
  revealPageAssets();

  if (!body.classList.contains("intro-active")) return;

  try {
    if (sessionStorage.getItem(introSkipKey) === "1") {
      sessionStorage.removeItem(introSkipKey);
      body.classList.add("intro-complete");
      body.classList.remove("intro-active", "intro-visible", "intro-subtitle-visible", "intro-exit");
      // After return transition, flip tiles up instead of showing them instantly.
      revealHomeTiles(false);
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
    revealHomeTiles(false);
  }, 5000);
});

