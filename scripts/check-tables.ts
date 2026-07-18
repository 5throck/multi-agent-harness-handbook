// scripts/check-tables.ts
// Check: table layout policy — default is `table-layout: auto` (content-driven).
// Hand-tuned per-table column ratios are forbidden:
//   1. No <colgroup> / <col style="width:..."> markup in docs/**/*.html
//   2. No per-table `col.col-*` percentage width rules in the CSS
// Width hints must use the shared semantic utilities (col.w-narrow / col.w-label)
// in docs/assets/css/handbook-components.css.

import { findAllHtmlFiles, readFile, getDocsDir } from "./nav-utils.ts";
import { relative, join } from "node:path";

export interface TableError {
  file: string;
  line: number;
  rule: "inline-colgroup" | "inline-col-width" | "css-col-percentage";
  snippet: string;
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

  const cssPath = join(docsDir, "assets", "css", "handbook-components.css");
  const css = readFile(cssPath);
  const cssLines = css.split("\n");
  for (let i = 0; i < cssLines.length; i++) {
    if (/col\.col-[\w-]+\s*\{[^}]*width\s*:\s*\d+%/.test(cssLines[i])) {
      errors.push({ file: "assets/css/handbook-components.css", line: i + 1, rule: "css-col-percentage", snippet: cssLines[i].trim().slice(0, 120) });
    }
  }

  return errors;
}

if (import.meta.main) {
  const errors = checkTables();
  if (errors.length === 0) {
    console.log("check-tables: OK — no hand-tuned table column ratios found.");
  } else {
    console.error(`check-tables: ${errors.length} violation(s) of the auto table-layout policy:`);
    for (const e of errors) {
      console.error(`  ${e.file}:${e.line} [${e.rule}] ${e.snippet}`);
    }
    console.error("Fix: remove inline colgroup/col widths; use col.w-narrow / col.w-label utilities or plain auto layout.");
    process.exit(1);
  }
}
