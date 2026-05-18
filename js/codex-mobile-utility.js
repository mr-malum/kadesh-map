/* =========================================================
   CODEX MOBILE UTILITY CONTROL MANAGER
   ========================================================= */

let codexMobileUtilityState = {
  type: "none",
  label: "",
  panelTitle: "",
  renderPanel: null,
  bindPanel: null,
  beforeClose: null
};

function isMobileCodexUtilityLayout() {
  return window.matchMedia("(max-width: 1099px), (max-height: 699px)").matches;
}

function ensureCodexMobileUtilityPanel() {
  let panel = document.getElementById("codex-mobile-utility-panel");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "codex-mobile-utility-panel";
  panel.className = "codex-mobile-utility-panel";
  panel.setAttribute("aria-hidden", "true");

  panel.addEventListener("click", function (event) {
    if (event.target?.id === "codex-mobile-utility-panel") {
      closeCodexMobileUtilityPanel();
    }
  });

  const stage = document.getElementById("codex-book-stage") || document.getElementById("codex-modal");
  stage?.appendChild(panel);

  return panel;
}

function setCodexMobileUtility(config = {}) {
  codexMobileUtilityState = {
    type: config.type || "none",
    label: config.label || "",
    panelTitle: config.panelTitle || config.label || "",
    renderPanel: config.renderPanel || null,
    bindPanel: config.bindPanel || null,
    beforeClose: config.beforeClose || null
  };

  updateCodexMobileUtilityButton();
}

function clearCodexMobileUtility() {
  closeCodexMobileUtilityPanel();
  setCodexMobileUtility({ type: "none" });
}

function updateCodexMobileUtilityButton() {
  const button = document.getElementById("codex-mobile-page-control");
  if (!button) return;

  const isEnabled = Boolean(
    codexMobileUtilityState.type !== "none" &&
    codexMobileUtilityState.label &&
    typeof codexMobileUtilityState.renderPanel === "function"
  );

  button.hidden = !isEnabled;
  button.disabled = !isEnabled;
  button.textContent = isEnabled ? codexMobileUtilityState.label : "";
  button.setAttribute("aria-label", isEnabled ? codexMobileUtilityState.label : "Mobile page controls");
}

function openCodexMobileUtilityPanel() {
  if (!isMobileCodexUtilityLayout()) return;
  if (typeof codexMobileUtilityState.renderPanel !== "function") return;

  const panel = ensureCodexMobileUtilityPanel();
  if (!panel) return;

  panel.innerHTML = `
    <div class="codex-mobile-utility-sheet" role="dialog" aria-label="${escapeHtml(codexMobileUtilityState.panelTitle)}">
      <div class="codex-mobile-utility-heading">
        <h3>${escapeHtml(codexMobileUtilityState.panelTitle)}</h3>
      </div>
      <div class="codex-mobile-utility-body">
        ${codexMobileUtilityState.renderPanel()}
      </div>
      <button class="codex-mobile-utility-close" type="button">Close</button>
    </div>
  `;

  panel.querySelector(".codex-mobile-utility-close")
    ?.addEventListener("click", closeCodexMobileUtilityPanel);

  if (typeof codexMobileUtilityState.bindPanel === "function") {
    codexMobileUtilityState.bindPanel(panel);
  }

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}

function closeCodexMobileUtilityPanel() {
  const panel = document.getElementById("codex-mobile-utility-panel");
  if (!panel) return;

  if (panel.classList.contains("open") && typeof codexMobileUtilityState.beforeClose === "function") {
    codexMobileUtilityState.beforeClose(panel);
  }

  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = "";
}

function patchCodexContentUtilityReset() {
  if (typeof window.setCodexContent !== "function") return;
  if (window.setCodexContent.__mobileUtilityResetPatched) return;

  const originalSetCodexContent = window.setCodexContent;

  window.setCodexContent = function (...args) {
    clearCodexMobileUtility();
    return originalSetCodexContent.apply(this, args);
  };

  window.setCodexContent.__mobileUtilityResetPatched = true;
  setCodexContent = window.setCodexContent;
}

/* =========================================================
   MOBILE BUTTON STATE CLEANUP
   =========================================================

   Mobile browsers can leave tapped buttons in a focused/active-looking state
   until another element is tapped. Blur Codex/map UI controls after touch/click
   activation so visual state resets immediately.
*/

