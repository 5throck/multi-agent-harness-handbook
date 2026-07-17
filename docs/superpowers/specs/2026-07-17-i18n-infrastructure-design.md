# i18n Infrastructure Design — Korean / English / Japanese

**Date:** 2026-07-17
**Status:** Draft
**Scope:** Infrastructure only (no actual translation content)

## 1. Overview

Add multilingual support (Korean, English, Japanese) to the Multi-Agent Harness Handbook.
This spec covers **infrastructure only**: language switcher, search filtering, validation scripts,
authoring guidelines, and index.html structure. Actual translation of 32 content files is a
separate effort.

## 2. File Naming Convention

Suffix-based, matching the existing `preview-multilingual.html` design:

| Language | Suffix | Example |
|----------|--------|---------|
| Korean (default) | *(none)* | `01_Why_AI_Chapter.html` |
| English | `_en` | `01_Why_AI_Chapter_en.html` |
| Japanese | `_ja` | `01_Why_AI_Chapter_ja.html` |

Index pages follow the same pattern: `index.html` (ko), `index_en.html`, `index_ja.html`.

**Rationale:** No directory restructuring. Each language file is a self-contained copy with its
own `<html lang="...">`, sidebar nav, and content. A missing `_en.html` file simply means that
language is not yet translated — the switcher shows it as disabled.

## 3. Language Switcher (`lang-switcher.js`)

### 3.1 Location & UI

- Fixed top-right dropdown, positioned to the left of the dark mode toggle button.
- CSS class `.lang-switcher` already exists in `handbook-components.css` (line 1035).
- Dropdown options: 한국어 / English / 日本語.
- Options whose corresponding file does not exist are marked `disabled`.

### 3.2 Behavior

1. On page load, read `localStorage('lang')`. If set, select that option.
2. Detect current page's language from `<html lang="...">` attribute.
3. Detect available languages by checking if `_en.html` / `_ja.html` variants of the
   current page exist (via `fetch` with `HEAD` method, cached).
4. On change, navigate to the suffixed URL variant:
   - Strip any existing `_en` or `_ja` suffix from current filename.
   - Append the new suffix (empty for Korean).
5. Save selection to `localStorage('lang')`.

### 3.3 HTML Contract

The script auto-injects itself (same pattern as `dark-mode-toggle.js`):

```html
<div id="lang-switcher" class="lang-switcher">
  <select id="lang-select" aria-label="Language">
    <option value="">한국어</option>
    <option value="en">English</option>
    <option value="ja">日本語</option>
  </select>
</div>
```

### 3.4 Coexistence with Dark Mode Toggle

Both are `position: fixed; top: ...`. Dark mode toggle stays at `top: 16px; right: 16px`.
Lang switcher is placed at `top: 16px; right: 64px` (left of the toggle button) to avoid overlap.

Update CSS in `handbook-components.css`:

```css
.lang-switcher {
  position: fixed; top: calc(var(--spacing-unit) * 2); right: 64px;
  /* ...existing styles... */
}
.dark-mode-toggle {
  /* keep existing right: calc(var(--spacing-unit) * 2) */
}
```

### 3.5 File

`docs/assets/lang-switcher.js` — self-contained IIFE, zero dependencies.
Loaded via `<script src="../assets/lang-switcher.js">` in each HTML file.

## 4. site-search.js Language Filtering

### 4.1 DOCS Array Extension

Each entry gets an optional `lang` field:

```js
{ path: 'intro/01_Why_AI_Chapter.html', title: '1장 · AI 시대의 업무 혁신', lang: 'ko' },
{ path: 'intro/01_Why_AI_Chapter_en.html', title: 'Ch.1 · Business Innovation in the AI Era', lang: 'en' },
{ path: 'intro/01_Why_AI_Chapter_ja.html', title: '1章 · AI時代の業務イノベーション', lang: 'ja' },
```

### 4.2 Filtering Logic

- On init, detect current page language from `<html lang="...">`.
- Filter DOCS to only include entries matching `lang` (or entries without `lang` for backward compat).
- Default to `ko` if no `lang` attribute found.

### 4.3 Localized Strings

Result type labels (`섹션`, `시나리오`, `항목`) and placeholder text move to a `LABELS` map:

```js
var LABELS = {
  ko: { placeholder: '핸드북 전체 검색 — 섹션·항목·시나리오…', section: '섹션', scenario: '시나리오', item: '항목', noResult: '결과 없음', hint: '개 문서 전체에서 찾아 해당 위치로 이동합니다.' },
  en: { placeholder: 'Search entire handbook — sections, items, scenarios…', section: 'Section', scenario: 'Scenario', item: 'Item', noResult: 'No results', hint: 'documents searched. Navigates to exact position.' },
  ja: { placeholder: 'ハンドブック全体検索 — セクション・項目・シナリオ…', section: 'セクション', scenario: 'シナリオ', item: '項目', noResult: '結果なし', hint: '文書から検索し、該当箇所に移動します。' }
};
```

