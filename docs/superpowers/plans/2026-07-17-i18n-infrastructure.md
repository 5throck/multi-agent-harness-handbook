# i18n Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multilingual infrastructure (Korean/English/Japanese) to the handbook — language switcher, search filtering, validation updates, placeholder index pages, and authoring guidelines.

**Architecture:** Static HTML suffix approach (`_en.html`, `_ja.html`). A `lang-switcher.js` script (same pattern as `dark-mode-toggle.js`) auto-injects a dropdown on every page. `site-search.js` gains a `lang` field per DOCS entry and filters results by current page language. Validation scripts are updated for multi-language chapter patterns.

**Tech Stack:** Vanilla JS (IIFE, zero deps), Bun/TypeScript (validation scripts), existing shared CSS.

**Spec:** `docs/superpowers/specs/2026-07-17-i18n-infrastructure-design.md`

---

### Task 1: Create `lang-switcher.js`

**Files:**
- Create: `docs/assets/lang-switcher.js`

- [ ] **Step 1: Create the language switcher script**

Create `docs/assets/lang-switcher.js` as a self-contained IIFE with zero dependencies. Follow the same pattern as `dark-mode-toggle.js`.

```js
/**
 * lang-switcher.js — Language switcher for the Multi-Agent Harness Handbook
 *
 * Auto-injects a dropdown that navigates between Korean (default), English (_en.html),
 * and Japanese (_ja.html) variants of the current page.
 *
 * Behaviour:
 * - On load: reads localStorage('lang'), selects matching option.
 * - Detects available languages by checking if _en.html / _ja.html exist (HEAD fetch, cached).
 * - On change: strips current suffix, appends new suffix, navigates.
 * - Persists choice to localStorage.
 *
 * HTML contract (injected automatically if not present):
 *   <div id="lang-switcher" class="lang-switcher">
 *     <select id="lang-select" aria-label="Language">
 *       <option value="">한국어</option>
 *       <option value="en">English</option>
 *       <option value="ja">日本語</option>
 *     </select>
 *   </div>
 */

(function () {
  'use strict';

  var STORAGE_KEY  = 'lang';
  var SWITCHER_ID  = 'lang-switcher';
  var SELECT_ID    = 'lang-select';

  var LANG_MAP = [
    { value: '',   label: '한국어',  nativeLabel: '한국어' },
    { value: 'en', label: 'English', nativeLabel: 'English' },
    { value: 'ja', label: '日本語',  nativeLabel: '日本語' }
  ];

  var SUFFIX_RE = /(_en|_ja)(?=\.html$)/;

  /* -----------------------------------------------------------------------
     DOM injection
     ----------------------------------------------------------------------- */
  var container = document.getElementById(SWITCHER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = SWITCHER_ID;
    container.className = 'lang-switcher';

    var select = document.createElement('select');
    select.id = SELECT_ID;
    select.setAttribute('aria-label', 'Language');
    for (var i = 0; i < LANG_MAP.length; i++) {
      var opt = document.createElement('option');
      opt.value = LANG_MAP[i].value;
      opt.textContent = LANG_MAP[i].nativeLabel;
      select.appendChild(opt);
    }
    container.appendChild(select);
    document.body.appendChild(container);
  }

  var selectEl = document.getElementById(SELECT_ID);

  /* -----------------------------------------------------------------------
     Helpers
     ----------------------------------------------------------------------- */

  function getBaseUrl() {
    var path = window.location.pathname;
    // Strip suffix to get the base Korean URL
    return path.replace(SUFFIX_RE, '');
  }

  function getLangFromHtml() {
    return (document.documentElement.lang || '').split('-')[0]; // 'ko' -> 'ko', 'en' -> 'en'
  }

  function langFromUrl(path) {
    var m = path.match(SUFFIX_RE);
    return m ? m[1].replace('_', '') : '';
  }

  /* -----------------------------------------------------------------------
     Detect available languages via HEAD fetch (cached)
     ----------------------------------------------------------------------- */

  var availabilityCache = {};

  function checkAvailability(baseUrl, callback) {
    var remaining = 2; // en and ja
    var results = { en: false, ja: false };

    function done() {
      callback(results);
    }

    LANG_MAP.forEach(function (lang) {
      if (!lang.value) return; // skip Korean (always available)
      var url = baseUrl.replace(/\.html$/, '_' + lang.value + '.html');
      // Simple cache check
      if (availabilityCache[url] !== undefined) {
        results[lang.value] = availabilityCache[url];
        remaining--;
        if (remaining === 0) done();
        return;
      }
      fetch(url, { method: 'HEAD' }).then(function (res) {
        results[lang.value] = res.ok;
        availabilityCache[url] = res.ok;
        remaining--;
        if (remaining === 0) done();
      }).catch(function () {
        results[lang.value] = false;
        availabilityCache[url] = false;
        remaining--;
        if (remaining === 0) done();
      });
    });
  }

  /* -----------------------------------------------------------------------
     Update select options (disable unavailable)
     ----------------------------------------------------------------------- */

  function updateOptions(available) {
    for (var i = 0; i < selectEl.options.length; i++) {
      var opt = selectEl.options[i];
      var lang = opt.value;
      if (lang && !available[lang]) {
        opt.disabled = true;
        opt.title = opt.textContent + ' (unavailable)';
      } else {
        opt.disabled = false;
        opt.title = '';
      }
    }
  }

  /* -----------------------------------------------------------------------
     Initialise
     ----------------------------------------------------------------------- */

  (function init() {
    var baseUrl = getBaseUrl();
    var stored = localStorage.getItem(STORAGE_KEY);
    var currentLang = langFromUrl(window.location.pathname) || '';

    // Set selected value from stored preference or current URL
    if (currentLang) {
      selectEl.value = currentLang;
    } else if (stored) {
      selectEl.value = stored;
    }

    // Detect availability and update options
    checkAvailability(baseUrl, function (available) {
      updateOptions(available);
    });
  })();

  /* -----------------------------------------------------------------------
     Select change handler
     ----------------------------------------------------------------------- */

  selectEl.addEventListener('change', function () {
    var lang = selectEl.value;
    var baseUrl = getBaseUrl();
    var target = baseUrl;
    if (lang) {
      target = baseUrl.replace(/\.html$/, '_' + lang + '.html');
    }
    localStorage.setItem(STORAGE_KEY, lang);
    window.location.href = target;
  });

})();
```

