/* =========================================================
   MOBILE SEARCH RESULTS CLEANUP
   =========================================================

   Mobile search results should behave like a rendered page, not like a
   persistent search form. Desktop live search remains owned by
   codex-search-page.js.
*/

function renderCodexSearchPage() {
  const isMobile = isMobileCodexSearchLayout();
  const hasQuery = Boolean(String(codexSearchQuery || "").trim());

  setCodexTitle(isMobile && hasQuery ? "Search Results" : "Search the Codex");

  renderCodexBreadcrumbs([
    { label: "Codex", clickable: true, onclick: "resetCodexToIndex()" },
    { label: "Search" }
  ]);

  const content = document.getElementById("codex-content");
  content.className = "codex-search-page";

  if (isMobile && hasQuery) {
    content.innerHTML = `
      <div class="codex-search-page-shell codex-mobile-search-page-shell">
        <div class="codex-mobile-search-query-summary">
          Search results for &ldquo;${escapeHtml(codexSearchQuery)}&rdquo;
        </div>

        <div id="codex-search-results" class="codex-search-results-shell"></div>
      </div>
    `;

    renderCodexSearchResults(codexSearchQuery);
    return;
  }

  content.innerHTML = `
    <div class="codex-search-page-shell">
      <div class="codex-search-controls-shell">
        <div class="codex-search-shell">
          <input
            id="codex-search-input"
            type="search"
            placeholder="Consult the Codex..."
            autocomplete="off"
            value="${escapeHtml(codexSearchQuery)}"
          >
        </div>
      </div>

      <div id="codex-search-results" class="codex-search-results-shell"></div>
    </div>
  `;

  bindCodexSearchInput();
}
