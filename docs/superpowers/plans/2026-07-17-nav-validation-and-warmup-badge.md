# Navigation Validation Script & Warmup Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automated navigation validation (broken links, prev/next symmetry, label↔target match, search index sync) running in CI on every PR, and add a "required" badge to the warmup card in index.html.

**Architecture:** A Bun-based TypeScript script (`scripts/validate-nav.ts`) parses all HTML files in `docs/`, extracts `<a>` links from `chapter-nav` blocks, and runs four validation checks. A GitHub Actions workflow runs this script on PRs. The warmup badge change is a single CSS class addition to `index.html`.

**Tech Stack:** Bun runtime, TypeScript (no external deps — use Bun's built-in `DOMParser`-equivalent via regex-based HTML parsing), GitHub Actions.

---

## File Map

| File | Responsibility | Action |
|------|----------------|--------|
| `scripts/validate-nav.ts` | Main entry — orchestrates all 4 checks, reports results | Create |
| `scripts/nav-utils.ts` | HTML parsing helpers (read files, extract links, parse DOCS array) | Create |
| `scripts/check-links.ts` | Check ①: broken links (all `<a href>` targets exist on disk) | Create |
| `scripts/check-symmetry.ts` | Check ②: prev/next reciprocity (A→next→B ⟹ B→prev→A) | Create |
| `scripts/check-labels.ts` | Check ③: label text matches target file's `<title>` or `<h1>` | Create |
| `scripts/check-search.ts` | Check ④: `site-search.js` DOCS array ↔ actual files consistency | Create |
| `.github/workflows/validate-nav.yml` | CI workflow — runs `validate-nav.ts` on PRs | Create |
| `docs/index.html` | Warmup card — add `필수` badge | Modify line ~238 |
| `AUTHORING_GUIDELINES.md` | Update §21-4 to reference the new script (no longer "could be") | Modify line ~735 |

---

## Task 1: Project scaffolding — bun init + lockfile

**Files:**
- Create: `package.json`

- [ ] **Step 1: Initialize package.json with bun**

Run:
```bash
cd /c/git/ai_workspace/Handbooks/multi-agent-harness-handbook
bun init -y
```

This creates a minimal `package.json`. No dependencies needed — Bun's stdlib is sufficient.

- [ ] **Step 2: Add `"type": "module"` to package.json**

The generated `package.json` from `bun init` should already have `"type": "module"`. Verify:

Run: `cat package.json`
Expected: `"type": "module"` present.

- [ ] **Step 3: Add validate-nav script entry to package.json**

Add to `package.json`:
```json
{
  "scripts": {
    "validate-nav": "bun run scripts/validate-nav.ts"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add package.json with bun and validate-nav script"
```

---

## Task 2: HTML parsing utilities (`scripts/nav-utils.ts`)

**Files:**
- Create: `scripts/nav-utils.ts`

- [ ] **Step 1: Write nav-utils.ts**

```typescript
// scripts/nav-utils.ts
// HTML parsing helpers for navigation validation — zero external deps.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const DOCS_DIR = join(import.meta.dirname || ".", "..", "docs");

/** Find all .html files under docs/ (recursively), returning absolute paths. */
export function findAllHtmlFiles(): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) results.push(full);
    }
  }
  walk(DOCS_DIR);
  return results;
}

/** Read file as UTF-8 string. */
export function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

/** Resolve a relative href from a source HTML file to an absolute disk path. */
export function resolveHref(fromFile: string, href: string): string | null {
  // Skip external links, anchors, mailto, etc.
  if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) return null;
  const dir = dirname(fromFile);
  let resolved = join(dir, href);
  // Normalize: remove query string, hash
  resolved = resolved.split("?")[0].split("#")[0];
  return resolved;
}

/** Extract the chapter-nav links from an HTML string.
 *  Returns { prev?: { href, label }, next?: { href, label }, others: { href, label }[] }
 */
export function extractChapterNav(html: string): {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
  others: { href: string; label: string }[];
} {
  const result: { prev?: { href: string; label: string }; next?: { href: string; label: string }; others: { href: string; label: string }[] } = { others: [] };

  // Match <div class="chapter-nav">...</div> block
  const navMatch = html.match(/<div\s+class="chapter-nav"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  if (!navMatch) return result;

  const navHtml = navMatch[1];

  // Match all <a href="..." class="prev|next|..."> blocks
  const linkRe = /<a\s+href="([^"]*)"\s*(?:class="([^"]*)")?\s*(?:style="[^"]*")?\s*>[\s\S]*?<div\s+class="ttl">(.*?)<\/div>[\s\S]*?<\/a>/g;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(navHtml)) !== null) {
    const href = m[1];
    const cls = m[2] || "";
    const label = m[3].trim();
    const entry = { href, label };

    if (cls.includes("prev")) result.prev = entry;
    else if (cls.includes("next")) result.next = entry;
    else result.others.push(entry);
  }

  return result;
}

/** Extract ALL <a href="..."> targets from an HTML string (for broken link check). */
export function extractAllLinks(html: string): { href: string; context: string }[] {
  const results: { href: string; context: string }[] = [];
  const re = /<a\s+(?:[^>]*?\s)?href="([^"]*)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push({ href: m[1], context: m[0].slice(0, 120) });
  }
  return results;
}

/** Extract <title> tag content. */
export function extractTitle(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : "";
}

/** Extract <h1> tag text content. */
export function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].trim() : "";
}

/** Parse the DOCS array from site-search.js. Returns { path, title }[]. */
export function parseDocsArray(jsContent: string): { path: string; title: string }[] {
  const entries: { path: string; title: string }[] = [];
  // Match: { path: '...', title: '...' }
  const re = /\{\s*path:\s*'([^']*)'\s*,\s*title:\s*'([^']*)'\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(jsContent)) !== null) {
    entries.push({ path: m[1], title: m[2] });
  }
  return entries;
}

/** Check if an absolute file path exists on disk. */
export function fileExists(absPath: string): boolean {
  return existsSync(absPath);
}

/** Get the docs directory path. */
export function getDocsDir(): string {
  return DOCS_DIR;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/nav-utils.ts
git commit -m "feat: add HTML parsing utilities for nav validation"
```

---

## Task 3: Check ① — Broken links (`scripts/check-links.ts`)

**Files:**
- Create: `scripts/check-links.ts`

- [ ] **Step 1: Write check-links.ts**

```typescript
// scripts/check-links.ts
// Check ①: Verify all internal <a href> targets resolve to existing files.

import { findAllHtmlFiles, readFile, resolveHref, fileExists, getDocsDir } from "./nav-utils.ts";
import { relative } from "node:path";

export interface LinkError {
  file: string;
  href: string;
  resolved: string;
}

export function checkBrokenLinks(): LinkError[] {
  const errors: LinkError[] = [];
  const htmlFiles = findAllHtmlFiles();

  for (const filePath of htmlFiles) {
    const html = readFile(filePath);
    const linkRe = /<a\s+(?:[^>]*?\s)?href="([^"]*)"[^>]*>/g;
    let m: RegExpExecArray | null;

    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1];
      const absPath = resolveHref(filePath, href);
      if (absPath === null) continue; // external, anchor, etc.

      if (!fileExists(absPath)) {
        errors.push({
          file: relative(getDocsDir(), filePath),
          href,
          resolved: relative(getDocsDir(), absPath),
        });
      }
    }
  }

  return errors;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/check-links.ts
git commit -m "feat: add broken link check (validation 1/4)"
```

---

## Task 4: Check ② — prev/next symmetry (`scripts/check-symmetry.ts`)

**Files:**
- Create: `scripts/check-symmetry.ts`

- [ ] **Step 1: Write check-symmetry.ts**

```typescript
// scripts/check-symmetry.ts
// Check ②: If A's chapter-nav next → B, then B's chapter-nav prev → A.

import { findAllHtmlFiles, readFile, extractChapterNav, resolveHref, getDocsDir } from "./nav-utils.ts";
import { relative, basename } from "node:path";

export interface SymmetryError {
  type: "missing-back-link" | "mismatch" | "orphan-prev" | "orphan-next";
  fileA: string;
  fileB: string;
  detail: string;
}

export function checkSymmetry(): SymmetryError[] {
  const errors: SymmetryError[] = [];
  const htmlFiles = findAllHtmlFiles();
  const docsDir = getDocsDir();

  // Build map: absPath → { prev?, next? }
  const navMap = new Map<string, ReturnType<typeof extractChapterNav>>();
  for (const filePath of htmlFiles) {
    const html = readFile(filePath);
    navMap.set(filePath, extractChapterNav(html));
  }

  for (const [filePath, nav] of navMap) {
    const relFile = relative(docsDir, filePath);

    // Check: if this file has a "next" link, the target should have a "prev" pointing back
    if (nav.next) {
      const nextAbs = resolveHref(filePath, nav.next.href);
      if (nextAbs) {
        const targetNav = navMap.get(nextAbs);
        if (!targetNav) {
          errors.push({
            type: "missing-back-link",
            fileA: relFile,
            fileB: nav.next.href,
            detail: `next → ${nav.next.href} but target file not found in docs/`,
          });
        } else if (!targetNav.prev) {
          errors.push({
            type: "missing-back-link",
            fileA: relFile,
            fileB: relative(docsDir, nextAbs),
            detail: `next → ${relative(docsDir, nextAbs)} but target has no prev link`,
          });
        } else {
          // Verify prev points back to this file
          const prevAbs = resolveHref(nextAbs, targetNav.prev.href);
          if (prevAbs !== filePath) {
            errors.push({
              type: "mismatch",
              fileA: relFile,
              fileB: relative(docsDir, nextAbs),
              detail: `next → ${relative(docsDir, nextAbs)} but that file's prev → ${targetNav.prev.href} (not back to ${relFile})`,
            });
          }
        }
      }
    }

    // Check: if this file has a "prev" link, the target should have a "next" pointing back
    if (nav.prev) {
      const prevAbs = resolveHref(filePath, nav.prev.href);
      if (prevAbs) {
        const targetNav = navMap.get(prevAbs);
        if (!targetNav) {
          errors.push({
            type: "missing-back-link",
            fileA: relFile,
            fileB: nav.prev.href,
            detail: `prev → ${nav.prev.href} but target file not found in docs/`,
          });
        } else if (!targetNav.next) {
          // First chapter (01) has no prev — that's expected.
          // Sub-files like 06 §1 → 06 §2 (next to examples) is valid.
          // But if a chapter-level file has no next, flag only if it's not the last chapter.
          const targetRel = relative(docsDir, prevAbs);
          if (!targetRel.includes("13_Capstone")) {
            errors.push({
              type: "orphan-next",
              fileA: relFile,
              fileB: targetRel,
              detail: `prev → ${targetRel} but that file has no next link`,
            });
          }
        } else {
          const nextAbs = resolveHref(prevAbs, targetNav.next.href);
          if (nextAbs !== filePath) {
            errors.push({
              type: "mismatch",
              fileA: relFile,
              fileB: relative(docsDir, prevAbs),
              detail: `prev → ${relative(docsDir, prevAbs)} but that file's next → ${targetNav.next.href} (not back to ${relFile})`,
            });
          }
        }
      }
    }
  }

  return errors;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/check-symmetry.ts