- [ ] **Step 2: Commit**

```bash
git add docs/assets/lang-switcher.js
git commit -m "feat(i18n): add lang-switcher.js — language dropdown with localStorage"
```

---

### Task 2: Update CSS — Position lang-switcher

**Files:**
- Modify: `docs/assets/css/handbook-components.css` (lines ~1035-1043)

- [ ] **Step 1: Update `.lang-switcher` positioning**

The current CSS at line 1035-1043 has:
```css
.lang-switcher { display: inline-flex; align-items: center; gap: calc(var(--spacing-unit)); margin-left: auto; }
```

Replace with proper fixed positioning so it doesn't overlap the dark mode toggle:

```css
/* Language switcher */
.lang-switcher {
  position: fixed;
  top: calc(var(--spacing-unit) * 2);
  right: 64px;
  z-index: 150;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  padding: calc(var(--spacing-unit) * .5) calc(var(--spacing-unit));
  transition: background-color .2s, border-color .2s;
}
.lang-switcher select {
  padding: calc(var(--spacing-unit) * .5) calc(var(--spacing-unit) * 2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-family);
  background: var(--bg2);
  color: var(--text);
  cursor: pointer;
  transition: background-color .2s, border-color .2s, color .2s;
}
.lang-switcher select:focus { outline: none; border-color: var(--accent); }
```

Also update `.dark-mode-toggle` to ensure consistent z-index. It should already have `z-index: 150` — verify and keep.

- [ ] **Step 2: Verify responsive media query includes lang-switcher**

In the `@media (max-width: 640px)` block (~line 1069-1075), `.lang-switcher` should be hidden in print but visible on mobile. Check the print section (~line 1082) already has `.lang-switcher` — it does.

- [ ] **Step 3: Commit**

```bash
git add docs/assets/css/handbook-components.css
git commit -m "style(i18n): position lang-switcher fixed top-right, left of dark toggle"
```

---

### Task 3: Add `lang-switcher.js` to all 32 Korean HTML files

**Files:**
- Modify: all 32 HTML files in `docs/` (excluding `preview-multilingual.html`)

The script tag should be placed right before `dark-mode-toggle.js` in every file. The existing pattern is:

