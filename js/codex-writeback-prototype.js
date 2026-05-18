/* =========================================================
   CODEX WRITE-BACK PROTOTYPE

   Dev-only frontend adapter for the Apps Script write-back
   backend. This does not replace the published-CSV loader.
   ========================================================= */

const KADESH_WRITEBACK_PROTOTYPE = {
  enabled: true,
  endpoint: "https://script.google.com/macros/s/AKfycby2Izhf6iJYCaLPPMQKovWo6-KCSvXkBufM-RdYza3OY83uWrWw86eTFt29eLUEAoLbIQ/exec",
  secretStorageKey: "kadeshWritebackSecret"
};

function isKadeshWritebackEnabled() {
  return Boolean(KADESH_WRITEBACK_PROTOTYPE.enabled && KADESH_WRITEBACK_PROTOTYPE.endpoint);
}

function getKadeshWritebackSecret() {
  let secret = window.sessionStorage.getItem(KADESH_WRITEBACK_PROTOTYPE.secretStorageKey) || "";

  if (!secret) {
    secret = window.prompt("Enter Kadesh write-back secret for this browser session:") || "";
    secret = secret.trim();

    if (secret) {
      window.sessionStorage.setItem(KADESH_WRITEBACK_PROTOTYPE.secretStorageKey, secret);
    }
  }

  return secret;
}

function clearKadeshWritebackSecret() {
  window.sessionStorage.removeItem(KADESH_WRITEBACK_PROTOTYPE.secretStorageKey);
}

async function postKadeshWriteback(payload) {
  if (!isKadeshWritebackEnabled()) {
    throw new Error("Kadesh write-back prototype is not enabled.");
  }

  const secret = getKadeshWritebackSecret();
  if (!secret) {
    throw new Error("Write-back secret is required.");
  }

  const response = await fetch(KADESH_WRITEBACK_PROTOTYPE.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      ...payload,
      secret
    })
  });

  const text = await response.text();
  let result = null;

  try {
    result = JSON.parse(text);
  } catch (error) {
    throw new Error(`Write-back returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!result.ok) {
    throw new Error(result.error?.message || "Write-back request failed.");
  }

  return result;
}

function getKadeshWritebackPoiDefaults() {
  const firstHex = db?.raw?.hexes?.[0];

  return {
    Hex_ID_Ref: firstHex?.Hex_ID || "",
    POI_Type: "",
    NotorietyTier: "",
    Population: "",
    POI_Group_ID: ""
  };
}

function injectKadeshPoiWritebackButton() {
  if (!isKadeshWritebackEnabled()) return;

  const shell = document.querySelector("#codex-content .codex-list-page-shell");
  if (!shell || document.getElementById("kadesh-create-poi-prototype-button")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "kadesh-writeback-toolbar";

  toolbar.innerHTML = `
    <button
      id="kadesh-create-poi-prototype-button"
      class="kadesh-writeback-button"
      type="button"
    >
      + Create POI
    </button>
    <button
      id="kadesh-clear-writeback-secret-button"
      class="kadesh-writeback-secondary-button"
      type="button"
      title="Forget the stored write-back secret for this browser session."
    >
      Clear Secret
    </button>
  `;

  shell.prepend(toolbar);

  document
    .getElementById("kadesh-create-poi-prototype-button")
    ?.addEventListener("click", openKadeshCreatePoiModal);

  document
    .getElementById("kadesh-clear-writeback-secret-button")
    ?.addEventListener("click", function () {
      clearKadeshWritebackSecret();
      window.alert("Kadesh write-back secret cleared for this browser session.");
    });
}

function openKadeshCreatePoiModal() {
  closeKadeshWritebackModal();

  const defaults = getKadeshWritebackPoiDefaults();
  const modal = document.createElement("div");
  modal.id = "kadesh-writeback-modal";
  modal.className = "kadesh-writeback-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Create POI");

  modal.innerHTML = `
    <div class="kadesh-writeback-card">
      <div class="kadesh-writeback-card-header">
        <div>
          <p class="kadesh-writeback-kicker">Prototype Write-Back</p>
          <h3>Create POI</h3>
        </div>
        <button
          class="kadesh-writeback-close"
          type="button"
          aria-label="Close create POI form"
        >✕</button>
      </div>

      <form id="kadesh-create-poi-form" class="kadesh-writeback-form">
        <label>
          <span>Name *</span>
          <input name="Name" type="text" required placeholder="New location name">
        </label>

        <label>
          <span>Hex ID Ref</span>
          <input name="Hex_ID_Ref" type="text" value="${escapeHtml(defaults.Hex_ID_Ref)}" placeholder="300:300">
        </label>

        <label>
          <span>POI Group ID</span>
          <input name="POI_Group_ID" type="text" value="${escapeHtml(defaults.POI_Group_ID)}" placeholder="ERIKOL or blank">
        </label>

        <div class="kadesh-writeback-grid-two">
          <label>
            <span>POI Type</span>
            <input name="POI_Type" type="text" value="${escapeHtml(defaults.POI_Type)}" placeholder="Village, Ruin, Shrine...">
          </label>

          <label>
            <span>Notoriety Tier</span>
            <input name="Notoriety Tier" type="text" value="${escapeHtml(defaults.NotorietyTier)}" placeholder="Local, Regional...">
          </label>
        </div>

        <label>
          <span>Population</span>
          <input name="Population" type="text" value="${escapeHtml(defaults.Population)}" placeholder="0, Unknown, 1,200...">
        </label>

        <label>
          <span>Lore</span>
          <textarea name="Lore" rows="7" placeholder="Description/lore for this POI"></textarea>
        </label>

        <div class="kadesh-writeback-actions">
          <button class="kadesh-writeback-secondary-button" type="button" data-kadesh-writeback-cancel>Cancel</button>
          <button class="kadesh-writeback-button" type="submit">Create POI</button>
        </div>

        <p class="kadesh-writeback-note">
          Writes directly to Google Sheets. The current Codex data still comes from the published CSV, so the new POI may require a refresh after Google republishes the sheet output.
        </p>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal
    .querySelector(".kadesh-writeback-close")
    ?.addEventListener("click", closeKadeshWritebackModal);

  modal
    .querySelector("[data-kadesh-writeback-cancel]")
    ?.addEventListener("click", closeKadeshWritebackModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeKadeshWritebackModal();
    }
  });

  modal
    .querySelector("#kadesh-create-poi-form")
    ?.addEventListener("submit", handleKadeshCreatePoiSubmit);

  modal.querySelector("input[name='Name']")?.focus();
}