### 4.4 Building the DOCS Array

When `_en.html` or `_ja.html` files are created, the corresponding DOCS entries must be added
manually. This is intentional — it forces explicit acknowledgment of each translated file.

## 5. Navigation Validation Updates

### 5.1 `check-labels.ts`

The `extractChapterNum()` function currently matches `(\d+)\s*장` (Korean only).
Extend to support English and Japanese patterns:

```typescript
function extractChapterNum(s: string): string | null {
  const m = s.match(/(\d+)\s*(장|Ch\.?|Chapter|章)/i);
  return m ? m[1] : null;
}
```

This handles: `3장`, `Ch.3`, `Chapter 3`, `3章`.

### 5.2 `check-search.ts`

The current check requires every HTML file to be in the DOCS array.
Update to allow `_en.html` and `_ja.html` files to be missing from DOCS if they don't exist yet:

- If a file matches `*_en.html` or `_ja.html`, only flag it as `missing-from-docs` if the
  base Korean file (`*.html`) is already in DOCS. This allows incremental translation.
- Files that exist but are not yet translated should not cause CI failures.

### 5.3 `check-symmetry.ts` / `check-links.ts`

No changes needed. These work on actual `<a href>` values in each file. Since each language
file is self-contained with its own sidebar nav, links within `_en.html` point to other `_en.html`
files. The scripts validate these links regardless of language.

## 6. Index Pages

### 6.1 Korean `index.html` (existing)

Add `<script src="assets/lang-switcher.js">` and the switcher link to `index_en.html` / `index_ja.html`.
The existing Korean index remains the default at `index.html`.

### 6.2 English `index_en.html` (new, placeholder)

Copy of `index.html` with:
- `<html lang="en">`
- All card titles and descriptions in English (placeholder text for now)
- Card `href` links pointing to `_en.html` variants
- Footer text in English

### 6.3 Japanese `index_ja.html` (new, placeholder)

Copy of `index.html` with:
- `<html lang="ja">`
- All card titles and descriptions in Japanese (placeholder text for now)
- Card `href` links pointing to `_ja.html` variants
- Footer text in Japanese

### 6.4 Navigation Between Index Pages

The lang-switcher on `index.html` navigates to `index_en.html` / `index_ja.html` and vice versa.

## 7. AUTHORING_GUIDELINES.md — §23

Add a new section covering the i18n workflow:

- **§23-1 File Naming:** Suffix convention (`_en.html`, `_ja.html`), no directory restructuring.
- **§23-2 Page Structure:** Each translated file must have correct `<html lang="...">`, its own
  sidebar nav with links to same-language files, and include `lang-switcher.js`.
- **§23-3 Translation Checklist:** What to translate (title, h1, body text, sidebar labels,
  meta description) vs. what to keep (code blocks, file paths, URLs, technical identifiers).
- **§23-4 site-search.js:** How to add a new DOCS entry when a translation is completed.
- **§23-5 Quality Gates:** Validation scripts automatically verify link integrity within each
  language. Cross-language parity (are all files translated?) is a manual checklist.

## 8. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `docs/assets/lang-switcher.js` | **Create** | Language switcher script |
| `docs/assets/css/handbook-components.css` | **Modify** | Position `.lang-switcher` left of dark toggle |
| `docs/assets/site-search.js` | **Modify** | Add `lang` field to DOCS, filtering, localized strings |
| `docs/index_en.html` | **Create** | English index (placeholder) |
| `docs/index_ja.html` | **Create** | Japanese index (placeholder) |
| `docs/index.html` | **Modify** | Add lang-switcher.js script tag |
| `scripts/check-labels.ts` | **Modify** | Multi-language chapter regex |
| `scripts/check-search.ts` | **Modify** | Allow untranslated files in DOCS |
| `AUTHORING_GUIDELINES.md` | **Modify** | Add §23 i18n workflow |
| All 32 existing Korean HTML files | **Modify** | Add `<script src="../assets/lang-switcher.js">` tag |

## 9. Out of Scope

- Actual translation of 32 content files (separate effort, possibly AI-assisted)
- Per-language font-family switching (current stack includes Noto Sans KR which covers all CJK)
- RTL language support (Korean, English, Japanese are all LTR)
- URL-based language routing (`/en/`, `/ja/` paths) — suffix approach is simpler for GitHub Pages
- Automated translation pipeline / CI for translation quality
