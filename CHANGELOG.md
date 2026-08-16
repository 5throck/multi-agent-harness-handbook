# Changelog

All notable changes to this handbook will be documented in this file.

## [2026-08-16] — Content Accuracy & Security Review

### Security
- **Fixed shell injection vulnerability** in `deploy-handbook.ts` — all `gh` CLI calls converted from `execSync` string concatenation to `execFileSync` argument arrays; added input validation for `repoSlug`, `visibility`, and `outputDir`
- Deleted stray `_stray_git_metadata_ignore/` and `_stray_zcode_metadata_ignore/` directories from `docs/setup/`

### Content Accuracy
- Added missing **co-abap** variant to all variant counts (9→10) across Korean, English, Japanese, and Spanish editions
- Fixed `memory/MEMORY.md` singular references → correct `memory/YYYY-MM-DD.md` pattern (40 edits across 24 files)
- Fixed `docs/context.md` references at workspace root level — clarified AGENTS.md is L0 SSOT
- Replaced non-existent "co-marketing" variant reference with "co-game" in SVG diagrams
- Fixed quiz question incorrectly referencing `context.md` as L0 SSOT — corrected to AGENTS.md

### Internationalization & Accessibility
- Internationalized `inpage-search.js` — Korean, English, Japanese, Spanish UI strings with automatic language detection
- Replaced hardcoded CSS colors in `inpage-search.js` with CSS variable references (dark mode support)
- Added `role="img"` and `aria-label` to all 184 SVGs across all language variants

### Cross-language Links
- Fixed Korean HTML links in Japanese (_ja) and Spanish (_es) pages pointing to correct language variants

### Minor
- Removed duplicate paragraph in `08_Intro_Advanced_Chapter` (all 4 variants)
- Fixed "유_ghost AI" typo → "유령 AI"
- Changed hypothetical "co-marketing" → "co-retail" to avoid confusion with actual variants

### Script Fixes
- Added `existsSync` guard in `check-tables.ts` to prevent ENOENT crash when `handbook-components.css` is missing