function closeKadeshWritebackModal() {
  document.getElementById("kadesh-writeback-modal")?.remove();
}

function getFormValue_(form, fieldName) {
  return String(new FormData(form).get(fieldName) || "").trim();
}

async function handleKadeshCreatePoiSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector("button[type='submit']");

  const fields = {
    POI_Group_ID: getFormValue_(form, "POI_Group_ID"),
    Name: getFormValue_(form, "Name"),
    Hex_ID_Ref: getFormValue_(form, "Hex_ID_Ref"),
    POI_Type: getFormValue_(form, "POI_Type"),
    "Notoriety Tier": getFormValue_(form, "Notoriety Tier"),
    Population: getFormValue_(form, "Population"),
    Lore: getFormValue_(form, "Lore"),
    Image: ""
  };

  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  try {
    const result = await postKadeshWriteback({
      action: "createRecord",
      entityType: "poi",
      fields
    });

    closeKadeshWritebackModal();

    window.alert(
      `Created ${result.id}.\n\nRefresh the Codex after the published Sheet CSV catches up.`
    );
  } catch (error) {
    window.alert(`Create POI failed:\n\n${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create POI";
  }
}

function getCurrentKadeshPoiRecord() {
  const current = typeof getCurrentCodexPage === "function"
    ? getCurrentCodexPage()
    : null;

  if (!current || current.type !== "poi" || !current.id) return null;
  return db?.poisById?.[current.id] || null;
}

function injectKadeshPoiDetailWritebackButton() {
  if (!isKadeshWritebackEnabled()) return;

  const poi = getCurrentKadeshPoiRecord();
  if (!poi) return;

  const overviewPanel = document.querySelector("#codex-content.codex-poi-detail-page .codex-detail-overview-panel");
  if (!overviewPanel || document.getElementById("kadesh-edit-poi-prototype-button")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "kadesh-writeback-toolbar kadesh-writeback-detail-toolbar";
  toolbar.innerHTML = `
    <button
      id="kadesh-edit-poi-prototype-button"
      class="kadesh-writeback-button"
      type="button"
    >
      Edit POI
    </button>
  `;

  overviewPanel.prepend(toolbar);

  document
    .getElementById("kadesh-edit-poi-prototype-button")
    ?.addEventListener("click", function () {
      openKadeshEditPoiModal(poi);
    });
}

function openKadeshEditPoiModal(poi) {
  if (!poi?.POI_ID) {
    window.alert("No POI record found to edit.");
    return;
  }

  closeKadeshWritebackModal();

  const modal = document.createElement("div");
  modal.id = "kadesh-writeback-modal";
  modal.className = "kadesh-writeback-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Edit POI");

  modal.innerHTML = `
    <div class="kadesh-writeback-card">
      <div class="kadesh-writeback-card-header">
        <div>
          <p class="kadesh-writeback-kicker">Prototype Write-Back</p>
          <h3>Edit POI</h3>
          <p class="kadesh-writeback-subtitle">${escapeHtml(poi.POI_ID)}</p>
        </div>
        <button
          class="kadesh-writeback-close"
          type="button"
          aria-label="Close edit POI form"
        >✕</button>
      </div>

      <form id="kadesh-edit-poi-form" class="kadesh-writeback-form" data-poi-id="${escapeHtml(poi.POI_ID)}">
        <label>
          <span>Name *</span>
          <input name="Name" type="text" required value="${escapeHtml(poi.Name || "")}">
        </label>

        <label>
          <span>Hex ID Ref</span>
          <input name="Hex_ID_Ref" type="text" value="${escapeHtml(poi.Hex_ID_Ref || "")}" placeholder="300:300">
        </label>

        <label>
          <span>POI Group ID</span>
          <input name="POI_Group_ID" type="text" value="${escapeHtml(poi.POI_Group_ID || "")}" placeholder="ERIKOL or blank">
        </label>

        <div class="kadesh-writeback-grid-two">
          <label>
            <span>POI Type</span>
            <input name="POI_Type" type="text" value="${escapeHtml(poi.POI_Type || "")}">
          </label>

          <label>
            <span>Notoriety Tier</span>
            <input name="Notoriety Tier" type="text" value="${escapeHtml(poi["Notoriety Tier"] || "")}">
          </label>
        </div>

        <label>
          <span>Population</span>
          <input name="Population" type="text" value="${escapeHtml(poi.Population || "")}">
        </label>

        <label>
          <span>Image Drive ID</span>
          <input name="Image" type="text" value="${escapeHtml(poi.Image || "")}" placeholder="Drive file ID or blank">
        </label>

        <label>
          <span>Lore</span>
          <textarea name="Lore" rows="9">${escapeHtml(poi.Lore || "")}</textarea>
        </label>

        <div class="kadesh-writeback-actions">
          <button class="kadesh-writeback-secondary-button" type="button" data-kadesh-writeback-cancel>Cancel</button>
          <button class="kadesh-writeback-button" type="submit">Save POI</button>
        </div>

        <p class="kadesh-writeback-note">
          Saves directly to Google Sheets. Current on-screen data still comes from the published CSV and may require refresh after Google republishes it.
        </p>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal
    .querySelector(".kadesh-writeback-close")
    ?.addEventListener("click", closeKadeshWritebackModal);

  modal
    .querySelector("[data-kadesh-writeback-cancel]")
    ?.addEventListener("click", closeKadeshWritebackModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeKadeshWritebackModal();
    }
  });

  modal
    .querySelector("#kadesh-edit-poi-form")
    ?.addEventListener("submit", handleKadeshEditPoiSubmit);

  modal.querySelector("input[name='Name']")?.focus();
}