```html
<script src="../assets/inpage-search.js" defer></script>
<script src="../assets/dark-mode-toggle.js"></script>
</body>
```

Change to:

```html
<script src="../assets/inpage-search.js" defer></script>
<script src="../assets/dark-mode-toggle.js"></script>
<script src="../assets/lang-switcher.js"></script>
</body>
```

For `docs/index.html` the pattern is:
```html
<script src="assets/site-search.js" defer></script>
<script src="assets/dark-mode-toggle.js"></script>
```
Change to:
```html
<script src="assets/site-search.js" defer></script>
<script src="assets/dark-mode-toggle.js"></script>
<script src="assets/lang-switcher.js"></script>
```

**Files to modify (32 total):**

Root: `docs/index.html`
intro/: `01_Why_AI_Chapter.html`, `05_Intro_Chapter.html`, `08_Intro_Advanced_Deploy.html`, `08_Intro_Advanced_Chapter.html`, `08_Intro_Advanced_AGENTS.html`, `08_Intro_Advanced_Architecture.html`, `08_Intro_Advanced_Roadmap.html`, `10_ProjectUpgrade_Chapter.html`
concepts/: `02_Concepts_Chapter.html`
guardrails/: `03_Guardrails_Chapter.html`
practice/: `04_Practice_Manual.html`, `04_Practice_Manual_A.html`, `04_Practice_Manual_B.html`, `04_Practice_Examples_A.html`, `04_Practice_Examples_B.html`
variant-practice/: `06_VariantPractice_Manual.html`, `06_VariantPractice_Examples.html`
enterprise/: `07_Enterprise_Chapter.html`
workflows/: `09_Workflows_Chapter.html`
variant-advanced/: `11_VariantAdvanced_Chapter.html`, `12_VariantAdvanced_Examples.html`
capstone/: `13_Capstone.html`
tools/: `00_Tools_Manual.html`
faq/: `00_FAQ.html`
glossary/: `00_Glossary.html`
setup/: `SETUP_ko.html`, `SETUP_CHECKLIST_ko.html`
lecture-guide/: `00_Course_Overview.html`, `00_Lecture_Guide.html`
warm-up/: `Warmup_Tetris_Pacman.html`

- [ ] **Step 1: Add script tag to all 32 files**

For each file, use Edit to change:
```
<script src="...dark-mode-toggle.js"></script>
</body>
```
to:
```
<script src="...dark-mode-toggle.js"></script>
<script src="...lang-switcher.js"></script>
</body>
```

- [ ] **Step 2: Commit**

```bash
git add docs/
git commit -m "feat(i18n): add lang-switcher.js script tag to all 32 HTML files"
```

---

### Task 4: Update `site-search.js` — Language Filtering

**Files:**
- Modify: `docs/assets/site-search.js`

- [ ] **Step 1: Add LANG field to DOCS entries**

Add `lang: 'ko'` to every existing entry in the DOCS array (lines 10-41). Example:

```js
{ path: 'intro/01_Why_AI_Chapter.html', title: '1장 · AI 시대의 업무 혁신', lang: 'ko' },
```

Do NOT add `_en.html` or `_ja.html` entries yet — those will be added when translations exist.

- [ ] **Step 2: Add LABELS map after the DOCS array**

After the closing `];` of DOCS, add:

```js
  var LABELS = {
    ko: { placeholder: '핸드북 전체 검색 — 섹션·항목·시나리오…', section: '섹션', scenario: '시나리오', item: '항목', noResult: '결과 없음', hint: function(n){ return n + '개 문서 전체에서 찾아 해당 위치로 이동합니다.'; } },
    en: { placeholder: 'Search entire handbook — sections, items, scenarios…', section: 'Section', scenario: 'Scenario', item: 'Item', noResult: 'No results', hint: function(n){ return n + ' documents searched. Navigates to exact position.'; } },
    ja: { placeholder: 'ハンドブック全体検索 — セクション・項目・シナリオ…', section: 'セクション', scenario: 'シナリオ', item: '項目', noResult: '結果なし', hint: function(n){ return n + '文書から検索し、該当箇所に移動します。'; } }
  };
```

- [ ] **Step 3: Add lang detection and DOCS filtering inside `ready()`**

Inside the `ready(function () { ... })` callback, before the `var firstGroup = ...` line, add:

