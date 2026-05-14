/* =========================================================
   APP EVENT WIRING
   ========================================================= */

const HEX_GRID_MIN = 300;
const HEX_GRID_MAX = 350;

let retroCodexSequence = "";
let codexLongPressTimer = null;
let suppressNextCodexClick = false;
let appBrowserHistoryDepth = 0;
let appBrowserHistoryReleaseCount = 0;

function initializeHexGrid() {
  for (let xxx = HEX_GRID_MIN; xxx < HEX_GRID_MAX; xxx++) {
    for (let yyy = HEX_GRID_MIN; yyy < HEX_GRID_MAX; yyy++) {
      createHexOverlay(xxx, yyy);
    }
  }
}

function createHexOverlay(xxx, yyy) {
  const { x, y } = getHexCenter(xxx, yyy);
  const hexId = `${xxx}:${yyy}`;

  const hex = L.polygon(
    makeHex(x, y, hexWidth, hexHeight),
    defaultStyle
  ).addTo(map);

  bindHexEvents(hex, hexId);
}

function bindHexEvents(hex, hexId) {
  hex.on("mouseover", function () {
    if (!isTouchDevice && this !== selectedHex) {
      this.setStyle(hoverStyle);
    }
  });

  hex.on("mouseout", function () {
    if (!isTouchDevice && this !== selectedHex) {
      this.setStyle(defaultStyle);
    }
  });

  hex.on("click", function (event) {
    L.DomEvent.stopPropagation(event);

    document
      .getElementById("codex-button")
      .classList.remove("codex-label-visible");

    selectHex(this);
    selectedHexId = hexId;

    if (isTouchDevice) {
      this.bindPopup(buildMobilePopupHtml(hexId)).openPopup();
      return;
    }

    renderHexPreview(hexId);

    const panelWidth =
      document.getElementById("app-panel").offsetWidth;

    if (panelWidth / window.innerWidth > 0.32) {
      panHexIntoInspectorView(hexId);
    }
  });
}

function bindMapEvents() {
  map.on("click", function () {
    closePanel();

    document
      .getElementById("codex-button")
      .classList.remove("codex-label-visible");

    clearSelectedHex();
  });

  map.on("popupclose", function () {
    clearSelectedHex();
  });

  document
    .getElementById("map-reset-button")
    .addEventListener("click", function (event) {
      event.stopPropagation();

      closePanel({ clearSelection: true });
      closeCodex();
      resetMapToAtlasView();
    });
}

function bindPanelEvents() {
  document
    .getElementById("mobile-panel-close")
    .addEventListener("click", function () {
      closePanel({
        clearSelection: true,
        centerSelected: true
      });
    });
}

function bindCodexEvents() {
  document
    .getElementById("codex-button")
    .addEventListener("click", handleCodexButtonClick);

  document
    .getElementById("codex-close")
    .addEventListener("click", function () {
      closeCodex();
    });

  document
    .getElementById("codex-search-button")
    .addEventListener("click", openCodexGlobalSearchModal);

  document
    .getElementById("codex-back")
    .addEventListener("click", function () {
      if (isMobileBrowserBackEnabled() && appBrowserHistoryDepth > 0) {
        history.back();
        return;
      }

      if (codexHistory.length <= 1) {
        closeCodex();
        return;
      }

      goBackCodex();
    });

  document
    .getElementById("codex-overlay")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeCodex();
      }
    });
}

function openCodexGlobalSearchModal() {
  const modal = document.getElementById("codex-global-search-modal");
  if (!modal) return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  modal.innerHTML = `
    <div class="codex-global-search-panel" role="dialog" aria-modal="true" aria-label="Search the Codex">
      <input
        id="codex-global-search-input"
        type="search"
        placeholder="Consult the Codex..."
        autocomplete="off"
        value=""
      >
    </div>
  `;

  const input = document.getElementById("codex-global-search-input");
  input?.focus();

  input?.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    commitCodexGlobalSearch(input.value);
  });
}

function commitCodexGlobalSearch(query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return;

  closeCodexGlobalSearchModal();
  openCodexSearchResults(cleanQuery);
}