async function handleKadeshEditPoiSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector("button[type='submit']");
  const poiId = form.dataset.poiId;

  const fields = {
    POI_Group_ID: getFormValue_(form, "POI_Group_ID"),
    Name: getFormValue_(form, "Name"),
    Hex_ID_Ref: getFormValue_(form, "Hex_ID_Ref"),
    POI_Type: getFormValue_(form, "POI_Type"),
    "Notoriety Tier": getFormValue_(form, "Notoriety Tier"),
    Population: getFormValue_(form, "Population"),
    Lore: getFormValue_(form, "Lore"),
    Image: getFormValue_(form, "Image")
  };

  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  try {
    const result = await postKadeshWriteback({
      action: "updateRecord",
      entityType: "poi",
      id: poiId,
      fields
    });

    closeKadeshWritebackModal();

    window.alert(
      `Saved ${result.id}.\n\nRefresh the Codex after the published Sheet CSV catches up.`
    );
  } catch (error) {
    window.alert(`Edit POI failed:\n\n${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save POI";
  }
}

function runKadeshWritebackAutoInjectors() {
  injectKadeshPoiDetailWritebackButton();
}

function startKadeshWritebackObserver() {
  if (!isKadeshWritebackEnabled()) return;

  const target = document.getElementById("codex-content");
  if (!target || target.dataset.kadeshWritebackObserved === "true") return;

  target.dataset.kadeshWritebackObserved = "true";

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(runKadeshWritebackAutoInjectors);
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  runKadeshWritebackAutoInjectors();
}

(function patchPoiIndexForWritebackPrototype() {
  if (!isKadeshWritebackEnabled()) return;

  const originalRenderCodexPoisIndex = window.renderCodexPoisIndex;
  if (typeof originalRenderCodexPoisIndex !== "function") return;

  window.renderCodexPoisIndex = function patchedRenderCodexPoisIndex() {
    originalRenderCodexPoisIndex.apply(this, arguments);
    injectKadeshPoiWritebackButton();
  };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startKadeshWritebackObserver);
} else {
  startKadeshWritebackObserver();
}

window.KADESH_WRITEBACK_PROTOTYPE = KADESH_WRITEBACK_PROTOTYPE;
window.postKadeshWriteback = postKadeshWriteback;
window.openKadeshCreatePoiModal = openKadeshCreatePoiModal;
window.openKadeshEditPoiModal = openKadeshEditPoiModal;
window.injectKadeshPoiWritebackButton = injectKadeshPoiWritebackButton;
window.injectKadeshPoiDetailWritebackButton = injectKadeshPoiDetailWritebackButton;
window.clearKadeshWritebackSecret = clearKadeshWritebackSecret;
