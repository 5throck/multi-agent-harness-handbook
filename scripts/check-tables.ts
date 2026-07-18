// scripts/check-tables.ts
// Enforces the "TABLE COLUMN-SIZING POLICY" documented in
// docs/assets/css/handbook-components.css (search for that heading).
// Hand-tuned per-table column ratios are forbidden:
//   1. No <colgroup> / <col style="width:..."> markup in docs/**/*.html
//   2. No per-table `col.col-*` percentage width rules in the CSS
//   3. No `white-space: nowrap` on a table's first `td` column — that
//      column routinely holds translatable prose (chapter labels, task
//      names), and nowrap forces auto layout to size it to whichever
//      locale's longest untranslated value, starving every other column.
//   4. No `max-width` on a table-column rule without an accompanying
//      `width` — max-width alone gives auto layout no real target and
//      collapses the column to its single-word min-content instead.

import { findAllHtmlFiles, readFile, getDocsDir } from "./nav-utils.ts";
import { relative, join } from "node:path";

export interface TableError {
  file: string;
  line: number;
  rule: "inline-colgroup" | "inline-col-width" | "css-col-percentage" | "nowrap-first-column" | "max-width-without-width";
  snippet: string;
}

interface CssRule {
  selector: string;
  body: string;
  startLine: number;
}

function parseCssRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(ruleRegex)) {
    const selector = match[1].trim();
    const body = match[2];
    const startLine = css.slice(0, match.index).split("\n").length;
    rules.push({ selector, body, startLine });
  }
  return rules;
}

export function checkTables(): TableError[] {
  const errors: TableError[] = [];
  const docsDir = getDocsDir();

  for (const filePath of findAllHtmlFiles()) {
    const html = readFile(filePath);
    const relFile = relative(docsDir, filePath);
    const lines = html.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/<colgroup[\s>]/.test(line)) {
        errors.push({ file: relFile, line: i + 1, rule: "inline-colgroup", snippet: line.trim().slice(0, 120) });
      } else if (/<col\s[^>]*style\s*=/.test(line)) {
        errors.push({ file: relFile, line: i + 1, rule: "inline-col-width", snippet: line.trim().slice(0, 120) });
      }
    }
  }

  const cssRelPath = "assets/css/handbook-components.css";
  const cssPath = join(docsDir, "assets", "css", "handbook-components.css");
  const css = readFile(cssPath);
  const cssLines = css.split("\n");

  for (let i = 0; i < cssLines.length; i++) {
    if (/col\.col-[\w-]+\s*\{[^}]*width\s*:\s*\d+%/.test(cssLines[i])) {
      errors.push({ file: cssRelPath, line: i + 1, rule: "css-col-percentage", snippet: cssLines[i].trim().slice(0, 120) });
    }
  }

  for (const rule of parseCssRules(css)) {
    const selectors = rule.selector.split(",").map((s) => s.trim());
    const isTableContext = selectors.some((s) => /\btable\b|\.table-|[\s>.]t[dh]\b/.test(s));
    if (!isTableContext) continue;

    const targetsFirstColumnTd = selectors.some(
      (s) => /\btd\b/.test(s) && /:nth-child\(\s*1\s*\)|:first-child/.test(s)
    );
    if (targetsFirstColumnTd && /white-space\s*:\s*nowrap/.test(rule.body)) {
      errors.push({
        file: cssRelPath,
        line: rule.startLine,
        rule: "nowrap-first-column",
        snippet: `${rule.selector} { ${rule.body.trim().slice(0, 80)} }`,
      });
    }

    if (/max-width\s*:/.test(rule.body) && !/(?<!-)width\s*:/.test(rule.body)) {
      errors.push({
        file: cssRelPath,
        line: rule.startLine,
        rule: "max-width-without-width",
        snippet: `${rule.selector} { ${rule.body.trim().slice(0, 80)} }`,
      });
    }
  }

  return errors;
}

if (import.meta.main) {
  const errors = checkTables();
  if (errors.length === 0) {
    console.log("check-tables: OK — no hand-tuned table column ratios found.");
  } else {
    console.error(`check-tables: ${errors.length} violation(s) of the table column-sizing policy:`);
    for (const e of errors) {
      console.error(`  ${e.file}:${e.line} [${e.rule}] ${e.snippet}`);
    }
    console.error(
      "Fix: remove inline colgroup/col widths; never nowrap a table's first (translatable) column; " +
        "pair max-width with a real width. See the TABLE COLUMN-SIZING POLICY comment in handbook-components.css."
    );
    process.exit(1);
  }
}
