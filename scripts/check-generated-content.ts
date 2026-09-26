#!/usr/bin/env bun
// scripts/check-generated-content.ts
// L3 — Detects recurring defects from LLM-assisted content generation that
// earlier validators miss. Added after the 2026-09 meticulous review found
// all four defect classes below in published pages.
//
// Checks (per HTML page under docs/):
//   1. duplicated <td>  — a table row whose second cell repeats the first
//                         verbatim (broken "item | intent" generator).
//   2. raw backticks    — `...` spans in visible HTML (outside <pre>/<code>)
//                         that render literally instead of as <code>.
//   3. stray Hanja      — CJK ideographs inside Korean pages (Hangul prose
//                         should not contain 漢字; ja pages are exempt).
//   4. garbled quiz     — a self-check quiz whose <ol> items mix definition
//                         fragments with numbered checklist leftovers
//                         (heuristic: numbered item after an unnumbered one,
//                         or a colon-definition line inside a quiz <ol>).
//
// Usage:
//   bun run scripts/check-generated-content.ts --docs-dir docs
// Exit code 0 if clean, 1 otherwise.

import { findAllHtmlFiles, getDocsDir, configureDocsDir, readFile } from "./nav-utils.ts";
import { relative } from "node:path";


const docsDir = getDocsDir() ?? "docs";
const files = findAllHtmlFiles();

type Issue = { file: string; line: number; kind: string; detail: string };
const issues: Issue[] = [];

const lineOf = (text: string, idx: number) => text.slice(0, idx).split("\n").length;

for (const file of files) {
  const rel = relative(docsDir, file).replace(/\\/g, "/");
  const text = readFile(file);
  const isKo = !/_[a-z]{2}\.html$/.test(rel);

  // 1. duplicated <td> pairs: <td>X</td><td>X</td>
  //    Legitimate exceptions: placeholder cells ("—", "⚠️ …", empty) used as
  //    colspan workarounds in matrix tables (e.g. SETUP).
  for (const m of text.matchAll(/<td>([^<]+)<\/td><td>\1<\/td>/g)) {
    const cell = m[1].trim();
    if (!cell || cell === "—" || cell.startsWith("⚠")) continue;
    issues.push({ file: rel, line: lineOf(text, m.index ?? 0), kind: "duplicated-td", detail: m[1].slice(0, 60) });
  }

  // 2. raw backticks outside <pre>…</pre> and <code>…</code>
  const parts = text.split(/(<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/g);
  let offset = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const seg = parts[i];
    for (const m of seg.matchAll(/`([^`<]+)`/g)) {
      issues.push({ file: rel, line: lineOf(text, offset + (m.index ?? 0)), kind: "raw-backtick", detail: m[0].slice(0, 60) });
    }
    offset += seg.length + (parts[i + 1]?.length ?? 0);
  }

  // 3. stray Hanja in Korean pages (skip <pre>/<code>; CJK Unified Ideographs)
  if (isKo) {
    const partsKo = text.split(/(<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/g);
    let off = 0;
    for (let i = 0; i < partsKo.length; i += 2) {
      const seg = partsKo[i];
      for (const m of seg.matchAll(/[一-鿿㐀-䶿]+/g)) {
        issues.push({ file: rel, line: lineOf(text, off + (m.index ?? 0)), kind: "stray-hanja", detail: m[0] });
      }
      off += seg.length + (partsKo[i + 1]?.length ?? 0);
    }
  }

  // 4. garbled quiz: numbered item following an unnumbered item, or a
  //    "정의:" style fragment, inside a quiz <ol>
  for (const m of text.matchAll(/<div class="quiz">[\s\S]*?<\/ol><\/div>/g)) {
    const block = m[0];
    const items = [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1].replace(/<[^>]+>/g, "").trim());
    const numbered = (s: string) => /^\d+[.)]\s/.test(s);
    for (let i = 1; i < items.length; i++) {
      if (!numbered(items[i - 1]) && numbered(items[i])) {
        issues.push({ file: rel, line: lineOf(text, m.index ?? 0), kind: "garbled-quiz", detail: `numbered item after unnumbered: "${items[i].slice(0, 50)}"` });
        break;
      }
    }
  }
}

if (issues.length) {
  console.error(`❌ ${issues.length} generated-content issue(s) found:\n`);
  for (const it of issues) console.error(`  ${it.file}:${it.line} [${it.kind}] ${it.detail}`);
  process.exit(1);
} else {
  console.log("check-generated-content: OK -- no duplicated cells, raw backticks, stray Hanja, or garbled quizzes.");
}
