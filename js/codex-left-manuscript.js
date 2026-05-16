/* =========================================================
   DECORATIVE LEFT PAGE MANUSCRIPT
   ========================================================= */

const CODEX_MANUSCRIPT_SEED = "kadesh-left-page-v2";

const CODEX_MANUSCRIPT_SYLLABLES = [
  "KAD",
  "VOR",
  "EN",
  "THUR",
  "ASH",
  "REN",
  "VEL",
  "KA",
  "OM",
  "NAR",
  "MIR",
  "DOR",
  "KESH",
  "KADU",
  "ETH",
  "VAR",
  "TAL",
  "RUTH",
  "SAH",
  "VELIR",
  "DROM",
  "VEK",
  "ARA",
  "OTHEN",
  "VORU",
  "NAI",
  "KETH",
  "AMAR",
  "SOL",
  "UTH",
  "DORUM",
  "MIRAKH",
  "OSHEN",
  "TALOS",
  "DREN",
  "TOR",
  "SHEN",
  "ORO",
  "VARUN",
  "NARU",
  "MIREN",
  "VOTH",
  "KOR",
  "VESH",
  "THAL",
  "AN",
  "VETH",
  "SOR",
  "ARU"
];

const CODEX_MANUSCRIPT_CONNECTORS = [
  " · ",
  " — ",
  " / ",
  "  ",
  "-"
];

const CODEX_MANUSCRIPT_MARKS = [
  "— — —",
  "• • •",
  "- - -",
  "· · ·",
  "/ / /",
  "• — •",
  "— · —",
  "· — ·",
  "—   —",
  "•   •",
  "·   ·",
  "/   /",
  "— • —",
  "• · •",
  "· / ·",
  "/ · /",
  "— —",
  "• •",
  "· ·",
  "/ /",
  "— ·",
  "· —",
  "• —",
  "— •",
  "• / •",
  "/ — /",
  "· • ·",
  "— / —",
  "• · —",
  "— · •"
];

function hashCodexManuscriptSeed(seed) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createCodexManuscriptRng(seed) {
  let state = hashCodexManuscriptSeed(seed) || 1;

  return function nextRandom() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296);
  };
}

function pickCodexManuscriptItem(items, rng) {
  return items[Math.floor(rng() * items.length)] || items[0];
}

function pickCodexManuscriptSyllable(rng, state) {
  let syllable = pickCodexManuscriptItem(CODEX_MANUSCRIPT_SYLLABLES, rng);
  let safety = 0;

  while (
    syllable === state.lastSyllable &&
    state.repeatCount >= 2 &&
    safety < 12
  ) {
    syllable = pickCodexManuscriptItem(CODEX_MANUSCRIPT_SYLLABLES, rng);
    safety++;
  }

  if (syllable === state.lastSyllable) {
    state.repeatCount++;
  } else {
    state.lastSyllable = syllable;
    state.repeatCount = 1;
  }

  return syllable;
}

function buildCodexManuscriptPhrase(rng, state) {
  const syllableCount = 2 + Math.floor(rng() * 4);
  const parts = [];

  for (let i = 0; i < syllableCount; i++) {
    parts.push(pickCodexManuscriptSyllable(rng, state));
  }

  return parts.reduce((line, part, index) => {
    if (index === 0) return part;
    return line + pickCodexManuscriptItem(CODEX_MANUSCRIPT_CONNECTORS, rng) + part;
  }, "");
}

function getCodexManuscriptLineClass(rng) {
  const roll = rng();

  if (roll < 0.22) return "codex-manuscript-line codex-manuscript-line-short";
  if (roll < 0.48) return "codex-manuscript-line codex-manuscript-line-mid";
  if (roll < 0.68) return "codex-manuscript-line codex-manuscript-line-indent";
  return "codex-manuscript-line";
}

function renderCodexManuscriptBlock(rng, index, state) {
  const lineCount = 5 + Math.floor(rng() * 5);
  const lines = [];

  for (let i = 0; i < lineCount; i++) {
    const useMark = rng() < 0.32;
    const text = useMark
      ? pickCodexManuscriptItem(CODEX_MANUSCRIPT_MARKS, rng)
      : buildCodexManuscriptPhrase(rng, state);

    lines.push(`<span class="${getCodexManuscriptLineClass(rng)}">${escapeHtml(text)}</span>`);
  }

  if (index !== 0 && rng() < 0.75) {
    lines.unshift(`<span class="codex-manuscript-rule"></span>`);
  }

  return `<div class="codex-manuscript-block">${lines.join("")}</div>`;
}

function renderCodexLeftManuscript() {
  const root = document.getElementById("codex-left-manuscript");
  if (!root) return;

  const rng = createCodexManuscriptRng(CODEX_MANUSCRIPT_SEED);
  const syllableState = {
    lastSyllable: "",
    repeatCount: 0
  };
  const blockCount = 9;
  const blocks = [];

  for (let i = 0; i < blockCount; i++) {
    blocks.push(renderCodexManuscriptBlock(rng, i, syllableState));
  }

  root.innerHTML = blocks.join("");
}

window.renderCodexLeftManuscript = renderCodexLeftManuscript;

document.addEventListener("DOMContentLoaded", renderCodexLeftManuscript);
