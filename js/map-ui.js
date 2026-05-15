function selectHex(hex) {
  if (selectedHex && selectedHex !== hex) {
    selectedHex.setStyle(defaultStyle);
  }

  selectedHex = hex;
  hex.setStyle(selectedStyle);
}

function clearSelectedHex() {
  if (selectedHex) {
    selectedHex.setStyle(defaultStyle);
    selectedHex = null;
  }
}

function closePanel(options = {}) {
  const panel = document.getElementById("app-panel");
  const wasOpen = panel.classList.contains("open");

  panel.classList.remove("open");

  if (options.centerSelected && selectedHexId) {
    centerHexInView(selectedHexId);
  }

  if (options.clearSelection) {
    clearSelectedHex();
    map.closePopup();
  }

  if (
    wasOpen &&
    options.syncHistory !== false &&
    typeof releaseAppBrowserBackTrap === "function"
  ) {
    releaseAppBrowserBackTrap();
  }
}

function openPanel() {
  const panel = document.getElementById("app-panel");

  if (typeof ensureAppBrowserBackTrap === "function") {
    ensureAppBrowserBackTrap();
  }

  requestAnimationFrame(() => {
    panel.classList.add("open");
  });
}

function renderHexPreview(hexId) {
  const hex = db?.hexesById?.[hexId];
  const region = hex?.Region_ID_Ref ? db?.regionsById?.[hex.Region_ID_Ref] : null;
  const counts = getHexCounts(hexId);

  openPanel();

  document.getElementById("panel-title").textContent = `HEX ${hexId}`;
  document.getElementById("panel-subtitle").textContent = "Field Notes";

  const countLine = buildCountLine(counts.poiCount, counts.npcCount);
  const journalPreview = getLimitedLines(hex?.DM_Journal, 4);

  document.getElementById("panel-content").innerHTML = `
    <div class="hex-preview-ledger">
      <div class="hex-preview-row">
        <span class="hex-preview-label">Terrain</span>
        <span class="hex-preview-value">${escapeHtml(hex?.Terrain || "Unknown")}</span>
      </div>

      <div class="hex-preview-row">
        <span class="hex-preview-label">Region</span>
        <span class="hex-preview-value">${escapeHtml(region?.Region_Name || hex?.Region_ID_Ref || "Unknown")}</span>
      </div>

      ${countLine ? `
        <div class="hex-preview-row">
          <span class="hex-preview-label">Records</span>
          <span class="hex-preview-value">${escapeHtml(countLine)}</span>
        </div>
      ` : ""}
    </div>

    <section class="hex-preview-notes">
      <h3>Field Notes</h3>
      <p class="panel-journal-preview">
        ${renderMultilineText(journalPreview)}
      </p>
    </section>

    <button class="hex-preview-details-button" type="button" onclick="openCodexPage('hex', '${escapeJsString(hexId)}')">
      Open Details
    </button>
  `;
}

function openPanelForHex(hexId) {
  renderHexPreview(hexId);
}

function panHexIntoInspectorView(hexId) {
  const [xxx, yyy] = hexId.split(":").map(Number);
  const center = getHexCenter(xxx, yyy);
  const targetLatLng = L.latLng(center.y, center.x);

  const targetPoint = map.latLngToContainerPoint(targetLatLng);
  const desiredPoint = L.point(
    map.getSize().x * 0.33,
    map.getSize().y * 0.5
  );

  const offset = targetPoint.subtract(desiredPoint);

  map.panBy(offset, {
    animate: true,
    duration: 0.35
  });
}

function resetMapToAtlasView() {
  map.closePopup();
  clearSelectedHex();
  selectedHexId = null;
  map.fitBounds(bounds, { animate: true, duration: 0.5 });
}

function centerHexInView(hexId) {
  const [xxx, yyy] = hexId.split(":").map(Number);
  const center = getHexCenter(xxx, yyy);

  map.panTo(
    L.latLng(center.y, center.x),
    {
      animate: true,
      duration: 0.35
    }
  );
}

function toggleRetroCodexMode() {
  retroCodexMode = !retroCodexMode;

  const codexButton = document.getElementById("codex-button");

  codexButton.classList.toggle("codex-retro-mode", retroCodexMode);

  if (retroCodexMode) {
    codexButton.style.backgroundImage =
      "url('assets/Win95SwordShield_Upscaled.png')";
  
    codexButton.style.backgroundSize = "75%";
  }
  else {
    codexButton.style.backgroundImage =
      "url('assets/Codex_Book_Button.png')";
  
    codexButton.style.backgroundSize = "";
  }
}

function closeMobileHexPopup() {
  map.closePopup();
  clearSelectedHex();
}

function buildMobilePopupHtml(hexId) {
  const data = db?.hexesById?.[hexId];
  const counts = getHexCounts(hexId);

  const info = [];

  if (counts.poiCount > 0) {
    info.push(`${counts.poiCount} POI${counts.poiCount !== 1 ? "s" : ""}`);
  }

  if (counts.npcCount > 0) {
    info.push(`${counts.npcCount} NPC${counts.npcCount !== 1 ? "s" : ""}`);
  }

  return `
    <div class="mobile-hex-popup-card">
      <div class="mobile-hex-popup-title">Hex ${escapeHtml(hexId)}</div>
      <div class="mobile-hex-popup-terrain">${escapeHtml(data?.Terrain || "Unknown")}</div>
      ${
        info.length
          ? `<div class="mobile-hex-popup-meta">${escapeHtml(info.join(" • "))}</div>`
          : ""
      }

      <div class="popup-action-row">
        <button
          class="popup-open-details"
          type="button"
          onclick="openCodexPage('hex', '${escapeJsString(hexId)}')"
        >
          Details
        </button>

        <button
          class="popup-close-details"
          type="button"
          aria-label="Close hex preview"
          onclick="closeMobileHexPopup()"
        >
          ×
        </button>
      </div>
    </div>
  `;
}

window.openPanelForHex = openPanelForHex;
window.closeMobileHexPopup = closeMobileHexPopup;