git commit -m "feat: add prev/next symmetry check (validation 2/4)"
```

---

## Task 5: Check ③ — Label ↔ target match (`scripts/check-labels.ts`)

**Files:**
- Create: `scripts/check-labels.ts`

- [ ] **Step 1: Write check-labels.ts**

```typescript
// scripts/check-labels.ts
// Check ③: chapter-nav link labels should match the target file's <title> or <h1>.

import { findAllHtmlFiles, readFile, extractChapterNav, resolveHref, extractTitle, extractH1, getDocsDir } from "./nav-utils.ts";
import { relative } from "node:path";

export interface LabelError {
  file: string;
  linkType: "prev" | "next" | "other";
  href: string;
  label: string;
  targetTitle: string;
  targetH1: string;
}

/** Normalize text for comparison: collapse whitespace, strip common prefixes/suffixes. */
function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Extract chapter number from a label (e.g. "3장" or "8장 §1" or "12장"). */
function extractChapterNum(s: string): string | null {
  const m = s.match(/(\d+)\s*장/);
  return m ? m[1] : null;
}

export function checkLabels(): LabelError[] {
  const errors: LabelError[] = [];
  const htmlFiles = findAllHtmlFiles();
  const docsDir = getDocsDir();

  // Pre-load all titles/h1s
  const fileMeta = new Map<string, { title: string; h1: string }>();
  for (const filePath of htmlFiles) {
    const html = readFile(filePath);
    fileMeta.set(filePath, { title: extractTitle(html), h1: extractH1(html) });
  }

  for (const filePath of htmlFiles) {
    const html = readFile(filePath);
    const nav = extractChapterNav(html);
    const relFile = relative(docsDir, filePath);

    const links: { type: "prev" | "next" | "other"; entry: { href: string; label: string } }[] = [];
    if (nav.prev) links.push({ type: "prev", entry: nav.prev });
    if (nav.next) links.push({ type: "next", entry: nav.next });
    for (const o of nav.others) links.push({ type: "other", entry: o });

    for (const { type, entry } of links) {
      const absTarget = resolveHref(filePath, entry.href);
      if (!absTarget) continue; // skip external
      const meta = fileMeta.get(absTarget);
      if (!meta) continue; // skip if target not found (broken link catches this)

      // Compare chapter numbers if present in both label and title
      const labelNum = extractChapterNum(entry.label);
      const titleNum = extractChapterNum(meta.title);

      if (labelNum && titleNum && labelNum !== titleNum) {
        errors.push({
          file: relFile,
          linkType: type,
          href: entry.href,
          label: entry.label,
          targetTitle: meta.title,
          targetH1: meta.h1,
        });
      }
    }
  }

  return errors;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/check-labels.ts
git commit -m "feat: add label↔target match check (validation 3/4)"
```

---

## Task 6: Check ④ — Search index sync (`scripts/check-search.ts`)

**Files:**
- Create: `scripts/check-search.ts`

- [ ] **Step 1: Write check-search.ts**

```typescript
// scripts/check-search.ts
// Check ④: site-search.js DOCS array must contain all HTML files in docs/,
// and every DOCS entry must point to an existing file.

import { findAllHtmlFiles, readFile, parseDocsArray, fileExists, getDocsDir, join } from "./nav-utils.ts";
import { relative, normalize } from "node:path";

export interface SearchIndexError {
  type: "missing-from-docs" | "missing-file" | "extra-in-docs";
  path: string;
  detail: string;
}

export function checkSearchIndex(): SearchIndexError[] {
  const errors: SearchIndexError[] = [];
  const docsDir = getDocsDir();

  // Read site-search.js
  const searchJsPath = join(docsDir, "assets", "site-search.js");
  const searchJs = readFile(searchJsPath);
  const docsEntries = parseDocsArray(searchJs);

  // Get all actual HTML files (relative to docs/)
  const actualFiles = new Set(
    findAllHtmlFiles().map((f) => relative(docsDir, f).replace(/\\/g, "/"))
  );

  // Build set of DOCS paths (relative to docs/)
  const docsPaths = new Set(docsEntries.map((d) => d.path.replace(/\\/g, "/")));

  // Check: every DOCS entry points to an existing file
  for (const entry of docsEntries) {
    if (!actualFiles.has(entry.path)) {
      errors.push({
        type: "missing-file",
        path: entry.path,
        detail: `DOCS array references "${entry.path}" but file does not exist`,
      });
    }
  }

  // Check: every HTML file (except index.html and assets/) is in DOCS
  for (const file of actualFiles) {
    // Skip: index.html, assets/ (JS files only, no HTML there currently)
    if (file === "index.html") continue;
    if (file.startsWith("assets/")) continue;

    if (!docsPaths.has(file)) {
      errors.push({
        type: "missing-from-docs",
        path: file,
        detail: `File "${file}" exists but is missing from DOCS array in site-search.js`,
      });
    }
  }

  return errors;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/check-search.ts
git commit -m "feat: add search index sync check (validation 4/4)"
```

---

## Task 7: Main orchestrator (`scripts/validate-nav.ts`)

**Files:**
- Create: `scripts/validate-nav.ts`

- [ ] **Step 1: Write validate-nav.ts**

```typescript
#!/usr/bin/env bun
// scripts/validate-nav.ts
// Navigation integrity validator — runs all 4 checks and exits with code 1 on failure.

import { checkBrokenLinks, type LinkError } from "./check-links.ts";
import { checkSymmetry, type SymmetryError } from "./check-symmetry.ts";
import { checkLabels, type LabelError } from "./check-labels.ts";
import { checkSearchIndex, type SearchIndexError } from "./check-search.ts";

const CHECKS: { name: string; run: () => { errors: object[] } }[] = [
  { name: "① Broken links", run: () => ({ errors: checkBrokenLinks() }) },
  { name: "② prev/next symmetry", run: () => ({ errors: checkSymmetry() }) },
  { name: "③ Label ↔ target match", run: () => ({ errors: checkLabels() }) },
  { name: "④ site-search DOCS sync", run: () => ({ errors: checkSearchIndex() }) },
];

let totalErrors = 0;

for (const check of CHECKS) {
  console.log(`\n--- ${check.name} ---`);
  const { errors } = check.run();

  if (errors.length === 0) {
    console.log("✅ PASS — no issues found");
  } else {
    console.log(`❌ FAIL — ${errors.length} issue(s):`);
    for (const err of errors) {
      const e = err as Record<string, string>;
      console.log(`  • ${e.file || e.path || ""} ${e.href || ""}: ${e.detail || e.type || JSON.stringify(err)}`);
    }
    totalErrors += errors.length;
  }
}

console.log(`\n${totalErrors === 0 ? "✅ All checks passed!" : `❌ ${totalErrors} issue(s) found`}`);
process.exit(totalErrors > 0 ? 1 : 0);
```

- [ ] **Step 2: Run the script to verify it works**

Run:
```bash
cd /c/git/ai_workspace/Handbooks/multi-agent-harness-handbook
bun run scripts/validate-nav.ts
```

Expected: All 4 checks pass (the repo was just fixed in PRs #31-33). Exit code 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-nav.ts
git commit -m "feat: add validate-nav orchestrator with all 4 checks"
```

---

## Task 8: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/validate-nav.yml`

- [ ] **Step 1: Create workflow directory**

```bash
mkdir -p /c/git/ai_workspace/Handbooks/multi-agent-harness-handbook/.github/workflows
```

- [ ] **Step 2: Write workflow file**

```yaml
# .github/workflows/validate-nav.yml
name: Validate Navigation
on:
  pull_request:
    branches: [main]
    paths:
      - 'docs/**'
      - 'scripts/**'

jobs:
  validate-nav:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun run scripts/validate-nav.ts
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate-nav.yml
git commit -m "ci: add PR navigation validation workflow"
```

---

## Task 9: Warmup required badge in index.html

**Files:**
- Modify: `docs/index.html` (line 238 area)

- [ ] **Step 1: Add `필수` badge next to `워밍업` tag**

Change line 238 in `docs/index.html` from:
```html
          <span class="tag tag-ex">워밍업</span>
```
to:
```html
          <span class="tag tag-ex">워밍업</span> <span class="tag" style="background:#fff3cd;color:#856404;border:1px solid #ffc107;">필수</span>
```

This uses an inline style for the required badge (amber/yellow) consistent with the existing tag styling system, without needing to add a new CSS class to all 31 HTML files. If a CSS class is preferred later, it can be extracted to a shared stylesheet.

- [ ] **Step 2: Verify the change visually**

Open `docs/index.html` in a browser and confirm the warmup card shows both "워밍업" (green) and "필수" (amber) badges.

- [ ] **Step 3: Run validation to confirm no regressions**

```bash
bun run scripts/validate-nav.ts
```

Expected: All checks still pass.

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "docs: add required badge to warmup card in index.html"
```

---

## Task 10: Update AUTHORING_GUIDELINES.md §21-4

**Files:**
- Modify: `AUTHORING_GUIDELINES.md` (line ~735 area)

- [ ] **Step 1: Update the recommendation text in §21-4**

Change the text around line 735 from recommending `scripts/validate-nav.ts` as a future addition to stating it exists and how to run it.

Replace (approximate — verify exact text in file):
```
- `scripts/validate-nav.ts` 같은 자동 검증 스크립트 도입도 권장 사항으로 명시
```
or similar "could be added" language with:
```
- `scripts/validate-nav.ts` 자동 검증 스크립트로 위 네 가지를 CI에서 자동 검증함 (`bun run scripts/validate-nav.ts`).
```

- [ ] **Step 2: Verify no other stale references to the script as "planned"**

Search for any other mention of `validate-nav` in the guidelines and update if found.

```bash
grep -n "validate-nav" AUTHORING_GUIDELINES.md
```

- [ ] **Step 3: Commit**

```bash
git add AUTHORING_GUIDELINES.md
git commit -m "docs: update §21-4 to reference existing validate-nav script"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full validation**

```bash
bun run scripts/validate-nav.ts
```

Expected: All 4 checks pass, exit code 0.

- [ ] **Step 2: Verify index.html renders correctly**

Open `docs/index.html` in browser — confirm warmup card has both "워밍업" and "필수" badges.

- [ ] **Step 3: Verify CI workflow syntax**

```bash
# Optional: if actionlint is available
actionlint .github/workflows/validate-nav.yml
```
