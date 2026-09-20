# Changelog

All notable changes to this handbook will be documented in this file.

## [2026-09-20] — Lecture Schedule Review: Content Accuracy & Time Rebalance

### Fixed
- **Stale "5-category" file-handling description** in the lecture guide and course overview (ko/en/ja/es): the Ch. 10 upgrade chapter teaches an **8-category** scheme; the schedule rows still said 5. Also removed the duplicated chapter label inside the Ch. 10 row's content cell (ko/ja) and restored the missing L3 in the en Ch. 8 §1 layer list (L0→L1→L2→L3).
- **Ch. 9 schedule row content** (ko/en/ja/es) expanded to match the chapter as it now ships — workflow components, five domain cases, the subagent roster, the role boundary matrix, the PM phase pipeline, and the procedure schema (ADR-0063); the row only said "components, examples, selection guide".
- Course overview's both-days total disagreed with the sum of its own blocks (said 11 h 15 m); all totals are now computed from the tables.

### Changed
- **Time rebalance** for the tightest blocks (all 4 languages; lecture guide and course overview kept in lockstep):
  - Day 1: Ch. 4 hands-on lab 80 → **90 min** (five scenarios across tool groups) — day total 5 h 35 → **5 h 45 min**.
  - Day 2: Ch. 9 lecture 15 → **20 min**; Ch. 11 hands-on (D-1) 40 → **50 min**; Ch. 13 lecture 20 → **25 min**; Ch. 14 capstone 60 → **70 min** — day total ≈6 h → **6 h 25 min**.
  - Break notes and the both-days total (now **12 h 10 min** excl. breaks) recomputed; the Day-2 note gained an explicit compression lever (Ch. 9/13 back to 15 min each → ≈6 h 15 min) for venues without a full day.

## [2026-09-20] — Ch.13 Domain Operating Model: diagrams and readability pass

### Added
- **Ch.13 Domain Operating Model** (`docs/domain-model/13_DomainOperatingModel_Chapter.html`, ko/en/es/ja) — 3 new inline SVG diagrams matching the visual style already used elsewhere in the handbook (`diagram-frame` / `fig-caption`), addressing a chapter that had zero visuals compared to other chapters:
  - **그림/Figure 13-1** — Process·Governance·Execution 세 그룹과 Graph의 관계도
  - **그림/Figure 13-2** — PM `phase` 축(공통) vs 도메인 `stage` 축(variant별 상이) 대비도
  - **그림/Figure 13-3** — Decision Gate(규칙 선언) ↔ Decision Record(실제 판정) 관계도
- An assembly-line analogy paragraph in §1, matching the more narrative teaching style used in other chapters (e.g. Ch.2's cooking analogy).

### Fixed
- Figure 13-1 connector lines: Process/Governance → Graph arrows now originate from each box's side edge (vertical mid-point) rather than an off-center bottom point, for a balanced, symmetric layout.

## [2026-09-20] — check-authoring §11 mid-word-strong cleanup

### Fixed
- **Appendix A/B/C** (`docs/appendix/A_Governance_Enforcement.html`, `B_Decision_System.html`, `C_Skill_Graph.html`) — 11 `check-authoring.ts` §11 warnings (`<strong>` wrapping only a 1–3 char Korean word-stem instead of the natural phrase, e.g. `<strong>강제</strong>한다`) fixed by expanding each `<strong>` span to cover the full natural phrase or word. `bun run check-authoring` now reports 0 warnings.

## [2026-09-20] — Ch.8 Architecture Deep-Dive: graft Fleet Integration & Universal Design Gate

### Added
- **Ch.8 Architecture Deep-Dive** (`docs/intro/08_Intro_Advanced_Architecture.html`, ko/en/ja/es) — two new sections closing a content-drift gap against `ai-workspace-standards` upstream, inserted between "Platform Parity" and "Execution Plan Templates":
  - **`graft — Repo Context Graph as a Multi-Platform Fleet Surface`** (`#graft-fleet-integration`) — what graft is, the per-host coverage gaps a 2026-09-12 fleet investigation found, and how **ADR-0076** closes them with a per-host MCP delivery matrix and policy-driven upgrade-engine delivery to the existing fleet.
  - **`Universal Design Gate — Making the Spec Gate Uniform Across L0–L3`** (`#universal-design-gate`) — distinguishes **ADR-0068** ("Universal Design," a design-review-method extension above WCAG/ADR-0065) from **ADR-0074** ("Universal Design Gate," the decision making the existing spec-check sync gate apply uniformly across every tier L0–L3), cross-referencing the existing Design Gate (Row 0) content rather than duplicating it.

## [2026-09-20] — New Chapter 13: Domain Operating Model & Capstone Renumbered to Ch.14

### Added
- **Chapter 13 · Domain Operating Model** (`docs/domain-model/13_DomainOperatingModel_Chapter.html`, ko/en/ja/es) — new narrative chapter covering the executable-SOP structure of variant templates per upstream **ADR-0083/0084**: the four core groups (Process · Governance · Execution · Graph), the domain stage axis (`process/stages.yaml`) vs the PM `phase` axis, RACI matrices (`governance/raci.yaml`), decision gates (`decisions/gates.yaml`) vs decision records (`DEC-*.md`), the Domain Execution Graph profile (`deg/v1`), the actor model / evidence backporting / graph delta log extensions, the governed vs core grade system (9 vs 4 variants), and validation commands. Wired into the chapter chain (12 → 13 → 14), index cards, search manifest, and nav sidebars.
- **Glossary terms** (ko/en/ja/es): Domain Operating Model (with the no-acronym rule), Domain Execution Graph, Stage Axis, RACI Matrix, Decision Gate.

### Changed
- **Capstone renumbered Ch.13 → Ch.14** (`git mv` of all 4 language files; titles, nav, eyebrows, SVG labels, lecture-guide schedule/instructor notes/quizzes, course overview blocks, topic table, README curriculum, search manifest, and every cross-reference updated).
- **Lecture guide & course overview** (all 4 languages): added Ch.13 schedule row (20-min lecture), instructor note, comprehension quiz, Day-2 schedule block, and topics-table row; Day-2 totals bumped to ≈6h (excl. breaks).
- Synced handbook facts with `ai-workspace-standards` main (2026-09-20): footer baseline date bumped to 2026-09-20; README Target Versions `ai-workspace-standards` main (2026-09); Ch.10 `--platform claude|antigravity|codex|all` (upstream rename of `both` → `all`, now covering all three platforms) with `CODEX.md` added to the MERGE examples; Ch.9 procedure-schema section notes the new domain stage axis with a link to Ch.13; Reference B (Decision System) cross-references `decisions/gates.yaml`.

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