function closeCodexGlobalSearchModal() {
  const modal = document.getElementById("codex-global-search-modal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = "";
}

function handleCodexGlobalSearchBackdropClick(event) {
  if (event.target?.id !== "codex-global-search-modal") return;
  closeCodexGlobalSearchModal();
}

function handleCodexButtonClick(event) {
  event.stopPropagation();

  if (suppressNextCodexClick) {
    suppressNextCodexClick = false;
    event.preventDefault();
    return;
  }

  const codexButton = document.getElementById("codex-button");

  map.closePopup();

  if (isTouchDevice && !codexButton.classList.contains("codex-label-visible")) {
    codexButton.classList.add("codex-label-visible");
    return;
  }

  codexButton.classList.remove("codex-label-visible");
  resetMapToAtlasView();
  resetCodexToIndex();
}

function bindKeyboardEasterEggEvents() {
  window.addEventListener("keydown", event => {
    retroCodexSequence += event.key.toLowerCase();

    if (retroCodexSequence.length > 2) {
      retroCodexSequence = retroCodexSequence.slice(-2);
    }

    if (retroCodexSequence === "95") {
      toggleRetroCodexMode();
      retroCodexSequence = "";
    }
  });
}

function isMobileCodexLongPressEnabled() {
  return window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
}

function isMobileBrowserBackEnabled() {
  return window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
}

function isCodexOpen() {
  return document
    .getElementById("codex-overlay")
    ?.classList.contains("open");
}

function isAppPanelOpen() {
  return document
    .getElementById("app-panel")
    ?.classList.contains("open");
}

function ensureAppBrowserBackTrap() {
  if (!isMobileBrowserBackEnabled()) return;

  history.pushState({ kadeshAppState: true }, "", window.location.href);
  appBrowserHistoryDepth += 1;
}

function releaseAppBrowserBackTrap() {
  if (!appBrowserHistoryDepth) return;

  const releaseDepth = appBrowserHistoryDepth;
  appBrowserHistoryDepth = 0;
  appBrowserHistoryReleaseCount += releaseDepth;

  history.go(-releaseDepth);
}

function handleAppBrowserBack() {
  if (appBrowserHistoryReleaseCount > 0) {
    appBrowserHistoryReleaseCount -= 1;
    return;
  }

  if (!isMobileBrowserBackEnabled()) return;

  if (isCodexOpen()) {
    if (appBrowserHistoryDepth > 0) {
      appBrowserHistoryDepth -= 1;
    }

    if (codexHistory.length <= 1) {
      closeCodex({ syncHistory: false });
      appBrowserHistoryDepth = 0;
      return;
    }

    goBackCodex();
    return;
  }

  if (isAppPanelOpen()) {
    if (appBrowserHistoryDepth > 0) {
      appBrowserHistoryDepth -= 1;
    }

    closePanel({
      clearSelection: true,
      centerSelected: true,
      syncHistory: false
    });

    appBrowserHistoryDepth = 0;
  }
}

function bindBrowserBackEvents() {
  window.addEventListener("popstate", handleAppBrowserBack);
}

function clearCodexLongPressTimer() {
  window.clearTimeout(codexLongPressTimer);
  codexLongPressTimer = null;
}

function bindCodexLongPressEvents() {
  const codexButton = document.getElementById("codex-button");

  codexButton.addEventListener("pointerdown", () => {
    if (!isMobileCodexLongPressEnabled()) return;

    codexLongPressTimer = window.setTimeout(() => {
      suppressNextCodexClick = true;
      toggleRetroCodexMode();
    }, 650);
  });

  codexButton.addEventListener("pointerup", clearCodexLongPressTimer);
  codexButton.addEventListener("pointercancel", clearCodexLongPressTimer);
  codexButton.addEventListener("pointerleave", clearCodexLongPressTimer);

  codexButton.addEventListener("contextmenu", event => {
    if (!isMobileCodexLongPressEnabled()) return;

    event.preventDefault();
  });
}

function initializeAppEvents() {
  initializeHexGrid();
  bindMapEvents();
  bindPanelEvents();
  bindCodexEvents();
  bindKeyboardEasterEggEvents();
  bindBrowserBackEvents();
  bindCodexLongPressEvents();
}

window.ensureAppBrowserBackTrap = ensureAppBrowserBackTrap;
window.releaseAppBrowserBackTrap = releaseAppBrowserBackTrap;
window.closeCodexGlobalSearchModal = closeCodexGlobalSearchModal;
window.handleCodexGlobalSearchBackdropClick = handleCodexGlobalSearchBackdropClick;

initializeAppEvents();