```js
    var pageLang = (document.documentElement.lang || 'ko').split('-')[0];
    var labels = LABELS[pageLang] || LABELS.ko;

    // Filter DOCS to current language (entries without lang default to ko)
    var filteredDocs = DOCS.filter(function (d) {
      return !d.lang || d.lang === pageLang;
    });
```

- [ ] **Step 4: Replace hardcoded Korean strings with label references**

Replace these occurrences throughout the file:

| Line | Old | New |
|------|-----|-----|
| wrap.innerHTML placeholder | `'핸드북 전체 검색 — 섹션·항목·시나리오…'` | `labels.placeholder` |
| wrap.innerHTML hint | `DOCS.length + '개 문서 전체에서 찾아 해당 위치로 이동합니다.'` | `labels.hint(filteredDocs.length)` |
| parseDoc type for h2 | `'섹션'` | `labels.section` |
| parseDoc type for scenario | `e.getAttribute('data-kind') \|\| '시나리오'` | `e.getAttribute('data-kind') \|\| labels.scenario` |
| parseDoc type for h3 | `'항목'` | `labels.item` |
| build() msg | `'색인 준비 중…'` | Use labels.ko fallback or keep hardcoded (build is internal) |
| run() no result | `'결과 없음'` | `labels.noResult` |
| Promise.all line | `DOCS.map(...)` | `filteredDocs.map(...)` |

- [ ] **Step 5: Commit**

```bash
git add docs/assets/site-search.js
git commit -m "feat(i18n): add lang filtering and localized strings to site-search.js"
```

---

### Task 5: Update Validation Scripts

**Files:**
- Modify: `scripts/check-labels.ts` (line 18)
- Modify: `scripts/check-search.ts` (lines 42-55)
- Modify: `scripts/nav-utils.ts` (lines 129-137)

- [ ] **Step 1: Update `nav-utils.ts` — parseDocsArray to include `lang`**

Change `parseDocsArray` return type and regex to support optional `lang` field:

```typescript
export function parseDocsArray(jsContent: string): { path: string; title: string; lang?: string }[] {
  const entries: { path: string; title: string; lang?: string }[] = {
    const re = /\{\s*path:\s*'([^']*)'\s*,\s*title:\s*'([^']*)'\s*(?:,\s*lang:\s*'([^']*)')?\s*\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(jsContent)) !== null) {
      entries.push({ path: m[1], title: m[2], lang: m[3] || undefined });
    }
    return entries;
  }
```

- [ ] **Step 2: Update `check-labels.ts` — multi-language chapter regex**

Change `extractChapterNum` (line 18) from:
```typescript
const m = s.match(/(\d+)\s*장/);
```
to:
```typescript
const m = s.match(/(\d+)\s*(장|Ch\.?|Chapter|章)/i);
```

- [ ] **Step 3: Update `check-search.ts` — allow untranslated files**

In the loop at lines 42-55, after `if (file.startsWith("assets/")) continue;`, add:

```typescript
    // Allow _en.html and _ja.html files to be missing from DOCS
    // (translation not yet completed)
    if (/_en\.html$|_ja\.html$/.test(file)) continue;
```

Also update the "missing-file" check — a DOCS entry with `lang` that doesn't exist on disk should not fail if it's a non-Korean entry:

```typescript
  // Only flag missing files for Korean entries (non-ko may not be translated yet)
  for (const entry of docsEntries) {
    if (!actualFiles.has(entry.path)) {
      // Skip non-ko entries (translation may not exist yet)
      if (entry.lang && entry.lang !== 'ko') continue;
      errors.push({
        type: "missing-file",
        path: entry.path,
        detail: `DOCS array references "${entry.path}" but file does not exist`,
      });
    }
  }
```

- [ ] **Step 4: Run validation to verify**

```bash
bun run scripts/validate-nav.ts
```

Expected: All 4 checks PASS (or only pre-existing issues).

- [ ] **Step 5: Commit**

```bash
git add scripts/check-labels.ts scripts/check-search.ts scripts/nav-utils.ts
git commit -m "feat(i18n): update validation scripts for multi-language support"
```

---

### Task 6: Create Placeholder Index Pages

**Files:**
- Create: `docs/index_en.html`
- Create: `docs/index_ja.html`

- [ ] **Step 1: Create `docs/index_en.html`**

