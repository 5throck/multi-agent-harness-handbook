# Changelog

All notable changes to this handbook will be documented in this file.

## [2026-09-11] — Upstream Sync: ADR-0073 Upgrade Policy & ADR-0072 Skill Term Nodes

### Changed
- Synced handbook facts with `ai-workspace-standards` main (2026-09).
- **Ch.10 (ko/en/ja/es)** re-pinned to **upgrade-project.ts v1.22.1** + **`scripts/lib/upgrade-policy.ts` (ADR-0073)**: classification moved out of hardcoded lists into a policy file; new **TEMPLATE TREE SYNC** pass walks the effective template tree and resolves a classification for *every* file (fallback policy **SYNC — deliver by default**, a deny-list rather than an enumeration; WORKSPACE is add-if-missing only; JSON_MERGE deep-merges `.claude/settings.json` / `.gemini/settings.json`); since v1.22.0 the pass also owns the five files formerly hardcoded as VARIANT_DOCS_SYNC. Documented the new `--yes` / `--skip-context-commonization` flags (CONTEXT_COMMONIZATION since v1.20.0: ≥65% token overlap removed, 30–65% flagged for review) and **ADR-0073 Amendment 1** — the upgrade trio is **L0-only**: run `bun scripts/upgrade-project.ts Projects/<name>` from the workspace root, or `bun ../../scripts/upgrade-project.ts .` from inside a project (the script resolves the template tree relative to its own location, so per-project copies were inert fossils and were retired). Companion gate `check-upgrade-coverage.ts --strict` auto-runs inside `audit.ts`.
- **Appendix C (ko/en)**: skill-graph sources gain **ADR-0072 Skill Term Nodes** — each skill's `references/terms-ko.json` yields `term:<용어>` nodes (inheriting the owning skill's layer) plus skill→term `references` edges; generator pinned to **generate-skill-graph.ts v1.10.0**, which renders the Korean Term Vocabulary table (term | layer | referencing skills) into `docs/skill-graph.md`; `verify-skill-graph.ts` mirrors the `term` node type with namespacing/duplicate/orphan invariants.
- **Ch.01 (ko/en)**: skill example `<code>audit-workspace</code>` → `project-review` (audit-workspace deprecated 2026-09-10; project-review Step 0 is a documented superset).

## [2026-08-24] — Workspace-State Sync & i18n Parity Gate

### Added
- **`scripts/check-i18n-parity.ts`** — new cross-language content gate: FAIL on heading/code-block count mismatches, missing language variants, and wrong-language internal links; WARN on >15% list/table drift and numeric-token divergence. Wired into `handbook-doctor` (Check 13) and `package.json` (`bun run check-i18n`).
- **bun run ci** - one-command local run of the exact CI check chain (validate-handbook through check-search); prevents the doctor-green-but-CI-red failure mode.

### Changed
- Synced handbook facts with `ai-workspace-standards` main (2026-08-24): 11 variants incl. **co-hr** everywhere; `l3-to-variant-pipeline.ts` CLI rewritten to `--l3-path/--name/--type/--description`; upgrade-project chapter re-pinned to **v1.10.1** (8 file-handling categories, merge-aware `.gitleaks.toml`, country-awareness); three-platform parity (.claude/.gemini/**.agents**); hook wiring corrected (`gateguard-fact-force.ts`, `agent-model-gate.ts`, `post-write-lifecycle-check.ts`, `audit.ts` on TaskCompleted); /sync FATAL gates documented (ADR-0055 spec registry); country-profile mechanism introduced; template PM tier baseline nuance.
- README_ja/es: Ch.10 title L2→**L3** and missing curriculum tail entries restored; reference-video lists reconciled with the Korean edition.

### Fixed
- README_ko dead link (`SETUP_ko.html`→`SETUP.html`); Day-2 total-hours math in ko/ja lecture guide (now ≈6h–6h10 matching the schedule table); Tools Manual version rows unified to 2026-08; Korean canonical ch11 `<title>`/`<h1>` translated; ja SVG label 「マージ」→`templates/`; Guardrails glossary entry added to ko/en/ja; **16 wrong-language internal links** retargeted; stray English in warm-up es.

## [2026-08-23] — Copy Button CSP Compliance

### Bug Fix
- **Fixed all copy buttons site-wide** — the CSP meta tag (`script-src 'self'`) added during security hardening blocks inline event handlers, so every `<button onclick="copyCode(this)">` stopped working. Clicks are now handled by document-level event delegation for `.copy-btn` in `copy-code.js`, and all 424 inline handlers across 76 pages were removed.

### Hardening
- Ported hardened copy logic into `copy-code.js`: null-safe `pre` text lookup, clipboard-API error feedback, and a `textarea` + `document.execCommand('copy')` fallback for non-secure contexts
- Success/failure feedback now restores each button's original localized label instead of a hardcoded string (button labels vary by page language)
- No CSP change — the strict `script-src 'self'` policy is preserved

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
