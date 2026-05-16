/* =========================================================
   MOBILE LIST FILTER UTILITY
   =========================================================

   Reuses the existing list control DOM for mobile instead of cloning controls
   and creating duplicate IDs. Desktop rail remains the source location.
*/

let originalRenderCodexListPage = renderCodexListPage;

function registerCodexMobileListFilterUtility() {
  if (typeof setCodexMobileUtility !== "function") return;

  setCodexMobileUtility({
    type: "filter-sort",
    label: "Filter & Sort",
    panelTitle: "Filter & Sort",
    renderPanel: renderCodexMobileListUtilityPanel,
    bindPanel: bindCodexMobileListUtilityPanel,
    beforeClose: restoreCodexMobileListControls
  });
}

function renderCodexMobileListUtilityPanel() {
  return `<div id="codex-mobile-list-controls-mount" class="codex-mobile-list-controls-mount"></div>`;
}

function bindCodexMobileListUtilityPanel(panel) {
  const mount = panel.querySelector("#codex-mobile-list-controls-mount");
  const controls = document.getElementById("codex-list-controls-shell");

  if (!mount || !controls) return;

  controls.dataset.mobileMounted = "true";
  mount.appendChild(controls);
}

function restoreCodexMobileListControls() {
  const controls = document.getElementById("codex-list-controls-shell");
  const home = document.getElementById("codex-list-controls-home");

  if (!controls || !home) return;

  controls.dataset.mobileMounted = "false";
  home.appendChild(controls);
}

function renderCodexListPage(config) {
  setCodexTitle(config.title);

  const controlsHtml = renderCodexListControls({
    filters: config.filters.map(filter => ({
      ...filter,
      fieldOptions: config.fieldOptions,
      options: config.getFilterOptions(filter.fieldValue)
    })),
    sortId: config.sortId,
    selectedSort: config.selectedSort,
    sortOptions: config.sortOptions,
    directionId: config.directionId,
    direction: "asc"
  });

  setCodexContent(`
    <div class="codex-list-page-shell">
      <div class="codex-list-control-split-view">
        <aside class="codex-list-control-rail">
          <div id="codex-list-controls-home">
            <div class="codex-list-controls-shell" id="codex-list-controls-shell" data-mobile-mounted="false">
              <div class="codex-mobile-controls-panel">
                <div class="codex-mobile-controls-heading">
                  <h3>Filter & Sort</h3>
                </div>

                ${controlsHtml}
              </div>
            </div>
          </div>
        </aside>

        <div class="codex-list-scroll-shell codex-scroll-fade">
          <div id="${escapeHtml(config.listId)}"></div>
        </div>
      </div>
    </div>
  `, config.breadcrumbs);

  document.getElementById("codex-content").classList.add("codex-list-page");

  config.bindControls();
  config.renderList();
  registerCodexMobileListFilterUtility();
}

window.registerCodexMobileListFilterUtility = registerCodexMobileListFilterUtility;
