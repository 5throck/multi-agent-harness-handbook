// scripts/check-search.ts
// Check ④: site-search.js DOCS array must contain all HTML files in docs/,
// and every DOCS entry must point to an existing file.

import { findAllHtmlFiles, readFile, parseDocsArray, fileExists, getDocsDir } from "./nav-utils.ts";
import { relative, join } from "node:path";

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
