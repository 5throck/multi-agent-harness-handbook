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

/** Extract title tag content. */
export function extractTitle(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : "";
}

/** Extract h1 tag text content. */
export function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].trim() : "";
}

/** Parse the DOCS array from site-search.js. Returns { path, title }[]. */
export function parseDocsArray(jsContent: string): { path: string; title: string }[] {
  const entries: { path: string; title: string }[] = [];
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
