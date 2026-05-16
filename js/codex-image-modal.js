/* =========================================================
   CODEX IMAGE POPOUT MODAL
   ========================================================= */

let codexImageModalLastFocus = null;

const codexImageModalState = {
  sources: [],
  index: 0,
  scale: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  panOriginX: 0,
  panOriginY: 0
};

function ensureCodexImageModal() {
  let modal = document.getElementById("codex-image-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "codex-image-modal";
  modal.className = "codex-image-modal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="codex-image-modal-backdrop" data-codex-image-modal-close="true"></div>
    <div class="codex-image-modal-panel" role="dialog" aria-modal="true" aria-label="Expanded image">
      <button
        class="codex-image-modal-close"
        type="button"
        aria-label="Close image"
        data-codex-image-modal-close="true"
      >✕</button>
      <button
        class="codex-image-modal-nav codex-image-modal-prev"
        type="button"
        aria-label="Previous image"
        data-codex-image-modal-direction="prev"
      >‹</button>
      <div class="codex-image-modal-frame">
        <img class="codex-image-modal-img" alt="">
      </div>
      <button
        class="codex-image-modal-nav codex-image-modal-next"
        type="button"
        aria-label="Next image"
        data-codex-image-modal-direction="next"
      >›</button>
    </div>
  `;

  modal.addEventListener("click", event => {
    if (event.target?.dataset?.codexImageModalClose === "true") {
      closeCodexImageModal();
      return;
    }

    const direction = event.target?.dataset?.codexImageModalDirection;
    if (direction) {
      event.preventDefault();
      event.stopPropagation();
      stepCodexImageModal(direction === "next" ? 1 : -1);
    }
  });

  modal.addEventListener("wheel", event => {
    if (!modal.classList.contains("open")) return;

    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setCodexImageModalScale(codexImageModalState.scale + delta, event);
  }, { passive: false });

  bindCodexImageModalPanEvents(modal);

  document.body.appendChild(modal);
  return modal;
}

function getCodexImageModalImage() {
  return document.querySelector("#codex-image-modal .codex-image-modal-img");
}

function clampCodexImageModalScale(value) {
  return Math.min(4, Math.max(1, Number(value) || 1));
}

function getCodexImageModalPanBounds() {
  const image = getCodexImageModalImage();
  const frame = image?.closest(".codex-image-modal-frame");
  if (!image || !frame || codexImageModalState.scale <= 1) {
    return { maxX: 0, maxY: 0 };
  }

  const imageRect = image.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const unscaledWidth = imageRect.width / codexImageModalState.scale;
  const unscaledHeight = imageRect.height / codexImageModalState.scale;
  const scaledWidth = unscaledWidth * codexImageModalState.scale;
  const scaledHeight = unscaledHeight * codexImageModalState.scale;

  return {
    maxX: Math.max(0, (scaledWidth - frameRect.width) / 2),
    maxY: Math.max(0, (scaledHeight - frameRect.height) / 2)
  };
}

function clampCodexImageModalPan() {
  const bounds = getCodexImageModalPanBounds();

  codexImageModalState.panX = Math.min(bounds.maxX, Math.max(-bounds.maxX, codexImageModalState.panX));
  codexImageModalState.panY = Math.min(bounds.maxY, Math.max(-bounds.maxY, codexImageModalState.panY));

  if (codexImageModalState.scale <= 1.01) {
    codexImageModalState.panX = 0;
    codexImageModalState.panY = 0;
  }
}

function applyCodexImageModalTransform() {
  const image = getCodexImageModalImage();
  if (!image) return;

  clampCodexImageModalPan();

  image.style.transform = `translate(${codexImageModalState.panX}px, ${codexImageModalState.panY}px) scale(${codexImageModalState.scale})`;
  image.classList.toggle("zoomed", codexImageModalState.scale > 1.01);
  image.classList.toggle("panning", codexImageModalState.isPanning);
}

function setCodexImageModalScale(value, anchorEvent = null) {
  const oldScale = codexImageModalState.scale;
  const newScale = clampCodexImageModalScale(value);

  if (anchorEvent && oldScale > 0 && newScale !== oldScale) {
    const image = getCodexImageModalImage();
    const frame = image?.closest(".codex-image-modal-frame");

    if (image && frame) {
      const frameRect = frame.getBoundingClientRect();
      const offsetX = anchorEvent.clientX - frameRect.left - frameRect.width / 2;
      const offsetY = anchorEvent.clientY - frameRect.top - frameRect.height / 2;
      const zoomRatio = newScale / oldScale;

      codexImageModalState.panX = offsetX - (offsetX - codexImageModalState.panX) * zoomRatio;
      codexImageModalState.panY = offsetY - (offsetY - codexImageModalState.panY) * zoomRatio;
    }
  }

  codexImageModalState.scale = newScale;

  if (codexImageModalState.scale <= 1.01) {
    codexImageModalState.panX = 0;
    codexImageModalState.panY = 0;
  }

  applyCodexImageModalTransform();
}

function resetCodexImageModalScale() {
  codexImageModalState.scale = 1;
  codexImageModalState.panX = 0;
  codexImageModalState.panY = 0;
  codexImageModalState.isPanning = false;
  applyCodexImageModalTransform();
}

function getCodexImageModalSrcFromSource(source) {
  return String(source?.src || source || "").trim();
}

function setCodexImageModalImage(index) {
  const modal = ensureCodexImageModal();
  const image = modal.querySelector(".codex-image-modal-img");
  const sources = codexImageModalState.sources;

  if (!image || !sources.length) return;

  codexImageModalState.index = ((index % sources.length) + sources.length) % sources.length;
  image.src = getCodexImageModalSrcFromSource(sources[codexImageModalState.index]);
  resetCodexImageModalScale();
  updateCodexImageModalNav();
}

function updateCodexImageModalNav() {
  const modal = ensureCodexImageModal();
  const hasMultiple = codexImageModalState.sources.length > 1;

  modal.querySelectorAll(".codex-image-modal-nav").forEach(button => {
    button.hidden = !hasMultiple;
    button.disabled = !hasMultiple;
  });
}

function stepCodexImageModal(delta) {
  if (codexImageModalState.sources.length <= 1) return;
  setCodexImageModalImage(codexImageModalState.index + delta);
}

function normalizeCodexImageModalSources(sources, fallbackSrc) {
  const seen = new Set();
  const normalized = [];

  [...(sources || []), fallbackSrc]
    .map(getCodexImageModalSrcFromSource)
    .filter(Boolean)
    .forEach(src => {
      if (seen.has(src)) return;
      seen.add(src);
      normalized.push({ src });
    });

  return normalized;
}

function getCodexImageSourceFromTrigger(trigger) {
  if (!trigger || trigger.classList.contains("codex-image-missing")) return "";
  return trigger.dataset.codexImageHref || trigger.dataset.codexImageSource || "";
}

function getCodexImageModalSourcesForTrigger(trigger) {
  const src = getCodexImageSourceFromTrigger(trigger);
  if (!src) return { sources: [], index: 0 };

  const mapGrid = trigger.closest?.(".codex-map-tile-grid");
  if (!mapGrid) {
    return { sources: [{ src }], index: 0 };
  }

  const triggers = Array.from(mapGrid.querySelectorAll("[data-codex-image-source]"))
    .filter(node => !node.classList.contains("codex-image-missing"));

  const sources = normalizeCodexImageModalSources(
    triggers.map(node => getCodexImageSourceFromTrigger(node)),
    src
  );

  const index = Math.max(0, sources.findIndex(source => source.src === src));

  return {
    sources: sources.length ? sources : [{ src }],
    index
  };
}

function openCodexImageModal(srcOrOptions) {
  const options = typeof srcOrOptions === "object" && srcOrOptions !== null
    ? srcOrOptions
    : { sources: [{ src: srcOrOptions }], index: 0 };

  const sources = normalizeCodexImageModalSources(options.sources, options.src);
  if (!sources.length) return;

  const modal = ensureCodexImageModal();
  const closeButton = modal.querySelector(".codex-image-modal-close");

  codexImageModalLastFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;

  codexImageModalState.sources = sources;
  codexImageModalState.index = Number.isInteger(options.index) ? options.index : 0;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  setCodexImageModalImage(codexImageModalState.index);

  window.setTimeout(() => closeButton?.focus(), 0);
}

function closeCodexImageModal() {
  const modal = document.getElementById("codex-image-modal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const image = modal.querySelector(".codex-image-modal-img");
  if (image) {
    image.removeAttribute("src");
    image.style.transform = "";
    image.classList.remove("zoomed", "panning");
  }

  codexImageModalState.sources = [];
  codexImageModalState.index = 0;
  codexImageModalState.scale = 1;
  codexImageModalState.panX = 0;
  codexImageModalState.panY = 0;
  codexImageModalState.isPanning = false;
  updateCodexImageModalNav();

  if (codexImageModalLastFocus?.focus) {
    codexImageModalLastFocus.focus();
  }

  codexImageModalLastFocus = null;
}

function getCodexImageModalTriggerFromTarget(target) {
  const trigger = target?.closest?.("[data-codex-image-source]");
  if (!trigger || trigger.classList.contains("codex-image-missing")) return null;
  return trigger;
}

function bindCodexImageModalPanEvents(modal) {
  const image = modal.querySelector(".codex-image-modal-img");
  if (!image || image.dataset.codexPanBound === "true") return;

  image.dataset.codexPanBound = "true";

  image.addEventListener("pointerdown", event => {
    if (codexImageModalState.scale <= 1.01) return;

    event.preventDefault();
    image.setPointerCapture?.(event.pointerId);

    codexImageModalState.isPanning = true;
    codexImageModalState.panStartX = event.clientX;
    codexImageModalState.panStartY = event.clientY;
    codexImageModalState.panOriginX = codexImageModalState.panX;
    codexImageModalState.panOriginY = codexImageModalState.panY;

    applyCodexImageModalTransform();
  });

  image.addEventListener("pointermove", event => {
    if (!codexImageModalState.isPanning) return;

    event.preventDefault();
    codexImageModalState.panX = codexImageModalState.panOriginX + event.clientX - codexImageModalState.panStartX;
    codexImageModalState.panY = codexImageModalState.panOriginY + event.clientY - codexImageModalState.panStartY;
    applyCodexImageModalTransform();
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach(eventName => {
    image.addEventListener(eventName, () => {
      if (!codexImageModalState.isPanning) return;
      codexImageModalState.isPanning = false;
      applyCodexImageModalTransform();
    });
  });
}

function bindCodexImageModalEvents() {
  document.addEventListener("click", event => {
    const trigger = getCodexImageModalTriggerFromTarget(event.target);
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    openCodexImageModal(getCodexImageModalSourcesForTrigger(trigger));
  }, true);

  document.addEventListener("keydown", event => {
    const modal = document.getElementById("codex-image-modal");
    const isOpen = modal?.classList.contains("open");

    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        closeCodexImageModal();
      }
      return;
    }

    if (isOpen && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      stepCodexImageModal(event.key === "ArrowRight" ? 1 : -1);
      return;
    }

    if (isOpen && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      setCodexImageModalScale(codexImageModalState.scale + 0.15);
      return;
    }

    if (isOpen && event.key === "-") {
      event.preventDefault();
      setCodexImageModalScale(codexImageModalState.scale - 0.15);
      return;
    }

    if (isOpen && event.key === "0") {
      event.preventDefault();
      resetCodexImageModalScale();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;

    const trigger = getCodexImageModalTriggerFromTarget(event.target);
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    openCodexImageModal(getCodexImageModalSourcesForTrigger(trigger));
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureCodexImageModal();
  bindCodexImageModalEvents();
});

window.addEventListener("resize", () => {
  applyCodexImageModalTransform();
});

window.openCodexImageModal = openCodexImageModal;
window.closeCodexImageModal = closeCodexImageModal;
window.stepCodexImageModal = stepCodexImageModal;
window.setCodexImageModalScale = setCodexImageModalScale;
