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

  // Extract <div class="chapter-nav">...</div> block using depth-aware parsing
  // (simple regex can't handle nested divs reliably)
  const openIdx = html.indexOf('<div class="chapter-nav"');
  if (openIdx === -1) return result;

  // Find the end of the opening tag
  const tagEnd = html.indexOf('>', openIdx);
  if (tagEnd === -1) return result;

  let depth = 1;
  let pos = tagEnd + 1;
  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);
    if (nextClose === -1) break; // malformed
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Check it's a proper opening tag (not <divsomething without space or >)
      const charAfter = html[nextOpen + 4];
      if (charAfter === ' ' || charAfter === '>') {
        depth++;
        pos = nextOpen + 4;
        continue;
      }
    }
    depth--;
    pos = nextClose + 6; // length of '</div>'
  }

  const navHtml = html.slice(tagEnd + 1, pos - 6); // exclude the final </div>

  // Extract individual <a ...>...</a> tags from the nav block
  const aTagRe = /<a\s+href="([^"]*)"\s*((?:class="[^"]*")?\s*(?:style="[^"]*")?\s*)>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;

  while ((m = aTagRe.exec(navHtml)) !== null) {
    const href = m[1];
    const attrs = m[2] || "";
    const inner = m[3];

    // Extract class from attributes
    const classMatch = attrs.match(/class="([^"]*)"/);
    const cls = classMatch ? classMatch[1] : "";

    // Extract label: prefer <div class="ttl"> content, fall back to plain text
    const ttlMatch = inner.match(/<div\s+class="ttl">([\s\S]*?)<\/div>/);
    const label = ttlMatch ? ttlMatch[1].trim() : inner.trim();
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