Copy structure from `docs/index.html` with these changes:
- `<html lang="en">`
- `<title>Multi-Agent Team Harness Engineering Handbook</title>`
- `<meta description>` in English
- Header: `h1` → "Multi-Agent Team Harness Engineering Handbook"
- Subtitle: English translation of current subtitle
- Meta box: English version strings
- All `.group .section-label`: English equivalents
- All `.card h2`: English placeholders (can be literal translations or "[Chapter N Title — EN]")
- All `.card p`: English placeholders
- All `.card .go`: English ("Open →", "Read →", etc.)
- Footer: English
- Add `<script src="assets/lang-switcher.js"></script>`

- [ ] **Step 2: Create `docs/index_ja.html`**

Same approach as English, with Japanese equivalents:
- `<html lang="ja">`
- `<title>マルチエージェントチーム・ハーネス・エンジニアリング・ハンドブック</title>`
- All text in Japanese

- [ ] **Step 3: Add lang-switcher to existing `docs/index.html`**

Add `<script src="assets/lang-switcher.js"></script>` after `dark-mode-toggle.js`.

- [ ] **Step 4: Commit**

```bash
git add docs/index.html docs/index_en.html docs/index_ja.html
git commit -m "feat(i18n): add English and Japanese placeholder index pages"
```

---

### Task 7: Add AUTHORING_GUIDELINES.md §23

**Files:**
- Modify: `AUTHORING_GUIDELINES.md`

- [ ] **Step 1: Add §23 after the last existing section**

Append the following section:

```markdown
## §23. 다국어 버전 관리 (i18n)

### 23-1. 파일명 규칙

| 언어 | 접미사 | 예시 |
|------|--------|------|
| 한국어 (기본) | *(없음)* | `01_Why_AI_Chapter.html` |
| English | `_en` | `01_Why_AI_Chapter_en.html` |
| 日本語 | `_ja` | `01_Why_AI_Chapter_ja.html` |

index 페이지도 동일: `index.html` / `index_en.html` / `index_ja.html`.

### 23-2. 페이지 구조 요구사항

번역 파일은 한국어 원본의 **전체 복사본**이어야 한다. 각 파일에:
- `<html lang="en">` 또는 `<html lang="ja">` 속성
- 자체 사이드바 네비게이션 (같은 언어의 다른 파일로 링크)
- `<script src="../assets/lang-switcher.js">` 포함
- 코드 블록, 파일 경로, URL, 기술 식별자는 번역하지 않음

### 23-3. 번역 vs 번역하지 않을 것

**번역 대상:** 제목, h1, 본문 텍스트, 사이드바 라벨, 메타 description, 카드 설명, 주의/경고 상자 텍스트
**번역하지 않음:** 코드 블록 내용, 파일/디렉토리 경로, CLI 명령어, URL, CSS 클래스명, 기술 식별자(오케스트레이터, 핸드오프 계약 등), SVG 다이어그램 내부 텍스트

### 23-4. site-search.js DOCS 등록

번역 파일을 생성한 후 `docs/assets/site-search.js`의 DOCS 배열에 해당 항목을 추가한다:

```js
{ path: 'intro/01_Why_AI_Chapter_en.html', title: 'Ch.1 · Business Innovation in the AI Era', lang: 'en' },
```

### 23-5. 검증

`bun run scripts/validate-nav.ts`로 링크 무결성을 자동 검증한다. 언어별 파일 간의 번역 누락은 수동으로 확인한다 (각 장마다 ko/en/ja 3파일이 모두 존재하는지).
```

- [ ] **Step 2: Commit**

```bash
git add AUTHORING_GUIDELINES.md
git commit -m "docs: add §23 i18n workflow guidelines to AUTHORING_GUIDELINES.md"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run full validation**

```bash
bun run scripts/validate-nav.ts
```

Expected: All checks PASS.

- [ ] **Step 2: Verify index.html loads lang-switcher**

Open `docs/index.html` in a browser and confirm:
- Language dropdown appears to the left of the dark mode toggle
- 한국어 is selected by default
- English and Japanese options are disabled (no _en/_ja variants yet)

- [ ] **Step 3: Verify a chapter page loads lang-switcher**

Open any chapter page (e.g., `docs/intro/01_Why_AI_Chapter.html`) and confirm:
- Language dropdown appears
- Options are disabled (no translated files yet)

- [ ] **Step 4: Final commit if any fixes needed**
