// scripts/check-symmetry.ts
// Check ②: If A's chapter-nav next → B, then B's chapter-nav prev → A.

import { findAllHtmlFiles, readFile, extractChapterNav, resolveHref, getDocsDir } from "./nav-utils.ts";
import { relative } from "node:path";

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