function shouldClearCodexMobileButtonState(target) {
  return Boolean(target?.closest?.(`
    .codex-control-cluster button,
    .codex-panel-nav button,
    #codex-mobile-page-control,
    #codex-search-button,
    #codex-back,
    #codex-close,
    #codex-mobile-debug-toggle,
    #codex-button,
    #map-reset-button,
    .codex-image-modal-close,
    .codex-image-modal-nav
  `));
}

function clearCodexMobileButtonState(target) {
  const control = target?.closest?.("button, [role='button']");
  if (!control || typeof control.blur !== "function") return;

  window.setTimeout(() => {
    control.blur();

    if (document.activeElement === control) {
      document.activeElement?.blur?.();
    }
  }, 0);
}

function bindCodexMobileButtonStateCleanup() {
  if (bindCodexMobileButtonStateCleanup.__bound) return;
  bindCodexMobileButtonStateCleanup.__bound = true;

  document.addEventListener("pointerup", event => {
    if (event.pointerType && event.pointerType !== "touch") return;
    if (!shouldClearCodexMobileButtonState(event.target)) return;
    clearCodexMobileButtonState(event.target);
  }, true);

  document.addEventListener("touchend", event => {
    if (!shouldClearCodexMobileButtonState(event.target)) return;
    clearCodexMobileButtonState(event.target);
  }, true);

  document.addEventListener("click", event => {
    if (!shouldClearCodexMobileButtonState(event.target)) return;
    clearCodexMobileButtonState(event.target);
  }, true);
}

/* =========================================================
   MOBILE TAP FEEDBACK
   =========================================================

   Touch browsers can make :active states too fleeting to notice on quick taps.
   Add a short-lived class at touch start so mobile taps visibly borrow the
   same styling language desktop users get from hover.
*/

const codexMobileTapFeedbackSelector = `
  .codex-row,
  .codex-link-button,
  .codex-section-button,
  .codex-region-tile,
  .codex-map-card[href],
  .codex-mobile-utility-close,
  .codex-mobile-utility-option,
  .codex-image-modal-close,
  .codex-image-modal-nav,
  .panel-nav button,
  .codex-breadcrumb-button
`;

function getCodexMobileTapFeedbackTarget(target) {
  return target?.closest?.(codexMobileTapFeedbackSelector) || null;
}

function clearCodexMobileTapFeedback(control) {
  if (!control) return;

  window.clearTimeout(control.__codexTapFeedbackTimeout);
  control.__codexTapFeedbackTimeout = window.setTimeout(() => {
    control.classList.remove("codex-tap-active");
  }, 90);
}

function bindCodexMobileTapFeedback() {
  if (bindCodexMobileTapFeedback.__bound) return;
  bindCodexMobileTapFeedback.__bound = true;

  document.addEventListener("pointerdown", event => {
    if (event.pointerType && event.pointerType !== "touch") return;

    const control = getCodexMobileTapFeedbackTarget(event.target);
    if (!control) return;

    control.classList.add("codex-tap-active");
  }, true);

  document.addEventListener("touchstart", event => {
    const control = getCodexMobileTapFeedbackTarget(event.target);
    if (!control) return;

    control.classList.add("codex-tap-active");
  }, { passive: true, capture: true });

  ["pointerup", "pointercancel", "touchend", "touchcancel"].forEach(eventName => {
    document.addEventListener(eventName, event => {
      const control = getCodexMobileTapFeedbackTarget(event.target);
      if (!control) return;

      clearCodexMobileTapFeedback(control);
    }, true);
  });
}

function initializeCodexMobileUtility() {
  ensureCodexMobileUtilityPanel();
  patchCodexContentUtilityReset();

  document
    .getElementById("codex-mobile-page-control")
    ?.addEventListener("click", openCodexMobileUtilityPanel);

  bindCodexMobileButtonStateCleanup();
  bindCodexMobileTapFeedback();
  updateCodexMobileUtilityButton();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bindCodexMobileButtonStateCleanup();
    bindCodexMobileTapFeedback();
  });
} else {
  bindCodexMobileButtonStateCleanup();
  bindCodexMobileTapFeedback();
}

window.setCodexMobileUtility = setCodexMobileUtility;
window.clearCodexMobileUtility = clearCodexMobileUtility;
window.openCodexMobileUtilityPanel = openCodexMobileUtilityPanel;
window.closeCodexMobileUtilityPanel = closeCodexMobileUtilityPanel;
window.initializeCodexMobileUtility = initializeCodexMobileUtility;
