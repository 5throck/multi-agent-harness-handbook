// scripts/check-links.ts
// Check ①: Verify all internal a href targets resolve to existing files.

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
        // Allow links to _en.html / _ja.html files that don't exist yet
        if (/_en\.html$|_ja\.html$/.test(absPath)) continue;
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
